-- Atualizar links de checkout Cakto para planos individuais (B2C)
-- Executar no SQL Editor do Supabase

-- 1. Atualizar Plano Mensal (R$ 34,90)
UPDATE subscription_plans
SET 
  checkout_url_monthly = 'https://pay.cakto.com.br/3ujuqzz_703304',
  updated_at = NOW()
WHERE 
  name = 'ai_monthly' 
  OR plan_category = 'b2c_ai' 
  AND price_monthly = 34.90;

-- 2. Atualizar Plano Anual VIP (R$ 297,00)
UPDATE subscription_plans
SET 
  checkout_url_yearly = 'https://pay.cakto.com.br/xphpm5f_703310',
  updated_at = NOW()
WHERE 
  name = 'ai_annual_vip' 
  OR (plan_category = 'b2c_ai' 
  AND price_yearly = 297.00);

-- Verificar atualizações
SELECT 
  id,
  name,
  display_name,
  price_monthly,
  price_yearly,
  checkout_url_monthly,
  checkout_url_yearly,
  updated_at
FROM subscription_plans
WHERE plan_category = 'b2c_ai'
ORDER BY price_monthly;

