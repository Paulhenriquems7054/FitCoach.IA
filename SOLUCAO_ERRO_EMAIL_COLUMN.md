# 🔧 Solução: Erro "Could not find the 'email' column of 'users'"

## ⚠️ Erro
```
Could not find the 'email' column of 'users' in the schema cache
```

## 🔍 Causa
A coluna `email` não existe na tabela `users` do seu banco de dados Supabase, mas o código está tentando usá-la.

## ✅ Solução

### Opção 1: Executar Migração SQL (Recomendado)

Execute esta migração no Supabase para adicionar a coluna `email`:

**Arquivo:** `supabase/migration_adicionar_coluna_email_users.sql`

1. Acesse o painel do Supabase: https://app.supabase.com
2. Vá em **SQL Editor**
3. Cole e execute o conteúdo do arquivo `migration_adicionar_coluna_email_users.sql`
4. Verifique se a migração foi executada com sucesso

### Opção 2: Executar SQL Diretamente

No SQL Editor do Supabase, execute:

```sql
-- Adicionar coluna email se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN email TEXT;
        
        COMMENT ON COLUMN public.users.email IS 'Email do usuário (para envio de links de acesso e autenticação)';
        
        RAISE NOTICE 'Coluna email adicionada à tabela users';
    ELSE
        RAISE NOTICE 'Coluna email já existe na tabela users';
    END IF;
END $$;

-- Criar índice para email
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email) WHERE email IS NOT NULL;
```

### Opção 3: Verificar se a Coluna Existe

Execute este SQL para verificar:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users' 
AND column_name = 'email';
```

Se retornar vazio, a coluna não existe e você precisa executar a migração.

## 🔄 Após Executar a Migração

1. **Recarregue a página** no navegador (F5)
2. **Teste novamente** o fluxo de cupom
3. O erro não deve mais aparecer

## 📝 Nota

O código foi ajustado para funcionar mesmo sem a coluna `email`, mas é recomendado adicioná-la para funcionalidades futuras (envio de emails, recuperação de senha, etc.).

## 🆘 Ainda com Problemas?

1. Verifique se a migração foi executada com sucesso
2. Verifique se você está no projeto correto do Supabase
3. Tente limpar o cache do Supabase (pode levar alguns minutos)
4. Verifique os logs do SQL Editor para ver se há erros

