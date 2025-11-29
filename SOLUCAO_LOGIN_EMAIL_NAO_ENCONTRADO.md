# Solução: Login não encontra email do usuário

## 🔴 Problema

Ao tentar fazer login com username `ph`, aparece:
```
Nome de usuário ou senha incorretos
```

Mas o usuário existe no Supabase:
- **ID**: `3197d46e-6a2c-4e2e-8714-b18e08c4f114`
- **Nome**: `PAULO HENRIQUE DE MORAIS SILVA`
- **Username**: `ph`

## 🔍 Causa

O problema é que o login precisa do **EMAIL** (não o username) para fazer login no Supabase Auth, mas:
1. O email não está na tabela `users` (está apenas em `auth.users`)
2. O código de login não está buscando o email do `auth.users` baseado no username

## ✅ Solução Implementada

O código foi atualizado para:

1. **Buscar email na tabela users primeiro**:
   - Tenta encontrar o usuário pelo username na tabela `users`
   - Se encontrar, verifica se tem email na tabela

2. **Tentar múltiplas variações de email**:
   - Email encontrado no banco (se disponível)
   - Username se parece com email (`@` presente)
   - `username@fitcoach.ia` (padrão usado no cadastro)
   - Username direto (última tentativa)

## 📝 Como Fazer Login

### Opção 1: Usar o Email do Cadastro

Se você forneceu email no cadastro, use esse email:
- ✅ **Correto**: `seuemail@exemplo.com`

### Opção 2: Usar Email Padrão

Se você não forneceu email no cadastro, o sistema criou automaticamente:
- Email: `ph@fitcoach.ia` (baseado no username)
- ✅ **Use**: `ph@fitcoach.ia`

### Opção 3: Verificar no Supabase

Execute este SQL no Supabase para ver o email usado:

```sql
-- Ver email do usuário no Auth
SELECT 
    id,
    email,
    created_at,
    confirmed_at
FROM auth.users
WHERE id = '3197d46e-6a2c-4e2e-8714-b18e08c4f114';
```

Ou para buscar por username:

```sql
-- Buscar email baseado no username
SELECT 
    u.id,
    u.username,
    u.nome,
    au.email
FROM public.users u
LEFT JOIN auth.users au ON au.id = u.id
WHERE u.username = 'ph';
```

## 🔧 Verificações

### 1. Verificar Email no Supabase Dashboard

1. Acesse: https://app.supabase.com
2. Vá em **Authentication** → **Users**
3. Procure pelo ID: `3197d46e-6a2c-4e2e-8714-b18e08c4f114`
4. Veja o **email** usado no cadastro
5. Use esse email para fazer login

### 2. Verificar se Email Foi Confirmado

```sql
-- Verificar status de confirmação
SELECT 
    id,
    email,
    confirmed_at,
    email_confirmed_at
FROM auth.users
WHERE id = '3197d46e-6a2c-4e2e-8714-b18e08c4f114';
```

Se `confirmed_at` for `NULL`, o email pode não ter sido confirmado.

## 🧪 Teste

1. **Tente fazer login com**: `ph@fitcoach.ia`
2. **Use a senha** que você criou no cadastro
3. **Se não funcionar**, verifique o email no Supabase Dashboard
4. **Use o email exato** que aparece no `auth.users`

## ⚠️ Importante

- **Use o EMAIL para login**, não o username
- **O email pode ser**: `ph@fitcoach.ia` (se não forneceu email) ou o email que você forneceu
- **Verifique no Supabase** qual email foi usado no cadastro
- **Se o email não foi confirmado**, pode ser necessário confirmar primeiro

## 📚 Arquivos Modificados

- `pages/LoginPage.tsx` - Busca email na tabela users antes de tentar login
- `SOLUCAO_LOGIN_EMAIL_NAO_ENCONTRADO.md` - Este guia

---

**Solução**: Tente fazer login com `ph@fitcoach.ia` (ou o email que você forneceu no cadastro). O sistema agora tenta buscar o email automaticamente, mas se não encontrar, use o padrão `username@fitcoach.ia`.

