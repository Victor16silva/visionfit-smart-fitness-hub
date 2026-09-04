// Tests of real HTML template generation. No browser or third-party dependencies.
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,join,resolve,relative,isAbsolute} from 'node:path';
import {S} from '../js/state.js';
import {view,shell,authView} from '../js/views.js';
import * as forms from '../js/forms.js';
import {esc,clock,chart} from '../js/ui.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const temp=mkdtempSync(join(root,'tests','.tmp-ui-'));
const python=process.env.ATHEV_PYTHON||'python';
let count=0;
try{
 const source=`import json
from backend import db
from backend.api import bootstrap,staff_dispatch
db.initialize()
c=db.connect()
u=db.one(c,'SELECT id,name,email,role,active FROM users WHERE id=3')
student=db.one(c,'SELECT id,name,email,role,active FROM users WHERE id=1')
print(json.dumps(dict(data=bootstrap(c,student),admin=bootstrap(c,u),staff=staff_dispatch(c,'GET','/api/staff/overview',{}, {},u),students=staff_dispatch(c,'GET','/api/staff/students',{}, {},u),templates=staff_dispatch(c,'GET','/api/staff/templates',{}, {},u),student=staff_dispatch(c,'GET','/api/staff/students/1',{}, {},u))))
c.close()`;
 const result=spawnSync(python,['-c',source],{cwd:root,env:{...process.env,ATHEV_DB:join(temp,'fixture.db')},encoding:'utf8',maxBuffer:16*1024*1024});
 assert.equal(result.status,0,result.stderr||'Set ATHEV_PYTHON to your Python executable.');
 const f=JSON.parse(result.stdout);S.data=f.data;S.user=f.data.user;S.staff=f.staff;S.students=f.students;S.templates=f.templates;
 const check=html=>{assert.equal(typeof html,'string');assert(html.length>100);assert(!html.includes('undefined'),html.slice(0,100));assert(!html.includes('NaN'),html.slice(0,100));count++;};
 for(const route of ['home','workouts','library','evolution','agenda','nutrition','achievements','wallet','plans','units','profile','notifications','assistant','session']){S.route=route;check(shell(view()));}
 for(const tab of ['geral','corpo','carga','historico','fotos']){S.route='evolution';S.evolutionTab=tab;check(view());}
 for(const auth of ['login','register','recover']){S.auth=auth;check(authView());}
 S.route='library';S.filter='Peito';S.search='supino';check(view());assert(!view().includes('Remada baixa'));S.filter='Todos';S.search='';
 S.route='session';S.data.active={...S.data.history[0],id:900,rest_until:Date.now()/1000+60,ended_at:null};check(view());
 S.data=f.admin;S.user=f.admin.user;S.route='admin';
 for(const section of ['dashboard','alunos','professores','unidades','planos','financeiro','aulas','treinos','exercicios','acessos','notificacoes','relatorios','configuracoes']){S.adminSection=section;check(view());}
 S.route='trainer';S.student=null;check(view());S.student=f.student;check(view());
 // Native dialog content can also be built independently of a browser.
 const dialog={innerHTML:'',open:false,showModal(){this.open=true;},scrollTop:0};
 globalThis.document={querySelector(selector){assert.equal(selector,'#modal');return dialog;}};
 const modalCheck=fn=>{fn();check(dialog.innerHTML);};
 modalCheck(()=>forms.legal());
 for(const tab of ['execution','muscles','guide'])modalCheck(()=>forms.exerciseDetail(1,tab));
 modalCheck(()=>forms.newEditor());modalCheck(()=>forms.newEditor(f.student.workouts[0]));
 modalCheck(()=>forms.measurementForm());modalCheck(()=>forms.eventForm());modalCheck(()=>forms.photoForm());modalCheck(()=>forms.foodForm());modalCheck(()=>forms.nutritionGoals());modalCheck(()=>forms.profileForm());modalCheck(()=>forms.historyDetail(f.student.history[0]));modalCheck(()=>forms.invoice(f.student.payments[0]));modalCheck(()=>forms.userForm());
 for(const entity of ['gyms','plans','classes','exercises'])modalCheck(()=>forms.entityForm(entity));
 for(const entity of ['gyms','plans','classes','exercises'])modalCheck(()=>forms.entityForm(entity,1));
 // Empty account and escaping must remain renderable.
 S.student=null;S.data={...f.data,history:[],workouts:[],records:[],measurements:[],photos:[],nutrition:[],events:[],notifications:[],checkins:[],payments:[],active:null,stats:{total:0,week:0,month:0,streak:0,records:0,volume:0,duration:0,exercises:0,xp:0,level:1,frequency:[]},user:{...f.data.user,name:'<img src=x onerror=alert(1)>'}};S.user=S.data.user;
 for(const route of ['home','workouts','evolution','nutrition','wallet','plans','profile']){S.route=route;const html=view();check(html);assert(!html.includes('<img src=x'));}
 assert.equal(esc('<script>'),'&lt;script&gt;');assert.equal(clock(65),'01:05');check(chart([{date:'2026-09-01',value:78}], 'kg'));
 // Every statically referenced interaction must have a controller branch.
 const controller=readFileSync(join(root,'js','app.js'),'utf8');
 const supported=new Set([...controller.matchAll(/case '([^']+)'/g)].map(m=>m[1]));
 for(const filename of ['views.js','forms.js']){
  const code=readFileSync(join(root,'js',filename),'utf8');
  const direct=[...code.matchAll(/data-action="([a-z-]+)"/g)].map(m=>m[1]);
  for(const action of direct)assert(supported.has(action),'Unconnected action: '+action);
 }
 const css=readFileSync(join(root,'css','styles.css'),'utf8');
 assert(css.includes('safe-area-inset-bottom'));assert(css.includes('@media(max-width:370px)'));assert(css.includes('font-size:16px'));
 console.log(`PASS: ${count} template renders, empty states, escaping, action wiring and mobile CSS constraints.`);
}finally{
 const rel=relative(join(root,'tests'),temp);
 assert(!rel.startsWith('..')&&!isAbsolute(rel)&&rel.startsWith('.tmp-ui-'));
 rmSync(temp,{recursive:true,force:true});
}
