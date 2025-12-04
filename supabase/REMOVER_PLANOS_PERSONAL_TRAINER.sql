-- ============================================================================
-- REMOVER PLANOS PERSONAL TRAINER DA TABELA app_plans
-- Execute no SQL Editor do Supabase
-- ============================================================================
-- 
-- PLANOS PERSONAL TRAINER FORAM REMOVIDOS:
-- - personal_team_5 (Team 5)
-- - personal_team_15 (Team 15)
-- 
-- Estes planos não existem mais na página de vendas nem na Cakto.
-- ============================================================================

-- ============================================================================
-- 1. DESATIVAR OS PLANOS PERSONAL TRAINER (ao invés de deletar, para manter histórico)
-- ============================================================================

UPDATE public.app_plans
SET is_active = false,
    updated_at = NOW()
WHERE plan_group = 'personal'
  AND slug IN ('personal_team_5', 'personal_team_15');

-- ============================================================================
-- OU SE PREFERIR DELETAR COMPLETAMENTE:
-- ============================================================================
-- 
-- DELETE FROM public.app_plans
-- WHERE plan_group = 'personal'
--   AND slug IN ('personal_team_5', 'personal_team_15');
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
WHERE plan_group = 'personal'
ORDER BY slug;

-- Resultado esperado: planos Personal Trainer devem aparecer como "❌ Desativado"

