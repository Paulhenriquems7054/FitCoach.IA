# Script PowerShell para testar o webhook da Cakto
# Uso: .\testar_webhook.ps1

param(
    [string]$Email = "teste@email.com",
    [string]$CheckoutId = "3ujuqzz_703304",
    [string]$Secret = ""
)

$webhookUrl = "https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook"

Write-Host "🧪 Testando Webhook da Cakto" -ForegroundColor Cyan
Write-Host ""

# Payload de teste
$payload = @{
    event = "payment.completed"
    data = @{
        checkout_id = $CheckoutId
        id = "test_payment_$(Get-Date -Format 'yyyyMMddHHmmss')"
        amount = 34.90
        customer_email = $Email
    }
} | ConvertTo-Json -Depth 10

Write-Host "📤 Enviando requisição para: $webhookUrl" -ForegroundColor Yellow
Write-Host "📋 Payload:" -ForegroundColor Yellow
Write-Host $payload -ForegroundColor Gray
Write-Host ""

# Headers
$headers = @{
    "Content-Type" = "application/json"
}

if ($Secret) {
    $headers["x-webhook-secret"] = $Secret
    Write-Host "🔐 Usando secret configurado" -ForegroundColor Green
} else {
    Write-Host "⚠️  Nenhum secret fornecido (SKIP_CAKTO_WEBHOOK_AUTH deve estar como true)" -ForegroundColor Yellow
}

Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $webhookUrl -Method POST -Headers $headers -Body $payload -ContentType "application/json"
    
    Write-Host "✅ Sucesso!" -ForegroundColor Green
    Write-Host "📥 Resposta:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "📊 Próximos passos:" -ForegroundColor Cyan
    Write-Host "1. Verifique os logs no Supabase Dashboard" -ForegroundColor White
    Write-Host "2. Execute a query SQL para verificar se a assinatura foi criada:" -ForegroundColor White
    Write-Host "   SELECT * FROM user_subscriptions WHERE cakto_transaction_id LIKE 'test_payment_%' ORDER BY created_at DESC LIMIT 1;" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Erro ao chamar webhook" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Mensagem: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Resposta: $responseBody" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "💡 Dica: Se precisar fornecer o secret, use:" -ForegroundColor Cyan
Write-Host "   .\testar_webhook.ps1 -Secret 'seu-secret-aqui' -Email 'seu-email@exemplo.com'" -ForegroundColor Gray

