-- ============================================================
-- COMANDO RÁPIDO: Marcar usuário como desenvolvedor
-- ============================================================
-- 
-- PASSO 0: Descubra seu email ou ID
-- Execute o comando abaixo para ver todos os usuários e encontrar o seu:
SELECT 
    u.id,
    u.nome,
    u.username,
    au.email as email_auth,
    u.role
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC;

-- PASSO 1: Escolha UMA das opções abaixo e execute
-- ============================================================

-- OPÇÃO A: Por EMAIL (mais fácil)
-- Substitua 'seu-email@exemplo.com' pelo seu email cadastrado
UPDATE public.users
SET username = 'dev123', nome = 'Desenvolvedor', role = 'professional'
WHERE id = (SELECT id FROM auth.users WHERE email = 'seu-email@exemplo.com')
RETURNING id, nome, username;

-- ============================================================

-- OPÇÃO B: Por USERNAME atual
-- Substitua 'seu-username-atual' pelo seu username
UPDATE public.users
SET username = 'dev123', nome = 'Desenvolvedor', role = 'professional'
WHERE username = 'seu-username-atual'
RETURNING id, nome, username;

-- ============================================================

-- OPÇÃO C: Por ID do usuário (UUID)
-- Substitua o UUID abaixo pelo seu ID
UPDATE public.users
SET username = 'dev123', nome = 'Desenvolvedor', role = 'professional'
WHERE id = '00000000-0000-0000-0000-000000000000'::uuid
RETURNING id, nome, username;

-- ============================================================
-- IMPORTANTE: Após executar, faça logout e login novamente!
-- ============================================================

