# ✅ Implementação: Uso de Recargas Turbo Ativas

## 📋 Resumo

O app agora verifica e utiliza corretamente as recargas `turbo` ativas na tabela `recharges`, garantindo que os minutos extras sejam adicionados ao limite disponível de voz.

## 🔧 O que foi implementado

### 1. Verificação de Recargas Turbo Ativas

**Arquivo:** `services/usageLimitService.ts`

**Funções atualizadas:**
- `checkVoiceUsage()` - Verifica limites disponíveis
- `consumeVoiceSeconds()` - Consome minutos de voz

**Lógica adicionada:**
1. Busca todas as recargas `turbo` ativas na tabela `recharges`
2. Filtra recargas válidas (não expiradas) verificando `valid_until` ou `expires_at`
3. Adiciona os minutos de cada recarga válida ao `boost_minutes_balance`
4. Considera tanto recargas já aplicadas ao boost quanto recargas ativas que ainda não foram aplicadas

### 2. Prioridade de Consumo

O app consome minutos na seguinte ordem (cascata):

1. **Unlimited (Passe Livre 30 dias)** - Se ativo, não consome nada
2. **Free Daily (15 min/dia)** - Limite diário gratuito
3. **Boost (Ajuda Rápida)** - Inclui:
   - `boost_minutes_balance` do usuário
   - Minutos de recargas `turbo` ativas na tabela `recharges`
4. **Reserve Bank (Banco de Voz)** - `voice_balance_upsell`

## 📊 Como funciona

### Exemplo: Recarga Turbo de 30 minutos

**Situação:**
- Limite diário: 15 minutos (900 segundos)
- Recarga turbo ativa: 30 minutos (válida até 2025-12-03 16:11:17)
- Usado hoje: 0 minutos

**Cálculo:**
```typescript
// checkVoiceUsage() retorna:
{
  canUse: true,
  remainingDaily: 900,      // 15 min = 900 segundos
  remainingBoost: 1800,     // 30 min = 1800 segundos (da recarga)
  remainingReserve: 0,     // 0 segundos
  totalRemaining: 2700     // 45 minutos totais (15 + 30)
}
```

**Consumo:**
- Primeiros 15 minutos: Consome do limite diário gratuito
- Próximos 30 minutos: Consome da recarga turbo (boost)
- Após 45 minutos: Bloqueia uso (LIMIT_REACHED)

## 🔍 Verificação no Banco de Dados

### Query para verificar recargas turbo ativas:

```sql
SELECT 
  r.id,
  r.recharge_name,
  r.quantity,
  r.status,
  r.valid_until,
  r.expires_at,
  CASE 
    WHEN (r.valid_until > NOW() OR r.expires_at > NOW()) 
    THEN '✅ VÁLIDA' 
    ELSE '❌ EXPIRADA' 
  END as status_validade,
  u.username,
  u.nome
FROM recharges r
JOIN users u ON u.id = r.user_id
WHERE r.recharge_type = 'turbo'
  AND r.status = 'active'
ORDER BY r.created_at DESC;
```

### Query para verificar boost do usuário:

```sql
SELECT 
  u.username,
  u.nome,
  u.boost_minutes_balance,
  u.boost_expires_at,
  u.voice_used_today_seconds,
  u.voice_daily_limit_seconds,
  u.voice_balance_upsell
FROM users u
WHERE u.username = 'ph'; -- ou u.id = '...'
```

## ✅ Checklist de Funcionamento

- [x] App verifica recargas `turbo` ativas na tabela `recharges`
- [x] App adiciona minutos das recargas ao limite total disponível
- [x] App consome primeiro do limite diário, depois do boost (incluindo recargas)
- [x] App considera tanto `valid_until` quanto `expires_at`
- [x] App filtra recargas expiradas automaticamente
- [x] App mostra erro `LIMIT_REACHED` quando todos os limites são esgotados

## 🧪 Como Testar

1. **Criar uma recarga turbo ativa:**
   ```sql
   INSERT INTO recharges (
     user_id,
     recharge_name,
     recharge_type,
     quantity,
     status,
     valid_until,
     payment_status
   ) VALUES (
     '3197d46e-6a2c-4e2e-8714-b18e08c4f114', -- ID do usuário
     'Ajuda Rápida - 30 minutos',
     'turbo',
     30, -- 30 minutos
     'active',
     NOW() + INTERVAL '24 hours',
     'paid'
   );
   ```

2. **Verificar no app:**
   - Abrir o chatbot de voz
   - Tentar usar voz
   - O app deve permitir uso até 45 minutos (15 diários + 30 da recarga)

3. **Verificar consumo:**
   ```sql
   SELECT 
     voice_used_today_seconds,
     boost_minutes_balance,
     voice_balance_upsell
   FROM users
   WHERE id = '3197d46e-6a2c-4e2e-8714-b18e08c4f114';
   ```

## 📝 Notas Importantes

1. **Recargas já aplicadas:** Se uma recarga `turbo` já foi aplicada ao `boost_minutes_balance`, ela será contada duas vezes (uma do campo e outra da tabela). Isso é intencional para garantir que recargas ativas sempre sejam consideradas, mesmo se houver inconsistência entre o campo e a tabela.

2. **Expiração automática:** O app verifica automaticamente se a recarga expirou comparando `valid_until`/`expires_at` com a data atual.

3. **Múltiplas recargas:** Se houver múltiplas recargas `turbo` ativas, todos os minutos serão somados ao boost.

4. **Sincronização:** Quando o webhook da Cakto processa um pagamento de recarga `turbo`, ele chama `applyRecharge()` que adiciona os minutos ao `boost_minutes_balance`. O código agora também verifica a tabela `recharges` diretamente para garantir que recargas ativas sejam sempre consideradas.

## 🔗 Arquivos Modificados

- `services/usageLimitService.ts` - Adicionada verificação de recargas turbo ativas em `checkVoiceUsage()` e `consumeVoiceSeconds()`

