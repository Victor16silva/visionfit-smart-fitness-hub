-- Additive integration: existing users, exercises and workout history are preserved.
alter table public.exercises add column if not exists mobile_details jsonb not null default '{}';
alter table public.workout_plans add column if not exists mobile_details jsonb not null default '{}';
alter table public.workout_exercises add column if not exists mobile_details jsonb not null default '{}';

create table public.athev_records (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check (kind in ('profile','measurement','photo','event','nutrition','favorite','session','trainer_note','membership','payment','checkin')),
 payload jsonb not null default '{}' check (jsonb_typeof(payload)='object'),
 revision integer not null default 0,
 created_at timestamptz not null default now()
);
create index athev_records_owner_kind on public.athev_records(user_id,kind);
create unique index athev_one_profile on public.athev_records(user_id) where kind='profile';
create unique index athev_one_active_session on public.athev_records(user_id) where kind='session' and payload->>'status'='active';
create unique index athev_unique_favorite on public.athev_records(user_id,(payload->>'exercise_id')) where kind='favorite';
create table public.athev_catalog (
 id uuid primary key default gen_random_uuid(),
 kind text not null check (kind in ('gym','plan','class')),
 payload jsonb not null default '{}' check (jsonb_typeof(payload)='object'),
 created_at timestamptz not null default now()
);
alter table public.athev_records enable row level security;
alter table public.athev_catalog enable row level security;
grant select,insert,update,delete on public.athev_records,public.athev_catalog to authenticated;
revoke all on public.athev_records,public.athev_catalog from anon;

create policy athev_records_read on public.athev_records for select to authenticated using (
 user_id=(select auth.uid()) or public.has_role((select auth.uid()),'admin') or public.has_role((select auth.uid()),'master')
 or (kind in ('measurement','session','trainer_note') and exists(select 1 from public.trainer_chat_requests r where r.user_id=athev_records.user_id and r.trainer_id=(select auth.uid()) and r.status='accepted'))
);
create policy athev_records_insert on public.athev_records for insert to authenticated with check (
 (user_id=(select auth.uid()) and kind in ('profile','measurement','photo','event','nutrition','favorite','session'))
 or public.has_role((select auth.uid()),'admin') or public.has_role((select auth.uid()),'master')
 or (kind in ('measurement','trainer_note','event') and public.has_role((select auth.uid()),'personal') and exists(select 1 from public.trainer_chat_requests r where r.user_id=athev_records.user_id and r.trainer_id=(select auth.uid()) and r.status='accepted'))
);
create policy athev_records_update on public.athev_records for update to authenticated
 using ((user_id=(select auth.uid()) and kind in ('profile','measurement','photo','event','nutrition','favorite','session')) or public.has_role((select auth.uid()),'admin') or public.has_role((select auth.uid()),'master'))
 with check ((user_id=(select auth.uid()) and kind in ('profile','measurement','photo','event','nutrition','favorite','session')) or public.has_role((select auth.uid()),'admin') or public.has_role((select auth.uid()),'master'));
create policy athev_records_delete on public.athev_records for delete to authenticated using (
 (user_id=(select auth.uid()) and kind in ('measurement','photo','event','nutrition','favorite')) or public.has_role((select auth.uid()),'admin') or public.has_role((select auth.uid()),'master'));
create policy athev_catalog_read on public.athev_catalog for select to authenticated using (true);
create policy athev_catalog_manage on public.athev_catalog for all to authenticated
 using (public.has_role((select auth.uid()),'admin') or public.has_role((select auth.uid()),'master'))
 with check (public.has_role((select auth.uid()),'admin') or public.has_role((select auth.uid()),'master'));

create function public.athev_save_workout(p_id uuid,p_data jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare v_uid uuid:=auth.uid(); v_owner uuid:=coalesce(nullif(p_data->>'user_id','')::uuid,auth.uid()); v_id uuid; item jsonb; pos integer:=0;
begin
 if v_uid is null then raise exception 'Autenticação necessária'; end if;
 if v_owner<>v_uid and not (public.has_role(v_uid,'admin') or public.has_role(v_uid,'master') or
  (public.has_role(v_uid,'personal') and exists(select 1 from public.trainer_chat_requests where user_id=v_owner and trainer_id=v_uid and status='accepted'))) then raise exception 'Aluno não vinculado'; end if;
 if jsonb_typeof(p_data->'items')<>'array' or jsonb_array_length(p_data->'items') not between 1 and 30 then raise exception 'Adicione de 1 a 30 exercícios'; end if;
 if nullif(trim(p_data->>'name'),'') is null then raise exception 'Informe o nome da ficha'; end if;
 if p_id is null then
  insert into public.workout_plans(user_id,created_by,name,muscle_groups,description,day_of_week,duration_minutes,mobile_details)
  values(v_owner,v_uid,p_data->>'name',string_to_array(p_data->>'muscle',' + '),coalesce(p_data->>'notes',''),p_data->>'day',(p_data->>'duration')::int,
   jsonb_build_object('level',p_data->>'level','is_template',coalesce((p_data->>'is_template')::boolean,false))) returning id into v_id;
 else
  update public.workout_plans set name=p_data->>'name',muscle_groups=string_to_array(p_data->>'muscle',' + '),description=coalesce(p_data->>'notes',''),
   day_of_week=p_data->>'day',duration_minutes=(p_data->>'duration')::int,mobile_details=jsonb_build_object('level',p_data->>'level','is_template',coalesce((p_data->>'is_template')::boolean,false))
   where id=p_id and user_id=v_owner returning id into v_id;
  if v_id is null then raise exception 'Ficha não encontrada ou sem permissão'; end if;
  delete from public.workout_exercises where workout_plan_id=v_id;
 end if;
 for item in select value from jsonb_array_elements(p_data->'items') loop
  if (item->>'sets')::int not between 1 and 20 or (item->>'reps')::int not between 1 and 1000 or (item->>'weight')::numeric not between 0 and 1500 or (item->>'rest')::int not between 0 and 600 then raise exception 'Revise séries, repetições, carga e descanso'; end if;
  insert into public.workout_exercises(workout_plan_id,exercise_id,order_index,sets,reps_min,reps_max,rest_seconds,notes,mobile_details)
  values(v_id,(item->>'exercise_id')::uuid,pos,(item->>'sets')::int,(item->>'reps')::int,(item->>'reps')::int,(item->>'rest')::int,coalesce(item->>'notes',''),jsonb_build_object('weight',(item->>'weight')::numeric,'technique',item->>'technique'));
  pos:=pos+1;
 end loop;
 return jsonb_build_object('id',v_id);
end $$;

create function public.athev_finish_session(p_id uuid,p_difficulty text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare r public.athev_records; item jsonb; s jsonb; v_duration int; v_sets int:=0; v_reps int:=0; v_volume numeric:=0; v_exercises int:=0; n int; v_summary jsonb;
begin
 select * into r from public.athev_records where id=p_id and user_id=auth.uid() and kind='session' for update;
 if r.id is null then raise exception 'Treino não encontrado'; end if;
 if r.payload->>'status'='completed' then return r.payload; end if;
 if r.payload->>'status'<>'active' then raise exception 'Treino encerrado'; end if;
 v_duration:=greatest(0,extract(epoch from now()-(r.payload->>'started_at')::timestamptz)::int);
 insert into public.workout_logs(id,user_id,workout_plan_id,completed_at,duration_minutes,notes)
 values(p_id,auth.uid(),(r.payload->>'workout_id')::uuid,now(),ceil(v_duration/60.0),r.payload->>'notes');
 for item in select value from jsonb_array_elements(r.payload->'items') loop
  n:=0;
  for s in select value from jsonb_array_elements(item->'sets') loop
   if coalesce((s->>'done')::boolean,false) then
    if (s->>'weight')::numeric not between 0 and 1500 or (s->>'reps')::int not between 1 and 1000 then raise exception 'Carga ou repetições inválidas'; end if;
    n:=n+1;v_sets:=v_sets+1;v_reps:=v_reps+(s->>'reps')::int;v_volume:=v_volume+(s->>'weight')::numeric*(s->>'reps')::int;
    insert into public.exercise_logs(workout_log_id,exercise_id,set_number,reps,weight_kg,completed)
    values(p_id,(item->>'exercise_id')::uuid,n,(s->>'reps')::int,(s->>'weight')::numeric,true);
   end if;
  end loop;
  if n>0 then v_exercises:=v_exercises+1; end if;
 end loop;
 if v_sets=0 then raise exception 'Conclua ao menos uma série'; end if;
 v_summary:=jsonb_build_object('sets',v_sets,'reps',v_reps,'volume',v_volume,'exercises',v_exercises);
 r.payload:=r.payload||jsonb_build_object('status','completed','duration',v_duration,'difficulty',p_difficulty,'ended_at',now(),'summary',v_summary,'records','[]'::jsonb,'unlocked','[]'::jsonb);
 update public.athev_records set payload=r.payload,revision=revision+1 where id=p_id;
 return r.payload;
end $$;
revoke all on function public.athev_save_workout(uuid,jsonb),public.athev_finish_session(uuid,text) from public,anon;
grant execute on function public.athev_save_workout(uuid,jsonb),public.athev_finish_session(uuid,text) to authenticated;
