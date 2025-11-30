# 🔧 Configurar Supabase no Vercel

## ⚠️ Problema: Erro de Cupom em Produção

Se você está vendo o erro:
```
Error: Variáveis de ambiente do Supabase não configuradas. 
Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
```

Isso significa que as variáveis de ambiente do Supabase não estão configuradas no Vercel.

---

## ✅ Solução: Configurar Variáveis no Vercel

### Passo 1: Obter Credenciais do Supabase

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** key (chave longa)

### Passo 2: Adicionar Variáveis no Vercel

1. **Acesse o painel do Vercel:**
   - https://vercel.com
   - Faça login
   - Selecione seu projeto `fit-coach-ia`

2. **Vá em Settings:**
   - Clique em **Settings** no menu lateral
   - Clique em **Environment Variables**

3. **Adicione as variáveis:**

   **Variável 1:**
   - **Name:** `VITE_SUPABASE_URL`
   - **Value:** Cole a URL do projeto (ex: `https://xxxxx.supabase.co`)
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development

   **Variável 2:**
   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** Cole a chave `anon public`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development

4. **Salve:**
   - Clique em **Save** para cada variável

### Passo 3: Fazer Novo Deploy

Após adicionar as variáveis, você precisa fazer um novo deploy:

**Opção 1: Deploy Automático (se conectado ao Git)**
- Faça um commit e push para o repositório
- O Vercel fará deploy automático

**Opção 2: Deploy Manual**
```bash
vercel --prod
```

**Opção 3: Redeploy no Painel**
- Vá em **Deployments**
- Clique nos três pontos (⋯) do último deploy
- Selecione **Redeploy**
- Aguarde o build completar

---

## 🔍 Verificar se Está Funcionando

Após o deploy:

1. **Acesse:** https://fit-coach-ia.vercel.app/#/login
2. **Teste a validação de cupom:**
   - Clique em "Criar conta"
   - Digite um código de cupom
   - Clique em "Validar"
3. **Verifique o console:**
   - Abra DevTools (F12)
   - Não deve aparecer mais o erro de variáveis não configuradas

---

## 📋 Checklist de Configuração

- [ ] Variável `VITE_SUPABASE_URL` adicionada no Vercel
- [ ] Variável `VITE_SUPABASE_ANON_KEY` adicionada no Vercel
- [ ] Ambas marcadas para Production, Preview e Development
- [ ] Novo deploy realizado após adicionar as variáveis
- [ ] Teste de validação de cupom funcionando

---

## 🚨 Importante

### ⚠️ Variáveis de Ambiente no Vercel

- As variáveis são **injetadas durante o build**
- Se você adicionar variáveis **depois** de fazer deploy, precisa fazer **novo deploy**
- Variáveis adicionadas não afetam deploys anteriores

### 🔒 Segurança

- ✅ **Nunca** commite as chaves no código
- ✅ Use apenas variáveis de ambiente do Vercel
- ✅ A chave `anon public` é segura para uso no frontend

---

## 💡 Dica

Se você ainda estiver vendo o erro após configurar:

1. **Verifique se fez novo deploy** (variáveis só funcionam em novos builds)
2. **Confirme os nomes das variáveis** (devem ser exatamente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`)
3. **Verifique se não há espaços** nos valores
4. **Aguarde alguns minutos** após o deploy (cache do navegador)

---

## 📚 Referências

- [Documentação do Vercel - Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Documentação do Supabase - Getting Started](https://supabase.com/docs/guides/getting-started)

