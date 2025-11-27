# Controle de Planos, Voz e Chat - FitCoach.IA

## 📋 Visão Geral

Este documento descreve a estrutura do banco de dados para controle de planos, uso de voz (Gemini Live) e chat de texto no FitCoach.IA.

## 🗄️ Estrutura do Banco de Dados

### Tabela `users` - Novos Campos

#### Controle de Plano
- **`plan_type`**: Tipo de plano do usuário
  - Valores: `'free'`, `'monthly'`, `'annual'`, `'academy_starter'`, `'academy_growth'`, `'personal_team'`
  - Padrão: `'free'`
  
- **`subscription_status`**: Status da assinatura
  - Valores: `'active'`, `'inactive'`, `'expired'`
  - Padrão: `'active'`
  
- **`expiry_date`**: Data de validade do plano (TIMESTAMPTZ)
  - NULL = sem expiração

#### Controle de Voz (Gemini Live)
- **`voice_daily_limit_seconds`**: Limite diário de uso de voz em segundos
  - Padrão: `900` (15 minutos)
  
- **`voice_used_today_seconds`**: Segundos de voz usados hoje
  - Padrão: `0`
  - Resetado diariamente
  
- **`voice_balance_upsell`**: Saldo de minutos comprados à parte que não expiram
  - Padrão: `0`
  - Não é resetado diariamente
  
- **`last_usage_date`**: Data do último uso de voz (DATE)
  - Usado para resetar o contador diário

#### Controle de Chat (Texto)
- **`text_msg_count_today`**: Contador de mensagens de texto enviadas hoje
  - Padrão: `0`
  - Resetado diariamente
  
- **`last_msg_date`**: Data da última mensagem (DATE)
  - Usado para resetar o contador diário

### Tabela `coupons`

Tabela para gerenciar cupons de desconto e promoções.

#### Campos Principais
- **`code`**: Código único do cupom (ex: `'ACADEMIA-VIP'`)
  - UNIQUE, NOT NULL
  
- **`plan_linked`**: Plano que este cupom libera
  - Valores: `'free'`, `'monthly'`, `'annual'`, `'academy_starter'`, `'academy_growth'`, `'personal_team'`
  - NOT NULL
  
- **`max_uses`**: Número máximo de vezes que o cupom pode ser usado
  - Padrão: `1`
  - CHECK: `> 0`
  
- **`current_uses`**: Número atual de vezes que o cupom foi usado
  - Padrão: `0`
  - CHECK: `>= 0`
  
- **`is_active`**: Se o cupom está ativo
  - Padrão: `TRUE`
  - NOT NULL

#### Campos Opcionais
- **`description`**: Descrição do cupom
- **`discount_percentage`**: Percentual de desconto (DECIMAL 5,2)
- **`discount_amount`**: Valor fixo de desconto (DECIMAL 10,2)
- **`valid_from`**: Data de início da validade (TIMESTAMPTZ)
  - Padrão: `NOW()`
- **`valid_until`**: Data de fim da validade (TIMESTAMPTZ)
  - NULL = sem expiração
- **`created_by`**: UUID do usuário que criou o cupom
- **`metadata`**: JSONB para dados adicionais

## 🔧 Funções SQL

### `validate_and_apply_coupon(coupon_code TEXT, user_id UUID)`

Valida e aplica um cupom a um usuário.

**Retorna**: JSONB com:
- `success`: boolean
- `error`: string (se houver erro)
- `plan`: string (plano aplicado)
- `message`: string (mensagem de sucesso)

**Exemplo de uso**:
```sql
SELECT validate_and_apply_coupon('ACADEMIA-VIP', 'user-uuid-here');
```

### `reset_daily_counters()`

Reseta os contadores diários de voz e chat para todos os usuários quando a data muda.

**Recomendação**: Executar via cron job diariamente.

## 📝 Exemplos de Uso

### Verificar limite de voz
```sql
SELECT 
    voice_daily_limit_seconds,
    voice_used_today_seconds,
    voice_balance_upsell,
    (voice_daily_limit_seconds - voice_used_today_seconds) as remaining_today
FROM public.users
WHERE id = 'user-uuid';
```

### Verificar limite de chat
```sql
SELECT 
    text_msg_count_today,
    last_msg_date
FROM public.users
WHERE id = 'user-uuid';
```

### Criar um cupom
```sql
INSERT INTO public.coupons (code, plan_linked, max_uses, description)
VALUES ('ACADEMIA-VIP', 'academy_starter', 100, 'Cupom para academias parceiras');
```

### Aplicar cupom
```sql
SELECT validate_and_apply_coupon('ACADEMIA-VIP', 'user-uuid-here');
```

### Verificar status do plano
```sql
SELECT 
    plan_type,
    subscription_status,
    expiry_date,
    CASE 
        WHEN expiry_date IS NULL THEN 'Sem expiração'
        WHEN expiry_date > NOW() THEN 'Válido'
        ELSE 'Expirado'
    END as status
FROM public.users
WHERE id = 'user-uuid';
```

## 🔄 Migração

Para aplicar essas mudanças em um banco existente, execute:

```sql
\i supabase/migration_add_plan_voice_chat_controls.sql
```

Ou execute o arquivo SQL diretamente no Supabase Dashboard.

## 📊 Índices Criados

Para melhor performance, foram criados os seguintes índices:

- `idx_users_plan_type`
- `idx_users_subscription_status`
- `idx_users_expiry_date`
- `idx_users_last_usage_date`
- `idx_users_last_msg_date`
- `idx_coupons_code`
- `idx_coupons_plan_linked`
- `idx_coupons_is_active`
- `idx_coupons_valid_until`

## 🔐 Segurança

- A função `validate_and_apply_coupon` usa `SECURITY DEFINER` para garantir que tenha permissões adequadas
- Todos os campos têm constraints apropriadas (CHECK, NOT NULL, etc.)
- A tabela `coupons` tem índices únicos para garantir integridade

## 🚀 Próximos Passos

1. Implementar lógica de reset diário automático (cron job)
2. Criar endpoints da API para gerenciar cupons
3. Implementar UI para exibir limites de uso
4. Adicionar notificações quando limites estão próximos
5. Implementar sistema de compra de minutos adicionais (upsell)

