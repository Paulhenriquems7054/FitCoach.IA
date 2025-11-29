# Solução: Erro "column reference 'id' is ambiguous" (Versão Final)

## 🔴 Problema

Ainda ocorre o erro de ambiguidade:
```
column reference "id" is ambiguous
It could refer to either a PL/pgSQL variable or a table column.
```

## 🔍 Causa

A ambiguidade ocorre porque:
1. A função retorna `TABLE(id UUID, nome TEXT, username TEXT)`
2. No `RETURNING`, estamos retornando `users.id`, `users.nome`, `users.username`
3. O PostgreSQL não consegue determinar se estamos nos referindo à coluna da tabela ou à coluna do retorno da função

## ✅ Solução Final

A função foi reescrita para usar variáveis intermediárias e `RETURN QUERY`, eliminando a ambiguidade:

### SQL Corrigido:

```sql
CREATE OR REPLACE FUNCTION public.insert_user_profile_after_signup(
    p_user_id UUID,
    p_nome TEXT,
    p_username TEXT,
    p_plan_type TEXT DEFAULT 'free',
    p_subscription_status TEXT DEFAULT 'active',
    p_user_data JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE(result_id UUID, result_nome TEXT, result_username TEXT) AS $$
DECLARE
    inserted_id UUID;
    inserted_nome TEXT;
    inserted_username TEXT;
BEGIN
    -- Inserir perfil do usuário
    -- Esta função usa SECURITY DEFINER para bypass RLS
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
    ON CONFLICT (id) DO NOTHING
    RETURNING 
        public.users.id,
        public.users.nome,
        public.users.username
    INTO inserted_id, inserted_nome, inserted_username;
    
    -- Retornar os valores
    RETURN QUERY SELECT inserted_id, inserted_nome, inserted_username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 📝 Mudanças Principais

1. **RETURNS TABLE**: Mudado para `result_id`, `result_nome`, `result_username` para evitar conflito
2. **DECLARE**: Adicionadas variáveis intermediárias `inserted_id`, `inserted_nome`, `inserted_username`
3. **RETURNING ... INTO**: Usa `INTO` para armazenar valores em variáveis
4. **RETURN QUERY**: Retorna os valores usando `RETURN QUERY SELECT`

## 🔧 Passo para Aplicar

1. Acesse: https://app.supabase.com
2. Vá em **SQL Editor**
3. Execute o arquivo atualizado: `supabase/migration_criar_funcao_insert_user_profile.sql`

Ou copie e cole o SQL acima diretamente.

## ⚠️ Nota sobre o Código TypeScript

O código TypeScript pode precisar ser ajustado para lidar com os novos nomes de colunas (`result_id`, `result_nome`, `result_username`). Vou verificar e ajustar se necessário.

## 🧪 Teste

Após executar a migração:

1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Recarregue a página (F5)
3. Insira o cupom `TESTE-FREE`
4. Preencha os dados e crie a conta
5. A conta deve ser criada com sucesso

---

**Execute a migração SQL atualizada no Supabase para resolver a ambiguidade definitivamente!**

