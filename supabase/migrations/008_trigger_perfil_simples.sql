-- Migration: Trigger simples para criar perfil após signup
-- Data: 2026-01-18
-- Descrição: Implementa o padrão correto e simples de criação automática de perfil via trigger

-- ============================================================================
-- 1. CRIAR FUNÇÃO TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_nome TEXT;
    user_username TEXT;
BEGIN
    -- Extrair nome e username do metadata
    user_nome := COALESCE(
        NEW.raw_user_meta_data->>'nome',
        NEW.raw_user_meta_data->>'name',
        SPLIT_PART(COALESCE(NEW.email, ''), '@', 1)
    );
    
    user_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        LOWER(REGEXP_REPLACE(user_nome, '[^a-zA-Z0-9]', '_', 'g'))
    );
    
    -- Garantir username único
    WHILE EXISTS (SELECT 1 FROM public.users WHERE username = user_username) LOOP
        user_username := user_username || '_' || FLOOR(RANDOM() * 1000)::TEXT;
    END LOOP;
    
    -- Inserir perfil do usuário
    INSERT INTO public.users (
        id,
        nome,
        username,
        email,
        plan_type,
        subscription_status,
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
        voice_daily_limit_seconds,
        voice_used_today_seconds,
        voice_balance_upsell,
        text_msg_count_today,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        user_nome,
        user_username,
        NEW.email,
        'free',
        'active',
        0,
        'Masculino',
        0,
        0,
        'perder peso',
        0,
        0,
        ARRAY[]::TEXT[],
        false,
        'user',
        900,
        0,
        0,
        0,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. CRIAR TRIGGER NO AUTH.USERS
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 3. AJUSTAR RLS DA TABELA users
-- ============================================================================

-- Garantir que RLS está habilitado
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow insert via auth trigger" ON public.users;
DROP POLICY IF EXISTS "Allow insert via trigger or own profile" ON public.users;

-- SELECT: usuário pode ver seu próprio perfil
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- INSERT: permitido via trigger (security definer)
CREATE POLICY "Allow insert via auth trigger"
ON public.users
FOR INSERT
WITH CHECK (true);

-- UPDATE: usuário pode atualizar o próprio perfil
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
