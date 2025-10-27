$source = "D:\NUTRI.IA\node_modules"
$dest = "D:\APP-NUTRI.IA\node_modules"

Write-Host "Copiando dependencias de build..."

# Copiar estrutura de @rolldown
if (Test-Path "$source\@rolldown") {
    Copy-Item -Path "$source\@rolldown" -Destination "$dest\@rolldown" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ @rolldown copiado"
}

# Copiar todas as pastas com @
Get-ChildItem -Path $source -Directory -Filter "@*" | ForEach-Object {
    $itemName = $_.Name
    if ($itemName -notmatch "react" -and $itemName -notmatch "types") {
        Copy-Item -Path $_.FullName -Destination "$dest\$itemName" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "✓ $itemName copiado"
    }
}

# Copiar dependências essenciais
$essentialDeps = @("vite", "rollup", "esbuild", ".bin", "fdir", "picomatch", "tinyglobby")
foreach ($dep in $essentialDeps) {
    $items = Get-ChildItem -Path $source -Directory | Where-Object { $_.Name -like "*$dep*" }
    foreach ($item in $items) {
        Copy-Item -Path $item.FullName -Destination "$dest\$($item.Name)" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "✓ $($item.Name) copiado"
    }
}

Write-Host "`nConcluido! Execute: npm run dev"
Write-Host ""
