# ============================================
# EXEMPLO COM SUAS CREDENCIAIS
# Copie e cole este script no PowerShell
# ============================================

# SUAS CREDENCIAIS (já preenchidas)
$SupabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRidWdjaGl3cXducm5ubnNzemVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNDQ4NDYsImV4cCI6MjA3OTYyMDg0Nn0.X05KWOwapggPuo_Gkva_O0lQSwJtgoE6YeMVGx5k9b4"
$CaktoSecret = "cdb5fa7e-4e82-4260-91e7-b13c4b09d1b1"
$Url = "https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook?source=cakto"

# Normalizar
$SupabaseAnonKey = $SupabaseAnonKey.Trim()
$CaktoSecret = $CaktoSecret.Trim()

Write-Host ""
Write-Host "=== TESTE: Recarga Turbo ===" -ForegroundColor Cyan
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
    Write-Host "  2. Se o usuário 'teste@exemplo.com' existe no banco (ou crie um)" -ForegroundColor White
    Write-Host ""
}

