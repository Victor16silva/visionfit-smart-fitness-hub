import test from 'node:test';
import assert from 'node:assert/strict';
import { summary,statistics,exerciseView,workoutView,historyView } from '../js/cloud-model.js';

test('somente séries concluídas entram nos resultados',()=>{
 assert.deepEqual(summary([{sets:[{done:true,reps:10,weight:20},{done:false,reps:15,weight:100}]}]),{sets:1,reps:10,volume:200,exercises:1});
});
test('UUIDs do Supabase permanecem intactos na ficha e no histórico',()=>{
 const eid='4f19f76a-fb2b-4d18-a8f9-99dd4790d551',wid='8f19f76a-fb2b-4d18-a8f9-99dd4790d551';
 const ex=[exerciseView({id:eid,name:'Exercício',muscle_groups:['Peito']})];
 const w=workoutView({id:wid,day_of_week:'2',workout_exercises:[{id:'item',exercise_id:eid,order_index:0,sets:3,reps_max:12,mobile_details:{weight:25}}]},ex);
 assert.equal(w.items[0].exercise_id,eid);assert.equal(w.day,2);assert.equal(w.items[0].weight,25);
 const h=historyView({workout_plan_id:wid,completed_at:new Date().toISOString(),duration_minutes:30,exercise_logs:[{exercise_id:eid,set_number:1,reps:12,weight_kg:'25',completed:true}]},ex,[w]);
 assert.equal(h.items[0].exercise_id,eid);assert.equal(h.duration,1800);assert.equal(h.summary.volume,300);
});
test('conta sem dados não recebe histórico ou progresso fictício',()=>{
 const s=statistics([]);assert.equal(s.total,0);assert.equal(s.xp,0);assert.equal(s.volume,0);assert.deepEqual(s.frequency,[]);
});
