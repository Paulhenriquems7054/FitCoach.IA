# Script para enviar TODAS as alterações para o GitHub
# Execute este script no PowerShell: .\git-push-all.ps1

Write-Host "🚀 Preparando para enviar TODAS as alterações ao GitHub..." -ForegroundColor Cyan

# Navegar para o diretório do projeto
Set-Location $PSScriptRoot

# Tentar remover o arquivo de lock de forma mais agressiva
$lockFile = ".git/index.lock"
if (Test-Path $lockFile) {
    Write-Host "⚠️  Tentando remover arquivo de lock..." -ForegroundColor Yellow
    
    # Tentar múltiplas vezes
    $maxAttempts = 5
    $attempt = 0
    $removed = $false
    
    while ($attempt -lt $maxAttempts -and -not $removed) {
        $attempt++
        Write-Host "   Tentativa $attempt de $maxAttempts..." -ForegroundColor Gray
        
        try {
            # Tentar matar processos git primeiro
            Get-Process | Where-Object {$_.ProcessName -like "*git*"} | Stop-Process -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
            
            Remove-Item $lockFile -Force -ErrorAction Stop
            Start-Sleep -Seconds 1
            $removed = $true
            Write-Host "✅ Lock file removido com sucesso" -ForegroundColor Green
        } catch {
            Write-Host "   Tentativa $attempt falhou, aguardando..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }
    
    if (-not $removed) {
        Write-Host "`n❌ Não foi possível remover o lock file automaticamente." -ForegroundColor Red
        Write-Host "`n📋 Por favor, faça manualmente:" -ForegroundColor Yellow
        Write-Host "   1. Feche TODOS os processos Git (VS Code, Git GUI, etc.)" -ForegroundColor White
        Write-Host "   2. Delete o arquivo: $lockFile" -ForegroundColor White
        Write-Host "   3. Execute este script novamente" -ForegroundColor White
        Write-Host "`n   Ou execute no PowerShell como Administrador:" -ForegroundColor Yellow
        Write-Host "   Remove-Item '$lockFile' -Force" -ForegroundColor Cyan
        exit 1
    }
}

# Adicionar TODOS os arquivos
Write-Host "`n📦 Adicionando TODOS os arquivos ao staging..." -ForegroundColor Cyan
git add -A

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao adicionar arquivos" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Arquivos adicionados com sucesso" -ForegroundColor Green

# Verificar status
Write-Host "`n📋 Status dos arquivos:" -ForegroundColor Cyan
git status --short

# Verificar se há algo para commitar
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "`n⚠️  Nenhuma alteração para commitar" -ForegroundColor Yellow
    exit 0
}

# Fazer commit
Write-Host "`n💾 Fazendo commit..." -ForegroundColor Cyan
$commitMessage = @"
feat: Adicionar funcionalidade completa de treinos pré-configurados

- Criar migration para tabela preconfigured_workouts no Supabase
- Adicionar serviço preconfiguredWorkoutService para gerenciar treinos
- Atualizar página PreconfiguredWorkoutsPage para salvar treinos no banco
- Adicionar componentes de treinos (CreateWorkoutModal, WorkoutExerciseTable, etc.)
- Adicionar tabela editável no modal Criar Novo Treino
- Tabela sempre visível no modal para preenchimento manual
- Atualizar tipos Database no supabaseService
- Adicionar serviços de processamento de treinos (workoutParser, workoutCatalogService, etc.)
"@

git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao fazer commit" -ForegroundColor Red
    Write-Host "   Verifique se há alterações para commitar" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Commit realizado com sucesso" -ForegroundColor Green

# Sincronizar com o remoto (pull com rebase)
Write-Host "`n🔄 Sincronizando com o remoto..." -ForegroundColor Cyan
git pull origin main --rebase

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Aviso: Erro ao fazer pull (pode ser normal se não houver conflitos)" -ForegroundColor Yellow
    Write-Host "   Continuando com o push..." -ForegroundColor Yellow
}

# Enviar para o GitHub
Write-Host "`n🚀 Enviando para o GitHub..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Alterações enviadas com sucesso para o GitHub!" -ForegroundColor Green
    Write-Host "   Repositório: https://github.com/Paulhenriquems7054/FitCoach.IA.git" -ForegroundColor Cyan
    Write-Host "`n📝 Resumo:" -ForegroundColor Cyan
    git log -1 --oneline
} else {
    Write-Host "`n❌ Erro ao enviar para o GitHub" -ForegroundColor Red
    Write-Host "   Verifique suas credenciais e conexão com a internet" -ForegroundColor Yellow
    Write-Host "   Ou execute: git push origin main" -ForegroundColor Cyan
    exit 1
}
