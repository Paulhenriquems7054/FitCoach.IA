# Diagnóstico: Erro "Conta criada no sistema, mas houve um problema ao salvar seu perfil"

## Problema Identificado

O código estava tentando inserir campos que **NÃO EXISTEM** na tabela `users` do Supabase:

- ❌ `account_type` - **NÃO EXISTE**
- ❌ `trial_start_date` - **NÃO EXISTE**  
- ❌ `trial_end_date` - **NÃO EXISTE**

Esses campos causavam erro 400 ao tentar inserir o perfil do usuário.

## Campos que EXISTEM na tabela users

✅ Campos que **EXISTEM** e devem ser usados:
- `expiry_date` (TIMESTAMPTZ) - Data de expiração do plano
- `plan_type` (TEXT) - Tipo de plano
- `subscription_status` (TEXT) - Status da assinatura
- Todos os outros campos básicos (nome, username, email, idade, genero, etc.)

## Correção Aplicada

Removidos os campos inexistentes (`account_type`, `trial_start_date`, `trial_end_date`) do código de inserção em `pages/LoginPage.tsx`.

## Como Verificar se Está Funcionando

1. Abra o console do navegador (F12)
2. Tente fazer um novo cadastro
3. Verifique os logs:
   - Deve aparecer: "Usuário criado com sucesso na tabela users"
   - **NÃO** deve aparecer: "CRÍTICO: Falha ao criar usuário na tabela users"
   - **NÃO** deve aparecer: erro 400 ou campos inválidos

## Outros Problemas Possíveis

Se ainda houver erro após a correção, verifique:

1. **Erro RLS (403)**: A função RPC tem SECURITY DEFINER e GRANTs corretos?
   ```sql
   -- Verificar GRANTs
   SELECT grantee, privilege_type 
   FROM information_schema.routine_privileges 
   WHERE routine_name = 'insert_user_profile_after_signup';
   ```

2. **Erro 400 na função RPC**: Verifique se os parâmetros estão corretos:
   ```sql
   -- Verificar parâmetros da função
   SELECT pg_get_function_arguments(oid) 
   FROM pg_proc 
   WHERE proname = 'insert_user_profile_after_signup';
   ```

3. **Sessão não ativa**: Verifique se o login após signup está funcionando:
   - Deve aparecer: "Login após signup bem-sucedido, sessão ativa"
   - Deve aparecer: "Sessão ativa confirmada para usuário: [UUID]"

## Notas

- Os campos `trial_start_date` e `trial_end_date` podem estar sendo usados no código TypeScript mas não existem no banco
- Se precisar desses campos, será necessário criar uma migration para adicioná-los
- Por enquanto, apenas `expiry_date` é usado para controlar a expiração do plano

