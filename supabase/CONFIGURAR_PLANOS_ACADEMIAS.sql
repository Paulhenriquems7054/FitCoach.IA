-- ============================================
-- Script para Configurar Planos das Academias
-- Execute APÓS a migration 003_novo_modelo_planos_academia.sql
-- ============================================

-- ============================================
-- 1. LISTAR ACADEMIAS EXISTENTES
-- ============================================

-- Ver todas as academias e seus planos atuais
SELECT 
  id,
  name,
  email,
  plan_type,
  plan_name,
  max_licenses,
  status,
  created_at
FROM public.companies
ORDER BY created_at DESC;

-- ============================================
-- 2. CONFIGURAR PLANO PARA UMA ACADEMIA ESPECÍFICA
-- ============================================

-- Substitua '<UUID_DA_ACADEMIA>' pelo ID real da academia listado acima

-- ⚠️ EXEMPLO: Configurar plano FitCoach50 (50 alunos, limites básicos)
-- ⚠️ IMPORTANTE: Este é apenas um EXEMPLO comentado. NÃO execute este bloco!
-- ⚠️ Use o UUID real da sua academia (copie do SELECT acima)

-- Descomente e substitua '<UUID_DA_ACADEMIA>' pelo UUID real:
-- UPDATE public.companies
-- SET 
--   plano = 'FitCoach50',
--   alunos_max = 50,
--   limite_texto = 1000,   -- 1000 mensagens/mês por aluno
--   limite_imagem = 100,   -- 100 análises/mês por aluno
--   limite_voz = 450       -- 450 min/mês por aluno (15 min/dia * 30 dias)
-- WHERE id = '<UUID_DA_ACADEMIA>'; -- ⚠️ SUBSTITUIR PELO UUID REAL

-- ============================================
-- 3. VALORES SUGERIDOS POR PLANO
-- ============================================

-- FitCoach50 (até 50 alunos)
-- UPDATE public.companies
-- SET 
--   plano = 'FitCoach50',
--   alunos_max = 50,
--   limite_texto = 1000,
--   limite_imagem = 100,
--   limite_voz = 450
-- WHERE id = '<UUID_DA_ACADEMIA>';

-- FitCoach100 (até 100 alunos)
-- UPDATE public.companies
-- SET 
--   plano = 'FitCoach100',
--   alunos_max = 100,
--   limite_texto = 1000,
--   limite_imagem = 100,
--   limite_voz = 450
-- WHERE id = '<UUID_DA_ACADEMIA>';

-- FitCoach200 (até 200 alunos)
-- UPDATE public.companies
-- SET 
--   plano = 'FitCoach200',
--   alunos_max = 200,
--   limite_texto = 2000,
--   limite_imagem = 200,
--   limite_voz = 600
-- WHERE id = '<UUID_DA_ACADEMIA>';

-- FitCoach400 (até 400 alunos)
-- UPDATE public.companies
-- SET 
--   plano = 'FitCoach400',
--   alunos_max = 400,
--   limite_texto = 3000,
--   limite_imagem = 300,
--   limite_voz = 900
-- WHERE id = '<UUID_DA_ACADEMIA>';

-- FitCoach500 (até 500 alunos)
-- UPDATE public.companies
-- SET 
--   plano = 'FitCoach500',
--   alunos_max = 500,
--   limite_texto = 5000,
--   limite_imagem = 500,
--   limite_voz = 1200
-- WHERE id = '<UUID_DA_ACADEMIA>';

-- ============================================
-- 4. CONFIGURAR PLANO BASEADO NO PLAN_TYPE EXISTENTE
-- ============================================

-- Se você já tem plan_type configurado, pode mapear automaticamente:

-- Mapear academy_starter_mini → FitCoach50
UPDATE public.companies
SET 
  plano = 'FitCoach50',
  alunos_max = 50,
  limite_texto = 1000,
  limite_imagem = 100,
  limite_voz = 450
WHERE plan_type = 'academy_starter_mini' 
  AND plano IS NULL;

-- Mapear academy_starter → FitCoach100
UPDATE public.companies
SET 
  plano = 'FitCoach100',
  alunos_max = 100,
  limite_texto = 1000,
  limite_imagem = 100,
  limite_voz = 450
WHERE plan_type = 'academy_starter' 
  AND plano IS NULL;

-- Mapear academy_growth → FitCoach200
UPDATE public.companies
SET 
  plano = 'FitCoach200',
  alunos_max = 200,
  limite_texto = 2000,
  limite_imagem = 200,
  limite_voz = 600
WHERE plan_type = 'academy_growth' 
  AND plano IS NULL;

-- Mapear academy_pro → FitCoach400
UPDATE public.companies
SET 
  plano = 'FitCoach400',
  alunos_max = 400,
  limite_texto = 3000,
  limite_imagem = 300,
  limite_voz = 900
WHERE plan_type = 'academy_pro' 
  AND plano IS NULL;

-- ============================================
-- 5. VINCULAR ALUNOS EXISTENTES ÀS ACADEMIAS
-- ============================================

-- Se você já tem academy_id configurado, pode mapear para academias_id:

UPDATE public.users
SET 
  academias_id = academy_id  -- Mapear academy_id → academias_id (novo campo)
WHERE academy_id IS NOT NULL 
  AND academias_id IS NULL;

-- OU se você usa gym_id, mapear também:
-- UPDATE public.users
-- SET academias_id = (SELECT id FROM public.companies WHERE master_code = users.gym_id)
-- WHERE gym_id IS NOT NULL 
--   AND academias_id IS NULL;

-- ============================================
-- 6. RESETAR CONTADORES DE USO DOS ALUNOS
-- ============================================

-- Inicializar contadores de uso para o mês atual
UPDATE public.users
SET 
  periodo_uso_mes = TO_CHAR(NOW(), 'YYYY-MM'),
  uso_texto = 0,
  uso_imagem = 0,
  uso_voz_minutos = 0,
  saldo_voz_extra = 0
WHERE periodo_uso_mes IS NULL 
   OR periodo_uso_mes <> TO_CHAR(NOW(), 'YYYY-MM');

-- ============================================
-- 7. VERIFICAR CONFIGURAÇÃO FINAL
-- ============================================

-- Ver academias configuradas
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
WHERE plano IS NOT NULL
ORDER BY plano, name;

-- Ver alunos vinculados às academias
SELECT 
  u.id,
  u.nome,
  u.username,
  c.name as academia_nome,
  c.plano as academia_plano,
  u.periodo_uso_mes,
  u.uso_texto,
  u.uso_imagem,
  u.uso_voz_minutos,
  u.saldo_voz_extra
FROM public.users u
LEFT JOIN public.companies c ON u.academias_id = c.id
WHERE u.academias_id IS NOT NULL
ORDER BY c.name, u.nome
LIMIT 20;

-- ============================================
-- 8. CONFIGURAÇÃO RÁPIDA (TODAS AS ACADEMIAS)
-- ============================================

-- Se quiser configurar um plano padrão para TODAS as academias sem plano:

-- FitCoach50 como padrão para academias sem plano configurado
UPDATE public.companies
SET 
  plano = 'FitCoach50',
  alunos_max = COALESCE(max_licenses, 50),
  limite_texto = 1000,
  limite_imagem = 100,
  limite_voz = 450
WHERE plano IS NULL
  AND status = 'active';

-- ============================================
-- NOTAS
-- ============================================

-- ⚠️ IMPORTANTE:
-- 1. Execute primeiro a migration 003_novo_modelo_planos_academia.sql
-- 2. Execute o SELECT no início para ver as academias existentes
-- 3. Copie o UUID real da academia
-- 4. Substitua '<UUID_DA_ACADEMIA>' pelo UUID real
-- 5. Execute o UPDATE específico para cada academia

-- 💡 DICA:
-- Se você tem poucas academias, use os UPDATEs individuais.
-- Se você tem muitas, use o mapeamento automático baseado em plan_type.
