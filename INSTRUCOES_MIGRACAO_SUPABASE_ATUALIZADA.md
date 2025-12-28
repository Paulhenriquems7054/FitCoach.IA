# Instruções para Corrigir Problema de Cadastro no Supabase (ATUALIZADA)

## ⚠️ IMPORTANTE: Migração Atualizada

A função RPC `insert_user_profile_after_signup` foi **ATUALIZADA** para incluir todos os campos necessários. **Execute novamente a migração 2** para aplicar as correções.

## Problema
Ao fazer cadastro via "Testar Grátis por 3 dias", o usuário é criado no Supabase Auth mas não consegue criar o perfil na tabela `users` devido a políticas RLS (Row Level Security) ou campos faltando.

## Solução

### 1. Executar Migrações SQL no Supabase

Acesse o **SQL Editor** do Supabase Dashboard e execute as seguintes migrações:

#### Migração 1: Corrigir Política de INSERT para tabela users

Execute o conteúdo do arquivo:
```
supabase/migration_corrigir_politica_insert_users.sql
```

Este arquivo cria/atualiza a política RLS que permite que usuários autenticados criem seu próprio perfil na tabela `users`.

#### Migração 2: Criar/Atualizar Função RPC para inserir perfil (ATUALIZADA)

**⚠️ IMPORTANTE: Execute esta migração novamente mesmo se já executou antes!**

Execute o conteúdo do arquivo:
```
supabase/migration_criar_funcao_insert_user_profile.sql
```

**O que mudou nesta atualização:**
- ✅ Adicionado parâmetro `p_email` para incluir email do usuário
- ✅ Adicionado parâmetro `p_voice_daily_limit_seconds` para controle de voz
- ✅ Adicionado parâmetro `p_expiry_date` para data de expiração do plano
- ✅ A função agora insere todos os campos necessários: `email`, `voice_daily_limit_seconds`, `voice_used_today_seconds`, `voice_balance_upsell`, `text_msg_count_today`, `expiry_date`

Esta função permite criar o perfil mesmo quando a sessão não está totalmente ativa (fallback).

### 2. Verificar se as Migrações Foram Aplicadas

Execute no SQL Editor do Supabase:

```sql
-- Verificar se a política de INSERT existe
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users' 
AND cmd = 'INSERT';

-- Deve retornar uma política chamada "Users can insert own profile"
-- com with_check: (auth.uid() = id)
```

```sql
-- Verificar se a função RPC existe e tem os parâmetros corretos
SELECT 
    proname,
    pg_get_function_arguments(oid) as arguments,
    prosecdef
FROM pg_proc 
WHERE proname = 'insert_user_profile_after_signup'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Deve retornar a função com SECURITY DEFINER = true (prosecdef = true)
-- e os argumentos devem incluir: p_email, p_voice_daily_limit_seconds, p_expiry_date
```

### 3. Testar o Cadastro

Após executar as migrações:

1. Faça logout (se estiver logado)
2. Acesse a página de login
3. Clique em "Não tem código? Testar Grátis por 3 dias"
4. Preencha o formulário de cadastro
5. Tente fazer login com as credenciais criadas

### 4. Verificar Logs no Console

Se ainda houver problemas, verifique no console do navegador:

- Deve aparecer: "Login após signup bem-sucedido, sessão ativa"
- Deve aparecer: "Sessão ativa confirmada para usuário: [UUID]"
- Deve aparecer: "Usuário criado com sucesso na tabela users" (inserção direta ou função RPC)

Se aparecer erro de RLS ainda, verifique:
1. Se as migrações foram executadas corretamente
2. Se RLS está habilitado na tabela: `SELECT relrowsecurity FROM pg_class WHERE relname = 'users' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');`
3. Se há outras políticas conflitantes

## Notas Importantes

- As políticas RLS são aplicadas em ordem, então se houver múltiplas políticas, todas precisam permitir a operação
- A função RPC usa `SECURITY DEFINER`, o que permite bypass de RLS, mas requer permissões corretas no Supabase
- O código agora faz login automaticamente após signup para garantir que a sessão está ativa
- **A função RPC agora suporta todos os campos necessários**: email, voice limits, expiry date, etc.

## Troubleshooting

### Se a política não está funcionando:

1. Verifique se RLS está habilitado: deve retornar `true`
2. Verifique todas as políticas da tabela users:
```sql
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users';
```

3. Se houver políticas conflitantes, pode ser necessário ajustá-las ou remover políticas antigas

### Se a função RPC não funciona:

1. Verifique se a função tem SECURITY DEFINER:
```sql
SELECT prosecdef FROM pg_proc WHERE proname = 'insert_user_profile_after_signup';
```

2. Verifique se a função tem permissões corretas (deve estar em schema public e ter grants apropriados)

3. **Verifique se a função tem os parâmetros corretos:**
```sql
SELECT pg_get_function_arguments(oid) 
FROM pg_proc 
WHERE proname = 'insert_user_profile_after_signup';
```

4. Teste a função manualmente:
```sql
-- Substitua pelos valores reais
SELECT * FROM insert_user_profile_after_signup(
    '00000000-0000-0000-0000-000000000000'::UUID,  -- p_user_id
    'Nome Teste',                                    -- p_nome
    'usuario_teste',                                 -- p_username
    'free',                                          -- p_plan_type
    'active',                                        -- p_subscription_status
    '{"idade": 25, "genero": "Masculino"}'::JSONB,  -- p_user_data
    'teste@exemplo.com',                             -- p_email
    900,                                             -- p_voice_daily_limit_seconds
    NULL                                             -- p_expiry_date
);
```

## Contato

Se após seguir todos os passos o problema persistir, verifique:
- Versão do Supabase
- Configurações de RLS no dashboard
- Logs do Supabase para erros detalhados
- Console do navegador para mensagens de erro específicas

