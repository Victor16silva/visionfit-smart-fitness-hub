import {startSocialAuth,socialCallbackError} from "./social-auth.js";
import { supabase } from './supabase.js';
import {S,api} from './state.js';
import {registerWebMCP} from './webmcp.js';
import {icon,esc,num,money,dateISO,dateLabel,clock,duration,btn,field,select,textarea,formFoot,modal,toast,download,stat} from './ui.js';
import {authView,shell,view,isManager,isTrainer} from './views.js';
import {legal,exerciseDetail,workoutDetail,newEditor,readEditor,editorView,findWorkout,measurementForm,eventForm,photoForm,foodForm,nutritionGoals,profileForm,historyDetail,finishForm,invoice,userForm,entityForm} from './forms.js';

const app=document.querySelector('#app'),dialog=document.querySelector('#modal');
const splashStarted=performance.now();
function finishBoot(){
 const splash=document.querySelector('.splash-mobile');
 if(!splash)return;
 const minimum=window.matchMedia('(max-width: 700px)').matches?20000:0;
 setTimeout(()=>{splash.classList.add('splash-done');setTimeout(()=>splash.remove(),450);},Math.max(0,minimum-(performance.now()-splashStarted)));
}
const routes=['home','workouts','library','session','evolution','agenda','nutrition','achievements','wallet','plans','units','profile','notifications','assistant','trainer','admin'];
let pendingConfirm=null,saveChain=Promise.resolve(),saveRevision=0,lastRest=0,guideTimer=0,routeRevision=0,saveError=null;
function close(){dialog.close();clearInterval(guideTimer);S.guide=null;}
function render(){
 const scroll=window.scrollY;app.innerHTML=S.user&&S.data&&S.auth!=='reset-password'?shell(view()):authView();window.scrollTo(0,scroll);
 document.title='ATHEV · '+({home:'Início',workouts:'Meus treinos',library:'Exercícios',session:'Treino em andamento',evolution:'Evolução',agenda:'Agenda',nutrition:'Nutrição',profile:'Meu perfil',trainer:'Professor',admin:'Administração'}[S.route]||'Train. Evolve. Conquer.');
 if(S.route==='assistant')scrollChat();
}
function scrollChat(){const c=document.querySelector('#chat-box');if(c)c.scrollTop=c.scrollHeight;}
async function loadExtra(){
 if(S.route==='trainer'&&isTrainer()){
  [S.students,S.templates]=await Promise.all([api('/staff/students'),api('/staff/templates')]);
  if(S.student)S.student=await api('/staff/students/'+S.student.user.id);
 }
 if(S.route==='admin'&&['ADMIN','GERENTE','RECEPCIONISTA'].includes(S.user.role)){
  [S.staff,S.students]=await Promise.all([api('/staff/overview'),api('/staff/students')]);
  if(S.user.role==='RECEPCIONISTA'&&!['acessos','alunos','aulas'].includes(S.adminSection))S.adminSection='acessos';
 }
}
async function refresh(){S.data=await api('/bootstrap');S.user=S.data.user;await loadExtra();render();}
async function routeLoad(){
 if(!S.user||!S.data)return;const revision=++routeRevision;
 let route=location.hash.slice(1)||'home';if(!routes.includes(route))route='home';
 if(route==='trainer'&&!isTrainer())route='home';
 if(route==='admin'&&!['ADMIN','GERENTE','RECEPCIONISTA'].includes(S.user.role))route='home';
 S.route=route;close();
 try{await saveChain;await loadExtra();if(revision!==routeRevision)return;render();window.scrollTo(0,0);}catch(e){toast(e.message,true);}
}
function go(route){if(location.hash==='#'+route)routeLoad();else location.hash=route;}
function confirmAction(title,body,callback,label='Confirmar'){pendingConfirm=callback;modal(title,`<p class="muted">${body}</p><div class="modal-foot">${btn('Voltar','close','','secondary')}${btn(label,'confirm-run','','primary','check')}</div>`);}
async function successRefresh(message){close();await refresh();if(message)toast(message);}
async function persistSession(skipRest=false){
 const active=S.data.active;if(!active)return;
 const sid=active.id,payload={items:structuredClone(active.items),notes:active.notes||'',skip_rest:skipRest},revision=++saveRevision;
 const task=saveChain.then(()=>api('/sessions/'+sid,'PUT',payload));saveChain=task.catch(()=>{});
 try{const result=await task;saveError=null;if(revision===saveRevision&&S.data.active?.id===sid)S.data.active=result;return result;}catch(e){saveError=e;toast('Não foi possível salvar: '+e.message,true);throw e;}
}
async function startWorkout(id){await saveChain;if(S.data.active){close();go('session');toast('Continuando o treino em andamento.');return;}S.data.active=await api('/sessions/start','POST',{workout_id:id});close();go('session');}
function updateGuide(delta){
 const g=S.guide;if(!g)return;const e=S.data.exercises.find(e=>e.id===g.id),steps=e.instructions.split('|');g.index=(g.index+delta+steps.length)%steps.length;
 const stage=document.querySelector('#guide-stage');if(!stage)return;document.querySelector('#guide-number').textContent=`PASSO ${g.index+1} DE ${steps.length}`;
 document.querySelector('#guide-text').textContent=steps[g.index];stage.classList.remove('playing');void stage.offsetWidth;stage.classList.add('playing');
}
async function showQR(){const r=await api('/access-token','POST',{});S.qr=r;document.querySelector('#qr-content').innerHTML=`<div class="eyebrow">SEU ACESSO ATHEV</div><div class="qr-code">${r.svg}</div><p class="tiny muted">Válido por <strong class="gold" id="qr-countdown">60</strong> segundos</p><p class="token-text">${esc(r.token)}</p>${btn('Copiar token','qr-copy','','secondary','copy')}<div class="section-gap">${btn('Gerar novo código','qr-generate','','ghost','qr')}</div>`;}
async function ask(question){
 S.messages.push({role:'user',text:question});render();
 const input=document.querySelector('#chat-form input'),submit=document.querySelector('#chat-form button');if(input)input.disabled=true;if(submit)submit.disabled=true;
 try{const result=await api('/assistant','POST',{message:question});S.messages.push({role:'assistant',text:result.answer});}catch(e){S.messages.push({role:'assistant',text:'Não consegui consultar agora. '+e.message});}
 render();document.querySelector('#chat-form input')?.focus();
}
function recoveryResult(result){S.auth='login';render();toast(result.message);}

async function handleAction(action,id,el){
 if(['set-check','finish-open'].includes(action)){
  const invalid=[...document.querySelectorAll('[data-set]')].find(input=>input.value===''||!input.checkValidity());
  if(invalid){invalid.reportValidity();invalid.focus();throw new Error('Revise a carga e as repetições antes de concluir.');}
 }
 switch(action){
 case 'social-login':{const remember=document.querySelector('#login-form [name=remember]');localStorage.setItem('athev-remember',String(remember?.checked??true));await startSocialAuth(id,{client:supabase,url:import.meta.env.VITE_SUPABASE_URL,key:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,origin:location.origin});break;}
 case 'close':close();break;
 case 'confirm-run':{const fn=pendingConfirm;pendingConfirm=null;if(fn)await fn();break;}
 case 'legal':legal();break;
 case 'register':S.auth='register';render();window.scrollTo(0,0);break;
 case 'recover':S.auth='recover';render();break;
 case 'auth-login':S.auth='login';render();break;
 case 'toggle-password':{const input=el.closest('.password-wrap').querySelector('input');input.type=input.type==='password'?'text':'password';break;}
 case 'demo-login':{const f=document.querySelector('#login-form');f.elements.email.value=id+'@athev.local';f.elements.password.value='Athev@123';f.requestSubmit();break;}
 case 'recovery-download':download('ATHEV-codigo-recuperacao.txt','Código de recuperação ATHEV\n'+id+'\nGuarde em um local seguro.','text/plain');break;
 case 'logout':await saveChain;await api('/logout','POST',{});S.user=null;S.data=null;S.messages=[];S.student=null;S.staff=null;S.csrf='';S.auth='login';history.replaceState(null,'',location.pathname);close();render();break;
 case 'resume':close();go('session');break;
 case 'start':await startWorkout(id);break;
 case 'workout-detail':workoutDetail(id);break;
 case 'workout-new':newEditor();break;
 case 'workout-student':newEditor(null,id);break;
 case 'template-new':newEditor(null,S.user.id,true);break;
 case 'workout-edit':newEditor(findWorkout(id));break;
 case 'workout-copy':await api('/workouts/'+id+'/duplicate','POST',{});await successRefresh('Ficha duplicada.');break;
 case 'workout-delete':{const w=findWorkout(id);confirmAction('Excluir ficha?',`${esc(w?.name)} será removida. Os treinos já concluídos continuam no histórico.`,async()=>{await api('/workouts/'+id,'DELETE',{});await successRefresh('Ficha excluída.');},'Excluir ficha');break;}
 case 'template-assign':modal('Usar template com aluno',`<form id="template-form" data-id="${id}">${select('Aluno','user_id',S.students.map(s=>[s.id,s.name]))}${formFoot('Criar ficha do aluno')}</form>`);break;
 case 'editor-add':readEditor();if(S.editor.items.length>=30)throw new Error('Limite de 30 exercícios por ficha.');S.editor.items.push({exercise_id:S.data.exercises[0].id,sets:3,reps:10,weight:0,rest:60,technique:'Tradicional',notes:''});editorView();break;
 case 'editor-remove':readEditor();if(S.editor.items.length===1)throw new Error('A ficha precisa de pelo menos um exercício.');S.editor.items.splice(id,1);editorView();break;
 case 'exercise':clearInterval(guideTimer);exerciseDetail(id);break;
 case 'exercise-tab':{clearInterval(guideTimer);const [eid,tab]=id.split(':');exerciseDetail(eid,tab);break;}
 case 'favorite':case 'favorite-detail':{const value=!S.data.favorites.includes(id);await api('/favorite','POST',{exercise_id:id,value});S.data.favorites=value?[...S.data.favorites,id]:S.data.favorites.filter(x=>x!==id);render();if(action==='favorite-detail')el.classList.toggle('active',value);toast(value?'Exercício favoritado.':'Favorito removido.');break;}
 case 'filter':S.filter=id;render();break;
 case 'guide-prev':updateGuide(-1);break;
 case 'guide-next':updateGuide(1);break;
 case 'guide-play':S.guide.playing=!S.guide.playing;clearInterval(guideTimer);el.innerHTML=icon(S.guide.playing?'clock':'play')+(S.guide.playing?'Pausar':'Reproduzir');if(S.guide.playing)guideTimer=setInterval(()=>updateGuide(1),3500);break;
 case 'set-check':{const [ei,si]=id.split(':').map(Number),set=S.data.active.items[ei].sets[si];set.done=!set.done;await persistSession();render();break;}
 case 'set-add':{const e=S.data.active.items[id];if(e.sets.length>=20)throw new Error('Limite de 20 séries.');e.sets.push({...e.sets.at(-1),done:false});await persistSession();render();break;}
 case 'set-remove':{const [ei,si]=id.split(':').map(Number),e=S.data.active.items[ei];if(e.sets.length===1)throw new Error('Mantenha pelo menos uma série por exercício.');e.sets.splice(si,1);await persistSession();render();break;}
 case 'skip-rest':await persistSession(true);render();break;
 case 'substitute':{const e=S.data.active.items[id];modal('Substituir exercício',`<form id="substitute-form" data-index="${id}"><p class="tiny muted">As séries deste exercício serão reiniciadas. Os demais exercícios permanecem salvos.</p>${select('Novo exercício','exercise_id',S.data.exercises.filter(x=>x.id!==e.exercise_id).map(x=>[x.id,x.name+' · '+x.muscle]))}${formFoot('Substituir')}</form>`);break;}
 case 'finish-open':await saveChain;if(saveError)await persistSession();finishForm();break;
 case 'discard':confirmAction('Descartar este treino?','As séries desta sessão não entrarão nas estatísticas.',async()=>{await saveChain;await api('/sessions/'+S.data.active.id+'/discard','POST',{});await successRefresh('Sessão descartada.');go('workouts');},'Descartar');break;
 case 'history':historyDetail(S.data.history.find(h=>h.id===id));break;
 case 'student-history':historyDetail(S.student.history.find(h=>h.id===id));break;
 case 'evo-tab':S.evolutionTab=id;render();break;
 case 'period':S.period=id;render();break;
 case 'measurement-new':measurementForm();break;
 case 'measurement-student':measurementForm(id);break;
 case 'photo-new':photoForm();break;
 case 'photo-delete':confirmAction('Excluir foto?','Este registro fotográfico será removido do banco do ATHEV.',async()=>{await api('/photos/'+id,'DELETE',{});await successRefresh('Foto excluída.');},'Excluir foto');break;
 case 'calendar-prev':case 'calendar-next':{const delta=action==='calendar-next'?1:-1;if(S.calendarMode==='week'){let dt=new Date((S.selectedDate||dateISO())+'T12:00:00');dt.setDate(dt.getDate()+7*delta);S.selectedDate=dateISO(dt);S.calendar=new Date(dt);}else{S.calendar=new Date(S.calendar.getFullYear(),S.calendar.getMonth()+delta,1);S.selectedDate='';}render();break;}
 case 'calendar-mode':S.calendarMode=S.calendarMode==='month'?'week':'month';render();break;
 case 'calendar-today':S.calendar=new Date();S.selectedDate=dateISO();render();break;
 case 'calendar-select':S.selectedDate=id;render();break;
 case 'calendar-clear':S.selectedDate='';render();break;
 case 'event-new':eventForm();break;
 case 'student-schedule':eventForm(null,id);break;
 case 'event-edit':eventForm(S.data.events.find(e=>e.id===id));break;
 case 'event-delete':confirmAction('Excluir atividade?','O compromisso será removido da agenda.',async()=>{await api('/events/'+id,'DELETE',{});await successRefresh('Atividade excluída.');},'Excluir');break;
 case 'reserve':await api('/classes/'+id+'/reservation','POST',{});await successRefresh('Reserva confirmada!');break;
 case 'cancel-reservation':confirmAction('Cancelar reserva?','Sua vaga será liberada se estiver dentro do prazo de cancelamento da aula.',async()=>{await api('/classes/'+id+'/reservation','DELETE',{});await successRefresh('Reserva cancelada.');},'Cancelar reserva');break;
 case 'food-new':foodForm();break;
 case 'food-delete':await api('/nutrition/'+id,'DELETE',{});await successRefresh('Registro removido.');break;
 case 'water':await api('/nutrition','POST',{date:dateISO(),meal:'Água',food:'Água',water:id});await refresh();toast('+'+id+' ml registrados.');break;
 case 'nutrition-goals':nutritionGoals();break;
 case 'qr-generate':await showQR();break;
 case 'qr-copy':if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(S.qr.token);toast('Token copiado.');}else{const range=document.createRange();range.selectNodeContents(document.querySelector('.token-text'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);toast('Token selecionado. Toque e segure para copiar.');}break;
 case 'plan-change':{const p=S.data.plans.find(p=>p.id===id);confirmAction('Alterar plano local?',`Seu cadastro passará para ${esc(p.name)} (${money(p.price)}/mês). Nenhum valor será cobrado.`,async()=>{await api('/membership','PUT',{plan_id:id});await successRefresh('Plano atualizado na demonstração.');},'Alterar plano');break;}
 case 'plan-cancel':{const previous=!!S.data.membership?.cancel_requested;await api('/membership','PUT',{cancel_requested:!previous});await successRefresh(previous?'Solicitação retirada.':'Solicitação registrada para análise da administração.');break;}
 case 'gym-favorite':await api('/membership','PUT',{gym_id:id});await successRefresh('Unidade favorita atualizada.');break;
 case 'payment-method':modal('Forma de pagamento',`<form id="payment-method-form">${select('Método preferido','payment_method',['Pix (demonstração)','Boleto (demonstração)','Cartão (a configurar)'],S.data.membership?.payment_method)}<p class="tiny muted">Esta preferência fica registrada localmente. Não informe números de cartão.</p>${formFoot('Salvar preferência')}</form>`);break;
 case 'pay-simulate':confirmAction('Simular pagamento?','A fatura será marcada como paga no banco do ATHEV. Nenhuma cobrança real será realizada.',async()=>{await api('/payments/'+id+'/simulate','POST',{});await successRefresh('Pagamento simulado registrado.');},'Simular pagamento');break;
 case 'invoice':invoice(S.data.payments.find(p=>p.id===id));break;
 case 'print':window.print();break;
 case 'profile-edit':profileForm();break;
 case 'avatar':modal('Sua foto de perfil',`<form id="avatar-form">${field('Selecione uma imagem','image','','file','required accept="image/jpeg,image/png,image/webp"')}${formFoot('Salvar foto')}</form>`);break;
 case 'password-open':modal('Alterar senha',`<form id="password-form">${field('Senha atual','old','','password','required autocomplete="current-password"')}${field('Nova senha','password','','password','required minlength="8" maxlength="128" autocomplete="new-password"')}${formFoot('Alterar senha')}</form>`);break;
 case 'account-delete':toast('Solicite a exclusão da conta à administração do ATHEV.');break;
 case 'legacy-account-delete':modal('Excluir minha conta',`<form id="delete-account-form"><p class="red">A conta e seus registros serão excluídos do banco ativo. Esta ação é permanente.</p><p class="tiny muted">Você pode exportar os dados no perfil antes de continuar.</p>${field('Confirme sua senha','password','','password','required autocomplete="current-password"')}${formFoot('Excluir definitivamente')}</form>`);break;
 case 'export':download('ATHEV-meus-dados-'+dateISO()+'.json',JSON.stringify(await api('/export'),null,2));toast('Exportação preparada.');break;
 case 'notifications-read':await api('/notifications/read','POST',{});await refresh();toast('Notificações marcadas como lidas.');break;
 case 'notification-read':await api('/notifications/read','POST',{id:id});await refresh();break;
 case 'ask-suggestion':await ask(id);break;
 case 'student-open':S.student=await api('/staff/students/'+id);go('trainer');break;
 case 'student-back':S.student=null;render();break;
 case 'trainer-note':modal('Observação do professor',`<form id="trainer-note-form"><input type="hidden" name="student_id" value="${id}">${textarea('Observação','body','','required maxlength="2000"')}${formFoot('Salvar observação')}</form>`);break;
 case 'admin-section':S.adminSection=id;S.adminSearch='';S.adminStatus='';render();break;
 case 'admin-user-new':userForm(null,id);break;
 case 'admin-user-edit':userForm(S.staff.users.find(u=>u.id===id));break;
 case 'admin-block':{const u=S.staff.users.find(u=>u.id===id);confirmAction((u.active?'Bloquear':'Desbloquear')+' conta?',`${esc(u.name)} ${u.active?'não poderá acessar o aplicativo e suas sessões serão encerradas.':'poderá acessar o aplicativo novamente.'}`,async()=>{await api('/staff/users/'+id,'PUT',{active:!u.active});await successRefresh('Cadastro atualizado.');});break;}
 case 'entity-new':entityForm(id);break;
 case 'entity-edit':{const [type,entityId]=id.split(':');entityForm(type,entityId);break;}
 case 'class-delete':confirmAction('Excluir aula?','A exclusão só será permitida se não existirem reservas.',async()=>{await api('/staff/classes/'+id,'DELETE',{});await successRefresh('Aula excluída.');},'Excluir aula');break;
 case 'invoice-new':modal('Emitir fatura demonstrativa',`<form id="invoice-form">${select('Aluno','user_id',S.staff.users.filter(u=>u.role==='ALUNO').map(u=>[u.id,u.name]))}${field('Valor (R$)','amount','','number','required min="1" max="100000" step="0.01"')}${field('Vencimento','due_date',dateISO(),'date','required')}<div class="notice">A fatura ficará somente no banco do ATHEV. Não haverá cobrança bancária.</div>${formFoot('Criar fatura local')}</form>`);break;
 case 'report':{const source=S.staff[id];if(!Array.isArray(source)||!source.length)throw new Error('Não há registros para exportar.');const keys=Object.keys(source[0]);const csvValue=v=>{let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};download('ATHEV-'+id+'-'+dateISO()+'.csv','\ufeff'+[keys,...source.map(r=>keys.map(k=>r[k]))].map(row=>row.map(csvValue).join(';')).join('\r\n'),'text/csv;charset=utf-8');toast('Relatório exportado.');break;}
 default:throw new Error('Ação não encontrada. Atualize a página.');
 }
}

document.addEventListener('click',async event=>{
 const el=event.target.closest('[data-action]');if(!el||el.disabled)return;
 event.preventDefault();const action=el.dataset.action;
 const asyncAction=!['close','register','recover','auth-login','toggle-password','filter','evo-tab','period','calendar-select','calendar-clear','calendar-mode','calendar-today','calendar-next','calendar-prev','admin-section','guide-play','guide-next','guide-prev'].includes(action);
 if(asyncAction)el.disabled=true;
 try{await handleAction(action,el.dataset.id||'',el);}catch(e){toast(e.message,true);if(e.status===401&&S.user){S.user=null;S.data=null;render();}}finally{if(el.isConnected)el.disabled=false;}
});

document.addEventListener('submit',async event=>{
 const form=event.target;if(!(form instanceof HTMLFormElement))return;
 event.preventDefault();const submit=form.querySelector('[type=submit],button:not([type])');if(form.dataset.busy)return;
 form.dataset.busy='1';if(submit)submit.disabled=true;
 const data=Object.fromEntries(new FormData(form)),err=form.querySelector('.form-error');if(err)err.textContent='';
 try{
 switch(form.id){
 case 'login-form':{data.remember=form.elements.remember.checked;const result=await api('/login','POST',data);S.user=result.user;S.csrf=result.csrf;S.data=await api('/bootstrap');S.messages=[];S.student=null;const landing=S.user.role==='PROFESSOR'?'trainer':['ADMIN','GERENTE','RECEPCIONISTA'].includes(S.user.role)?'admin':'home';history.replaceState(null,'','#'+landing);await routeLoad();break;}
 case 'register-form':data.consent=form.elements.consent.checked;recoveryResult(await api('/register','POST',data));break;
 case 'reset-password-form':await api('/reset-password','POST',data);S.auth='login';await supabase.auth.signOut();S.user=null;S.data=null;history.replaceState(null,'',location.pathname);render();toast('Senha atualizada. Entre com a nova senha.');break;
 case 'recover-form':recoveryResult(await api('/recover','POST',data));break;
 case 'workout-form':{const w=readEditor();await api('/workouts'+(w.id?'/'+w.id:''),w.id?'PUT':'POST',{...w,is_template:!!w.is_template});S.editor=null;await successRefresh('Ficha salva com sucesso.');break;}
 case 'template-form':await api('/workouts/'+form.dataset.id+'/duplicate','POST',data);await successRefresh('Template atribuído ao aluno.');break;
 case 'measurement-form':await api('/measurements','POST',data);await successRefresh('Medidas registradas.');break;
 case 'photo-form':data.image=await compressImage(form.elements.image.files[0]);await api('/photos','POST',data);await successRefresh('Foto de evolução salva.');break;
 case 'event-form':await api('/events'+(form.dataset.id?'/'+form.dataset.id:''),form.dataset.id?'PUT':'POST',data);await successRefresh('Agenda atualizada.');break;
 case 'food-form':await api('/nutrition','POST',data);await successRefresh('Refeição registrada.');break;
 case 'nutrition-goals-form':{const {professional,...nutrition_goals}=data;await api('/profile','PUT',{nutrition_goals,professional});await successRefresh('Metas atualizadas.');break;}
 case 'profile-form':if(!data.birth_date)delete data.birth_date;await api('/profile','PUT',data);await successRefresh('Perfil atualizado.');break;
 case 'avatar-form':await api('/profile','PUT',{avatar:await compressImage(form.elements.image.files[0],512)});await successRefresh('Foto atualizada.');break;
 case 'password-form':await api('/password','POST',data);await successRefresh('Senha alterada. Outras sessões foram encerradas.');break;
 case 'delete-account-form':await api('/account','DELETE',data);close();S.user=null;S.data=null;S.csrf='';S.auth='login';render();toast('Sua conta foi excluída do banco do ATHEV.');break;
 case 'substitute-form':{const i=Number(form.dataset.index),old=S.data.active.items[i],ex=S.data.exercises.find(e=>e.id===data.exercise_id);S.data.active.items[i]={...old,exercise_id:ex.id,name:ex.name,muscle:ex.muscle,equipment:ex.equipment,animation:ex.animation,previous_weight:0,notes:'',key:'replacement-'+Date.now()+'-'+Math.random().toString(36).slice(2),sets:old.sets.map(s=>({...s,weight:0,done:false}))};await persistSession(true);close();render();toast('Exercício substituído. Ajuste as cargas.');break;}
 case 'finish-form':{await saveChain;if(saveError)await persistSession();const result=await api('/sessions/'+S.data.active.id+'/finish','POST',data);S.data.active=null;await refresh();close();S.evolutionTab='historico';history.replaceState(null,'','#evolution');S.route='evolution';render();modal('Treino concluído',`<div class="success"><div class="success-icon">${icon('trophy')}</div><div class="eyebrow">VOCÊ FOI ALÉM</div><h2>Disciplina vira conquista.</h2><p class="muted">Seu treino foi salvo no histórico.</p><div class="grid grid-2">${stat('Tempo',duration(result.duration),'','clock')}${stat('Séries',result.summary.sets,'','dumbbell')}${stat('Repetições',result.summary.reps,'','activity')}${stat('Volume',num(result.summary.volume),'kg','weight')}</div>${result.records.length?`<div class="notice"><strong>NOVO RECORDE!</strong><br>${result.records.map(r=>esc(r.name)+' · '+num(r.weight)+' kg').join('<br>')}</div>`:''}${result.unlocked.length?`<div class="notice section-gap"><strong>CONQUISTA DESBLOQUEADA</strong><br>${result.unlocked.map(esc).join('<br>')}</div>`:''}<p class="tiny muted section-gap">Calorias não estimadas: não há dados suficientes para um cálculo confiável.</p>${btn('Continuar evoluindo','close','','primary','arrow')}</div>`);break;}
 case 'payment-method-form':await api('/membership','PUT',data);await successRefresh('Preferência salva.');break;
 case 'chat-form':await ask(data.message);break;
 case 'trainer-note-form':await api('/staff/notes','POST',data);await successRefresh('Observação registrada.');break;
 case 'checkin-form':{const result=await api('/checkin','POST',data);await refresh();modal('Acesso validado',`<div class="success"><div class="success-icon">${icon('check')}</div><h2>${esc(result.name)}</h2><p>${esc(result.message)}</p><p class="tiny muted">Validação de demonstração, sem acionamento de catraca.</p>${btn('Concluir','close','','primary')}</div>`);break;}
 case 'admin-user-form':{if(data.role&&data.role!=='ALUNO')delete data.trainer_id;const r=await api('/staff/users'+(form.dataset.id?'/'+form.dataset.id:''),form.dataset.id?'PUT':'POST',data);await successRefresh('Cadastro salvo.');if(r.recovery_code)modal('Código do novo cadastro',`<p>Entregue ao titular da conta e oriente a troca da senha inicial.</p><div class="code-box">${esc(r.recovery_code)}</div><div class="modal-foot">${btn('Baixar código','recovery-download',r.recovery_code,'secondary','download')}${btn('Concluir','close','','primary')}</div>`);break;}
 case 'entity-form':await api('/staff/'+form.dataset.type+(form.dataset.id?'/'+form.dataset.id:''),form.dataset.id?'PUT':'POST',data);await successRefresh('Cadastro atualizado.');break;
 case 'admin-notification-form':{const r=await api('/staff/notifications','POST',data);await successRefresh('Aviso processado para '+r.count+' usuários, conforme preferências.');break;}
 case 'invoice-form':await api('/staff/payments','POST',data);await successRefresh('Fatura demonstrativa criada.');break;
 default:throw new Error('Formulário não encontrado.');
 }
 }catch(e){if(err&&err.isConnected)err.textContent=e.message;else toast(e.message,true);}finally{delete form.dataset.busy;if(submit&&submit.isConnected)submit.disabled=false;}
});

document.addEventListener('change',async event=>{
 const el=event.target;
 try{
 if(el.matches('[data-set]')){
  if(!el.checkValidity()){el.reportValidity();return;}const value=Number(el.value);if(el.value===''||!Number.isFinite(value))throw new Error('Informe um valor válido.');
  S.data.active.items[Number(el.dataset.ex)].sets[Number(el.dataset.series)][el.dataset.set]=value;await persistSession();
 }
 else if(el.matches('[data-ex-note]')){S.data.active.items[Number(el.dataset.exNote)].notes=el.value;await persistSession();}
 else if(el.id==='session-notes'){S.data.active.notes=el.value;await persistSession();}
 else if(el.id==='measure-metric'){S.metric=el.value;render();}
 else if(el.id==='load-exercise'){S.loadExercise=el.value;render();}
 else if(el.id==='admin-status'){S.adminStatus=el.value;render();}
 else if(el.matches('[data-photo-slot]')){const target=document.querySelector('#photo-'+el.dataset.photoSlot);if(!el.value){target.innerHTML='<span class="tiny muted">Selecione uma foto</span>';return;}const id=el.value;target.innerHTML='<span class="loader"></span>';const p=await api('/photos/'+id);if(el.value!==id)return;target.innerHTML=`<img src="${esc(p.image)}" alt="${esc(p.angle)} · ${dateLabel(p.date)}">`;}
 else if(el.matches('[data-preference]')){await api('/profile','PUT',{preferences:{...S.data.user.preferences,[el.dataset.preference]:el.checked}});S.data.user.preferences[el.dataset.preference]=el.checked;toast('Preferência salva.');}
 else if(el.id==='consent-toggle'){await api('/profile','PUT',{consent:el.checked});S.data.user.consent=el.checked;toast(el.checked?'Consentimento registrado.':'Consentimento retirado. Você pode exportar e excluir os dados no perfil.');}
 }catch(e){toast(e.message,true);}
});
let searchTimer;
document.addEventListener('input',event=>{
 const el=event.target;if(!el.matches('[data-search]'))return;clearTimeout(searchTimer);const key=el.dataset.search;
 searchTimer=setTimeout(()=>{if(key==='library')S.search=el.value;else if(key==='students')S.studentSearch=el.value;else S.adminSearch=el.value;const start=el.selectionStart;render();const replacement=document.querySelector(`[data-search="${key}"]`);replacement?.focus();replacement?.setSelectionRange(start,start);},140);
});
async function compressImage(file,max=1000){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Escolha uma imagem JPG, PNG ou WebP.');
 if(file.size>15*1024*1024)throw new Error('A imagem original deve ter até 15 MB.');const objectUrl=URL.createObjectURL(file);
 try{const img=new Image();img.src=objectUrl;await img.decode();const ratio=Math.min(1,max/Math.max(img.width,img.height)),canvas=document.createElement('canvas');canvas.width=Math.round(img.width*ratio);canvas.height=Math.round(img.height*ratio);const ctx=canvas.getContext('2d');ctx.fillStyle='#111214';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);let quality=.82,data=canvas.toDataURL('image/jpeg',quality);while(data.length>850000&&quality>.3){quality-=.1;data=canvas.toDataURL('image/jpeg',quality);}if(data.length>850000)throw new Error('Escolha uma imagem menor.');return data;}finally{URL.revokeObjectURL(objectUrl);}
}
setInterval(()=>{
 const s=S.data?.active;
 if(s){const elapsed=Math.max(0,Math.floor((Date.now()-new Date(s.started_at).getTime())/1000));const c=document.querySelector('#session-clock');if(c)c.textContent=clock(elapsed);const rest=Math.max(0,Math.ceil(s.rest_until-Date.now()/1000)),r=document.querySelector('#rest-clock');if(r)r.textContent=clock(rest);if(lastRest>0&&rest===0&&r){toast('Descanso concluído. Pronto para a próxima série.');if(navigator.vibrate)navigator.vibrate(150);}lastRest=rest;}
 if(S.qr){const el=document.querySelector('#qr-countdown');if(el){const remain=Math.max(0,Math.ceil(S.qr.expires_at-Date.now()/1000));el.textContent=remain;if(!remain){const code=document.querySelector('.qr-code');if(code)code.style.opacity='.2';el.textContent='0 · expirado';}}}
},1000);
dialog.addEventListener('close',()=>{clearInterval(guideTimer);S.guide=null;});
window.addEventListener('hashchange',routeLoad);
window.addEventListener('online',()=>toast('Conexão restabelecida.'));
window.addEventListener('beforeunload',event=>{if(document.querySelector('#workout-form')&&S.editor){event.preventDefault();event.returnValue='';}});
async function init(){
 const oauthError=socialCallbackError(location.hash,location.search);if(oauthError){history.replaceState(null,"",location.pathname);S.auth="login";render();toast(oauthError,true);return;}
 if(location.protocol==='file:'){S.auth='login';render();finishBoot();modal('Inicie o ATHEV pelo servidor local',`<p>O projeto usa um banco de dados e autenticação. Abra a pasta no VS Code e execute <strong>npm run dev</strong>, ou use o terminal:</p><div class="code-box">npm run dev</div><p>Depois acesse <a class="gold" href="http://localhost:8000">http://localhost:8000</a>.</p>`);return;}
 try{await supabase.auth.getSession();if(location.hash==='#reset-password'){S.auth='reset-password';render();return;}const me=await api('/me');S.user=me.user;S.csrf=me.csrf;S.data=await api('/bootstrap');await routeLoad();}
 catch(e){S.user=null;S.data=null;S.auth='welcome';render();if(e.status!==401)toast(e.message,true);}finally{finishBoot();}
}
supabase.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY'){S.auth='reset-password';render();}if(event==='SIGNED_OUT'){S.user=null;S.data=null;S.auth='login';render();}});
init().finally(finishBoot);
registerWebMCP(refresh);
