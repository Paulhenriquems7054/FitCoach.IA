# Upload de GIFs para Cloudflare R2 usando Wrangler CLI

Este guia mostra como fazer upload de todos os GIFs (mais de 100 arquivos) usando a CLI do Wrangler.

## 📋 Pré-requisitos

- Node.js instalado (versão 16 ou superior)
- Conta Cloudflare com R2 ativado
- Bucket criado no R2 (ex: `fitcoach-gifs`)

## 🚀 Passo a Passo

### Passo 1: Instalar Wrangler CLI

Abra o terminal (PowerShell no Windows) e execute:

```bash
npm install -g wrangler
```

Ou se preferir instalar localmente no projeto:

```bash
npm install --save-dev wrangler
```

### Passo 2: Fazer Login no Cloudflare

Execute o comando:

```bash
wrangler login
```

Isso abrirá seu navegador para autenticar com a conta Cloudflare. Após autenticar, volte ao terminal.

### Passo 3: Verificar Buckets Disponíveis

Liste seus buckets para confirmar que o bucket foi criado:

```bash
wrangler r2 bucket list
```

Você deve ver algo como:
```
fitcoach-gifs
```

### Passo 4: Fazer Upload dos GIFs

⚠️ **IMPORTANTE:** Mantenha a estrutura de pastas `GIFS/...` ao fazer upload!

⚠️ **IMPORTANTE:** O Wrangler CLI **não suporta** upload recursivo de pastas com `--recursive`. Você precisa fazer upload arquivo por arquivo ou usar o script automatizado abaixo.

#### Opção A: Upload manual de um arquivo

Para fazer upload de um arquivo específico:

```bash
# Navegue até a pasta do projeto
cd D:\FitCoach.IA

# Upload de um arquivo específico
wrangler r2 object put fitcoach-gifs/GIFS/Abdomen/Abdominais.gif --file public/GIFS/Abdomen/Abdominais.gif
```

#### Opção B: Usar o script automatizado (Recomendado)

O script PowerShell faz upload de todos os arquivos automaticamente. Veja a seção "Script Automatizado" abaixo.

### Passo 5: Script Automatizado (Recomendado)

Crie um script PowerShell para fazer upload de todos os GIFs automaticamente:

#### Script PowerShell (`upload-gifs-to-r2.ps1`)

Crie o arquivo `upload-gifs-to-r2.ps1` na raiz do projeto:

```powershell
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

# Confirmar antes de continuar
$confirm = Read-Host "Deseja continuar com o upload? (S/N)"
if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "Upload cancelado." -ForegroundColor Yellow
    exit 0
}

# Fazer upload de cada pasta de grupo muscular
$muscleGroups = Get-ChildItem -Path $gifsPath -Directory

$uploaded = 0
$failed = 0

foreach ($group in $muscleGroups) {
    $groupName = $group.Name
    $groupPath = $group.FullName
    $r2Path = "GIFS/$groupName"
    
    Write-Host "📤 Fazendo upload de $groupName..." -ForegroundColor Cyan
    
    # Fazer upload da pasta
    $result = wrangler r2 object put "$bucketName/$r2Path/" --file "$groupPath" --recursive 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $uploaded++
        Write-Host "✅ $groupName concluído!" -ForegroundColor Green
    } else {
        $failed++
        Write-Host "❌ Erro ao fazer upload de $groupName" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Resumo do Upload:" -ForegroundColor Yellow
Write-Host "✅ Grupos enviados com sucesso: $uploaded" -ForegroundColor Green
Write-Host "❌ Grupos com erro: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
```

#### Script Node.js Alternativo (`upload-gifs-to-r2.js`)

Se preferir usar Node.js, crie o arquivo `upload-gifs-to-r2.js`:

```javascript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUCKET_NAME = 'fitcoach-gifs';
const GIFS_PATH = path.join(__dirname, 'public', 'GIFS');

console.log('🚀 Iniciando upload de GIFs para Cloudflare R2...');
console.log(`Bucket: ${BUCKET_NAME}`);
console.log(`Pasta local: ${GIFS_PATH}\n`);

// Verificar se a pasta existe
if (!fs.existsSync(GIFS_PATH)) {
    console.error(`❌ Erro: Pasta ${GIFS_PATH} não encontrada!`);
    process.exit(1);
}

// Listar grupos musculares
const muscleGroups = fs.readdirSync(GIFS_PATH, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

console.log(`📊 Grupos musculares encontrados: ${muscleGroups.length}\n`);

let uploaded = 0;
let failed = 0;

// Fazer upload de cada grupo
for (const groupName of muscleGroups) {
    const groupPath = path.join(GIFS_PATH, groupName);
    const r2Path = `GIFS/${groupName}`;
    
    console.log(`📤 Fazendo upload de ${groupName}...`);
    
    try {
        // Usar wrangler para fazer upload
        execSync(
            `wrangler r2 object put ${BUCKET_NAME}/${r2Path}/ --file "${groupPath}" --recursive`,
            { stdio: 'inherit', cwd: __dirname }
        );
        
        uploaded++;
        console.log(`✅ ${groupName} concluído!\n`);
    } catch (error) {
        failed++;
        console.error(`❌ Erro ao fazer upload de ${groupName}\n`);
    }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 Resumo do Upload:');
console.log(`✅ Grupos enviados com sucesso: ${uploaded}`);
console.log(`❌ Grupos com erro: ${failed}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
```

### Passo 6: Executar o Script

#### Se usar PowerShell:

```powershell
# Dar permissão para executar scripts (apenas na primeira vez)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Executar o script
.\upload-gifs-to-r2.ps1
```

#### Se usar Node.js:

```bash
node upload-gifs-to-r2.js
```

### Passo 7: Verificar Upload

Após o upload, verifique no painel do Cloudflare R2:

1. Acesse: https://dash.cloudflare.com/r2
2. Clique no bucket `fitcoach-gifs`
3. Verifique se todas as pastas aparecem:
   - `GIFS/Abdomen/`
   - `GIFS/Biceps/`
   - `GIFS/Cardio/`
   - etc.

Ou use o comando CLI:

```bash
wrangler r2 object list fitcoach-gifs --prefix GIFS/
```

## 🔍 Solução de Problemas

### Problema: "wrangler: command not found"
**Solução:** Instale o Wrangler globalmente:
```bash
npm install -g wrangler
```

### Problema: "Authentication required"
**Solução:** Faça login novamente:
```bash
wrangler login
```

### Problema: "Bucket not found"
**Solução:** Verifique o nome do bucket:
```bash
wrangler r2 bucket list
```

### Problema: "Upload muito lento"
**Solução:** 
- O upload de 1.4 GB pode levar 10-30 minutos dependendo da conexão
- É normal ser mais lento que o painel web
- Mas permite upload de quantos arquivos você quiser

### Problema: "EACCES: permission denied"
**Solução (Windows):**
- Execute o PowerShell como Administrador
- Ou verifique permissões da pasta `public/GIFS/`

### Problema: "Estrutura de pastas incorreta"
**Solução:**
- O script automatizado mantém a estrutura automaticamente
- Verifique se a estrutura local está correta: `public/GIFS/Abdomen/`, etc.
- Cada arquivo é enviado com o caminho completo: `GIFS/Abdomen/arquivo.gif`

## 📊 Monitoramento do Progresso

O script mostra o progresso durante o upload. Você verá:
- Nome dos arquivos sendo enviados (com ✅ ou ❌)
- Progresso por grupo muscular
- Resumo final com estatísticas
- Tempo total de execução

**Nota:** O upload pode levar 10-30 minutos dependendo da quantidade de arquivos e velocidade da conexão.

## ✅ Checklist

- [ ] Wrangler CLI instalado
- [ ] Login feito (`wrangler login`)
- [ ] Bucket criado e verificado
- [ ] Script de upload criado (ou comando manual executado)
- [ ] Upload concluído sem erros
- [ ] Estrutura verificada no painel do R2
- [ ] Teste de acesso público funcionando

## 🎯 Próximos Passos

Após o upload bem-sucedido:

1. **Configurar domínio público** (se ainda não fez)
   - No painel R2 → Settings → Public Access
   - Copie a URL (ex: `https://pub-xxxxx.r2.dev`)

2. **Configurar variável no Vercel:**
   - `VITE_GIF_CDN_URL=https://pub-xxxxx.r2.dev`

3. **Fazer novo deploy no Vercel**

4. **Testar no app:**
   - Acesse: https://fit-coach-ia.vercel.app/#/biblioteca
   - Verifique se os GIFs aparecem

---

**Pronto!** Agora você pode fazer upload de quantos GIFs quiser usando a CLI do Wrangler! 🚀

