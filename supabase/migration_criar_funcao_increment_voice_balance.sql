-- Migration: Criar função para incrementar saldo de voz (alternativa ao RPC)
-- Data: 2025-01-27
-- Nota: Esta função pode ser usada se preferir RPC, mas o webhook já atualiza diretamente

-- Função para incrementar saldo de voz do usuário (em segundos)
CREATE OR REPLACE FUNCTION increment_voice_balance(
  user_id_param UUID,
  seconds_to_add INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.users
  SET voice_balance_upsell = COALESCE(voice_balance_upsell, 0) + seconds_to_add,
      updated_at = NOW()
  WHERE id = user_id_param;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_voice_balance IS 'Incrementa o saldo de minutos de voz comprados (voice_balance_upsell) do usuário';

