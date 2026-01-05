# Script para reiniciar o servidor de desenvolvimento corretamente

Write-Host "🛑 Parando processos Node/Vite..." -ForegroundColor Yellow

# Tentar parar processos na porta 3000
$processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($pid in $processes) {
    try {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Write-Host "✓ Processo $pid parado" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Não foi possível parar processo $pid" -ForegroundColor Yellow
    }
}

Write-Host "`n🧹 Limpando cache do Vite..." -ForegroundColor Yellow

# Limpar cache do Vite
if (Test-Path ".vite") {
    Remove-Item -Recurse -Force .vite -ErrorAction SilentlyContinue
    Write-Host "✓ Cache .vite limpo" -ForegroundColor Green
} else {
    Write-Host "ℹ Pasta .vite não encontrada" -ForegroundColor Cyan
}

# Limpar cache do node_modules/.vite se existir
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
    Write-Host "✓ Cache node_modules/.vite limpo" -ForegroundColor Green
}

Write-Host "`n⏳ Aguardando 2 segundos antes de iniciar..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "`n🚀 Iniciando servidor de desenvolvimento..." -ForegroundColor Green
npm run dev

