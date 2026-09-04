export const today = () => new Date().toLocaleDateString('en-CA');
export function summary(items = []) {
  const done = items.flatMap(e => e.sets).filter(s => s.done);
  return { sets: done.length, reps: done.reduce((n,s)=>n+Number(s.reps),0),
    volume: done.reduce((n,s)=>n+Number(s.reps)*Number(s.weight),0),
    exercises: items.filter(e=>e.sets.some(s=>s.done)).length };
}
export function statistics(history) {
  const date = today(), monday = new Date(date+'T12:00:00');
  monday.setDate(monday.getDate()-(monday.getDay()+6)%7);
  const week = monday.toLocaleDateString('en-CA');
  const dates = new Set(history.map(h=>h.started_at.slice(0,10)));
  let streak=0, day=new Date(date+'T12:00:00');
  if(!dates.has(date))day.setDate(day.getDate()-1);
  while(dates.has(day.toLocaleDateString('en-CA'))){streak++;day.setDate(day.getDate()-1);}
  return { total:history.length,week:history.filter(h=>h.started_at.slice(0,10)>=week).length,
    month:history.filter(h=>h.started_at.startsWith(date.slice(0,7))).length,streak,
    records:0,volume:history.reduce((n,h)=>n+h.summary.volume,0),duration:history.reduce((n,h)=>n+h.duration,0),
    exercises:history.reduce((n,h)=>n+h.summary.exercises,0),xp:history.length*100,level:Math.floor(history.length/10)+1,
    frequency:history.map(h=>({date:h.started_at.slice(0,10),volume:h.summary.volume,duration:h.duration,sets:h.summary.sets})) };
}
export const exerciseView = e => ({...e,muscle:(e.muscle_groups||[]).join(' + '),equipment:e.equipment||'',
  instructions:e.description||'Consulte seu professor para orientações de execução.',tip:e.mobile_details?.tip||'',mistake:e.mobile_details?.mistake||'',animation:''});
export function workoutView(w,exercises) {
  return {...w,day:Number(w.day_of_week)||0,muscle:(w.muscle_groups||[]).join(' + '),duration:w.duration_minutes||60,
    notes:w.description||'',level:w.mobile_details?.level||'Iniciante',is_template:!!w.mobile_details?.is_template,
    items:(w.workout_exercises||[]).sort((a,b)=>a.order_index-b.order_index).map(e=>({
      ...exercises.find(x=>x.id===e.exercise_id),...e,position:e.order_index,reps:e.reps_max||e.reps_min||10,
      weight:Number(e.mobile_details?.weight)||0,rest:e.rest_seconds??60,technique:e.mobile_details?.technique||'Tradicional',notes:e.notes||''}))};
}
export function historyView(log,exercises,workouts) {
  const grouped=new Map();
  for(const s of log.exercise_logs||[]){
    if(!grouped.has(s.exercise_id))grouped.set(s.exercise_id,{...exercises.find(e=>e.id===s.exercise_id),exercise_id:s.exercise_id,sets:[]});
    grouped.get(s.exercise_id).sets.push({weight:Number(s.weight_kg)||0,reps:s.reps||0,done:s.completed});
  }
  const items=[...grouped.values()];
  return {...log,name:workouts.find(w=>w.id===log.workout_plan_id)?.name||'Treino concluído',started_at:log.completed_at,
    duration:(log.duration_minutes||0)*60,items,summary:summary(items)};
}
