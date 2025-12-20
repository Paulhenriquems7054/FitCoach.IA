# Script para limpar arquivos .env problemáticos
Write-Host "🧹 Limpeza de Arquivos .env" -ForegroundColor Cyan
Write-Host ""

# Verificar quais arquivos existem
$envFiles = @('.envv', '.env.local.backup', '.env.local', '.env')
$foundFiles = @()

foreach ($file in $envFiles) {
    if (Test-Path $file) {
        $foundFiles += $file
        Write-Host "✓ Encontrado: $file" -ForegroundColor Yellow
    }
}

Write-Host ""

if ($foundFiles.Count -eq 0) {
    Write-Host "Nenhum arquivo .env encontrado." -ForegroundColor Green
    exit
}

# Verificar se .env.local existe e tem conteúdo
if (Test-Path '.env.local') {
    $content = Get-Content '.env.local' -Raw
    if ($content.Trim().Length -gt 0) {
        Write-Host "✅ .env.local encontrado e tem conteúdo" -ForegroundColor Green
    } else {
        Write-Host "⚠️  .env.local existe mas está vazio!" -ForegroundColor Red
    }
} else {
    Write-Host "❌ .env.local NÃO encontrado!" -ForegroundColor Red
    Write-Host "   Você precisa criar este arquivo com suas variáveis de ambiente." -ForegroundColor Yellow
}

Write-Host ""

# Perguntar o que fazer com os arquivos problemáticos
$action = Read-Host "O que deseja fazer?
1) Mover .envv e .env.local.backup para pasta 'backups'
2) Remover .envv e .env.local.backup completamente
3) Apenas verificar (não fazer nada)
Escolha (1/2/3)"

if ($action -eq '1') {
    # Criar pasta de backups
    if (-not (Test-Path 'backups')) {
        New-Item -ItemType Directory -Path 'backups' -Force | Out-Null
        Write-Host "📁 Pasta 'backups' criada" -ForegroundColor Green
    }
    
    # Mover arquivos
    if (Test-Path '.envv') {
        Move-Item '.envv' 'backups\.envv' -Force
        Write-Host "✓ .envv movido para backups/" -ForegroundColor Green
    }
    
    if (Test-Path '.env.local.backup') {
        Move-Item '.env.local.backup' 'backups\.env.local.backup' -Force
        Write-Host "✓ .env.local.backup movido para backups/" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "✅ Limpeza concluída! Arquivos movidos para pasta 'backups/'" -ForegroundColor Green
    
} elseif ($action -eq '2') {
    # Remover arquivos
    $confirm = Read-Host "⚠️  Tem certeza que deseja REMOVER permanentemente? (s/N)"
    
    if ($confirm -eq 's' -or $confirm -eq 'S') {
        if (Test-Path '.envv') {
            Remove-Item '.envv' -Force
            Write-Host "✓ .envv removido" -ForegroundColor Green
        }
        
        if (Test-Path '.env.local.backup') {
            Remove-Item '.env.local.backup' -Force
            Write-Host "✓ .env.local.backup removido" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "✅ Limpeza concluída! Arquivos removidos permanentemente" -ForegroundColor Green
    } else {
        Write-Host "❌ Operação cancelada" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "ℹ️  Apenas verificação realizada. Nenhuma ação executada." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "📋 Resumo:" -ForegroundColor Cyan
Write-Host "   Arquivo ativo: .env.local" -ForegroundColor White
Write-Host "   Arquivos ignorados pelo Vite: .envv, .env.local.backup" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Dica: Após limpar, reinicie o servidor (npm run dev)" -ForegroundColor Cyan

