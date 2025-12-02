-- Create workout programs table (parent container for multiple workouts)
CREATE TABLE public.workout_programs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text DEFAULT 'Hipertrofia',
  cover_image_url text,
  user_id uuid NOT NULL,
  created_by uuid,
  is_active boolean DEFAULT true,
  is_recommended boolean DEFAULT false,
  progress_percent integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add RLS
ALTER TABLE public.workout_programs ENABLE ROW LEVEL SECURITY;

-- Policies for workout_programs
CREATE POLICY "Users can view own and recommended programs" 
ON public.workout_programs 
FOR SELECT 
USING ((auth.uid() = user_id) OR (auth.uid() = created_by) OR (is_recommended = true));

CREATE POLICY "Users can create programs" 
ON public.workout_programs 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id) OR has_role(auth.uid(), 'personal'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own programs" 
ON public.workout_programs 
FOR UPDATE 
USING ((auth.uid() = user_id) OR (auth.uid() = created_by));

CREATE POLICY "Users can delete own programs" 
ON public.workout_programs 
FOR DELETE 
USING ((auth.uid() = user_id) OR (auth.uid() = created_by));

-- Add program_id and day_of_week to workout_plans
ALTER TABLE public.workout_plans 
ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.workout_programs(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS day_of_week text;

-- Update trigger for updated_at
CREATE TRIGGER update_workout_programs_updated_at
BEFORE UPDATE ON public.workout_programs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update profiles to reference workout_program instead of workout_plan
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_program_id uuid REFERENCES public.workout_programs(id) ON DELETE SET NULL;