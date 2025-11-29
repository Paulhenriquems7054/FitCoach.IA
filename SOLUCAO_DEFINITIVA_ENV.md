# 🔧 Solução Definitiva: Variáveis não carregadas pelo Vite

## ⚠️ Problema
As variáveis do `.env.local` não estão sendo carregadas pelo Vite, mesmo com o arquivo configurado corretamente.

## ✅ Solução Passo a Passo

### PASSO 1: Verificar o arquivo .env.local

Execute no terminal:
```powershell
Get-Content .env.local
```

Deve mostrar algo como:
```
VITE_SUPABASE_URL=https://dbugchiwqwnrnnnsszel.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### PASSO 2: Verificar formato do arquivo

O arquivo `.env.local` deve:
- ✅ Estar na raiz do projeto (mesmo nível do `package.json`)
- ✅ Ter cada variável em uma linha separada
- ✅ Não ter espaços antes ou depois do `=`
- ✅ Não ter aspas ao redor dos valores
- ✅ As variáveis devem começar com `VITE_`

**Formato CORRETO:**
```env
VITE_SUPABASE_URL=https://dbugchiwqwnrnnnsszel.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRidWdjaGl3cXducm5ubnNzemVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNDQ4NDYsImV4cCI6MjA3OTYyMDg0Nn0.X05KWOwapggPuo_Gkva_O01QSwJtgoE6YeMVGx5k9b4
```

**Formato ERRADO:**
```env
# ❌ Com espaços
VITE_SUPABASE_URL = https://dbugchiwqwnrnnnsszel.supabase.co

# ❌ Com aspas
VITE_SUPABASE_URL="https://dbugchiwqwnrnnnsszel.supabase.co"

# ❌ Sem VITE_ prefix
SUPABASE_URL=https://dbugchiwqwnrnnnsszel.supabase.co
```

### PASSO 3: Parar o servidor COMPLETAMENTE

1. No terminal onde o servidor está rodando, pressione `Ctrl+C`
2. **Aguarde** até ver a mensagem confirmando que parou
3. Se não parar, **feche o terminal completamente**
4. Abra um novo terminal

### PASSO 4: Limpar cache do Vite (opcional mas recomendado)

```bash
# Deletar pasta node_modules/.vite se existir
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue

# Ou no PowerShell:
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite"
    Write-Host "Cache do Vite limpo"
}
```

### PASSO 5: Reiniciar o servidor

```bash
npm run dev
```

**IMPORTANTE:** Aguarde o servidor iniciar completamente antes de testar!

### PASSO 6: Testar no navegador

1. Abra o app no navegador
2. Abra o Console do Desenvolvedor (F12)
3. Execute este comando no console:
   ```javascript
   console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
   console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurada' : 'NÃO configurada');
   ```

Se aparecer "NÃO configurada", o problema persiste. Continue para o PASSO 7.

### PASSO 7: Verificar encoding do arquivo

O arquivo `.env.local` deve estar em **UTF-8 sem BOM**.

**No Windows (PowerShell):**
```powershell
# Verificar encoding atual
Get-Content .env.local -Encoding Byte | Select-Object -First 3

# Recriar arquivo com UTF-8 correto
$content = @"
VITE_SUPABASE_URL=https://dbugchiwqwnrnnnsszel.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRidWdjaGl3cXducm5ubnNzemVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNDQ4NDYsImV4cCI6MjA3OTYyMDg0Nn0.X05KWOwapggPuo_Gkva_O01QSwJtgoE6YeMVGx5k9b4
"@
$content | Out-File -FilePath .env.local -Encoding utf8 -NoNewline
```

### PASSO 8: Verificar se está na raiz correta

Execute:
```powershell
Get-Location
```

Deve mostrar: `D:\FitCoach.IA`

Verifique se tanto `package.json` quanto `.env.local` estão nesta pasta:
```powershell
Test-Path package.json
Test-Path .env.local
```

Ambos devem retornar `True`.

## 🔍 Diagnóstico Avançado

Se ainda não funcionar, execute este script de diagnóstico:

```powershell
Write-Host "=== DIAGNÓSTICO COMPLETO ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Localização atual:" -ForegroundColor Yellow
Get-Location
Write-Host ""
Write-Host "2. Arquivos na raiz:" -ForegroundColor Yellow
Get-ChildItem -Filter "*.json" | Select-Object Name
Get-ChildItem -Filter ".env*" | Select-Object Name
Write-Host ""
Write-Host "3. Conteúdo do .env.local:" -ForegroundColor Yellow
if (Test-Path .env.local) {
    Get-Content .env.local
} else {
    Write-Host "   Arquivo não encontrado!" -ForegroundColor Red
}
Write-Host ""
Write-Host "4. Variáveis no processo:" -ForegroundColor Yellow
$env:VITE_SUPABASE_URL
$env:VITE_SUPABASE_ANON_KEY
```

## ⚠️ Problemas Comuns

### 1. Arquivo em subpasta
- ❌ `src/.env.local`
- ❌ `config/.env.local`
- ✅ `.env.local` (na raiz)

### 2. Nome do arquivo errado
- ❌ `.env.local.txt`
- ❌ `env.local`
- ❌ `.env`
- ✅ `.env.local`

### 3. Servidor não reiniciado
- ⚠️ O Vite só carrega variáveis na inicialização
- ⚠️ Modificar `.env.local` durante execução não funciona
- ✅ **SEMPRE reinicie após modificar**

### 4. Cache do navegador
- Limpe o cache (Ctrl+Shift+Delete)
- Ou use modo anônimo (Ctrl+Shift+N)

## ✅ Checklist Final

- [ ] Arquivo `.env.local` existe na raiz
- [ ] Arquivo contém `VITE_SUPABASE_URL` (com VITE_)
- [ ] Arquivo contém `VITE_SUPABASE_ANON_KEY` (com VITE_)
- [ ] Valores não têm espaços extras
- [ ] Valores não têm aspas
- [ ] Servidor foi parado completamente
- [ ] Servidor foi reiniciado
- [ ] Testou no console do navegador

## 🆘 Ainda com Problemas?

1. Tente criar o arquivo novamente do zero
2. Verifique se não há caracteres invisíveis
3. Tente usar outro editor (VS Code, Notepad++)
4. Verifique se o projeto está na pasta correta

