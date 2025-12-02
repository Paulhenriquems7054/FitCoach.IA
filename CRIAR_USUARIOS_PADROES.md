# Como Criar Usuários Padrões no Supabase

Este guia explica como criar os usuários padrões **Desenvolvedor** e **Administrador** no Supabase.

## Usuários que serão criados:

1. **Desenvolvedor**
   - Email: `dev123@fitcoach.ia`
   - Username: `dev123`
   - Senha: `dev123`
   - Role: `admin` (acesso total)

2. **Administrador**
   - Email: `admin123@fitcoach.ia`
   - Username: `admin123`
   - Senha: `admin123`
   - Role: `admin` (acesso total)

---

## Opção 1: Usar a Página Administrativa (Recomendado)

1. **Acesse a página de criação:**
   - Abra o app no navegador
   - Vá para: `http://localhost:3000/#/create-default-users`
   - Ou digite na URL: `#/create-default-users`

2. **Clique no botão "Criar Usuários Padrões"**

3. **Aguarde o resultado:**
   - A página mostrará se cada usuário foi criado com sucesso ou se houve erro

4. **Se houver erro de confirmação de email:**
   - Vá para o Supabase Dashboard
   - Acesse: **Authentication** → **Settings** → **Email Auth**
   - Desabilite temporariamente **"Confirm email"** (Enable email confirmations)
   - Tente criar os usuários novamente

---

## Opção 2: Criar Manualmente no Supabase Dashboard

### Passo 1: Criar no Authentication

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Authentication** → **Users**
4. Clique em **"Add user"** → **"Create new user"**

**Para Desenvolvedor:**
- Email: `dev123@fitcoach.ia`
- Password: `dev123`
- Auto Confirm User: **✓ Marque esta opção** (importante!)

**Para Administrador:**
- Email: `admin123@fitcoach.ia`
- Password: `admin123`
- Auto Confirm User: **✓ Marque esta opção** (importante!)

### Passo 2: Criar Perfis na Tabela `users`

1. No Supabase Dashboard, vá em **Table Editor**
2. Selecione a tabela `users`
3. Clique em **"Insert row"**

**Para Desenvolvedor:**
```json
{
  "id": "<ID_DO_USUARIO_CRIADO_NO_AUTH>",
  "nome": "Desenvolvedor",
  "username": "dev123",
  "email": "dev123@fitcoach.ia",
  "idade": 30,
  "genero": "Masculino",
  "peso": 0,
  "altura": 0,
  "objetivo": "perder peso",
  "points": 0,
  "discipline_score": 0,
  "completed_challenge_ids": [],
  "is_anonymized": false,
  "role": "professional",
  "gym_role": "admin",
  "gym_id": null,
  "is_gym_managed": false,
  "plan_type": "monthly",
  "subscription_status": "active",
  "data_permissions": {
    "allowWeightHistory": true,
    "allowMealPlans": true,
    "allowPhotoAnalysis": true,
    "allowWorkoutData": true,
    "allowChatHistory": true
  },
  "security_settings": {
    "biometricEnabled": false,
    "securityNotifications": true
  },
  "access_blocked": false,
  "voice_daily_limit_seconds": 999999,
  "voice_used_today_seconds": 0,
  "voice_balance_upsell": 0,
  "text_msg_count_today": 0
}
```

**Para Administrador:**
```json
{
  "id": "<ID_DO_USUARIO_CRIADO_NO_AUTH>",
  "nome": "Administrador",
  "username": "admin123",
  "email": "admin123@fitcoach.ia",
  "idade": 30,
  "genero": "Masculino",
  "peso": 0,
  "altura": 0,
  "objetivo": "perder peso",
  "points": 0,
  "discipline_score": 0,
  "completed_challenge_ids": [],
  "is_anonymized": false,
  "role": "professional",
  "gym_role": "admin",
  "gym_id": null,
  "is_gym_managed": false,
  "plan_type": "monthly",
  "subscription_status": "active",
  "data_permissions": {
    "allowWeightHistory": true,
    "allowMealPlans": true,
    "allowPhotoAnalysis": true,
    "allowWorkoutData": true,
    "allowChatHistory": true
  },
  "security_settings": {
    "biometricEnabled": false,
    "securityNotifications": true
  },
  "access_blocked": false,
  "voice_daily_limit_seconds": 999999,
  "voice_used_today_seconds": 0,
  "voice_balance_upsell": 0,
  "text_msg_count_today": 0
}
```

**Importante:** Substitua `<ID_DO_USUARIO_CRIADO_NO_AUTH>` pelo ID real do usuário criado no passo 1 (você encontra esse ID em **Authentication** → **Users**).

---

## Opção 3: Usar SQL no Supabase SQL Editor (Recomendado)

Esta é a forma mais rápida e confiável:

### Método Simplificado (Recomendado)

1. **Primeiro, crie os usuários no auth via Dashboard:**
   - Vá em **Authentication** → **Users** → **Add user** → **Create new user**
   - Crie:
     - **Desenvolvedor**: Email `dev123@fitcoach.ia`, Senha `dev123`, **marque "Auto Confirm User"**
     - **Administrador**: Email `admin123@fitcoach.ia`, Senha `admin123`, **marque "Auto Confirm User"**

2. **Depois, execute o script SQL:**
   - No Supabase Dashboard, vá em **SQL Editor**
   - Abra o arquivo: `supabase/create_default_users_simple.sql`
   - Cole o conteúdo e execute (Run)
   - O script criará os perfis na tabela `users` automaticamente

### Método Completo (Avançado)

Se você tem permissões de service_role ou superuser:

1. No Supabase Dashboard, vá em **SQL Editor**
2. Abra o arquivo: `supabase/create_default_users.sql`
3. Cole o conteúdo e execute (Run)
4. Este script tenta criar tanto os usuários no auth quanto os perfis

### Script SQL Manual (Alternativa)

Se preferir copiar e colar diretamente, use o script abaixo (substitua os IDs pelos IDs reais dos usuários criados no auth):

```sql
-- Primeiro, crie os usuários no auth.users via Dashboard ou API
-- Depois, insira os perfis na tabela users:

-- Para Desenvolvedor (substitua 'USER_ID_DEV' pelo ID real)
INSERT INTO users (
  id, nome, username, email, idade, genero, peso, altura, objetivo,
  points, discipline_score, completed_challenge_ids, is_anonymized,
  role, gym_role, gym_id, is_gym_managed,
  plan_type, subscription_status,
  data_permissions, security_settings, access_blocked,
  voice_daily_limit_seconds, voice_used_today_seconds, voice_balance_upsell, text_msg_count_today
) VALUES (
  'USER_ID_DEV', -- Substitua pelo ID real
  'Desenvolvedor',
  'dev123',
  'dev123@fitcoach.ia',
  30,
  'Masculino',
  0,
  0,
  'perder peso',
  0,
  0,
  '[]',
  false,
  'professional',
  'admin',
  null,
  false,
  'monthly',
  'active',
  '{"allowWeightHistory": true, "allowMealPlans": true, "allowPhotoAnalysis": true, "allowWorkoutData": true, "allowChatHistory": true}'::jsonb,
  '{"biometricEnabled": false, "securityNotifications": true}'::jsonb,
  false,
  999999,
  0,
  0,
  0
) ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  username = EXCLUDED.username,
  gym_role = EXCLUDED.gym_role,
  plan_type = EXCLUDED.plan_type,
  subscription_status = EXCLUDED.subscription_status;

-- Para Administrador (substitua 'USER_ID_ADMIN' pelo ID real)
INSERT INTO users (
  id, nome, username, email, idade, genero, peso, altura, objetivo,
  points, discipline_score, completed_challenge_ids, is_anonymized,
  role, gym_role, gym_id, is_gym_managed,
  plan_type, subscription_status,
  data_permissions, security_settings, access_blocked,
  voice_daily_limit_seconds, voice_used_today_seconds, voice_balance_upsell, text_msg_count_today
) VALUES (
  'USER_ID_ADMIN', -- Substitua pelo ID real
  'Administrador',
  'admin123',
  'admin123@fitcoach.ia',
  30,
  'Masculino',
  0,
  0,
  'perder peso',
  0,
  0,
  '[]',
  false,
  'professional',
  'admin',
  null,
  false,
  'monthly',
  'active',
  '{"allowWeightHistory": true, "allowMealPlans": true, "allowPhotoAnalysis": true, "allowWorkoutData": true, "allowChatHistory": true}'::jsonb,
  '{"biometricEnabled": false, "securityNotifications": true}'::jsonb,
  false,
  999999,
  0,
  0,
  0
) ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  username = EXCLUDED.username,
  gym_role = EXCLUDED.gym_role,
  plan_type = EXCLUDED.plan_type,
  subscription_status = EXCLUDED.subscription_status;
```

---

## Verificar se funcionou

1. Faça logout do app (se estiver logado)
2. Na tela de login, tente entrar com:
   - Usuário: `dev123` ou `dev` ou `Desenvolvedor`
   - Senha: `dev123`
3. Você deve conseguir entrar e ter acesso total como admin/premium

---

## Troubleshooting

### Erro: "User already registered"
- O usuário já existe no auth. Use a página administrativa para atualizar o perfil, ou crie manualmente o perfil na tabela `users`.

### Erro: "Email not confirmed"
- Desabilite temporariamente a confirmação de email no Supabase Dashboard:
  - **Authentication** → **Settings** → **Email Auth** → Desmarque **"Enable email confirmations"**

### Erro: "RLS policy violation"
- Verifique se as políticas RLS da tabela `users` permitem inserção/atualização. Você pode temporariamente desabilitar RLS para criar os usuários padrões.

### Usuário criado mas não consegue fazer login
- Verifique se o `id` na tabela `users` corresponde ao `id` do usuário em `auth.users`
- Verifique se o `username` está correto
- Tente fazer login usando o **email** em vez do username

---

## Notas Importantes

- Os usuários padrões têm acesso **total** ao sistema (admin + premium)
- Eles não precisam de assinatura ativa para ter acesso premium (o código trata isso especialmente)
- Use esses usuários apenas para desenvolvimento e testes
- **NÃO** use essas credenciais em produção sem alterar as senhas!

