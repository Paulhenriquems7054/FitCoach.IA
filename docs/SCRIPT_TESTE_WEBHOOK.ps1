# ============================================
# SCRIPT DE TESTE DO WEBHOOK CAKTO
# ============================================
# INSTRUÇÕES:
# 1. Substitua os valores abaixo pelas suas credenciais
# 2. IMPORTANTE: Mantenha as ASPAS ao redor dos valores!
# 3. Execute este script no PowerShell
# ============================================

# CONFIGURAÇÃO - SUBSTITUA OS VALORES ABAIXO
$SupabaseAnonKey = "COLE_SUA_ANON_KEY_AQUI"
$CaktoSecret = "COLE_SEU_WEBHOOK_SECRET_AQUI"
$Url = "https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook?source=cakto"

# ============================================
# NÃO ALTERE NADA DAQUI PARA BAIXO
# ============================================

# Verificar se as credenciais foram preenchidas
if ($SupabaseAnonKey -eq "COLE_SUA_ANON_KEY_AQUI" -or $CaktoSecret -eq "COLE_SEU_WEBHOOK_SECRET_AQUI") {
    Write-Host ""
    Write-Host "❌ ERRO: Preencha as credenciais antes de executar!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Substitua:" -ForegroundColor Yellow
    Write-Host "  - COLE_SUA_ANON_KEY_AQUI pela sua Supabase Anon Key" -ForegroundColor Yellow
    Write-Host "  - COLE_SEU_WEBHOOK_SECRET_AQUI pelo seu CAKTO_WEBHOOK_SECRET" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "IMPORTANTE: Mantenha as ASPAS ao redor dos valores!" -ForegroundColor Cyan
    Write-Host "Exemplo correto: `$SupabaseAnonKey = `"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`"" -ForegroundColor Green
    Write-Host ""
    exit
}

# Normalizar (remove espaços/quebras de linha)
$SupabaseAnonKey = $SupabaseAnonKey.Trim()
$CaktoSecret = $CaktoSecret.Trim()

Write-Host ""
Write-Host "=== TESTE: Recarga Turbo ===" -ForegroundColor Cyan
Write-Host "URL: $Url" -ForegroundColor Gray
Write-Host ""

# Preparar o corpo da requisição
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

Write-Host "Enviando requisição..." -ForegroundColor Yellow
Write-Host ""

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
    Write-Host ""
    Write-Host "Resposta do servidor:" -ForegroundColor Cyan
    Write-Host ($Response | ConvertTo-Json -Depth 5) -ForegroundColor Gray
    Write-Host ""
    Write-Host "Próximo passo: Execute a query SQL no Supabase para verificar se a recarga foi criada." -ForegroundColor Yellow
    Write-Host ""
    
} catch {
    Write-Host "❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $Reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $ResponseBody = $Reader.ReadToEnd()
        Write-Host "Detalhes do erro:" -ForegroundColor Yellow
        Write-Host $ResponseBody -ForegroundColor Red
        Write-Host ""
    }
    
    Write-Host "Verifique:" -ForegroundColor Yellow
    Write-Host "  1. Se as credenciais estão corretas" -ForegroundColor White
    Write-Host "  2. Se as credenciais estão entre ASPAS" -ForegroundColor White
    Write-Host "  3. Se o usuário 'teste@exemplo.com' existe no banco (ou crie um)" -ForegroundColor White
    Write-Host ""
}

