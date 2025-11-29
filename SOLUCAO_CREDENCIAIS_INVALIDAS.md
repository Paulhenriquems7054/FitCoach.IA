# Solução: "Credenciais inválidas" ao fazer login

## 🔴 Problema

Ao tentar fazer login com email e senha, aparece:
```
Credenciais inválidas. Verifique seu email/username e senha.
Nome de usuário ou senha incorretos.
```

## 🔍 Possíveis Causas

1. **Email incorreto**: O email usado não é o mesmo do cadastro
2. **Senha incorreta**: A senha está errada
3. **Email não confirmado**: O email precisa ser confirmado antes de fazer login
4. **Usuário não existe no Auth**: O usuário foi criado apenas na tabela `users`, mas não no `auth.users`

## ✅ Soluções

### 1. Verificar Email Usado no Cadastro

Execute este SQL no Supabase SQL Editor:

```sql
-- Ver email do usuário no Auth
SELECT 
    id,
    email,
    created_at,
    confirmed_at,
    email_confirmed_at
FROM auth.users
WHERE id = '3197d46e-6a2c-4e2e-8714-b18e08c4f114';
```

**Use o email exato** que aparece no resultado.

### 2. Verificar se Email Foi Confirmado

Se `confirmed_at` ou `email_confirmed_at` for `NULL`, o email não foi confirmado.

**Solução**: 
- Verifique sua caixa de entrada (e spam)
- Procure por email do Supabase com link de confirmação
- Clique no link para confirmar o email
- Tente fazer login novamente

### 3. Verificar Senha

A senha deve ser **exatamente** a mesma que você usou no cadastro.

**Se esqueceu a senha**:
- Use a opção "Esqueci minha senha" na tela de login
- Ou redefina a senha no Supabase Dashboard

### 4. Verificar se Usuário Existe no Auth

```sql
-- Verificar se usuário existe no Auth
SELECT 
    id,
    email,
    created_at,
    confirmed_at
FROM auth.users
WHERE email = 'seuemail@exemplo.com';
```

Se não retornar nenhum resultado, o usuário não foi criado no Auth (apenas na tabela `users`).

**Solução**: 
- O usuário precisa ser criado novamente no Supabase Auth
- Ou fazer login usando o sistema local (IndexedDB) se disponível

## 🔧 Verificações no Supabase Dashboard

1. **Acesse**: https://app.supabase.com
2. **Vá em**: Authentication → Users
3. **Procure pelo ID**: `3197d46e-6a2c-4e2e-8714-b18e08c4f114`
4. **Verifique**:
   - ✅ Email está correto?
   - ✅ Email foi confirmado? (coluna "Confirmed")
   - ✅ Usuário foi criado? (data em "Created")

## 🧪 Teste Passo a Passo

### Passo 1: Verificar Email

```sql
SELECT email FROM auth.users WHERE id = '3197d46e-6a2c-4e2e-8714-b18e08c4f114';
```

### Passo 2: Tentar Login

1. Use o **email exato** do resultado acima
2. Use a **senha** que você criou no cadastro
3. Tente fazer login

### Passo 3: Se Falhar

1. Verifique se o email foi confirmado
2. Verifique se a senha está correta
3. Tente redefinir a senha se necessário

## ⚠️ Problemas Comuns

### Email Não Confirmado

**Sintoma**: Erro "Email not confirmed"

**Solução**:
1. Verifique sua caixa de entrada
2. Procure email do Supabase
3. Clique no link de confirmação
4. Tente fazer login novamente

### Email Incorreto

**Sintoma**: "Invalid login credentials"

**Solução**:
1. Verifique o email no Supabase Dashboard
2. Use o email **exato** (case-sensitive)
3. Não use espaços extras

### Senha Incorreta

**Sintoma**: "Invalid login credentials"

**Solução**:
1. Verifique se Caps Lock está ativado
2. Verifique se está digitando a senha correta
3. Use "Esqueci minha senha" para redefinir

## 📚 Arquivos Modificados

- `pages/LoginPage.tsx` - Melhor tratamento de erros de autenticação
- `SOLUCAO_CREDENCIAIS_INVALIDAS.md` - Este guia

---

**Solução**: Verifique o email no Supabase Dashboard e use o email exato para fazer login. Se o email não foi confirmado, confirme-o primeiro antes de tentar fazer login.

