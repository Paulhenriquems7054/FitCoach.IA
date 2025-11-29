# Solução: Erro "new row violates row-level security policy for table 'users'"

## 🔴 Problema

Ao tentar criar uma conta após inserir o cupom, ocorre o erro:
```
new row violates row-level security policy for table "users"
```

E também:
- `401 Unauthorized` ao acessar `/rest/v1/users?select=*`
- `403 Forbidden` ao tentar deletar usuário via admin API
- `429 Too Many Requests` (rate limit do Supabase Auth)

## 🔍 Causa

A política RLS de INSERT está bloqueando a criação do perfil do usuário. Isso pode acontecer por:

1. **Timing**: O usuário foi criado no Auth, mas a sessão ainda não está estabelecida quando tenta inserir na tabela `users`
2. **Política RLS**: A política `WITH CHECK (auth.uid() = id)` pode não estar funcionando corretamente no momento da inserção
3. **Sessão não autenticada**: O cliente Supabase pode não estar usando a sessão correta após o signup

## ✅ Solução

### Passo 1: Executar a migração SQL no Supabase

1. Acesse: https://app.supabase.com
2. Vá em **SQL Editor**
3. Execute o arquivo: `supabase/migration_corrigir_politica_insert_users.sql`

Ou copie e cole este SQL diretamente:

```sql
-- Remover política de INSERT atual
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Recriar política de INSERT
CREATE POLICY "Users can insert own profile"
    ON public.users FOR INSERT
    WITH CHECK (
        -- Permitir se o id corresponde ao usuário autenticado
        auth.uid() = id
    );
```

### Passo 2: Verificar se a migração anterior foi executada

Certifique-se de que você executou a migração `migration_corrigir_rls_recursao.sql` primeiro, pois ela também afeta as políticas.

### Passo 3: Aguardar o rate limit (se necessário)

Se você recebeu o erro `429 Too Many Requests`, aguarde 39 segundos antes de tentar novamente. O Supabase limita tentativas de signup para evitar spam.

### Passo 4: Testar novamente

1. Recarregue a página no navegador (F5)
2. Insira o cupom `TESTE-FREE`
3. Preencha os dados para criar a conta
4. O erro não deve mais aparecer

## 📝 Ajustes no Código

O código foi ajustado para:

1. **Aguardar um pouco após signup**: Adiciona um pequeno delay (100ms) para garantir que a sessão está estabelecida
2. **Garantir que o ID está definido**: Verifica se o `id` está presente no objeto antes de inserir
3. **Remover tentativa de deletar via admin API**: A chave `anon` não tem permissão para usar a API admin, então removemos essa tentativa

## ⚠️ Problemas Adicionais Identificados

### 1. Rate Limit (429)
O Supabase Auth tem rate limiting. Se você tentar criar muitas contas rapidamente, receberá este erro. **Solução**: Aguarde o tempo indicado (39 segundos no seu caso).

### 2. Admin API (403)
O código estava tentando usar `supabase.auth.admin.deleteUser()`, mas isso requer a chave `service_role`, não a chave `anon`. **Solução**: Removemos essa tentativa do código, pois não funciona com a chave pública.

### 3. Service Worker Warning
O aviso sobre service workers em desenvolvimento é normal e pode ser ignorado. É apenas um aviso informativo.

## 🔧 Arquivos Modificados

- `services/supabaseService.ts` - Ajustado para aguardar sessão e garantir ID
- `supabase/migration_corrigir_politica_insert_users.sql` - Nova migração para corrigir política
- `SOLUCAO_ERRO_RLS_INSERT.md` - Este guia

## 🧪 Teste Completo

Após executar as migrações:

1. ✅ Limpe o cache do navegador (Ctrl+Shift+Delete)
2. ✅ Recarregue a página (F5)
3. ✅ Insira o cupom `TESTE-FREE`
4. ✅ Preencha os dados:
   - Nome: Teste
   - Email: teste@exemplo.com
   - Senha: senha123
   - Confirmação de senha: senha123
5. ✅ Clique em "Criar Conta"
6. ✅ A conta deve ser criada com sucesso

## 📚 Referências

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Rate Limits](https://supabase.com/docs/guides/auth/rate-limits)
- [Supabase Admin API](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser)

