-- Script para garantir que o usuário dev123 tenha acesso ilimitado
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o usuário existe
SELECT 
    id,
    username,
    nome,
    email_auth,
    role,
    voice_daily_limit_seconds,
    voice_used_today_seconds,
    CASE 
        WHEN username = 'dev123' OR username = 'dev' OR username = 'developer' OR username = 'desenvolvedor' THEN '✅ É DEV por username'
        WHEN LOWER(nome) = 'desenvolvedor' OR LOWER(nome) = 'developer' OR LOWER(nome) = 'dev' THEN '✅ É DEV por nome'
        WHEN email_auth LIKE '%@fitcoach.ia' OR email_auth LIKE '%@fitcoach.com' OR email_auth LIKE '%dev@%' OR email_auth LIKE '%developer@%' THEN '✅ É DEV por email'
        WHEN role = 'developer' OR role = 'admin' THEN '✅ É DEV por role'
        ELSE '❌ NÃO é DEV'
    END as status_dev
FROM users
WHERE username IN ('dev123', 'dev', 'developer', 'desenvolvedor')
   OR LOWER(nome) IN ('desenvolvedor', 'developer', 'dev')
   OR email_auth LIKE '%@fitcoach.ia'
   OR email_auth LIKE '%@fitcoach.com'
   OR email_auth LIKE '%dev@%'
   OR email_auth LIKE '%developer@%'
   OR role IN ('developer', 'admin')
ORDER BY username;

-- 2. Atualizar todos os usuários que devem ser desenvolvedores
-- Isso garante que mesmo que o usuário faça login via Supabase Auth, ele será reconhecido como dev
UPDATE users
SET 
    username = COALESCE(NULLIF(username, ''), 'dev123'),
    nome = COALESCE(NULLIF(nome, ''), 'Desenvolvedor'),
    role = 'professional', -- ou 'admin' se preferir
    voice_daily_limit_seconds = 999999999, -- Praticamente ilimitado
    updated_at = NOW()
WHERE 
    (username IN ('dev123', 'dev', 'developer', 'desenvolvedor')
     OR LOWER(nome) IN ('desenvolvedor', 'developer', 'dev')
     OR email_auth LIKE '%@fitcoach.ia'
     OR email_auth LIKE '%@fitcoach.com'
     OR email_auth LIKE '%dev@%'
     OR email_auth LIKE '%developer@%')
    AND (
        -- Só atualizar se ainda não está configurado corretamente
        username NOT IN ('dev123', 'dev', 'developer', 'desenvolvedor')
        OR LOWER(nome) NOT IN ('desenvolvedor', 'developer', 'dev')
        OR voice_daily_limit_seconds < 999999999
    );

-- 3. Verificar resultado após atualização
SELECT 
    id,
    username,
    nome,
    email_auth,
    role,
    voice_daily_limit_seconds,
    '✅ Configurado como desenvolvedor' as status
FROM users
WHERE username IN ('dev123', 'dev', 'developer', 'desenvolvedor')
   OR LOWER(nome) IN ('desenvolvedor', 'developer', 'dev')
   OR email_auth LIKE '%@fitcoach.ia'
   OR email_auth LIKE '%@fitcoach.com'
   OR email_auth LIKE '%dev@%'
   OR email_auth LIKE '%developer@%'
   OR role IN ('developer', 'admin')
ORDER BY username;

