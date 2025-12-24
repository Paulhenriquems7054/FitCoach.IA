-- ============================================
-- ATUALIZAÇÃO DE PLANOS CONFORME ESPECIFICAÇÃO DE VENDAS
-- Data: 23/12/2025
-- Tabela: subscription_plans (não plans)
-- ============================================

-- ============================================
-- 1. ADICIONAR CAMPOS NECESSÁRIOS À TABELA
-- ============================================

-- Adicionar colunas de checkout se não existirem
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS plan_category TEXT,
ADD COLUMN IF NOT EXISTS checkout_url_monthly TEXT,
ADD COLUMN IF NOT EXISTS checkout_url_yearly TEXT,
ADD COLUMN IF NOT EXISTS checkout_price_monthly DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS checkout_price_yearly DECIMAL(10,2);

-- ============================================
-- 2. PLANOS B2C (INDIVIDUAIS - USO DA IA)
-- ============================================

-- Plano Mensal (Uso da IA)
INSERT INTO public.subscription_plans (id, name, display_name, description, price_monthly, price_yearly, plan_category, features, limits, checkout_url_monthly, checkout_url_yearly, checkout_price_monthly, checkout_price_yearly, currency, is_active, is_visible, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'ai_monthly',
  'Plano Mensal',
  'Análise de fotos e treinos com IA, treinos personalizados sob demanda, chat de texto ilimitado, 15 min/dia de consultoria de voz (Live). Cobrança individual, cancelamento a qualquer momento.',
  34.90,
  NULL,
  'b2c_ai',
  '["chat_ilimitado", "voz_15min_dia", "analise_fotos_ilimitada", "treinos_personalizados", "cancelamento_qualquer_momento"]'::jsonb,
  '{"chat_messages": -1, "voice_minutes_per_day": 15, "vision_scans": -1, "plans": -1}'::jsonb,
  'https://pay.cakto.com.br/zeygxve_668421',
  NULL,
  35.89,
  NULL,
  'BRL',
  TRUE,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  plan_category = EXCLUDED.plan_category,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  checkout_url_monthly = EXCLUDED.checkout_url_monthly,
  checkout_price_monthly = EXCLUDED.checkout_price_monthly,
  updated_at = NOW();

-- Plano Anual VIP (Uso da IA)
INSERT INTO public.subscription_plans (id, name, display_name, description, price_monthly, price_yearly, plan_category, features, limits, checkout_url_monthly, checkout_url_yearly, checkout_price_monthly, checkout_price_yearly, currency, is_active, is_visible, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'ai_annual_vip',
  'Plano Anual VIP',
  'Tudo do plano mensal + economia de R$ 200,00 + acesso imediato + garantia de satisfação. Pagamento: à vista ou 12x de R$ 34,53.',
  34.90,
  297.00,
  'b2c_ai',
  '["chat_ilimitado", "voz_15min_dia", "analise_fotos_ilimitada", "treinos_personalizados", "garantia_satisfacao", "economia_200"]'::jsonb,
  '{"chat_messages": -1, "voice_minutes_per_day": 15, "vision_scans": -1, "plans": -1, "installments": {"count": 12, "value": 34.53}, "savings": 200.00}'::jsonb,
  NULL,
  'https://pay.cakto.com.br/wvbkepi_668441',
  NULL,
  297.99,
  'BRL',
  TRUE,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  plan_category = EXCLUDED.plan_category,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  checkout_url_yearly = EXCLUDED.checkout_url_yearly,
  checkout_price_yearly = EXCLUDED.checkout_price_yearly,
  updated_at = NOW();

-- ============================================
-- 3. PLANOS B2B (ACADEMIAS - PLATAFORMA)
-- ============================================

-- Starter Mini (NOVO)
INSERT INTO public.subscription_plans (id, name, display_name, description, price_monthly, price_yearly, plan_category, features, limits, checkout_url_monthly, checkout_price_monthly, currency, is_active, is_visible, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'starter_mini',
  'Starter Mini',
  'Painel do Administrador, cadastro de unidades e profissionais, convites por link/QR Code para até 10 alunos, visão geral de trials/ativos/inativos, relatórios gerais de engajamento.',
  149.90,
  NULL,
  'b2b_platform',
  '["painel_admin", "cadastro_unidades", "cadastro_profissionais", "convites_link_qr", "relatorios_engajamento"]'::jsonb,
  '{"max_students": 10, "max_prompts_per_month": 500}'::jsonb,
  'https://pay.cakto.com.br/3b2kpwc_671196',
  150.89,
  'BRL',
  TRUE,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  plan_category = EXCLUDED.plan_category,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  checkout_url_monthly = EXCLUDED.checkout_url_monthly,
  checkout_price_monthly = EXCLUDED.checkout_price_monthly,
  updated_at = NOW();

-- Starter
INSERT INTO public.subscription_plans (id, name, display_name, description, price_monthly, price_yearly, plan_category, features, limits, checkout_url_monthly, checkout_price_monthly, currency, is_active, is_visible, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'starter',
  'Starter',
  'Dashboards para Administrador e Personais, convites por link/QR para dezenas de alunos, acompanhamento de trials/ativos/inativos, gestão centralizada da base de alunos digitais.',
  299.90,
  NULL,
  'b2b_platform',
  '["dashboard_admin", "dashboard_personais", "convites_link_qr", "acompanhamento_trials", "gestao_centralizada"]'::jsonb,
  '{"max_students": 20, "max_prompts_per_month": 1000}'::jsonb,
  'https://pay.cakto.com.br/cemyp2n_668537',
  300.89,
  'BRL',
  TRUE,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  plan_category = EXCLUDED.plan_category,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  checkout_url_monthly = EXCLUDED.checkout_url_monthly,
  checkout_price_monthly = EXCLUDED.checkout_price_monthly,
  updated_at = NOW();

-- Growth (Mais Vendido)
INSERT INTO public.subscription_plans (id, name, display_name, description, price_monthly, price_yearly, plan_category, features, limits, checkout_url_monthly, checkout_price_monthly, currency, is_active, is_visible, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'growth',
  'Growth',
  'Painel em tempo real de engajamento por unidade, organização de alunos por turma/horário/professor, exportação de relatórios (CSV/PDF) para diretoria, diferentes níveis de acesso (admin/coordenação/personal), suporte prioritário.',
  649.90,
  NULL,
  'b2b_platform',
  '["painel_tempo_real", "organizacao_turmas", "exportacao_relatorios", "niveis_acesso", "suporte_prioritario"]'::jsonb,
  '{"max_students": 50, "max_prompts_per_month": 5000}'::jsonb,
  'https://pay.cakto.com.br/vi6djzq_668541',
  650.89,
  'BRL',
  TRUE,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  plan_category = EXCLUDED.plan_category,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  checkout_url_monthly = EXCLUDED.checkout_url_monthly,
  checkout_price_monthly = EXCLUDED.checkout_price_monthly,
  updated_at = NOW();

-- Pro
INSERT INTO public.subscription_plans (id, name, display_name, description, price_monthly, price_yearly, plan_category, features, limits, checkout_url_monthly, checkout_price_monthly, currency, is_active, is_visible, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'pro',
  'Pro',
  'Gestão de grandes volumes de alunos, contas para múltiplos gestores e coordenadores, comparativo de engajamento entre unidades, relatórios executivos para diretoria, suporte próximo para implementação.',
  1199.90,
  NULL,
  'b2b_platform',
  '["gestao_grandes_volumes", "multi_gestores", "comparativo_unidades", "relatorios_executivos", "suporte_implementacao"]'::jsonb,
  '{"max_students": 100, "max_prompts_per_month": 12000}'::jsonb,
  'https://pay.cakto.com.br/3dis6ds_668546',
  1200.89,
  'BRL',
  TRUE,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  plan_category = EXCLUDED.plan_category,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  checkout_url_monthly = EXCLUDED.checkout_url_monthly,
  checkout_price_monthly = EXCLUDED.checkout_price_monthly,
  updated_at = NOW();

-- ============================================
-- 4. PLANOS PERSONAL TRAINERS (PLATAFORMA)
-- ============================================

-- Team 5 (Iniciante)
INSERT INTO public.subscription_plans (id, name, display_name, description, price_monthly, price_yearly, plan_category, features, limits, checkout_url_monthly, checkout_price_monthly, currency, is_active, is_visible, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'team_5',
  'Team 5',
  'Painel para organizar até ~5 alunos ativos, histórico de treinos e acompanhamento básico, convites por link/QR Code enviados pelo WhatsApp, relatórios básicos de engajamento.',
  99.90,
  NULL,
  'personal_platform',
  '["painel_organizacao", "historico_treinos", "convites_whatsapp", "relatorios_basicos"]'::jsonb,
  '{"max_students": 5, "max_prompts_per_month": 300}'::jsonb,
  'https://pay.cakto.com.br/3dgheuc_666289',
  100.89,
  'BRL',
  TRUE,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  plan_category = EXCLUDED.plan_category,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  checkout_url_monthly = EXCLUDED.checkout_url_monthly,
  checkout_price_monthly = EXCLUDED.checkout_price_monthly,
  updated_at = NOW();

-- Team 15 (Elite - Mais Vantajoso)
INSERT INTO public.subscription_plans (id, name, display_name, description, price_monthly, price_yearly, plan_category, features, limits, checkout_url_monthly, checkout_price_monthly, currency, is_active, is_visible, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'team_15',
  'Team 15',
  'Organização de até ~15 alunos ativos, visão clara de quem está em trial/ativo/parado, ferramentas para renovar planos e aumentar retenção, relatórios para mostrar resultados na renovação.',
  249.90,
  NULL,
  'personal_platform',
  '["organizacao_15_alunos", "visao_trials", "ferramentas_retencao", "relatorios_renovacao"]'::jsonb,
  '{"max_students": 15, "max_prompts_per_month": 800}'::jsonb,
  'https://pay.cakto.com.br/3etp85e_666303',
  250.89,
  'BRL',
  TRUE,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  plan_category = EXCLUDED.plan_category,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  checkout_url_monthly = EXCLUDED.checkout_url_monthly,
  checkout_price_monthly = EXCLUDED.checkout_price_monthly,
  updated_at = NOW();

-- ============================================
-- 5. RECARGAS (PAGAMENTO ÚNICO)
-- ============================================

-- Ajuda Rápida (Urgência)
INSERT INTO public.subscription_plans (id, name, display_name, description, price_monthly, price_yearly, plan_category, features, limits, checkout_url_monthly, checkout_price_monthly, currency, is_active, is_visible, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'help_quick',
  'Ajuda Rápida',
  '+20 minutos de voz. Validade: 24 horas.',
  5.00,
  NULL,
  'recharge',
  '["voz_20min"]'::jsonb,
  '{"voice_minutes": 20, "validity_hours": 24}'::jsonb,
  'https://pay.cakto.com.br/ihfy8cz_668443',
  5.99,
  'BRL',
  TRUE,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  plan_category = EXCLUDED.plan_category,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  checkout_url_monthly = EXCLUDED.checkout_url_monthly,
  checkout_price_monthly = EXCLUDED.checkout_price_monthly,
  updated_at = NOW();

-- Minutos de Reserva (Melhor Escolha)
INSERT INTO public.subscription_plans (id, name, display_name, description, price_monthly, price_yearly, plan_category, features, limits, checkout_url_monthly, checkout_price_monthly, currency, is_active, is_visible, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'minutes_bank',
  'Minutos de Reserva',
  '+100 minutos de voz. Validade: não expira (banco de minutos).',
  12.90,
  NULL,
  'recharge',
  '["voz_100min"]'::jsonb,
  '{"voice_minutes": 100, "validity_hours": -1}'::jsonb,
  'https://pay.cakto.com.br/hhxugxb_668446',
  13.89,
  'BRL',
  TRUE,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  plan_category = EXCLUDED.plan_category,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  checkout_url_monthly = EXCLUDED.checkout_url_monthly,
  checkout_price_monthly = EXCLUDED.checkout_price_monthly,
  updated_at = NOW();

-- Conversa Ilimitada (VIP)
INSERT INTO public.subscription_plans (id, name, display_name, description, price_monthly, price_yearly, plan_category, features, limits, checkout_url_monthly, checkout_price_monthly, currency, is_active, is_visible, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'unlimited_voice',
  'Conversa Ilimitada',
  'Ilimitado por 30 dias. Remove o limite de 15 minutos diários.',
  19.90,
  NULL,
  'recharge',
  '["voz_ilimitada"]'::jsonb,
  '{"voice_unlimited": true, "validity_days": 30}'::jsonb,
  'https://pay.cakto.com.br/trszqtv_668453',
  20.89,
  'BRL',
  TRUE,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  plan_category = EXCLUDED.plan_category,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  checkout_url_monthly = EXCLUDED.checkout_url_monthly,
  checkout_price_monthly = EXCLUDED.checkout_price_monthly,
  updated_at = NOW();

-- ============================================
-- 6. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================

COMMENT ON COLUMN public.subscription_plans.checkout_url_monthly IS 'URL do checkout Cakto para plano mensal';
COMMENT ON COLUMN public.subscription_plans.checkout_url_yearly IS 'URL do checkout Cakto para plano anual';
COMMENT ON COLUMN public.subscription_plans.checkout_price_monthly IS 'Preço no checkout (pode incluir taxas) para plano mensal';
COMMENT ON COLUMN public.subscription_plans.checkout_price_yearly IS 'Preço no checkout (pode incluir taxas) para plano anual';
COMMENT ON COLUMN public.subscription_plans.plan_category IS 'Categoria do plano: b2c_ai, b2b_platform, personal_platform, recharge';

-- ============================================
-- FIM DO SCRIPT
-- ============================================

