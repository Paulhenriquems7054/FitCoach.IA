# Solução Definitiva para GIFs no Vercel

## 🔍 Problema Identificado

Os GIFs não carregam no Vercel devido a:
1. **Case sensitivity**: Vercel usa Linux (case-sensitive), Windows/Mac não
2. **Codificação de URLs**: Acentos e espaços precisam ser codificados corretamente
3. **Estrutura de pastas**: Nomes com acentos, espaços e caracteres especiais causam problemas

## ✅ Solução Implementada

### 1. Codificação Correta de URLs

A função `encodeUrlPath` foi atualizada para codificar corretamente cada segmento do caminho usando `encodeURIComponent`:

```typescript
function encodeUrlPath(path: string): string {
  // Codifica cada segmento individualmente
  // Espaços → %20
  // Acentos → %C3%A1 (á), %C3%A9 (é), etc.
  // Parênteses → %28, %29
  const segments = path.split('/').filter(segment => segment.length > 0);
  const encodedSegments = segments.map(segment => encodeURIComponent(segment));
  return prefix + encodedSegments.join('/');
}
```

### 2. Configuração do Vercel

O `vercel.json` foi atualizado para:
- Excluir arquivos GIF das rewrites (servir como assets estáticos)
- Adicionar headers CORS para `/GIFS/` e `/gifs/`
- Configurar cache apropriado para GIFs

### 3. Script de Normalização (Opcional)

Foi criado um script `scripts/normalize-and-update-gifs.ps1` que pode:
- Renomear todas as pastas e arquivos para nomes normalizados (minúsculas, sem acentos, sem espaços)
- Gerar mapeamento de nomes antigos → novos
- Atualizar o código automaticamente

**⚠️ ATENÇÃO**: Este script renomeia arquivos físicos. Use com cuidado!

## 🚀 Próximos Passos

### Opção 1: Manter Nomes Atuais (Recomendado)

A solução atual deve funcionar com os nomes originais dos arquivos. A codificação correta deve resolver o problema.

**Testar:**
1. Fazer build: `npm run build`
2. Testar preview: `npm run preview`
3. Verificar se os GIFs carregam
4. Fazer deploy no Vercel
5. Verificar no console do navegador se há erros 404

### Opção 2: Normalizar Nomes (Solução Definitiva)

Se a Opção 1 não funcionar, normalizar todos os nomes:

1. **Executar script em modo dry-run:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\normalize-and-update-gifs.ps1 -DryRun
   ```

2. **Revisar o mapeamento gerado:**
   - Verificar `gif-normalization-mapping.json`
   - Confirmar que os nomes estão corretos

3. **Aplicar normalização:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\normalize-and-update-gifs.ps1
   ```

4. **Atualizar código:**
   - Atualizar `muscleGroupFolders` no `exerciseGifService.ts`
   - Atualizar `availableGifsByGroup` no `exerciseGifService.ts`
   - Usar os novos nomes normalizados

5. **Testar:**
   ```bash
   npm run build
   npm run preview
   ```

## 🔧 Diagnóstico

Se os GIFs ainda não carregarem:

1. **Verificar console do navegador:**
   - Procurar erros 404
   - Verificar o caminho exato que está sendo solicitado
   - Comparar com o caminho real do arquivo

2. **Verificar no Vercel:**
   - Acessar o arquivo diretamente: `https://seu-app.vercel.app/GIFS/...`
   - Verificar se o arquivo existe no deploy
   - Verificar se a codificação está correta

3. **Verificar case sensitivity:**
   - Vercel é case-sensitive
   - `/GIFS/` ≠ `/gifs/`
   - Garantir que o caminho no código corresponde exatamente ao nome da pasta

## 📝 Notas Importantes

- **Não renomear arquivos manualmente**: Use o script para garantir consistência
- **Fazer backup**: Antes de normalizar, fazer backup da pasta `public/GIFS`
- **Testar localmente**: Sempre testar com `npm run preview` antes de fazer deploy
- **Case sensitivity**: Vercel é Linux, então `/GIFS/` e `/gifs/` são diferentes

## ✅ Checklist

- [x] Função `encodeUrlPath` atualizada
- [x] `vercel.json` configurado corretamente
- [x] Script de normalização criado
- [ ] Build local testado
- [ ] Preview testado
- [ ] Deploy no Vercel testado
- [ ] GIFs carregando corretamente

