# 🔧 Correção: Perfil Não Encontrado Após Login

## 🐛 Problema Identificado

**Sintoma:**
- Login é bem-sucedido (email e senha estão corretos)
- Usuário existe no Supabase Auth (ID: `3197d46e-6a2c-4e2e-8714-b18e08c4f114`)
- Mas o perfil **não existe** na tabela `users`
- Erro 406 (Not Acceptable) ao tentar buscar o perfil

**Causa Provável:**
O trigger `on_auth_user_created` não executou após o cadastro, ou foi executado antes da migration ser aplicada.

---

## ✅ Soluções

### Solução 1: Criar Perfil Manualmente (Rápido)

**⚠️ IMPORTANTE:** Use o arquivo SQL separado: `supabase/CRIAR_PERFIL_MANUAL.sql`

Ou execute esta query no Supabase SQL Editor:

```sql
-- Criar perfil manualmente para o usuário
INSERT INTO public.users (
    id,
    nome,
    username,
    email,
    plan_type,
    subscription_status,
    idade,
    genero,
    peso,
    altura,
    objetivo,
    points,
    discipline_score,
    completed_challenge_ids,
    is_anonymized,
    role,
    voice_daily_limit_seconds,
    voice_used_today_seconds,
    voice_balance_upsell,
    text_msg_count_today,
    created_at,
    updated_at
)
SELECT 
    id,
    COALESCE(
        raw_user_meta_data->>'nome',
        raw_user_meta_data->>'name',
        SPLIT_PART(COALESCE(email, ''), '@', 1)
    ) as nome,
    COALESCE(
        raw_user_meta_data->>'username',
        LOWER(REGEXP_REPLACE(
            COALESCE(
                raw_user_meta_data->>'nome',
                raw_user_meta_data->>'name',
                SPLIT_PART(COALESCE(email, ''), '@', 1)
            ),
            '[^a-zA-Z0-9]', '_', 'g'
        ))
    ) as username,
    email,
    'free',
    'active',
    0,
    'Masculino',
    0,
    0,
    'perder peso',
    0,
    0,
    ARRAY[]::TEXT[],
    false,
    'user',
    900,
    0,
    0,
    0,
    NOW(),
    NOW()
FROM auth.users
WHERE id = '3197d46e-6a2c-4e2e-8714-b18e08c4f114'
  AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.users.id)
ON CONFLICT (id) DO NOTHING;
```

**Nota:** Substitua `'3197d46e-6a2c-4e2e-8714-b18e08c4f114'` pelo ID do seu usuário.

---

### Solução 2: Verificar e Recriar o Trigger

1. **Verifique se o trigger existe:**

```sql
-- Verificar se o trigger existe
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';
```

2. **Verifique se a função existe:**

```sql
-- Verificar se a função handle_new_user existe
SELECT 
    proname as function_name,
    prosecdef as is_security_definer
FROM pg_proc
WHERE proname = 'handle_new_user'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```

3. **Se o trigger não existir, execute a migration:**

Execute a migration `008_trigger_perfil_simples.sql` novamente no Supabase SQL Editor.

---

### Solução 3: Executar a Migration Novamente

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute o conteúdo do arquivo `supabase/migrations/008_trigger_perfil_simples.sql`
4. Verifique se não há erros

---

### Solução 4: Criar Perfil para Todos os Usuários Sem Perfil

**⚠️ IMPORTANTE:** Esta query está incluída no arquivo `supabase/CRIAR_PERFIL_MANUAL.sql` (Solução 2)

Execute esta query para criar perfis para todos os usuários que não têm:

```sql
-- Criar perfis para todos os usuários que não têm perfil
INSERT INTO public.users (
    id,
    nome,
    username,
    email,
    plan_type,
    subscription_status,
    idade,
    genero,
    peso,
    altura,
    objetivo,
    points,
    discipline_score,
    completed_challenge_ids,
    is_anonymized,
    role,
    voice_daily_limit_seconds,
    voice_used_today_seconds,
    voice_balance_upsell,
    text_msg_count_today,
    created_at,
    updated_at
)
SELECT 
    au.id,
    COALESCE(
        au.raw_user_meta_data->>'nome',
        au.raw_user_meta_data->>'name',
        SPLIT_PART(COALESCE(au.email, ''), '@', 1)
    ) as nome,
    COALESCE(
        au.raw_user_meta_data->>'username',
        LOWER(REGEXP_REPLACE(
            COALESCE(
                au.raw_user_meta_data->>'nome',
                au.raw_user_meta_data->>'name',
                SPLIT_PART(COALESCE(au.email, ''), '@', 1)
            ),
            '[^a-zA-Z0-9]', '_', 'g'
        ))
    ) as username,
    au.email,
    'free',
    'active',
    0,
    'Masculino',
    0,
    0,
    'perder peso',
    0,
    0,
    ARRAY[]::TEXT[],
    false,
    'user',
    900,
    0,
    0,
    0,
    NOW(),
    NOW()
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = au.id
)
ON CONFLICT (id) DO NOTHING;
```

---

## 🔍 Verificação

Após aplicar uma das soluções, verifique:

1. **Verifique se o perfil foi criado:**

```sql
SELECT * FROM public.users WHERE id = '3197d46e-6a2c-4e2e-8714-b18e08c4f114';
```

2. **Verifique se o trigger está funcionando:**

Crie um novo usuário de teste e verifique se o perfil é criado automaticamente.

3. **Teste o login novamente:**

- Faça login com o email `paulohmorais@hotmail.com`
- O perfil deve ser encontrado agora

---

## 📋 Checklist de Diagnóstico

- [ ] Verificar se o usuário existe em `auth.users`
- [ ] Verificar se o perfil existe em `public.users`
- [ ] Verificar se o trigger `on_auth_user_created` existe
- [ ] Verificar se a função `handle_new_user` existe e tem `SECURITY DEFINER`
- [ ] Verificar se as políticas RLS permitem `INSERT` via trigger
- [ ] Criar perfil manualmente se necessário
- [ ] Testar login novamente

---

## 🆘 Se Nada Funcionar

1. Verifique os logs do Supabase Dashboard → Logs
2. Procure por erros relacionados ao trigger `on_auth_user_created`
3. Verifique se há erros de permissão (RLS, SECURITY DEFINER)
4. Entre em contato com o suporte com:
   - ID do usuário
   - Email usado no cadastro
   - Mensagens de erro do console
