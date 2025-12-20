# 🔧 Instruções de Migração - Sistema de Pagamentos

## ⚠️ Problema: Tabela `payments` já existe sem colunas necessárias

Se você recebeu o erro:
```
ERROR: 42703: column "external_payment_id" does not exist
```

Isso significa que a tabela `payments` já existe no seu Supabase, mas sem todas as colunas necessárias.

## ✅ Solução

### Opção 1: Usar Script de Migração (RECOMENDADO)

Execute o script de migração que adiciona apenas as colunas faltantes:

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `docs/SUPABASE_MIGRATION_PAGAMENTOS.sql`
4. Clique em **Run**

Este script:
- ✅ Verifica se cada coluna existe antes de adicionar
- ✅ Adiciona apenas as colunas faltantes
- ✅ Não afeta dados existentes
- ✅ Cria índices e constraints necessários
- ✅ Configura RLS (Row Level Security)

### Opção 2: Recriar Tabela (CUIDADO - Perde dados)

⚠️ **ATENÇÃO**: Isso vai **DELETAR** todos os dados da tabela `payments`!

Se você não tem dados importantes na tabela `payments`, pode recriá-la:

```sql
-- 1. Deletar tabela existente
DROP TABLE IF EXISTS payments CASCADE;

-- 2. Executar script completo
-- Cole o conteúdo de SUPABASE_SCHEMA_PAGAMENTOS.sql
```

## 📋 Checklist de Verificação

Após executar a migração, verifique se todas as colunas foram criadas:

```sql
-- Verificar estrutura da tabela payments
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payments'
ORDER BY ordinal_position;
```

Você deve ver estas colunas:
- ✅ `id` (uuid)
- ✅ `user_id` (uuid)
- ✅ `external_payment_id` (text) ← **Esta é a que estava faltando**
- ✅ `amount` (numeric)
- ✅ `currency` (text)
- ✅ `status` (text)
- ✅ `payment_provider` (text)
- ✅ `payment_type` (text)
- ✅ `metadata` (jsonb)
- ✅ `created_at` (timestamptz)
- ✅ `updated_at` (timestamptz)

## 🔍 Verificar Índices

```sql
-- Verificar índices da tabela payments
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'payments';
```

Você deve ver:
- ✅ `idx_payments_user_id`
- ✅ `idx_payments_external_id` ← **Importante para webhooks**
- ✅ `idx_payments_status`

## ✅ Testar

Após a migração, teste se está funcionando:

```sql
-- Teste simples: inserir um registro de teste
INSERT INTO payments (user_id, external_payment_id, amount, status, payment_type)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid, -- Substitua por um user_id válido
  'test_payment_123',
  10.00,
  'pending',
  'subscription'
);

-- Verificar se foi criado
SELECT * FROM payments WHERE external_payment_id = 'test_payment_123';

-- Limpar teste
DELETE FROM payments WHERE external_payment_id = 'test_payment_123';
```

## 🚨 Problemas Comuns

### Erro: "column already exists"
- ✅ Normal! Significa que a coluna já existe
- O script continua e adiciona apenas as faltantes

### Erro: "constraint already exists"
- ✅ Normal! Significa que a constraint já existe
- O script verifica antes de criar

### Erro: "permission denied"
- Verifique se está usando a chave `service_role_key` no backend
- Ou execute como superuser no Supabase

## 📞 Próximos Passos

Após a migração bem-sucedida:

1. ✅ Verificar se todas as colunas foram criadas
2. ✅ Testar inserção de um pagamento de teste
3. ✅ Configurar webhook na Cakto
4. ✅ Testar fluxo completo de pagamento

---

**Última atualização:** 2025-01-27

