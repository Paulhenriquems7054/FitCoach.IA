# 🚀 Deploy do Webhook Correto no Supabase

## ⚠️ Problema Atual

Os logs mostram que ainda há código antigo rodando no Supabase que tenta buscar por `cakto_checkout_id`:

```
Plano não encontrado para checkout_id: 123 { 
  code: "42703", 
  message: "column subscription_plans.cakto_checkout_id does not exist" 
}
```

## ✅ Solução

O código correto já está no repositório (`supabase/functions/cakto-webhook/index.ts`) e **não** busca por `cakto_checkout_id`. Ele busca apenas por `checkout_url_monthly` e `checkout_url_yearly`.

**É necessário fazer o deploy do código correto no Supabase.**

## 📋 Como Fazer o Deploy

### Opção 1: Via Supabase CLI (Recomendado)

```bash
# 1. Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# 2. Fazer login no Supabase
supabase login

# 3. Linkar ao projeto
supabase link --project-ref seu-project-ref

# 4. Fazer deploy da função
cd supabase/functions/cakto-webhook
supabase functions deploy cakto-webhook
```

### Opção 2: Via Dashboard do Supabase

1. **Acesse o Dashboard:**
   - Vá para https://supabase.com/dashboard
   - Selecione seu projeto

2. **Navegue até Edge Functions:**
   - No menu lateral, clique em **Edge Functions**
   - Clique em **cakto-webhook**

3. **Edite o código:**
   - Clique no botão **Edit** ou **Deploy**
   - Cole o conteúdo completo de `supabase/functions/cakto-webhook/index.ts`
   - Ou use o botão de upload de arquivo

4. **Faça o deploy:**
   - Clique em **Deploy** ou **Save**
   - Aguarde a confirmação

### Opção 3: Via Git (Se configurado)

Se você tiver CI/CD configurado, o deploy pode ser automático ao fazer push:

```bash
git add supabase/functions/cakto-webhook/index.ts
git commit -m "fix: Atualizar webhook Cakto - remover busca por cakto_checkout_id"
git push
```

## ✅ Verificar se o Deploy Funcionou

### 1. Verificar Logs

Após o deploy, envie um evento de teste e verifique os logs:

```bash
# Usar o script de teste
.\supabase\testar_webhook_cakto.ps1
```

**Logs esperados (código correto):**
```
✅ checkout_id encontrado: 123
✅ Buscando plano com checkout_id limpo: 123
✅ Evento de teste detectado (checkout_id: EXAMPLE/123). Em produção, use um checkout_id real.
✅ Retorna 200 com mensagem informativa
```

**Logs antigos (código incorreto):**
```
❌ Plano não encontrado para checkout_id: 123 { 
  code: "42703", 
  message: "column subscription_plans.cakto_checkout_id does not exist" 
}
```

### 2. Verificar Código no Dashboard

1. Acesse **Edge Functions** → **cakto-webhook** → **Code**
2. Verifique se o código tem esta busca (código correto):
```typescript
// Buscar planos que tenham esse ID nas URLs checkout_url_monthly ou checkout_url_yearly
let { data: plans, error: plansError } = await supabase
  .from("subscription_plans")
  .select("*")
  .or(`checkout_url_monthly.ilike.%${cleanCheckoutId}%,checkout_url_yearly.ilike.%${cleanCheckoutId}%`);
```

3. **NÃO** deve ter esta busca (código antigo):
```typescript
// ❌ Código antigo (não deve existir)
.eq("cakto_checkout_id", checkoutId)
```

## 🔍 Diferenças entre Código Antigo e Novo

| Aspecto | Código Antigo ❌ | Código Novo ✅ |
|---------|------------------|----------------|
| **Busca de planos** | `.eq("cakto_checkout_id", checkoutId)` | `.or(\`checkout_url_monthly.ilike.%${cleanCheckoutId}%,checkout_url_yearly.ilike.%${cleanCheckoutId}%\`)` |
| **Tratamento de teste** | Retorna erro 404 | Retorna 200 com mensagem informativa |
| **Extração checkout_id** | Apenas `checkout_id` | Múltiplas fontes: `checkout`, `checkoutUrl`, etc. |

## 📝 Checklist Pós-Deploy

Após fazer o deploy, verifique:

- [ ] Código no Supabase não busca por `cakto_checkout_id`
- [ ] Código busca por `checkout_url_monthly` e `checkout_url_yearly`
- [ ] Eventos de teste retornam 200 (não erro)
- [ ] Logs não mostram erro `column subscription_plans.cakto_checkout_id does not exist`
- [ ] Teste com checkout_id real funciona corretamente

## 🧪 Teste com Checkout ID Real

Após o deploy, teste com um checkout_id real:

```powershell
# Teste com plano mensal
.\supabase\testar_webhook_cakto_real.ps1 -CheckoutId "3ujuqzz_703304" -Email "teste@email.com"
```

**Resultado esperado:**
- ✅ Plano encontrado
- ✅ Assinatura criada/atualizada
- ✅ Status do usuário atualizado

## ⚠️ Notas Importantes

1. **O código atual no repositório está correto** - não precisa ser modificado
2. **O problema é que o código no Supabase está desatualizado** - precisa fazer deploy
3. **Eventos de teste** (`checkout_id: 123` ou `EXAMPLE`) são tratados corretamente e retornam 200
4. **Eventos reais** funcionarão normalmente após o deploy

## 🆘 Troubleshooting

### Erro persiste após deploy

1. Verifique se o deploy foi bem-sucedido:
   - Dashboard → Edge Functions → cakto-webhook → Logs
   - Procure por mensagens de erro no deploy

2. Limpe o cache (se houver):
   - Aguarde alguns minutos após o deploy
   - Teste novamente

3. Verifique se está usando a função correta:
   - URL: `https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook`
   - Verifique se não há múltiplas versões da função

### Ainda vê erro `cakto_checkout_id does not exist`

- O código antigo ainda está rodando
- Faça o deploy novamente
- Verifique se não há cache
- Aguarde alguns minutos e teste novamente

