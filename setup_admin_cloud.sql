-- ========================================
-- SETUP ADMIN - ID CORRETO DA CLOUD
-- ========================================
-- Execute no SUPABASE CLOUD (não local!)

-- 1. Criar tipo e tabela (se não existir)
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('user', 'admin', 'master', 'personal', 'nutritionist');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 2. Adicionar role MASTER para o ID correto da CLOUD
INSERT INTO public.user_roles (user_id, role)
VALUES ('67e2f8d4-4cc5-42d0-b52d-66a655356ec1', 'master'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Verificar resultado
SELECT
  '✓ SUCESSO!' as status,
  u.email,
  ur.role
FROM auth.users u
INNER JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.id = '67e2f8d4-4cc5-42d0-b52d-66a655356ec1';

-- DEPOIS:
-- Recarregue a página do app (F5)
-- Os 3 painéis devem aparecer!
