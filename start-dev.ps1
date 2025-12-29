# Script para iniciar o servidor de desenvolvimento
# Encerra processos antigos na porta 3000 e limpa cache

Write-Host "🧹 Limpando processos na porta 3000..." -ForegroundColor Yellow

# Encontrar e encerrar processos na porta 3000
$processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    foreach ($pid in $processes) {
        try {
            $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "   Encerrando processo: $($proc.ProcessName) (PID: $pid)" -ForegroundColor Cyan
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
        } catch {
            Write-Host "   Aviso: Não foi possível encerrar processo $pid" -ForegroundColor Yellow
        }
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "   ✅ Nenhum processo encontrado na porta 3000" -ForegroundColor Green
}

Write-Host "🧹 Limpando cache do Vite..." -ForegroundColor Yellow

# Limpar cache do Vite
if (Test-Path "node_modules/.vite") {
    Remove-Item -Path "node_modules/.vite" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ Cache do Vite limpo" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  Nenhum cache encontrado" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🚀 Iniciando servidor de desenvolvimento..." -ForegroundColor Green
Write-Host ""

# Iniciar o servidor
npm run dev
