# Solução: Erro "infinite recursion detected in policy for relation 'users'"

## 🔴 Problema

Ao tentar criar uma conta após inserir o cupom `TESTE-FREE`, ocorre o erro:
```
infinite recursion detected in policy for relation "users"
```

## 🔍 Causa

As políticas RLS (Row Level Security) da tabela `users` estão fazendo `SELECT` na própria tabela `users` dentro das políticas, causando recursão infinita:

- Política "Gym admins can view gym users" (linha 42-52)
- Política "Trainers can view gym students data" (linha 204-215)
- Política "Admins can view all gym data" (linha 218-228)
- Política "Admins can update gym students" (linha 231-242)

Quando o Supabase tenta verificar essas políticas, ele precisa fazer `SELECT` na tabela `users`, mas para fazer esse `SELECT`, precisa verificar as políticas novamente, criando um loop infinito.

## ✅ Solução

Execute a migração SQL que corrige as políticas usando funções auxiliares com `SECURITY DEFINER` (que fazem bypass das políticas RLS):

### Passo 1: Executar a migração no Supabase

1. Acesse: https://app.supabase.com
2. Vá em **SQL Editor**
3. Execute o arquivo: `supabase/migration_corrigir_rls_recursao.sql`

Ou copie e cole este SQL diretamente:

```sql
-- Remover políticas problemáticas
DROP POLICY IF EXISTS "Gym admins can view gym users" ON public.users;
DROP POLICY IF EXISTS "Trainers can view gym students data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all gym data" ON public.users;
DROP POLICY IF EXISTS "Admins can update gym students" ON public.users;

-- Criar funções auxiliares (SECURITY DEFINER - bypass RLS)
CREATE OR REPLACE FUNCTION public.get_current_user_gym_id()
RETURNS TEXT AS $$
DECLARE
    user_gym_id TEXT;
BEGIN
    SELECT gym_id INTO user_gym_id
    FROM public.users
    WHERE id = auth.uid()
    LIMIT 1;
    RETURN user_gym_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_user_gym_role()
RETURNS TEXT AS $$
DECLARE
    user_gym_role TEXT;
BEGIN
    SELECT gym_role INTO user_gym_role
    FROM public.users
    WHERE id = auth.uid()
    LIMIT 1;
    RETURN user_gym_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar políticas sem recursão
CREATE POLICY "Gym admins can view gym users"
    ON public.users FOR SELECT
    USING (
        auth.uid() = id
        OR (
            gym_id IS NOT NULL
            AND gym_id = public.get_current_user_gym_id()
            AND public.get_current_user_gym_role() = 'admin'
        )
    );

CREATE POLICY "Trainers can view gym students data"
    ON public.users FOR SELECT
    USING (
        auth.uid() = id
        OR (
            gym_id IS NOT NULL
            AND gym_role = 'student'
            AND gym_id = public.get_current_user_gym_id()
            AND public.get_current_user_gym_role() = 'trainer'
        )
    );

CREATE POLICY "Admins can view all gym data"
    ON public.users FOR SELECT
    USING (
        auth.uid() = id
        OR (
            gym_id IS NOT NULL
            AND gym_id = public.get_current_user_gym_id()
            AND public.get_current_user_gym_role() = 'admin'
        )
    );

CREATE POLICY "Admins can update gym students"
    ON public.users FOR UPDATE
    USING (
        auth.uid() = id
        OR (
            gym_id IS NOT NULL
            AND gym_role = 'student'
            AND gym_id = public.get_current_user_gym_id()
            AND public.get_current_user_gym_role() = 'admin'
        )
    );
```

### Passo 2: Verificar se funcionou

Após executar a migração, você deve ver uma mensagem de sucesso:
```
✅ Políticas RLS corrigidas - recursão removida
```

### Passo 3: Testar novamente

1. Recarregue a página no navegador (F5)
2. Insira o cupom `TESTE-FREE`
3. Preencha os dados para criar a conta
4. O erro não deve mais aparecer

## 📝 Explicação Técnica

### O que são funções SECURITY DEFINER?

Funções com `SECURITY DEFINER` executam com os privilégios do usuário que criou a função (geralmente o superusuário), não com os privilégios do usuário que chama a função. Isso permite que essas funções façam bypass das políticas RLS.

### Por que isso resolve o problema?

1. **Antes**: A política fazia `SELECT` na tabela `users` → precisava verificar políticas → recursão infinita
2. **Depois**: A função `get_current_user_gym_id()` faz `SELECT` com bypass RLS → não precisa verificar políticas → sem recursão

### Segurança

As funções ainda são seguras porque:
- Elas só retornam dados do próprio usuário autenticado (`auth.uid()`)
- Elas não permitem acesso a dados de outros usuários
- As políticas ainda verificam se o usuário tem permissão antes de permitir acesso

## 🔧 Arquivos Criados

- `supabase/migration_corrigir_rls_recursao.sql` - Migração SQL completa
- `SOLUCAO_ERRO_RLS_RECURSAO.md` - Este guia

## ⚠️ Importante

Se você ainda tiver problemas após executar a migração:

1. Verifique se todas as políticas foram removidas e recriadas corretamente
2. Verifique se as funções foram criadas com sucesso
3. Tente limpar o cache do navegador (Ctrl+Shift+Delete)
4. Reinicie o servidor de desenvolvimento

## 📚 Referências

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL SECURITY DEFINER](https://www.postgresql.org/docs/current/sql-createfunction.html)

