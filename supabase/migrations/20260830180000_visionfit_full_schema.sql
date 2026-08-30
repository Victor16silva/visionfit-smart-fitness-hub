-- =====================================================================
-- VisionFit - Script de criação completa do banco de dados
-- =====================================================================
-- Este script é IDEMPOTENTE: pode ser executado mais de uma vez sem erro.
-- Ele reproduz o schema esperado pelo código (src/integrations/supabase/types.ts),
-- cria funções/triggers, políticas RLS, popula exercícios base e cria a
-- conta admin inicial.
--
-- Como aplicar (escolha um):
--   A) Supabase CLI:  supabase link --project-ref <ref>  &&  supabase db push
--   B) SQL Editor:    cole TODO o conteúdo no Dashboard -> SQL Editor -> Run
--
-- Validado localmente no PostgreSQL 16: cria 14 tabelas, funções/triggers,
-- políticas RLS, 10 exercícios base e a conta admin confirmada (admin+master).
-- =====================================================================

-- Extensão necessária para hash de senha (crypt/gen_salt)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ---------------------------------------------------------------------
-- Enum de papéis
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('user', 'personal', 'admin', 'master');
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workout_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  cover_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_recommended BOOLEAN DEFAULT false,
  progress_percent NUMERIC,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  age INTEGER,
  gender TEXT,
  weight_kg NUMERIC,
  onboarding_completed BOOLEAN DEFAULT false,
  current_program_id UUID REFERENCES public.workout_programs(id) ON DELETE SET NULL,
  current_workout_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  image_url TEXT,
  muscle_groups TEXT[] NOT NULL DEFAULT '{}',
  equipment TEXT,
  difficulty TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  muscle_groups TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  category TEXT,
  division_letter TEXT,
  day_of_week TEXT,
  cover_image_url TEXT,
  duration_minutes INTEGER DEFAULT 40,
  calories INTEGER DEFAULT 200,
  total_weight_kg NUMERIC DEFAULT 0,
  is_recommended BOOLEAN DEFAULT false,
  is_daily BOOLEAN DEFAULT false,
  is_challenge BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  challenge_points INTEGER DEFAULT 0,
  program_id UUID REFERENCES public.workout_programs(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FK de profiles.current_workout_id -> workout_plans (adicionada após criar workout_plans)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_current_workout_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_current_workout_id_fkey
      FOREIGN KEY (current_workout_id) REFERENCES public.workout_plans(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  sets INTEGER DEFAULT 3,
  reps_min INTEGER DEFAULT 8,
  reps_max INTEGER DEFAULT 12,
  rest_seconds INTEGER DEFAULT 60,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_minutes INTEGER,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id UUID NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight_kg NUMERIC,
  completed BOOLEAN DEFAULT true,
  rpe INTEGER CHECK (rpe BETWEEN 1 AND 10),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  gender TEXT,
  age INTEGER,
  weight_kg NUMERIC,
  height_cm INTEGER,
  fitness_goals TEXT[] NOT NULL DEFAULT '{}',
  body_type TEXT,
  training_level TEXT,
  photo_front_url TEXT,
  photo_back_url TEXT,
  photo_left_url TEXT,
  photo_right_url TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  trainer_requested BOOLEAN DEFAULT false,
  trainer_request_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trainer_chat_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trainer_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.trainer_chat_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.challenge_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Funções e triggers
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','workout_programs','workout_plans','user_goals','trainer_chat_requests','challenges']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%I;', t, t);
    EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', t, t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_programs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_chat_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_messages    ENABLE ROW LEVEL SECURITY;

-- Helper: expressão de "é staff" (admin/master/personal)
-- Usada nas políticas via public.has_role(...)

-- profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'));

-- user_roles
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "user_roles_write" ON public.user_roles;
CREATE POLICY "user_roles_write" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master'));

-- workout_programs
DROP POLICY IF EXISTS "workout_programs_select" ON public.workout_programs;
CREATE POLICY "workout_programs_select" ON public.workout_programs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "workout_programs_write" ON public.workout_programs;
CREATE POLICY "workout_programs_write" ON public.workout_programs FOR ALL TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = created_by OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'personal'))
  WITH CHECK (auth.uid() = user_id OR auth.uid() = created_by OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'personal'));

-- exercises (biblioteca pública para leitura; escrita para staff)
DROP POLICY IF EXISTS "exercises_select" ON public.exercises;
CREATE POLICY "exercises_select" ON public.exercises FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "exercises_write" ON public.exercises;
CREATE POLICY "exercises_write" ON public.exercises FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'personal'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'personal'));

-- workout_plans
DROP POLICY IF EXISTS "workout_plans_select" ON public.workout_plans;
CREATE POLICY "workout_plans_select" ON public.workout_plans FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "workout_plans_write" ON public.workout_plans;
CREATE POLICY "workout_plans_write" ON public.workout_plans FOR ALL TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = created_by OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'personal'))
  WITH CHECK (auth.uid() = user_id OR auth.uid() = created_by OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'personal'));

-- workout_exercises (escopo pelo plano pai)
DROP POLICY IF EXISTS "workout_exercises_select" ON public.workout_exercises;
CREATE POLICY "workout_exercises_select" ON public.workout_exercises FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "workout_exercises_write" ON public.workout_exercises;
CREATE POLICY "workout_exercises_write" ON public.workout_exercises FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workout_plans wp WHERE wp.id = workout_plan_id
    AND (wp.user_id = auth.uid() OR wp.created_by = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'personal'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workout_plans wp WHERE wp.id = workout_plan_id
    AND (wp.user_id = auth.uid() OR wp.created_by = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'personal'))));

-- workout_logs
DROP POLICY IF EXISTS "workout_logs_select" ON public.workout_logs;
CREATE POLICY "workout_logs_select" ON public.workout_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'personal'));
DROP POLICY IF EXISTS "workout_logs_write" ON public.workout_logs;
CREATE POLICY "workout_logs_write" ON public.workout_logs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- exercise_logs (escopo pelo log pai)
DROP POLICY IF EXISTS "exercise_logs_select" ON public.exercise_logs;
CREATE POLICY "exercise_logs_select" ON public.exercise_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workout_logs wl WHERE wl.id = workout_log_id
    AND (wl.user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'personal'))));
DROP POLICY IF EXISTS "exercise_logs_write" ON public.exercise_logs;
CREATE POLICY "exercise_logs_write" ON public.exercise_logs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workout_logs wl WHERE wl.id = workout_log_id AND wl.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workout_logs wl WHERE wl.id = workout_log_id AND wl.user_id = auth.uid()));

-- user_goals (usuário gerencia o seu; staff pode ler)
DROP POLICY IF EXISTS "user_goals_select" ON public.user_goals;
CREATE POLICY "user_goals_select" ON public.user_goals FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'personal'));
DROP POLICY IF EXISTS "user_goals_write" ON public.user_goals;
CREATE POLICY "user_goals_write" ON public.user_goals FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- trainer_chat_requests (usuário e trainer/staff)
DROP POLICY IF EXISTS "tcr_select" ON public.trainer_chat_requests;
CREATE POLICY "tcr_select" ON public.trainer_chat_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = trainer_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'personal'));
DROP POLICY IF EXISTS "tcr_insert" ON public.trainer_chat_requests;
CREATE POLICY "tcr_insert" ON public.trainer_chat_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "tcr_update" ON public.trainer_chat_requests;
CREATE POLICY "tcr_update" ON public.trainer_chat_requests FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = trainer_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'personal'));

-- trainer_messages (participantes do pedido)
DROP POLICY IF EXISTS "tmsg_select" ON public.trainer_messages;
CREATE POLICY "tmsg_select" ON public.trainer_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trainer_chat_requests r WHERE r.id = request_id
    AND (r.user_id = auth.uid() OR r.trainer_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master') OR public.has_role(auth.uid(),'personal'))));
DROP POLICY IF EXISTS "tmsg_insert" ON public.trainer_messages;
CREATE POLICY "tmsg_insert" ON public.trainer_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- notifications
DROP POLICY IF EXISTS "notif_select" ON public.notifications;
CREATE POLICY "notif_select" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notif_insert" ON public.notifications;
CREATE POLICY "notif_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "notif_update" ON public.notifications;
CREATE POLICY "notif_update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- challenges
DROP POLICY IF EXISTS "chal_select" ON public.challenges;
CREATE POLICY "chal_select" ON public.challenges FOR SELECT TO authenticated
  USING (auth.uid() = creator_id OR auth.uid() = opponent_id);
DROP POLICY IF EXISTS "chal_insert" ON public.challenges;
CREATE POLICY "chal_insert" ON public.challenges FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
DROP POLICY IF EXISTS "chal_update" ON public.challenges;
CREATE POLICY "chal_update" ON public.challenges FOR UPDATE TO authenticated
  USING (auth.uid() = creator_id OR auth.uid() = opponent_id);

-- challenge_messages
DROP POLICY IF EXISTS "chalmsg_select" ON public.challenge_messages;
CREATE POLICY "chalmsg_select" ON public.challenge_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.challenges c WHERE c.id = challenge_id AND (c.creator_id = auth.uid() OR c.opponent_id = auth.uid())));
DROP POLICY IF EXISTS "chalmsg_insert" ON public.challenge_messages;
CREATE POLICY "chalmsg_insert" ON public.challenge_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Seed de exercícios base (apenas se a tabela estiver vazia)
-- ---------------------------------------------------------------------
INSERT INTO public.exercises (name, description, muscle_groups, equipment, difficulty)
SELECT * FROM (VALUES
  ('Supino Reto', 'Exercício fundamental para peitorais', ARRAY['Peitoral','Tríceps'], 'Barra', 'intermediate'),
  ('Agachamento Livre', 'Exercício composto para pernas', ARRAY['Quadríceps','Glúteos'], 'Barra', 'intermediate'),
  ('Remada Curvada', 'Exercício para desenvolvimento dorsal', ARRAY['Dorsal','Bíceps'], 'Barra', 'intermediate'),
  ('Desenvolvimento Militar', 'Exercício para ombros', ARRAY['Ombros','Tríceps'], 'Barra', 'intermediate'),
  ('Rosca Direta', 'Isolamento de bíceps', ARRAY['Bíceps'], 'Barra', 'beginner'),
  ('Tríceps Testa', 'Isolamento de tríceps', ARRAY['Tríceps'], 'Barra', 'beginner'),
  ('Leg Press', 'Exercício para pernas em máquina', ARRAY['Quadríceps','Glúteos'], 'Máquina', 'beginner'),
  ('Puxada Frontal', 'Exercício para dorsal', ARRAY['Dorsal','Bíceps'], 'Máquina', 'beginner'),
  ('Abdominais', 'Exercício para core', ARRAY['Abdômen'], 'Peso Corporal', 'beginner'),
  ('Elevação Lateral', 'Isolamento de ombros', ARRAY['Ombros'], 'Halteres', 'beginner')
) AS v(name, description, muscle_groups, equipment, difficulty)
WHERE NOT EXISTS (SELECT 1 FROM public.exercises);

-- ---------------------------------------------------------------------
-- Conta administradora inicial
--   Email: vsz16silva@gmail.com   Senha: vsz102030
-- Criada já com email confirmado e papéis admin + master.
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_email    TEXT := 'vsz16silva@gmail.com';
  v_password TEXT := 'vsz102030';
  v_user_id  UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    -- Os campos *_token/email_change precisam ser '' (não NULL): o GoTrue
    -- lê essas colunas como string e falha ("Database error querying schema")
    -- se estiverem NULL.
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change,
      email_change_token_new, email_change_token_current,
      phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      v_email, extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name','Admin VisionFit'),
      '', '', '', '', '', '', '', ''
    );

    INSERT INTO auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
      'email', now(), now(), now()
    );
  ELSE
    UPDATE auth.users
      SET email_confirmed_at        = COALESCE(email_confirmed_at, now()),
          encrypted_password        = extensions.crypt(v_password, extensions.gen_salt('bf')),
          confirmation_token        = COALESCE(confirmation_token, ''),
          recovery_token            = COALESCE(recovery_token, ''),
          email_change              = COALESCE(email_change, ''),
          email_change_token_new    = COALESCE(email_change_token_new, '')
      WHERE id = v_user_id;
  END IF;

  INSERT INTO public.profiles (id, full_name)
  VALUES (v_user_id, 'Admin VisionFit')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'master')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
