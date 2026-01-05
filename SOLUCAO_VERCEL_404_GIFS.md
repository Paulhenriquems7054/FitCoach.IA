# Solução para 404 nos GIFs no Vercel

## 🔍 Problema Identificado

Os logs mostram que o Vercel está retornando 404 para os GIFs:
- `/gifs/Abd%C3%B4men%20(18)-20241202T155424Z-001/Abd%C3%B4men%20(18)/Abdominais.gif` → 404
- `/GIFS/Abdômen%20%2818%29-20241202T155424Z-001/Abdômen%20%2818%29/Abdominais.gif` → 404

## ✅ Verificações Realizadas

1. **Arquivos estão no build**: ✅
   - `dist/GIFS/Abdômen (18)-20241202T155424Z-001/Abdômen (18)/Abdominais.gif` existe

2. **Vercel.json configurado**: ✅
   - Rewrites excluem arquivos GIF
   - Headers configurados para `/GIFS/` e `/gifs/`

## 🔧 Soluções Implementadas

### 1. GifLoader Melhorado
- Tenta 6 variações diferentes do caminho automaticamente:
  1. Caminho completamente decodificado com `/GIFS/`
  2. Caminho completamente decodificado com `/gifs/`
  3. Caminho original codificado com `/gifs/`
  4. Recodificação mínima (apenas espaços e parênteses)
  5. Recodificação completa (encodeURIComponent em cada segmento)
  6. Todas as variações acima com `/gifs/` minúsculas

### 2. Logs Detalhados
- Logs mostram cada caminho testado
- Status de cada tentativa (✅ ou ❌)
- Informações de diagnóstico completas

## 🚨 Problema Real

O Vercel (Linux) é **case-sensitive** e pode não servir arquivos com **acentos** mesmo quando codificados corretamente.

## 🛠️ Solução Definitiva: Normalizar Nomes

A única solução garantida é normalizar todos os nomes de arquivos e pastas:

```powershell
# 1. Testar primeiro (dry-run)
powershell -ExecutionPolicy Bypass -File .\scripts\normalize-and-update-gifs.ps1 -DryRun

# 2. Se estiver OK, aplicar
powershell -ExecutionPolicy Bypass -File .\scripts\normalize-and-update-gifs.ps1

# 3. Atualizar o código com os novos nomes
# 4. Testar build e preview
npm run build
npm run preview
```

Isso renomeará:
- `Abdômen (18)-20241202T155424Z-001` → `abdomen-18-20241202t155424z-001`
- `Abdômen (18)` → `abdomen-18`
- `Abdominais.gif` → `abdominais.gif`

Resultado: `/gifs/abdomen-18-20241202t155424z-001/abdomen-18/abdominais.gif`

## 📝 Próximos Passos

1. **Verificar logs no console do navegador** após o deploy
2. **Se todas as variações falharem**, executar o script de normalização
3. **Atualizar o código** com os novos nomes normalizados
4. **Testar novamente** no Vercel

## ⚠️ Nota Importante

O problema não é com a codificação, mas sim com o Vercel não servir arquivos com acentos. A normalização é a única solução garantida.

