# 🧹 Limpeza de Planos Antigos

## 📋 Situação Atual

No banco de dados do Supabase existem **planos antigos** que não estão na página de vendas atual:

### Planos Antigos (não estão na página de vendas):
1. **`enterprise`** - R$ 199,90/mês - Plano empresarial
2. **`basic`** - R$ 29,90/mês - Plano básico
3. **`premium`** - R$ 59,90/mês - Plano premium
4. **`free`** - R$ 0,00 - Plano gratuito (usado internamente)

### Planos Atuais (página de vendas):
✅ Todos os planos da página de vendas estão implementados:
- `monthly` (B2C)
- `annual_vip` (B2C)
- `academy_starter_mini` (B2B)
- `academy_starter` (B2B)
- `academy_growth` (B2B)
- `academy_pro` (B2B)
- `personal_team_5` (Personal)
- `personal_team_15` (Personal)

---

## 🔧 Solução Implementada

### 1. Script SQL para Ocultar Planos Antigos

**Arquivo**: `supabase/migration_ocultar_planos_antigos.sql`

Este script:
- ✅ Oculta planos antigos (`is_visible = FALSE`)
- ✅ Desativa planos antigos (`is_active = FALSE`)
- ✅ Mantém plano `free` ativo (usado internamente) mas oculto
- ✅ **NÃO deleta** os planos (mantém compatibilidade)

### 2. Verificação no Código

A função `getSubscriptionPlans()` em `services/supabaseService.ts` deve filtrar apenas planos visíveis:

```typescript
export async function getSubscriptionPlans(): Promise<...> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_visible', true)  // ✅ Filtrar apenas visíveis
    .eq('is_active', true)   // ✅ Filtrar apenas ativos
    .order('price_monthly', { ascending: true });
  // ...
}
```

---

## 📝 Como Executar

### Passo 1: Executar Migration SQL

1. Acesse o **SQL Editor** no Supabase Dashboard
2. Execute o arquivo: `supabase/migration_ocultar_planos_antigos.sql`

```sql
-- Ocultar planos antigos
UPDATE public.subscription_plans
SET is_visible = FALSE, is_active = FALSE
WHERE name IN ('enterprise', 'basic', 'premium');

-- Manter free oculto mas ativo (uso interno)
UPDATE public.subscription_plans
SET is_visible = FALSE, is_active = TRUE
WHERE name = 'free';
```

### Passo 2: Verificar Resultado

Execute esta query para verificar:

```sql
SELECT 
    name, 
    display_name, 
    is_visible, 
    is_active, 
    plan_category,
    price_monthly
FROM public.subscription_plans
ORDER BY 
    CASE plan_category
        WHEN 'b2c' THEN 1
        WHEN 'b2b' THEN 2
        WHEN 'personal' THEN 3
        ELSE 4
    END,
    price_monthly;
```

**Resultado esperado** (apenas planos visíveis):
- ✅ `monthly` (b2c) - R$ 34,90
- ✅ `annual_vip` (b2c) - R$ 297,00
- ✅ `academy_starter_mini` (b2b) - R$ 149,90
- ✅ `academy_starter` (b2b) - R$ 299,90
- ✅ `academy_growth` (b2b) - R$ 649,90
- ✅ `academy_pro` (b2b) - R$ 1.199,90
- ✅ `personal_team_5` (personal) - R$ 99,90
- ✅ `personal_team_15` (personal) - R$ 249,90

**Planos ocultos** (não aparecem):
- ❌ `enterprise` (oculto)
- ❌ `basic` (oculto)
- ❌ `premium` (oculto)
- ❌ `free` (oculto, mas ativo para uso interno)

---

## ⚠️ Importante

### Por que não deletar os planos?

1. **Compatibilidade**: Planos antigos podem estar referenciados em:
   - Assinaturas existentes (`user_subscriptions`)
   - Histórico de pagamentos
   - Códigos de ativação antigos

2. **Plano Free**: O plano `free` é usado internamente pelo sistema:
   - Usuários novos começam com `subscription: 'free'`
   - É usado como fallback quando não há assinatura ativa
   - Não deve aparecer na página de vendas, mas deve estar disponível no sistema

3. **Migração Gradual**: Se houver usuários com planos antigos, você pode:
   - Migrar gradualmente para os novos planos
   - Manter os antigos ocultos até que todos migrem
   - Depois, se necessário, deletar (com cuidado)

---

## ✅ Checklist

- [x] Script SQL criado para ocultar planos antigos
- [ ] **Executar migration no Supabase** ⚠️
- [ ] Verificar se `getSubscriptionPlans()` filtra por `is_visible`
- [ ] Testar página Premium para confirmar que apenas planos corretos aparecem
- [ ] Verificar se não há quebras em assinaturas existentes

---

## 🔍 Verificação Adicional

### Verificar Assinaturas com Planos Antigos

```sql
-- Ver quantas assinaturas usam planos antigos
SELECT 
    sp.name,
    sp.display_name,
    COUNT(us.id) as total_subscriptions
FROM subscription_plans sp
LEFT JOIN user_subscriptions us ON us.plan_id = sp.id
WHERE sp.name IN ('enterprise', 'basic', 'premium')
GROUP BY sp.name, sp.display_name;
```

Se houver assinaturas ativas com planos antigos:
1. **Opção 1**: Manter planos ocultos mas ativos (recomendado)
2. **Opção 2**: Migrar usuários para planos novos
3. **Opção 3**: Criar plano de migração automática

---

**Última atualização**: 2025-01-27  
**Status**: Script criado, aguardando execução no Supabase

