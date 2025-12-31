-- ============================================================
-- COMANDOS ESPECÍFICOS: Marcar seus usuários como desenvolvedor
-- ============================================================
-- 
-- Baseado na lista de usuários fornecida, escolha qual usuário
-- você quer marcar como desenvolvedor e execute o comando correspondente
-- ============================================================

-- OPÇÃO 1: Marcar "Paulo Henrique M. S." como desenvolvedor
-- Email: oluaphms@gmail.com
-- ID: 94b4c874-6406-42a3-bbd7-8a968d00adfe
-- Usa username 'dev' porque 'dev123' já existe
UPDATE public.users
SET username = 'dev', nome = 'Desenvolvedor', role = 'professional'
WHERE id = '94b4c874-6406-42a3-bbd7-8a968d00adfe'::uuid
RETURNING id, nome, username, role;

-- ============================================================

-- OPÇÃO 2: Marcar "phm" como desenvolvedor
-- Email: paulhenriquems7054@gmail.com
-- ID: 5b98a8b0-da94-40ef-9936-a3f9a412c82e
-- Usa username 'developer' porque 'dev123' já existe
UPDATE public.users
SET username = 'developer', nome = 'Desenvolvedor', role = 'professional'
WHERE id = '5b98a8b0-da94-40ef-9936-a3f9a412c82e'::uuid
RETURNING id, nome, username, role;

-- ============================================================

-- OPÇÃO 3: Marcar por EMAIL (mais fácil)
-- Use este comando com seu email preferido:

-- Para oluaphms@gmail.com (usa 'dev' porque 'dev123' já existe):
UPDATE public.users
SET username = 'dev', nome = 'Desenvolvedor', role = 'professional'
WHERE id = (SELECT id FROM auth.users WHERE email = 'oluaphms@gmail.com')
RETURNING id, nome, username, role;

-- Para paulhenriquems7054@gmail.com (usa 'developer' porque 'dev123' já existe):
UPDATE public.users
SET username = 'developer', nome = 'Desenvolvedor', role = 'professional'
WHERE id = (SELECT id FROM auth.users WHERE email = 'paulhenriquems7054@gmail.com')
RETURNING id, nome, username, role;

-- ============================================================

-- VERIFICAÇÃO: Confirmar que foi marcado como desenvolvedor
-- Execute após o UPDATE para verificar
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
-- ============================================================

