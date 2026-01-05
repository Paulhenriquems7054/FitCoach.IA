# Normalização de GIFs para Vercel

## 🔍 Problema

O Vercel (Linux) não serve arquivos com acentos, mesmo quando codificados corretamente. Os logs mostram 404 para todos os GIFs com acentos nos nomes.

## ✅ Solução Implementada

Modificamos o código para normalizar automaticamente os caminhos em produção (Vercel), mas **os arquivos físicos ainda precisam ser renomeados** para corresponder aos caminhos normalizados.

## 🛠️ Como Normalizar os Arquivos

### Opção 1: Script Node.js (Recomendado)

```bash
# 1. Ver o que será feito (dry-run)
npm run normalize:gifs:dry

# 2. Aplicar a normalização
npm run normalize:gifs
```

### Opção 2: Script PowerShell

```powershell
# 1. Ver o que será feito (dry-run)
powershell -ExecutionPolicy Bypass -File .\scripts\normalize-gifs-simple.ps1 -DryRun

# 2. Aplicar a normalização
powershell -ExecutionPolicy Bypass -File .\scripts\normalize-gifs-simple.ps1
```

## 📝 O que o Script Faz

1. **Renomeia pastas**: `Abdômen (18)-20241202T155424Z-001` → `abdomen-18-20241202t155424z-001`
2. **Renomeia subpastas**: `Abdômen (18)` → `abdomen-18`
3. **Renomeia arquivos**: `Abdominais.gif` → `abdominais.gif`

## ⚠️ IMPORTANTE

Após normalizar os arquivos, você precisa:

1. **Atualizar `exerciseGifService.ts`** com os novos nomes normalizados
2. **Testar localmente**: `npm run build && npm run preview`
3. **Fazer commit e push** das alterações
4. **Verificar no Vercel** se os GIFs estão carregando

## 🔄 Processo Completo

```bash
# 1. Normalizar arquivos
npm run normalize:gifs

# 2. Atualizar código (manual ou automático)
# Editar muscleGroupFolders e availableGifsByGroup em exerciseGifService.ts

# 3. Testar build
npm run build
npm run preview

# 4. Commit e push
git add -A
git commit -m "fix: Normalizar nomes de arquivos GIF para Vercel"
git push origin main
```

## 📊 Exemplo de Normalização

**Antes:**
- `/GIFS/Abdômen (18)-20241202T155424Z-001/Abdômen (18)/Abdominais.gif`

**Depois:**
- `/gifs/abdomen-18-20241202t155424z-001/abdomen-18/abdominais.gif`

## 🚨 Nota

A normalização no código (`encodeUrlPath`) já está implementada, mas ela só funcionará se os arquivos físicos também forem renomeados para corresponder aos caminhos normalizados.

