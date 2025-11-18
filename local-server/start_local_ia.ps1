# Script para Iniciar o Servidor Ollama no Windows
# Execute este script para iniciar o servidor Ollama localmente

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Iniciando Servidor Ollama Local" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Ollama está instalado
$ollamaInstalled = Get-Command ollama -ErrorAction SilentlyContinue

if (-not $ollamaInstalled) {
    Write-Host "Ollama não encontrado!" -ForegroundColor Red
    Write-Host "Execute primeiro: .\install_model.ps1" -ForegroundColor Yellow
    exit 1
}

# Verificar se já está rodando
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "Ollama já está rodando!" -ForegroundColor Green
    Write-Host "Endpoint: http://localhost:11434" -ForegroundColor Green
    exit 0
} catch {
    # Não está rodando, continuar
}

Write-Host "Iniciando servidor Ollama..." -ForegroundColor Yellow
Write-Host ""

# Iniciar Ollama em uma nova janela
Start-Process "ollama" -ArgumentList "serve" -WindowStyle Normal

# Aguardar alguns segundos
Start-Sleep -Seconds 3

# Verificar se iniciou com sucesso
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "Ollama iniciado com sucesso!" -ForegroundColor Green
    Write-Host "Endpoint: http://localhost:11434" -ForegroundColor Green
    Write-Host ""
    Write-Host "Mantenha esta janela aberta enquanto usar a IA Local." -ForegroundColor Yellow
} catch {
    Write-Host "Erro ao iniciar Ollama. Verifique se está instalado corretamente." -ForegroundColor Red
    exit 1
}

