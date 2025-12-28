# Resumo das Correções para Problema de Cadastro

## Problemas Identificados e Corrigidos

### 1. ❌ Campos Inexistentes na Tabela
**Problema:** Código tentava inserir campos que não existem na tabela `users`:
- `account_type` - **NÃO EXISTE**
- `trial_start_date` - **NÃO EXISTE**
- `trial_end_date` - **NÃO EXISTE**
- `chat_daily_limit_messages` - **NÃO EXISTE** (deve ser `text_msg_count_today`)

**Correção:** Removidos todos esses campos do código de inserção.

### 2. ❌ Valor Inválido para subscription_status
**Problema:** O código estava usando `subscription_status: 'trial'`, mas o schema só aceita:
- `'active'`
- `'inactive'`
- `'expired'`

**Correção:** Adicionada conversão para transformar `'trial'` em `'active'` antes de inserir.

### 3. ✅ Logging Melhorado
**Adicionado:** Logs mais detalhados para debug quando a função RPC falha.

## Arquivos Modificados

1. **pages/LoginPage.tsx**
   - Removidos campos inexistentes da inserção direta
   - Adicionada conversão de 'trial' para 'active'
   - Melhorado logging de erros

2. **services/supabaseService.ts**
   - Removidos campos inexistentes da função `userToSupabase()`
   - Removidos campos inexistentes da conversão de Supabase para User
   - Corrigido `chat_daily_limit_messages` para `text_msg_count_today`
   - Corrigido `subscription_status: 'trial'` para `'active'`

## Como Testar

1. Abra o console do navegador (F12)
2. Tente fazer um novo cadastro
3. Verifique os logs:
   - **Deve aparecer:** "Login após signup bem-sucedido, sessão ativa"
   - **Deve aparecer:** "Usuário criado com sucesso na tabela users"
   - **NÃO deve aparecer:** erro 400 com campos inválidos
   - **NÃO deve aparecer:** "CRÍTICO: Falha ao criar usuário na tabela users"

## Erros Comuns que Podem Ainda Ocorrer

### Erro 400 na função RPC
**Causa possível:** Parâmetros inválidos ou tipos incorretos

**Solução:**
- Verifique os logs detalhados que foram adicionados
- Verifique se `p_user_id` é um UUID válido
- Verifique se `p_user_data` é um JSON válido

### Erro 401 (Não autorizado)
**Causa possível:** Sessão não está ativa após signup

**Solução:**
- Verifique se email confirmation está desabilitado no Supabase
- Ou garanta que a função RPC tem GRANT para `anon` e `authenticated`

### Erro RLS (403)
**Causa possível:** Política RLS bloqueando inserção

**Solução:**
- Verifique se a política "Users can insert own profile" existe
- Verifique se a função RPC tem SECURITY DEFINER e GRANTs corretos

## Próximos Passos

Se ainda houver problemas:

1. Verifique os logs detalhados no console
2. Execute o script SQL `supabase/testar_funcao_rpc_manual.sql` para testar a função manualmente
3. Verifique se todos os GRANTs foram aplicados:
   ```sql
   SELECT grantee, privilege_type 
   FROM information_schema.routine_privileges 
   WHERE routine_name = 'insert_user_profile_after_signup';
   ```

