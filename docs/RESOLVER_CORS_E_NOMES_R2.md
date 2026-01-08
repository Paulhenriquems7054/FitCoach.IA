# 🔧 Resolver Problemas CORS e Nomes de Arquivos no R2

## 🚨 Problemas Identificados

### Problema 1: Erro CORS
```
Access to fetch at 'https://pub-be71add17115442eb45d8f0c1308bb06.r2.dev/...' 
from origin 'https://fit-coach-ia.vercel.app' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present
```

### Problema 2: Nomes de Arquivos Diferentes
- **Código busca:** `flexao-de-pulso-neutra-sentado-com-halteres.gif` (normalizado)
- **R2 tem:** `Flexão de Pulso Neutra Sentado com Halteres.gif` (com espaços/acentos)
- **Resultado:** 404 Not Found

---

## 🔧 Solução 1: Configurar CORS no R2

### Passo a Passo:

1. **Acesse o painel R2:**
   ```
   https://dash.cloudflare.com/d84975262bae332fdb2078c4d6966321/r2/default/buckets/fitcoach-gifs
   ```

2. **Vá em "Settings" → "CORS"**

3. **Adicione esta configuração CORS:**
   ```json
   [
     {
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

4. **OU use esta configuração mais específica:**
   ```json
   [
     {
       "AllowedOrigins": [
         "https://fit-coach-ia.vercel.app",
         "https://*.vercel.app"
       ],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

5. **Salve a configuração**

---

## 🔧 Solução 2: Verificar Nomes Reais dos Arquivos

### Passo 1: Ver Nomes no Painel R2

1. **No painel R2, clique na pasta `Antebraco/`**
2. **Veja os nomes exatos dos arquivos**
3. **Copie alguns nomes**, por exemplo:
   - Primeiro arquivo: `_____________`
   - Segundo arquivo: `_____________`
   - Terceiro arquivo: `_____________`

### Passo 2: Comparar com Código

Verifique se os nomes no painel R2 correspondem aos nomes na lista `availableGifsByGroup` em `services/exerciseGifService.ts`.

**Exemplo:**
- **R2 tem:** `Flexão de Pulso Neutra Sentado com Halteres.gif`
- **Código tem:** `flexao-de-pulso-neutra-sentado-com-halteres.gif`
- **Resultado:** ❌ Não correspondem → Precisa atualizar

---

## 🔧 Solução 3: Atualizar Lista com Nomes Corretos

Se os nomes forem diferentes, precisamos atualizar a lista `availableGifsByGroup` com os nomes reais que estão no R2.

### Opção A: Atualizar Manualmente

1. **Verificar todos os nomes no R2**
2. **Atualizar `availableGifsByGroup` em `services/exerciseGifService.ts`**
3. **Usar os nomes exatos do R2**

### Opção B: Usar Script para Gerar Lista

Podemos criar um script que lista os arquivos do R2 e gera a lista automaticamente.

---

## 🧪 Teste Rápido

### Teste 1: Verificar CORS

Após configurar CORS, teste uma URL direta:

```
https://pub-be71add17115442eb45d8f0c1308bb06.r2.dev/Abdomen/Abdominais.gif
```

**Resultado esperado:**
- ✅ GIF aparece (sem erro CORS no console)
- ❌ Ainda dá erro CORS → Verificar configuração

### Teste 2: Verificar Nome Real

No painel R2, copie o nome exato de um arquivo em `Antebraco/` e teste:

```
https://pub-be71add17115442eb45d8f0c1308bb06.r2.dev/Antebraco/[NOME_EXATO]
```

**Exemplo:** Se o arquivo se chama `Flexão de Pulso.gif`:
```
https://pub-be71add17115442eb45d8f0c1308bb06.r2.dev/Antebraco/Flexão%20de%20Pulso.gif
```

---

## 📋 Checklist

- [ ] CORS configurado no R2 (Settings → CORS)
- [ ] Testei URL direta (sem erro CORS)
- [ ] Verifiquei nomes dos arquivos no painel R2
- [ ] Comparei com nomes no código
- [ ] Atualizei lista se necessário

---

## 🎯 Próximo Passo Imediato

**Por favor, faça:**

1. **Configurar CORS no R2** (Solução 1 acima)
2. **No painel R2, entre na pasta `Antebraco/` e me informe:**
   - Quais são os nomes exatos de 3-5 arquivos que você vê lá?
   - Exemplo: `Flexão de Pulso.gif`, `Antebracos.gif`, etc.

Com essas informações, atualizo a lista com os nomes corretos!

---

**O problema de CORS é crítico e precisa ser resolvido primeiro!** 🔧

