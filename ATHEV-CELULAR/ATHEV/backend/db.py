import hashlib
import hmac
import json
import os
from pathlib import Path
import secrets
import sqlite3
from datetime import datetime, timedelta
from .catalog import EXERCISES, WORKOUTS, ACHIEVEMENTS

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = Path(os.environ.get('ATHEV_DB', ROOT / 'data' / 'athev.db'))

def now():
    return datetime.now().isoformat(timespec='seconds')

def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()

def hash_password(password):
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), 600_000)
    return 'pbkdf2_sha256$600000$' + salt + '$' + key.hex()

def verify_password(password, encoded):
    try:
        _, rounds, salt, stored = encoded.split('$')
        actual = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), int(rounds)).hex()
        return hmac.compare_digest(actual, stored)
    except (ValueError, TypeError):
        return False

def connect():
    db = sqlite3.connect(DB_PATH, timeout=15)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA foreign_keys=ON')
    return db

def rows(db, sql, args=()):
    return [dict(r) for r in db.execute(sql, args).fetchall()]

def one(db, sql, args=()):
    r = db.execute(sql, args).fetchone()
    return dict(r) if r else None

def insert(db, table, data):
    # Table and column names are internal constants, never request-supplied SQL.
    columns = ','.join(data)
    marks = ','.join('?' for _ in data)
    return db.execute(f'INSERT INTO {table} ({columns}) VALUES ({marks})', tuple(data.values())).lastrowid

def user_public(db, uid):
    u = one(db, 'SELECT id,name,email,role,active,created_at FROM users WHERE id=?', (uid,))
    if not u:
        return None
    p = one(db, 'SELECT * FROM profiles WHERE user_id=?', (uid,)) or {}
    p.pop('user_id', None)
    u.update(p)
    u['preferences'] = json.loads(u.get('preferences') or '{}')
    u['nutrition_goals'] = json.loads(u.get('nutrition_goals') or '{}')
    return u

def assign_defaults(db, uid, creator=None):
    for name, muscle, day, items in WORKOUTS:
        wid = insert(db, 'workouts', dict(user_id=uid,creator_id=creator or uid,name=name,muscle=muscle,day=day,duration=55,level='Intermediário',notes='Ficha demonstrativa. Ajuste com seu professor.',created_at=now()))
        for pos,(eid,sets,reps,weight) in enumerate(items):
            insert(db,'workout_exercises',dict(workout_id=wid,exercise_id=eid,position=pos,sets=sets,reps=reps,weight=weight,rest=60,technique='Tradicional'))

def snapshot(db, workout_id):
    items = rows(db, 'SELECT we.*,e.name,e.muscle,e.equipment,e.animation FROM workout_exercises we JOIN exercises e ON e.id=we.exercise_id WHERE workout_id=? ORDER BY position', (workout_id,))
    return [dict(key=str(x['id']), exercise_id=x['exercise_id'], name=x['name'], muscle=x['muscle'], equipment=x['equipment'], animation=x['animation'], rest=x['rest'], technique=x['technique'], notes=x['notes'], sets=[dict(weight=x['weight'], reps=x['reps'], done=False) for _ in range(x['sets'])]) for x in items]

def write_sets(db, sid, items):
    db.execute('DELETE FROM exercise_sets WHERE session_id=?', (sid,))
    for ex in items:
        for p,s in enumerate(ex['sets']):
            insert(db,'exercise_sets',dict(session_id=sid,exercise_id=ex['exercise_id'],exercise_key=ex['key'],position=p,weight=s['weight'],reps=s['reps'],done=int(s.get('done',False))))

def initialize():
    DB_PATH.parent.mkdir(parents=True,exist_ok=True)
    db = connect()
    db.execute('PRAGMA journal_mode=WAL')
    db.executescript((ROOT/'backend'/'schema.sql').read_text(encoding='utf-8'))
    if one(db,'SELECT id FROM users LIMIT 1'):
        db.close()
        return
    stamp = now()
    today = datetime.now().replace(hour=0,minute=0,second=0,microsecond=0)
    for name,price,benefits in [('Essential',99.90,'Musculação|Ficha digital|Acompanhamento de evolução'),('Performance',149.90,'Todos os benefícios Essential|Aulas coletivas|Todas as unidades'),('Black',219.90,'Todos os benefícios Performance|Avaliação mensal|Consulta com personal')]:
        insert(db,'plans',dict(name=name,price=price,benefits=benefits))
    insert(db,'gyms',dict(name='ATHEV • Central',address='Av. da Performance, 100 • Unidade demonstrativa',hours='Seg–Sex 05h–23h · Sáb–Dom 08h–18h',phone='Não cadastrado',services='Musculação, Spinning, Funcional, Yoga',equipment='Pesos livres, polias, esteiras, bicicletas'))
    insert(db,'gyms',dict(name='ATHEV • Jardins',address='Rua da Disciplina, 200 • Unidade demonstrativa',hours='Seg–Sex 06h–22h · Sáb 08h–16h',phone='Não cadastrado',services='Musculação, Dança, Alongamento',equipment='Halteres, racks, máquinas guiadas'))
    for idx,e in enumerate(EXERCISES,1):
        insert(db,'exercises',dict(id=idx,name=e[0],muscle=e[1],equipment=e[2],instructions=e[3],tip=e[4],mistake=e[5],animation=e[6]))
    pw = hash_password('Athev@123')
    for name,email,role in [('Lucas Almeida','aluno@athev.local','ALUNO'),('Marina Costa','professor@athev.local','PROFESSOR'),('Gestão ATHEV','admin@athev.local','ADMIN'),('Ana Martins','ana@athev.local','ALUNO'),('Pedro Lima','pedro@athev.local','ALUNO'),('Recepção ATHEV','recepcao@athev.local','RECEPCIONISTA'),('Gerência ATHEV','gerente@athev.local','GERENTE')]:
        uid = insert(db,'users',dict(name=name,email=email,password_hash=pw,recovery_hash=digest('ATHEV-DEMO-2026'),role=role,created_at=stamp))
        insert(db,'profiles',dict(user_id=uid,birth_date='1998-06-15',height=178,weight=78.5,goal='Hipertrofia',level='Intermediário',consent=1,consent_at=stamp))
        insert(db,'memberships',dict(user_id=uid,plan_id=2,gym_id=1,status='Ativo',next_billing=(today+timedelta(days=12)).date().isoformat()))
        if role=='ALUNO':
            for n in range(3):
                dt = (today-timedelta(days=30*n)).date().isoformat()
                insert(db,'payments',dict(user_id=uid,amount=149.9,due_date=dt,paid_at=dt if n else None,status='Pago' if n else 'Pendente',simulated=1))
    for student in rows(db,"SELECT id FROM users WHERE role='ALUNO' ORDER BY id"):
        db.execute('INSERT INTO trainer_students VALUES (?,?)',(2,student['id']))
        assign_defaults(db,student['id'],2)
    for item in ACHIEVEMENTS:
        db.execute('INSERT INTO achievements VALUES (?,?,?,?,?,?)', item)
    for item in [('month12','12 treinos no mês',12,'month'),('week4','4 treinos na semana',4,'week'),('total100','100 treinos na jornada',100,'total'),('records3','3 recordes pessoais',3,'records')]:
        db.execute('INSERT INTO challenges VALUES (?,?,?,?)',item)
    # History is intentionally fictional and identified as demonstration data in the interface.
    for n,days in enumerate([42,39,36,33,30,28,25,22,19,16,13,10,7,5,3,1]):
        wid = n%5+1
        items = snapshot(db,wid)
        dt = today-timedelta(days=days)+timedelta(hours=18)
        for ex in items:
            for s in ex['sets']:
                s['weight'] = max(0,s['weight']-6+(n//4)*2)
                s['done'] = True
        sid = insert(db,'workout_sessions',dict(user_id=1,workout_id=wid,name=WORKOUTS[wid-1][0]+' · '+WORKOUTS[wid-1][1],started_at=dt.isoformat(),ended_at=(dt+timedelta(minutes=48+n%10)).isoformat(),duration=(48+n%10)*60,difficulty='Ideal',status='completed',snapshot=json.dumps(items)))
        write_sets(db,sid,items)
        for ex in items:
            weight = max(s['weight'] for s in ex['sets'])
            old = one(db,'SELECT weight FROM personal_records WHERE user_id=1 AND exercise_id=?',(ex['exercise_id'],))
            if weight>0 and (not old or weight>old['weight']):
                db.execute('INSERT OR REPLACE INTO personal_records VALUES (?,?,?,?,?)',(1,ex['exercise_id'],weight,sid,dt.isoformat()))
    for n,days in enumerate([60,45,30,15,0]):
        insert(db,'measurements',dict(user_id=1,date=(today-timedelta(days=days)).date().isoformat(),weight=80.5-n*.5,height=178,fat=19-n*.5,arm=33+n*.2,forearm=27,chest=99+n*.5,waist=84-n*.5,abdomen=86-n*.5,hip=99,thigh=56+n*.2,calf=37))
    for aid in ['first','ten','record']:
        db.execute('INSERT INTO user_achievements VALUES (?,?,?)',(1,aid,stamp))
    for days in range(1,15):
        for title,hour,teacher in [('Funcional',7,'Marina Costa'),('Spinning',18,'Marina Costa'),('Yoga',19,'Marina Costa')]:
            insert(db,'classes',dict(title=title,teacher=teacher,starts_at=(today+timedelta(days=days,hours=hour)).isoformat(),duration=50,capacity=12,gym_id=1,cancel_minutes=60))
    db.execute('INSERT INTO class_reservations(user_id,class_id,created_at) VALUES (1,2,?)',(stamp,))
    insert(db,'calendar_events',dict(user_id=1,title='Avaliação física',kind='Avaliação',starts_at=(today+timedelta(days=3,hours=9)).isoformat(),notes='Leve seu histórico de evolução.'))
    insert(db,'notifications',dict(user_id=1,kind='conquista',title='Disciplina de ouro',body='Você chegou a 10 treinos. Continue construindo sua evolução.',created_at=stamp))
    insert(db,'notifications',dict(user_id=1,kind='treino',title='Seu treino está pronto',body='A ficha A está disponível. Ajuste as cargas com seu professor.',created_at=stamp))
    for meal,food,k,p,c,f in [('Café da manhã','Ovos, pão integral e fruta',450,25,50,15),('Almoço','Arroz, feijão, frango e salada',680,48,82,18)]:
        insert(db,'nutrition_logs',dict(user_id=1,date=today.date().isoformat(),meal=meal,food=food,calories=k,protein=p,carbs=c,fat=f))
    insert(db,'nutrition_logs',dict(user_id=1,date=today.date().isoformat(),meal='Água',food='Água',water=1250))
    wid = insert(db,'workouts',dict(user_id=None,creator_id=2,name='Template · Corpo inteiro',muscle='Corpo inteiro',day=0,duration=45,level='Iniciante',notes='Modelo para adaptação pelo professor.',is_template=1,created_at=stamp))
    for p,eid in enumerate([13,1,4,7,21]):
        insert(db,'workout_exercises',dict(workout_id=wid,exercise_id=eid,position=p,sets=3,reps=12,weight=0,rest=60))
    db.commit()
    db.close()
