# Script para fazer upload de todos os GIFs para Cloudflare R2
# Uso: .\upload-gifs-to-r2.ps1

$bucketName = "fitcoach-gifs"
$gifsPath = "public\GIFS"

Write-Host "[INICIO] Iniciando upload de GIFs para Cloudflare R2..." -ForegroundColor Green
Write-Host "Bucket: $bucketName" -ForegroundColor Cyan
Write-Host "Pasta local: $gifsPath" -ForegroundColor Cyan
Write-Host ""

# Verificar se a pasta existe
if (-not (Test-Path $gifsPath)) {
    Write-Host "[ERRO] Pasta $gifsPath nao encontrada!" -ForegroundColor Red
    exit 1
}

# Contar arquivos
$gifFiles = Get-ChildItem -Path $gifsPath -Recurse -Filter "*.gif"
$totalFiles = $gifFiles.Count
Write-Host "[INFO] Total de arquivos GIF encontrados: $totalFiles" -ForegroundColor Yellow
Write-Host ""

# Listar grupos musculares
$muscleGroups = Get-ChildItem -Path $gifsPath -Directory
Write-Host "[INFO] Grupos musculares encontrados:" -ForegroundColor Yellow
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
    $gifFiles = Get-ChildItem -Path $groupPath -Filter "*.gif"
    $fileCount = $gifFiles.Count
    
    Write-Host "[UPLOAD] Fazendo upload de $groupName ($fileCount arquivos)..." -ForegroundColor Cyan
    
    $groupUploaded = 0
    $groupFailed = 0
    
    # Fazer upload de cada arquivo individualmente
    foreach ($gifFile in $gifFiles) {
        $fileName = $gifFile.Name
        $filePath = $gifFile.FullName
        $objectPath = "$r2Path/$fileName"
        
        try {
            # Fazer upload de um arquivo por vez
            $output = wrangler r2 object put "$bucketName/$objectPath" --file "$filePath" 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                $groupUploaded++
                Write-Host "   [OK] $fileName" -ForegroundColor Gray
            } else {
                $groupFailed++
                Write-Host "   [ERRO] $fileName" -ForegroundColor Red
                Write-Host "      $output" -ForegroundColor DarkRed
            }
        } catch {
            $groupFailed++
            Write-Host "   [ERRO] Erro ao fazer upload de $fileName : $_" -ForegroundColor Red
        }
    }
    
    if ($groupFailed -eq 0) {
        $uploaded++
        Write-Host "[OK] $groupName concluido! ($groupUploaded arquivos)" -ForegroundColor Green
    } else {
        $failed++
        Write-Host "[ATENCAO] $groupName : $groupUploaded sucesso, $groupFailed falhas" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[RESUMO] Resumo do Upload:" -ForegroundColor Yellow
Write-Host "[OK] Grupos enviados com sucesso: $uploaded" -ForegroundColor Green
Write-Host "[ERRO] Grupos com erro: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host "[TEMPO] Tempo total: $($duration.ToString('mm\:ss'))" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($failed -eq 0) {
    Write-Host ""
    Write-Host "[SUCESSO] Upload concluido com sucesso!" -ForegroundColor Green
    Write-Host "Proximos passos:" -ForegroundColor Yellow
    Write-Host "1. Verifique os arquivos no painel do R2" -ForegroundColor Gray
    Write-Host "2. Configure o dominio publico (Settings -> Public Access)" -ForegroundColor Gray
    Write-Host "3. Configure VITE_GIF_CDN_URL no Vercel" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "[ATENCAO] Alguns grupos falharam. Verifique os erros acima." -ForegroundColor Yellow
}

