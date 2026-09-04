"""Testes de integração usando banco isolado, sem alterar os dados do aplicativo."""
import base64
from collections import defaultdict,deque
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timedelta,date
import http.client
import json
from pathlib import Path
import sqlite3
import sys
import tempfile
import threading
import time
import unittest

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from backend import db
from server import Handler,ThreadingHTTPServer

class Client:
    def __init__(self,port):self.port,self.cookie,self.csrf=port,'',''
    def call(self,method,path,data=None,csrf=True,origin=None):
        c=http.client.HTTPConnection('127.0.0.1',self.port,timeout=20)
        headers={'Cookie':self.cookie}
        if data is not None:headers['Content-Type']='application/json'
        if csrf:headers['X-CSRF-Token']=self.csrf
        if origin:headers['Origin']=origin
        c.request(method,path,json.dumps(data) if data is not None else None,headers)
        r=c.getresponse();payload=r.read();cookie=r.getheader('Set-Cookie')
        if cookie:self.cookie=cookie.split(';')[0]
        try:result=json.loads(payload)
        except ValueError:result=payload.decode(errors='replace')
        status=r.status;c.close();return status,result
    def login(self,email,password='Athev@123'):
        status,r=self.call('POST','/api/login',dict(email=email,password=password,remember=True))
        assert status==200,(status,r)
        self.csrf=r['csrf'];return r
    def ok(self,method,path,data=None):
        status,r=self.call(method,path,data)
        assert status==200,(method,path,status,r)
        return r

class Integration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp=tempfile.TemporaryDirectory(prefix='.tmp-',dir=ROOT/'tests')
        cls.temp_path=Path(cls.tmp.name).resolve()
        assert cls.temp_path.is_relative_to((ROOT/'tests').resolve())
        db.DB_PATH=cls.temp_path/'test.db';db.initialize()
        class Quiet(Handler):
            def log_message(self,*args):pass
        cls.server=ThreadingHTTPServer(('127.0.0.1',0),Quiet)
        cls.port=cls.server.server_address[1]
        cls.server.allowed_hosts={f'127.0.0.1:{cls.port}',f'localhost:{cls.port}'}
        cls.server.limits=defaultdict(deque);cls.server.limit_lock=threading.Lock()
        cls.server.dummy_hash=db.hash_password('dummy')
        threading.Thread(target=cls.server.serve_forever,daemon=True).start()
        for key,mail in [('student','aluno'),('teacher','professor'),('admin','admin'),('reception','recepcao'),('other','ana')]:
            c=Client(cls.port);c.login(mail+'@athev.local');setattr(cls,key,c)
    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown();cls.server.server_close()
        assert cls.temp_path.is_relative_to((ROOT/'tests').resolve())
        cls.tmp.cleanup()
    def test_01_auth_csrf_and_private_files(self):
        anon=Client(self.port)
        self.assertEqual(anon.call('GET','/api/bootstrap')[0],401)
        self.assertEqual(self.student.call('PUT','/api/profile',{'name':'No'},csrf=False)[0],403)
        self.assertEqual(self.student.call('PUT','/api/profile',{'name':'No'},origin='http://evil.invalid')[0],403)
        for path in ['/data/athev.db','/backend/db.py','/server.py','/assets/../backend/db.py','/assets/%2e%2e/server.py']:
            self.assertEqual(anon.call('GET',path)[0],404,path)
        self.assertEqual(anon.call('GET','/')[0],200)
        with db.connect() as conn:
            password=conn.execute('SELECT password_hash FROM users WHERE id=1').fetchone()[0]
            self.assertTrue(password.startswith('pbkdf2_sha256$600000$'))
    def test_02_student_data_and_permissions(self):
        b=self.student.ok('GET','/api/bootstrap')
        self.assertEqual(len(b['workouts']),5);self.assertEqual(len(b['exercises']),26)
        self.assertGreater(b['stats']['total'],0);self.assertIsNone(b['occupancy'])
        for path in ['/api/staff/students','/api/staff/overview','/api/staff/templates']:
            self.assertEqual(self.student.call('GET',path)[0],403)
        self.assertEqual(self.other.call('DELETE','/api/workouts/1',{})[0],403)
        self.assertEqual(self.reception.call('GET','/api/staff/students/1')[0],403)
        self.assertEqual(self.teacher.call('GET','/api/staff/overview')[0],403)
    def test_03_workout_full_lifecycle_and_replay(self):
        s=self.student.ok('POST','/api/sessions/start',{'workout_id':1})
        self.assertEqual(self.student.call('POST','/api/sessions/start',{'workout_id':2})[0],409)
        self.assertEqual(self.other.call('PUT','/api/sessions/'+str(s['id']),{'items':s['items']})[0],404)
        s['items'][0]['sets'][0].update(weight=100,reps=8,done=True)
        saved=self.student.ok('PUT','/api/sessions/'+str(s['id']),{'items':s['items'],'notes':'Teste persistência'})
        self.assertGreater(saved['rest_until'],time.time())
        reload=self.student.ok('GET','/api/bootstrap')['active'];self.assertEqual(reload['notes'],'Teste persistência')
        self.assertEqual(reload['items'][0]['sets'][0]['weight'],100)
        result=self.student.ok('POST','/api/sessions/'+str(s['id'])+'/finish',{'difficulty':'Ideal'})
        self.assertEqual(result['summary']['volume'],800)
        self.assertEqual(result['summary']['sets'],1)
        self.assertEqual(result['summary']['reps'],8)
        self.assertEqual(result['records'][0]['weight'],100)
        self.assertEqual(self.student.call('POST','/api/sessions/'+str(s['id'])+'/finish',{})[0],409)
        b=self.student.ok('GET','/api/bootstrap');self.assertIsNone(b['active']);self.assertEqual(b['history'][0]['summary']['volume'],800)
    def test_04_validation_rollback_and_discard(self):
        s=self.other.ok('POST','/api/sessions/start',{'workout_id':6})
        s['items'][0]['sets'][0]['weight']=-5
        self.assertEqual(self.other.call('PUT','/api/sessions/'+str(s['id']),{'items':s['items']})[0],400)
        self.assertGreaterEqual(self.other.ok('GET','/api/bootstrap')['active']['items'][0]['sets'][0]['weight'],0)
        self.assertEqual(self.other.call('POST','/api/sessions/'+str(s['id'])+'/finish',{})[0],400)
        self.other.ok('POST','/api/sessions/'+str(s['id'])+'/discard',{})
        self.assertIsNone(self.other.ok('GET','/api/bootstrap')['active'])
    def test_05_teacher_create_edit_duplicate_evaluation(self):
        w=self.teacher.ok('POST','/api/workouts',{'user_id':1,'name':'Ficha teste','muscle':'Peito','items':[{'exercise_id':1,'sets':2,'reps':10,'weight':20,'rest':30}]})
        self.teacher.ok('PUT','/api/workouts/'+str(w['id']),{'name':'Ficha editada','muscle':'Peito','items':[{'exercise_id':2,'sets':3,'reps':12,'weight':16,'rest':45,'technique':'Pirâmide'}]})
        dup=self.teacher.ok('POST','/api/workouts/'+str(w['id'])+'/duplicate',{'user_id':4})
        b=self.other.ok('GET','/api/bootstrap');self.assertTrue(any(x['id']==dup['id'] for x in b['workouts']))
        self.teacher.ok('POST','/api/measurements',{'user_id':1,'date':date.today().isoformat(),'weight':78.2,'arm':35})
        self.teacher.ok('POST','/api/staff/notes',{'student_id':1,'body':'Acompanhamento de teste'})
        b=self.teacher.ok('GET','/api/staff/students/1');self.assertTrue(b['notes']);self.assertNotIn('payments',b)
        self.teacher.ok('DELETE','/api/workouts/'+str(w['id']),{})
    def test_06_reservation_capacity_concurrency(self):
        c=self.admin.ok('POST','/api/staff/classes',{'title':'Aula concorrente','teacher':'Professor demo','starts_at':(datetime.now()+timedelta(days=3,hours=4)).isoformat(timespec='seconds'),'duration':30,'capacity':1,'gym_id':1})
        with ThreadPoolExecutor(max_workers=2) as pool:
            results=list(pool.map(lambda client:client.call('POST',f'/api/classes/{c["id"]}/reservation',{})[0],[self.student,self.other]))
        self.assertEqual(sorted(results),[200,409])
        self.assertEqual(self.admin.call('DELETE','/api/staff/classes/'+str(c['id']),{})[0],409)
        winner=self.student if results[0]==200 else self.other
        winner.ok('DELETE',f'/api/classes/{c["id"]}/reservation',{})
        self.admin.ok('DELETE','/api/staff/classes/'+str(c['id']),{})
    def test_07_qr_single_use_and_scoping(self):
        qr=self.student.ok('POST','/api/access-token',{})
        self.assertIn('<svg',qr['svg']);self.assertNotIn('Lucas',qr['token']);self.assertLess(len(qr['token']),50)
        self.assertEqual(self.student.call('POST','/api/checkin',{'token':qr['token']})[0],403)
        result=self.reception.ok('POST','/api/checkin',{'token':qr['token']})
        self.assertIn('Lucas',result['name'])
        self.assertEqual(self.reception.call('POST','/api/checkin',{'token':qr['token']})[0],409)
        first=self.student.ok('POST','/api/access-token',{});self.student.ok('POST','/api/access-token',{})
        self.assertEqual(self.reception.call('POST','/api/checkin',{'token':first['token']})[0],409)
    def test_08_nutrition_events_favorites(self):
        log=self.student.ok('POST','/api/nutrition',{'meal':'Almoço','food':'Teste','calories':200,'protein':20,'carbs':10,'fat':8})
        water=self.student.ok('POST','/api/nutrition',{'meal':'Água','food':'Água','water':250})
        self.assertEqual(self.student.call('POST','/api/nutrition',{'meal':'Teste','food':'Teste','water':-1})[0],400)
        ev=self.student.ok('POST','/api/events',{'title':'Treino agendado','kind':'Treino','starts_at':(datetime.now()+timedelta(days=2)).isoformat(timespec='seconds')})
        self.student.ok('PUT','/api/events/'+str(ev['id']),{'title':'Reagendado','kind':'Descanso','starts_at':(datetime.now()+timedelta(days=4)).isoformat(timespec='seconds')})
        self.assertEqual(self.other.call('DELETE','/api/events/'+str(ev['id']),{})[0],403)
        self.student.ok('POST','/api/favorite',{'exercise_id':1,'value':True})
        b=self.student.ok('GET','/api/bootstrap');self.assertIn(1,b['favorites']);self.assertTrue(any(x['id']==water['id'] for x in b['nutrition']))
        self.student.ok('DELETE','/api/nutrition/'+str(log['id']),{})
    def test_09_photos_isolation_export(self):
        png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII='
        p=self.student.ok('POST','/api/photos',{'date':date.today().isoformat(),'angle':'Frente','image':png})
        self.assertEqual(self.other.call('GET','/api/photos/'+str(p['id']))[0],404)
        exported=self.student.ok('GET','/api/export')
        self.assertTrue(exported['progress_photos']);self.assertNotIn('password_hash',json.dumps(exported));self.assertNotIn('recovery_hash',json.dumps(exported))
        self.student.ok('DELETE','/api/photos/'+str(p['id']),{})
    def test_10_financial_simulation(self):
        p=self.admin.ok('POST','/api/staff/payments',{'user_id':1,'amount':120,'due_date':date.today().isoformat()})
        self.assertEqual(self.other.call('POST',f'/api/payments/{p["id"]}/simulate',{})[0],404)
        self.student.ok('POST',f'/api/payments/{p["id"]}/simulate',{})
        self.assertEqual(self.student.call('POST',f'/api/payments/{p["id"]}/simulate',{})[0],409)
        self.student.ok('PUT','/api/membership',{'plan_id':3,'gym_id':2,'cancel_requested':True})
        m=self.student.ok('GET','/api/bootstrap')['membership'];self.assertEqual(m['plan_id'],3);self.assertEqual(m['cancel_requested'],1)
    def test_11_new_user_recovery_deletion_and_scope(self):
        c=Client(self.port)
        r=c.ok('POST','/api/register',{'name':'Usuário Teste','email':'teste@example.local','password':'Teste1234','birth_date':'2000-01-01','height':175,'weight':75,'consent':True})
        signed=c.login('teste@example.local','Teste1234');newid=signed['user']['id']
        self.assertEqual(self.teacher.call('GET','/api/staff/students/'+str(newid))[0],200)
        self.admin.ok('PUT','/api/staff/users/'+str(newid),{'trainer_id':''})
        self.assertEqual(self.teacher.call('GET','/api/staff/students/'+str(newid))[0],403)
        recovered=c.ok('POST','/api/recover',{'email':'teste@example.local','code':r['recovery_code'],'password':'NovaSenha1234'})
        self.assertEqual(c.call('GET','/api/me')[0],401)
        self.assertEqual(c.call('POST','/api/recover',{'email':'teste@example.local','code':r['recovery_code'],'password':'OutraSenha1234'})[0],401)
        c.login('teste@example.local','NovaSenha1234')
        c.ok('DELETE','/api/account',{'password':'NovaSenha1234'})
        self.assertEqual(c.call('GET','/api/me')[0],401)
        with db.connect() as conn:self.assertIsNone(conn.execute('SELECT id FROM users WHERE id=?',(newid,)).fetchone())
    def test_12_block_revoke_sessions(self):
        c=Client(self.port);c.login('pedro@athev.local')
        self.admin.ok('PUT','/api/staff/users/5',{'active':False})
        self.assertEqual(c.call('GET','/api/bootstrap')[0],401)
        self.admin.ok('PUT','/api/staff/users/5',{'active':True})
    def test_13_notifications_and_assistant(self):
        self.student.ok('PUT','/api/profile',{'preferences':{'treino':False}})
        title='Aviso de teste ignorado'
        self.admin.ok('POST','/api/staff/notifications',{'user_id':1,'title':title,'body':'Preferência desativada'})
        self.assertFalse(any(n['title']==title for n in self.student.ok('GET','/api/bootstrap')['notifications']))
        answer=self.student.ok('POST','/api/assistant',{'message':'Minha evolução no supino reto'})
        self.assertIn('100',answer['answer']);self.assertIn('regras',answer['mode'])
        self.assertIn('profissional',self.student.ok('POST','/api/assistant',{'message':'Tenho dor no ombro'})['answer'])
    def test_14_empty_account_and_templates(self):
        uid=self.admin.ok('POST','/api/staff/users',{'name':'Aluno sem dados','email':'empty@example.local','password':'Senha1234','role':'ALUNO','plan_id':1})['id']
        b=self.admin.ok('GET','/api/staff/students/'+str(uid));self.assertEqual(b['stats']['total'],0);self.assertEqual(b['workouts'],[])
        template=self.teacher.ok('GET','/api/staff/templates')[0]
        copied=self.admin.ok('POST','/api/workouts/'+str(template['id'])+'/duplicate',{'user_id':uid})
        self.assertTrue(copied['id'])
    def test_15_payload_validation_and_rate_limit(self):
        self.assertEqual(self.student.call('POST','/api/workouts',{'name':'Bad','muscle':'Peito','items':[]})[0],400)
        self.assertEqual(self.student.call('POST','/api/measurements',{'date':'2099-01-01','weight':70})[0],400)
        self.assertEqual(self.student.call('POST','/api/assistant',{'message':None})[0],400)
        anon=Client(self.port)
        statuses=[anon.call('POST','/api/recover',{'email':'nobody@example.local','code':'bad','password':'Nova1234'})[0] for _ in range(6)]
        self.assertIn(429,statuses)

if __name__=='__main__':unittest.main(verbosity=2)
