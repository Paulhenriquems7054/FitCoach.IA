-- ============================================
-- Configurar Academia "Academia Teste Migração"
-- UUID: 5a1f55ac-9904-4c7b-a637-943b132f3ac7
-- Plan Type Atual: academy_starter_mini
-- ============================================

-- Configurar plano FitCoach50 (baseado no plan_type academy_starter_mini)
UPDATE public.companies
SET 
  plano = 'FitCoach50',
  alunos_max = 50,
  limite_texto = 1000,   -- 1000 mensagens/mês por aluno
  limite_imagem = 100,   -- 100 análises/mês por aluno
  limite_voz = 450       -- 450 min/mês por aluno (15 min/dia * 30 dias)
WHERE id = '5a1f55ac-9904-4c7b-a637-943b132f3ac7';

-- ============================================
-- Verificar se foi configurado corretamente
-- ============================================

SELECT 
  id,
  name,
  email,
  plano,
  alunos_max,
  limite_texto,
  limite_imagem,
  limite_voz,
  status
FROM public.companies
WHERE id = '5a1f55ac-9904-4c7b-a637-943b132f3ac7';
