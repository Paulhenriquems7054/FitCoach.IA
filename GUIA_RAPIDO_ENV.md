# 🚀 Guia Rápido: Criar arquivo .env.local

## ⚠️ Erro Atual
```
Supabase não configurado. Verifique o arquivo .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
```

## ✅ Solução Rápida

### Opção 1: Usar Script Automático (Recomendado)

1. Execute o script PowerShell:
   ```powershell
   .\criar-env-local.ps1
   ```

2. Preencha as informações quando solicitado

3. Reinicie o servidor:
   ```bash
   # Pare o servidor (Ctrl+C)
   npm run dev
   ```

### Opção 2: Criar Manualmente

1. **Crie o arquivo `.env.local`** na raiz do projeto (mesmo nível do `package.json`)

2. **Adicione o seguinte conteúdo:**

```env
# API Key do Google Gemini
VITE_GEMINI_API_KEY=sua_chave_api_gemini_aqui

# Configuração do Supabase (OBRIGATÓRIO)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_key_aqui
```

3. **Obtenha as credenciais do Supabase:**

   - Acesse: https://app.supabase.com
   - Selecione seu projeto
   - Vá em **Settings** → **API**
   - Copie:
     - **Project URL** → use em `VITE_SUPABASE_URL`
     - **anon public** key → use em `VITE_SUPABASE_ANON_KEY`

4. **Substitua os valores** no arquivo `.env.local`

5. **Reinicie o servidor:**
   ```bash
   # Pare o servidor (Ctrl+C)
   npm run dev
   ```

## 📋 Exemplo Completo

```env
VITE_GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_SUPABASE_URL=https://hflwyatppivyncocllnu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmbHd5YXRwcGl2eW5jb2xsbnUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5ODc2ODAwMCwiZXhwIjoyMDE0MzQ0MDAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## ⚠️ Importante

- ✅ O arquivo deve se chamar exatamente `.env.local` (com o ponto no início)
- ✅ As variáveis devem começar com `VITE_`
- ✅ **Sempre reinicie o servidor** após criar/modificar o arquivo
- ✅ O arquivo `.env.local` não deve ser commitado no Git (já está no `.gitignore`)

## 🔍 Verificar se Funcionou

1. Reinicie o servidor
2. Abra o app no navegador
3. Tente inserir um código de convite (ex: `TESTE-FREE`)
4. Se não aparecer mais o erro, está configurado! ✅

## 📚 Documentação Completa

Para mais detalhes, veja:
- `docs/CONFIGURAR_SUPABASE.md` - Guia completo
- `env.example.txt` - Template de exemplo

## 🆘 Ainda com Problemas?

1. Verifique se o arquivo está na raiz do projeto
2. Verifique se não há espaços extras nas variáveis
3. Verifique se as variáveis começam com `VITE_`
4. Certifique-se de que reiniciou o servidor
5. Verifique o console do navegador para mais detalhes do erro

