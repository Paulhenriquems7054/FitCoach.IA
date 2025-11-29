# Script para corrigir arquivo .env.local
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Correção do arquivo .env.local" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está na raiz correta
if (-not (Test-Path "package.json")) {
    Write-Host "❌ ERRO: Execute este script na raiz do projeto!" -ForegroundColor Red
    Write-Host "   Localização atual: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Localização correta (package.json encontrado)" -ForegroundColor Green
Write-Host ""

# Ler valores atuais se o arquivo existir
$urlAtual = ""
$keyAtual = ""

if (Test-Path ".env.local") {
    Write-Host "📄 Arquivo .env.local encontrado, lendo valores..." -ForegroundColor Cyan
    $linhas = Get-Content ".env.local"
    
    foreach ($linha in $linhas) {
        if ($linha -match "^VITE_SUPABASE_URL=(.+)") {
            $urlAtual = $matches[1].Trim()
        }
        if ($linha -match "^VITE_SUPABASE_ANON_KEY=(.+)") {
            $keyAtual = $matches[1].Trim()
        }
    }
    
    if ($urlAtual) {
        Write-Host "   ✅ URL encontrada: $($urlAtual.Substring(0, [Math]::Min(50, $urlAtual.Length)))..." -ForegroundColor Green
    }
    if ($keyAtual) {
        Write-Host "   ✅ Key encontrada: $($keyAtual.Substring(0, [Math]::Min(30, $keyAtual.Length)))..." -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  Arquivo .env.local não encontrado" -ForegroundColor Yellow
}

Write-Host ""

# Se não tem valores, pedir para o usuário
if (-not $urlAtual -or $urlAtual -match "seu-projeto|sua_chave") {
    Write-Host "⚠️  Valores não encontrados ou são exemplos" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Por favor, forneça os valores do Supabase:" -ForegroundColor Cyan
    Write-Host "   (Obtenha em: https://app.supabase.com/project/seu-projeto/settings/api)" -ForegroundColor Gray
    Write-Host ""
    
    if (-not $urlAtual -or $urlAtual -match "seu-projeto") {
        $urlAtual = Read-Host "VITE_SUPABASE_URL"
    }
    
    if (-not $keyAtual -or $keyAtual -match "sua_chave") {
        $keyAtual = Read-Host "VITE_SUPABASE_ANON_KEY"
    }
}

# Criar conteúdo do arquivo
$conteudo = @"
# Variáveis de Ambiente - FitCoach.IA
# Gerado automaticamente em $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# API Key do Google Gemini (opcional)
VITE_GEMINI_API_KEY=sua_chave_api_gemini_aqui

# Configuração do Supabase (OBRIGATÓRIO)
VITE_SUPABASE_URL=$urlAtual
VITE_SUPABASE_ANON_KEY=$keyAtual
"@

# Salvar arquivo com encoding UTF-8
$conteudo | Out-File -FilePath ".env.local" -Encoding utf8 -NoNewline

Write-Host ""
Write-Host "✅ Arquivo .env.local criado/atualizado!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Agora você precisa:" -ForegroundColor Yellow
Write-Host "   1. Parar o servidor (Ctrl+C)" -ForegroundColor White
Write-Host "   2. Reiniciar: npm run dev" -ForegroundColor White
Write-Host "   3. Testar no navegador" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

