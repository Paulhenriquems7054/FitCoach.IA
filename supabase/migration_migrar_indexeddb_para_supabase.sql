-- ============================================================================
-- Migration: Estratégia de Migração IndexedDB → Supabase
-- Data: 2025-01-27
-- Prioridade: ALTA
-- ============================================================================
-- 
-- PROBLEMA: Dados sensíveis armazenados localmente sem criptografia
--
-- SOLUÇÃO: Migrar dados do IndexedDB para Supabase
-- 
-- NOTA: Esta migration cria funções auxiliares para migração.
-- A migração real deve ser feita via código TypeScript no frontend.
-- ============================================================================

-- ============================================================================
-- FUNÇÃO: Migrar histórico de peso
-- ============================================================================

CREATE OR REPLACE FUNCTION migrate_weight_history_from_local(
    p_user_id UUID,
    p_weight_data JSONB
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_entry JSONB;
    v_gym_id TEXT;
BEGIN
    -- Obter gym_id do usuário uma vez
    SELECT gym_id INTO v_gym_id
    FROM public.users
    WHERE id = p_user_id;
    
    -- Garantir que a constraint UNIQUE existe
    -- (Se não existir, criar)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'weight_history_user_id_date_key'
        AND conrelid = 'public.weight_history'::regclass
    ) THEN
        -- Criar constraint única se não existir
        ALTER TABLE public.weight_history 
        ADD CONSTRAINT weight_history_user_id_date_key 
        UNIQUE (user_id, date);
    END IF;
    
    -- p_weight_data deve ser um array: [{"date": "2025-01-01", "weight": 70.5}, ...]
    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_weight_data)
    LOOP
        -- Usar UPSERT com ON CONFLICT
        INSERT INTO public.weight_history (
            user_id,
            date,
            weight,
            gym_id
        )
        VALUES (
            p_user_id,
            (v_entry->>'date')::DATE,
            (v_entry->>'weight')::DECIMAL(5,2),
            v_gym_id
        )
        ON CONFLICT (user_id, date) DO UPDATE
        SET weight = EXCLUDED.weight,
            gym_id = COALESCE(EXCLUDED.gym_id, weight_history.gym_id);
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNÇÃO: Migrar mensagens de chat
-- ============================================================================

CREATE OR REPLACE FUNCTION migrate_chat_messages_from_local(
    p_user_id UUID,
    p_messages JSONB
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_message JSONB;
BEGIN
    -- p_messages deve ser um array de mensagens
    FOR v_message IN SELECT * FROM jsonb_array_elements(p_messages)
    LOOP
        INSERT INTO public.chat_messages (
            user_id,
            message_data,
            gym_id,
            created_at
        )
        VALUES (
            p_user_id,
            v_message,
            (SELECT gym_id FROM public.users WHERE id = p_user_id),
            COALESCE((v_message->>'timestamp')::TIMESTAMPTZ, NOW())
        );
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON FUNCTION migrate_weight_history_from_local IS 
'Migra histórico de peso do IndexedDB para Supabase. 
Recebe user_id e array JSON de entradas de peso.';

COMMENT ON FUNCTION migrate_chat_messages_from_local IS 
'Migra mensagens de chat do IndexedDB para Supabase.
Recebe user_id e array JSON de mensagens.';

-- ============================================================================
-- NOTA IMPORTANTE
-- ============================================================================
-- 
-- Esta migration cria apenas as funções auxiliares.
-- A migração real deve ser implementada no frontend via:
-- 
-- 1. Criar serviço de migração (services/migrationService.ts)
-- 2. Ler dados do IndexedDB
-- 3. Chamar estas funções via Supabase RPC
-- 4. Limpar IndexedDB após migração bem-sucedida
-- 
-- Exemplo de uso no TypeScript:
-- 
-- const { data, error } = await supabase.rpc('migrate_weight_history_from_local', {
--   p_user_id: userId,
--   p_weight_data: weightHistoryArray
-- });
-- ============================================================================

