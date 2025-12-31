-- ============================================================
-- Verificar usuário Desenvolvedor (dev123)
-- ============================================================

-- Verificar dados do usuário na tabela users
SELECT 
    u.id,
    u.nome,
    u.username,
    u.role,
    au.email as email_auth,
    au.email_confirmed_at,
    au.created_at,
    CASE 
        WHEN u.username IN ('dev123', 'dev', 'developer', 'desenvolvedor') THEN '✅ Desenvolvedor (username)'
        WHEN u.nome IN ('Desenvolvedor', 'Developer', 'DEV') THEN '✅ Desenvolvedor (nome)'
        WHEN au.email LIKE '%@fitcoach.ia%' OR au.email LIKE '%@fitcoach.com%' 
          OR au.email LIKE '%dev@%' OR au.email LIKE '%developer@%' THEN '✅ Desenvolvedor (email)'
        ELSE '❌ Não é desenvolvedor'
    END as status_desenvolvedor
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.username = 'dev123'
   OR au.email = 'dev123@fitcoach.ia';

-- ============================================================
-- Se o usuário não existir ou não estiver configurado corretamente,
-- execute os comandos abaixo
-- ============================================================

-- Garantir que o usuário está configurado como desenvolvedor
UPDATE public.users
SET 
    nome = 'Desenvolvedor',
    username = 'dev123',
    role = 'professional'
WHERE username = 'dev123'
   OR id = (SELECT id FROM auth.users WHERE email = 'dev123@fitcoach.ia')
RETURNING id, nome, username, role;

