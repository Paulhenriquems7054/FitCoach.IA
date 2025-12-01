# Script para matar processos Node que podem estar causando conflitos
Write-Host "Procurando processos Node..." -ForegroundColor Yellow

$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "Encontrados $($nodeProcesses.Count) processos Node" -ForegroundColor Yellow
    $nodeProcesses | ForEach-Object {
        Write-Host "Matando processo PID: $($_.Id)" -ForegroundColor Red
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Processos Node encerrados!" -ForegroundColor Green
} else {
    Write-Host "Nenhum processo Node encontrado." -ForegroundColor Green
}

# Verificar se a porta 3000 está livre
Write-Host "`nVerificando porta 3000..." -ForegroundColor Yellow
$port3000 = netstat -ano | findstr :3000
if ($port3000) {
    Write-Host "Porta 3000 ainda está em uso:" -ForegroundColor Red
    Write-Host $port3000
    Write-Host "`nTente matar o processo manualmente ou aguarde alguns segundos." -ForegroundColor Yellow
} else {
    Write-Host "Porta 3000 está livre!" -ForegroundColor Green
}

Write-Host "`nAgora você pode executar: npm run dev" -ForegroundColor Cyan

