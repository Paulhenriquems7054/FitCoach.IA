# Script para gerar o código atualizado do exerciseGifService.ts
# Baseado nos GIFs copiados para public/GIFS

$gifsPath = "D:\FitCoach.IA\public\GIFS"
$outputFile = "D:\FitCoach.IA\scripts\servico_gifs_atualizado.txt"

# Mapeamento de grupos musculares para keywords
$muscleGroupKeywords = @{
    'Abdômen' = @('abd', 'abdomen', 'abdominal', 'core', 'prancha')
    'Antebraço' = @('antebraço', 'antebraco', 'pulso', 'punho')
    'Bíceps' = @('bíceps', 'biceps', 'rosca')
    'Cárdio Academia' = @('cardio', 'cárdio', 'esteira', 'bicicleta', 'bike', 'elíptico', 'eliptico')
    'Costas' = @('costas', 'remo', 'remada', 'puxada', 'barra fixa', 'pullover', 'levantamento terra')
    'Eretores da Espinha' = @('eretor', 'lombar', 'hiperextensão', 'hiperextensao')
    'Glúteo' = @('glúteo', 'gluteo', 'glúteos', 'elevação pélvica', 'elevacao pelvica', 'ponte', 'stiff')
    'Ombro' = @('ombro', 'ombros', 'desenvolvimento', 'elevação', 'elevacao', 'deltoide')
    'Panturrilha' = @('panturrilha', 'panturrinha', 'gêmeos', 'gemeos', 'flexão plantar', 'flexao plantar', 'elevação de panturrilha', 'elevacao de panturrilha', 'levantamento de panturrilha')
    'Peitoral' = @('peitoral', 'peito', 'supino', 'crucifixo', 'voador', 'flexão', 'flexao', 'paralelas')
    'Pernas' = @('pernas', 'perna', 'agachamento', 'leg press', 'afundo', 'lunges', 'passada', 'cadeira extensora', 'cadeira flexora')
    'Trapézio' = @('trapézio', 'trapezio', 'encolhimento')
    'Tríceps' = @('tríceps', 'triceps', 'tricep', 'mergulho')
    'CALISTENIA' = @('calistenia', 'calistênia', 'flexão', 'flexao', 'paralela', 'muscle up', 'planche', 'barra fixa')
    'CROSSFIT' = @('crossfit', 'burpee', 'kettlebell', 'arranco', 'arremesso', 'snatch', 'clean')
    'MOBILIDADE ALONGAMENTO LIBERAÇÃO' = @('mobilidade', 'alongamento', 'liberação', 'liberacao', 'rolo', 'espuma', 'flexibilidade')
    'TREINAMENTO FUNCIONAL' = @('funcional', 'treinamento funcional', 'faixa', 'elástico', 'elastico', 'banda', 'gymstick')
}

Write-Host "=== Gerando código atualizado do exerciseGifService.ts ===" -ForegroundColor Cyan

# Coletar dados de todos os grupos
$groupsData = @{}

Get-ChildItem -Path $gifsPath -Directory | ForEach-Object {
    $groupFolder = $_.Name
    $subFolders = Get-ChildItem -Path $_.FullName -Directory
    
    if ($subFolders.Count -gt 0) {
        # Usar a subpasta com mais arquivos
        $bestSubFolder = $subFolders | Sort-Object { (Get-ChildItem $_.FullName -Filter "*.gif").Count } -Descending | Select-Object -First 1
        $gifs = Get-ChildItem -Path $bestSubFolder.FullName -Filter "*.gif" | Select-Object -ExpandProperty Name | Sort-Object
        
        # Extrair nome do grupo (sem timestamp)
        $groupName = if ($groupFolder -match '^(.+?)-2024') {
            $matches[1]
        } else {
            $groupFolder
        }
        
        # Normalizar nome do grupo
        $groupName = $groupName -replace '^GIFS ', ''
        
        if (-not $groupsData.ContainsKey($groupName)) {
            $groupsData[$groupName] = @{
                'folder' = "$groupFolder/$($bestSubFolder.Name)"
                'files' = $gifs
            }
        } elseif ($gifs.Count -gt $groupsData[$groupName].files.Count) {
            # Usar a pasta com mais arquivos
            $groupsData[$groupName] = @{
                'folder' = "$groupFolder/$($bestSubFolder.Name)"
                'files' = $gifs
            }
        }
    }
}

# Gerar código TypeScript
$code = @"
// Mapeamento de grupos musculares para pastas de GIFs
const muscleGroupFolders: Record<string, string> = {
"@

# Adicionar mapeamentos
foreach ($groupName in $groupsData.Keys | Sort-Object) {
    $folder = $groupsData[$groupName].folder
    $keywords = if ($muscleGroupKeywords.ContainsKey($groupName)) {
        $muscleGroupKeywords[$groupName]
    } else {
        @($groupName.ToLower())
    }
    
    foreach ($keyword in $keywords) {
        $code += "`n  '$keyword': '$folder',"
    }
}

$code += @"

};

/**
 * Lista completa de todos os GIFs disponíveis por grupo muscular
 * Baseado nos nomes exatos dos arquivos
 */
const availableGifsByGroup: Record<string, string[]> = {
"@

# Adicionar listas de arquivos
foreach ($groupName in $groupsData.Keys | Sort-Object) {
    $folder = $groupsData[$groupName].folder
    $files = $groupsData[$groupName].files
    
    $code += "`n  '$folder': ["
    foreach ($file in $files) {
        $code += "`n    '$file',"
    }
    $code += "`n  ],"
}

$code += @"
};
"@

# Salvar código
$code | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "`nCódigo gerado em: $outputFile" -ForegroundColor Green
Write-Host "Total de grupos: $($groupsData.Keys.Count)" -ForegroundColor Cyan
$totalGifs = ($groupsData.Values | ForEach-Object { $_.files.Count } | Measure-Object -Sum).Sum
Write-Host "Total de GIFs: $totalGifs" -ForegroundColor Cyan

# Mostrar resumo
Write-Host "`n=== Resumo por Grupo ===" -ForegroundColor Yellow
foreach ($groupName in $groupsData.Keys | Sort-Object) {
    $count = $groupsData[$groupName].files.Count
    Write-Host "$groupName : $count arquivos" -ForegroundColor White
}

