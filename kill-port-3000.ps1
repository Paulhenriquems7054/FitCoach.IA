# Script PowerShell para matar processos na porta 3000
# Uso: .\kill-port-3000.ps1

param(
    [switch]$Silent = $false
)

if (-not $Silent) {
    Write-Host "Verificando processos na porta 3000..." -ForegroundColor Yellow
}

try {
    # Encontrar processos usando a porta 3000
    $connections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    
    if ($connections) {
        $pids = $connections | ForEach-Object { $_.OwningProcess } | Sort-Object -Unique
        
        foreach ($pidValue in $pids) {
            $process = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
            if ($process) {
                if (-not $Silent) {
                    Write-Host "Encerrando processo: $($process.ProcessName) (PID: $pidValue)" -ForegroundColor Red
                }
                Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue
                if (-not $Silent) {
                    Write-Host "Processo $pidValue encerrado" -ForegroundColor Green
                }
            }
        }
        
        # Aguardar um pouco para garantir que a porta foi liberada
        Start-Sleep -Seconds 1
        
        # Verificar novamente
        $remaining = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
        if ($remaining) {
            if (-not $Silent) {
                Write-Host "Ainda ha processos na porta 3000. Tentando novamente..." -ForegroundColor Yellow
            }
            Start-Sleep -Seconds 2
            $remainingPids = $remaining | ForEach-Object { $_.OwningProcess } | Sort-Object -Unique
            foreach ($pidValue in $remainingPids) {
                Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue
            }
        }
        
        if (-not $Silent) {
            Write-Host "Porta 3000 liberada!" -ForegroundColor Green
        }
        exit 0
    } else {
        if (-not $Silent) {
            Write-Host "Nenhum processo encontrado na porta 3000" -ForegroundColor Green
        }
        exit 0
    }
} catch {
    if (-not $Silent) {
        Write-Host "Erro ao verificar porta 3000: $_" -ForegroundColor Red
    }
    exit 1
}

