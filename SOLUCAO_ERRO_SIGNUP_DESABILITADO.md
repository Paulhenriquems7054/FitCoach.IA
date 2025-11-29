# Solução: Erro "Email signups are disabled"

## 🔴 Problema

Ao tentar criar uma conta, ocorre o erro:
```
Email signups are disabled
```

E no console:
```
POST https://dbugchiwqwnrnnnsszel.supabase.co/auth/v1/signup 400 (Bad Request)
```

## 🔍 Causa

Os signups por email estão desabilitados nas configurações de autenticação do Supabase.

## ✅ Solução

### Passo 1: Habilitar Signups no Supabase

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Authentication** → **Settings** (ou **Providers**)
4. Procure por **"Email"** ou **"Email/Password"**
5. **Habilite** o provider de Email
6. Salve as alterações

### Passo 2: Verificar Configurações Adicionais

Enquanto estiver nas configurações de Auth, verifique:

1. **"Enable sign ups"**: Deve estar **habilitado** ✅
2. **"Enable email confirmations"**: 
   - Para **desenvolvimento**: Recomendado **desabilitar** ❌
   - Para **produção**: Pode estar habilitado ✅
3. **"Email provider"**: Deve estar **habilitado** ✅

### Passo 3: Verificar URL e Chaves

Certifique-se de que o arquivo `.env.local` está configurado corretamente:

```env
VITE_SUPABASE_URL=https://dbugchiwqwnrnnnsszel.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

### Passo 4: Testar Novamente

1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Recarregue a página (F5)
3. Insira o cupom `TESTE-FREE`
4. Preencha os dados e crie a conta
5. A conta deve ser criada com sucesso

## 📝 Passo a Passo Detalhado no Supabase

### Opção 1: Via Authentication → Providers

1. Acesse: https://app.supabase.com/project/seu-projeto
2. No menu lateral, clique em **Authentication**
3. Clique em **Providers** (ou **Settings**)
4. Procure por **"Email"** na lista de providers
5. Clique no toggle para **habilitar**
6. Se necessário, configure:
   - **"Enable sign ups"**: ✅ Habilitado
   - **"Confirm email"**: ❌ Desabilitado (para desenvolvimento)
7. Clique em **Save**

### Opção 2: Via Authentication → Settings

1. Acesse: https://app.supabase.com/project/seu-projeto
2. No menu lateral, clique em **Authentication**
3. Clique em **Settings**
4. Procure por **"Enable sign ups"**
5. Certifique-se de que está **habilitado** ✅
6. Procure por **"Email provider"** ou **"Email/Password"**
7. Certifique-se de que está **habilitado** ✅
8. Salve as alterações

## 🔧 Configurações Recomendadas para Desenvolvimento

Para facilitar o desenvolvimento, recomendo estas configurações:

- ✅ **Enable sign ups**: Habilitado
- ❌ **Enable email confirmations**: Desabilitado
- ✅ **Email provider**: Habilitado
- ✅ **Auto confirm users**: Habilitado (se disponível)

## ⚠️ Importante

### Para Produção

Se você planeja usar em produção:

1. **Habilite confirmação de email** para segurança
2. Configure templates de email personalizados
3. Configure domínio de email (se necessário)
4. Teste o fluxo completo de confirmação

### Para Desenvolvimento

**Recomendado desabilitar confirmação de email** para facilitar testes:
- Não precisa confirmar email manualmente
- Sessão é estabelecida imediatamente após signup
- Facilita testes e desenvolvimento

## 🧪 Verificação

Após habilitar os signups, você pode verificar:

1. Tente criar uma conta novamente
2. Se ainda houver erro, verifique:
   - Se as configurações foram salvas corretamente
   - Se o arquivo `.env.local` está correto
   - Se o servidor de desenvolvimento foi reiniciado

## 📚 Referências

- [Supabase Auth Settings](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase Email Provider](https://supabase.com/docs/guides/auth/auth-email)
- [Supabase Sign Up Configuration](https://supabase.com/docs/guides/auth/auth-signup)

## 🔍 Debug

Se ainda houver problemas após habilitar:

1. **Verifique o console do navegador** para erros adicionais
2. **Verifique as configurações do Supabase** novamente
3. **Teste com um email diferente** (pode ser que o email já esteja em uso)
4. **Verifique se há rate limiting** ativo

---

**Ação necessária**: Habilite os signups por email no painel do Supabase e teste novamente!

