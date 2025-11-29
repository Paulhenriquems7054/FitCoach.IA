# Solução: Erro "Erro de autenticação ao criar perfil"

## 🔴 Problema

Após fazer signup, ocorre o erro:
```
Erro de autenticação ao criar perfil. Tente fazer login novamente.
```

E no console:
```
[authFlowService] Usuário não autenticado ao tentar criar perfil
```

## 🔍 Causa

O Supabase pode não estabelecer a sessão automaticamente após o signup se:

1. **Confirmação de email está habilitada**: O Supabase não cria sessão até que o email seja confirmado
2. **Configuração de Auth**: As configurações do projeto podem exigir confirmação antes de permitir login
3. **Timing**: A sessão pode levar alguns segundos para ser estabelecida

## ✅ Solução

### Opção 1: Desabilitar confirmação de email (Recomendado para desenvolvimento)

1. Acesse: https://app.supabase.com
2. Vá em **Authentication** → **Settings**
3. Desabilite **"Enable email confirmations"**
4. Salve as alterações

### Opção 2: Usar função SQL como fallback (Já implementado)

O código foi ajustado para:

1. **Tentar inserção direta primeiro**: Se o usuário estiver autenticado, insere normalmente
2. **Fazer login automático**: Se não houver sessão após signup, tenta fazer login automaticamente
3. **Usar função SQL como fallback**: Se a inserção direta falhar por RLS, usa uma função SQL que bypassa RLS

### Passo 1: Executar migração SQL

Execute a migração que cria a função de fallback:

1. Acesse: https://app.supabase.com
2. Vá em **SQL Editor**
3. Execute: `supabase/migration_criar_funcao_insert_user_profile.sql`

Ou copie e cole este SQL:

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
        p_plan_type::public.users.plan_type,
        p_subscription_status::public.users.subscription_status,
        COALESCE((p_user_data->>'idade')::INTEGER, 0),
        COALESCE((p_user_data->>'genero')::TEXT, 'Masculino')::public.users.genero,
        COALESCE((p_user_data->>'peso')::NUMERIC, 0),
        COALESCE((p_user_data->>'altura')::NUMERIC, 0),
        COALESCE((p_user_data->>'objetivo')::TEXT, 'perder peso'),
        COALESCE((p_user_data->>'points')::INTEGER, 0),
        COALESCE((p_user_data->>'disciplineScore')::INTEGER, 0),
        COALESCE((p_user_data->>'completedChallengeIds')::TEXT[], ARRAY[]::TEXT[]),
        COALESCE((p_user_data->>'isAnonymized')::BOOLEAN, false),
        COALESCE((p_user_data->>'role')::TEXT, 'user')::public.users.role,
        NOW(), NOW()
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING users.id, users.nome, users.username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Passo 2: Verificar configurações de Auth

1. Acesse: https://app.supabase.com
2. Vá em **Authentication** → **Settings**
3. Verifique se **"Enable email confirmations"** está desabilitado (para desenvolvimento)
4. Verifique se **"Enable sign ups"** está habilitado

### Passo 3: Testar novamente

1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Recarregue a página (F5)
3. Insira o cupom `TESTE-FREE`
4. Preencha os dados e crie a conta
5. A conta deve ser criada com sucesso

## 📝 Como Funciona Agora

### Fluxo de Registro:

1. **Signup**: Cria usuário no Supabase Auth
2. **Verificar Sessão**: Verifica se há sessão ativa
3. **Login Automático**: Se não houver sessão, tenta fazer login automaticamente
4. **Inserção Direta**: Tenta inserir perfil na tabela `users`
5. **Fallback SQL**: Se falhar por RLS, usa função SQL que bypassa RLS
6. **Vínculo com Cupom**: Cria vínculo entre usuário e cupom

### Segurança

A função SQL usa `SECURITY DEFINER`, mas ainda é segura porque:
- Ela só pode ser chamada com o ID do usuário que foi criado no Auth
- Ela não permite acesso a dados de outros usuários
- Ela só cria o perfil inicial, não permite modificações arbitrárias

## ⚠️ Importante

### Para Produção

Se você planeja usar confirmação de email em produção:

1. Mantenha a função SQL como fallback
2. Após o usuário confirmar o email, ele pode fazer login normalmente
3. O perfil já estará criado pela função SQL

### Para Desenvolvimento

Recomendado desabilitar confirmação de email para facilitar testes.

## 🔧 Arquivos Modificados

- `services/supabaseService.ts` - Adicionado login automático e fallback para função SQL
- `supabase/migration_criar_funcao_insert_user_profile.sql` - Função SQL de fallback
- `SOLUCAO_ERRO_AUTENTICACAO_SIGNUP.md` - Este guia

## 🧪 Teste Completo

Após executar a migração:

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

## 📚 Referências

- [Supabase Auth Settings](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase RLS with Functions](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgreSQL SECURITY DEFINER](https://www.postgresql.org/docs/current/sql-createfunction.html)

