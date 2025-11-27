# 📋 Guia da Página de Venda - FitCoach.IA Premium

## 🎯 O que é a Página de Venda?

A página de venda (`/premium`) é onde os usuários podem visualizar e assinar os planos pagos do FitCoach.IA. Ela exibe os planos disponíveis, suas características e links para pagamento.

## 📍 Como Acessar

A página pode ser acessada de duas formas:

1. **URL direta**: `http://localhost:3000/#/premium`
2. **Navegação interna**: Clique em "Fazer Upgrade para Premium" quando aparecer um bloqueio de recurso premium

## 🔧 O que a Página Faz Automaticamente

### 1. **Carrega Planos do Banco de Dados**
- Busca os planos cadastrados na tabela `subscription_plans` do Supabase
- Filtra apenas os planos: `basic`, `premium` e `enterprise` (exclui `free`)
- Exibe informações de cada plano:
  - Nome e descrição
  - Preço mensal
  - Lista de recursos/features
  - Limites de uso

### 2. **Verifica Assinatura Ativa**
- Verifica se o usuário já tem uma assinatura ativa
- Se tiver assinatura:
  - Mostra mensagem de sucesso
  - Exibe botões para acessar recursos premium
  - Não mostra os planos de venda
- Se não tiver:
  - Mostra todos os planos disponíveis para compra

### 3. **Exibe Planos de Assinatura**

A página mostra 3 planos:

#### 📦 **Basic** (R$ 29,90/mês)
- Treinos Personalizados
- Nutrição Básica
- Suporte por Email
- Link de pagamento: `https://pay.cakto.com.br/3bewmsy_665747`

#### ⭐ **Premium** (R$ 59,90/mês) - **Mais Popular**
- Tudo do Basic
- Nutrição Avançada + Receitas
- Análise de Desempenho IA
- Suporte Prioritário
- Link de pagamento: `https://pay.cakto.com.br/8djcjc6`

#### 🏢 **Enterprise** (R$ 199,90/mês)
- Para academias
- Tudo do Premium
- Gestão de Múltiplos Alunos
- Dashboard de Academia
- Suporte Dedicado 24/7
- Link de pagamento: `https://pay.cakto.com.br/35tdhxu`

## 🛠️ O que Você Precisa Fazer

### 1. **Configurar Planos no Supabase**

Os planos devem estar cadastrados na tabela `subscription_plans`. Execute o script SQL:

```sql
-- Verificar se os planos existem
SELECT * FROM public.subscription_plans 
WHERE name IN ('basic', 'premium', 'enterprise');
```

Se não existirem, eles serão criados automaticamente pelo `schema.sql` quando você executar a migração.

### 2. **Configurar Links de Pagamento (Cakto)**

Os links de pagamento estão hardcoded no código. Para alterá-los, edite o arquivo `pages/PremiumPage.tsx`:

```typescript
const getPaymentLink = (planName: string): string => {
    const paymentLinks: Record<string, string> = {
        'basic': 'https://pay.cakto.com.br/SEU_LINK_BASIC',
        'premium': 'https://pay.cakto.com.br/SEU_LINK_PREMIUM',
        'enterprise': 'https://pay.cakto.com.br/SEU_LINK_ENTERPRISE'
    };
    return paymentLinks[planName] || '#';
};
```

**Como obter os links:**
1. Acesse o painel do Cakto
2. Crie um produto para cada plano
3. Copie o link de pagamento gerado
4. Cole no código acima

### 3. **Configurar Webhook do Cakto**

O webhook do Cakto deve estar configurado para:
- Receber notificações de pagamento
- Criar/atualizar assinatura no Supabase
- Criar usuário se não existir

**Arquivo do webhook**: `supabase/functions/cakto-webhook/index.ts`

**URL do webhook**: Configure no painel do Cakto apontando para:
```
https://seu-projeto.supabase.co/functions/v1/cakto-webhook
```

### 4. **Testar o Fluxo Completo**

1. **Acesse a página**: `http://localhost:3000/#/premium`
2. **Verifique se os planos aparecem**:
   - Se não aparecerem, verifique se estão no banco de dados
   - Se aparecerem, verifique se os preços estão corretos
3. **Clique em "Assinar Premium"**:
   - Deve abrir o link do Cakto em nova aba
   - Complete o pagamento de teste
4. **Verifique se a assinatura foi criada**:
   - Após pagamento, o webhook deve criar a assinatura
   - Recarregue a página `/premium`
   - Deve mostrar "Você já tem uma assinatura ativa!"

## 📊 Estrutura de Dados

### Tabela `subscription_plans`

```sql
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY,
    name TEXT UNIQUE, -- 'basic', 'premium', 'enterprise'
    display_name TEXT, -- 'Basic', 'Premium', 'Enterprise'
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    limits JSONB, -- Limites de uso
    features JSONB, -- Lista de recursos
    is_active BOOLEAN,
    is_visible BOOLEAN
);
```

### Tabela `user_subscriptions`

```sql
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    plan_id UUID REFERENCES subscription_plans(id),
    status TEXT, -- 'active', 'canceled', 'expired'
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ
);
```

## 🔄 Fluxo de Compra

1. **Usuário acessa `/premium`**
   - Página carrega planos do banco
   - Verifica se já tem assinatura

2. **Usuário escolhe um plano**
   - Clica em "Assinar [Nome do Plano]"
   - Abre link do Cakto em nova aba

3. **Usuário completa pagamento no Cakto**
   - Preenche dados de pagamento
   - Confirma pagamento

4. **Cakto envia webhook para Supabase**
   - Webhook recebe dados do pagamento
   - Cria/atualiza usuário no Supabase
   - Cria assinatura ativa

5. **Usuário retorna ao app**
   - Página `/premium` detecta assinatura ativa
   - Mostra mensagem de sucesso
   - Usuário pode acessar recursos premium

## ⚙️ Personalização

### Alterar Features dos Planos

Edite a função `getPlanFeatures()` em `pages/PremiumPage.tsx`:

```typescript
const getPlanFeatures = (planName: string): string[] => {
    const planFeatures: Record<string, string[]> = {
        'basic': [
            'Sua feature 1',
            'Sua feature 2',
            // ...
        ],
        // ...
    };
    return planFeatures[planName] || [];
};
```

### Alterar Preços

Os preços vêm do banco de dados. Para alterar:

```sql
UPDATE public.subscription_plans
SET price_monthly = 39.90
WHERE name = 'premium';
```

### Alterar Descrições

```sql
UPDATE public.subscription_plans
SET description = 'Nova descrição do plano'
WHERE name = 'premium';
```

## 🐛 Troubleshooting

### Planos não aparecem
- ✅ Verifique se os planos existem no banco: `SELECT * FROM subscription_plans;`
- ✅ Verifique se `is_active = true` e `is_visible = true`
- ✅ Verifique se os nomes são exatamente: `'basic'`, `'premium'`, `'enterprise'`

### Assinatura não é detectada
- ✅ Verifique se o webhook está funcionando
- ✅ Verifique se a assinatura foi criada: `SELECT * FROM user_subscriptions WHERE user_id = '...';`
- ✅ Verifique se `status = 'active'`
- ✅ Verifique se o `username` do usuário está correto no Supabase

### Link de pagamento não funciona
- ✅ Verifique se o link do Cakto está correto
- ✅ Teste o link diretamente no navegador
- ✅ Verifique se o produto está ativo no Cakto

## 📝 Checklist de Configuração

- [ ] Planos cadastrados no Supabase (`subscription_plans`)
- [ ] Links de pagamento configurados no código
- [ ] Webhook do Cakto configurado e funcionando
- [ ] Teste de compra realizado com sucesso
- [ ] Assinatura sendo criada automaticamente após pagamento
- [ ] Página detectando assinatura ativa corretamente

## 🎨 Customização Visual

A página usa Tailwind CSS e pode ser personalizada editando as classes em `pages/PremiumPage.tsx`:

- **Cores**: Altere as classes `bg-primary-600`, `text-amber-500`, etc.
- **Layout**: Modifique o grid e espaçamentos
- **Ícones**: Substitua os ícones importados
- **Animações**: Adicione ou remova classes de animação

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs do console do navegador
2. Verifique os logs do Supabase (Dashboard > Logs)
3. Verifique se o webhook está recebendo requisições
4. Teste cada etapa do fluxo individualmente

