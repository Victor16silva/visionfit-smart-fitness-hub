-- Add current_workout_id and current_program_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_workout_id uuid REFERENCES public.workout_plans(id),
ADD COLUMN IF NOT EXISTS current_program_id uuid REFERENCES public.workout_programs(id);