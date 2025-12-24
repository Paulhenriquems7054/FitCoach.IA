# 🔧 Correção do Script SQL

## ❌ Problema Identificado

O script estava tentando inserir na tabela `plans`, mas a tabela correta no Supabase é `subscription_plans`.

## ✅ Correções Aplicadas

### 1. **Nome da Tabela**
- ❌ Antes: `INSERT INTO plans`
- ✅ Agora: `INSERT INTO public.subscription_plans`

### 2. **Geração de UUID**
- ❌ Antes: IDs fixos como `'ai_monthly_b2c'`
- ✅ Agora: `uuid_generate_v4()` (gera UUID automaticamente)

### 3. **Conflito de Chave Única**
- ❌ Antes: `ON CONFLICT (id)`
- ✅ Agora: `ON CONFLICT (name)` (pois `name` é UNIQUE na tabela)

### 4. **Formato de Arrays**
- ❌ Antes: `ARRAY['feature1', 'feature2']`
- ✅ Agora: `'["feature1", "feature2"]'::jsonb` (formato JSONB)

### 5. **Campos Obrigatórios**
- Adicionados: `currency`, `is_active`, `is_visible` (campos obrigatórios da tabela)

### 6. **Adição de Colunas**
- Script agora adiciona colunas de checkout ANTES de inserir os planos:
  - `plan_category`
  - `checkout_url_monthly`
  - `checkout_url_yearly`
  - `checkout_price_monthly`
  - `checkout_price_yearly`

## 📋 Estrutura da Tabela `subscription_plans`

```sql
CREATE TABLE public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10,2),
    currency TEXT DEFAULT 'BRL',
    limits JSONB,
    features JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## ✅ Como Executar

1. Abra o Supabase Dashboard
2. Vá em SQL Editor
3. Cole o conteúdo de `docs/ATUALIZACAO_PLANOS_VENDAS.sql`
4. Execute o script

O script agora deve funcionar corretamente! 🎉

---

**Última atualização**: 23/12/2025

