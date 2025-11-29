# Script para atualizar GIFs do sistema
# Copia os GIFs da pasta "Gifs Animados" para "public/GIFS" mantendo a estrutura

$sourcePath = "D:\FitCoach.IA\Gifs Animados"
$targetPath = "D:\FitCoach.IA\public\GIFS"

Write-Host "=== Atualizando GIFs ===" -ForegroundColor Cyan
Write-Host "Origem: $sourcePath" -ForegroundColor Yellow
Write-Host "Destino: $targetPath" -ForegroundColor Yellow
Write-Host ""

# Criar estrutura de destino se não existir
if (-not (Test-Path $targetPath)) {
    New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
    Write-Host "Pasta de destino criada: $targetPath" -ForegroundColor Green
}

# Contadores
$totalCopied = 0
$totalSkipped = 0
$totalErrors = 0

# Processar cada grupo muscular
Get-ChildItem -Path $sourcePath -Directory | ForEach-Object {
    $groupName = $_.Name
    Write-Host "Processando grupo: $groupName" -ForegroundColor Cyan
    
    # Encontrar a subpasta com os GIFs (pode ter estrutura aninhada)
    $gifFiles = Get-ChildItem -Path $_.FullName -Recurse -Filter "*.gif"
    
    if ($gifFiles.Count -eq 0) {
        Write-Host "  Nenhum GIF encontrado em $groupName" -ForegroundColor Yellow
        return
    }
    
    # Determinar estrutura de destino
    # Se há uma subpasta com o mesmo nome do grupo + número, usar essa estrutura
    $subFolders = Get-ChildItem -Path $_.FullName -Directory
    $targetGroupPath = $null
    
    if ($subFolders.Count -gt 0) {
        # Usar a primeira subpasta encontrada (ex: "Abdômen (18)")
        $subFolder = $subFolders[0]
        $targetGroupPath = Join-Path $targetPath "$($subFolder.Name)-20241202T155424Z-001\$($subFolder.Name)"
    } else {
        # Se não há subpasta, criar estrutura simples
        $targetGroupPath = Join-Path $targetPath $groupName
    }
    
    # Criar pasta de destino
    if (-not (Test-Path $targetGroupPath)) {
        New-Item -ItemType Directory -Path $targetGroupPath -Force | Out-Null
        Write-Host "  Pasta criada: $targetGroupPath" -ForegroundColor Green
    }
    
    # Copiar cada GIF
    foreach ($gifFile in $gifFiles) {
        $targetFile = Join-Path $targetGroupPath $gifFile.Name
        
        try {
            if (Test-Path $targetFile) {
                # Verificar se precisa atualizar (comparar data de modificação)
                $sourceTime = $gifFile.LastWriteTime
                $targetTime = (Get-Item $targetFile).LastWriteTime
                
                if ($sourceTime -gt $targetTime) {
                    Copy-Item -Path $gifFile.FullName -Destination $targetFile -Force
                    Write-Host "  Atualizado: $($gifFile.Name)" -ForegroundColor Yellow
                    $totalCopied++
                } else {
                    $totalSkipped++
                }
            } else {
                Copy-Item -Path $gifFile.FullName -Destination $targetFile -Force
                Write-Host "  Copiado: $($gifFile.Name)" -ForegroundColor Green
                $totalCopied++
            }
        } catch {
            Write-Host "  ERRO ao copiar $($gifFile.Name): $_" -ForegroundColor Red
            $totalErrors++
        }
    }
    
    Write-Host "  Total processado: $($gifFiles.Count) arquivos" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "=== Resumo ===" -ForegroundColor Cyan
Write-Host "Copiados/Atualizados: $totalCopied" -ForegroundColor Green
Write-Host "Ignorados (já existem): $totalSkipped" -ForegroundColor Yellow
Write-Host "Erros: $totalErrors" -ForegroundColor $(if ($totalErrors -gt 0) { "Red" } else { "Green" })
Write-Host ""
Write-Host "Concluído!" -ForegroundColor Green

