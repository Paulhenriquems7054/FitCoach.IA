# Script para enviar alterações de treinos pré-configurados para o GitHub
# Execute este script no PowerShell: .\git-push-workouts.ps1

Write-Host "🚀 Preparando para enviar alterações ao GitHub..." -ForegroundColor Cyan

# Navegar para o diretório do projeto
Set-Location $PSScriptRoot

# Tentar remover o arquivo de lock se existir
if (Test-Path ".git/index.lock") {
    Write-Host "⚠️  Removendo arquivo de lock..." -ForegroundColor Yellow
    try {
        Remove-Item ".git/index.lock" -Force -ErrorAction Stop
        Start-Sleep -Seconds 2
        Write-Host "✅ Lock file removido" -ForegroundColor Green
    } catch {
        Write-Host "❌ Não foi possível remover o lock file. Por favor, feche todos os processos Git e tente novamente." -ForegroundColor Red
        Write-Host "   Ou delete manualmente: .git/index.lock" -ForegroundColor Yellow
        exit 1
    }
}

# Adicionar arquivos relacionados à funcionalidade de treinos pré-configurados
Write-Host "`n📦 Adicionando arquivos ao staging..." -ForegroundColor Cyan

git add supabase/migrations/009_criar_tabela_preconfigured_workouts.sql
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao adicionar migration" -ForegroundColor Red
    exit 1
}

git add services/preconfiguredWorkoutService.ts
git add pages/PreconfiguredWorkoutsPage.tsx
git add components/workouts/
git add services/supabaseService.ts
git add services/workoutCatalogService.ts
git add services/workoutDocumentProcessor.ts
git add services/workoutParser.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao adicionar arquivos" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Arquivos adicionados com sucesso" -ForegroundColor Green

# Verificar status
Write-Host "`n📋 Status dos arquivos:" -ForegroundColor Cyan
git status --short

# Fazer commit
Write-Host "`n💾 Fazendo commit..." -ForegroundColor Cyan
$commitMessage = @"
feat: Adicionar funcionalidade de treinos pré-configurados com tabela no Supabase

- Criar migration para tabela preconfigured_workouts
- Adicionar serviço para gerenciar treinos pré-configurados no Supabase
- Atualizar página PreconfiguredWorkoutsPage para salvar treinos no banco
- Adicionar tabela editável no modal Criar Novo Treino
- Tabela sempre visível no modal para preenchimento manual
- Remover botão de importar PDFs (não necessário)
"@

git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao fazer commit" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Commit realizado com sucesso" -ForegroundColor Green

# Enviar para o GitHub
Write-Host "`n🚀 Enviando para o GitHub..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Alterações enviadas com sucesso para o GitHub!" -ForegroundColor Green
    Write-Host "   Repositório: https://github.com/Paulhenriquems7054/FitCoach.IA.git" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Erro ao enviar para o GitHub" -ForegroundColor Red
    Write-Host "   Verifique suas credenciais e conexão com a internet" -ForegroundColor Yellow
    exit 1
}
