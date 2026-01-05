# Script para iniciar o servidor de desenvolvimento
# Encerra processos antigos nas portas comuns do Vite e limpa cache

Write-Host "🧹 Limpando processos Node e Vite..." -ForegroundColor Yellow

# Portas comuns que o Vite pode usar
$ports = @(3000, 3001, 3029, 3030, 5173, 5174)

# Encontrar e encerrar processos Node primeiro
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "   Encontrados $($nodeProcesses.Count) processos Node" -ForegroundColor Cyan
    foreach ($proc in $nodeProcesses) {
        try {
            Write-Host "   Encerrando processo Node: $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Cyan
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        } catch {
            Write-Host "   Aviso: Não foi possível encerrar processo $($proc.Id)" -ForegroundColor Yellow
        }
    }
    Start-Sleep -Seconds 2
}

# Verificar e encerrar processos nas portas comuns
$foundPorts = @()
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($connections) {
        $foundPorts += $port
        foreach ($pid in $connections) {
            try {
                $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "   Encerrando processo na porta $port : $($proc.ProcessName) (PID: $pid)" -ForegroundColor Cyan
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                }
            } catch {
                Write-Host "   Aviso: Não foi possível encerrar processo $pid na porta $port" -ForegroundColor Yellow
            }
        }
    }
}

if ($foundPorts.Count -eq 0) {
    Write-Host "   ✅ Nenhum processo encontrado nas portas comuns" -ForegroundColor Green
} else {
    Write-Host "   ✅ Processos encerrados nas portas: $($foundPorts -join ', ')" -ForegroundColor Green
    Start-Sleep -Seconds 2
}

Write-Host "🧹 Limpando cache do Vite..." -ForegroundColor Yellow

# Limpar cache do Vite
if (Test-Path "node_modules/.vite") {
    Remove-Item -Path "node_modules/.vite" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ Cache do Vite limpo" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  Nenhum cache encontrado" -ForegroundColor Gray
}

# Limpar também cache de timestamp do Vite
$viteConfigTimestamps = Get-ChildItem -Path "." -Filter "vite.config.ts.timestamp-*" -ErrorAction SilentlyContinue
if ($viteConfigTimestamps) {
    foreach ($file in $viteConfigTimestamps) {
        Remove-Item -Path $file.FullName -Force -ErrorAction SilentlyContinue
    }
    Write-Host "   ✅ Timestamps do Vite limpos" -ForegroundColor Green
}

# Limpar cache do navegador (sugestão)
Write-Host "   💡 Dica: Limpe o cache do navegador (Ctrl+Shift+Delete) se os erros persistirem" -ForegroundColor Yellow

Write-Host ""
Write-Host "🔍 Verificando se a porta 3000 está livre..." -ForegroundColor Yellow

# Verificar se a porta 3000 está livre
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "   ⚠️  Porta 3000 ainda está em uso!" -ForegroundColor Red
    Write-Host "   Tentando encerrar processos na porta 3000..." -ForegroundColor Yellow
    foreach ($conn in $port3000) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "   Encerrando processo: $($proc.ProcessName) (PID: $($conn.OwningProcess))" -ForegroundColor Cyan
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 3
    
    # Verificar novamente
    $port3000Check = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($port3000Check) {
        Write-Host "   ❌ ERRO: Porta 3000 ainda está ocupada!" -ForegroundColor Red
        Write-Host "   Execute manualmente: npm run kill:ports" -ForegroundColor Yellow
        Write-Host "   Ou encerre o processo manualmente e tente novamente." -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host "   ✅ Porta 3000 liberada!" -ForegroundColor Green
    }
} else {
    Write-Host "   ✅ Porta 3000 está livre!" -ForegroundColor Green
}

Write-Host ""
Write-Host "⏳ Aguardando 5 segundos para garantir que todas as portas foram liberadas..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "🚀 Iniciando servidor de desenvolvimento na porta 3000..." -ForegroundColor Green
Write-Host ""
Write-Host "   ⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   - Aguarde o servidor iniciar completamente (mensagem 'ready in xxx ms')" -ForegroundColor Cyan
Write-Host "   - NÃO abra o navegador até ver a mensagem de 'ready'" -ForegroundColor Cyan
Write-Host "   - Se aparecer erro 'server is being restarted':" -ForegroundColor Cyan
Write-Host "     1. Pare o servidor (Ctrl+C)" -ForegroundColor White
Write-Host "     2. Aguarde 10 segundos" -ForegroundColor White
Write-Host "     3. Execute novamente: npm run dev:clean" -ForegroundColor White
Write-Host ""

# Iniciar o servidor
npm run dev
