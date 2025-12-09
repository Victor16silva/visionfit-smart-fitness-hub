-- DIAGNÓSTICO: Execute este SQL para verificar o problema
-- Dashboard -> SQL Editor -> Nova Query -> Cole e Execute

-- 1. Verificar se a tabela user_roles existe
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'user_roles'
) as tabela_existe;

-- 2. Verificar se o tipo app_role existe
SELECT EXISTS (
   SELECT 1 FROM pg_type WHERE typname = 'app_role'
) as tipo_existe;

-- 3. Listar TODOS os usuários no sistema
SELECT email, id, created_at
FROM auth.users
ORDER BY created_at DESC;

-- 4. Verificar se vs1437272@gmail.com tem alguma role
SELECT
    u.email,
    u.id as user_id,
    ur.role,
    ur.id as role_id
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'vs1437272@gmail.com';

-- 5. Listar TODAS as roles existentes no banco
SELECT
    u.email,
    ur.role
FROM public.user_roles ur
LEFT JOIN auth.users u ON u.id = ur.user_id
ORDER BY u.email;
