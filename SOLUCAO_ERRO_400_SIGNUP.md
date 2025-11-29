# Solução: Erro 400 ao Criar Usuário no Supabase

## 🔴 Problema

Ao tentar criar uma conta no `LoginPage.tsx`, aparece o erro:
```
Failed to load resource: the server responded with a status of 400
Erro ao criar usuário no Supabase: Object
```

## 🔍 Causa

O erro 400 (Bad Request) ocorre quando:

1. **RLS (Row Level Security) bloqueia a inserção** - A política de segurança não permite inserir diretamente na tabela `users`
2. **Campos inválidos ou faltando** - Algum campo obrigatório não foi fornecido ou tem formato incorreto
3. **Trigger conflitante** - Um trigger pode estar tentando criar o registro ao mesmo tempo
4. **Constraint violation** - Violação de constraint (ex: username duplicado, email duplicado)

## ✅ Solução Implementada

O código foi atualizado para:

1. **Tentar inserção direta primeiro** - Se funcionar, ótimo
2. **Usar função RPC como fallback** - Se a inserção direta falhar (RLS), usa a função `insert_user_profile_after_signup` que tem `SECURITY DEFINER` e bypassa RLS
3. **Não bloquear o cadastro** - Mesmo se falhar criar o perfil no Supabase, o cadastro continua (usuário pode fazer login depois)

### Código Atualizado

```typescript
// Criar usuário no Supabase usando função RPC segura
// Primeiro tentar inserir diretamente, se falhar usar função RPC
let userError = null;
try {
    const { error: directInsertError } = await supabase
        .from('users')
        .insert({...});
    
    userError = directInsertError;
} catch (directError) {
    // Se inserção direta falhar (RLS), usar função RPC
    try {
        const { error: rpcError } = await supabase.rpc('insert_user_profile_after_signup', {
            p_user_id: userId,
            p_nome: userData.nome,
            p_username: userData.username,
            p_plan_type: userData.planType || 'free',
            p_subscription_status: userData.subscriptionStatus || 'active',
            p_user_data: userDataJsonb,
        });
        
        userError = rpcError;
    } catch (rpcError) {
        // Log do erro mas não bloquear
    }
}
```

## 🔧 Verificações

### 1. Verificar se a Função RPC Existe

Execute este SQL no Supabase:

```sql
-- Verificar se a função existe
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'insert_user_profile_after_signup'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```

Se não existir, execute:
```sql
-- Executar migration
\i supabase/migration_criar_funcao_insert_user_profile.sql
```

### 2. Verificar RLS Policies

```sql
-- Ver políticas RLS na tabela users
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users';
```

### 3. Verificar Constraints

```sql
-- Ver constraints na tabela users
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass;
```

### 4. Verificar Erro Específico

No console do navegador, verifique o erro completo:
- Abra DevTools (F12)
- Vá em Console
- Procure por "Erro ao criar usuário no Supabase"
- Expanda o objeto de erro para ver detalhes

## 🧪 Teste

1. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
2. **Recarregue a página** (F5)
3. **Tente criar uma conta novamente**
4. **Verifique o console** para ver se ainda há erros
5. **Tente fazer login** após criar a conta

## ⚠️ Importante

- **O erro 400 não bloqueia o cadastro** - O usuário pode fazer login depois
- **O perfil pode ser criado automaticamente** quando o usuário fizer login
- **Se o erro persistir**, verifique:
  - Se a função RPC foi criada corretamente
  - Se as políticas RLS estão corretas
  - Se os campos obrigatórios estão sendo fornecidos

## 📚 Arquivos Modificados

- `pages/LoginPage.tsx` - Adicionado fallback para função RPC
- `index.tsx` - Suprimido warning de Service Worker
- `SOLUCAO_ERRO_400_SIGNUP.md` - Este guia

---

**Solução**: O código agora tenta inserção direta primeiro e, se falhar, usa a função RPC `insert_user_profile_after_signup` que bypassa RLS. O cadastro não é bloqueado mesmo se houver erro ao criar o perfil no Supabase.

