# 🧪 Como Testar o Webhook - Guia Completo

## ⚠️ IMPORTANTE: Onde Executar Cada Código

### 🔵 PowerShell (Windows)
- **Para:** Executar o script de teste do webhook
- **Onde:** Abra o PowerShell do Windows (não o SQL Editor!)

### 🟢 SQL Editor (Supabase)
- **Para:** Verificar se os dados foram criados
- **Onde:** Supabase Dashboard → SQL Editor

---

## 📋 Passo a Passo Completo

### Passo 1: Criar Usuário de Teste

⚠️ **IMPORTANTE:** A tabela `public.users` referencia `auth.users`. Você precisa criar o usuário em `auth.users` primeiro!

**Escolha uma opção:**

#### Opção A: Via Dashboard (Mais Fácil) ⭐

1. Acesse: https://app.supabase.com → Seu Projeto → **Authentication** → **Users** → **Add user**
2. Preencha:
   - **Email:** `teste@exemplo.com`
   - **Senha:** `teste123456`
   - **Auto Confirm User:** ✅ (marcar esta opção)
3. Clique em **"Create user"**
4. Depois execute a query SQL abaixo (Passo 1.2)

#### Opção B: Via API (Automático) 🚀

1. Abra o arquivo `docs/CRIAR_USUARIO_VIA_API.ps1`
2. Preencha a `Service Role Key` (Dashboard → Settings → API → service_role key)
3. Execute no PowerShell: `.\docs\CRIAR_USUARIO_VIA_API.ps1`
4. Depois execute a query SQL abaixo (Passo 1.2)

**📖 Guia completo:** Veja `docs/CRIAR_USUARIO_TESTE_VIA_API.md` para instruções detalhadas.

#### 1.2. Criar perfil em public.users (SQL Editor)

1. Acesse: https://app.supabase.com → Seu Projeto → **SQL Editor**
2. **Opção A:** Abra o arquivo `docs/CRIAR_USUARIO_TESTE.sql` e copie/cole no SQL Editor
   
   **Opção B:** Cole e execute esta query:

```sql
-- Criar usuário de teste (se não existir)
-- NOTA: Esta query cria um usuário básico. Para criar via auth.users, use a função insert_user_profile
INSERT INTO public.users (
    id, 
    nome, 
    email, 
    username, 
    idade,
    genero,
    peso,
    altura,
    objetivo,
    points,
    discipline_score,
    completed_challenge_ids,
    is_anonymized,
    role,
    plan_type,
    subscription_status,
    voice_daily_limit_seconds,
    voice_used_today_seconds,
    voice_balance_upsell,
    text_msg_count_today,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    'Usuário Teste',           -- nome (obrigatório)
    'teste@exemplo.com',       -- email
    'usuario_teste',          -- username
    25,                        -- idade
    'Masculino',               -- genero
    70.0,                      -- peso
    1.75,                      -- altura
    'perder peso',             -- objetivo
    0,                         -- points
    0,                         -- discipline_score
    '{}',                      -- completed_challenge_ids (array vazio)
    false,                     -- is_anonymized
    'user',                    -- role
    'free',                    -- plan_type
    'active',                  -- subscription_status
    900,                       -- voice_daily_limit_seconds (15 min)
    0,                         -- voice_used_today_seconds
    0,                         -- voice_balance_upsell
    0,                         -- text_msg_count_today
    NOW(),                     -- created_at
    NOW()                      -- updated_at
WHERE NOT EXISTS (
    SELECT 1 FROM public.users WHERE email = 'teste@exemplo.com'
);
```

3. Verifique se foi criado (a query já inclui verificação no final)

---

### Passo 2: Executar Teste do Webhook (PowerShell)

1. **Abra o PowerShell do Windows** (não o SQL Editor!)
   - Pressione `Win + X` → "Windows PowerShell"
   - Ou pesquise "PowerShell" no menu Iniciar

2. **Navegue até a pasta do projeto** (opcional):
   ```powershell
   cd D:\FitCoach.IA
   ```

3. **Execute o script de teste:**
   ```powershell
   .\docs\EXEMPLO_COM_CREDENCIAIS.ps1
   ```

   **OU** copie e cole o conteúdo do arquivo `docs/EXEMPLO_COM_CREDENCIAIS.ps1` diretamente no PowerShell.

4. **Aguarde o resultado:**
   - ✅ Se aparecer "SUCESSO!", o webhook funcionou!
   - ❌ Se aparecer erro, veja a mensagem de erro

---

### Passo 3: Verificar Resultado (SQL Editor)

1. Acesse: https://app.supabase.com → Seu Projeto → SQL Editor
2. Execute esta query para verificar se a recarga foi criada:

```sql
-- Verificar recargas criadas recentemente
SELECT 
    id,
    user_id,
    recharge_type,
    recharge_name,
    amount_paid,
    quantity,
    status,
    payment_status,
    cakto_transaction_id,
    created_at
FROM public.recharges
ORDER BY created_at DESC
LIMIT 5;
```

3. Execute esta query para verificar webhooks recebidos:

```sql
-- Verificar webhooks processados
SELECT 
    id,
    event_type,
    cakto_transaction_id,
    checkout_id,
    processed,
    error_message,
    created_at
FROM public.cakto_webhooks
ORDER BY created_at DESC
LIMIT 10;
```

---

## ✅ O Que Esperar

### Se Funcionou:
- ✅ PowerShell mostra: "✅ SUCESSO!"
- ✅ Query SQL mostra nova recarga com:
  - `recharge_type` = 'turbo'
  - `status` = 'active'
  - `payment_status` = 'paid'
  - `cakto_transaction_id` começando com "teste_txn_"

### Se Não Funcionou:
- ❌ PowerShell mostra mensagem de erro
- ❌ Query SQL não mostra nova recarga
- Verifique:
  1. Se o usuário `teste@exemplo.com` existe
  2. Se as credenciais estão corretas
  3. Se a Edge Function está deployada

---

## 🔍 Verificar Logs da Edge Function

1. Acesse: https://app.supabase.com → Seu Projeto → Edge Functions → cakto-webhook → Logs
2. Veja as mensagens de debug
3. Procure por erros ou avisos

---

## 📝 Resumo Rápido

| O Que | Onde Executar |
|-------|---------------|
| Criar usuário de teste | SQL Editor (Supabase) |
| Testar webhook | PowerShell (Windows) |
| Verificar resultado | SQL Editor (Supabase) |
| Ver logs | Dashboard Supabase → Edge Functions → Logs |

---

**Pronto!** Siga os passos acima na ordem correta. 🚀

