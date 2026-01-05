# Diagnóstico: GIF não disponível - Peitoral

## 🔍 Problema Reportado

```
GIF não disponível
/GIFS/Peitoral%20(67)-20241202T175211Z-001/Peitoral%20(67)/Supino.gif
```

## ✅ Verificações Realizadas

1. **Arquivo existe localmente**: ✅
   - Caminho: `public/GIFS/Peitoral (67)-20241202T175211Z-001/Peitoral (67)/Supino.gif`
   - Nome do arquivo: `Supino.gif`

2. **Caminho gerado pelo código**: ✅
   - Caminho raw: `/GIFS/Peitoral (67)-20241202T175211Z-001/Peitoral (67)/Supino.gif`
   - Caminho codificado: `/GIFS/Peitoral%20(67)-20241202T175211Z-001/Peitoral%20(67)/Supino.gif`

3. **Mapeamento no código**: ✅
   - `muscleGroupFolders['supino']` → `'Peitoral (67)-20241202T175211Z-001/Peitoral (67)'`
   - `availableGifsByGroup` contém `'Supino.gif'`

## 🔧 Soluções Implementadas

### 1. Logs de Debug em Produção
- Adicionados logs detalhados em `encodeUrlPath` para diagnóstico no Vercel
- Logs incluem caminho original, codificado, segmentos e ambiente

### 2. GifLoader Melhorado
- Tenta automaticamente variações do caminho quando há erro:
  - `/GIFS/` → `/gifs/` (minúsculas)
  - Decodificar e recodificar
  - Caminho sem codificação
- Verifica se o arquivo existe antes de tentar carregar (usando HEAD request)

### 3. Configuração Vercel
- Adicionado `cleanUrls: false` para evitar problemas com URLs
- Headers configurados para `/GIFS/` e `/gifs/`

## 🚀 Próximos Passos para Diagnóstico

### 1. Verificar Console do Navegador
Após o deploy no Vercel, verificar:
- Logs de `[encodeUrlPath]` mostrando o caminho gerado
- Logs de `[GifLoader]` mostrando tentativas de variações
- Erros 404 ou outros erros de rede

### 2. Verificar se Arquivo Existe no Deploy
Acessar diretamente no navegador:
```
https://seu-app.vercel.app/GIFS/Peitoral%20(67)-20241202T175211Z-001/Peitoral%20(67)/Supino.gif
```

Se retornar 404, o arquivo não está sendo copiado para o build.

### 3. Verificar Build Local
```bash
npm run build
npm run preview
```

Acessar:
```
http://localhost:4173/GIFS/Peitoral%20(67)-20241202T175211Z-001/Peitoral%20(67)/Supino.gif
```

Se funcionar localmente mas não no Vercel, o problema é específico do Vercel.

### 4. Verificar Estrutura do Build
Verificar se a pasta `GIFS` está em `dist/GIFS` após o build:
```bash
ls -la dist/GIFS
```

## 🔍 Possíveis Causas

### 1. Arquivo não está sendo copiado para o build
**Solução**: Verificar se `public/GIFS` está sendo copiado corretamente pelo Vite

### 2. Case sensitivity no Vercel
**Solução**: O GifLoader agora tenta `/gifs/` automaticamente

### 3. Codificação de URL incorreta
**Solução**: O `encodeUrlPath` codifica cada segmento corretamente

### 4. Vercel não serve arquivos com espaços
**Solução**: Se necessário, normalizar nomes de arquivos (usar script `normalize-and-update-gifs.ps1`)

## 📝 Checklist de Diagnóstico

- [ ] Verificar console do navegador no Vercel
- [ ] Tentar acessar arquivo diretamente via URL
- [ ] Verificar se arquivo existe em `dist/GIFS` após build
- [ ] Testar build local com `npm run preview`
- [ ] Verificar logs de `[encodeUrlPath]` e `[GifLoader]`
- [ ] Se necessário, normalizar nomes de arquivos

## 🛠️ Solução Alternativa: Normalizar Nomes

Se o problema persistir, a solução definitiva é normalizar todos os nomes:

```powershell
# 1. Testar primeiro (dry-run)
powershell -ExecutionPolicy Bypass -File .\scripts\normalize-and-update-gifs.ps1 -DryRun

# 2. Aplicar normalização
powershell -ExecutionPolicy Bypass -File .\scripts\normalize-and-update-gifs.ps1

# 3. Atualizar código com novos nomes
# 4. Testar build e preview
npm run build
npm run preview
```

Isso renomeará:
- `Peitoral (67)-20241202T175211Z-001` → `peitoral-67-20241202t175211z-001`
- `Peitoral (67)` → `peitoral-67`
- `Supino.gif` → `supino.gif`

Resultado: `/gifs/peitoral-67-20241202t175211z-001/peitoral-67/supino.gif`

