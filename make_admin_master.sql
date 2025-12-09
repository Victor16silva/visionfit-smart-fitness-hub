-- Execute este SQL no Supabase Dashboard
-- Dashboard -> SQL Editor -> Nova Query -> Cole este código -> Run

-- 1. Criar o tipo app_role se não existir
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('user', 'admin', 'master', 'personal', 'nutritionist');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Criar a tabela user_roles se não existir
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 3. Dar role master para vs1437272@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'master'::app_role
FROM auth.users
WHERE email = 'vs1437272@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Verificar se foi criado
SELECT u.email, ur.role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'vs1437272@gmail.com';

-- INSTRUÇÕES PARA SENHA DA CONTA admin@visionfod.app:
-- 1. Vá para Authentication -> Users no Supabase Dashboard
-- 2. Procure o usuário admin@visionfod.app
-- 3. Clique nos 3 pontinhos -> Send Magic Link
-- 4. Ou use "Reset Password" para criar uma nova senha
--
-- Se a conta não existir ainda, você pode criar manualmente:
-- Authentication -> Users -> Add user -> preencher email e senha
