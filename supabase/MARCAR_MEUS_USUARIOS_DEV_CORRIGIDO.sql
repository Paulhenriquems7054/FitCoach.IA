-- ============================================================
-- COMANDOS CORRIGIDOS: Marcar seus usuários como desenvolvedor
-- ============================================================
-- 
-- CORREÇÃO: O username 'dev123' já existe (usuário Desenvolvedor)
-- Solução: Usar usernames alternativos também reconhecidos como desenvolvedor:
-- - 'dev' (reconhecido)
-- - 'developer' (reconhecido)
-- - 'desenvolvedor' (reconhecido)
-- - OU apenas atualizar o nome para 'Desenvolvedor'
-- ============================================================

-- OPÇÃO 1: Marcar "Paulo Henrique M. S." como desenvolvedor
-- Email: oluaphms@gmail.com
-- ID: 94b4c874-6406-42a3-bbd7-8a968d00adfe
-- Usa username 'dev' (também reconhecido como desenvolvedor)
UPDATE public.users
SET username = 'dev', nome = 'Desenvolvedor', role = 'professional'
WHERE id = '94b4c874-6406-42a3-bbd7-8a968d00adfe'::uuid
RETURNING id, nome, username, role;

-- ============================================================

-- OPÇÃO 2: Marcar "phm" como desenvolvedor
-- Email: paulhenriquems7054@gmail.com
-- ID: 5b98a8b0-da94-40ef-9936-a3f9a412c82e
-- Usa username 'developer' (também reconhecido como desenvolvedor)
UPDATE public.users
SET username = 'developer', nome = 'Desenvolvedor', role = 'professional'
WHERE id = '5b98a8b0-da94-40ef-9936-a3f9a412c82e'::uuid
RETURNING id, nome, username, role;

-- ============================================================

-- OPÇÃO 3: Manter username original, apenas atualizar nome
-- (O nome 'Desenvolvedor' também é reconhecido como desenvolvedor)
-- Para Paulo Henrique M. S.:
UPDATE public.users
SET nome = 'Desenvolvedor', role = 'professional'
WHERE id = '94b4c874-6406-42a3-bbd7-8a968d00adfe'::uuid
RETURNING id, nome, username, role;

-- Para phm:
UPDATE public.users
SET nome = 'Desenvolvedor', role = 'professional'
WHERE id = '5b98a8b0-da94-40ef-9936-a3f9a412c82e'::uuid
RETURNING id, nome, username, role;

-- ============================================================

-- OPÇÃO 4: Por EMAIL (mais fácil)
-- Para oluaphms@gmail.com (usa 'dev'):
UPDATE public.users
SET username = 'dev', nome = 'Desenvolvedor', role = 'professional'
WHERE id = (SELECT id FROM auth.users WHERE email = 'oluaphms@gmail.com')
RETURNING id, nome, username, role;

-- Para paulhenriquems7054@gmail.com (usa 'developer'):
UPDATE public.users
SET username = 'developer', nome = 'Desenvolvedor', role = 'professional'
WHERE id = (SELECT id FROM auth.users WHERE email = 'paulhenriquems7054@gmail.com')
RETURNING id, nome, username, role;

-- ============================================================

-- VERIFICAÇÃO: Confirmar que foi marcado como desenvolvedor
SELECT 
    u.id,
    u.nome,
    u.username,
    au.email as email_auth,
    u.role,
    CASE 
        WHEN u.username IN ('dev123', 'dev', 'developer', 'desenvolvedor') THEN '✅ Desenvolvedor (username)'
        WHEN u.nome IN ('Desenvolvedor', 'Developer', 'DEV') THEN '✅ Desenvolvedor (nome)'
        WHEN au.email LIKE '%@fitcoach.ia%' OR au.email LIKE '%@fitcoach.com%' 
          OR au.email LIKE '%dev@%' OR au.email LIKE '%developer@%' THEN '✅ Desenvolvedor (email)'
        WHEN u.role = 'admin' THEN '✅ Desenvolvedor (role)'
        ELSE '❌ Não é desenvolvedor'
    END as status_desenvolvedor
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.id IN (
    '94b4c874-6406-42a3-bbd7-8a968d00adfe'::uuid,  -- Paulo Henrique M. S.
    '5b98a8b0-da94-40ef-9936-a3f9a412c82e'::uuid   -- phm
)
ORDER BY u.created_at DESC;

-- ============================================================
-- IMPORTANTE: Após executar, faça logout e login novamente no app!
-- 
-- NOTA: Todos esses usernames são reconhecidos como desenvolvedor:
-- - dev123 (já existe)
-- - dev ✅
-- - developer ✅
-- - desenvolvedor ✅
-- 
-- E também o nome 'Desenvolvedor' é reconhecido, então você pode
-- manter seu username original e apenas atualizar o nome!
-- ============================================================

