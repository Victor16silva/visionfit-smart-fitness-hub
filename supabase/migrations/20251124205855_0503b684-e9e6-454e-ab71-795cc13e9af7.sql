-- Add category and cover image fields to workout_plans
ALTER TABLE workout_plans 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Update existing preset workouts with categories
UPDATE workout_plans 
SET category = 'Hipertrofia'
WHERE created_by IS NOT NULL AND name ILIKE '%superior%';

UPDATE workout_plans 
SET category = 'Treinos Femininos'
WHERE created_by IS NOT NULL AND name ILIKE '%inferior%';

UPDATE workout_plans 
SET category = 'Definição'
WHERE created_by IS NOT NULL AND name ILIKE '%definição%';