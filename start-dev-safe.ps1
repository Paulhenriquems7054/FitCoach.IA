# Script seguro para iniciar dev server
# Libera porta 3000 antes de iniciar

Write-Host "Preparando ambiente de desenvolvimento..." -ForegroundColor Cyan

# Executar script de limpeza de porta
& "$PSScriptRoot\kill-port-3000.ps1" -Silent

# Aguardar um pouco
Start-Sleep -Seconds 1

Write-Host "Iniciando servidor de desenvolvimento..." -ForegroundColor Green
Write-Host ""

# Iniciar Vite
npm run dev:start

