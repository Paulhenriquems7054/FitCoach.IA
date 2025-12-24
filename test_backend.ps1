# Script PowerShell para testar o backend e gerar logs
# Execute: .\test_backend.ps1

$backendUrl = "https://backend-production-c4af.up.railway.app"

Write-Host "🧪 Testando Backend..." -ForegroundColor Cyan
Write-Host "URL: $backendUrl" -ForegroundColor Gray
Write-Host ""

# Teste 1: Health Check
Write-Host "1️⃣ Testando Health Check (GET /)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $backendUrl -Method GET
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Resposta: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Teste 2: Endpoint de Texto
Write-Host "2️⃣ Testando Endpoint de Texto (POST /ai/text)..." -ForegroundColor Yellow
$body = @{
    userId = "test-user-123"
    gymId = $null
    feature = "chat"
    model = "gemini-1.5-flash"
    prompt = "Olá, como você está?"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$backendUrl/ai/text" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body
    
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    $jsonResponse = $response.Content | ConvertFrom-Json
    Write-Host "   Resposta:" -ForegroundColor Gray
    Write-Host "   - Text: $($jsonResponse.text.Substring(0, [Math]::Min(50, $jsonResponse.text.Length)))..." -ForegroundColor Gray
    Write-Host "   - Tokens In: $($jsonResponse.tokensIn)" -ForegroundColor Gray
    Write-Host "   - Tokens Out: $($jsonResponse.tokensOut)" -ForegroundColor Gray
    Write-Host "   - Cost USD: $($jsonResponse.costUsd)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "✅ Log criado no Supabase! Verifique em:" -ForegroundColor Green
    Write-Host "   https://app.supabase.com/project/seu-projeto/editor" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Detalhes: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "3️⃣ Para verificar os logs no Supabase, execute:" -ForegroundColor Yellow
Write-Host "   SELECT * FROM ai_usage_logs ORDER BY created_at DESC LIMIT 5;" -ForegroundColor Cyan

