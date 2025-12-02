-- ============================================================================
-- Migração: Controle de Minutos de Voz (Boost + Banco + Ilimitado)
-- Adiciona campos para alinhar com a especificação diária/boost/banco
-- ============================================================================

-- Boost de voz (Ajuda Rápida - expira em 24h)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS boost_minutes_balance INTEGER DEFAULT 0;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMPTZ;

-- Banco de reserva já é representado por voice_balance_upsell (em segundos)
-- Não é necessário novo campo; apenas padronizar o comentário
COMMENT ON COLUMN public.users.voice_balance_upsell IS
  'Saldo de minutos de voz comprados que não expiram (em segundos). Usado como Banco de Reserva.';

-- Observação: o ilimitado de 30 dias é controlado pela tabela recharges
-- com recharge_type = ''pass_libre'' e expires_at > NOW().


