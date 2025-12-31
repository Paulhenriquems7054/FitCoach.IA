-- Script para garantir que o usuário dev123 tenha acesso ilimitado
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o usuário existe
-- Nota: email está em auth.users, não na tabela users
SELECT 
    u.id,
    u.username,
    u.nome,
    au.email as email_auth,
    u.role,
    u.voice_daily_limit_seconds,
    u.voice_used_today_seconds,
    CASE 
        WHEN u.username = 'dev123' OR u.username = 'dev' OR u.username = 'developer' OR u.username = 'desenvolvedor' THEN '✅ É DEV por username'
        WHEN LOWER(u.nome) = 'desenvolvedor' OR LOWER(u.nome) = 'developer' OR LOWER(u.nome) = 'dev' THEN '✅ É DEV por nome'
        WHEN au.email LIKE '%@fitcoach.ia' OR au.email LIKE '%@fitcoach.com' OR au.email LIKE '%dev@%' OR au.email LIKE '%developer@%' THEN '✅ É DEV por email'
        WHEN u.role = 'developer' OR u.role = 'admin' THEN '✅ É DEV por role'
        ELSE '❌ NÃO é DEV'
    END as status_dev
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.username IN ('dev123', 'dev', 'developer', 'desenvolvedor')
   OR LOWER(u.nome) IN ('desenvolvedor', 'developer', 'dev')
   OR au.email LIKE '%@fitcoach.ia'
   OR au.email LIKE '%@fitcoach.com'
   OR au.email LIKE '%dev@%'
   OR au.email LIKE '%developer@%'
   OR u.role IN ('developer', 'admin')
ORDER BY u.username;

-- 2. Atualizar todos os usuários que devem ser desenvolvedores
-- Isso garante que mesmo que o usuário faça login via Supabase Auth, ele será reconhecido como dev
-- Nota: Para verificar email, precisamos fazer JOIN com auth.users, mas no UPDATE não podemos usar JOIN diretamente
-- Então vamos fazer UPDATE apenas baseado em username, nome e role
UPDATE users
SET 
    username = COALESCE(NULLIF(username, ''), 'dev123'),
    nome = COALESCE(NULLIF(nome, ''), 'Desenvolvedor'),
    role = 'professional', -- ou 'admin' se preferir
    voice_daily_limit_seconds = 999999999, -- Praticamente ilimitado
    updated_at = NOW()
WHERE 
    (username IN ('dev123', 'dev', 'developer', 'desenvolvedor')
     OR LOWER(nome) IN ('desenvolvedor', 'developer', 'dev'))
    AND (
        -- Só atualizar se ainda não está configurado corretamente
        username NOT IN ('dev123', 'dev', 'developer', 'desenvolvedor')
        OR LOWER(nome) NOT IN ('desenvolvedor', 'developer', 'dev')
        OR voice_daily_limit_seconds < 999999999
    );

-- 2b. Atualizar usuários por email (usando subquery)
UPDATE users
SET 
    username = COALESCE(NULLIF(username, ''), 'dev123'),
    nome = COALESCE(NULLIF(nome, ''), 'Desenvolvedor'),
    role = 'professional',
    voice_daily_limit_seconds = 999999999,
    updated_at = NOW()
WHERE id IN (
    SELECT au.id
    FROM auth.users au
    WHERE au.email LIKE '%@fitcoach.ia'
       OR au.email LIKE '%@fitcoach.com'
       OR au.email LIKE '%dev@%'
       OR au.email LIKE '%developer@%'
)
AND (
    username NOT IN ('dev123', 'dev', 'developer', 'desenvolvedor')
    OR LOWER(nome) NOT IN ('desenvolvedor', 'developer', 'dev')
    OR voice_daily_limit_seconds < 999999999
);

-- 3. Verificar resultado após atualização
SELECT 
    u.id,
    u.username,
    u.nome,
    au.email as email_auth,
    u.role,
    u.voice_daily_limit_seconds,
    '✅ Configurado como desenvolvedor' as status
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.username IN ('dev123', 'dev', 'developer', 'desenvolvedor')
   OR LOWER(u.nome) IN ('desenvolvedor', 'developer', 'dev')
   OR au.email LIKE '%@fitcoach.ia'
   OR au.email LIKE '%@fitcoach.com'
   OR au.email LIKE '%dev@%'
   OR au.email LIKE '%developer@%'
   OR u.role IN ('developer', 'admin')
ORDER BY u.username;

