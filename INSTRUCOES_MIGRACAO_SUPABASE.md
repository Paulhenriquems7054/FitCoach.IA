# Instruções para Corrigir Problema de RLS no Cadastro

## Problema
Ao fazer cadastro via "Testar Grátis por 3 dias", o usuário é criado no Supabase Auth mas não consegue criar o perfil na tabela `users` devido a políticas RLS (Row Level Security).

## Solução

### 1. Executar Migrações SQL no Supabase

Acesse o **SQL Editor** do Supabase Dashboard e execute as seguintes migrações:

#### Migração 1: Corrigir Política de INSERT para tabela users

Execute o conteúdo do arquivo:
```
supabase/migration_corrigir_politica_insert_users.sql
```

Este arquivo cria/atualiza a política RLS que permite que usuários autenticados criem seu próprio perfil na tabela `users`.

#### Migração 2: Criar Função RPC para inserir perfil

Execute o conteúdo do arquivo:
```
supabase/migration_criar_funcao_insert_user_profile.sql
```

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
-- Verificar se a função RPC existe
SELECT 
    proname,
    proargnames,
    prosecdef
FROM pg_proc 
WHERE proname = 'insert_user_profile_after_signup'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Deve retornar a função com SECURITY DEFINER = true (prosecdef = true)
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
- Deve aparecer: "Usuário criado com sucesso na tabela users"

Se aparecer erro de RLS ainda, verifique:
1. Se as migrações foram executadas corretamente
2. Se RLS está habilitado na tabela: `SELECT relrowsecurity FROM pg_class WHERE relname = 'users' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');`
3. Se há outras políticas conflitantes

## Notas Importantes

- As políticas RLS são aplicadas em ordem, então se houver múltiplas políticas, todas precisam permitir a operação
- A função RPC usa `SECURITY DEFINER`, o que permite bypass de RLS, mas requer permissões corretas no Supabase
- O código agora faz login automaticamente após signup para garantir que a sessão está ativa

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

## Contato

Se após seguir todos os passos o problema persistir, verifique:
- Versão do Supabase
- Configurações de RLS no dashboard
- Logs do Supabase para erros detalhados

