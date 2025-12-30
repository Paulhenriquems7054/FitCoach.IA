# Script para testar o webhook da Cakto com checkout_id REAL
# Use este script com um checkout_id real de um plano cadastrado
# Execute: .\supabase\testar_webhook_cakto_real.ps1

param(
    [string]$CheckoutId = "3ujuqzz_703304",  # ID do plano mensal
    [string]$Email = "teste@email.com",
    [string]$EventType = "purchase_approved"
)

$webhookUrl = "https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook"

# Se você tiver o secret configurado, descomente e adicione aqui:
# $webhookSecret = "seu-secret-aqui"

# Se SKIP_CAKTO_WEBHOOK_AUTH=true, não precisa do secret
$skipAuth = $true  # Mude para $false se quiser usar autenticação

Write-Host "🧪 Teste do Webhook Cakto com Checkout ID Real" -ForegroundColor Cyan
Write-Host "Checkout ID: $CheckoutId" -ForegroundColor Yellow
Write-Host "Email: $Email" -ForegroundColor Yellow
Write-Host "Evento: $EventType" -ForegroundColor Yellow
Write-Host ""

# Extrair apenas o ID da URL se for uma URL completa
if ($CheckoutId -match "pay\.cakto\.com\.br/([^/?]+)") {
    $CheckoutId = $matches[1]
    Write-Host "✅ Checkout ID extraído: $CheckoutId" -ForegroundColor Green
}

# Determinar valor baseado no checkout_id
$amount = 34.90
if ($CheckoutId -eq "xphpm5f_703310") {
    $amount = 297.00
    Write-Host "✅ Plano Anual detectado: R$ $amount" -ForegroundColor Green
} else {
    Write-Host "✅ Plano Mensal detectado: R$ $amount" -ForegroundColor Green
}

# Payload de teste com checkout_id real
$payload = @{
    secret = "cdb5fa7e-4e82-4260-91e7-b13c4b09d1b1"
    event = $EventType
    data = @{
        id = "test-$(Get-Date -Format 'yyyyMMddHHmmss')"
        refId = "TEST$(Get-Random -Minimum 1000 -Maximum 9999)"
        customer = @{
            name = "Teste Usuario"
            email = $Email
            phone = "34999999999"
            docNumber = "12345678909"
            birthDate = $null
            docType = "cpf"
        }
        checkout = $CheckoutId
        checkoutUrl = "https://pay.cakto.com.br/$CheckoutId"
        status = "paid"
        baseAmount = [math]::Round($amount * 1.1, 2)
        discount = [math]::Round($amount * 0.1, 2)
        amount = $amount
        paymentMethod = "credit_card"
        paymentMethodName = "Cartão de Crédito"
        paidAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        createdAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    }
} | ConvertTo-Json -Depth 10

Write-Host ""
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
    
    Write-Host ""
    Write-Host "✅ Sucesso! Resposta do webhook:" -ForegroundColor Green
    Write-Host $response -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "✅ Evento enviado com sucesso!" -ForegroundColor Green
    Write-Host "📊 Verifique os logs no Supabase Dashboard → Edge Functions → cakto-webhook → Logs" -ForegroundColor Cyan
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorMessage = $_.Exception.Message
    
    Write-Host ""
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
Write-Host "📊 Queries SQL para verificar:" -ForegroundColor Cyan
Write-Host ""
Write-Host "-- Verificar assinatura criada:" -ForegroundColor Gray
Write-Host "SELECT * FROM user_subscriptions WHERE payment_provider = 'cakto' ORDER BY created_at DESC LIMIT 5;" -ForegroundColor DarkGray
Write-Host ""
Write-Host "-- Verificar status do usuário:" -ForegroundColor Gray
Write-Host "SELECT id, email, subscription_status FROM users WHERE email = '$Email';" -ForegroundColor DarkGray
Write-Host ""
Write-Host "-- Verificar logs de auditoria:" -ForegroundColor Gray
Write-Host "SELECT * FROM audit_logs WHERE event_type LIKE '%webhook%' OR event_type LIKE '%b2c%' ORDER BY created_at DESC LIMIT 10;" -ForegroundColor DarkGray

