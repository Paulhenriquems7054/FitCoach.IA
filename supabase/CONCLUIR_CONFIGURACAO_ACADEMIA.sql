-- ============================================
-- Próximos Passos: Concluir Configuração da Academia
-- Academia: 5a1f55ac-9904-4c7b-a637-943b132f3ac7
-- ============================================

-- ============================================
-- 1. VINCULAR ALUNOS EXISTENTES À ACADEMIA
-- ============================================

-- Se você já tem alunos com academy_id configurado, vincular automaticamente:
UPDATE public.users
SET 
  academias_id = academy_id  -- Mapear academy_id → academias_id (novo campo)
WHERE academy_id IS NOT NULL 
  AND academias_id IS NULL;

-- Ou vincular especificamente alunos desta academia:
-- UPDATE public.users
-- SET academias_id = '5a1f55ac-9904-4c7b-a637-943b132f3ac7'
-- WHERE academy_id = '5a1f55ac-9904-4c7b-a637-943b132f3ac7'
--   AND academias_id IS NULL;

-- ============================================
-- 2. RESETAR CONTADORES DE USO DOS ALUNOS
-- ============================================

-- Inicializar contadores de uso para o mês atual
UPDATE public.users
SET 
  periodo_uso_mes = TO_CHAR(NOW(), 'YYYY-MM'),  -- Formato: '2026-01'
  uso_texto = 0,
  uso_imagem = 0,
  uso_voz_minutos = 0,
  saldo_voz_extra = 0
WHERE (periodo_uso_mes IS NULL 
   OR periodo_uso_mes <> TO_CHAR(NOW(), 'YYYY-MM'))
   AND academias_id = '5a1f55ac-9904-4c7b-a637-943b132f3ac7';

-- ============================================
-- 3. VERIFICAR ALUNOS VINCULADOS
-- ============================================

-- Ver alunos vinculados a esta academia
SELECT 
  u.id,
  u.nome,
  u.username,
  u.email,
  u.academias_id,
  u.periodo_uso_mes,
  u.uso_texto,
  u.uso_imagem,
  u.uso_voz_minutos,
  u.saldo_voz_extra,
  u.modo_demo,
  u.interacoes_demo_usadas
FROM public.users u
WHERE u.academias_id = '5a1f55ac-9904-4c7b-a637-943b132f3ac7'
ORDER BY u.nome;

-- ============================================
-- 4. VERIFICAR CONFIGURAÇÃO COMPLETA
-- ============================================

-- Ver academia com limites configurados
SELECT 
  c.id,
  c.name,
  c.email,
  c.plano,
  c.alunos_max,
  c.limite_texto,
  c.limite_imagem,
  c.limite_voz,
  c.status,
  (SELECT COUNT(*) FROM public.users WHERE academias_id = c.id) as alunos_vinculados
FROM public.companies c
WHERE c.id = '5a1f55ac-9904-4c7b-a637-943b132f3ac7';

-- ============================================
-- 5. PRÓXIMOS PASSOS
-- ============================================

-- ✅ Academia configurada com sucesso!
-- ✅ Próximos passos:
--    1. Vincular alunos existentes (execute bloco 1 acima)
--    2. Resetar contadores de uso (execute bloco 2 acima)
--    3. Verificar alunos vinculados (execute bloco 3 acima)
--    4. Testar sistema de limites no frontend
--    5. Configurar webhook de pagamento para recargas FitVoice
