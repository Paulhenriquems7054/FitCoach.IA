# Script simplificado para normalizar nomes de GIFs
# Remove acentos, converte para minúsculas, substitui espaços por hífens

param(
    [switch]$DryRun = $false
)

Write-Host "🔄 Normalizando nomes de GIFs..." -ForegroundColor Yellow
if ($DryRun) {
    Write-Host "⚠️  MODO DRY-RUN: Nenhuma alteração será feita" -ForegroundColor Cyan
}
Write-Host ""

# Função para normalizar nomes
function Normalize-Name {
    param([string]$name)
    
    # Remover extensão temporariamente
    $isFile = $name -match '\.(gif|png|jpg|jpeg)$'
    $extension = if ($isFile) { $matches[0] } else { '' }
    $nameWithoutExt = if ($isFile) { $name -replace '\.(gif|png|jpg|jpeg)$', '' } else { $name }
    
    # Normalizar
    $normalized = $nameWithoutExt.ToLower()
    $normalized = $normalized.Normalize('FormD')
    $normalized = $normalized -replace '[^\x00-\x7F]', ''
    $normalized = $normalized -replace '\s+', '-'
    $normalized = $normalized -replace '[()]', ''
    $normalized = $normalized -replace '[^\w\-]', ''
    $normalized = $normalized -replace '-+', '-'
    $normalized = $normalized -replace '^-|-$', ''
    
    return $normalized + $extension
}

# Mapeamento de nomes antigos para novos
$folderMapping = @{}
$fileMapping = @{}

# Processar pastas principais
$gifsPath = "public\GIFS"
if (-not (Test-Path $gifsPath)) {
    Write-Host "❌ Pasta public\GIFS não encontrada!" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Processando pastas principais..." -ForegroundColor Cyan
$folders = Get-ChildItem -Path $gifsPath -Directory
$totalFolders = $folders.Count
$processedFolders = 0

foreach ($folder in $folders) {
    $oldFolderName = $folder.Name
    $newFolderName = Normalize-Name $oldFolderName
    
    if ($oldFolderName -ne $newFolderName) {
        Write-Host "  📂 $oldFolderName -> $newFolderName" -ForegroundColor Yellow
        
        # Processar subpastas
        $subfolders = Get-ChildItem -Path $folder.FullName -Directory -ErrorAction SilentlyContinue
        foreach ($subfolder in $subfolders) {
            $oldSubName = $subfolder.Name
            $newSubName = Normalize-Name $oldSubName
            
            if ($oldSubName -ne $newSubName) {
                Write-Host "    📁 $oldSubName -> $newSubName" -ForegroundColor Gray
                $folderMapping["$oldFolderName/$oldSubName"] = "$newFolderName/$newSubName"
                
                if (-not $DryRun) {
                    try {
                        Rename-Item -Path $subfolder.FullName -NewName $newSubName -ErrorAction Stop
                    } catch {
                        Write-Host "      ✗ Erro: $_" -ForegroundColor Red
                    }
                }
            } else {
                $folderMapping["$oldFolderName/$oldSubName"] = "$newFolderName/$oldSubName"
            }
        }
        
        # Processar arquivos GIF
        $gifFiles = Get-ChildItem -Path $folder.FullName -Recurse -Filter "*.gif" -ErrorAction SilentlyContinue
        foreach ($gifFile in $gifFiles) {
            $oldFileName = $gifFile.Name
            $newFileName = Normalize-Name $oldFileName
            
            if ($oldFileName -ne $newFileName) {
                $relativePath = $gifFile.FullName.Replace((Resolve-Path $gifsPath).Path + '\', '').Replace('\', '/')
                $parentFolder = $relativePath -replace '/[^/]+$', ''
                $newRelativePath = if ($parentFolder) { "$parentFolder/$newFileName" } else { $newFileName }
                
                $fileMapping[$relativePath] = $newRelativePath
                Write-Host "      📄 $oldFileName -> $newFileName" -ForegroundColor DarkGray
                
                if (-not $DryRun) {
                    try {
                        Rename-Item -Path $gifFile.FullName -NewName $newFileName -ErrorAction Stop
                    } catch {
                        Write-Host "        ✗ Erro: $_" -ForegroundColor Red
                    }
                }
            }
        }
        
        # Renomear pasta principal por último
        if (-not $DryRun) {
            try {
                Rename-Item -Path $folder.FullName -NewName $newFolderName -ErrorAction Stop
                Write-Host "    ✓ Pasta renomeada" -ForegroundColor Green
            } catch {
                Write-Host "    ✗ Erro ao renomear pasta: $_" -ForegroundColor Red
            }
        }
    } else {
        # Mesmo nome, mas ainda precisamos mapear subpastas e arquivos
        $subfolders = Get-ChildItem -Path $folder.FullName -Directory -ErrorAction SilentlyContinue
        foreach ($subfolder in $subfolders) {
            $oldSubName = $subfolder.Name
            $newSubName = Normalize-Name $oldSubName
            if ($oldSubName -ne $newSubName) {
                $folderMapping["$oldFolderName/$oldSubName"] = "$oldFolderName/$newSubName"
            }
        }
    }
    
    $processedFolders++
    Write-Host "  Progresso: $processedFolders/$totalFolders" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Normalização concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Estatísticas:" -ForegroundColor Cyan
Write-Host "  - Pastas mapeadas: $($folderMapping.Count)" -ForegroundColor White
Write-Host "  - Arquivos mapeados: $($fileMapping.Count)" -ForegroundColor White
Write-Host ""

# Salvar mapeamentos
$mapping = @{
    folders = $folderMapping
    files = $fileMapping
}

$mapping | ConvertTo-Json -Depth 5 | Out-File -FilePath "gif-normalization-mapping.json" -Encoding UTF8
Write-Host "💾 Mapeamento salvo em: gif-normalization-mapping.json" -ForegroundColor Green
Write-Host ""

if ($DryRun) {
    Write-Host "⚠️  Para aplicar as alterações, execute sem -DryRun" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  PRÓXIMOS PASSOS:" -ForegroundColor Yellow
    Write-Host "1. Revisar o mapeamento em gif-normalization-mapping.json" -ForegroundColor White
    Write-Host "2. Atualizar exerciseGifService.ts com os novos nomes" -ForegroundColor White
    Write-Host "3. Testar build local: npm run build" -ForegroundColor White
    Write-Host "4. Testar preview: npm run preview" -ForegroundColor White
}

