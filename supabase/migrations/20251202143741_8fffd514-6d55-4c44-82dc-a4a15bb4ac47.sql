-- Allow admins to delete exercises
CREATE POLICY "Admins can delete exercises" 
ON public.exercises 
FOR DELETE 
USING (has_role(auth.uid(), 'personal'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

-- Allow admins to delete exercise logs related to workout logs
CREATE POLICY "Users can delete own exercise logs" 
ON public.exercise_logs 
FOR DELETE 
USING (EXISTS ( SELECT 1 FROM workout_logs WHERE workout_logs.id = exercise_logs.workout_log_id AND workout_logs.user_id = auth.uid()));

-- Allow users to delete their own workout logs
CREATE POLICY "Users can delete own workout logs" 
ON public.workout_logs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add column to track user's current/selected workout
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_workout_id uuid REFERENCES public.workout_plans(id) ON DELETE SET NULL;