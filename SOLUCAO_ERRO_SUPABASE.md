# 🔴 SOLUÇÃO: Erro "Supabase não configurado"

## ⚠️ Erro Atual
```
Supabase não configurado. Verifique o arquivo .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
```

## ✅ Solução Passo a Passo

### PASSO 1: Verificar se o arquivo existe

Abra o terminal na raiz do projeto e execute:
```powershell
Test-Path .env.local
```

Se retornar `False`, o arquivo não existe. Vá para o PASSO 2.

### PASSO 2: Criar/Editar o arquivo `.env.local`

1. **Abra o arquivo `.env.local`** na raiz do projeto (mesmo nível do `package.json`)
   - Se não existir, crie um novo arquivo chamado `.env.local`

2. **Adicione ou verifique se contém estas linhas:**
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua_chave_anon_key_aqui
   ```

### PASSO 3: Obter Credenciais do Supabase

1. **Acesse:** https://app.supabase.com
2. **Faça login** na sua conta
3. **Selecione seu projeto** (ou crie um novo se não tiver)
4. **Vá em:** Settings → API (menu lateral esquerdo)
5. **Copie os seguintes valores:**

   **a) Project URL:**
   - Procure por "Project URL" ou "API URL"
   - Exemplo: `https://hflwyatppivyncocllnu.supabase.co`
   - Copie este valor completo

   **b) anon public key:**
   - Procure por "anon" ou "public" na seção "Project API keys"
   - É uma chave longa que começa com `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Copie esta chave completa

### PASSO 4: Preencher o arquivo `.env.local`

Substitua os valores de exemplo pelos valores reais:

**ANTES (exemplo):**
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_key_aqui
```

**DEPOIS (seus valores reais):**
```env
VITE_SUPABASE_URL=https://hflwyatppivyncocllnu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmbHd5YXRwcGl2eW5jb2xsbnUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5ODc2ODAwMCwiZXhwIjoyMDE0MzQ0MDAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### PASSO 5: Salvar e Reiniciar

1. **Salve o arquivo** `.env.local`
2. **Pare o servidor** (pressione `Ctrl+C` no terminal onde está rodando)
3. **Inicie novamente:**
   ```bash
   npm run dev
   ```

### PASSO 6: Testar

1. Abra o app no navegador
2. Tente inserir um código de convite (ex: `TESTE-FREE`)
3. Se não aparecer mais o erro, está funcionando! ✅

## 🔍 Verificação Rápida

Para verificar se as variáveis estão sendo carregadas, abra o console do navegador (F12) e execute:

```javascript
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurada' : 'NÃO configurada');
```

Se aparecer "NÃO configurada", o arquivo não está sendo lido corretamente.

## ⚠️ Problemas Comuns

### 1. Arquivo não está na raiz
- ✅ Certifique-se de que o arquivo está no mesmo nível do `package.json`
- ❌ Não coloque em subpastas

### 2. Variáveis com espaços ou aspas
- ✅ Correto: `VITE_SUPABASE_URL=https://projeto.supabase.co`
- ❌ Errado: `VITE_SUPABASE_URL = "https://projeto.supabase.co"`
- ❌ Errado: `VITE_SUPABASE_URL=https://projeto.supabase.co ` (espaço no final)

### 3. Variáveis não começam com VITE_
- ✅ Correto: `VITE_SUPABASE_URL`
- ❌ Errado: `SUPABASE_URL`

### 4. Servidor não foi reiniciado
- ⚠️ **SEMPRE reinicie o servidor** após criar/modificar `.env.local`
- O Vite só carrega variáveis de ambiente na inicialização

### 5. Arquivo com extensão errada
- ✅ Correto: `.env.local` (sem extensão)
- ❌ Errado: `.env.local.txt`
- ❌ Errado: `env.local`

## 📋 Checklist Final

- [ ] Arquivo `.env.local` existe na raiz do projeto
- [ ] Arquivo contém `VITE_SUPABASE_URL` (não `SUPABASE_URL`)
- [ ] Arquivo contém `VITE_SUPABASE_ANON_KEY` (não `SUPABASE_ANON_KEY`)
- [ ] Valores não são de exemplo (não contém "seu-projeto" ou "sua_chave")
- [ ] Valores não têm espaços extras ou aspas
- [ ] Servidor foi reiniciado após criar/modificar o arquivo
- [ ] Testou inserir um código de convite e não apareceu mais o erro

## 🆘 Ainda com Problemas?

1. Verifique se você tem um projeto no Supabase
2. Verifique se copiou a chave correta (anon public, não service_role)
3. Tente criar o arquivo novamente do zero
4. Verifique o console do navegador para mais detalhes do erro

## 📚 Documentação Adicional

- `docs/CONFIGURAR_SUPABASE.md` - Guia completo
- `GUIA_RAPIDO_ENV.md` - Guia rápido
- `env.example.txt` - Template de exemplo

