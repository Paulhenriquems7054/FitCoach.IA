-- ============================================
-- ATUALIZAÇÃO DE PREÇOS DOS PLANOS DE VENDAS (Versão Alternativa)
-- Data: 2026-01-17
-- Descrição: Atualiza preços dos planos conforme página de vendas
-- Versão alternativa que usa DO blocks para UPSERT manual
-- ============================================

-- ============================================
-- GARANTIR CONSTRAINT UNIQUE NO NAME (se não existir)
-- ============================================
DO $$
BEGIN
  -- Verificar se a constraint UNIQUE em 'name' existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'plans_name_key' 
    AND conrelid = 'public.plans'::regclass
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.plans'::regclass 
    AND contype = 'u'
    AND pg_get_constraintdef(oid) LIKE '%name%'
  ) THEN
    -- Criar constraint UNIQUE no campo name
    ALTER TABLE public.plans ADD CONSTRAINT plans_name_key UNIQUE (name);
    RAISE NOTICE 'Constraint UNIQUE criada no campo name';
  ELSE
    RAISE NOTICE 'Constraint UNIQUE já existe ou tabela não existe';
  END IF;
EXCEPTION
  WHEN duplicate_table THEN
    RAISE NOTICE 'Tabela plans não existe ainda';
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao criar constraint: %', SQLERRM;
END $$;

-- ============================================
-- 1. PLANOS B2C (Consumidor Final)
-- ============================================

-- Plano Mensal B2C (UPSERT manual)
DO $$
DECLARE
  plan_exists BOOLEAN;
BEGIN
  -- Verificar se o plano já existe
  SELECT EXISTS(SELECT 1 FROM public.plans WHERE name = 'Plano Mensal') INTO plan_exists;
  
  IF plan_exists THEN
    -- Atualizar plano existente
    UPDATE public.plans SET
      description = 'Análise de Fotos Ilimitada, Chat de Texto Ilimitado, 15 min/dia de Consultoria de Voz (Live)',
      price = 39.90,
      requests_per_month = 1000,
      image_analysis_per_month = 100,
      voice_messages_per_month = 0,
      features = '{"ai_analysis": true, "export_pdf": true, "advanced_reports": true, "priority_support": false, "custom_diet": true}'::jsonb,
      is_active = true,
      is_featured = false,
      display_order = 1,
      max_students = COALESCE(max_students, 1),  -- Manter valor existente ou definir 1
      monthly_ai_quota = COALESCE(monthly_ai_quota, 1000),  -- Manter valor existente ou definir 1000
      updated_at = NOW()
    WHERE name = 'Plano Mensal';
  ELSE
    -- Inserir novo plano
    INSERT INTO public.plans (
      name, description, price, 
      requests_per_month, image_analysis_per_month, voice_messages_per_month,
      features, is_active, is_featured, display_order,
      max_students, monthly_ai_quota
    ) VALUES (
      'Plano Mensal', 
      'Análise de Fotos Ilimitada, Chat de Texto Ilimitado, 15 min/dia de Consultoria de Voz (Live)', 
      39.90,
      1000,
      100,
      0,
      '{"ai_analysis": true, "export_pdf": true, "advanced_reports": true, "priority_support": false, "custom_diet": true}'::jsonb,
      true,
      false,
      1,
      1,  -- max_students: 1 para planos B2C individuais
      1000  -- monthly_ai_quota: 1000 requisições
    );
  END IF;
END $$;

-- Plano Anual B2C (VIP)
DO $$
DECLARE
  plan_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.plans WHERE name = 'Plano Anual VIP') INTO plan_exists;
  
  IF plan_exists THEN
    UPDATE public.plans SET
      description = 'Análise de Fotos Ilimitada, Chat de Texto Ilimitado, 15 min/dia de Consultoria de Voz (Live) - Economia de R$ 200,00',
      price = 297.00,
      requests_per_month = 1000,
      image_analysis_per_month = 100,
      voice_messages_per_month = 0,
      features = '{"ai_analysis": true, "export_pdf": true, "advanced_reports": true, "priority_support": true, "custom_diet": true}'::jsonb,
      is_active = true,
      is_featured = true,
      display_order = 2,
      max_students = COALESCE(max_students, 1),
      monthly_ai_quota = COALESCE(monthly_ai_quota, 1000),
      updated_at = NOW()
    WHERE name = 'Plano Anual VIP';
  ELSE
    INSERT INTO public.plans (
      name, description, price, 
      requests_per_month, image_analysis_per_month, voice_messages_per_month,
      features, is_active, is_featured, display_order,
      max_students, monthly_ai_quota
    ) VALUES (
      'Plano Anual VIP', 
      'Análise de Fotos Ilimitada, Chat de Texto Ilimitado, 15 min/dia de Consultoria de Voz (Live) - Economia de R$ 200,00', 
      297.00,
      1000,
      100,
      0,
      '{"ai_analysis": true, "export_pdf": true, "advanced_reports": true, "priority_support": true, "custom_diet": true}'::jsonb,
      true,
      true,
      2,
      1,  -- max_students: 1 para planos B2C individuais
      1000  -- monthly_ai_quota: 1000 requisições
    );
  END IF;
END $$;

-- ============================================
-- 2. PLANOS B2B (Academias)
-- ============================================

-- Pack Starter Mini (10 licenças)
DO $$
DECLARE
  plan_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.plans WHERE name = 'Pack Starter Mini') INTO plan_exists;
  
  IF plan_exists THEN
    UPDATE public.plans SET
      description = 'Plataforma para pequenas academias - Até 10 alunos acompanhados na plataforma',
      price = 149.90,
      requests_per_month = 2500,
      image_analysis_per_month = 250,
      voice_messages_per_month = 0,
      features = '{"ai_analysis": true, "export_pdf": true, "advanced_reports": true, "priority_support": false, "custom_diet": true}'::jsonb,
      is_active = true,
      is_featured = false,
      display_order = 3,
      max_students = COALESCE(max_students, 10),
      monthly_ai_quota = COALESCE(monthly_ai_quota, 2500),
      updated_at = NOW()
    WHERE name = 'Pack Starter Mini';
  ELSE
    INSERT INTO public.plans (
      name, description, price, 
      requests_per_month, image_analysis_per_month, voice_messages_per_month,
      features, is_active, is_featured, display_order,
      max_students, monthly_ai_quota
    ) VALUES (
      'Pack Starter Mini', 
      'Plataforma para pequenas academias - Até 10 alunos acompanhados na plataforma', 
      149.90,
      2500,
      250,
      0,
      '{"ai_analysis": true, "export_pdf": true, "advanced_reports": true, "priority_support": false, "custom_diet": true}'::jsonb,
      true,
      false,
      3,
      10,  -- max_students: 10 licenças
      2500  -- monthly_ai_quota: 2500 requisições
    );
  END IF;
END $$;

-- Pack Starter (20 licenças)
DO $$
DECLARE
  plan_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.plans WHERE name = 'Pack Starter') INTO plan_exists;
  
  IF plan_exists THEN
    UPDATE public.plans SET
      description = 'Plano para academias - 20 licenças (R$ 14,99/aluno)',
      price = 299.90,
      requests_per_month = 5000,
      image_analysis_per_month = 500,
      voice_messages_per_month = 0,
      features = '{"ai_analysis": true, "export_pdf": true, "advanced_reports": true, "priority_support": false, "custom_diet": true}'::jsonb,
      is_active = true,
      is_featured = false,
      display_order = 4,
      max_students = COALESCE(max_students, 20),
      monthly_ai_quota = COALESCE(monthly_ai_quota, 5000),
      updated_at = NOW()
    WHERE name = 'Pack Starter';
  ELSE
    INSERT INTO public.plans (
      name, description, price, 
      requests_per_month, image_analysis_per_month, voice_messages_per_month,
      features, is_active, is_featured, display_order,
      max_students, monthly_ai_quota
    ) VALUES (
      'Pack Starter', 
      'Plano para academias - 20 licenças (R$ 14,99/aluno)', 
      299.90,
      5000,
      500,
      0,
      '{"ai_analysis": true, "export_pdf": true, "advanced_reports": true, "priority_support": false, "custom_diet": true}'::jsonb,
      true,
      false,
      4,
      20,  -- max_students: 20 licenças
      5000  -- monthly_ai_quota: 5000 requisições
    );
  END IF;
END $$;

-- Pack Growth (50 licenças) - MAIS VENDIDO
DO $$
DECLARE
  plan_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.plans WHERE name = 'Pack Growth') INTO plan_exists;
  
  IF plan_exists THEN
    UPDATE public.plans SET
      description = 'Plano para academias - 50 licenças (R$ 12,99/aluno)',
      price = 649.90,
      requests_per_month = 12000,
      image_analysis_per_month = 1200,
      voice_messages_per_month = 0,
      features = '{"ai_analysis": true, "export_pdf": true, "advanced_reports": true, "priority_support": true, "custom_diet": true}'::jsonb,
      is_active = true,
      is_featured = true,  -- MAIS VENDIDO
      display_order = 5,
      max_students = COALESCE(max_students, 50),
      monthly_ai_quota = COALESCE(monthly_ai_quota, 12000),
      updated_at = NOW()
    WHERE name = 'Pack Growth';
  ELSE
    INSERT INTO public.plans (
      name, description, price, 
      requests_per_month, image_analysis_per_month, voice_messages_per_month,
      features, is_active, is_featured, display_order,
      max_students, monthly_ai_quota
    ) VALUES (
      'Pack Growth', 
      'Plano para academias - 50 licenças (R$ 12,99/aluno)', 
      649.90,
      12000,
      1200,
      0,
      '{"ai_analysis": true, "export_pdf": true, "advanced_reports": true, "priority_support": true, "custom_diet": true}'::jsonb,
      true,
      true,  -- MAIS VENDIDO
      5,
      50,  -- max_students: 50 licenças
      12000  -- monthly_ai_quota: 12000 requisições
    );
  END IF;
END $$;

-- Pack Pro (100 licenças)
DO $$
DECLARE
  plan_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.plans WHERE name = 'Pack Pro') INTO plan_exists;
  
  IF plan_exists THEN
    UPDATE public.plans SET
      description = 'Plano para academias - 100 licenças (R$ 11,99/aluno)',
      price = 1199.90,
      requests_per_month = 25000,
      image_analysis_per_month = 2500,
      voice_messages_per_month = 0,
      features = '{"ai_analysis": true, "export_pdf": true, "advanced_reports": true, "priority_support": true, "custom_diet": true}'::jsonb,
      is_active = true,
      is_featured = false,
      display_order = 6,
      max_students = COALESCE(max_students, 100),
      monthly_ai_quota = COALESCE(monthly_ai_quota, 25000),
      updated_at = NOW()
    WHERE name = 'Pack Pro';
  ELSE
    INSERT INTO public.plans (
      name, description, price, 
      requests_per_month, image_analysis_per_month, voice_messages_per_month,
      features, is_active, is_featured, display_order,
      max_students, monthly_ai_quota
    ) VALUES (
      'Pack Pro', 
      'Plano para academias - 100 licenças (R$ 11,99/aluno)', 
      1199.90,
      25000,
      2500,
      0,
      '{"ai_analysis": true, "export_pdf": true, "advanced_reports": true, "priority_support": true, "custom_diet": true}'::jsonb,
      true,
      false,
      6,
      100,  -- max_students: 100 licenças
      25000  -- monthly_ai_quota: 25000 requisições
    );
  END IF;
END $$;

-- ============================================
-- 3. PLANOS PERSONAL TRAINER (Uso interno - não aparecem na página de vendas)
-- ============================================

-- Team 5 (5 licenças) - Desativar se não for necessário
DO $$
DECLARE
  plan_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.plans WHERE name = 'Team 5') INTO plan_exists;
  
  IF plan_exists THEN
    UPDATE public.plans SET
      description = 'Plano para Personal Trainers - 5 licenças (R$ 19,98/cliente)',
      price = 99.90,
      requests_per_month = 2000,
      image_analysis_per_month = 200,
      voice_messages_per_month = 0,
      features = '{"ai_analysis": true, "export_pdf": true, "advanced_reports": true, "priority_support": false, "custom_diet": true}'::jsonb,
      is_active = false,  -- Não aparece na página de vendas
      is_featured = false,
      display_order = 7,
      max_students = COALESCE(max_students, 5),
      monthly_ai_quota = COALESCE(monthly_ai_quota, 2000),
      updated_at = NOW()
    WHERE name = 'Team 5';
  ELSE
    INSERT INTO public.plans (
      name, description, price, 
      requests_per_month, image_analysis_per_month, voice_messages_per_month,
      features, is_active, is_featured, display_order,
      max_students, monthly_ai_quota
    ) VALUES (
      'Team 5', 
      'Plano para Personal Trainers - 5 licenças (R$ 19,98/cliente)', 
      99.90,
      2000,
      200,
      0,
      '{"ai_analysis": true, "export_pdf": true, "advanced_reports": true, "priority_support": false, "custom_diet": true}'::jsonb,
      false,  -- Não aparece na página de vendas
      false,
      7,
      5,  -- max_students: 5 licenças
      2000  -- monthly_ai_quota: 2000 requisições
    );
  END IF;
END $$;

-- Team 15 (15 licenças) - Desativar se não for necessário
DO $$
DECLARE
  plan_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.plans WHERE name = 'Team 15') INTO plan_exists;
  
  IF plan_exists THEN
    UPDATE public.plans SET
      description = 'Plano para Personal Trainers - 15 licenças (R$ 16,66/cliente)',
      price = 249.90,
      requests_per_month = 6000,
      image_analysis_per_month = 600,
      voice_messages_per_month = 0,
      features = '{"ai_analysis": true, "export_pdf": true, "advanced_reports": true, "priority_support": true, "custom_diet": true}'::jsonb,
      is_active = false,  -- Não aparece na página de vendas
      is_featured = false,
      display_order = 8,
      max_students = COALESCE(max_students, 15),
      monthly_ai_quota = COALESCE(monthly_ai_quota, 6000),
      updated_at = NOW()
    WHERE name = 'Team 15';
  ELSE
    INSERT INTO public.plans (
      name, description, price, 
      requests_per_month, image_analysis_per_month, voice_messages_per_month,
      features, is_active, is_featured, display_order,
      max_students, monthly_ai_quota
    ) VALUES (
      'Team 15', 
      'Plano para Personal Trainers - 15 licenças (R$ 16,66/cliente)', 
      249.90,
      6000,
      600,
      0,
      '{"ai_analysis": true, "export_pdf": true, "advanced_reports": true, "priority_support": true, "custom_diet": true}'::jsonb,
      false,  -- Não aparece na página de vendas
      false,
      8,
      15,  -- max_students: 15 licenças
      6000  -- monthly_ai_quota: 6000 requisições
    );
  END IF;
END $$;

-- ============================================
-- DESATIVAR PLANOS ANTIGOS (Starter, Growth, Pro)
-- ============================================

-- Desativar planos antigos com preço 0.00
UPDATE public.plans 
SET is_active = false, 
    updated_at = NOW()
WHERE name IN ('Starter', 'Growth', 'Pro')
  AND price = 0.00;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Ver todos os planos atualizados
SELECT 
  id, name, price, description, 
  requests_per_month, image_analysis_per_month,
  is_active, is_featured, display_order,
  created_at, updated_at
FROM public.plans
WHERE is_active = true
ORDER BY display_order, name;
