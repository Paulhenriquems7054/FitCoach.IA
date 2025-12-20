-- ============================================================================
-- Migration: Função para revogar acesso quando assinatura expira
-- Data: 2025-01-27
-- Prioridade: ALTA
-- ============================================================================
-- 
-- PROBLEMA: Quando assinatura expira ou é cancelada, acesso não é revogado
-- automaticamente
--
-- SOLUÇÃO: Criar função que revoga acesso e configurar cron job
-- ============================================================================

CREATE OR REPLACE FUNCTION revoke_expired_subscriptions()
RETURNS TABLE(
    companies_revoked INTEGER,
    users_revoked INTEGER,
    licenses_revoked INTEGER
) AS $$
DECLARE
    v_companies_revoked INTEGER := 0;
    v_users_revoked INTEGER := 0;
    v_licenses_revoked INTEGER := 0;
    v_additional_users_revoked INTEGER := 0;
BEGIN
    -- 1. Revogar companies expiradas
    UPDATE public.companies
    SET 
        status = 'cancelled',
        cancelled_at = NOW(),
        updated_at = NOW()
    WHERE 
        status = 'active'
        AND expires_at IS NOT NULL
        AND expires_at < NOW();
    
    GET DIAGNOSTICS v_companies_revoked = ROW_COUNT;

    -- 2. Revogar licenças de companies canceladas
    UPDATE public.company_licenses
    SET 
        status = 'expired',
        expires_at = NOW(),
        revoked_at = NOW(),
        updated_at = NOW()
    WHERE 
        status = 'active'
        AND EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = company_licenses.company_id
            AND c.status = 'cancelled'
        );
    
    GET DIAGNOSTICS v_licenses_revoked = ROW_COUNT;

    -- 3. Bloquear acesso de usuários com assinaturas expiradas (individuais)
    UPDATE public.users
    SET 
        subscription_status = 'expired',
        access_blocked = TRUE,
        blocked_at = NOW(),
        blocked_reason = 'Assinatura expirada',
        updated_at = NOW()
    WHERE 
        subscription_status = 'active'
        AND expiry_date IS NOT NULL
        AND expiry_date < NOW()
        AND (gym_id IS NULL OR gym_id NOT IN (
            SELECT id::text FROM public.companies WHERE status = 'active'
        ));
    
    GET DIAGNOSTICS v_users_revoked = ROW_COUNT;

    -- 4. Bloquear alunos de academias canceladas
    UPDATE public.users
    SET 
        access_blocked = TRUE,
        blocked_at = NOW(),
        blocked_reason = 'Academia cancelou assinatura',
        updated_at = NOW()
    WHERE 
        gym_id IS NOT NULL
        AND access_blocked = FALSE
        AND EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id::text = users.gym_id
            AND c.status = 'cancelled'
        );
    
    GET DIAGNOSTICS v_additional_users_revoked = ROW_COUNT;
    v_users_revoked := v_users_revoked + v_additional_users_revoked;

    -- 5. Atualizar assinaturas expiradas
    UPDATE public.user_subscriptions
    SET 
        status = 'expired',
        updated_at = NOW()
    WHERE 
        status = 'active'
        AND current_period_end < NOW();

    RETURN QUERY SELECT v_companies_revoked, v_users_revoked, v_licenses_revoked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário
COMMENT ON FUNCTION revoke_expired_subscriptions() IS 
'Revoga acesso automaticamente quando assinaturas expiram ou são canceladas. 
Executar diariamente via cron job.';

-- ============================================================================
-- CONFIGURAR CRON JOB (se pg_cron estiver disponível)
-- ============================================================================
-- 
-- No Supabase, você pode configurar via Dashboard > Database > Cron Jobs
-- ou executar manualmente:
--
-- SELECT cron.schedule(
--     'revoke-expired-subscriptions',
--     '0 2 * * *',  -- Todo dia às 2h da manhã
--     'SELECT revoke_expired_subscriptions();'
-- );
--
-- Para executar manualmente:
-- SELECT * FROM revoke_expired_subscriptions();
-- ============================================================================

