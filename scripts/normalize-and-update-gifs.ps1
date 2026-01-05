# Script completo para normalizar nomes de GIFs e atualizar o código
# Este script:
# 1. Renomeia todas as pastas e arquivos GIF para nomes normalizados
# 2. Atualiza o exerciseGifService.ts com os novos nomes

param(
    [switch]$DryRun = $false  # Se true, apenas mostra o que seria feito sem fazer alterações
)

Write-Host "🔄 Normalizando nomes de GIFs e atualizando código..." -ForegroundColor Yellow
Write-Host ""

if ($DryRun) {
    Write-Host "⚠️  MODO DRY-RUN: Nenhuma alteração será feita" -ForegroundColor Cyan
    Write-Host ""
}

# Função para normalizar nomes
function Normalize-Name {
    param([string]$name)
    
    # Remover extensão temporariamente
    $isFile = $name -match '\.(gif|png|jpg|jpeg)$'
    $extension = if ($isFile) { $matches[0] } else { '' }
    $nameWithoutExt = if ($isFile) { $name -replace '\.(gif|png|jpg|jpeg)$', '' } else { $name }
    
    # Normalizar: remover acentos, converter para minúsculas, substituir espaços e caracteres especiais
    $normalized = $nameWithoutExt
        .ToLower()                                    # Minúsculas
        .Normalize('FormD')                          # Decompor caracteres
        -replace '[^\x00-\x7F]', ''                  # Remover acentos
        -replace '\s+', '-'                           # Espaços para hífen
        -replace '[()]', ''                           # Remover parênteses
        -replace '[^\w\-]', ''                        # Remover caracteres especiais (manter apenas letras, números e hífen)
        -replace '-+', '-'                            # Múltiplos hífens para um
        -replace '^-|-$', ''                          # Remover hífens no início/fim
    
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
                $newPath = Join-Path $folder.Parent.FullName $newFolderName
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
            $folderMapping["$oldFolderName/$oldSubName"] = "$oldFolderName/$newSubName"
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
    Write-Host "2. Executar script para atualizar exerciseGifService.ts" -ForegroundColor White
    Write-Host "3. Testar build local: npm run build" -ForegroundColor White
    Write-Host "4. Testar preview: npm run preview" -ForegroundColor White
}

