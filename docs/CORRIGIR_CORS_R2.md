# 🔧 Corrigir Configuração CORS no R2

## 🚨 Problema Identificado

A configuração CORS atual só permite `localhost:3000`, mas o app está rodando no Vercel:
- ❌ **CORS atual:** `http://localhost:3000`
- ✅ **Precisa:** `https://fit-coach-ia.vercel.app` (e outros domínios do Vercel)

---

## ✅ Solução: Atualizar Configuração CORS

### Passo 1: Acessar Configurações CORS

1. **Acesse o painel R2:**
   ```
   https://dash.cloudflare.com/d84975262bae332fdb2078c4d6966321/r2/default/buckets/fitcoach-gifs
   ```

2. **Vá em "Settings" → "CORS"**

### Passo 2: Atualizar Configuração

**Substitua a configuração atual por esta:**

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://fit-coach-ia.vercel.app",
      "https://*.vercel.app"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

### Passo 3: Salvar

1. **Clique em "Save" ou "Salvar"**
2. **Aguarde alguns segundos** para a configuração ser aplicada

---

## 🧪 Teste

Após salvar, teste no navegador:

```
https://pub-be71add17115442eb45d8f0c1308bb06.r2.dev/Abdomen/Abdominais.gif
```

**Resultado esperado:**
- ✅ GIF aparece (sem erro CORS no console)
- ❌ Ainda dá erro CORS → Aguarde mais alguns segundos ou verifique a configuração

---

## 📋 Explicação da Configuração

- **`AllowedOrigins`:** Domínios que podem acessar os arquivos
  - `localhost:3000` → Desenvolvimento local
  - `fit-coach-ia.vercel.app` → Produção
  - `*.vercel.app` → Todos os previews do Vercel

- **`AllowedMethods`:** Métodos HTTP permitidos
  - `GET` → Ler arquivos
  - `HEAD` → Verificar se arquivo existe

- **`AllowedHeaders`:** Headers permitidos
  - `*` → Todos (necessário para funcionar corretamente)

- **`ExposeHeaders`:** Headers que o navegador pode ler
  - Informações sobre o arquivo (tamanho, tipo, etc.)

---

## ⚠️ Alternativa: Permitir Todos os Origens (Desenvolvimento)

Se quiser permitir todos os domínios (útil para testes, mas menos seguro):

```json
[
  {
    "AllowedOrigins": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

⚠️ **Nota:** Usar `"*"` é menos seguro, mas funciona para qualquer domínio. Use apenas para desenvolvimento/testes.

---

## ✅ Após Configurar CORS

1. **Teste uma URL direta no navegador**
2. **Verifique se não há mais erro CORS no console**
3. **Teste o app no Vercel** - os GIFs devem carregar agora!

---

**Configure o CORS agora e me informe se resolveu!** 🔧

