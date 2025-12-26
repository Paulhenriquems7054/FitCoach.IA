-- Migration: Criar tabela ai_events para métricas B2B2C
-- Descrição: Tabela para tracking de eventos de IA (trial_started, trial_expired, conversion, ai_usage)

CREATE TABLE IF NOT EXISTS ai_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('trial_started', 'trial_expired', 'conversion', 'ai_usage')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  academy_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_events_user_id ON ai_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_events_academy_id ON ai_events(academy_id);
CREATE INDEX IF NOT EXISTS idx_ai_events_event_type ON ai_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ai_events_created_at ON ai_events(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE ai_events ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ler seus próprios eventos
CREATE POLICY "Users can read their own ai_events"
  ON ai_events FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Sistema pode inserir eventos (via service role ou anon key com função)
CREATE POLICY "Service can insert ai_events"
  ON ai_events FOR INSERT
  WITH CHECK (true);

-- Política: Administradores podem ler todos os eventos (se necessário)
-- Nota: Ajuste conforme necessário baseado no seu sistema de roles

-- Comentários
COMMENT ON TABLE ai_events IS 'Tabela para tracking de eventos relacionados a IA (trials, conversões, uso)';
COMMENT ON COLUMN ai_events.event_type IS 'Tipo do evento: trial_started, trial_expired, conversion, ai_usage';
COMMENT ON COLUMN ai_events.user_id IS 'ID do usuário relacionado ao evento';
COMMENT ON COLUMN ai_events.academy_id IS 'ID da academia (para métricas B2B2C)';
COMMENT ON COLUMN ai_events.metadata IS 'Dados adicionais do evento (JSON)';

