# ✅ Checklist: O Que Executar no Supabase

## 📋 Status Atual

Execute primeiro a query: **`docs/O_QUE_FALTA_EXECUTAR_SUPABASE.sql`** para ver o status atual.

---

## 🚀 Passo a Passo do Que Executar

### ✅ Passo 1: Executar Migração Principal (OBRIGATÓRIO)

**Arquivo:** `supabase/migration_criar_sistema_ativacao_academias_EXECUTAR.sql`

**O que faz:**
- ✅ Adiciona campo `licenses_used` em `academy_subscriptions`
- ✅ Adiciona campo `activation_code` em `academy_subscriptions`
- ✅ Cria tabela `student_academy_links`
- ✅ Cria índices para performance
- ✅ Configura RLS (Row Level Security)

**Como executar:**
1. Abra o arquivo `supabase/migration_criar_sistema_ativacao_academias_EXECUTAR.sql`
2. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no SQL Editor do Supabase
4. Execute (Ctrl+Enter)

**Resultado esperado:**
```
✅ Coluna licenses_used criada/verificada
✅ Coluna activation_code criada/verificada
✅ Tabela student_academy_links criada/verificada
```

---

### ✅ Passo 2: Verificar/Criar Tabelas Principais

#### 2.1. Tabela `academy_subscriptions`

**Se NÃO existir:**
- Será criada automaticamente quando uma academia comprar um plano (via webhook)
- OU você pode criar manualmente (veja `supabase/schema.sql`)

**Verificar:**
```sql
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'academy_subscriptions';
```

#### 2.2. Tabela `user_subscriptions`

**Se NÃO existir:**
- Será criada automaticamente quando um usuário comprar plano B2C (via webhook)
- OU você pode criar manualmente

**Verificar:**
```sql
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_subscriptions';
```

#### 2.3. Tabela `recharges`

**Se NÃO existir:**
- Já deve existir (foi criada anteriormente)
- Verificar se tem a estrutura correta

**Verificar estrutura:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'recharges'
ORDER BY ordinal_position;
```

**Deve ter:**
- `user_email` (TEXT)
- `recharge_slug` (TEXT)
- `plan_group` (TEXT)
- `status` (TEXT)

---

### ✅ Passo 3: Verificar/Criar Tabela `app_plans` (CRÍTICO)

**Esta tabela é OBRIGATÓRIA!** Ela mapeia os planos da página de vendas.

**Verificar se existe:**
```sql
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'app_plans';
```

**Se NÃO existir, criar:**
```sql
CREATE TABLE IF NOT EXISTS public.app_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  plan_group TEXT NOT NULL,
  billing_type TEXT NOT NULL,
  billing_period TEXT,
  price NUMERIC(10,2) NOT NULL,
  total_checkout_price NUMERIC(10,2),
  cakto_checkout_id TEXT,
  max_licenses INTEGER,
  minutes_voice_per_day INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Preencher com os planos da página de vendas:**
```sql
-- Exemplo de inserção (ajustar conforme seus planos reais)
INSERT INTO public.app_plans (
  slug, name, plan_group, billing_type, billing_period, 
  price, total_checkout_price, cakto_checkout_id, max_licenses, minutes_voice_per_day
) VALUES
-- B2C
('b2c_mensal', 'Plano Mensal', 'b2c', 'recorrente', 'mensal', 34.90, 35.89, 'zeygxve_668421', NULL, 15),
('b2c_anual_vip', 'Plano Anual VIP', 'b2c', 'recorrente', 'anual', 297.00, 297.99, 'wvbkepi_668441', NULL, 15),
-- B2B Academia
('b2b_academia_starter_mini', 'Pack Starter Mini', 'b2b_academia', 'recorrente', 'mensal', 149.90, 150.89, '3b2kpwc_671196', 10, 15),
('b2b_academia_starter', 'Pack Starter', 'b2b_academia', 'recorrente', 'mensal', 299.90, 300.89, 'cemyp2n_668537', 20, 15),
('b2b_academia_growth', 'Pack Growth', 'b2b_academia', 'recorrente', 'mensal', 649.90, 650.89, 'vi6djzq_668541', 50, 15),
('b2b_academia_pro', 'Pack Pro', 'b2b_academia', 'recorrente', 'mensal', 1199.90, 1200.89, '3dis6ds_668546', 100, 15),
-- Recargas
('recarga_turbo', 'Sessão Turbo', 'recarga', 'one_time', NULL, 5.00, 5.99, 'ihfy8cz_668443', NULL, NULL),
('recarga_banco_voz_100', 'Banco de Voz 100', 'recarga', 'one_time', NULL, 12.90, 13.89, 'hhxugxb_668446', NULL, NULL),
('recarga_passe_livre_30d', 'Passe Livre 30 Dias', 'recarga', 'one_time', NULL, 19.90, 20.89, 'PREENCHER_ID_CHECKOUT_PASSE_LIVRE', NULL, NULL),
-- Personal Trainer
('personal_team_5', 'Team 5', 'personal', 'recorrente', 'mensal', 99.90, 100.89, 'PREENCHER_ID_CHECKOUT_TEAM5', 5, 15),
('personal_team_15', 'Team 15', 'personal', 'recorrente', 'mensal', 249.90, 250.89, 'PREENCHER_ID_CHECKOUT_TEAM15', 15, 15)
ON CONFLICT (slug) DO NOTHING;
```

**⚠️ IMPORTANTE:** 
- Substitua `PREENCHER_ID_CHECKOUT_*` pelos `product.short_id` reais da Cakto
- Verifique se os `cakto_checkout_id` estão corretos

---

### ✅ Passo 4: Verificar Edge Function

**Verificar se está deployada:**
1. Acesse: Supabase Dashboard → Edge Functions
2. Verifique se `cakto-webhook` existe
3. Verifique se está atualizada (com geração de códigos)

**Fazer deploy (se necessário):**
```bash
# No terminal
supabase functions deploy cakto-webhook
```

**OU pelo Dashboard:**
- Edge Functions → cakto-webhook → Deploy

---

### ✅ Passo 5: Verificar Variáveis de Ambiente

**Verificar se estão configuradas:**
1. Acesse: Supabase Dashboard → Edge Functions → cakto-webhook → Settings → Secrets
2. Verifique se existe:
   - `CAKTO_WEBHOOK_SECRET` (seu secret da Cakto)
   - `SUPABASE_URL` (geralmente já configurado)
   - `SUPABASE_SERVICE_ROLE_KEY` (geralmente já configurado)

---

## 📊 Resumo Rápido

| Item | Status | Arquivo/Comando |
|------|--------|-----------------|
| Migração principal | ⏳ Executar | `migration_criar_sistema_ativacao_academias_EXECUTAR.sql` |
| Tabela app_plans | ⏳ Verificar/Criar | Verificar se existe e está preenchida |
| Tabela academy_subscriptions | ⏳ Verificar | Criada pelo webhook ou manualmente |
| Tabela user_subscriptions | ⏳ Verificar | Criada pelo webhook ou manualmente |
| Tabela recharges | ⏳ Verificar | Já deve existir |
| Tabela student_academy_links | ⏳ Criar | Via migração (Passo 1) |
| Edge Function | ⏳ Deploy | `supabase functions deploy cakto-webhook` |
| Variáveis de ambiente | ⏳ Verificar | Dashboard → Edge Functions → Secrets |

---

## 🧪 Teste Final

Após executar tudo, teste:

1. **Verificar migração:**
   ```sql
   SELECT * FROM information_schema.columns 
   WHERE table_name = 'academy_subscriptions' 
   AND column_name IN ('licenses_used', 'activation_code');
   ```

2. **Verificar tabela:**
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'student_academy_links';
   ```

3. **Verificar app_plans:**
   ```sql
   SELECT slug, name, plan_group, cakto_checkout_id 
   FROM app_plans 
   ORDER BY plan_group, slug;
   ```

---

**Próximo passo:** Execute a query `O_QUE_FALTA_EXECUTAR_SUPABASE.sql` para ver o status atual!

