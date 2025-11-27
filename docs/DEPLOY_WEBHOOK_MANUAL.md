# 📤 Deploy Manual do Webhook Cakto

## ⚠️ Problema com CLI

Se você recebeu erro de permissão ao tentar fazer deploy via CLI, você pode fazer o deploy manualmente pelo Dashboard do Supabase.

## 🚀 Método 1: Dashboard do Supabase (Recomendado)

### Passo 1: Acessar Dashboard

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto: `naywfhxyjlfzqhmcklzd`
3. Vá em **Edge Functions** no menu lateral

### Passo 2: Criar/Atualizar Função

1. Clique em **"Create a new function"** ou encontre `cakto-webhook`
2. Se já existe, clique em **"Edit"**
3. Cole o conteúdo do arquivo `supabase/functions/cakto-webhook/index.ts`

### Passo 3: Configurar Variáveis de Ambiente

1. Vá em **Project Settings > Edge Functions > Secrets**
2. Adicione/verifique as seguintes variáveis:

```
SUPABASE_URL=https://dbugchiwqwnrnnnsszel.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[sua service role key]
APP_URL=https://fit-coach-ia.vercel.app
CAKTO_WEBHOOK_SECRET=[seu secret do Cakto]
PLAN_BASIC_ID=[ID do plano basic]
PLAN_PREMIUM_ID=[ID do plano premium]
PLAN_ENTERPRISE_ID=[ID do plano enterprise]
```

### Passo 4: Deploy

1. Clique em **"Deploy"** ou **"Save"**
2. Aguarde o deploy completar

## 🔧 Método 2: Via CLI (Após Login)

### Passo 1: Fazer Login

```bash
cd D:\FitCoach.IA
supabase login
```

Siga as instruções para fazer login no navegador.

### Passo 2: Link do Projeto

```bash
supabase link --project-ref naywfhxyjlfzqhmcklzd
```

### Passo 3: Deploy

```bash
supabase functions deploy cakto-webhook
```

## 📋 Conteúdo do Arquivo para Copiar

O arquivo completo está em: `supabase/functions/cakto-webhook/index.ts`

**Importante**: Copie o conteúdo completo do arquivo, incluindo todas as funções auxiliares.

## ✅ Verificar Deploy

Após o deploy, teste o webhook:

1. Acesse: https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook
2. Deve retornar erro de método (esperado, pois precisa ser POST)
3. Verifique os logs em **Edge Functions > cakto-webhook > Logs**

## 🐛 Troubleshooting

### Erro 403 (Permissão)
- Use o Dashboard do Supabase
- Verifique se está logado com a conta correta
- Verifique se tem permissões de admin no projeto

### Erro de caminho
- Execute o comando a partir da raiz do projeto (`D:\FitCoach.IA`)
- Não execute de dentro do diretório `supabase`

### Função não encontrada
- Crie a função pelo Dashboard
- Nome: `cakto-webhook`
- Runtime: Deno

## 📝 Checklist

- [ ] Acessar Dashboard do Supabase
- [ ] Criar/editar função `cakto-webhook`
- [ ] Colar código do arquivo `index.ts`
- [ ] Configurar variáveis de ambiente
- [ ] Fazer deploy
- [ ] Testar webhook
- [ ] Verificar logs

