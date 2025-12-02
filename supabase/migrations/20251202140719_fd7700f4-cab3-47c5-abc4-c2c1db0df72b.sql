-- Add new columns to workout_plans for the enhanced form
ALTER TABLE public.workout_plans 
ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS calories integer DEFAULT 200,
ADD COLUMN IF NOT EXISTS total_weight_kg numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_recommended boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_daily boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_challenge boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS challenge_points integer DEFAULT 0;