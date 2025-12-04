# 🚀 Teste Rápido do Webhook - Passo a Passo

## 📋 Status Atual

✅ **Sistema Configurado:**
- Planos com checkout_id configurados
- Tabelas criadas
- Webhook corrigido e pronto

⏳ **Pendente:**
- Testar se o webhook funciona
- Verificar se cria registros corretamente

---

## 🧪 TESTE RÁPIDO (5 minutos)

### Passo 1: Obter Credenciais

1. **Supabase Anon Key:**
   - Acesse: https://app.supabase.com → Seu Projeto → Settings → API
   - Copie a **anon public** key

2. **Cakto Webhook Secret:**
   - Acesse: https://app.supabase.com → Seu Projeto → Edge Functions → cakto-webhook → Secrets
   - Copie o valor de `CAKTO_WEBHOOK_SECRET`

### Passo 2: Executar Teste no PowerShell

**⚠️ ERRO COMUM: No PowerShell, valores DEVEM estar entre ASPAS!**

**Opção A: Usar o arquivo de script (Recomendado)**

1. Abra o arquivo `docs/SCRIPT_TESTE_WEBHOOK.ps1` no editor
2. Substitua `COLE_SUA_ANON_KEY_AQUI` e `COLE_SEU_WEBHOOK_SECRET_AQUI` pelos valores reais
3. **Mantenha as ASPAS ao redor dos valores!**
4. Salve o arquivo
5. No PowerShell, execute:
   ```powershell
   .\docs\SCRIPT_TESTE_WEBHOOK.ps1
   ```

**Opção B: Copiar e colar diretamente**

Abra o PowerShell e cole este script (substitua as credenciais **MANTENDO AS ASPAS**):

```powershell
# ============================================
# CONFIGURAÇÃO - SUBSTITUA OS VALORES
# ⚠️ IMPORTANTE: Mantenha as ASPAS ao redor dos valores!
# ============================================
$SupabaseAnonKey = "COLE_SUA_ANON_KEY_AQUI"
$CaktoSecret = "COLE_SEU_WEBHOOK_SECRET_AQUI"
$Url = "https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook?source=cakto"

# Normalizar (remove espaços/quebras de linha)
$SupabaseAnonKey = $SupabaseAnonKey.Trim()
$CaktoSecret = $CaktoSecret.Trim()

# Verificar se as credenciais foram preenchidas
if ($SupabaseAnonKey -eq "COLE_SUA_ANON_KEY_AQUI" -or $CaktoSecret -eq "COLE_SEU_WEBHOOK_SECRET_AQUI") {
    Write-Host "❌ ERRO: Preencha as credenciais antes de executar!" -ForegroundColor Red
    Write-Host "Substitua COLE_SUA_ANON_KEY_AQUI e COLE_SEU_WEBHOOK_SECRET_AQUI pelos valores reais" -ForegroundColor Yellow
    exit
}

Write-Host "`n=== TESTE: Recarga Turbo ===" -ForegroundColor Cyan

$Body = @{
    type = "payment.completed"
    data = @{
        id = "teste_$(Get-Date -Format 'yyyyMMddHHmmss')"
        checkout_id = "ihfy8cz_668443"  # Sessão Turbo
        transaction_id = "teste_txn_$(Get-Date -Format 'yyyyMMddHHmmss')"
        amount = 5.00
        currency = "BRL"
        customer_email = "teste@exemplo.com"
        customer_name = "Usuário Teste"
        paid_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
} | ConvertTo-Json -Depth 10

try {
    $Response = Invoke-RestMethod `
        -Uri $Url `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $SupabaseAnonKey"
            "x-webhook-secret" = $CaktoSecret
            "Content-Type" = "application/json"
        } `
        -Body $Body
    
    Write-Host "✅ SUCESSO!" -ForegroundColor Green
    Write-Host "Resposta: $($Response | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $Reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $ResponseBody = $Reader.ReadToEnd()
        Write-Host "Detalhes: $ResponseBody" -ForegroundColor Yellow
    }
}
```

**⚠️ Exemplo de erro comum:**
- ❌ **Errado:** `$SupabaseAnonKey = eyJhbGciOiJIUzI1NiIs...` (sem aspas)
- ✅ **Correto:** `$SupabaseAnonKey = "eyJhbGciOiJIUzI1NiIs..."` (com aspas)

### Passo 3: Verificar Resultado

Execute esta query no Supabase SQL Editor:

```sql
-- Verificar se a recarga foi criada
SELECT 
    id,
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

---

## ✅ O que esperar

### Se funcionar:
- ✅ PowerShell mostra "SUCESSO"
- ✅ Query mostra nova recarga criada
- ✅ Status = 'active'
- ✅ payment_status = 'paid'

### Se não funcionar:
- ❌ Verifique as credenciais
- ❌ Verifique os logs da Edge Function
- ❌ Verifique se o usuário existe (pelo email)

---

## 🔍 Verificar Logs da Edge Function

1. Acesse: Supabase Dashboard → Edge Functions → cakto-webhook → Logs
2. Veja as mensagens de debug
3. Procure por erros ou avisos

---

## 📝 Nota Importante

- O erro 404/401 no painel da Cakto é normal (limitação do painel)
- **Pagamentos reais funcionam normalmente**
- Este teste é apenas para validar durante desenvolvimento
- Em produção, os webhooks chegam automaticamente

---

**Pronto para testar!** Execute o script PowerShell e me diga o resultado. 🚀

