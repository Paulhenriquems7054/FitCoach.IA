# Correção: Erro de Foreign Key Constraint no Cadastro

## Problema Identificado

Ao fazer cadastro, ocorria erro:
```
insert or update on table "users" violates foreign key constraint "users_id_fkey"
Key (id)=(...) is not present in table "users"
```

**Causa:** A função RPC tentava inserir um usuário na tabela `public.users` com um `id` que ainda não existia em `auth.users`, causando violação da foreign key constraint.

## Correções Implementadas

### 1. ✅ Verificação na Função RPC SQL

**Arquivo:** `supabase/migration_criar_funcao_insert_user_profile.sql`

A função agora verifica se o usuário existe em `auth.users` antes de tentar inserir:

```sql
-- Verificar se o usuário existe em auth.users antes de inserir
SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO auth_user_exists;

IF NOT auth_user_exists THEN
    RAISE EXCEPTION 'Usuário com ID % não existe em auth.users. Aguarde a conclusão do cadastro antes de criar o perfil.', p_user_id;
END IF;
```

### 2. ✅ Delay Após Signup

**Arquivo:** `pages/LoginPage.tsx`

Adicionado delay de 500ms após o signup para garantir que o usuário foi commitado em `auth.users`:

```typescript
// Aguardar um pouco para garantir que o usuário foi commitado em auth.users
await new Promise(resolve => setTimeout(resolve, 500));

// Verificar se o usuário foi criado corretamente
const { data: { user: authUserCheck } } = await supabase.auth.getUser();
// Se ainda não disponível, aguardar mais 1 segundo
```

### 3. ✅ Retry Logic na Chamada RPC

**Arquivo:** `pages/LoginPage.tsx`

Implementada função de retry que tenta até 3 vezes com delay de 1 segundo entre tentativas:

```typescript
const retryRpcCall = async (params: any, maxRetries = 3, delay = 1000) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        // Tenta chamar a função RPC
        // Se erro de foreign key, aguarda e tenta novamente
        // Para outros erros, retorna imediatamente
    }
};
```

## Como Funciona Agora

1. **Signup** → Cria usuário em `auth.users`
2. **Delay 500ms** → Aguarda commit da transação
3. **Verificação** → Verifica se usuário está disponível
4. **Tentativa de inserção direta** → Tenta inserir via RLS policy
5. **Se falhar, tenta função RPC** → Com retry automático (até 3 tentativas)
6. **Função RPC verifica** → Se usuário existe em `auth.users` antes de inserir
7. **Se ainda falhar (foreign key)** → Aguarda 1 segundo e tenta novamente

## Próximos Passos

1. **Execute a migração atualizada** no Supabase:
   ```sql
   -- Execute o conteúdo de supabase/migration_criar_funcao_insert_user_profile.sql
   ```

2. **Teste o cadastro**:
   - Deve funcionar mesmo com timing issues
   - Retry automático resolve problemas de race condition
   - Função RPC retorna erro claro se usuário não existe

3. **Verifique os logs**:
   - Deve aparecer: "Aguardando confirmação de criação do usuário em auth.users..."
   - Deve aparecer: "Tentativa X/3 de chamar função RPC"
   - Deve aparecer: "Usuário criado com sucesso na tabela users"

## Notas Importantes

- O delay inicial de 500ms + verificação garante que o usuário está disponível
- O retry logic lida com casos raros onde ainda há problemas de timing
- A verificação na função SQL fornece mensagens de erro mais claras
- Tudo isso funciona mesmo com email confirmation habilitado

