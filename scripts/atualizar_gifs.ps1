# ⚠️ SCRIPT OBSOLETO ⚠️
# Este script não é mais necessário.
# Os GIFs agora são adicionados diretamente em public/GIFS
# 
# Script para atualizar GIFs do sistema (OBSOLETO)
# Copia os GIFs da pasta "Gifs Animados" para "public/GIFS" mantendo a estrutura
# 
# NOTA: A pasta "Gifs Animados" foi removida.
# Adicione novos GIFs diretamente em public/GIFS/[Grupo]-[timestamp]/[Grupo]/

$sourcePath = "D:\FitCoach.IA\Gifs Animados"  # ⚠️ Pasta não existe mais
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
    # Primeiro, tentar encontrar pasta existente em public/GIFS que corresponda ao grupo
    $existingFolders = Get-ChildItem -Path $targetPath -Directory -ErrorAction SilentlyContinue
    $targetGroupPath = $null
    
    # Mapear nomes de grupos da fonte para padrões de busca em public/GIFS
    $groupPatterns = @{
        'Abdômen' = 'Abdômen'
        'Antebraço' = 'Antebraço'
        'Bíceps' = 'Bíceps'
        'CALISTENIA' = 'GIFS CALISTENIA'
        'Costas' = 'Costas'
        'CROSSFIT' = 'GIFS CROSSFIT'
        'Cárdio Academia' = 'Cárdio Academia'
        'ERETORES DA ESPINHA' = 'ERETORES DA ESPINHA'
        'Glúteo' = 'Glúteo'
        'MOBILIDADE ALONGAMENTO LIBERAÇÃO' = 'MOBILIDADE ALONGAMENTO LIBERAÇÃO'
        'Ombro' = 'Ombro'
        'Panturrilha' = 'Panturrilha'
        'Peitoral' = 'Peitoral'
        'Pernas' = 'Pernas'
        'Trapézio' = 'Trapézio'
        'TREINAMENTO FUNCIONAL' = 'GIFS TREINAMENTO FUNCIONAL'
        'Tríceps' = 'Tríceps'
    }
    
    $searchPattern = if ($groupPatterns.ContainsKey($groupName)) { $groupPatterns[$groupName] } else { $groupName }
    
    # Procurar pasta existente que corresponda ao padrão
    $matchedFolder = $existingFolders | Where-Object { $_.Name -like "$searchPattern*" } | Select-Object -First 1
    
    if ($matchedFolder) {
        # Usar pasta existente - encontrar a subpasta interna
        $innerFolder = Get-ChildItem -Path $matchedFolder.FullName -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($innerFolder) {
            $targetGroupPath = $innerFolder.FullName
        } else {
            # Se não há subpasta interna, usar a própria pasta
            $targetGroupPath = $matchedFolder.FullName
        }
        Write-Host "  Usando pasta existente: $($matchedFolder.Name)" -ForegroundColor Cyan
    } else {
        # Se não encontrou pasta existente, criar nova estrutura
        $subFolders = Get-ChildItem -Path $_.FullName -Directory
        if ($subFolders.Count -gt 0) {
            $subFolder = $subFolders[0]
            # Usar timestamp atual para nova pasta
            $timestamp = Get-Date -Format "yyyyMMddTHHmmssZ"
            $targetGroupPath = Join-Path $targetPath "$($subFolder.Name)-$timestamp\$($subFolder.Name)"
        } else {
            $targetGroupPath = Join-Path $targetPath $groupName
        }
        
        # Criar pasta de destino
        if (-not (Test-Path $targetGroupPath)) {
            New-Item -ItemType Directory -Path $targetGroupPath -Force | Out-Null
            Write-Host "  Pasta criada: $targetGroupPath" -ForegroundColor Green
        }
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

