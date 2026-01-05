# Script para matar processos Node que podem estar causando conflitos
Write-Host "🔍 Procurando processos Node..." -ForegroundColor Yellow

$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "   Encontrados $($nodeProcesses.Count) processos Node" -ForegroundColor Yellow
    $nodeProcesses | ForEach-Object {
        Write-Host "   Matando processo PID: $($_.Id) ($($_.ProcessName))" -ForegroundColor Red
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "   ✅ Processos Node encerrados!" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "   ✅ Nenhum processo Node encontrado." -ForegroundColor Green
}

# Verificar portas comuns do Vite
Write-Host "`n🔍 Verificando portas comuns do Vite..." -ForegroundColor Yellow
$ports = @(3000, 3001, 3029, 3030, 5173, 5174)
$portsInUse = @()

foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        $portsInUse += $port
        Write-Host "   ⚠️  Porta $port está em uso:" -ForegroundColor Red
        foreach ($conn in $connections) {
            $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "      PID: $($conn.OwningProcess) - $($proc.ProcessName)" -ForegroundColor Yellow
                Write-Host "      Tentando encerrar..." -ForegroundColor Cyan
                Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

if ($portsInUse.Count -eq 0) {
    Write-Host "   ✅ Todas as portas comuns estão livres!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Portas ainda em uso: $($portsInUse -join ', ')" -ForegroundColor Yellow
    Write-Host "   💡 Aguarde alguns segundos ou tente encerrar manualmente." -ForegroundColor Cyan
}

Write-Host "`n🚀 Agora você pode executar: npm run dev" -ForegroundColor Cyan

