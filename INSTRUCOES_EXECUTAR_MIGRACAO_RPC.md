# ⚠️ IMPORTANTE: Executar Migração da Função RPC

## Problema Atual

O cadastro está falhando com erro 400 na função RPC porque a migração **NÃO FOI EXECUTADA** no Supabase ainda.

## Solução

**Você PRECISA executar a migração atualizada no Supabase:**

### Passo 1: Acessar SQL Editor do Supabase

1. Acesse o dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)

### Passo 2: Executar a Migração

1. Copie TODO o conteúdo do arquivo:
   ```
   supabase/migration_criar_funcao_insert_user_profile.sql
   ```

2. Cole no SQL Editor do Supabase

3. Clique em **RUN** (ou pressione Ctrl+Enter)

4. Deve aparecer: "Success. No rows returned"

### Passo 3: Verificar se Funcionou

Execute este script SQL para verificar:

```sql
-- Verificar se a função foi criada corretamente
SELECT 
    proname,
    pg_get_function_arguments(oid) as arguments,
    prosecdef as has_security_definer
FROM pg_proc 
WHERE proname = 'insert_user_profile_after_signup'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```

Deve retornar a função com `has_security_definer: true` e os argumentos corretos.

```sql
-- Verificar se os GRANTs foram aplicados
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.routine_privileges 
WHERE routine_schema = 'public' 
AND routine_name = 'insert_user_profile_after_signup';
```

Deve retornar `authenticated` e `anon` com privilégio `EXECUTE`.

## O que a Migração Faz

1. **Remove versões antigas** da função (evita conflitos)
2. **Cria função atualizada** com verificação de usuário em auth.users
3. **Adiciona GRANTs** para `authenticated` e `anon` executarem
4. **Valida criação** da função

## Após Executar

Após executar a migração, teste o cadastro novamente. O erro 400 deve desaparecer e o cadastro deve funcionar.

## Troubleshooting

### Se aparecer erro "function name is not unique"
- Isso significa que há múltiplas versões da função
- O script de migração já remove todas as versões, mas se falhar:
  ```sql
  -- Remover todas as versões manualmente
  DO $$ 
  DECLARE func_sig TEXT;
  BEGIN
    FOR func_sig IN 
      SELECT pg_get_function_identity_arguments(oid)
      FROM pg_proc 
      WHERE proname = 'insert_user_profile_after_signup'
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
      EXECUTE format('DROP FUNCTION IF EXISTS public.insert_user_profile_after_signup(%s) CASCADE', func_sig);
    END LOOP;
  END $$;
  ```
  Depois execute a migração novamente.

### Se aparecer erro de permissão
- Verifique se você tem permissões de administrador no Supabase
- Tente executar em partes (primeiro DROP, depois CREATE, depois GRANTs)

