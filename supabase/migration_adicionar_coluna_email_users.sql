    -- Migration: Adicionar coluna email à tabela users
    -- Data: 2025-01-27
    -- Descrição: Adiciona coluna email se não existir (necessária para autenticação)

    -- Adicionar coluna email se não existir
    DO $$ 
    BEGIN
        -- Verificar se a coluna email já existe
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND column_name = 'email'
        ) THEN
            -- Adicionar coluna email
            ALTER TABLE public.users 
            ADD COLUMN email TEXT;
            
            -- Adicionar comentário
            COMMENT ON COLUMN public.users.email IS 'Email do usuário (para envio de links de acesso e autenticação)';
            
            RAISE NOTICE 'Coluna email adicionada à tabela users';
        ELSE
            RAISE NOTICE 'Coluna email já existe na tabela users';
        END IF;
    END $$;

    -- Criar índice para email (opcional, mas útil para buscas)
    CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email) WHERE email IS NOT NULL;

    -- Verificação final
    DO $$
    DECLARE
        email_exists BOOLEAN;
    BEGIN
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND column_name = 'email'
        ) INTO email_exists;
        
        IF email_exists THEN
            RAISE NOTICE '✅ Coluna email verificada e disponível na tabela users';
        ELSE
            RAISE EXCEPTION '❌ Erro: Coluna email não foi criada';
        END IF;
    END $$;

