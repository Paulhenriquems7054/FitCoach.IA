# Solução: Erros na função SQL de inserção de perfil

## 🔴 Problemas Identificados

1. **Erro no cast de tipos**: `cross-database references are not implemented: public.users.plan_type`
2. **Erro ao fazer login automático**: `400 (Bad Request)` quando confirmação de email está habilitada
3. **Erro ao buscar registro**: `406 (Not Acceptable)` e `Cannot coerce the result to a single JSON object`

## ✅ Correções Aplicadas

### 1. Correção da Função SQL

**Problema**: A função estava tentando fazer cast para tipos que não existem (`public.users.plan_type`).

**Solução**: Removidos os casts problemáticos, usando apenas `TEXT` diretamente:

```sql
-- ANTES (errado):
p_plan_type::public.users.plan_type,
p_subscription_status::public.users.subscription_status,
COALESCE((p_user_data->>'genero')::TEXT, 'Masculino')::public.users.genero,
COALESCE((p_user_data->>'role')::TEXT, 'user')::public.users.role,

-- DEPOIS (correto):
p_plan_type::TEXT,  -- plan_type é TEXT com CHECK constraint
p_subscription_status::TEXT,  -- subscription_status é TEXT com CHECK constraint
COALESCE((p_user_data->>'genero')::TEXT, 'Masculino'),
COALESCE((p_user_data->>'role')::TEXT, 'user'),
```

### 2. Remoção de Login Automático

**Problema**: Tentar fazer login automaticamente após signup falha se confirmação de email estiver habilitada.

**Solução**: Removida a tentativa de login automático. Se não houver sessão após signup, vai direto para a função SQL.

### 3. Correção do Tratamento do Retorno da Função SQL

**Problema**: A função SQL retorna uma tabela (array), mas o código estava tentando usar como objeto único.

**Solução**: Ajustado para tratar o retorno como array e usar `maybeSingle()` ao buscar o registro.

## 📝 Passos para Aplicar

### Passo 1: Atualizar a Função SQL no Supabase

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
        p_plan_type::TEXT,  -- plan_type é TEXT com CHECK constraint
        p_subscription_status::TEXT,  -- subscription_status é TEXT com CHECK constraint
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
    RETURNING users.id, users.nome, users.username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Passo 2: Verificar Configurações de Auth

1. Acesse: https://app.supabase.com
2. Vá em **Authentication** → **Settings**
3. **Recomendado para desenvolvimento**: Desabilite **"Enable email confirmations"**
4. Salve as alterações

### Passo 3: Testar Novamente

1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Recarregue a página (F5)
3. Insira o cupom `TESTE-FREE`
4. Preencha os dados e crie a conta
5. A conta deve ser criada com sucesso

## 🔧 Como Funciona Agora

### Fluxo de Registro Corrigido:

1. **Signup**: Cria usuário no Supabase Auth
2. **Verificar Sessão**: Verifica se há sessão ativa
3. **Inserção Direta**: Tenta inserir perfil na tabela `users` (se houver sessão)
4. **Fallback SQL**: Se falhar por RLS ou não houver sessão, usa função SQL que bypassa RLS
5. **Buscar Registro**: Busca o registro criado usando `maybeSingle()` (não falha se não encontrar)
6. **Vínculo com Cupom**: Cria vínculo entre usuário e cupom

### Tratamento de Erros:

- Se a inserção direta falhar por RLS → usa função SQL
- Se a função SQL retornar dados → busca o registro completo
- Se não conseguir buscar (por RLS) → cria objeto mínimo e continua
- Se a função SQL falhar → mostra erro detalhado

## ⚠️ Importante

### Para Desenvolvimento

**Recomendado desabilitar confirmação de email** para facilitar testes:
- Authentication → Settings → Desabilitar "Enable email confirmations"

### Para Produção

Se você planeja usar confirmação de email:
- A função SQL permite criar o perfil mesmo sem sessão
- Após confirmar email, o usuário pode fazer login normalmente
- O perfil já estará criado

## 📚 Arquivos Modificados

- `supabase/migration_criar_funcao_insert_user_profile.sql` - Função SQL corrigida
- `services/supabaseService.ts` - Removido login automático e ajustado tratamento de retorno
- `SOLUCAO_ERRO_FUNCAO_SQL.md` - Este guia

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
6. ✅ A conta deve ser criada com sucesso, mesmo sem sessão ativa

## 🔍 Debug

Se ainda houver problemas, verifique:

1. **Função SQL existe?**
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'insert_user_profile_after_signup';
   ```

2. **RLS está habilitado?**
   ```sql
   SELECT relrowsecurity FROM pg_class WHERE relname = 'users';
   ```

3. **Política de INSERT existe?**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert own profile';
   ```

Execute a migração SQL atualizada e teste novamente!

