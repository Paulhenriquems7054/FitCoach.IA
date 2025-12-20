-- ============================================================================
-- Migration: Criar tabela de logs de auditoria
-- Data: 2025-01-27
-- Prioridade: ALTA
-- ============================================================================
-- 
-- PROBLEMA: Não há registro de ações importantes (auditoria)
--
-- SOLUÇÃO: Criar tabela para registrar eventos críticos
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Tipo de evento
    event_type TEXT NOT NULL,
    
    -- Detalhes do evento (JSONB para flexibilidade)
    details JSONB DEFAULT '{}'::jsonb,
    
    -- Contexto (opcional)
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    gym_id TEXT,
    
    -- Metadados
    ip_address TEXT,
    user_agent TEXT,
    request_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_gym_id ON public.audit_logs(gym_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Índice composto para consultas comuns
CREATE INDEX IF NOT EXISTS idx_audit_logs_gym_event_date 
ON public.audit_logs(gym_id, event_type, created_at DESC) 
WHERE gym_id IS NOT NULL;

-- Habilitar RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins podem ver logs de auditoria
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND (
                users.username IN ('dev123', 'Desenvolvedor', 'Administrador')
                OR users.gym_role = 'admin'
            )
        )
    );

-- Política: Sistema pode inserir logs (via service role)
-- Nota: Service role bypassa RLS, então não precisa de política INSERT

COMMENT ON TABLE public.audit_logs IS 'Logs de auditoria para rastreamento de ações críticas';
COMMENT ON COLUMN public.audit_logs.event_type IS 'Tipo de evento (ex: webhook_received, subscription_created, access_revoked)';
COMMENT ON COLUMN public.audit_logs.details IS 'Detalhes do evento em formato JSON';
COMMENT ON COLUMN public.audit_logs.gym_id IS 'ID da academia relacionada (se aplicável)';

