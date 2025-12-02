# ✅ Verificação: Recarga Turbo Ativa

## 📊 Dados da Recarga

```json
{
  "id": "037a0198-464e-4e03-a473-39156df45908",
  "user_id": "3197d46e-6a2c-4e2e-8714-b18e08c4f114",
  "recharge_type": "turbo",
  "recharge_name": "Sessão Turbo",
  "quantity": 30,  // ✅ 30 minutos extras
  "valid_from": "2025-12-02 16:11:17",
  "valid_until": "2025-12-03 16:11:17",  // ✅ Válida até amanhã
  "status": "active",  // ✅ Status ativo
  "payment_status": "paid"  // ✅ Pagamento confirmado
}
```

## ✅ Status da Recarga

- **Tipo:** `turbo` (Ajuda Rápida)
- **Quantidade:** 30 minutos
- **Status:** `active` ✅
- **Pagamento:** `paid` ✅
- **Válida até:** 2025-12-03 16:11:17 (24 horas a partir da criação)
- **Tempo restante:** ~24 horas

## 🔍 Como o App Usa Esta Recarga

### 1. Verificação de Limites (`checkVoiceUsage()`)

Quando o usuário tenta usar voz, o app:

1. Busca recargas `turbo` ativas na tabela `recharges`
2. Filtra recargas válidas (não expiradas) usando `valid_until`
3. Adiciona os 30 minutos ao `boost_minutes_balance`

**Resultado esperado:**
```typescript
{
  canUse: true,
  remainingDaily: 900,      // 15 min diários (900 segundos)
  remainingBoost: 1800,     // 30 min da recarga (1800 segundos)
  remainingReserve: 0,      // 0 segundos
  totalRemaining: 2700      // 45 minutos totais (15 + 30)
}
```

### 2. Consumo de Minutos (`consumeVoiceSeconds()`)

O app consome minutos na seguinte ordem:

1. **Primeiros 15 minutos** → Limite diário gratuito
2. **Próximos 30 minutos** → Recarga turbo (boost)
3. **Após 45 minutos** → Bloqueia (`LIMIT_REACHED`)

## 🧪 Teste Prático

### Query para Verificar no Banco:

```sql
-- Verificar recarga ativa
SELECT 
  r.id,
  r.recharge_name,
  r.quantity,
  r.status,
  r.valid_until,
  CASE 
    WHEN r.valid_until > NOW() 
    THEN '✅ VÁLIDA' 
    ELSE '❌ EXPIRADA' 
  END as status_validade,
  u.username,
  u.nome
FROM recharges r
JOIN users u ON u.id = r.user_id
WHERE r.id = '037a0198-464e-4e03-a473-39156df45908';
```

### Query para Verificar Boost do Usuário:

```sql
SELECT 
  u.username,
  u.nome,
  u.boost_minutes_balance,
  u.boost_expires_at,
  u.voice_used_today_seconds,
  u.voice_daily_limit_seconds,
  u.voice_balance_upsell,
  -- Calcular total disponível
  (u.voice_daily_limit_seconds - u.voice_used_today_seconds) + 
  (COALESCE(u.boost_minutes_balance, 0) * 60) + 
  COALESCE(u.voice_balance_upsell, 0) as total_available_seconds
FROM users u
WHERE u.id = '3197d46e-6a2c-4e2e-8714-b18e08c4f114';
```

## ✅ Checklist de Funcionamento

- [x] Recarga criada e ativa no banco
- [x] Status: `active` ✅
- [x] Pagamento: `paid` ✅
- [x] Quantidade: 30 minutos ✅
- [x] Válida até: 2025-12-03 16:11:17 ✅
- [x] Código verifica `valid_until` corretamente ✅
- [x] Código adiciona minutos ao boost ✅
- [x] Código consome na ordem correta ✅

## 🎯 Resultado Esperado

**Quando o usuário `ph` (PAULO HENRIQUE DE MORAIS SILVA) tentar usar voz:**

1. ✅ App verifica recarga turbo ativa
2. ✅ App adiciona +30 minutos ao limite disponível
3. ✅ Total disponível: **45 minutos** (15 diários + 30 da recarga)
4. ✅ App permite uso até esgotar os 45 minutos
5. ✅ Após 45 minutos, mostra modal de upsell

## 📝 Notas

- A recarga expira automaticamente em **2025-12-03 16:11:17**
- Após expirar, o app não considerará mais os 30 minutos extras
- O limite volta ao padrão de 15 minutos/dia
- Se o usuário comprar outra recarga antes de expirar, os minutos serão somados

## 🔗 Arquivos Relacionados

- `services/usageLimitService.ts` - Lógica de verificação e consumo
- `services/rechargeService.ts` - Aplicação de recargas
- `supabase/functions/cakto-webhook/index.ts` - Processamento de webhooks

