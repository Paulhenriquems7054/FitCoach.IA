-- ============================================================================
-- REMOVER PLANOS B2C DA TABELA app_plans
-- Execute no SQL Editor do Supabase
-- ============================================================================
-- 
-- PLANOS B2C FORAM REMOVIDOS:
-- - b2c_mensal (Plano Mensal)
-- - b2c_anual_vip (Plano Anual VIP)
-- 
-- Estes planos não existem mais na página de vendas nem na Cakto.
-- ============================================================================

-- ============================================================================
-- 1. DESATIVAR OS PLANOS B2C (ao invés de deletar, para manter histórico)
-- ============================================================================

UPDATE public.app_plans
SET is_active = false,
    updated_at = NOW()
WHERE plan_group = 'b2c'
  AND slug IN ('b2c_mensal', 'b2c_anual_vip');

-- ============================================================================
-- OU SE PREFERIR DELETAR COMPLETAMENTE:
-- ============================================================================
-- 
-- DELETE FROM public.app_plans
-- WHERE plan_group = 'b2c'
--   AND slug IN ('b2c_mensal', 'b2c_anual_vip');
-- 
-- ⚠️ ATENÇÃO: Deletar pode quebrar histórico de assinaturas existentes.
--    Recomendado apenas desativar (is_active = false).
-- ============================================================================

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

SELECT 
    plan_group,
    slug,
    name,
    is_active,
    CASE 
        WHEN is_active THEN '✅ Ativo'
        ELSE '❌ Desativado'
    END as status
FROM public.app_plans
WHERE plan_group = 'b2c'
ORDER BY slug;

-- Resultado esperado: planos B2C devem aparecer como "❌ Desativado"

