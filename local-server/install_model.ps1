# Script de Instalação do Ollama e Modelo para Windows
# Execute este script como Administrador para instalar o Ollama e baixar o modelo

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Instalação do Ollama e Modelo de IA Local" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se já está instalado
$ollamaInstalled = Get-Command ollama -ErrorAction SilentlyContinue

if (-not $ollamaInstalled) {
    Write-Host "Ollama não encontrado. Iniciando instalação..." -ForegroundColor Yellow
    
    # Baixar e instalar Ollama
    Write-Host "Baixando Ollama..." -ForegroundColor Green
    $ollamaUrl = "https://ollama.com/download/windows"
    Write-Host "Por favor, baixe e instale o Ollama manualmente de: $ollamaUrl" -ForegroundColor Yellow
    Write-Host "Ou use: winget install Ollama.Ollama" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Após instalar, execute este script novamente." -ForegroundColor Yellow
    
    # Tentar instalar via winget se disponível
    $wingetAvailable = Get-Command winget -ErrorAction SilentlyContinue
    if ($wingetAvailable) {
        Write-Host ""
        Write-Host "Tentando instalar via winget..." -ForegroundColor Green
        winget install Ollama.Ollama
    } else {
        Write-Host "winget não disponível. Instale manualmente." -ForegroundColor Yellow
    }
    
    exit 1
}

Write-Host "Ollama encontrado!" -ForegroundColor Green
Write-Host ""

# Verificar se o serviço está rodando
Write-Host "Verificando se o Ollama está rodando..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method GET -TimeoutSec 3 -ErrorAction Stop
    Write-Host "Ollama está rodando!" -ForegroundColor Green
} catch {
    Write-Host "Ollama não está rodando. Iniciando..." -ForegroundColor Yellow
    
    # Tentar iniciar o serviço
    try {
        Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
        Start-Sleep -Seconds 3
        
        # Verificar novamente
        $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method GET -TimeoutSec 5 -ErrorAction Stop
        Write-Host "Ollama iniciado com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "Erro ao iniciar Ollama. Execute manualmente: ollama serve" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Verificando modelos disponíveis..." -ForegroundColor Cyan
$models = ollama list

# Modelos recomendados (em ordem de preferência)
$recommendedModels = @("phi3:mini", "llama3.1:8b", "mistral:7b", "qwen2.5:7b")

$modelToInstall = $null
foreach ($model in $recommendedModels) {
    if ($models -match $model) {
        Write-Host "Modelo $model já está instalado!" -ForegroundColor Green
        $modelToInstall = $null
        break
    } else {
        if (-not $modelToInstall) {
            $modelToInstall = $model
        }
    }
}

if ($modelToInstall) {
    Write-Host ""
    Write-Host "Instalando modelo: $modelToInstall" -ForegroundColor Cyan
    Write-Host "Isso pode levar alguns minutos..." -ForegroundColor Yellow
    Write-Host ""
    
    ollama pull $modelToInstall
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Modelo $modelToInstall instalado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "Erro ao instalar modelo. Tente manualmente: ollama pull $modelToInstall" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Instalação concluída!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para testar, execute: ollama run phi3:mini 'Olá, como você está?'" -ForegroundColor Yellow
Write-Host ""
Write-Host "O servidor Ollama deve estar rodando em: http://localhost:11434" -ForegroundColor Green
Write-Host ""

