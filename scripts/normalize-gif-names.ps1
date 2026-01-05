# Script para normalizar nomes de pastas e arquivos GIF
# Remove acentos, espaços e converte para minúsculas
# Compatível com Vercel (Linux - case sensitive)

Write-Host "🔄 Normalizando nomes de pastas e arquivos GIF..." -ForegroundColor Yellow
Write-Host ""

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

# Função para normalizar caminho completo
function Normalize-Path {
    param([string]$path)
    
    $segments = $path -split '[\\/]'
    $normalizedSegments = $segments | ForEach-Object {
        if ($_ -and $_ -ne '.') {
            Normalize-Name $_
        } else {
            $_
        }
    }
    
    return $normalizedSegments -join '/'
}

# Mapeamento de nomes antigos para novos (para atualizar no código)
$mapping = @{}

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
    $oldName = $folder.Name
    $newName = Normalize-Name $oldName
    
    if ($oldName -ne $newName) {
        Write-Host "  Renomeando: $oldName -> $newName" -ForegroundColor Yellow
        $mapping[$oldName] = $newName
        
        # Renomear pasta principal
        $oldPath = $folder.FullName
        $newPath = Join-Path $folder.Parent.FullName $newName
        
        try {
            Rename-Item -Path $oldPath -NewName $newName -ErrorAction Stop
            Write-Host "    ✓ Pasta renomeada" -ForegroundColor Green
        } catch {
            Write-Host "    ✗ Erro ao renomear pasta: $_" -ForegroundColor Red
            continue
        }
        
        # Processar subpastas
        $subfolders = Get-ChildItem -Path $newPath -Directory -ErrorAction SilentlyContinue
        foreach ($subfolder in $subfolders) {
            $oldSubName = $subfolder.Name
            $newSubName = Normalize-Name $oldSubName
            
            if ($oldSubName -ne $newSubName) {
                Write-Host "    Renomeando subpasta: $oldSubName -> $newSubName" -ForegroundColor Yellow
                $mapping["$oldName/$oldSubName"] = "$newName/$newSubName"
                
                try {
                    Rename-Item -Path $subfolder.FullName -NewName $newSubName -ErrorAction Stop
                    Write-Host "      ✓ Subpasta renomeada" -ForegroundColor Green
                } catch {
                    Write-Host "      ✗ Erro ao renomear subpasta: $_" -ForegroundColor Red
                }
            }
        }
        
        # Processar arquivos GIF
        $gifFiles = Get-ChildItem -Path $newPath -Recurse -Filter "*.gif" -ErrorAction SilentlyContinue
        foreach ($gifFile in $gifFiles) {
            $oldFileName = $gifFile.Name
            $newFileName = Normalize-Name $oldFileName
            
            if ($oldFileName -ne $newFileName) {
                $relativePath = $gifFile.FullName.Replace((Get-Location).Path + '\', '').Replace('\', '/')
                $mapping[$relativePath] = $relativePath.Replace($oldFileName, $newFileName)
                
                try {
                    Rename-Item -Path $gifFile.FullName -NewName $newFileName -ErrorAction Stop
                } catch {
                    Write-Host "      ✗ Erro ao renomear arquivo $oldFileName: $_" -ForegroundColor Red
                }
            }
        }
    }
    
    $processedFolders++
    Write-Host "  Progresso: $processedFolders/$totalFolders pastas processadas" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Normalização concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Mapeamento gerado:" -ForegroundColor Cyan
Write-Host ($mapping | ConvertTo-Json -Depth 3)

# Salvar mapeamento em arquivo JSON para uso no código
$mapping | ConvertTo-Json -Depth 3 | Out-File -FilePath "gif-name-mapping.json" -Encoding UTF8
Write-Host ""
Write-Host "💾 Mapeamento salvo em: gif-name-mapping.json" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Revisar o mapeamento em gif-name-mapping.json" -ForegroundColor White
Write-Host "2. Atualizar exerciseGifService.ts com os novos nomes" -ForegroundColor White
Write-Host "3. Testar build local: npm run build" -ForegroundColor White
Write-Host "4. Testar preview: npm run preview" -ForegroundColor White

