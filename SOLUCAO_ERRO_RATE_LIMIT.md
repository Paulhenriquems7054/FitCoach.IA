# Solução: Erro "429 Too Many Requests" - Rate Limit do Supabase

## 🔴 Problema

Ao tentar criar uma conta, ocorre o erro:
```
429 Too Many Requests
For security purposes, you can only request this after 27 seconds.
```

## 🔍 Causa

O Supabase Auth tem um **rate limiting** (limite de taxa) para proteger contra spam e ataques. Quando você tenta criar muitas contas em um curto período, o Supabase bloqueia temporariamente as tentativas.

## ✅ Solução

### Solução Imediata

**Aguarde o tempo indicado** (27 segundos no seu caso) antes de tentar novamente.

### Soluções Permanentes

#### 1. Aguardar Entre Tentativas

- Não tente criar múltiplas contas rapidamente
- Aguarde pelo menos 30-60 segundos entre tentativas
- Use contas de teste diferentes se precisar testar múltiplas vezes

#### 2. Limpar Contas de Teste

Se você criou muitas contas de teste, pode deletá-las:

1. Acesse: https://app.supabase.com
2. Vá em **Authentication** → **Users**
3. Delete as contas de teste que não precisa mais

#### 3. Configurar Rate Limits (Plano Pago)

Se você tem um plano pago do Supabase, pode ajustar os rate limits:

1. Acesse: https://app.supabase.com
2. Vá em **Settings** → **API**
3. Ajuste os limites de rate limit (se disponível no seu plano)

## 📝 Mensagem de Erro Melhorada

O código foi atualizado para mostrar uma mensagem mais clara quando ocorre rate limit:

**Antes:**
```
Erro ao criar conta
```

**Depois:**
```
Muitas tentativas de cadastro. Por segurança, aguarde 27 segundos antes de tentar novamente.
```

## ⏱️ Tempos de Rate Limit Típicos

O Supabase geralmente aplica estes limites:

- **Signup**: ~1 tentativa por minuto por IP
- **Login**: ~5 tentativas por minuto por IP
- **Password Reset**: ~1 tentativa por hora por email

## 🔧 Como Evitar Rate Limits

1. **Use contas diferentes para testes**: Crie contas com emails diferentes
2. **Aguarde entre tentativas**: Não tente criar múltiplas contas rapidamente
3. **Limpe contas antigas**: Delete contas de teste que não precisa mais
4. **Use ambiente de desenvolvimento**: Configure um projeto separado para desenvolvimento

## 🧪 Teste Após Aguardar

1. **Aguarde o tempo indicado** (27 segundos no seu caso)
2. Limpe o cache do navegador (Ctrl+Shift+Delete)
3. Recarregue a página (F5)
4. Tente criar a conta novamente
5. A conta deve ser criada com sucesso

## 📚 Referências

- [Supabase Rate Limits](https://supabase.com/docs/guides/platform/rate-limits)
- [Supabase Auth Security](https://supabase.com/docs/guides/auth/auth-helpers/security)

## ⚠️ Importante

- **Rate limits são uma medida de segurança**: Eles protegem seu projeto contra spam e ataques
- **Não tente contornar**: Aguardar é a solução correta
- **Em produção**: Configure rate limits apropriados para seu caso de uso

---

**Ação necessária**: Aguarde 27 segundos e tente novamente. O rate limit é uma proteção de segurança do Supabase.

