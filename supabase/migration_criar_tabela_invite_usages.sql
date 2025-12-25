-- Migration: Criar tabela de auditoria de uso de convites
-- Descrição: Registra quem usou cada código de convite para segurança e auditoria
-- Data: 2025-01-XX

-- Criar tabela para auditoria de uso de convites
CREATE TABLE IF NOT EXISTS invite_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  academy_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'personal')),
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_invite_usages_code ON invite_usages(invite_code);
CREATE INDEX IF NOT EXISTS idx_invite_usages_user ON invite_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_invite_usages_academy ON invite_usages(academy_id);
CREATE INDEX IF NOT EXISTS idx_invite_usages_used_at ON invite_usages(used_at DESC);
CREATE INDEX IF NOT EXISTS idx_invite_usages_academy_code ON invite_usages(academy_id, invite_code);

-- Comentários para documentação
COMMENT ON TABLE invite_usages IS 'Registra uso de códigos de convite para auditoria e segurança';
COMMENT ON COLUMN invite_usages.invite_code IS 'Código do convite utilizado';
COMMENT ON COLUMN invite_usages.user_id IS 'ID do usuário que utilizou o convite';
COMMENT ON COLUMN invite_usages.academy_id IS 'ID da academia à qual o convite pertence';
COMMENT ON COLUMN invite_usages.role IS 'Role do usuário (student ou personal)';
COMMENT ON COLUMN invite_usages.used_at IS 'Data/hora em que o convite foi utilizado';
COMMENT ON COLUMN invite_usages.ip_address IS 'Endereço IP de onde o convite foi utilizado (opcional)';

-- RLS (Row Level Security) - Permitir leitura apenas para admins da academia
ALTER TABLE invite_usages ENABLE ROW LEVEL SECURITY;

-- Política: Admins da academia podem ver histórico dos seus convites
CREATE POLICY "Admins podem ver histórico de convites da própria academia"
  ON invite_usages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.gym_id = invite_usages.academy_id
      AND (users.gym_role = 'admin' OR users.tenant_role = 'admin_academy')
    )
  );

-- Política: Sistema pode inserir registros de uso (via service role ou função)
CREATE POLICY "Sistema pode inserir registros de uso de convites"
  ON invite_usages
  FOR INSERT
  WITH CHECK (true); -- A validação será feita na aplicação

-- Política: Ninguém pode atualizar ou deletar registros (apenas leitura)
CREATE POLICY "Nenhum usuário pode modificar registros de uso"
  ON invite_usages
  FOR ALL
  USING (false)
  WITH CHECK (false);

