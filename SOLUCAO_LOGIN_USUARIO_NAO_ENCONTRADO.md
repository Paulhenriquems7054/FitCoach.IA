# Solução: Login diz "Usuário não encontrado" após criar conta

## 🔴 Problema

Após criar a conta com sucesso, ao tentar fazer login aparece:
```
Usuário não encontrado
```

## 🔍 Causa

O problema ocorre porque:

1. **No cadastro**: O email usado no Supabase Auth é o email fornecido no formulário (ou `username@fitcoach.ia` se não foi fornecido)
2. **No login**: O usuário pode estar tentando usar o **username** ao invés do **email**
3. **Supabase Auth**: Requer o **email** para fazer login, não o username

## ✅ Solução Implementada

O código de login foi melhorado para tentar múltiplas estratégias:

### Estratégias de Login

1. **Se username parece email** (`@` presente): Usa diretamente
2. **Se username não tem @**: 
   - Tenta buscar usuário na tabela `users`
   - Tenta login com `username@fitcoach.ia` (padrão usado no cadastro)
   - Tenta login com username direto
   - Se não encontrar na tabela, ainda tenta login direto (pode ser que perfil ainda não foi criado)

### Melhorias Adicionais

- **Retry no perfil**: Se não encontrar o perfil imediatamente, aguarda 1 segundo e tenta novamente
- **Mensagens de erro mais claras**: Indica que deve usar o email correto
- **Logs detalhados**: Para debug

## 📝 Como Fazer Login Corretamente

### Opção 1: Usar o Email do Cadastro

Use o **email** que você forneceu no cadastro, não o username:

- ✅ **Correto**: `seuemail@exemplo.com`
- ❌ **Incorreto**: `seuusuario`

### Opção 2: Usar Email Padrão

Se você não forneceu email no cadastro, o sistema criou automaticamente:
- Email: `seuusuario@fitcoach.ia`
- Use este email para fazer login

### Opção 3: Verificar no Supabase

1. Acesse: https://app.supabase.com
2. Vá em **Authentication** → **Users**
3. Encontre seu usuário
4. Veja o **email** usado no cadastro
5. Use este email para fazer login

## 🔧 Verificações

### 1. Verificar Email Usado no Cadastro

Execute este SQL no Supabase para ver o email usado:

```sql
-- Ver usuários recentes e seus emails no Auth
SELECT 
    id,
    email,
    created_at,
    confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
```

### 2. Verificar Perfil na Tabela users

```sql
-- Ver perfis criados
SELECT 
    id,
    nome,
    username,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;
```

### 3. Verificar Vínculo

```sql
-- Ver vínculos com cupons
SELECT 
    ucl.id,
    ucl.user_id,
    ucl.coupon_id,
    u.nome,
    u.username,
    c.code
FROM public.user_coupon_links ucl
JOIN public.users u ON u.id = ucl.user_id
JOIN public.coupons c ON c.id = ucl.coupon_id
ORDER BY ucl.linked_at DESC
LIMIT 5;
```

## 🧪 Teste

1. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
2. **Recarregue a página** (F5)
3. **Tente fazer login usando o EMAIL** (não o username):
   - Se você forneceu email no cadastro: use esse email
   - Se não forneceu: use `seuusuario@fitcoach.ia`
4. **Use a senha** que você criou
5. O login deve funcionar

## ⚠️ Importante

- **Use o EMAIL para login**, não o username
- O email pode ser o que você forneceu ou `username@fitcoach.ia`
- Se ainda não funcionar, verifique no Supabase qual email foi usado

## 📚 Arquivos Modificados

- `components/LoginOrRegister.tsx` - Múltiplas estratégias de login e melhor tratamento de erros
- `SOLUCAO_LOGIN_USUARIO_NAO_ENCONTRADO.md` - Este guia

---

**Solução**: Use o **EMAIL** (não o username) para fazer login. Se não forneceu email no cadastro, use `seuusuario@fitcoach.ia`.


