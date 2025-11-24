-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('user', 'personal', 'admin', 'master');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (CRITICAL: roles stored separately for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create exercises library
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  image_url TEXT,
  muscle_groups TEXT[] NOT NULL,
  equipment TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create workout plans (divisions like A, B, C, D)
CREATE TABLE public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  division_letter TEXT,
  muscle_groups TEXT[] NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create workout exercises (exercises in a specific workout plan)
CREATE TABLE public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id UUID REFERENCES public.workout_plans(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER NOT NULL,
  sets INTEGER NOT NULL DEFAULT 3,
  reps_min INTEGER NOT NULL DEFAULT 8,
  reps_max INTEGER NOT NULL DEFAULT 12,
  rest_seconds INTEGER NOT NULL DEFAULT 60,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create workout logs (when user completes a workout)
CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workout_plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_minutes INTEGER,
  notes TEXT
);

-- Create exercise logs (individual exercise performance in a workout)
CREATE TABLE public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id UUID REFERENCES public.workout_logs(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight_kg DECIMAL(5,2),
  completed BOOLEAN DEFAULT true,
  rpe INTEGER CHECK (rpe BETWEEN 1 AND 10),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));

-- Exercises policies
CREATE POLICY "Everyone can view exercises"
  ON public.exercises FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Personal trainers and admins can create exercises"
  ON public.exercises FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'personal') OR 
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'master')
  );

CREATE POLICY "Creators can update own exercises"
  ON public.exercises FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Workout plans policies
CREATE POLICY "Users can view own workout plans"
  ON public.workout_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = created_by);

CREATE POLICY "Users can create own workout plans"
  ON public.workout_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'personal'));

CREATE POLICY "Users can update own workout plans"
  ON public.workout_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = created_by);

CREATE POLICY "Users can delete own workout plans"
  ON public.workout_plans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = created_by);

-- Workout exercises policies
CREATE POLICY "Users can view workout exercises"
  ON public.workout_exercises FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans
      WHERE id = workout_plan_id
      AND (user_id = auth.uid() OR created_by = auth.uid())
    )
  );

CREATE POLICY "Users can manage workout exercises"
  ON public.workout_exercises FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans
      WHERE id = workout_plan_id
      AND (user_id = auth.uid() OR created_by = auth.uid())
    )
  );

-- Workout logs policies
CREATE POLICY "Users can view own workout logs"
  ON public.workout_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workout logs"
  ON public.workout_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout logs"
  ON public.workout_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Exercise logs policies
CREATE POLICY "Users can view own exercise logs"
  ON public.exercise_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs
      WHERE id = workout_log_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own exercise logs"
  ON public.exercise_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_logs
      WHERE id = workout_log_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own exercise logs"
  ON public.exercise_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs
      WHERE id = workout_log_id AND user_id = auth.uid()
    )
  );

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workout_plans_updated_at
  BEFORE UPDATE ON public.workout_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default exercises
INSERT INTO public.exercises (name, description, muscle_groups, equipment, difficulty) VALUES
('Supino Reto', 'Exercício fundamental para peitorais', ARRAY['Peitoral', 'Tríceps'], 'Barra', 'intermediate'),
('Agachamento Livre', 'Exercício composto para pernas', ARRAY['Quadríceps', 'Glúteos'], 'Barra', 'intermediate'),
('Remada Curvada', 'Exercício para desenvolvimento dorsal', ARRAY['Dorsal', 'Bíceps'], 'Barra', 'intermediate'),
('Desenvolvimento Militar', 'Exercício para ombros', ARRAY['Ombros', 'Tríceps'], 'Barra', 'intermediate'),
('Rosca Direta', 'Isolamento de bíceps', ARRAY['Bíceps'], 'Barra', 'beginner'),
('Tríceps Testa', 'Isolamento de tríceps', ARRAY['Tríceps'], 'Barra', 'beginner'),
('Leg Press', 'Exercício para pernas em máquina', ARRAY['Quadríceps', 'Glúteos'], 'Máquina', 'beginner'),
('Puxada Frontal', 'Exercício para dorsal', ARRAY['Dorsal', 'Bíceps'], 'Máquina', 'beginner'),
('Abdominais', 'Exercício para core', ARRAY['Abdômen'], 'Peso Corporal', 'beginner'),
('Prancha', 'Isometria para core', ARRAY['Abdômen', 'Lombar'], 'Peso Corporal', 'beginner');