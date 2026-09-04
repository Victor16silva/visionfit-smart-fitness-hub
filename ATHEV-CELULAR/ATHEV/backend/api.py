"""API local. Toda autorização e validação são repetidas no servidor."""
import base64
import json
import math
import re
import secrets
import time
from datetime import datetime, timedelta, date
from .db import now, digest, hash_password, verify_password, rows, one, insert, user_public, snapshot, write_sets
from .qrencoder import QRCode, QRErrorCorrectLevel

STAFF = ('PROFESSOR','RECEPCIONISTA','GERENTE','ADMIN')
MANAGERS = ('GERENTE','ADMIN')
ROLES = ('ALUNO',)+STAFF
MUSCLES = ('Peito','Costas','Ombro','Bíceps','Tríceps','Pernas','Glúteos','Panturrilha','Abdômen','Cardio')

class APIError(Exception):
    def __init__(self,message,status=400):
        self.message,self.status = message,status

def require(condition,message='Operação não permitida.',status=400):
    if not condition:
        raise APIError(message,status)

def text(value,limit=200,minimum=0):
    require(isinstance(value,str),'Texto inválido.')
    value=value.strip()
    require(minimum<=len(value)<=limit,f'O texto deve conter de {minimum} a {limit} caracteres.')
    return value

def number(value,low=0,high=10000,integer=False):
    try:
        n=float(value)
    except (TypeError,ValueError):
        raise APIError('Informe um número válido.')
    require(math.isfinite(n) and low<=n<=high,'Número fora do intervalo permitido.')
    require(not integer or n.is_integer(),'Informe um número inteiro.')
    return int(n) if integer else n

def iso_date(value, future=True):
    try:
        d=date.fromisoformat(str(value))
    except ValueError:
        raise APIError('Data inválida.')
    require(date(1900,1,1)<=d<=date(2100,12,31),'Data fora do intervalo permitido.')
    require(future or d<=date.today(),'A data não pode estar no futuro.')
    return d.isoformat()

def iso_datetime(value):
    try:
        d=datetime.fromisoformat(str(value))
        require(d.tzinfo is None,'Use a data e hora local da academia.')
    except ValueError:
        raise APIError('Data e hora inválidas.')
    require(2020<=d.year<=2100,'Ano inválido.')
    return d.isoformat(timespec='seconds')

def email(value):
    value=text(value,180,5).lower()
    require(re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',value),'E-mail inválido.')
    return value

def password(value):
    value=text(value,128,8)
    require(re.search('[A-Za-z]',value) and re.search('[0-9]',value),'A senha precisa ter letras e números.')
    return value

def picture(value):
    value=text(value,900000,20)
    require(re.match(r'^data:image/(jpeg|png|webp);base64,',value),'Envie uma imagem JPG, PNG ou WebP.')
    try:
        raw=base64.b64decode(value.split(',',1)[1],validate=True)
    except ValueError:
        raise APIError('Imagem inválida.')
    require(len(raw)<=650000,'Reduza a imagem para até 650 KB.')
    require(raw.startswith(b'\xff\xd8\xff') or raw.startswith(b'\x89PNG\r\n\x1a\n') or (raw[:4]==b'RIFF' and raw[8:12]==b'WEBP'),'Conteúdo da imagem inválido.')
    return value

def role(u,allowed):
    require(u['role'] in allowed,'Seu perfil não tem acesso a esta ação.',403)

def target_user(db,u,uid,write=False):
    uid=number(uid,1,10**9,True)
    if uid==u['id'] or u['role'] in MANAGERS:
        require(one(db,'SELECT id FROM users WHERE id=?',(uid,)),'Aluno não encontrado.',404)
        return uid
    require(u['role']=='PROFESSOR' and one(db,'SELECT 1 FROM trainer_students WHERE trainer_id=? AND student_id=?',(u['id'],uid)),'Você não acompanha este aluno.',403)
    return uid

def audit(db,u,action,target_type,target_id=None):
    insert(db,'audit_logs',dict(actor_id=u['id'],action=action,target_type=target_type,target_id=target_id,created_at=now()))

def notify(db,uid,kind,title,body,key=None):
    p=one(db,'SELECT preferences FROM profiles WHERE user_id=?',(uid,))
    if p and json.loads(p['preferences']).get(kind,True) is False:
        return
    if key and one(db,'SELECT id FROM notifications WHERE event_key=?',(key,)):
        return
    insert(db,'notifications',dict(user_id=uid,kind=kind,title=title,body=body,created_at=now(),event_key=key))

def summarize(items):
    done=[s for e in items for s in e['sets'] if s.get('done')]
    return dict(sets=len(done),reps=sum(s['reps'] for s in done),volume=round(sum(s['weight']*s['reps'] for s in done),1),exercises=sum(any(s.get('done') for s in e['sets']) for e in items))

def statistics(db,uid):
    sessions=rows(db,"SELECT * FROM workout_sessions WHERE user_id=? AND status='completed' ORDER BY started_at",(uid,))
    today=date.today()
    week=today-timedelta(days=today.weekday())
    dates={s['started_at'][:10] for s in sessions}
    streak=0
    day=today if today.isoformat() in dates else today-timedelta(days=1)
    while day.isoformat() in dates:
        streak+=1
        day-=timedelta(days=1)
    total_volume=0
    total_exercises=0
    frequency=[]
    for s in sessions:
        summary=summarize(json.loads(s['snapshot']))
        total_volume+=summary['volume']
        total_exercises+=summary['exercises']
        frequency.append(dict(date=s['started_at'][:10],volume=summary['volume'],duration=s['duration'],sets=summary['sets']))
    rec=one(db,'SELECT count(*) n FROM personal_records WHERE user_id=?',(uid,))['n']
    stats=dict(total=len(sessions),week=sum(s['started_at'][:10]>=week.isoformat() for s in sessions),month=sum(s['started_at'][:7]==today.isoformat()[:7] for s in sessions),streak=streak,records=rec,volume=round(total_volume),duration=sum(s['duration'] for s in sessions),exercises=total_exercises,frequency=frequency)
    xp=len(sessions)*100+one(db,'SELECT coalesce(sum(a.xp),0) n FROM user_achievements ua JOIN achievements a ON a.id=ua.achievement_id WHERE user_id=?',(uid,))['n']
    stats.update(xp=xp,level=xp//1000+1)
    return stats

def unlock(db,uid):
    stats=statistics(db,uid)
    unlocked=[]
    for a in rows(db,'SELECT * FROM achievements'):
        if stats[a['metric']]>=a['threshold'] and not one(db,'SELECT 1 FROM user_achievements WHERE user_id=? AND achievement_id=?',(uid,a['id'])):
            db.execute('INSERT INTO user_achievements VALUES (?,?,?)',(uid,a['id'],now()))
            notify(db,uid,'conquista',a['title'],a['description'])
            unlocked.append(a['title'])
    return unlocked

def session_view(row):
    if row:
        row['items']=json.loads(row.pop('snapshot'))
        row['summary']=summarize(row['items'])
    return row

def workout_list(db,uid,templates=False):
    result=rows(db,'SELECT * FROM workouts WHERE '+('is_template=1' if templates else 'user_id=? AND is_template=0')+' ORDER BY day,id',() if templates else (uid,))
    for w in result:
        w['items']=rows(db,'SELECT we.*,e.name,e.muscle,e.equipment,e.animation FROM workout_exercises we JOIN exercises e ON we.exercise_id=e.id WHERE workout_id=? ORDER BY position',(w['id'],))
    return result

def bootstrap(db,u,uid=None):
    uid=uid or u['id']
    today=date.today().isoformat()
    stats=statistics(db,uid)
    membership=one(db,'SELECT m.*,p.name plan_name,p.price,p.benefits,g.name gym_name FROM memberships m JOIN plans p ON p.id=m.plan_id JOIN gyms g ON g.id=m.gym_id WHERE user_id=?',(uid,))
    if uid==u['id']:
        for c in rows(db,'SELECT c.* FROM classes c JOIN class_reservations r ON r.class_id=c.id WHERE r.user_id=? AND c.starts_at BETWEEN ? AND ?',(uid,now(),(datetime.now()+timedelta(days=1)).isoformat())):
            notify(db,uid,'aula','Sua aula está chegando',c['title']+' · '+c['starts_at'][11:16],f'class-{uid}-{c["id"]}')
        for ev in rows(db,'SELECT * FROM calendar_events WHERE user_id=? AND starts_at BETWEEN ? AND ?',(uid,now(),(datetime.now()+timedelta(days=1)).isoformat())):
            notify(db,uid,'avaliacao' if ev['kind']=='Avaliação' else 'treino',ev['title'],'Atividade programada para '+ev['starts_at'][11:16],f'event-{uid}-{ev["id"]}-{ev["starts_at"]}')
        if membership and membership['next_billing']<= (date.today()+timedelta(days=3)).isoformat():
            notify(db,uid,'mensalidade','Próxima mensalidade','Confira o vencimento em Meu plano.',f'billing-{uid}-{membership["next_billing"]}')
        if stats['week']>=4:
            notify(db,uid,'meta','Meta semanal alcançada','Você completou 4 treinos nesta semana.',f'week-{uid}-{date.today().isocalendar()[:2]}')
        if stats['frequency'] and stats['frequency'][-1]['date']<(date.today()-timedelta(days=7)).isoformat():
            notify(db,uid,'inatividade','Seu histórico está aqui','Quando voltar a treinar, registre sua próxima sessão.',f'inactive-{uid}-{today[:7]}')
    sessions=rows(db,'SELECT * FROM workout_sessions WHERE user_id=? AND status=\'completed\' ORDER BY started_at DESC',(uid,))
    for s in sessions:
        session_view(s)
    return dict(user=user_public(db,uid),stats=stats,workouts=workout_list(db,uid),exercises=rows(db,'SELECT * FROM exercises ORDER BY name'),favorites=[r['exercise_id'] for r in rows(db,'SELECT exercise_id FROM favorites WHERE user_id=?',(uid,))],active=session_view(one(db,"SELECT * FROM workout_sessions WHERE user_id=? AND status='active'",(uid,))),history=sessions,measurements=rows(db,'SELECT * FROM measurements WHERE user_id=? ORDER BY date,id',(uid,)),photos=rows(db,'SELECT id,date,angle FROM progress_photos WHERE user_id=? ORDER BY date,id',(uid,)),records=rows(db,'SELECT r.*,e.name FROM personal_records r JOIN exercises e ON e.id=r.exercise_id WHERE user_id=? ORDER BY achieved_at DESC',(uid,)),classes=rows(db,'SELECT c.*,g.name gym_name,(SELECT count(*) FROM class_reservations r WHERE r.class_id=c.id) reserved,EXISTS(SELECT 1 FROM class_reservations r WHERE r.class_id=c.id AND r.user_id=?) booked FROM classes c JOIN gyms g ON g.id=c.gym_id ORDER BY starts_at',(uid,)),events=rows(db,'SELECT * FROM calendar_events WHERE user_id=? ORDER BY starts_at',(uid,)),membership=membership,plans=rows(db,'SELECT * FROM plans'),payments=rows(db,'SELECT * FROM payments WHERE user_id=? ORDER BY due_date DESC,id DESC',(uid,)),gyms=rows(db,'SELECT * FROM gyms'),checkins=rows(db,'SELECT * FROM checkins WHERE user_id=? ORDER BY created_at DESC LIMIT 100',(uid,)),notifications=rows(db,'SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 100',(uid,)),achievements=rows(db,'SELECT a.*,ua.unlocked_at FROM achievements a LEFT JOIN user_achievements ua ON ua.achievement_id=a.id AND ua.user_id=?',(uid,)),challenges=[dict(c,progress=min(c['target'],stats[c['metric']])) for c in rows(db,'SELECT * FROM challenges')],nutrition=rows(db,'SELECT * FROM nutrition_logs WHERE user_id=? AND date=? ORDER BY id',(uid,today)),occupancy=None)

def validate_items(db,items,session=False):
    require(isinstance(items,list) and 1<=len(items)<=30,'Adicione de 1 a 30 exercícios.')
    clean=[]
    seen=set()
    for p,ex in enumerate(items):
        require(isinstance(ex,dict),'Exercício inválido.')
        eid=number(ex.get('exercise_id'),1,10**9,True)
        entry=one(db,'SELECT * FROM exercises WHERE id=?',(eid,))
        require(entry,'Exercício não encontrado.')
        rest=number(ex.get('rest',60),0,600,True)
        technique=text(ex.get('technique','Tradicional'),80)
        notes=text(ex.get('notes',''),1500)
        if session:
            key=text(str(ex.get('key',p)),100,1)
            require(key not in seen,'Exercício duplicado na sessão.')
            seen.add(key)
            sets=ex.get('sets')
            require(isinstance(sets,list) and 1<=len(sets)<=20,'Use de 1 a 20 séries.')
            clean_sets=[]
            for s in sets:
                require(isinstance(s,dict),'Série inválida.')
                require(type(s.get('done',False)) is bool,'Estado da série inválido.')
                clean_sets.append(dict(weight=number(s.get('weight'),0,1500),reps=number(s.get('reps'),1,1000,True),done=s.get('done',False)))
            clean.append(dict(key=key,exercise_id=eid,name=entry['name'],muscle=entry['muscle'],equipment=entry['equipment'],animation=entry['animation'],rest=rest,technique=technique,notes=notes,sets=clean_sets))
        else:
            clean.append(dict(exercise_id=eid,position=p,sets=number(ex.get('sets',3),1,20,True),reps=number(ex.get('reps',10),1,1000,True),weight=number(ex.get('weight',0),0,1500),rest=rest,technique=technique,notes=notes))
    return clean

def auth_dispatch(db,path,data,handler):
    if path=='/api/login':
        handler.throttle('login',12,60)
        mail=email(data.get('email'))
        pw=text(data.get('password'),128,1)
        u=one(db,'SELECT * FROM users WHERE email=?',(mail,))
        # A dummy hash prevents missing users from taking a visibly faster path.
        encoded=u['password_hash'] if u else handler.server.dummy_hash
        require(verify_password(pw,encoded) and u and u['active'],'E-mail ou senha inválidos, ou conta bloqueada.',401)
        token=secrets.token_urlsafe(32)
        csrf=secrets.token_urlsafe(32)
        lifetime=30*86400 if data.get('remember') is True else 12*3600
        db.execute('DELETE FROM auth_sessions WHERE expires_at<?',(time.time(),))
        db.execute('INSERT INTO auth_sessions VALUES (?,?,?,?)',(digest(token),u['id'],csrf,time.time()+lifetime))
        handler.cookie='athev_session='+token+'; Path=/; HttpOnly; SameSite=Strict'+ ('; Max-Age='+str(lifetime) if data.get('remember') else '')
        return dict(user=user_public(db,u['id']),csrf=csrf)
    if path=='/api/register':
        handler.throttle('register',6,300)
        require(data.get('consent') is True,'Aceite os termos e a política para criar sua conta.')
        recovery=secrets.token_urlsafe(20)
        mail=email(data.get('email'))
        require(not one(db,'SELECT id FROM users WHERE email=?',(mail,)),'Não foi possível cadastrar este e-mail.',409)
        uid=insert(db,'users',dict(name=text(data.get('name'),80,2),email=mail,password_hash=hash_password(password(data.get('password'))),recovery_hash=digest(recovery),role='ALUNO',created_at=now()))
        insert(db,'profiles',dict(user_id=uid,birth_date=iso_date(data.get('birth_date'),False),height=number(data.get('height'),60,250),weight=number(data.get('weight'),20,500),sex=text(data.get('sex',''),30),level=text(data.get('level','Iniciante'),40),goal=text(data.get('goal','Saúde'),80),consent=1,consent_at=now()))
        insert(db,'memberships',dict(user_id=uid,plan_id=1,gym_id=1,status='Ativo',next_billing=(date.today()+timedelta(days=30)).isoformat()))
        trainer=one(db,"SELECT id FROM users WHERE role='PROFESSOR' AND active=1 LIMIT 1")
        if trainer:
            db.execute('INSERT INTO trainer_students VALUES (?,?)',(trainer['id'],uid))
        notify(db,uid,'treino','Bem-vindo ao ATHEV','Monte sua ficha ou peça ao seu professor para cadastrar um treino.')
        return dict(message='Conta criada. Guarde o código de recuperação em um local seguro.',recovery_code=recovery,email=mail)
    if path=='/api/recover':
        handler.throttle('recover',5,300)
        u=one(db,'SELECT * FROM users WHERE email=?',(email(data.get('email')),))
        code=text(data.get('code'),100,1)
        require(u and secrets.compare_digest(u['recovery_hash'],digest(code)),'E-mail ou código de recuperação inválido.',401)
        newcode=secrets.token_urlsafe(20)
        db.execute('UPDATE users SET password_hash=?,recovery_hash=? WHERE id=?',(hash_password(password(data.get('password'))),digest(newcode),u['id']))
        db.execute('DELETE FROM auth_sessions WHERE user_id=?',(u['id'],))
        return dict(message='Senha alterada. O código anterior foi invalidado.',recovery_code=newcode)
    raise APIError('Rota não encontrada.',404)

def dispatch(db,method,path,q,data,u,handler):
    uid=u['id']
    if method=='GET' and path=='/api/me':
        return dict(user=user_public(db,uid),csrf=handler.auth['csrf'])
    if method=='POST' and path=='/api/logout':
        db.execute('DELETE FROM auth_sessions WHERE token_hash=?',(handler.auth['token_hash'],))
        handler.cookie='athev_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict'
        return dict(ok=True)
    if method=='GET' and path=='/api/bootstrap':
        return bootstrap(db,u)
    if method=='PUT' and path=='/api/profile':
        db.execute('UPDATE users SET name=? WHERE id=?',(text(data.get('name',u['name']),80,2),uid))
        allowed={}
        for f in ['birth_date','sex','height','weight','goal','level','professional']:
            if f in data:
                allowed[f]=number(data[f],20 if f=='weight' else 60,500 if f=='weight' else 250) if f in ['height','weight'] else iso_date(data[f],False) if f=='birth_date' else text(data[f],180)
        if 'avatar' in data:
            allowed['avatar']=picture(data['avatar']) if data['avatar'] else None
        if 'preferences' in data:
            require(isinstance(data['preferences'],dict),'Preferências inválidas.')
            allowed['preferences']=json.dumps({k:bool(v) for k,v in data['preferences'].items() if k in ['treino','aula','avaliacao','mensalidade','conquista','recorde','meta','inatividade']})
        if 'nutrition_goals' in data:
            g=data['nutrition_goals']
            require(isinstance(g,dict),'Metas inválidas.')
            allowed['nutrition_goals']=json.dumps({k:number(g.get(k),1,15000) for k in ['calories','protein','carbs','fat','water']})
        if 'consent' in data:
            allowed['consent']=int(data['consent'] is True)
            allowed['consent_at']=now()
        if allowed:
            db.execute('UPDATE profiles SET '+','.join(f'{k}=?' for k in allowed)+' WHERE user_id=?',(*allowed.values(),uid))
        return dict(user=user_public(db,uid))
    if method=='POST' and path=='/api/password':
        record=one(db,'SELECT password_hash FROM users WHERE id=?',(uid,))
        require(verify_password(text(data.get('old'),128,1),record['password_hash']),'Senha atual incorreta.',403)
        db.execute('UPDATE users SET password_hash=? WHERE id=?',(hash_password(password(data.get('password'))),uid))
        db.execute('DELETE FROM auth_sessions WHERE user_id=? AND token_hash<>?',(uid,handler.auth['token_hash']))
        return dict(ok=True)
    if method=='POST' and path=='/api/favorite':
        eid=number(data.get('exercise_id'),1,10**9,True)
        require(one(db,'SELECT id FROM exercises WHERE id=?',(eid,)),'Exercício não encontrado.',404)
        if data.get('value'):
            db.execute('INSERT OR IGNORE INTO favorites VALUES (?,?)',(uid,eid))
        else:
            db.execute('DELETE FROM favorites WHERE user_id=? AND exercise_id=?',(uid,eid))
        return dict(ok=True)
    if path=='/api/workouts' and method=='POST':
        owner=target_user(db,u,data.get('user_id',uid),True)
        items=validate_items(db,data.get('items'))
        is_template=int(data.get('is_template') is True)
        if is_template:
            role(u,('PROFESSOR',)+MANAGERS)
        wid=insert(db,'workouts',dict(user_id=None if is_template else owner,creator_id=uid,name=text(data.get('name'),100,2),muscle=text(data.get('muscle'),100,2),duration=number(data.get('duration',60),5,300,True),day=number(data.get('day',0),0,6,True),level=text(data.get('level','Intermediário'),40),notes=text(data.get('notes',''),2000),is_template=is_template,created_at=now()))
        for ex in items:
            insert(db,'workout_exercises',dict(workout_id=wid,**ex))
        if owner!=uid:
            audit(db,u,'criar treino','users',owner)
            notify(db,owner,'treino','Nova ficha disponível',data['name'])
        return dict(id=wid)
    m=re.fullmatch(r'/api/workouts/(\d+)(/duplicate)?',path)
    if m:
        wid=int(m[1])
        w=one(db,'SELECT * FROM workouts WHERE id=?',(wid,))
        require(w,'Ficha não encontrada.',404)
        if w['is_template']:
            role(u,('PROFESSOR',)+MANAGERS)
            require(w['creator_id']==uid or u['role'] in MANAGERS,'Template de outro professor.',403)
        else:
            target_user(db,u,w['user_id'],True)
        if method=='POST' and m[2]:
            owner=target_user(db,u,data.get('user_id',w['user_id'] or uid),True)
            new={k:v for k,v in w.items() if k!='id'}
            new.update(user_id=owner,creator_id=uid,is_template=0,name=w['name']+' · cópia',created_at=now())
            nw=insert(db,'workouts',new)
            for ex in rows(db,'SELECT * FROM workout_exercises WHERE workout_id=?',(wid,)):
                ex.pop('id')
                ex['workout_id']=nw
                insert(db,'workout_exercises',ex)
            audit(db,u,'duplicar treino','workouts',nw)
            return dict(id=nw)
        if method=='DELETE':
            db.execute('DELETE FROM workouts WHERE id=?',(wid,))
            audit(db,u,'excluir treino','workouts',wid)
            return dict(ok=True)
        if method=='PUT':
            items=validate_items(db,data.get('items'))
            db.execute('UPDATE workouts SET name=?,muscle=?,duration=?,day=?,level=?,notes=? WHERE id=?',(text(data.get('name'),100,2),text(data.get('muscle'),100,2),number(data.get('duration',60),5,300,True),number(data.get('day',0),0,6,True),text(data.get('level','Intermediário'),40),text(data.get('notes',''),2000),wid))
            db.execute('DELETE FROM workout_exercises WHERE workout_id=?',(wid,))
            for ex in items:
                insert(db,'workout_exercises',dict(workout_id=wid,**ex))
            audit(db,u,'editar treino','workouts',wid)
            return dict(ok=True)
    if method=='POST' and path=='/api/sessions/start':
        require(not one(db,"SELECT id FROM workout_sessions WHERE user_id=? AND status='active'",(uid,)),'Você já tem um treino em andamento.',409)
        wid=number(data.get('workout_id'),1,10**9,True)
        w=one(db,'SELECT * FROM workouts WHERE id=? AND user_id=?',(wid,uid))
        require(w,'Ficha não encontrada.',404)
        items=snapshot(db,wid)
        require(items,'Esta ficha está vazia.')
        # Suggest the most recent saved load without changing the prescribed template.
        for ex in items:
            previous=one(db,"SELECT es.weight,es.reps FROM exercise_sets es JOIN workout_sessions s ON s.id=es.session_id WHERE s.user_id=? AND s.status='completed' AND es.exercise_id=? AND es.done=1 ORDER BY s.started_at DESC,es.position DESC LIMIT 1",(uid,ex['exercise_id']))
            if previous:
                ex['previous_weight']=previous['weight']
        sid=insert(db,'workout_sessions',dict(user_id=uid,workout_id=wid,name=w['name']+' · '+w['muscle'],started_at=now(),snapshot=json.dumps(items)))
        write_sets(db,sid,items)
        return session_view(one(db,'SELECT * FROM workout_sessions WHERE id=?',(sid,)))
    m=re.fullmatch(r'/api/sessions/(\d+)(/finish|/discard)?',path)
    if m:
        sid=int(m[1])
        s=one(db,'SELECT * FROM workout_sessions WHERE id=? AND user_id=?',(sid,uid))
        require(s,'Sessão não encontrada.',404)
        require(s['status']=='active','Esta sessão já foi encerrada.',409)
        if method=='POST' and m[2]=='/discard':
            db.execute("UPDATE workout_sessions SET status='discarded',ended_at=?,rest_until=0 WHERE id=?",(now(),sid))
            return dict(ok=True)
        if method=='PUT' and not m[2]:
            items=validate_items(db,data.get('items'),True)
            old=json.loads(s['snapshot'])
            for ex in items:
                previous=next((item for item in old if item['key']==ex['key'] and item['exercise_id']==ex['exercise_id']),None)
                if previous and 'previous_weight' in previous:
                    ex['previous_weight']=previous['previous_weight']
            old_done={(e['key'],i):x['done'] for e in old for i,x in enumerate(e['sets'])}
            newly=[e for e in items for i,x in enumerate(e['sets']) if x['done'] and not old_done.get((e['key'],i),False)]
            rest=time.time()+newly[-1]['rest'] if newly else s['rest_until']
            if data.get('skip_rest'):
                rest=0
            notes=text(data.get('notes',s['notes']),2000)
            db.execute('UPDATE workout_sessions SET snapshot=?,notes=?,rest_until=? WHERE id=?',(json.dumps(items),notes,rest,sid))
            write_sets(db,sid,items)
            return session_view(one(db,'SELECT * FROM workout_sessions WHERE id=?',(sid,)))
        if method=='POST' and m[2]=='/finish':
            items=json.loads(s['snapshot'])
            summary=summarize(items)
            require(summary['sets']>0,'Conclua pelo menos uma série antes de finalizar.')
            difficulty=data.get('difficulty','Ideal')
            require(difficulty in ['Muito fácil','Fácil','Ideal','Difícil','Muito difícil'],'Dificuldade inválida.')
            duration=max(1,int((datetime.now()-datetime.fromisoformat(s['started_at'])).total_seconds()))
            db.execute("UPDATE workout_sessions SET status='completed',ended_at=?,duration=?,difficulty=?,rest_until=0 WHERE id=?",(now(),duration,difficulty,sid))
            records=[]
            for ex in items:
                weight=max([x['weight'] for x in ex['sets'] if x['done']]+[0])
                old=one(db,'SELECT weight FROM personal_records WHERE user_id=? AND exercise_id=?',(uid,ex['exercise_id']))
                if weight>0 and (not old or weight>old['weight']):
                    db.execute('INSERT OR REPLACE INTO personal_records VALUES (?,?,?,?,?)',(uid,ex['exercise_id'],weight,sid,now()))
                    records.append(dict(name=ex['name'],weight=weight))
                    notify(db,uid,'recorde','Novo recorde!',ex['name']+' · '+str(weight)+' kg')
            unlocked=unlock(db,uid)
            return dict(summary=summary,duration=duration,records=records,unlocked=unlocked,calories=None)
    if method=='POST' and path=='/api/measurements':
        owner=target_user(db,u,data.get('user_id',uid),True)
        fields=dict(user_id=owner,date=iso_date(data.get('date'),False),notes=text(data.get('notes',''),1500))
        for f in ['weight','height','fat','arm','forearm','chest','waist','abdomen','hip','thigh','calf']:
            if data.get(f) not in (None,''):
                fields[f]=number(data[f],0.1,100 if f=='fat' else 500)
        require(len(fields)>3,'Informe pelo menos uma medida.')
        mid=insert(db,'measurements',fields)
        latest=one(db,'SELECT weight,height FROM measurements WHERE user_id=? ORDER BY date DESC,id DESC LIMIT 1',(owner,))
        if latest['weight']:
            db.execute('UPDATE profiles SET weight=? WHERE user_id=?',(latest['weight'],owner))
        if latest['height']:
            db.execute('UPDATE profiles SET height=? WHERE user_id=?',(latest['height'],owner))
        if owner!=uid:
            audit(db,u,'registrar avaliação','users',owner)
        return dict(id=mid)
    if method=='POST' and path=='/api/photos':
        require(one(db,'SELECT count(*) n FROM progress_photos WHERE user_id=?',(uid,))['n']<60,'Limite local: 60 fotos. Exclua uma foto antes de enviar outra.')
        angle=data.get('angle')
        require(angle in ['Frente','Lado','Costas'],'Ângulo inválido.')
        pid=insert(db,'progress_photos',dict(user_id=uid,date=iso_date(data.get('date'),False),angle=angle,image=picture(data.get('image'))))
        return dict(id=pid)
    m=re.fullmatch(r'/api/photos/(\d+)',path)
    if m:
        p=one(db,'SELECT * FROM progress_photos WHERE id=? AND user_id=?',(int(m[1]),uid))
        require(p,'Foto não encontrada.',404)
        if method=='GET':
            return p
        if method=='DELETE':
            db.execute('DELETE FROM progress_photos WHERE id=?',(p['id'],))
            return dict(ok=True)
    if path=='/api/events' and method=='POST':
        owner=target_user(db,u,data.get('user_id',uid),True)
        eid=insert(db,'calendar_events',dict(user_id=owner,title=text(data.get('title'),120,2),kind=text(data.get('kind'),40,2),starts_at=iso_datetime(data.get('starts_at')),notes=text(data.get('notes',''),1000)))
        return dict(id=eid)
    m=re.fullmatch(r'/api/events/(\d+)',path)
    if m:
        ev=one(db,'SELECT * FROM calendar_events WHERE id=?',(int(m[1]),))
        require(ev,'Atividade não encontrada.',404)
        target_user(db,u,ev['user_id'],True)
        if method=='DELETE':
            db.execute('DELETE FROM calendar_events WHERE id=?',(ev['id'],))
            return dict(ok=True)
        if method=='PUT':
            db.execute('UPDATE calendar_events SET title=?,kind=?,starts_at=?,notes=? WHERE id=?',(text(data.get('title'),120,2),text(data.get('kind'),40,2),iso_datetime(data.get('starts_at')),text(data.get('notes',''),1000),ev['id']))
            return dict(ok=True)
    m=re.fullmatch(r'/api/classes/(\d+)/reservation',path)
    if m:
        cid=int(m[1])
        c=one(db,'SELECT * FROM classes WHERE id=?',(cid,))
        require(c,'Aula não encontrada.',404)
        starts=datetime.fromisoformat(c['starts_at'])
        require(starts>datetime.now(),'Esta aula já começou.')
        if method=='POST':
            membership=one(db,'SELECT status FROM memberships WHERE user_id=?',(uid,))
            require(membership and membership['status']=='Ativo','É necessário um plano ativo para reservar.',403)
            require(not one(db,'SELECT id FROM class_reservations WHERE user_id=? AND class_id=?',(uid,cid)),'Você já reservou esta aula.',409)
            require(one(db,'SELECT count(*) n FROM class_reservations WHERE class_id=?',(cid,))['n']<c['capacity'],'Esta aula está lotada.',409)
            for other in rows(db,'SELECT c.* FROM classes c JOIN class_reservations r ON r.class_id=c.id WHERE r.user_id=?',(uid,)):
                os=datetime.fromisoformat(other['starts_at'])
                require(not(starts<os+timedelta(minutes=other['duration']) and os<starts+timedelta(minutes=c['duration'])),'Você já tem uma reserva neste horário.',409)
            insert(db,'class_reservations',dict(user_id=uid,class_id=cid,created_at=now()))
            notify(db,uid,'aula','Reserva confirmada',c['title']+' · '+c['starts_at'][:16].replace('T',' '))
            return dict(ok=True)
        if method=='DELETE':
            require(starts-datetime.now()>=timedelta(minutes=c['cancel_minutes']),f'Cancelamento até {c["cancel_minutes"]} minutos antes da aula.')
            db.execute('DELETE FROM class_reservations WHERE user_id=? AND class_id=?',(uid,cid))
            return dict(ok=True)
    if method=='POST' and path=='/api/access-token':
        membership=one(db,'SELECT * FROM memberships WHERE user_id=?',(uid,))
        require(membership and membership['status']=='Ativo','O plano precisa estar ativo para gerar o acesso.',403)
        token=secrets.token_urlsafe(24)
        db.execute('DELETE FROM access_tokens WHERE user_id=? OR expires_at<?',(uid,time.time()))
        db.execute('INSERT INTO access_tokens VALUES (?,?,?,0)',(digest(token),uid,time.time()+60))
        qr=QRCode(None,QRErrorCorrectLevel.M)
        qr.addData(token)
        qr.make()
        n=qr.getModuleCount()
        cells=''.join(f'<rect x="{c+4}" y="{r+4}" width="1" height="1"/>' for r in range(n) for c in range(n) if qr.isDark(r,c))
        svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n+8} {n+8}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="white"/><g fill="black">{cells}</g></svg>'
        return dict(token=token,expires_at=time.time()+60,svg=svg)
    if method=='POST' and path=='/api/checkin':
        role(u,('RECEPCIONISTA',)+MANAGERS)
        t=one(db,'SELECT * FROM access_tokens WHERE token_hash=?',(digest(text(data.get('token'),100,10)),))
        require(t and t['expires_at']>time.time() and not t['consumed'],'QR expirado, inválido ou já utilizado.',409)
        member=one(db,'SELECT m.*,u.active,u.name FROM memberships m JOIN users u ON u.id=m.user_id WHERE user_id=?',(t['user_id'],))
        require(member and member['active'] and member['status']=='Ativo','Acesso não autorizado.',403)
        db.execute('UPDATE access_tokens SET consumed=1 WHERE token_hash=?',(t['token_hash'],))
        insert(db,'checkins',dict(user_id=t['user_id'],gym_id=member['gym_id'],created_at=now(),simulated=1))
        audit(db,u,'validar acesso demonstrativo','users',t['user_id'])
        return dict(message='Acesso validado no sistema local.',name=member['name'])
    if method=='PUT' and path=='/api/membership':
        m=one(db,'SELECT * FROM memberships WHERE user_id=?',(uid,))
        require(m,'Plano não encontrado.',404)
        pid=number(data.get('plan_id',m['plan_id']),1,10**9,True)
        gid=number(data.get('gym_id',m['gym_id']),1,10**9,True)
        require(one(db,'SELECT id FROM plans WHERE id=?',(pid,)) and one(db,'SELECT id FROM gyms WHERE id=?',(gid,)),'Plano ou unidade não encontrado.')
        payment_method=data.get('payment_method',m['payment_method'])
        require(payment_method in ['Pix (demonstração)','Boleto (demonstração)','Cartão (a configurar)'],'Forma de pagamento inválida.')
        cancel=int(data.get('cancel_requested',bool(m['cancel_requested'])) is True)
        db.execute('UPDATE memberships SET plan_id=?,gym_id=?,payment_method=?,cancel_requested=? WHERE user_id=?',(pid,gid,payment_method,cancel,uid))
        return dict(message='Solicitação local registrada. Nenhuma cobrança real foi realizada.')
    m=re.fullmatch(r'/api/payments/(\d+)/simulate',path)
    if m and method=='POST':
        pay=one(db,'SELECT * FROM payments WHERE id=? AND user_id=?',(int(m[1]),uid))
        require(pay,'Pagamento não encontrado.',404)
        require(pay['status']=='Pendente','Esta fatura já foi registrada.',409)
        db.execute("UPDATE payments SET status='Pago',paid_at=?,simulated=1 WHERE id=?",(now(),pay['id']))
        return dict(message='Pagamento simulado. Nenhum valor foi cobrado.')
    if method=='POST' and path=='/api/nutrition':
        fields=dict(user_id=uid,date=iso_date(data.get('date',date.today().isoformat())),meal=text(data.get('meal'),40,1),food=text(data.get('food'),200,1))
        for f in ['calories','protein','carbs','fat','water']:
            fields[f]=number(data.get(f,0),0,20000)
        return dict(id=insert(db,'nutrition_logs',fields))
    m=re.fullmatch(r'/api/nutrition/(\d+)',path)
    if m and method=='DELETE':
        db.execute('DELETE FROM nutrition_logs WHERE id=? AND user_id=?',(int(m[1]),uid))
        return dict(ok=True)
    if path=='/api/notifications/read' and method=='POST':
        if data.get('id'):
            db.execute('UPDATE notifications SET read=1 WHERE id=? AND user_id=?',(number(data['id'],1,10**9,True),uid))
        else:
            db.execute('UPDATE notifications SET read=1 WHERE user_id=?',(uid,))
        return dict(ok=True)
    if path=='/api/assistant' and method=='POST':
        handler.throttle('assistant',30,60)
        question=text(data.get('message'),1200,2)
        return assistant(db,uid,question)
    if path=='/api/export' and method=='GET':
        return export_user(db,uid)
    if path=='/api/account' and method=='DELETE':
        pw=one(db,'SELECT password_hash FROM users WHERE id=?',(uid,))['password_hash']
        require(verify_password(text(data.get('password'),128,1),pw),'Senha incorreta.',403)
        if u['role']=='ADMIN':
            require(one(db,"SELECT count(*) n FROM users WHERE role='ADMIN' AND active=1")['n']>1,'Crie outro administrador antes de excluir esta conta.')
        db.execute('DELETE FROM users WHERE id=?',(uid,))
        handler.cookie='athev_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict'
        return dict(ok=True)
    if path.startswith('/api/staff'):
        return staff_dispatch(db,method,path,q,data,u)
    raise APIError('Rota não encontrada.',404)

def assistant(db,uid,question):
    import unicodedata
    normalize=lambda s: ''.join(c for c in unicodedata.normalize('NFD',s.lower()) if unicodedata.category(c)!='Mn')
    query=normalize(question)
    exercises=rows(db,'SELECT * FROM exercises')
    if any(w in query for w in ['dor','lesao','machuc','diagnost','remedio','doenca','dieta']):
        answer='Não posso avaliar sintomas, lesões ou prescrever dieta. Se houver dor, interrompa o exercício e procure avaliação de um profissional habilitado. Posso mostrar seu histórico ou as instruções cadastradas na biblioteca.'
    else:
        matches=[e for e in exercises if normalize(e['name']) in query or any(len(w)>4 and w in normalize(e['name']) for w in query.split())]
        if matches:
            e=matches[0]
            if any(w in query for w in ['altern','substitu','trocar']):
                alts=[x['name'] for x in exercises if x['muscle']==e['muscle'] and x['id']!=e['id']]
                answer=f'Alternativas da biblioteca para {e["name"]} ({e["muscle"]}): '+', '.join(alts)+'. Peça ao professor para confirmar a adequação da troca.'
            elif any(w in query for w in ['carga','evolu','progress','histor','record']):
                history=rows(db,"SELECT s.started_at,es.weight,es.reps FROM exercise_sets es JOIN workout_sessions s ON s.id=es.session_id WHERE s.user_id=? AND es.exercise_id=? AND es.done=1 AND s.status='completed' ORDER BY s.started_at DESC,es.position DESC LIMIT 12",(uid,e['id']))
                answer=f'{e["name"]}: '+('sua última série registrada foi de '+str(history[0]['weight'])+' kg × '+str(history[0]['reps'])+' repetições. Nos últimos registros, a maior carga foi '+str(max(x['weight'] for x in history))+' kg. Avalie qualquer progressão com o professor, considerando execução e conforto.' if history else 'você ainda não registrou séries neste exercício.')
            else:
                answer=e['name']+': '+e['instructions'].replace('|',' ')+' Dica: '+e['tip']+' Evite: '+e['mistake']
        else:
            st=statistics(db,uid)
            answer=f'Você tem {st["total"]} treinos concluídos, {st["week"]} nesta semana e {st["records"]} exercícios com recorde registrado. Pergunte, por exemplo: “Como fazer supino reto?”, “Alternativas de agachamento livre” ou “Minha evolução no supino reto”.'
    return dict(answer=answer,mode='Assistente local por regras e consulta ao seu histórico. IA generativa não conectada.')

def export_user(db,uid):
    out=dict(exported_at=now(),profile=user_public(db,uid))
    tables=['memberships','payments','workouts','workout_sessions','measurements','progress_photos','personal_records','class_reservations','calendar_events','checkins','notifications','user_achievements','favorites','nutrition_logs']
    for t in tables:
        out[t]=rows(db,f'SELECT * FROM {t} WHERE user_id=?',(uid,))
    out['exercise_sets']=rows(db,'SELECT es.* FROM exercise_sets es JOIN workout_sessions s ON s.id=es.session_id WHERE s.user_id=?',(uid,))
    out['workout_exercises']=rows(db,'SELECT we.* FROM workout_exercises we JOIN workouts w ON w.id=we.workout_id WHERE w.user_id=?',(uid,))
    out['trainer_notes']=rows(db,'SELECT * FROM trainer_notes WHERE student_id=?',(uid,))
    return out

def staff_dispatch(db,method,path,q,data,u):
    role(u,STAFF)
    uid=u['id']
    if path=='/api/staff/students' and method=='GET':
        if u['role']=='PROFESSOR':
            return rows(db,"SELECT u.id,u.name,u.email,u.active,p.goal,p.level,p.weight,m.status,m.plan_id,m.gym_id FROM users u JOIN profiles p ON p.user_id=u.id LEFT JOIN memberships m ON m.user_id=u.id JOIN trainer_students ts ON ts.student_id=u.id WHERE ts.trainer_id=? AND u.role='ALUNO' ORDER BY u.name",(uid,))
        return rows(db,"SELECT u.id,u.name,u.email,u.active,p.goal,p.level,p.weight,m.status,m.plan_id,m.gym_id FROM users u JOIN profiles p ON p.user_id=u.id LEFT JOIN memberships m ON m.user_id=u.id WHERE u.role='ALUNO' ORDER BY u.name")
    m=re.fullmatch(r'/api/staff/students/(\d+)',path)
    if m and method=='GET':
        role(u,('PROFESSOR',)+MANAGERS)
        target=target_user(db,u,int(m[1]))
        student=bootstrap(db,u,target)
        if u['role']=='PROFESSOR':
            for key in ['payments','notifications','nutrition','photos','checkins']:
                student.pop(key,None)
            student['user'].pop('preferences',None)
        student['notes']=rows(db,'SELECT n.*,u.name trainer_name FROM trainer_notes n LEFT JOIN users u ON u.id=n.trainer_id WHERE student_id=? ORDER BY created_at DESC',(target,))
        return student
    if path=='/api/staff/templates' and method=='GET':
        role(u,('PROFESSOR',)+MANAGERS)
        return [w for w in workout_list(db,uid,True) if w['creator_id']==uid or u['role'] in MANAGERS]
    if path=='/api/staff/notes' and method=='POST':
        role(u,('PROFESSOR',)+MANAGERS)
        student=target_user(db,u,data.get('student_id'),True)
        note=insert(db,'trainer_notes',dict(trainer_id=uid,student_id=student,body=text(data.get('body'),2000,2),created_at=now()))
        audit(db,u,'adicionar observação','users',student)
        return dict(id=note)
    if path=='/api/staff/overview' and method=='GET':
        role(u,('RECEPCIONISTA',)+MANAGERS)
        base=dict(checkins=rows(db,'SELECT c.*,u.name FROM checkins c JOIN users u ON u.id=c.user_id ORDER BY c.id DESC LIMIT 100'),classes=rows(db,'SELECT c.*,(SELECT count(*) FROM class_reservations r WHERE r.class_id=c.id) reserved FROM classes c ORDER BY starts_at'),gyms=rows(db,'SELECT * FROM gyms'),plans=rows(db,'SELECT * FROM plans'))
        if u['role'] in MANAGERS:
            base.update(users=rows(db,'SELECT u.id,u.name,u.email,u.role,u.active,u.created_at,m.plan_id,m.status,m.cancel_requested FROM users u LEFT JOIN memberships m ON m.user_id=u.id ORDER BY u.created_at DESC'),payments=rows(db,'SELECT p.*,u.name FROM payments p JOIN users u ON u.id=p.user_id ORDER BY due_date DESC'),audit=rows(db,'SELECT a.*,u.name actor_name FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.id DESC LIMIT 200'),assignments=rows(db,'SELECT * FROM trainer_students'))
        return base
    if path=='/api/staff/users' and method=='POST':
        role(u,MANAGERS)
        r=data.get('role','ALUNO')
        require(r in ROLES,'Perfil inválido.')
        require(u['role']=='ADMIN' or r in ['ALUNO','PROFESSOR','RECEPCIONISTA'],'Apenas o administrador pode criar gestores.',403)
        mail=email(data.get('email'))
        require(not one(db,'SELECT id FROM users WHERE email=?',(mail,)),'E-mail já cadastrado.',409)
        recovery=secrets.token_urlsafe(20)
        new=insert(db,'users',dict(name=text(data.get('name'),80,2),email=mail,password_hash=hash_password(password(data.get('password'))),recovery_hash=digest(recovery),role=r,created_at=now()))
        insert(db,'profiles',dict(user_id=new,consent=0))
        pid=number(data.get('plan_id',1),1,10**9,True)
        require(one(db,'SELECT id FROM plans WHERE id=?',(pid,)),'Plano não encontrado.')
        insert(db,'memberships',dict(user_id=new,plan_id=pid,gym_id=1,status='Ativo',next_billing=(date.today()+timedelta(days=30)).isoformat()))
        if r=='ALUNO' and data.get('trainer_id'):
            trainer=number(data['trainer_id'],1,10**9,True)
            require(one(db,"SELECT id FROM users WHERE id=? AND role='PROFESSOR' AND active=1",(trainer,)),'Professor inválido.')
            db.execute('INSERT INTO trainer_students VALUES (?,?)',(trainer,new))
        audit(db,u,'criar usuário','users',new)
        return dict(id=new,recovery_code=recovery)
    m=re.fullmatch(r'/api/staff/users/(\d+)',path)
    if m and method=='PUT':
        role(u,MANAGERS)
        tid=int(m[1])
        other=one(db,'SELECT * FROM users WHERE id=?',(tid,))
        require(other,'Usuário não encontrado.',404)
        require(u['role']=='ADMIN' or other['role'] in ['ALUNO','PROFESSOR','RECEPCIONISTA'],'Apenas o administrador pode editar gestores.',403)
        active=int(data.get('active',bool(other['active'])) is True)
        require(tid!=uid or active,'Você não pode bloquear a própria conta.')
        db.execute('UPDATE users SET name=?,active=? WHERE id=?',(text(data.get('name',other['name']),80,2),active,tid))
        if not active:
            db.execute('DELETE FROM auth_sessions WHERE user_id=?',(tid,))
            db.execute('DELETE FROM access_tokens WHERE user_id=?',(tid,))
        if 'plan_id' in data:
            pid=number(data['plan_id'],1,10**9,True)
            require(one(db,'SELECT id FROM plans WHERE id=?',(pid,)),'Plano não encontrado.')
            status=data.get('status','Ativo')
            require(status in ['Ativo','Suspenso','Cancelado'],'Status inválido.')
            db.execute('UPDATE memberships SET plan_id=?,status=? WHERE user_id=?',(pid,status,tid))
        if 'trainer_id' in data:
            require(other['role']=='ALUNO','Vincule professores apenas a alunos.')
            db.execute('DELETE FROM trainer_students WHERE student_id=?',(tid,))
            if data['trainer_id']:
                trainer=number(data['trainer_id'],1,10**9,True)
                require(one(db,"SELECT id FROM users WHERE id=? AND role='PROFESSOR' AND active=1",(trainer,)),'Professor inválido.')
                db.execute('INSERT INTO trainer_students VALUES (?,?)',(trainer,tid))
        audit(db,u,'editar usuário','users',tid)
        return dict(ok=True)
    if path=='/api/staff/notifications' and method=='POST':
        role(u,MANAGERS)
        title=text(data.get('title'),100,2)
        body=text(data.get('body'),1000,2)
        targets=[number(data['user_id'],1,10**9,True)] if data.get('user_id') else [x['id'] for x in rows(db,'SELECT id FROM users WHERE active=1')]
        for tid in targets:
            require(one(db,'SELECT id FROM users WHERE id=?',(tid,)),'Usuário não encontrado.')
            notify(db,tid,'treino',title,body)
        audit(db,u,'enviar notificação interna','notifications')
        return dict(count=len(targets))
    if path=='/api/staff/payments' and method=='POST':
        role(u,MANAGERS)
        target=number(data.get('user_id'),1,10**9,True)
        require(one(db,'SELECT id FROM users WHERE id=?',(target,)),'Aluno não encontrado.')
        pid=insert(db,'payments',dict(user_id=target,amount=number(data.get('amount'),1,100000),due_date=iso_date(data.get('due_date')),status='Pendente',simulated=1))
        audit(db,u,'emitir fatura demonstrativa','payments',pid)
        return dict(id=pid)
    m=re.fullmatch(r'/api/staff/(gyms|plans|classes|exercises)(?:/(\d+))?',path)
    if m:
        role(u,MANAGERS)
        table,rid=m[1],int(m[2]) if m[2] else None
        if rid:
            require(one(db,f'SELECT id FROM {table} WHERE id=?',(rid,)),'Registro não encontrado.',404)
        if method=='DELETE':
            require(table=='classes' and rid,'Exclusão disponível somente para aulas.')
            require(not one(db,'SELECT id FROM class_reservations WHERE class_id=?',(rid,)),'Cancele ou reagende as reservas antes de excluir a aula.',409)
            db.execute('DELETE FROM classes WHERE id=?',(rid,))
            audit(db,u,'excluir aula','classes',rid)
            return dict(ok=True)
        require(method in ['POST','PUT'],'Método não permitido.',405)
        if table=='gyms':
            clean={k:text(data.get(k,''),1000,2 if k in ['name','address','hours'] else 0) for k in ['name','address','hours','phone','services','equipment']}
        elif table=='plans':
            clean=dict(name=text(data.get('name'),80,2),price=number(data.get('price'),0,100000),benefits=text(data.get('benefits'),1500,2))
        elif table=='classes':
            clean=dict(title=text(data.get('title'),100,2),teacher=text(data.get('teacher'),80,2),starts_at=iso_datetime(data.get('starts_at')),duration=number(data.get('duration'),10,300,True),capacity=number(data.get('capacity'),1,500,True),gym_id=number(data.get('gym_id'),1,10**9,True),cancel_minutes=number(data.get('cancel_minutes',60),0,10080,True))
            require(one(db,'SELECT id FROM gyms WHERE id=?',(clean['gym_id'],)),'Unidade não encontrada.')
            if rid:
                require(one(db,'SELECT count(*) n FROM class_reservations WHERE class_id=?',(rid,))['n']<=clean['capacity'],'Capacidade menor que o número de reservas.',409)
                for r in rows(db,'SELECT user_id FROM class_reservations WHERE class_id=?',(rid,)):
                    notify(db,r['user_id'],'aula','Aula atualizada',clean['title']+' · confira a nova data na agenda.')
        else:
            require(data.get('muscle') in MUSCLES,'Grupo muscular inválido.')
            clean={k:text(data.get(k,''),2000,2) for k in ['name','muscle','equipment','instructions','tip','mistake']}
            clean['animation']='press'
        if rid:
            db.execute(f'UPDATE {table} SET '+','.join(f'{k}=?' for k in clean)+' WHERE id=?',(*clean.values(),rid))
        else:
            rid=insert(db,table,clean)
        audit(db,u,'salvar cadastro',table,rid)
        return dict(id=rid)
    raise APIError('Rota não encontrada.',404)
