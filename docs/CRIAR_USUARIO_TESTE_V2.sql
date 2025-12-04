-- ============================================
-- CRIAR USUÁRIO DE TESTE PARA WEBHOOK
-- Execute no SQL Editor do Supabase
-- ============================================
-- 
-- IMPORTANTE: A tabela public.users referencia auth.users
-- Você precisa criar o usuário em auth.users primeiro!
--
-- OPÇÃO 1: Criar via Dashboard (RECOMENDADO)
-- 1. Acesse: Supabase Dashboard → Authentication → Users → Add user
-- 2. Email: teste@exemplo.com
-- 3. Senha: teste123456
-- 4. Auto Confirm User: ✅ (marcar)
-- 5. Clique em "Create user"
-- 6. Depois execute a query abaixo (OPÇÃO 2)
--
-- OPÇÃO 2: Criar perfil após criar em auth.users
-- Execute esta query DEPOIS de criar o usuário em auth.users

DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'teste@exemplo.com';
BEGIN
    -- Buscar ID do usuário em auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email
    LIMIT 1;
    
    -- Se não encontrou, mostrar mensagem
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado em auth.users! Crie primeiro via Dashboard: Authentication → Users → Add user (email: %, senha: teste123456)', v_email;
    END IF;
    
    -- Criar perfil em public.users usando a função insert_user_profile_after_signup
    INSERT INTO public.users (
        id, 
        nome, 
        email, 
        username, 
        idade,
        genero,
        peso,
        altura,
        objetivo,
        points,
        discipline_score,
        completed_challenge_ids,
        is_anonymized,
        role,
        plan_type,
        subscription_status,
        voice_daily_limit_seconds,
        voice_used_today_seconds,
        voice_balance_upsell,
        text_msg_count_today,
        created_at,
        updated_at
    )
    SELECT 
        v_user_id,
        'Usuário Teste',           -- nome (obrigatório)
        v_email,                    -- email
        'usuario_teste',            -- username
        25,                         -- idade
        'Masculino',                -- genero
        70.0,                       -- peso
        1.75,                       -- altura
        'perder peso',              -- objetivo
        0,                          -- points
        0,                          -- discipline_score
        '{}',                       -- completed_challenge_ids (array vazio)
        false,                      -- is_anonymized
        'user',                     -- role
        'free',                     -- plan_type
        'active',                   -- subscription_status
        900,                        -- voice_daily_limit_seconds (15 min)
        0,                          -- voice_used_today_seconds
        0,                          -- voice_balance_upsell
        0,                          -- text_msg_count_today
        NOW(),                      -- created_at
        NOW()                       -- updated_at
    WHERE NOT EXISTS (
        SELECT 1 FROM public.users WHERE email = v_email
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE '✅ Usuário de teste criado com sucesso! ID: %', v_user_id;
END $$;

-- Verificar se foi criado
SELECT 
    id,
    nome,
    email,
    username,
    role,
    plan_type,
    subscription_status,
    created_at
FROM public.users 
WHERE email = 'teste@exemplo.com';

