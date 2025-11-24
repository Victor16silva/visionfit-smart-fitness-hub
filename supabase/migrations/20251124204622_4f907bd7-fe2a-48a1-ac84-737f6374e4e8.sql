-- Permitir que todos vejam treinos criados por personal trainers (treinos prontos)
DROP POLICY IF EXISTS "Users can view own workout plans" ON workout_plans;

CREATE POLICY "Users can view own and public workout plans"
ON workout_plans
FOR SELECT
USING (
  auth.uid() = user_id 
  OR auth.uid() = created_by 
  OR (created_by IS NOT NULL AND has_role(created_by, 'personal'::app_role))
);

-- Também permitir copiar exercícios de treinos públicos
DROP POLICY IF EXISTS "Users can view workout exercises" ON workout_exercises;

CREATE POLICY "Users can view own and public workout exercises"
ON workout_exercises
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workout_plans
    WHERE workout_plans.id = workout_exercises.workout_plan_id
    AND (
      workout_plans.user_id = auth.uid() 
      OR workout_plans.created_by = auth.uid()
      OR (workout_plans.created_by IS NOT NULL AND has_role(workout_plans.created_by, 'personal'::app_role))
    )
  )
);