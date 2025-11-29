# Solução: Erro "column reference 'id' is ambiguous"

## 🔴 Problema

Ao tentar criar uma conta, ocorre o erro:
```
Erro ao criar perfil: column reference "id" is ambiguous. Verifique se a função SQL foi criada corretamente.
```

## 🔍 Causa

A função SQL tem uma ambiguidade na referência à coluna `id` na cláusula `ON CONFLICT` e `RETURNING`. O PostgreSQL não consegue determinar qual tabela a coluna pertence.

## ✅ Solução

A função SQL foi corrigida para usar referências explícitas à tabela:

### Antes (com ambiguidade):
```sql
ON CONFLICT (id) DO NOTHING
RETURNING users.id, users.nome, users.username;
```

### Depois (corrigido):
```sql
ON CONFLICT (public.users.id) DO NOTHING
RETURNING public.users.id, public.users.nome, public.users.username;
```

## 📝 Passo para Aplicar

### Atualizar a Função SQL no Supabase

1. Acesse: https://app.supabase.com
2. Vá em **SQL Editor**
3. Execute o arquivo atualizado: `supabase/migration_criar_funcao_insert_user_profile.sql`

Ou copie e cole este SQL corrigido:

```sql
CREATE OR REPLACE FUNCTION public.insert_user_profile_after_signup(
    p_user_id UUID,
    p_nome TEXT,
    p_username TEXT,
    p_plan_type TEXT DEFAULT 'free',
    p_subscription_status TEXT DEFAULT 'active',
    p_user_data JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE(id UUID, nome TEXT, username TEXT) AS $$
BEGIN
    INSERT INTO public.users (
        id, nome, username, plan_type, subscription_status,
        idade, genero, peso, altura, objetivo,
        points, discipline_score, completed_challenge_ids,
        is_anonymized, role, created_at, updated_at
    ) VALUES (
        p_user_id, p_nome, p_username,
        p_plan_type::TEXT,
        p_subscription_status::TEXT,
        COALESCE((p_user_data->>'idade')::INTEGER, 0),
        COALESCE((p_user_data->>'genero')::TEXT, 'Masculino'),
        COALESCE((p_user_data->>'peso')::NUMERIC, 0),
        COALESCE((p_user_data->>'altura')::NUMERIC, 0),
        COALESCE((p_user_data->>'objetivo')::TEXT, 'perder peso'),
        COALESCE((p_user_data->>'points')::INTEGER, 0),
        COALESCE((p_user_data->>'disciplineScore')::INTEGER, 0),
        COALESCE((p_user_data->>'completedChallengeIds')::TEXT[], ARRAY[]::TEXT[]),
        COALESCE((p_user_data->>'isAnonymized')::BOOLEAN, false),
        COALESCE((p_user_data->>'role')::TEXT, 'user'),
        NOW(), NOW()
    )
    ON CONFLICT (public.users.id) DO NOTHING
    RETURNING public.users.id, public.users.nome, public.users.username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Testar Novamente

1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Recarregue a página (F5)
3. Insira o cupom `TESTE-FREE`
4. Preencha os dados e crie a conta
5. A conta deve ser criada com sucesso

## 🔧 O Que Foi Corrigido

- **ON CONFLICT**: Agora usa `public.users.id` ao invés de apenas `id`
- **RETURNING**: Agora usa `public.users.id`, `public.users.nome`, `public.users.username` com referências explícitas

## 📚 Explicação Técnica

O erro de ambiguidade ocorre quando o PostgreSQL não consegue determinar qual tabela uma coluna pertence. Isso pode acontecer quando:

1. Há múltiplas tabelas envolvidas na query
2. Há subconsultas ou CTEs que também têm colunas com o mesmo nome
3. A referência não é explícita o suficiente

A solução é usar referências totalmente qualificadas: `schema.tabela.coluna` (ex: `public.users.id`).

## ⚠️ Importante

Após executar a migração atualizada, a função deve funcionar corretamente. Se ainda houver problemas:

1. Verifique se a função foi criada corretamente:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'insert_user_profile_after_signup';
   ```

2. Verifique se há outras funções com nomes similares que possam estar causando conflito

3. Tente dropar e recriar a função:
   ```sql
   DROP FUNCTION IF EXISTS public.insert_user_profile_after_signup;
   -- Depois execute a migração novamente
   ```

## 🧪 Teste Completo

Após executar a migração atualizada:

1. ✅ Limpe o cache do navegador
2. ✅ Recarregue a página
3. ✅ Insira o cupom `TESTE-FREE`
4. ✅ Preencha os dados:
   - Nome: Teste
   - Email: teste@exemplo.com
   - Senha: senha123
   - Confirmação: senha123
5. ✅ Clique em "Criar Conta"
6. ✅ A conta deve ser criada com sucesso

---

**Execute a migração SQL atualizada no Supabase para corrigir o erro de ambiguidade!**

