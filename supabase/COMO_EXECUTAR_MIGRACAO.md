# Como Executar a Migração no Supabase

## ⚠️ Importante

O comando `\i` é específico do cliente `psql` e **NÃO funciona** no Supabase Dashboard SQL Editor.

## 📋 Opções para Executar a Migração

### Opção 1: Supabase Dashboard (Recomendado)

1. Acesse o **Supabase Dashboard** do seu projeto
2. Vá em **SQL Editor** (no menu lateral)
3. Clique em **New Query**
4. Abra o arquivo `supabase/migration_add_plan_voice_chat_controls.sql`
5. **Copie TODO o conteúdo** do arquivo
6. **Cole no editor SQL** do Supabase
7. Clique em **Run** ou pressione `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### Opção 2: Supabase CLI (Se você usa CLI)

Se você tem o Supabase CLI instalado e configurado:

```bash
# Navegar até a pasta do projeto
cd D:\FitCoach.IA

# Executar a migração
supabase db push
```

Ou se você tem migrations configuradas:

```bash
supabase migration up
```

### Opção 3: Executar Comandos Individualmente

Se preferir executar em partes, você pode copiar e executar cada seção separadamente:

1. **Primeiro**: Adicionar campos na tabela `users`
2. **Segundo**: Criar tabela `coupons`
3. **Terceiro**: Criar funções SQL
4. **Quarto**: Criar índices

## ✅ Verificar se a Migração Funcionou

Após executar, verifique se os campos foram criados:

```sql
-- Verificar campos na tabela users
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN (
    'plan_type', 
    'subscription_status', 
    'expiry_date',
    'voice_daily_limit_seconds',
    'voice_used_today_seconds',
    'voice_balance_upsell',
    'last_usage_date',
    'text_msg_count_today',
    'last_msg_date'
  );

-- Verificar se a tabela coupons foi criada
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'coupons';

-- Verificar se as funções foram criadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'validate_and_apply_coupon',
    'reset_daily_counters'
  );
```

## 🔧 Solução de Problemas

### Erro: "column already exists"
Se você já executou parte da migração antes, pode ignorar esses erros ou usar `IF NOT EXISTS` (já incluído no script).

### Erro: "permission denied"
Certifique-se de estar usando uma conta com permissões de administrador no Supabase.

### Erro: "syntax error"
- Verifique se copiou TODO o conteúdo do arquivo
- Certifique-se de que não há caracteres especiais ou encoding incorreto
- Tente executar em partes menores

## 📝 Nota

O arquivo `migration_add_plan_voice_chat_controls.sql` já está preparado para ser executado diretamente no Supabase Dashboard - basta copiar e colar todo o conteúdo.

