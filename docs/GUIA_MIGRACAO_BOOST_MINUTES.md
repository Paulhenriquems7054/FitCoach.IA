# 🔧 Guia: Migração boost_minutes_balance

## 📋 Situação Atual

A coluna `boost_minutes_balance` ainda **não foi criada** no banco de dados. Isso não impede o funcionamento do app, pois o código verifica diretamente a tabela `recharges` para recargas turbo ativas.

## ✅ O App Funciona Sem Esta Coluna

O código em `services/usageLimitService.ts` foi implementado para funcionar de duas formas:

1. **Com `boost_minutes_balance`** (quando a migração for executada):
   - Usa o campo `boost_minutes_balance` do usuário
   - **E** verifica recargas turbo ativas na tabela `recharges`
   - Soma ambos os valores

2. **Sem `boost_minutes_balance`** (situação atual):
   - Verifica diretamente recargas turbo ativas na tabela `recharges`
   - Adiciona os minutos das recargas ao boost
   - Funciona perfeitamente! ✅

## 🔍 Queries de Verificação (Sem boost_minutes_balance)

Use as queries em `docs/QUERY_VERIFICACAO_RECARGA.sql` que não dependem da coluna `boost_minutes_balance`.

### Query Rápida:

```sql
-- Verificar recarga turbo ativa
SELECT 
  r.quantity,
  r.status,
  r.valid_until,
  CASE WHEN r.valid_until > NOW() THEN '✅ VÁLIDA' ELSE '❌ EXPIRADA' END as status_validade
FROM recharges r
WHERE r.id = '037a0198-464e-4e03-a473-39156df45908';

-- Verificar dados do usuário
SELECT 
  u.username,
  u.voice_used_today_seconds,
  u.voice_daily_limit_seconds,
  u.voice_balance_upsell
FROM users u
WHERE u.id = '3197d46e-6a2c-4e2e-8714-b18e08c4f114';
```

## 🚀 Executar Migração (Opcional)

Se você quiser criar a coluna `boost_minutes_balance` para melhor performance e consistência:

### 1. Executar a Migração

Execute o arquivo `supabase/migration_voice_minutes_v2.sql` no SQL Editor do Supabase:

```sql
-- Boost de voz (Ajuda Rápida - expira em 24h)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS boost_minutes_balance INTEGER DEFAULT 0;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMPTZ;

-- Banco de reserva já é representado por voice_balance_upsell (em segundos)
COMMENT ON COLUMN public.users.voice_balance_upsell IS
  'Saldo de minutos de voz comprados que não expiram (em segundos). Usado como Banco de Reserva.';
```

### 2. Após Executar a Migração

Depois de executar a migração, você pode usar a query completa:

```sql
SELECT 
  u.username,
  u.boost_minutes_balance,
  u.boost_expires_at,
  u.voice_used_today_seconds,
  u.voice_daily_limit_seconds,
  u.voice_balance_upsell
FROM users u
WHERE u.id = '3197d46e-6a2c-4e2e-8714-b18e08c4f114';
```

## 📝 Notas Importantes

1. **O app já funciona sem a migração** - A verificação de recargas turbo ativas funciona diretamente pela tabela `recharges`

2. **A migração é opcional** - Ela melhora a performance ao armazenar o boost no usuário, mas não é obrigatória

3. **Quando executar a migração:**
   - Se você quiser que o `boost_minutes_balance` seja atualizado automaticamente quando recargas são aplicadas
   - Se você quiser melhor performance (menos queries na tabela `recharges`)

4. **O código já está preparado** - Quando a migração for executada, o código automaticamente usará ambas as fontes (campo + tabela)

## ✅ Status Atual

- ✅ App funciona sem `boost_minutes_balance`
- ✅ Recargas turbo são verificadas diretamente na tabela `recharges`
- ✅ Código preparado para usar `boost_minutes_balance` quando disponível
- ⚠️ Migração ainda não executada (opcional)

## 🔗 Arquivos Relacionados

- `supabase/migration_voice_minutes_v2.sql` - Migração para criar as colunas
- `services/usageLimitService.ts` - Código que verifica recargas (funciona com ou sem migração)
- `docs/QUERY_VERIFICACAO_RECARGA.sql` - Queries de verificação sem `boost_minutes_balance`

