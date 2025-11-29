# Solução: Rate Limit (429) ao Criar Conta

## 🔴 Problema

Ao tentar criar uma conta, aparece o erro:
```
AuthApiError: For security purposes, you can only request this after X seconds.
```

Ou:
```
Failed to load resource: the server responded with a status of 429 (Too Many Requests)
```

## 🔍 Causa

O **Supabase Auth** implementa um **rate limiting** (limite de requisições) para proteger contra:
- Spam de cadastros
- Ataques de força bruta
- Abuso do sistema

Quando você tenta criar muitas contas em pouco tempo, o Supabase bloqueia temporariamente novos cadastros.

## ✅ Solução

### Opção 1: Aguardar o Tempo Indicado

O erro mostra quantos segundos você precisa aguardar:
- **Exemplo**: "For security purposes, you can only request this after **7 seconds**"
- **Ação**: Aguarde **7 segundos** (ou o tempo indicado) antes de tentar novamente

### Opção 2: Verificar se Já Tem Conta

Se você já tentou criar uma conta antes:
1. **Tente fazer login** ao invés de criar uma nova conta
2. Use o **email** que você forneceu no cadastro
3. Se não forneceu email, use: `seuusuario@fitcoach.ia`

### Opção 3: Limpar Cache e Tentar Novamente

1. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
2. **Feche todas as abas** do aplicativo
3. **Aguarde 30 segundos**
4. **Abra uma nova aba** e tente novamente

## 📝 Como Evitar Rate Limit

### ✅ Boas Práticas

1. **Não tente criar múltiplas contas rapidamente**
   - Aguarde pelo menos 10 segundos entre tentativas
   
2. **Use dados válidos**
   - Email válido
   - Senha com pelo menos 6 caracteres
   - Nome de usuário único

3. **Verifique se já tem conta**
   - Antes de criar, tente fazer login
   - Use o email que você forneceu

4. **Não recarregue a página repetidamente**
   - Cada recarregamento pode disparar novas tentativas

## 🔧 Verificações

### 1. Verificar Contas Criadas

Execute este SQL no Supabase para ver se sua conta foi criada:

```sql
-- Ver usuários recentes no Auth
SELECT 
    id,
    email,
    created_at,
    confirmed_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
```

### 2. Verificar Perfis Criados

```sql
-- Ver perfis na tabela users
SELECT 
    id,
    nome,
    username,
    email,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;
```

### 3. Verificar Tentativas de Cadastro

Se você vê muitas contas criadas mas não consegue fazer login:
- Pode ser que o email não foi confirmado
- Pode ser que o perfil não foi criado corretamente
- Tente fazer login com o email usado no cadastro

## ⚠️ Importante

- **Rate limit é uma proteção de segurança** - não é um bug
- **Aguarde o tempo indicado** antes de tentar novamente
- **Use o email para login**, não o username
- **Se já tem conta, faça login** ao invés de criar nova

## 🧪 Teste Após Rate Limit

1. **Aguarde o tempo indicado** (ex: 7 segundos)
2. **Limpe o cache** (Ctrl+Shift+Delete)
3. **Recarregue a página** (F5)
4. **Tente criar a conta novamente** com dados válidos
5. **OU tente fazer login** se já criou a conta antes

## 📚 Arquivos Modificados

- `components/LoginOrRegister.tsx` - Mensagens de erro melhoradas para rate limit
- `index.tsx` - Suprimir warnings de Service Worker em desenvolvimento
- `SOLUCAO_RATE_LIMIT_SIGNUP.md` - Este guia

---

**Solução**: Aguarde o tempo indicado (ex: 7 segundos) antes de tentar criar a conta novamente. Se já tentou criar antes, tente fazer login ao invés de criar uma nova conta.

