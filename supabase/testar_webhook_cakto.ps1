# Script para testar o webhook da Cakto
# Execute: .\supabase\testar_webhook_cakto.ps1

$webhookUrl = "https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook"

# Se você tiver o secret configurado, descomente e adicione aqui:
# $webhookSecret = "seu-secret-aqui"

# Se SKIP_CAKTO_WEBHOOK_AUTH=true, não precisa do secret
$skipAuth = $true  # Mude para $false se quiser usar autenticação

# Payload de teste baseado no formato real do Cakto
$payload = @{
    secret = "cdb5fa7e-4e82-4260-91e7-b13c4b09d1b1"
    event = "purchase_approved"
    data = @{
        id = "test-$(Get-Date -Format 'yyyyMMddHHmmss')"
        refId = "TEST$(Get-Random -Minimum 1000 -Maximum 9999)"
        customer = @{
            name = "Teste Usuario"
            email = "teste@email.com"
            phone = "34999999999"
            docNumber = "12345678909"
            birthDate = $null
            docType = "cpf"
        }
        checkout = 123
        checkoutUrl = "https://pay.cakto.com.br/3ujuqzz_703304"
        status = "paid"
        baseAmount = 100
        discount = 10
        amount = 34.90
        paymentMethod = "credit_card"
        paymentMethodName = "Cartão de Crédito"
        paidAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        createdAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    }
} | ConvertTo-Json -Depth 10

Write-Host "🚀 Enviando evento de teste para o webhook..." -ForegroundColor Cyan
Write-Host "URL: $webhookUrl" -ForegroundColor Gray
Write-Host ""

# Preparar headers
$headers = @{
    "Content-Type" = "application/json"
}

# Adicionar secret se não estiver pulando autenticação
if (-not $skipAuth -and $webhookSecret) {
    $headers["x-webhook-secret"] = $webhookSecret
    Write-Host "✅ Usando autenticação com secret" -ForegroundColor Green
} else {
    Write-Host "⚠️  Pulando autenticação (SKIP_CAKTO_WEBHOOK_AUTH=true)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 Payload:" -ForegroundColor Cyan
Write-Host $payload -ForegroundColor Gray
Write-Host ""

try {
    # Enviar requisição
    $response = Invoke-RestMethod -Uri $webhookUrl -Method Post -Headers $headers -Body $payload -ContentType "application/json"
    
    Write-Host "✅ Sucesso! Resposta do webhook:" -ForegroundColor Green
    Write-Host $response -ForegroundColor Gray
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorMessage = $_.Exception.Message
    
    Write-Host "❌ Erro ao enviar webhook:" -ForegroundColor Red
    Write-Host "Status Code: $statusCode" -ForegroundColor Red
    Write-Host "Mensagem: $errorMessage" -ForegroundColor Red
    
    # Tentar ler a resposta de erro
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Resposta: $responseBody" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "📊 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Verifique os logs no Supabase Dashboard → Edge Functions → cakto-webhook → Logs" -ForegroundColor Gray
Write-Host "2. Execute a query SQL para verificar se a assinatura foi criada:" -ForegroundColor Gray
Write-Host "   SELECT * FROM user_subscriptions WHERE payment_provider = 'cakto' ORDER BY created_at DESC LIMIT 5;" -ForegroundColor DarkGray

