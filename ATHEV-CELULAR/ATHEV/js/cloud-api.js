import { supabase as db, result } from './supabase.js';
import { today, summary, statistics, exerciseView, workoutView, historyView } from './cloud-model.js';

const table = name => db.from(name);
const fail = (message,status=400) => {const e=new Error(message);e.status=status;throw e;};
const uuid = () => crypto.randomUUID();
const ownKinds = {measurements:'measurement',photos:'photo',events:'event',nutrition:'nutrition'};
const roleName = roles => roles.some(r=>['admin','master'].includes(r.role))?'ADMIN':roles.some(r=>r.role==='personal')?'PROFESSOR':'ALUNO';
async function authUser(){const {data,error}=await db.auth.getUser();if(error||!data.user)fail('Entre na sua conta para continuar.',401);return data.user;}
async function rows(kind,uid){return (await result(table('athev_records').select('*').eq('user_id',uid).eq('kind',kind).order('created_at'))).map(r=>({...r.payload,id:r.id,user_id:r.user_id,created_at:r.created_at,revision:r.revision}));}
async function write(kind,uid,payload,id=uuid(),revision){
  const value={...payload};for(const k of ['id','user_id','created_at','revision'])delete value[k];
  if(revision!==undefined){const changed=await result(table('athev_records').update({payload:value,revision:revision+1}).eq('id',id).eq('user_id',uid).eq('kind',kind).eq('revision',revision).select());if(!changed.length)fail('Este registro mudou em outra aba. Atualize antes de salvar.',409);return {...changed[0].payload,id,revision:revision+1};}
  const saved=await result(table('athev_records').insert({id,user_id:uid,kind,payload:value}).select().single());return {...saved.payload,id,revision:saved.revision};
}
async function remove(kind,uid,id){await result(table('athev_records').delete().eq('id',id).eq('user_id',uid).eq('kind',kind));return {ok:true};}
async function profile(uid,auth){
  const [p,roles,extra,goals]=await Promise.all([
    result(table('profiles').select('*').eq('id',uid).maybeSingle()),result(table('user_roles').select('role').eq('user_id',uid)),
    rows('profile',uid),result(table('user_goals').select('*').eq('user_id',uid).limit(1))]);
  const g=goals[0]||{},x=extra[0]||{};
  return {...x,id:uid,name:p?.full_name||auth?.user_metadata?.full_name||'Membro ATHEV',email:auth?.email||'',
    avatar:p?.avatar_url||'',weight:p?.weight_kg??g.weight_kg??null,height:x.height??g.height_cm??null,
    sex:p?.gender||g.gender||'',goal:x.goal||g.fitness_goals?.[0]||'Saúde',level:x.level||g.training_level||'Iniciante',
    preferences:x.preferences||{},nutrition_goals:x.nutrition_goals||{calories:0,protein:0,carbs:0,fat:0,water:0},
    role:roleName(roles),active:1,created_at:p?.created_at||auth?.created_at||'',consent:x.consent??false};
}
async function bootstrap(uid,auth){
  const [user,ex,plans,logs,records,notes]=await Promise.all([
    profile(uid,auth),result(table('exercises').select('*').order('name')),
    result(table('workout_plans').select('*,workout_exercises(*)').eq('user_id',uid).eq('is_active',true)),
    result(table('workout_logs').select('*,exercise_logs(*)').eq('user_id',uid).order('completed_at',{ascending:false})),
    result(table('athev_records').select('*').eq('user_id',uid)),
    result(table('notifications').select('*').eq('user_id',uid).order('created_at',{ascending:false}).limit(100))]);
  const exercises=ex.map(exerciseView),workouts=plans.map(w=>workoutView(w,exercises));
  const of=kind=>records.filter(r=>r.kind===kind).map(r=>({...r.payload,id:r.id,user_id:r.user_id,revision:r.revision,created_at:r.created_at}));
  const sessions=of('session'),completed=new Map(sessions.filter(s=>s.status==='completed').map(s=>[s.id,s]));
  const history=logs.map(l=>completed.has(l.id)?{...completed.get(l.id),summary:summary(completed.get(l.id).items)}:historyView(l,exercises,workouts));
  const stats=statistics(history),best=new Map();
  for(const h of [...history].reverse())for(const e of h.items)for(const s of e.sets.filter(s=>s.done))if(!best.has(e.exercise_id)||s.weight>best.get(e.exercise_id).weight)best.set(e.exercise_id,{exercise_id:e.exercise_id,name:e.name||'Exercício',weight:s.weight,achieved_at:h.started_at});
  stats.records=best.size;
  const catalog=await result(table('athev_catalog').select('*'));
  const list=kind=>catalog.filter(r=>r.kind===kind).map(r=>({...r.payload,id:r.id}));
  const active=sessions.find(s=>s.status==='active');if(active)active.summary=summary(active.items);
  const achievements=[{id:'first',title:'Primeiro passo',description:'Conclua seu primeiro treino.',threshold:1,metric:'total',xp:100},
    {id:'ten',title:'Consistência',description:'Conclua dez treinos.',threshold:10,metric:'total',xp:300}].map(a=>({...a,unlocked_at:stats.total>=a.threshold?history.at(-a.threshold)?.started_at:null}));
  return {user,exercises,workouts:workouts.filter(w=>!w.is_template),history,stats,active:active||null,
    favorites:of('favorite').map(r=>r.exercise_id),measurements:of('measurement').sort((a,b)=>a.date.localeCompare(b.date)),
    photos:of('photo').map(({image,...p})=>p),events:of('event'),nutrition:of('nutrition').filter(r=>r.date===today()),
    records:[...best.values()],notifications:notes.map(n=>({...n,kind:n.type,body:n.message,read:n.is_read})),
    membership:of('membership')[0]||null,plans:list('plan'),gyms:list('gym'),classes:list('class'),payments:of('payment'),checkins:of('checkin'),
    achievements,challenges:[],occupancy:null,notes:of('trainer_note')};
}

export async function api(path,method='GET',data={}){
  if(path==='/login'){
    localStorage.setItem('athev-remember',String(!!data.remember));
    const {data:r,error}=await db.auth.signInWithPassword({email:data.email.trim(),password:data.password});
    if(error)fail(error.code==='invalid_credentials'?'E-mail ou senha inválidos. Use sua conta do ATHEV.':error.message,401);
    if(r.user.user_metadata?.fitness_profile && !(await rows('profile',r.user.id)).length)await api('/profile','PUT',r.user.user_metadata.fitness_profile);
    return {user:await profile(r.user.id,r.user),csrf:''};
  }
  if(path==='/register'){
    if(!data.consent)fail('Aceite os termos para criar sua conta.');
    const fitness_profile=Object.fromEntries(['name','birth_date','sex','height','weight','goal','level','consent'].map(k=>[k,data[k]]));
    const {data:r,error}=await db.auth.signUp({email:data.email.trim(),password:data.password,options:{emailRedirectTo:location.origin, data:{full_name:data.name,fitness_profile}}});
    if(error)fail(error.message);
    if(r.session){await api('/profile','PUT',data);await db.auth.signOut();}
    return {message:'Cadastro enviado. Confira seu e-mail para confirmar a conta e depois entre com sua senha.'};
  }
  if(path==='/recover'){
    const {error}=await db.auth.resetPasswordForEmail(data.email.trim(),{redirectTo:location.origin+'/#reset-password'});
    if(error)fail(error.message);return {message:'Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.'};
  }
  if(path==='/logout'){const {error}=await db.auth.signOut();if(error)fail(error.message);return {ok:true};}
  const auth=await authUser(),uid=auth.id;
  if(path==='/me')return {user:await profile(uid,auth),csrf:''};
  if(path==='/bootstrap')return bootstrap(uid,auth);
  if(path==='/profile'){
    const existing=(await rows('profile',uid))[0];
    const allowed=['birth_date','height','level','goal','consent','preferences','nutrition_goals','professional'];
    const extra={...existing};for(const k of allowed)if(k in data)extra[k]=data[k];
    await write('profile',uid,extra,existing?.id,existing?.revision);
    const p={id:uid};for(const [a,b] of Object.entries({name:'full_name',avatar:'avatar_url',weight:'weight_kg',sex:'gender'}))if(a in data)p[b]=a==='weight'?Number(data[a]):data[a];
    if(Object.keys(p).length>1){
      const found=await result(table('profiles').select('id').eq('id',uid).maybeSingle());
      if(found){const {id,...changes}=p;await result(table('profiles').update(changes).eq('id',uid));}
      else await result(table('profiles').insert({...p,full_name:p.full_name||auth.user_metadata?.full_name||'Membro ATHEV'}));
    }
    return {ok:true};
  }
  if(path==='/password'||path==='/reset-password'){
    if(path==='/password'){const {error}=await db.auth.signInWithPassword({email:auth.email,password:data.old});if(error)fail('Senha atual incorreta.');}
    const {error}=await db.auth.updateUser({password:data.password});if(error)fail(error.message);
    await db.auth.signOut({scope:'others'});return {ok:true};
  }
  if(path==='/export')return {...await bootstrap(uid,auth),saved_records:await result(table('athev_records').select('*').eq('user_id',uid))};
  if(path==='/account')fail('Para excluir a conta e todos os dados, solicite a exclusão à administração.');
  if(path==='/notifications/read'){
    let q=table('notifications').update({is_read:true}).eq('user_id',uid);if(data.id)q=q.eq('id',data.id);await result(q);return {ok:true};
  }
  if(path==='/favorite'){
    const found=(await rows('favorite',uid)).find(r=>r.exercise_id===data.exercise_id);
    if(found&&!data.value)return remove('favorite',uid,found.id);
    if(!found&&data.value)return write('favorite',uid,{exercise_id:data.exercise_id});return {ok:true};
  }
  const parts=path.split('/').filter(Boolean),[resource,id,action]=parts;
  if(ownKinds[resource]){
    const kind=ownKinds[resource],owner=data.user_id||uid;
    if(method==='DELETE')return remove(kind,uid,id);
    if(method==='GET'){const r=(await rows(kind,uid)).find(r=>r.id===id);if(!r)fail('Registro não encontrado.',404);return r;}
    const payload={...data};
    if(kind==='nutrition')for(const k of ['calories','protein','carbs','fat','water'])payload[k]=Number(payload[k])||0;
    if(kind==='measurement')for(const k of ['weight','height','fat','arm','forearm','chest','waist','abdomen','hip','thigh','calf'])if(payload[k]!==undefined)payload[k]=payload[k]===''?null:Number(payload[k]);
    if(id){const current=(await rows(kind,owner)).find(r=>r.id===id);if(!current)fail('Registro não encontrado.',404);return write(kind,owner,{...current,...payload},id,current.revision);}
    return write(kind,owner,payload);
  }
  if(resource==='workouts'){
    if(method==='DELETE'){await result(table('workout_plans').update({is_active:false}).eq('id',id));return {ok:true};}
    let payload=data;
    if(action==='duplicate'){
      const ex=(await result(table('exercises').select('*'))).map(exerciseView);
      const w=workoutView(await result(table('workout_plans').select('*,workout_exercises(*)').eq('id',id).single()),ex);
      payload={...w,name:w.name+' · cópia',user_id:data.user_id||uid,is_template:false};
    }
    return result(db.rpc('athev_save_workout',{p_id:action==='duplicate'?null:id||null,p_data:payload}));
  }
  if(resource==='sessions'){
    if(id==='start'){
      const ex=(await result(table('exercises').select('*'))).map(exerciseView);
      const raw=await result(table('workout_plans').select('*,workout_exercises(*)').eq('id',data.workout_id).eq('user_id',uid).single());
      const w=workoutView(raw,ex);
      if(!w.items.length)fail('Adicione exercícios à ficha antes de iniciar.');
      const value={workout_id:w.id,name:w.name,started_at:new Date().toISOString(),status:'active',notes:'',rest_until:0,
        items:w.items.map(e=>({...e,key:e.id,previous_weight:e.weight,sets:Array.from({length:e.sets},()=>({weight:e.weight,reps:e.reps,done:false}))}))};
      const saved=await write('session',uid,value);return {...saved,summary:summary(saved.items)};
    }
    const current=(await rows('session',uid)).find(s=>s.id===id);if(!current)fail('Treino não encontrado.',404);
    if(action==='finish')return result(db.rpc('athev_finish_session',{p_id:id,p_difficulty:data.difficulty||'Ideal'}));
    if(current.status!=='active')fail('Este treino já foi encerrado. Atualize a página.',409);
    if(action==='discard')return write('session',uid,{...current,status:'discarded'},id,current.revision);
    const before=current.items.flatMap(e=>e.sets).filter(s=>s.done).length,after=data.items.flatMap(e=>e.sets).filter(s=>s.done).length;
    const rest=data.skip_rest?0:after>before?Date.now()/1000+(data.items.find(e=>e.sets.some(s=>s.done))?.rest||60):current.rest_until;
    const saved=await write('session',uid,{...current,items:data.items,notes:data.notes,rest_until:rest},id,current.revision);
    return {...saved,summary:summary(saved.items)};
  }
  if(path==='/assistant'){
    const d=await bootstrap(uid,auth),q=data.message.toLocaleLowerCase('pt-BR');
    const ex=d.exercises.find(e=>q.includes(e.name.toLocaleLowerCase('pt-BR')));
    return {answer:ex?`${ex.name}: ${ex.instructions}`:`Você tem ${d.workouts.length} fichas e ${d.stats.total} treinos concluídos. Informe o nome de um exercício da biblioteca para consultar as instruções cadastradas.`};
  }
  if(resource==='staff')return staff(parts.slice(1),method,data,auth);
  if(path==='/membership')fail('Nenhum plano contratado. Entre em contato com a administração da academia.');
  if(path==='/access-token'||path==='/checkin')fail('O controle de acesso da academia ainda não foi configurado.');
  fail('Esta operação ainda não está configurada para a sua academia.');
}

async function staff(parts,method,data,auth){
  const me=await profile(auth.id,auth);if(!['ADMIN','PROFESSOR'].includes(me.role))fail('Acesso restrito.',403);
  const [section,id]=parts;
  if(section==='students'&&id)return bootstrap(id);
  if(section==='templates'){
    const ex=(await result(table('exercises').select('*'))).map(exerciseView);
    return (await result(table('workout_plans').select('*,workout_exercises(*)').eq('created_by',auth.id).eq('is_active',true))).map(w=>workoutView(w,ex)).filter(w=>w.is_template);
  }
  const profiles=await result(table('profiles').select('*').order('full_name'));
  const users=await Promise.all(profiles.map(p=>profile(p.id)));
  if(section==='students')return users.filter(u=>u.role==='ALUNO');
  if(section==='notes')return write('trainer_note',data.student_id,{body:data.body,trainer_name:me.name,trainer_id:auth.id});
  if(me.role!=='ADMIN')fail('Somente a administração pode realizar esta operação.',403);
  if(section==='overview'){
    const catalog=await result(table('athev_catalog').select('*'));
    const list=kind=>catalog.filter(r=>r.kind===kind).map(r=>({...r.payload,id:r.id}));
    const all=await result(table('athev_records').select('*').in('kind',['payment','checkin']));
    const owned=kind=>all.filter(r=>r.kind===kind).map(r=>({...r.payload,id:r.id,name:users.find(u=>u.id===r.user_id)?.name||''}));
    return {users,gyms:list('gym'),plans:list('plan'),classes:list('class'),payments:owned('payment'),checkins:owned('checkin'),audit:[],assignments:[]};
  }
  if(['gyms','plans','classes'].includes(section)){
    const kind={gyms:'gym',plans:'plan',classes:'class'}[section];
    if(method==='DELETE'){await result(table('athev_catalog').delete().eq('id',id).eq('kind',kind));return {ok:true};}
    const payload={...data};for(const key of ['price','duration','capacity','cancel_minutes'])if(key in payload)payload[key]=Number(payload[key]);
    if(kind==='class')payload.reserved=0;
    await result(table('athev_catalog').upsert({id:id||uuid(),kind,payload}));return {ok:true};
  }
  if(section==='exercises'){
    const payload={name:data.name,muscle_groups:[data.muscle],equipment:data.equipment,description:data.instructions,mobile_details:{tip:data.tip,mistake:data.mistake},created_by:auth.id};
    await result(id?table('exercises').update(payload).eq('id',id):table('exercises').insert(payload));return {ok:true};
  }
  if(section==='notifications'){
    const recipients=data.user_id?[data.user_id]:users.map(u=>u.id);
    await result(table('notifications').insert(recipients.map(user_id=>({user_id,title:data.title,message:data.body,type:'system'}))));return {count:recipients.length};
  }
  if(section==='payments')return write('payment',data.user_id,{amount:Number(data.amount),due_date:data.due_date,status:'Pendente'});
  if(section==='users')fail('As contas são gerenciadas pelo Supabase Auth. Novos alunos devem usar Cadastre-se.');
  fail('Operação administrativa ainda não configurada.');
}
