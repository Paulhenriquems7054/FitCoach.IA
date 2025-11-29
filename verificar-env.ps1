# Script para verificar e ajudar a configurar .env.local
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verificação do arquivo .env.local" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$envFile = ".env.local"
$exists = Test-Path $envFile

if ($exists) {
    Write-Host "✅ Arquivo .env.local encontrado" -ForegroundColor Green
    Write-Host ""
    
    $content = Get-Content $envFile -Raw
    
    # Verificar variáveis
    $hasUrl = $content -match "VITE_SUPABASE_URL"
    $hasKey = $content -match "VITE_SUPABASE_ANON_KEY"
    $hasExample = $content -match "seu-projeto|sua_chave"
    
    if ($hasUrl) {
        Write-Host "✅ VITE_SUPABASE_URL encontrado" -ForegroundColor Green
    } else {
        Write-Host "❌ VITE_SUPABASE_URL NÃO encontrado" -ForegroundColor Red
    }
    
    if ($hasKey) {
        Write-Host "✅ VITE_SUPABASE_ANON_KEY encontrado" -ForegroundColor Green
    } else {
        Write-Host "❌ VITE_SUPABASE_ANON_KEY NÃO encontrado" -ForegroundColor Red
    }
    
    Write-Host ""
    
    if ($hasExample) {
        Write-Host "⚠️  PROBLEMA ENCONTRADO!" -ForegroundColor Red
        Write-Host "O arquivo contém valores de EXEMPLO que precisam ser substituídos." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Você precisa:" -ForegroundColor Cyan
        Write-Host "1. Acessar: https://app.supabase.com" -ForegroundColor White
        Write-Host "2. Ir em Settings → API" -ForegroundColor White
        Write-Host "3. Copiar Project URL e anon public key" -ForegroundColor White
        Write-Host "4. Substituir no arquivo .env.local" -ForegroundColor White
        Write-Host "5. Reiniciar o servidor (Ctrl+C e depois npm run dev)" -ForegroundColor White
    } else {
        Write-Host "✅ Arquivo parece estar configurado!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Se ainda receber erro:" -ForegroundColor Yellow
        Write-Host "1. Verifique se os valores estão corretos" -ForegroundColor White
        Write-Host "2. Certifique-se de que reiniciou o servidor" -ForegroundColor White
        Write-Host "3. Verifique se não há espaços extras nas variáveis" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "Conteúdo do arquivo (apenas linhas SUPABASE):" -ForegroundColor Cyan
    Get-Content $envFile | Select-String -Pattern "SUPABASE"
    
} else {
    Write-Host "❌ Arquivo .env.local NÃO encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Criando arquivo de exemplo..." -ForegroundColor Yellow
    Write-Host ""
    
    $content = @"
# Variáveis de Ambiente - FitCoach.IA
# Preencha com seus valores reais

# API Key do Google Gemini
VITE_GEMINI_API_KEY=sua_chave_api_gemini_aqui

# Configuração do Supabase (OBRIGATÓRIO)
# Obtenha em: https://app.supabase.com/project/seu-projeto/settings/api
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_key_aqui
"@
    
    $content | Out-File -FilePath $envFile -Encoding utf8
    
    Write-Host "✅ Arquivo .env.local criado!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE: Agora você precisa:" -ForegroundColor Yellow
    Write-Host "1. Abrir o arquivo .env.local" -ForegroundColor White
    Write-Host "2. Obter credenciais em: https://app.supabase.com" -ForegroundColor White
    Write-Host "3. Substituir os valores de exemplo pelos valores reais" -ForegroundColor White
    Write-Host "4. Reiniciar o servidor" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

