# Script para fazer upload de todos os GIFs para Cloudflare R2
# Uso: .\upload-gifs-to-r2.ps1

$bucketName = "fitcoach-gifs"
$gifsPath = "public\GIFS"

Write-Host "🚀 Iniciando upload de GIFs para Cloudflare R2..." -ForegroundColor Green
Write-Host "Bucket: $bucketName" -ForegroundColor Cyan
Write-Host "Pasta local: $gifsPath" -ForegroundColor Cyan
Write-Host ""

# Verificar se a pasta existe
if (-not (Test-Path $gifsPath)) {
    Write-Host "❌ Erro: Pasta $gifsPath não encontrada!" -ForegroundColor Red
    exit 1
}

# Contar arquivos
$gifFiles = Get-ChildItem -Path $gifsPath -Recurse -Filter "*.gif"
$totalFiles = $gifFiles.Count
Write-Host "📊 Total de arquivos GIF encontrados: $totalFiles" -ForegroundColor Yellow
Write-Host ""

# Listar grupos musculares
$muscleGroups = Get-ChildItem -Path $gifsPath -Directory
Write-Host "📁 Grupos musculares encontrados:" -ForegroundColor Yellow
foreach ($group in $muscleGroups) {
    $count = (Get-ChildItem -Path $group.FullName -Filter "*.gif").Count
    Write-Host "   - $($group.Name): $count arquivos" -ForegroundColor Gray
}
Write-Host ""

# Confirmar antes de continuar
$confirm = Read-Host "Deseja continuar com o upload? (S/N)"
if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "Upload cancelado." -ForegroundColor Yellow
    exit 0
}

# Fazer upload de cada pasta de grupo muscular
$uploaded = 0
$failed = 0
$startTime = Get-Date

foreach ($group in $muscleGroups) {
    $groupName = $group.Name
    $groupPath = $group.FullName
    $r2Path = "GIFS/$groupName"
    $fileCount = (Get-ChildItem -Path $groupPath -Filter "*.gif").Count
    
    Write-Host "📤 Fazendo upload de $groupName ($fileCount arquivos)..." -ForegroundColor Cyan
    
    # Fazer upload da pasta usando wrangler
    try {
        # Usar wrangler para fazer upload recursivo
        $output = wrangler r2 object put "$bucketName/$r2Path/" --file "$groupPath" --recursive 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            $uploaded++
            Write-Host "✅ $groupName concluído!" -ForegroundColor Green
        } else {
            $failed++
            Write-Host "❌ Erro ao fazer upload de $groupName" -ForegroundColor Red
            Write-Host $output -ForegroundColor Red
        }
    } catch {
        $failed++
        Write-Host "❌ Erro ao fazer upload de $groupName: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Resumo do Upload:" -ForegroundColor Yellow
Write-Host "✅ Grupos enviados com sucesso: $uploaded" -ForegroundColor Green
Write-Host "❌ Grupos com erro: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host "⏱️  Tempo total: $($duration.ToString('mm\:ss'))" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if ($failed -eq 0) {
    Write-Host ""
    Write-Host "🎉 Upload concluído com sucesso!" -ForegroundColor Green
    Write-Host "Próximos passos:" -ForegroundColor Yellow
    Write-Host "1. Verifique os arquivos no painel do R2" -ForegroundColor Gray
    Write-Host "2. Configure o domínio público (Settings → Public Access)" -ForegroundColor Gray
    Write-Host "3. Configure VITE_GIF_CDN_URL no Vercel" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "⚠️  Alguns grupos falharam. Verifique os erros acima." -ForegroundColor Yellow
}

