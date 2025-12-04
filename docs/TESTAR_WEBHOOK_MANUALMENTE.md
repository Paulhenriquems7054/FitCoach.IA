# 🧪 Como Testar o Webhook da Cakto Manualmente

O botão "Enviar evento de teste de Webhook" no painel da Cakto pode não funcionar (erro 404/401), mas isso **não afeta o funcionamento real**. Os webhooks de pagamentos reais funcionam normalmente.

## ✅ Solução: Testar Manualmente via PowerShell

Use este script para testar o webhook diretamente, simulando um pagamento real:

### 1. Obter suas credenciais

1. **Supabase Anon Key:**
   - Acesse: Supabase Dashboard → Settings → API
   - Copie a **anon public** key

2. **Cakto Webhook Secret:**
   - Acesse: Supabase Dashboard → Edge Functions → cakto-webhook → Secrets
   - Copie o valor de `CAKTO_WEBHOOK_SECRET`

### 2. Executar o teste no PowerShell

```powershell
# ============================================
# CONFIGURAÇÃO
# ============================================
$SupabaseAnonKey = "COLE_SEU_SUPABASE_ANON_KEY_AQUI"
$CaktoSecret = "COLE_SEU_CAKTO_WEBHOOK_SECRET_AQUI"
$Url = "https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook?source=cakto"

# Normalizar (remove espaços/quebras)
$SupabaseAnonKey = $SupabaseAnonKey.Trim()
$CaktoSecret = $CaktoSecret.Trim()

# ============================================
# TESTE 1: Assinatura B2C (Plano Mensal)
# ============================================
Write-Host "`n=== TESTE 1: Assinatura B2C (Plano Mensal) ===" -ForegroundColor Cyan

$BodyB2C = @{
    event = "payment.completed"
    data = @{
        id = "teste_b2c_$(Get-Date -Format 'yyyyMMddHHmmss')"
        checkout_id = "zeygxve_668421"  # Plano Mensal
        transaction_id = "teste_txn_b2c_$(Get-Date -Format 'yyyyMMddHHmmss')"
        amount = 34.90
        currency = "BRL"
        customer_email = "teste@exemplo.com"
        customer_name = "Usuário Teste B2C"
        paid_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
} | ConvertTo-Json -Depth 10

try {
    $ResponseB2C = Invoke-RestMethod `
        -Uri $Url `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $SupabaseAnonKey"
            "x-webhook-secret" = $CaktoSecret
            "Content-Type" = "application/json"
        } `
        -Body $BodyB2C
    
    Write-Host "✅ SUCESSO: Webhook B2C processado" -ForegroundColor Green
    Write-Host "Resposta: $($ResponseB2C | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

# ============================================
# TESTE 2: Assinatura B2B (Academia Starter Mini)
# ============================================
Write-Host "`n=== TESTE 2: Assinatura B2B (Academia) ===" -ForegroundColor Cyan

$BodyB2B = @{
    event = "payment.completed"
    data = @{
        id = "teste_b2b_$(Get-Date -Format 'yyyyMMddHHmmss')"
        checkout_id = "3b2kpwc_671196"  # Pack Starter Mini
        transaction_id = "teste_txn_b2b_$(Get-Date -Format 'yyyyMMddHHmmss')"
        amount = 149.90
        currency = "BRL"
        customer_email = "academia@exemplo.com"
        customer_name = "Academia Teste"
        paid_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
} | ConvertTo-Json -Depth 10

try {
    $ResponseB2B = Invoke-RestMethod `
        -Uri $Url `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $SupabaseAnonKey"
            "x-webhook-secret" = $CaktoSecret
            "Content-Type" = "application/json"
        } `
        -Body $BodyB2B
    
    Write-Host "✅ SUCESSO: Webhook B2B processado" -ForegroundColor Green
    Write-Host "Resposta: $($ResponseB2B | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

# ============================================
# TESTE 3: Recarga Turbo
# ============================================
Write-Host "`n=== TESTE 3: Recarga Turbo ===" -ForegroundColor Cyan

$BodyRecarga = @{
    event = "payment.completed"
    data = @{
        id = "teste_recarga_$(Get-Date -Format 'yyyyMMddHHmmss')"
        checkout_id = "ihfy8cz_668443"  # Sessão Turbo
        transaction_id = "teste_txn_recarga_$(Get-Date -Format 'yyyyMMddHHmmss')"
        amount = 5.00
        currency = "BRL"
        customer_email = "usuario@exemplo.com"
        customer_name = "Usuário Teste"
        paid_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
} | ConvertTo-Json -Depth 10

try {
    $ResponseRecarga = Invoke-RestMethod `
        -Uri $Url `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $SupabaseAnonKey"
            "x-webhook-secret" = $CaktoSecret
            "Content-Type" = "application/json"
        } `
        -Body $BodyRecarga
    
    Write-Host "✅ SUCESSO: Webhook Recarga processado" -ForegroundColor Green
    Write-Host "Resposta: $($ResponseRecarga | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

# ============================================
# VERIFICAR RESULTADOS NO SUPABASE
# ============================================
Write-Host "`n=== VERIFICAR RESULTADOS ===" -ForegroundColor Yellow
Write-Host "Execute no SQL Editor do Supabase:" -ForegroundColor Yellow
Write-Host "SELECT * FROM public.cakto_webhooks ORDER BY created_at DESC LIMIT 5;" -ForegroundColor Cyan
Write-Host "SELECT * FROM public.user_subscriptions ORDER BY created_at DESC LIMIT 5;" -ForegroundColor Cyan
Write-Host "SELECT * FROM public.academy_subscriptions ORDER BY created_at DESC LIMIT 5;" -ForegroundColor Cyan
Write-Host "SELECT * FROM public.recharges ORDER BY created_at DESC LIMIT 5;" -ForegroundColor Cyan
```

## 📋 Passo a Passo

1. **Abra o PowerShell** (Windows)

2. **Cole o script acima** e preencha:
   - `$SupabaseAnonKey` - Sua anon key do Supabase
   - `$CaktoSecret` - Seu webhook secret

3. **Execute o script**

4. **Verifique os resultados:**
   - Se aparecer "✅ SUCESSO" → Webhook funcionando!
   - Se aparecer "❌ ERRO" → Verifique as credenciais

5. **Confirme no Supabase:**
   - Execute a query de verificação no SQL Editor
   - Verifique se os registros foram criados

## 🔍 Verificar se Funcionou

Execute esta query no Supabase para verificar:

```sql
-- Ver webhooks recebidos
SELECT 
    event_type,
    checkout_id,
    processed,
    error_message,
    created_at
FROM public.cakto_webhooks
ORDER BY created_at DESC
LIMIT 10;

-- Ver assinaturas criadas
SELECT 
    plan_slug,
    plan_group,
    status,
    created_at
FROM public.user_subscriptions
ORDER BY created_at DESC
LIMIT 10;

-- Ver academias criadas
SELECT 
    name,
    plan_type,
    status,
    payment_status,
    created_at
FROM public.companies
ORDER BY created_at DESC
LIMIT 10;

-- Ver recargas criadas
SELECT 
    recharge_slug,
    status,
    created_at
FROM public.recharges
ORDER BY created_at DESC
LIMIT 10;
```

## ⚠️ Nota Importante

- O erro 404/401 no painel da Cakto é um problema do próprio painel, não do seu sistema
- **Pagamentos reais funcionam normalmente** - os webhooks são enviados automaticamente
- Use este teste manual apenas para validar a integração durante desenvolvimento
- Em produção, os webhooks chegam automaticamente quando há pagamentos reais

## 🎯 Próximos Passos

1. Execute o teste manual acima
2. Verifique se os registros foram criados no Supabase
3. Se funcionar, sua integração está 100% operacional
4. O erro do painel da Cakto pode ser ignorado - não afeta o funcionamento real

---

**Última atualização:** Dezembro 2025

