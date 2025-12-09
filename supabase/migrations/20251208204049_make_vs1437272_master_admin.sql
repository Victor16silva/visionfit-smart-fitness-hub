-- Make vs1437272@gmail.com a master admin with full access
-- This migration assigns the master role to the specified user

-- First, insert or update the user_roles for vs1437272@gmail.com
INSERT INTO user_roles (user_id, role)
SELECT id, 'master'
FROM auth.users
WHERE email = 'vs1437272@gmail.com'
ON CONFLICT (user_id, role)
DO UPDATE SET role = 'master';

-- Optional: Add a comment for documentation
COMMENT ON TABLE user_roles IS 'User roles table: master role grants full access to all management panels (Admin, Vision Trainer, Vision Nutri)';
