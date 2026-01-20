-- ============================================
-- MIGRATION: Novo Modelo de Planos para Academias
-- Data: 2026-01-18
-- Descrição: Implementa modelo híbrido B2B (academias) + recargas B2C
-- Remove trial, implementa controle de limites mensais por aluno
-- ============================================

-- ============================================
-- 1. ATUALIZAR TABELA COMPANIES (ACADEMIAS)
-- ============================================

-- Adicionar colunas de plano e limites se não existirem
DO $$
BEGIN
  -- Campo plano (enum: FitCoach50, FitCoach100, FitCoach200, FitCoach400, FitCoach500)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'plano'
  ) THEN
    ALTER TABLE public.companies 
    ADD COLUMN plano TEXT CHECK (plano IN ('FitCoach50', 'FitCoach100', 'FitCoach200', 'FitCoach400', 'FitCoach500'));
    
    COMMENT ON COLUMN public.companies.plano IS 
    'Plano contratado: FitCoach50, FitCoach100, FitCoach200, FitCoach400, FitCoach500';
  END IF;

  -- Campo alunos_max (derivado do plano)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'alunos_max'
  ) THEN
    ALTER TABLE public.companies 
    ADD COLUMN alunos_max INTEGER DEFAULT 50;
    
    COMMENT ON COLUMN public.companies.alunos_max IS 
    'Número máximo de alunos permitidos no plano';
  END IF;

  -- Campo limite_texto (mensagens de texto por mês por aluno)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'limite_texto'
  ) THEN
    ALTER TABLE public.companies 
    ADD COLUMN limite_texto INTEGER DEFAULT 1000;
    
    COMMENT ON COLUMN public.companies.limite_texto IS 
    'Limite de mensagens de texto por mês por aluno';
  END IF;

  -- Campo limite_imagem (análises de imagem por mês por aluno)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'limite_imagem'
  ) THEN
    ALTER TABLE public.companies 
    ADD COLUMN limite_imagem INTEGER DEFAULT 100;
    
    COMMENT ON COLUMN public.companies.limite_imagem IS 
    'Limite de análises de imagem por mês por aluno';
  END IF;

  -- Campo limite_voz (minutos de voz por mês por aluno)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'limite_voz'
  ) THEN
    ALTER TABLE public.companies 
    ADD COLUMN limite_voz INTEGER DEFAULT 450; -- 15 min/dia * 30 dias = 450 min/mês
    
    COMMENT ON COLUMN public.companies.limite_voz IS 
    'Limite de minutos de voz por mês por aluno';
  END IF;
END $$;

-- ============================================
-- 2. ATUALIZAR TABELA USERS (ALUNOS)
-- ============================================

-- Adicionar colunas de uso mensal se não existirem
DO $$
BEGIN
  -- Campo uso_texto (contador de mensagens de texto no mês)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'uso_texto'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN uso_texto INTEGER DEFAULT 0;
    
    COMMENT ON COLUMN public.users.uso_texto IS 
    'Contador de mensagens de texto usadas no mês atual';
  END IF;

  -- Campo uso_imagem (contador de análises de imagem no mês)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'uso_imagem'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN uso_imagem INTEGER DEFAULT 0;
    
    COMMENT ON COLUMN public.users.uso_imagem IS 
    'Contador de análises de imagem usadas no mês atual';
  END IF;

  -- Campo uso_voz_minutos (contador de minutos de voz no mês)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'uso_voz_minutos'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN uso_voz_minutos INTEGER DEFAULT 0;
    
    COMMENT ON COLUMN public.users.uso_voz_minutos IS 
    'Contador de minutos de voz usados no mês atual';
  END IF;

  -- Campo saldo_voz_extra (minutos extras comprados via recarga)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'saldo_voz_extra'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN saldo_voz_extra INTEGER DEFAULT 0;
    
    COMMENT ON COLUMN public.users.saldo_voz_extra IS 
    'Saldo de minutos extras de voz comprados via recarga FitVoice';
  END IF;

  -- Campo periodo_uso_mes (para resetar contadores mensalmente)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'periodo_uso_mes'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN periodo_uso_mes TEXT; -- Formato: 'YYYY-MM' (ex: '2026-01')
    
    COMMENT ON COLUMN public.users.periodo_uso_mes IS 
    'Período do mês atual para controle de reset mensal (formato: YYYY-MM)';
  END IF;

  -- Campo modo_demo (3 interações grátis para novos usuários não vinculados)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'modo_demo'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN modo_demo BOOLEAN DEFAULT false;
    
    COMMENT ON COLUMN public.users.modo_demo IS 
    'Se o usuário está em modo demo (3 interações grátis para novos usuários não vinculados a academia)';
  END IF;

  -- Campo interacoes_demo_usadas (contador de interações demo usadas)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'interacoes_demo_usadas'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN interacoes_demo_usadas INTEGER DEFAULT 0;
    
    COMMENT ON COLUMN public.users.interacoes_demo_usadas IS 
    'Número de interações demo usadas (máximo 3)';
  END IF;

  -- Campo academias_id (vinculação com tabela companies)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'academias_id'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN academias_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
    
    COMMENT ON COLUMN public.users.academias_id IS 
    'ID da academia (tabela companies) à qual o aluno pertence';
  END IF;

  -- Criar índice para busca rápida
  CREATE INDEX IF NOT EXISTS idx_users_academias_id ON public.users(academias_id);
END $$;

-- ============================================
-- 3. CRIAR TABELA RECARGAS
-- ============================================

CREATE TABLE IF NOT EXISTS public.recargas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamento
  aluno_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Detalhes da recarga
  tipo_recarga TEXT NOT NULL CHECK (tipo_recarga IN ('FitVoice20', 'FitVoice60', 'FitVoice120')),
  minutos_comprados INTEGER NOT NULL, -- 20, 60 ou 120 minutos
  valor_pago DECIMAL(10, 2) NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  
  -- Integração pagamento
  cakto_checkout_id TEXT,
  cakto_transaction_id TEXT UNIQUE,
  
  -- Datas
  data_compra TIMESTAMPTZ DEFAULT NOW(),
  data_confirmacao TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.recargas IS 
'Tabela de recargas de minutos FitVoice compradas pelos alunos';

COMMENT ON COLUMN public.recargas.tipo_recarga IS 
'Tipo de recarga: FitVoice20 (R$ 5,00), FitVoice60 (R$ 12,90), FitVoice120 (R$ 19,90)';

COMMENT ON COLUMN public.recargas.minutos_comprados IS 
'Quantidade de minutos comprados (20, 60 ou 120)';

-- Índices
CREATE INDEX IF NOT EXISTS idx_recargas_aluno_id ON public.recargas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_recargas_status ON public.recargas(status);
CREATE INDEX IF NOT EXISTS idx_recargas_data_compra ON public.recargas(data_compra);

-- ============================================
-- 4. FUNÇÃO PARA RESETAR CONTADORES MENSAIS
-- ============================================

CREATE OR REPLACE FUNCTION reset_uso_mensal_alunos()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  current_month TEXT;
BEGIN
  -- Obter mês atual no formato YYYY-MM
  current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Resetar contadores de alunos cujo período_uso_mes é diferente do mês atual
  UPDATE public.users
  SET 
    uso_texto = 0,
    uso_imagem = 0,
    uso_voz_minutos = 0,
    periodo_uso_mes = current_month
  WHERE periodo_uso_mes IS NULL 
     OR periodo_uso_mes <> current_month;
END;
$$;

COMMENT ON FUNCTION reset_uso_mensal_alunos() IS 
'Função para resetar contadores mensais de uso (texto, imagem, voz) no início de cada mês';

-- ============================================
-- 5. FUNÇÃO PARA VERIFICAR LIMITES ANTES DE USO
-- ============================================

CREATE OR REPLACE FUNCTION verificar_limite_antes_uso(
  p_user_id UUID,
  p_tipo_uso TEXT, -- 'texto', 'imagem', 'voz'
  p_quantidade INTEGER DEFAULT 1 -- Para texto/imagem: 1, para voz: minutos
)
RETURNS TABLE(
  pode_usar BOOLEAN,
  limite_atual INTEGER,
  usado_atual INTEGER,
  restante INTEGER,
  mensagem TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_academias_id UUID;
  v_plano TEXT;
  v_limite_texto INTEGER;
  v_limite_imagem INTEGER;
  v_limite_voz INTEGER;
  v_uso_texto INTEGER;
  v_uso_imagem INTEGER;
  v_uso_voz_minutos INTEGER;
  v_saldo_voz_extra INTEGER;
  v_periodo_uso_mes TEXT;
  v_modo_demo BOOLEAN;
  v_interacoes_demo_usadas INTEGER;
  v_current_month TEXT;
BEGIN
  -- Obter mês atual
  v_current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Buscar dados do usuário e da academia
  SELECT 
    u.academias_id,
    u.uso_texto,
    u.uso_imagem,
    u.uso_voz_minutos,
    u.saldo_voz_extra,
    u.periodo_uso_mes,
    u.modo_demo,
    u.interacoes_demo_usadas,
    c.plano,
    c.limite_texto,
    c.limite_imagem,
    c.limite_voz,
    c.status
  INTO 
    v_academias_id,
    v_uso_texto,
    v_uso_imagem,
    v_uso_voz_minutos,
    v_saldo_voz_extra,
    v_periodo_uso_mes,
    v_modo_demo,
    v_interacoes_demo_usadas,
    v_plano,
    v_limite_texto,
    v_limite_imagem,
    v_limite_voz
  FROM public.users u
  LEFT JOIN public.companies c ON u.academias_id = c.id
  WHERE u.id = p_user_id;
  
  -- Verificar se usuário não foi encontrado
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 0, 0, 'Usuário não encontrado'::TEXT;
    RETURN;
  END IF;
  
  -- Resetar contadores se necessário (mudou de mês)
  IF v_periodo_uso_mes IS NULL OR v_periodo_uso_mes <> v_current_month THEN
    UPDATE public.users
    SET 
      uso_texto = 0,
      uso_imagem = 0,
      uso_voz_minutos = 0,
      periodo_uso_mes = v_current_month
    WHERE id = p_user_id;
    
    v_uso_texto := 0;
    v_uso_imagem := 0;
    v_uso_voz_minutos := 0;
  END IF;
  
  -- Verificar se está em modo demo (não vinculado a academia)
  IF v_academias_id IS NULL THEN
    IF v_modo_demo AND v_interacoes_demo_usadas < 3 THEN
      -- Modo demo ativo e ainda tem interações disponíveis
      RETURN QUERY SELECT true, 3, v_interacoes_demo_usadas, 3 - v_interacoes_demo_usadas, 'Modo demo ativo'::TEXT;
      RETURN;
    ELSIF v_modo_demo AND v_interacoes_demo_usadas >= 3 THEN
      -- Modo demo esgotado
      RETURN QUERY SELECT false, 3, 3, 0, 'Você atingiu o limite da sua conta. Adquira recarga FitVoice ou vincule-se a uma academia.'::TEXT;
      RETURN;
    ELSE
      -- Não tem academia e não está em modo demo
      RETURN QUERY SELECT false, 0, 0, 0, 'Você não está vinculado a uma academia ativa. Adquira recarga FitVoice ou vincule-se a uma academia.'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Verificar se a academia está ativa
  -- (Assumindo que companies.status = 'active' significa ativa)
  -- Se não tiver status na tabela companies, considerar todas ativas
  
  -- Verificar limite específico conforme tipo de uso
  CASE p_tipo_uso
    WHEN 'texto' THEN
      IF v_uso_texto + p_quantidade > v_limite_texto THEN
        RETURN QUERY SELECT 
          false, 
          v_limite_texto, 
          v_uso_texto, 
          GREATEST(0, v_limite_texto - v_uso_texto),
          'Você atingiu o limite da sua conta. Adquira recarga FitVoice.'::TEXT;
      ELSE
        RETURN QUERY SELECT 
          true, 
          v_limite_texto, 
          v_uso_texto, 
          v_limite_texto - v_uso_texto,
          ''::TEXT;
      END IF;
      
    WHEN 'imagem' THEN
      IF v_uso_imagem + p_quantidade > v_limite_imagem THEN
        RETURN QUERY SELECT 
          false, 
          v_limite_imagem, 
          v_uso_imagem, 
          GREATEST(0, v_limite_imagem - v_uso_imagem),
          'Você atingiu o limite da sua conta. Adquira recarga FitVoice.'::TEXT;
      ELSE
        RETURN QUERY SELECT 
          true, 
          v_limite_imagem, 
          v_uso_imagem, 
          v_limite_imagem - v_uso_imagem,
          ''::TEXT;
      END IF;
      
    WHEN 'voz' THEN
      -- Para voz, verificar limite mensal + saldo extra
      DECLARE
        v_total_disponivel INTEGER;
        v_usado_total INTEGER;
      BEGIN
        v_total_disponivel := v_limite_voz + v_saldo_voz_extra;
        v_usado_total := v_uso_voz_minutos;
        
        IF v_usado_total + p_quantidade > v_total_disponivel THEN
          RETURN QUERY SELECT 
            false, 
            v_total_disponivel, 
            v_usado_total, 
            GREATEST(0, v_total_disponivel - v_usado_total),
            'Você atingiu o limite da sua conta. Adquira recarga FitVoice.'::TEXT;
        ELSE
          RETURN QUERY SELECT 
            true, 
            v_total_disponivel, 
            v_usado_total, 
            v_total_disponivel - v_usado_total,
            ''::TEXT;
        END IF;
      END;
      
    ELSE
      RETURN QUERY SELECT false, 0, 0, 0, 'Tipo de uso inválido'::TEXT;
  END CASE;
END;
$$;

COMMENT ON FUNCTION verificar_limite_antes_uso(UUID, TEXT, INTEGER) IS 
'Verifica se o aluno pode usar uma funcionalidade (texto, imagem, voz) antes de consumir recursos';

-- ============================================
-- 6. FUNÇÃO PARA PROCESSAR RECARGA PAGA
-- ============================================

CREATE OR REPLACE FUNCTION processar_recarga_paga(
  p_recarga_id UUID,
  p_cakto_transaction_id TEXT
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_aluno_id UUID;
  v_minutos_comprados INTEGER;
BEGIN
  -- Buscar dados da recarga
  SELECT aluno_id, minutos_comprados
  INTO v_aluno_id, v_minutos_comprados
  FROM public.recargas
  WHERE id = p_recarga_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recarga não encontrada';
  END IF;
  
  -- Atualizar status da recarga
  UPDATE public.recargas
  SET 
    status = 'paid',
    cakto_transaction_id = p_cakto_transaction_id,
    data_confirmacao = NOW(),
    updated_at = NOW()
  WHERE id = p_recarga_id;
  
  -- Adicionar minutos ao saldo extra do aluno
  UPDATE public.users
  SET 
    saldo_voz_extra = COALESCE(saldo_voz_extra, 0) + v_minutos_comprados,
    updated_at = NOW()
  WHERE id = v_aluno_id;
END;
$$;

COMMENT ON FUNCTION processar_recarga_paga(UUID, TEXT) IS 
'Processa recarga paga, atualizando status e adicionando minutos ao saldo do aluno';

-- ============================================
-- 7. REMOVER CAMPOS DE TRIAL (OPCIONAL - COMENTADO)
-- ============================================

-- NOTA: Não removemos os campos de trial imediatamente para evitar quebrar código existente
-- Eles serão marcados como deprecated e removidos gradualmente
-- Os campos são: trial_active, trial_expires_at, trial_voice_total_seconds, 
-- trial_photo_analysis_count, trial_meal_plan_count, ai_subscription_status

-- ============================================
-- 8. CRIAR TRIGGER PARA RESET AUTOMÁTICO MENSUAL
-- ============================================

-- Criar função de trigger para reset automático (executar no início de cada mês via cron)
CREATE OR REPLACE FUNCTION check_and_reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM reset_uso_mensal_alunos();
END;
$$;

COMMENT ON FUNCTION check_and_reset_monthly_usage() IS 
'Função para ser executada via cron diariamente para verificar e resetar contadores mensais';

-- ============================================
-- 9. RLS POLICIES (Row Level Security)
-- ============================================

-- Habilitar RLS na tabela recargas
ALTER TABLE public.recargas ENABLE ROW LEVEL SECURITY;

-- Política: Alunos podem ver suas próprias recargas
CREATE POLICY "Alunos podem ver suas próprias recargas"
ON public.recargas
FOR SELECT
USING (auth.uid() = aluno_id);

-- Política: Sistema pode inserir/atualizar recargas (via service role)
-- NOTA: Ajustar conforme sua configuração de autenticação

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se as colunas foram criadas
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'companies'
AND column_name IN ('plano', 'alunos_max', 'limite_texto', 'limite_imagem', 'limite_voz')
ORDER BY column_name;

-- Verificar se as colunas foram criadas em users
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
AND column_name IN ('uso_texto', 'uso_imagem', 'uso_voz_minutos', 'saldo_voz_extra', 'periodo_uso_mes', 'modo_demo', 'interacoes_demo_usadas', 'academias_id')
ORDER BY column_name;

-- Verificar se a tabela recargas foi criada
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'recargas') as num_columns
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'recargas';
