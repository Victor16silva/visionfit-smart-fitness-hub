"""Execute: python server.py. Requer somente Python 3.10 ou posterior."""
import argparse
from collections import defaultdict, deque
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import mimetypes
import os
from pathlib import Path
import sqlite3
import socket
import threading
import time
import traceback
from urllib.parse import urlsplit, parse_qs, unquote
from backend import db
from backend.api import APIError, auth_dispatch, dispatch, require

ROOT=Path(__file__).resolve().parent

class Handler(BaseHTTPRequestHandler):
    server_version='ATHEV/1.0'
    cookie=None

    def log_message(self, fmt, *args):
        # Do not log request bodies, query strings, credentials or access tokens.
        if args and str(args[0]).startswith('GET /assets/'):
            return
        print(time.strftime('%H:%M:%S'),self.command,urlsplit(self.path).path,args[1] if len(args)>1 else '',flush=True)

    def headers_common(self):
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('X-Frame-Options','DENY')
        self.send_header('Referrer-Policy','no-referrer')
        self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'")
        self.send_header('Permissions-Policy','camera=(), microphone=(), geolocation=()')

    def respond(self,result,status=200):
        payload=json.dumps(result,ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.headers_common()
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length',str(len(payload)))
        self.send_header('Cache-Control','no-store')
        if self.cookie:
            self.send_header('Set-Cookie',self.cookie)
        self.end_headers()
        self.wfile.write(payload)

    def throttle(self,category,limit,window):
        key=(self.client_address[0],category)
        with self.server.limit_lock:
            queue=self.server.limits[key]
            t=time.time()
            while queue and queue[0]<t-window:
                queue.popleft()
            require(len(queue)<limit,'Muitas tentativas. Aguarde um pouco e tente novamente.',429)
            queue.append(t)

    def handle_api(self):
        conn=db.connect()
        self.cookie=None
        try:
            expected=self.headers.get('Host','')
            require(expected in self.server.allowed_hosts,'Host não autorizado.',403)
            origin=self.headers.get('Origin')
            if origin:
                require(origin in {'http://'+h for h in self.server.allowed_hosts},'Origem não autorizada.',403)
            self.throttle('api',600,60)
            method=self.command
            path=urlsplit(self.path).path
            q={k:v[0] for k,v in parse_qs(urlsplit(self.path).query).items()}
            data={}
            if method!='GET':
                require(self.headers.get('Content-Type','').split(';')[0]=='application/json','Envie JSON.',415)
                try:
                    length=int(self.headers.get('Content-Length','0'))
                except ValueError:
                    raise APIError('Tamanho inválido.')
                require(0<length<=1_300_000,'Corpo da solicitação muito grande ou vazio.',413)
                try:
                    data=json.loads(self.rfile.read(length))
                except (ValueError,UnicodeDecodeError):
                    raise APIError('JSON inválido.')
                require(isinstance(data,dict),'Envie um objeto JSON.')
            # Serialization protects reservation capacity, single-use QR and workout finalization.
            conn.execute('BEGIN IMMEDIATE')
            if path in ['/api/login','/api/register','/api/recover'] and method=='POST':
                result=auth_dispatch(conn,path,data,self)
            else:
                cookies=SimpleCookie()
                try:
                    cookies.load(self.headers.get('Cookie',''))
                except Exception:
                    raise APIError('Sessão inválida.',401)
                token=cookies.get('athev_session')
                self.auth=db.one(conn,'SELECT * FROM auth_sessions WHERE token_hash=? AND expires_at>?',(db.digest(token.value if token else ''),time.time()))
                require(self.auth,'Faça login para continuar.',401)
                u=db.one(conn,'SELECT id,name,email,role,active FROM users WHERE id=?',(self.auth['user_id'],))
                require(u and u['active'],'Conta indisponível.',401)
                if method!='GET':
                    import hmac
                    require(hmac.compare_digest(self.headers.get('X-CSRF-Token',''),self.auth['csrf']),'Sua sessão mudou. Atualize a página.',403)
                result=dispatch(conn,method,path,q,data,u,self)
            conn.commit()
            self.respond(result)
        except APIError as e:
            conn.rollback()
            self.respond(dict(error=e.message),e.status)
        except sqlite3.IntegrityError:
            conn.rollback()
            self.respond(dict(error='Este registro já existe ou está vinculado a outros dados.'),409)
        except Exception:
            conn.rollback()
            traceback.print_exc()
            self.respond(dict(error='Não foi possível concluir. Seus dados anteriores foram preservados.'),500)
        finally:
            conn.close()

    def do_GET(self):
        path=urlsplit(self.path).path
        if path.startswith('/api/'):
            self.handle_api()
            return
        raw=unquote(path).lstrip('/') or 'index.html'
        file=(ROOT/raw).resolve()
        relative=file.relative_to(ROOT).as_posix() if file.is_relative_to(ROOT) else ''
        permitted=relative=='index.html' or relative.startswith(('css/','js/','assets/'))
        if not permitted or not file.is_file():
            self.send_error(404)
            return
        payload=file.read_bytes()
        self.send_response(200)
        self.headers_common()
        kind=mimetypes.guess_type(file.name)[0] or 'application/octet-stream'
        if file.suffix=='.js':
            kind='text/javascript'
        self.send_header('Content-Type',kind+('; charset=utf-8' if kind.startswith('text/') else ''))
        self.send_header('Content-Length',str(len(payload)))
        self.send_header('Cache-Control','no-cache')
        self.end_headers()
        self.wfile.write(payload)

    def do_POST(self): self.handle_api()
    def do_PUT(self): self.handle_api()
    def do_DELETE(self): self.handle_api()

def main():
    parser=argparse.ArgumentParser(description='Servidor local ATHEV')
    parser.add_argument('--port',type=int,default=8000)
    parser.add_argument('--host',choices=['127.0.0.1','0.0.0.0'],default='127.0.0.1',help='0.0.0.0 permite teste no celular pela mesma rede Wi-Fi')
    args=parser.parse_args()
    db.initialize()
    server=ThreadingHTTPServer((args.host,args.port),Handler)
    server.allowed_hosts={f'127.0.0.1:{args.port}',f'localhost:{args.port}'}
    if args.host=='0.0.0.0':
        local_ips={info[4][0] for info in socket.getaddrinfo(socket.gethostname(),None,socket.AF_INET)}
        server.allowed_hosts.update(f'{ip}:{args.port}' for ip in local_ips)
        for ip in sorted(local_ips):
            if not ip.startswith('127.'):
                print(f'No celular, na mesma rede Wi-Fi: http://{ip}:{args.port}',flush=True)
    server.limits=defaultdict(deque)
    server.limit_lock=threading.Lock()
    server.dummy_hash=db.hash_password('invalid-account-password')
    print(f'ATHEV pronto em http://127.0.0.1:{args.port}',flush=True)
    print('Ctrl+C para encerrar. Dados salvos em data/athev.db.',flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__=='__main__':
    main()
