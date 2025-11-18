# Script de Configuração do Capacitor para Empacotamento
# Execute este script para configurar o Capacitor no projeto

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuração do Capacitor" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
if (-not $nodeVersion) {
    Write-Host "Node.js não encontrado! Instale Node.js 18+ primeiro." -ForegroundColor Red
    exit 1
}
Write-Host "Node.js encontrado: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Instalar dependências do Capacitor
Write-Host "Instalando Capacitor..." -ForegroundColor Yellow
npm install @capacitor/core @capacitor/cli --save-dev
npm install @capacitor/app @capacitor/haptics @capacitor/keyboard @capacitor/status-bar --save
npm install @capacitor/electron @capacitor/android @capacitor/ios --save

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao instalar Capacitor!" -ForegroundColor Red
    exit 1
}

Write-Host "Capacitor instalado com sucesso!" -ForegroundColor Green
Write-Host ""

# Inicializar Capacitor
Write-Host "Inicializando Capacitor..." -ForegroundColor Yellow
npx cap init "Nutri.IA" "com.nutria.app" --web-dir="dist"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao inicializar Capacitor!" -ForegroundColor Red
    exit 1
}

Write-Host "Capacitor inicializado!" -ForegroundColor Green
Write-Host ""

# Perguntar quais plataformas adicionar
Write-Host "Quais plataformas deseja adicionar?" -ForegroundColor Cyan
Write-Host "1. Electron (Desktop - Windows/macOS/Linux)" -ForegroundColor Yellow
Write-Host "2. Android" -ForegroundColor Yellow
Write-Host "3. iOS (apenas macOS)" -ForegroundColor Yellow
Write-Host "4. Todas (Electron + Android)" -ForegroundColor Yellow
Write-Host ""

$choice = Read-Host "Escolha (1-4)"

switch ($choice) {
    "1" {
        Write-Host "Adicionando Electron..." -ForegroundColor Yellow
        npx cap add electron
    }
    "2" {
        Write-Host "Adicionando Android..." -ForegroundColor Yellow
        npx cap add android
    }
    "3" {
        Write-Host "Adicionando iOS..." -ForegroundColor Yellow
        Write-Host "Nota: iOS requer macOS e Xcode" -ForegroundColor Yellow
        npx cap add ios
    }
    "4" {
        Write-Host "Adicionando Electron e Android..." -ForegroundColor Yellow
        npx cap add electron
        npx cap add android
    }
    default {
        Write-Host "Opção inválida. Adicionando apenas Electron..." -ForegroundColor Yellow
        npx cap add electron
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuração concluída!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Execute: npm run build" -ForegroundColor White
Write-Host "2. Execute: npx cap sync" -ForegroundColor White
Write-Host "3. Para desenvolvimento:" -ForegroundColor White
Write-Host "   - Desktop: npx cap open electron" -ForegroundColor White
Write-Host "   - Android: npx cap open android" -ForegroundColor White
Write-Host ""

