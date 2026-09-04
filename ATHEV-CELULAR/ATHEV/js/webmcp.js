// Optional browser capability. Ordinary navigation never depends on this API.
import {S,api} from './state.js';
export function registerWebMCP(refresh){
 const context=document.modelContext;if(!context?.registerTool)return;
 const lifecycle=new AbortController();
 const authenticated=()=>{if(!S.user||!S.data)throw new Error('Faça login no ATHEV antes de usar esta ação.');};
 const definitions=[{
  name:'athev_read_workouts',title:'Consultar minhas fichas ATHEV',
  description:'Retorna as fichas da conta conectada sem alterar dados.',
  inputSchema:{type:'object',properties:{},additionalProperties:false},
  annotations:{readOnlyHint:true,untrustedContentHint:true},
  execute(input){authenticated();if(input&&Object.keys(input).length)throw new Error('Nenhum argumento é necessário.');return {workouts:S.data.workouts.map(w=>({id:w.id,name:w.name,muscle:w.muscle,exercises:w.items.length,duration:w.duration}))};}
 },{
  name:'athev_record_water',title:'Registrar água no ATHEV',
  description:'Salva água em mililitros no diário de hoje da conta conectada e atualiza o painel.',
  inputSchema:{type:'object',properties:{milliliters:{type:'number',minimum:1,maximum:2000}},required:['milliliters'],additionalProperties:false},
  annotations:{readOnlyHint:false,untrustedContentHint:false},
  async execute(input){authenticated();if(!input||Object.keys(input).some(k=>k!=='milliliters')||!Number.isFinite(input.milliliters)||input.milliliters<1||input.milliliters>2000)throw new Error('Informe entre 1 e 2000 ml.');const result=await api('/nutrition','POST',{meal:'Água',food:'Água',water:input.milliliters});await refresh();return {id:result.id,milliliters:input.milliliters,status:'saved'};}
 }];
 for(const definition of definitions){try{Promise.resolve(context.registerTool(definition,{signal:lifecycle.signal})).catch(()=>{});}catch{/* Unsupported implementations cannot block the app. */}}
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
