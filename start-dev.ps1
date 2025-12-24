# Script para iniciar o servidor de desenvolvimento
# Libera a porta 3000 se estiver em uso antes de iniciar

Write-Host "Verificando porta 3000..." -ForegroundColor Yellow

# Encontrar processos usando a porta 3000
$processes = netstat -ano | findstr :3000 | findstr LISTENING

if ($processes) {
    Write-Host "Porta 3000 está em uso. Encerrando processos..." -ForegroundColor Red
    
    # Extrair PIDs dos processos
    $pids = $processes | ForEach-Object {
        $parts = $_ -split '\s+'
        $parts[-1]
    } | Select-Object -Unique
    
    foreach ($pid in $pids) {
        try {
            $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "Encerrando processo $pid ($($proc.ProcessName))..." -ForegroundColor Yellow
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
        } catch {
            Write-Host "Erro ao encerrar processo $pid: $_" -ForegroundColor Red
        }
    }
    
    # Aguardar um pouco para garantir que a porta foi liberada
    Start-Sleep -Seconds 2
    Write-Host "Porta 3000 liberada!" -ForegroundColor Green
} else {
    Write-Host "Porta 3000 está livre." -ForegroundColor Green
}

Write-Host "Iniciando servidor de desenvolvimento..." -ForegroundColor Cyan
npm run dev

