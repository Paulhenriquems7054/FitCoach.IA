# Script para criar arquivo .env.local
# Execute: .\criar-env-local.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Criar arquivo .env.local" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se já existe
if (Test-Path .env.local) {
    Write-Host "⚠️  Arquivo .env.local já existe!" -ForegroundColor Yellow
    $sobrescrever = Read-Host "Deseja sobrescrever? (s/N)"
    if ($sobrescrever -ne "s" -and $sobrescrever -ne "S") {
        Write-Host "Operação cancelada." -ForegroundColor Yellow
        exit
    }
}

Write-Host "Preencha as informações abaixo:" -ForegroundColor Green
Write-Host ""

# Solicitar Gemini API Key
$geminiKey = Read-Host "VITE_GEMINI_API_KEY (ou pressione Enter para pular)"
if ([string]::IsNullOrWhiteSpace($geminiKey)) {
    $geminiKey = "sua_chave_api_gemini_aqui"
}

# Solicitar Supabase URL
Write-Host ""
Write-Host "Obtenha essas informações em: https://app.supabase.com/project/seu-projeto/settings/api" -ForegroundColor Cyan
$supabaseUrl = Read-Host "VITE_SUPABASE_URL"
if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
    Write-Host "⚠️  URL do Supabase é obrigatória para o sistema de cupons!" -ForegroundColor Red
    $supabaseUrl = "https://seu-projeto.supabase.co"
}

# Solicitar Supabase Anon Key
$supabaseKey = Read-Host "VITE_SUPABASE_ANON_KEY"
if ([string]::IsNullOrWhiteSpace($supabaseKey)) {
    Write-Host "⚠️  Chave anon do Supabase é obrigatória para o sistema de cupons!" -ForegroundColor Red
    $supabaseKey = "sua_chave_anon_key_aqui"
}

# Criar conteúdo do arquivo
$conteudo = @"
# Variáveis de Ambiente - FitCoach.IA
# Criado automaticamente em $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# API Key do Google Gemini
VITE_GEMINI_API_KEY=$geminiKey

# Configuração do Supabase (OBRIGATÓRIO para sistema de cupons)
VITE_SUPABASE_URL=$supabaseUrl
VITE_SUPABASE_ANON_KEY=$supabaseKey
"@

# Salvar arquivo
$conteudo | Out-File -FilePath .env.local -Encoding utf8 -NoNewline

Write-Host ""
Write-Host "✅ Arquivo .env.local criado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Reinicie o servidor de desenvolvimento!" -ForegroundColor Yellow
Write-Host "   Pressione Ctrl+C para parar o servidor atual" -ForegroundColor Yellow
Write-Host "   Depois execute: npm run dev" -ForegroundColor Yellow
Write-Host ""

