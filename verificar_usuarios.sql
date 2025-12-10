-- Execute APENAS no projeto: ixymkkhcfayjltqrzezq
-- URL: https://supabase.com/dashboard/project/ixymkkhcfayjltqrzezq

-- Ver TODOS os usuários neste projeto
SELECT
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- Procurar especificamente por vsz16silva
SELECT
  'Usuário vsz16silva encontrado:' as info,
  id,
  email
FROM auth.users
WHERE email LIKE '%vsz16silva%';
