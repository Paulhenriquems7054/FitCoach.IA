# 🔍 Diagnóstico do Problema de Cadastro

## Problema Reportado
Ao tentar cadastrar um novo usuário (sem código), aparece:
- "Conta criada no sistema, mas houve um problema ao salvar seu perfil"
- "Conta criada com sucesso!"

Isso indica que:
- ✅ Signup no Supabase Auth funciona
- ❌ Criação do perfil na tabela `users` falha

## 🔧 Passos para Diagnosticar

### 1. Verificar Permissões GRANT EXECUTE (MAIS PROVÁVEL)

Execute no SQL Editor do Supabase:

```sql
-- Verificar se as permissões existem
SELECT 
    grantee, 
    privilege_type,
    is_grantable
FROM information_schema.routine_privileges 
WHERE routine_schema = 'public' 
AND routine_name = 'insert_user_profile_after_signup'
ORDER BY grantee, privilege_type;
```

**Resultado Esperado:**
```
grantee       | privilege_type | is_grantable
--------------+----------------+-------------
authenticated | EXECUTE        | NO
anon          | EXECUTE        | NO
```

**Se NÃO aparecer esses resultados:**
Execute este script para corrigir:

```sql
GRANT EXECUTE ON FUNCTION public.insert_user_profile_after_signup(
    UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, INTEGER, TIMESTAMPTZ
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.insert_user_profile_after_signup(
    UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, INTEGER, TIMESTAMPTZ
) TO anon;
```

### 2. Verificar Logs do Console do Navegador

1. Abra o DevTools (F12)
2. Vá para a aba "Console"
3. Tente cadastrar um novo usuário
4. Procure por logs que começam com:
   - `[LoginPage]`
   - `❌ ERRO`
   - `🔧 AÇÃO NECESSÁRIA`

**Logs importantes a procurar:**
- `❌ ERRO CRÍTICO: Falha ao criar usuário via função RPC`
- `📋 Detalhes completos do erro RPC:`
- Código do erro (ex: `400`, `42883`, `23503`, `42501`)
- Mensagem do erro

### 3. Verificar se a Função Existe

Execute no SQL Editor:

```sql
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    prosecdef as has_security_definer
FROM pg_proc 
WHERE proname = 'insert_user_profile_after_signup'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```

**Deve retornar 1 linha com:**
- `function_name`: `insert_user_profile_after_signup`
- `has_security_definer`: `true`

### 4. Testar a Função Manualmente (Opcional)

Execute no SQL Editor (substitua os valores pelos de teste):

```sql
SELECT * FROM public.insert_user_profile_after_signup(
    '00000000-0000-0000-0000-000000000000'::UUID,  -- Substitua por um UUID válido de auth.users
    'Teste',
    'teste_user',
    'free',
    'active',
    '{"idade": 25, "genero": "Masculino", "peso": 70, "altura": 175, "objetivo": "perder peso", "points": 0, "disciplineScore": 0, "completedChallengeIds": [], "isAnonymized": false, "role": "user"}'::JSONB,
    'teste@example.com',
    900,
    NULL
);
```

## 🐛 Erros Comuns e Soluções

### Erro 400 (Bad Request)
**Causa:** Permissões não configuradas ou função não encontrada  
**Solução:** Execute o script de GRANT EXECUTE acima

### Erro 42883 (function does not exist)
**Causa:** Função não existe ou assinatura incorreta  
**Solução:** Execute novamente a migração `migration_criar_funcao_insert_user_profile.sql`

### Erro 23503 (Foreign Key Constraint)
**Causa:** Usuário ainda não existe em `auth.users` quando função é chamada  
**Solução:** Já implementamos retry logic, mas se persistir, pode ser timing. Verifique logs.

### Erro 42501 (RLS Policy)
**Causa:** Tentando inserir diretamente sem sessão (não deveria acontecer se usando função RPC)  
**Solução:** Verifique se o código está usando a função RPC corretamente

## 📝 Próximos Passos

1. Execute o passo 1 (verificar permissões) - **MAIS IMPORTANTE**
2. Se permissões estiverem faltando, execute o script de GRANT
3. Teste o cadastro novamente
4. Verifique os logs no console (passo 2)
5. Compartilhe os logs se o problema persistir

## 📞 Informações para Compartilhar

Se o problema persistir após corrigir as permissões, compartilhe:

1. Resultado da verificação de permissões (passo 1)
2. Logs do console do navegador (passo 2)
3. Mensagem de erro exata exibida na tela
4. Resultado da verificação da função (passo 3)

