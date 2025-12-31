-- ============================================================
-- Script para marcar usuário como desenvolvedor no Supabase
-- Desenvolvedores têm acesso ilimitado a todas as funcionalidades
-- ============================================================
-- 
-- INSTRUÇÕES:
-- 1. Execute este script no SQL Editor do Supabase Dashboard
-- 2. Substitua 'SEU_EMAIL@exemplo.com' pelo seu email cadastrado
--    OU substitua 'SEU_USER_ID' pelo seu ID de usuário (UUID)
-- 3. Execute o comando UPDATE correspondente
-- 4. Faça logout e login novamente no app para aplicar as mudanças
--
-- ============================================================

-- OPÇÃO 1: Marcar como desenvolvedor usando EMAIL
-- Substitua 'SEU_EMAIL@exemplo.com' pelo seu email
UPDATE public.users
SET 
    username = 'dev123',
    nome = 'Desenvolvedor',
    role = 'professional'  -- Máximo permitido pelo schema (não há role 'developer')
WHERE id IN (
    SELECT id 
    FROM auth.users 
    WHERE email = 'SEU_EMAIL@exemplo.com'
)
RETURNING id, nome, username, email, role;

-- ============================================================

-- OPÇÃO 2: Marcar como desenvolvedor usando USERNAME atual
-- Substitua 'SEU_USERNAME_ATUAL' pelo seu username atual
UPDATE public.users
SET 
    username = 'dev123',
    nome = 'Desenvolvedor',
    role = 'professional'
WHERE username = 'SEU_USERNAME_ATUAL'
RETURNING id, nome, username, email, role;

-- ============================================================

-- OPÇÃO 3: Marcar como desenvolvedor usando ID do usuário (UUID)
-- Substitua 'SEU_USER_ID' pelo seu ID de usuário (UUID)
-- Você pode encontrar seu ID em: Authentication → Users → seu usuário
UPDATE public.users
SET 
    username = 'dev123',
    nome = 'Desenvolvedor',
    role = 'professional'
WHERE id = 'SEU_USER_ID'
RETURNING id, nome, username, email, role;

-- ============================================================

-- OPÇÃO 4: Verificar qual usuário você é (antes de atualizar)
-- Execute este comando para ver seus dados atuais e encontrar seu ID
SELECT 
    u.id,
    u.nome,
    u.username,
    u.email,
    u.role,
    au.email as auth_email
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE au.email = 'SEU_EMAIL@exemplo.com'  -- Substitua pelo seu email
   OR u.username = 'SEU_USERNAME_ATUAL';   -- Substitua pelo seu username

-- ============================================================

-- VERIFICAÇÃO: Confirmar que foi marcado como desenvolvedor
-- Execute este comando após o UPDATE para verificar
SELECT 
    id,
    nome,
    username,
    email,
    role,
    CASE 
        WHEN username IN ('dev123', 'dev', 'developer', 'desenvolvedor') THEN '✅ Desenvolvedor (username)'
        WHEN nome IN ('Desenvolvedor', 'Developer', 'DEV') THEN '✅ Desenvolvedor (nome)'
        WHEN email LIKE '%@fitcoach.ia%' OR email LIKE '%@fitcoach.com%' 
          OR email LIKE '%dev@%' OR email LIKE '%developer@%' THEN '✅ Desenvolvedor (email)'
        WHEN role = 'admin' THEN '✅ Desenvolvedor (role)'
        ELSE '❌ Não é desenvolvedor'
    END as status_desenvolvedor
FROM public.users
WHERE id = 'SEU_USER_ID'  -- Substitua pelo seu ID após o UPDATE
   OR username = 'dev123'  -- Ou use o username após o UPDATE
   OR email = 'SEU_EMAIL@exemplo.com';  -- Ou use seu email

-- ============================================================
-- NOTAS IMPORTANTES:
-- 
-- 1. O campo 'role' na tabela users só aceita: 'user' ou 'professional'
--    Por isso definimos role = 'professional' (não existe 'developer' no schema)
-- 
-- 2. A identificação de desenvolvedor no código verifica:
--    - username: 'dev123', 'dev', 'developer', 'desenvolvedor'
--    - nome: 'Desenvolvedor', 'Developer', 'DEV'
--    - email: contendo '@fitcoach.ia', '@fitcoach.com', 'dev@', 'developer@'
--    - role: 'developer' ou 'admin' (mas role não aceita esses valores no schema)
-- 
-- 3. Após executar o UPDATE, você DEVE:
--    - Fazer logout do app
--    - Fazer login novamente
--    - As mudanças serão aplicadas automaticamente
-- 
-- 4. Se preferir manter seu username original, pode usar apenas:
--    UPDATE public.users SET nome = 'Desenvolvedor' WHERE ...
--    (desde que seu username ou email já corresponda aos critérios)
-- 
-- ============================================================

