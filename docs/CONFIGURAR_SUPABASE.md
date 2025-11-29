# 🔧 Como Configurar o Supabase para o Sistema de Cupons

Este guia explica como configurar as variáveis de ambiente do Supabase necessárias para o sistema de cupons de acesso funcionar.

## ⚠️ Erro Comum

Se você receber o erro:
```
Variáveis de ambiente do Supabase não configuradas. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
```

Siga os passos abaixo para resolver.

## 📋 Passo a Passo

### 1. Obter Credenciais do Supabase

1. Acesse o painel do Supabase: https://app.supabase.com
2. Selecione seu projeto (ou crie um novo)
3. Vá em **Settings** → **API**
4. Copie as seguintes informações:
   - **Project URL** (ex: `https://hflwyatppivyncocllnu.supabase.co`)
   - **anon public** key (a chave pública, começa com `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 2. Criar Arquivo `.env.local`

Na raiz do projeto (mesmo nível do `package.json`), crie um arquivo chamado `.env.local` com o seguinte conteúdo:

```env
# API Key do Google Gemini
VITE_GEMINI_API_KEY=sua_chave_api_gemini_aqui

# Configuração do Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_key_aqui
```

**Exemplo real:**
```env
VITE_GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_SUPABASE_URL=https://hflwyatppivyncocllnu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmbHd5YXRwcGl2eW5jb2xsbnUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5ODc2ODAwMCwiZXhwIjoyMDE0MzQ0MDAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Reiniciar o Servidor

Após criar o arquivo `.env.local`:

1. Pare o servidor de desenvolvimento (pressione `Ctrl+C` no terminal)
2. Inicie novamente:
   ```bash
   npm run dev
   ```

### 4. Verificar se Funcionou

1. Abra o app no navegador
2. Tente inserir um código de convite (ex: `TESTE-FREE`)
3. Se não aparecer mais o erro, está configurado corretamente! ✅

## 🔍 Verificação Rápida

Para verificar se as variáveis estão sendo carregadas, você pode adicionar temporariamente no console do navegador:

```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurada' : 'Não configurada');
```

## ⚠️ Importante

- O arquivo `.env.local` **não deve** ser commitado no Git (já está no `.gitignore`)
- As variáveis devem começar com `VITE_` para serem expostas no frontend
- A chave `anon` é pública e segura para uso no frontend (protegida por RLS)
- Nunca compartilhe suas chaves de API publicamente

## 🆘 Problemas Comuns

### Erro persiste após criar `.env.local`

1. Verifique se o arquivo está na raiz do projeto (mesmo nível do `package.json`)
2. Verifique se as variáveis começam com `VITE_`
3. Verifique se não há espaços extras ou aspas desnecessárias
4. **Reinicie o servidor** após criar/modificar o arquivo

### Variáveis não são carregadas

1. Certifique-se de que o arquivo se chama exatamente `.env.local` (com o ponto no início)
2. No Windows, pode ser necessário criar via terminal:
   ```bash
   echo VITE_SUPABASE_URL=https://seu-projeto.supabase.co > .env.local
   ```

### Erro 404 ao validar cupom

1. Verifique se executou a migração SQL no Supabase:
   - `supabase/migration_criar_sistema_cupons_cakto.sql`
2. Verifique se criou os cupons de teste:
   - `supabase/cupons_teste_completos.sql`

## 📚 Documentação Adicional

- [Documentação do Supabase](https://supabase.com/docs)
- [Guia de Configuração do Supabase](./supabase/README.md)
- [Como Executar Migrações](./supabase/COMO_EXECUTAR_MIGRACAO.md)

## ✅ Checklist

- [ ] Projeto criado no Supabase
- [ ] Credenciais copiadas (URL e anon key)
- [ ] Arquivo `.env.local` criado na raiz
- [ ] Variáveis adicionadas ao `.env.local`
- [ ] Servidor reiniciado
- [ ] Migração SQL executada no Supabase
- [ ] Cupons de teste criados
- [ ] Teste com código `TESTE-FREE` funcionando

