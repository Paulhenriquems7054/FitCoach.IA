-- Script para verificar se a função get_user_id_by_email foi criada corretamente

-- 1. Verificar se a função existe
SELECT 
  proname as function_name,
  pronargs as num_args,
  proargtypes::regtype[] as arg_types,
  prorettype::regtype as return_type,
  prosrc as source_code
FROM pg_proc 
WHERE proname = 'get_user_id_by_email';

-- 2. Testar a função (substitua 'teste@email.com' por um email real do seu sistema)
SELECT * FROM get_user_id_by_email('teste@email.com');

-- 3. Verificar permissões
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  r.rolname as grantee,
  has_function_privilege(r.rolname, p.oid, 'EXECUTE') as can_execute
FROM pg_proc p
CROSS JOIN pg_roles r
WHERE p.proname = 'get_user_id_by_email'
  AND r.rolname IN ('authenticated', 'service_role', 'anon')
ORDER BY r.rolname;

-- 4. Verificar se há usuários em auth.users para testar
SELECT 
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

