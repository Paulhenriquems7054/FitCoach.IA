# 🚀 Guia de Implementação - Sistema de Billing Automático

Data: 17/01/2026

## 📋 O Que Foi Criado

### 1️⃣ **Migration SQL** (`supabase/migrations/001_create_billing_system.sql`)

Cria 9 tabelas principais:

| Tabela | Função |
|--------|--------|
| **plans** | Planos de assinatura (Free, Pro, Premium) |
| **subscriptions** | Assinaturas dos usuários com status |
| **usage_tracking** | Rastreamento de requisições por período |
| **spending_logs** | Log detalhado de cada operação |
| **spending_analysis** | Análise IA mensal de gastos |
| **email_templates** | Templates reutilizáveis |
| **email_queue** | Fila de emails com status |
| **invoices** | Faturas geradas |
| **usage_alerts** | Alertas para notificar usuários |

### 2️⃣ **3 Workflows N8N**

#### A. **Verificação Diária de Limite** (`workflow-billing-limit-check.json`)
- ⏰ Executa: **Diariamente à 00:00 UTC**
- 🔍 Monitora usuários com uso ≥ 80%
- 📧 Envia alerta automático
- 🚫 Bloqueia acesso se ≥ 100%

#### B. **Processador de Fila de Email** (`workflow-email-processor.json`)
- ⏰ Executa: **A cada 5 minutos**
- 📤 Envia emails pendentes via SendGrid
- 🔄 Fallback para Mailgun se necessário
- 📊 Registra estatísticas de entrega

#### C. **Análise IA de Gastos** (`workflow-ai-spending-analysis.json`)
- ⏰ Executa: **Toda quinta-feira às 10:00**
- 🤖 Analisa padrões com Gemini IA
- 💡 Gera recomendações personalizadas
- 📧 Envia relatório ao usuário

---

## 🔧 PASSO A PASSO: Implementação

### **FASE 1: Preparar Supabase (30 min)**

#### 1. Conectar ao seu Supabase

```bash
# Acessar SQL Editor
https://app.supabase.com/project/seu-projeto/sql/new
```

#### 2. Copiar e executar a migration

- Abra o arquivo: `supabase/migrations/001_create_billing_system.sql`
- Copie TODO o conteúdo
- Cole no SQL Editor do Supabase
- Clique em **"Run"**

```sql
-- Se quiser testar parcialmente:
-- Executar apenas a criação de plans primeiro
SELECT * FROM plans;
```

#### 3. Verificar criação das tabelas

```sql
-- Verify tables created
\dt public.*

-- Verify data
SELECT * FROM plans;
SELECT * FROM email_templates;
```

#### 4. Habilitar RLS (Row Level Security)

⚠️ **Importante**: Algumas tabelas têm RLS habilitado automaticamente no SQL.

Se tiver erros de permissão depois, execute:

```sql
-- Grant permissions for N8N service role
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
```

---

### **FASE 2: Configurar N8N (45 min)**

#### 1. Importar Primeiro Workflow (Verificação de Limite)

```
1. Acesse: https://agentesiaphbb.app.n8n.cloud
2. Clique em "+" (novo workflow)
3. Menu: "..." → "Import"
4. Cole o conteúdo de: workflow-billing-limit-check.json
5. Clique em "Import"
```

#### 2. Configurar Credenciais Supabase

```
1. No workflow, clique em qualquer nó Supabase
2. Clique em "Add Credential"
3. Selecione "Supabase"
4. Preencha:
   - Host: seu-projeto.supabase.co
   - User: postgres
   - Password: sua-senha-master
   - Database: postgres
5. Clique em "Save"
```

#### 3. Importar Segundo Workflow (Processador de Email)

```
Repetir passos 1-2 com: workflow-email-processor.json
```

#### 4. Configurar Credenciais SendGrid

```
1. No workflow, clique no nó "SendGrid: Enviar Email"
2. Clique em "Add Credential"
3. Selecione "SendGrid"
4. Cole sua API Key do SendGrid:
   - Obter em: https://app.sendgrid.com/settings/api_keys
5. Clique em "Save"
```

#### 5. Configurar Variáveis de Ambiente N8N

```
No painel Admin do N8N:
1. Settings → Variables
2. Adicionar:
   - SENDGRID_API_KEY = sk_live_...
   - MAILGUN_API_KEY = key-...
   - MAILGUN_DOMAIN = seu-dominio.com
   - GEMINI_API_KEY = (do seu Gemini AI)
```

#### 6. Importar Terceiro Workflow (Análise IA)

```
Repetir passos 1-2 com: workflow-ai-spending-analysis.json
```

#### 7. Ativar Workflows

```
Para cada workflow:
1. Clique em "..." (menu)
2. Clique em "Activate"
3. Verifique se o status mudou para "Active"
```

---

### **FASE 3: Integração com Frontend (1 hora)**

#### 1. Criar Hook para Rastrear Uso

Arquivo: `hooks/useSpendingTracker.ts`

```typescript
import { supabase } from '@/services/supabaseClient';

export function useSpendingTracker() {
  const trackOperation = async (
    operationType: 'text_analysis' | 'image_analysis' | 'voice_analysis',
    tokensUsed: number,
    estimatedCost: number
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    // Inserir log de gasto
    await supabase.from('spending_logs').insert({
      user_id: user.id,
      operation_type: operationType,
      tokens_used: tokensUsed,
      estimated_cost: estimatedCost,
      features_used: { feature: 'value' }
    });

    // Atualizar usage_tracking
    const today = new Date();
    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const { data: existing } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', user.id)
      .eq('period_start', periodStart.toISOString().split('T')[0])
      .single();

    if (existing) {
      await supabase
        .from('usage_tracking')
        .update({
          api_calls_total: (existing.api_calls_total || 0) + 1,
          gemini_tokens: (existing.gemini_tokens || 0) + tokensUsed
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('usage_tracking').insert({
        user_id: user.id,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        api_calls_total: 1,
        gemini_tokens: tokensUsed
      });
    }
  };

  return { trackOperation };
}
```

#### 2. Chamar Hook ao Processar Requisições

```typescript
// Ao chamar Gemini API:
const { trackOperation } = useSpendingTracker();

const response = await fetch('...', {...});
const tokensUsed = response.usage?.totalTokens || 0;
const estimatedCost = (tokensUsed / 1000) * 0.00075; // Preço exemplo

await trackOperation('text_analysis', tokensUsed, estimatedCost);
```

#### 3. Exibir Uso Atual na UI

```typescript
// Adicionar componente de uso:
<UsageIndicator 
  used={usageData.api_calls_total}
  limit={planData.requests_per_month}
  percentage={(usageData.api_calls_total / planData.requests_per_month) * 100}
/>
```

---

### **FASE 4: Integrar Stripe (Opcional, 1.5 horas)**

#### 1. Criar Webhook do Stripe

```
https://dashboard.stripe.com/webhooks
```

Adicionar novo endpoint:
```
URL: https://agentesiaphbb.app.n8n.cloud/stripe-webhook
Eventos: 
  - invoice.payment_succeeded
  - customer.subscription.updated
  - customer.subscription.deleted
```

#### 2. Criar Workflow para Stripe

Criar novo workflow que:
- Receba webhook do Stripe
- Atualize status de subscription
- Resete contador de uso
- Envie confirmação de pagamento

---

## 🧪 TESTES

### Teste 1: Verificar Migration

```sql
-- No Supabase SQL Editor
SELECT * FROM plans;
-- Deve retornar Free, Pro, Premium
```

### Teste 2: Testar Fila de Email

```sql
-- Inserir email de teste
INSERT INTO email_queue (
  user_id,
  recipient_email,
  template_id,
  type,
  priority,
  status
) VALUES (
  'uuid-do-usuario',
  'test@example.com',
  (SELECT id FROM email_templates LIMIT 1),
  'test',
  1,
  'pending'
);

-- Aguardar 5 minutos para o workflow processar
-- Verificar status em:
SELECT * FROM email_queue WHERE recipient_email = 'test@example.com';
```

### Teste 3: Testar Rastreamento de Uso

```sql
-- Simular uma requisição
INSERT INTO spending_logs (
  user_id,
  operation_type,
  tokens_used,
  estimated_cost
) VALUES (
  'seu-user-id',
  'text_analysis',
  150,
  0.015
);

-- Verificar em:
SELECT * FROM spending_logs 
WHERE user_id = 'seu-user-id' 
ORDER BY created_at DESC;
```

---

## 📊 DASHBOARDS RECOMENDADOS

### Admin Dashboard (No Frontend)

```typescript
// Implementar página: /admin/billing
- MRR (Monthly Recurring Revenue)
- Total de usuários ativos
- Churn rate
- Receita por plano
- Top features utilizadas
- Alertas de problemas
```

### User Dashboard

```typescript
// Página: /dashboard
- Uso atual (progresso bar)
- Próximo reset: data
- Custo estimado do mês
- Gráfico de uso por hora
- Recomendações personalizadas
```

---

## 🔐 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

Adicionar ao arquivo `.env.local`:

```env
# Supabase (já existente)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Stripe (opcional)
VITE_STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Gemini (já existente)
VITE_GEMINI_API_KEY=AIzaSyD...

# SendGrid/Mailgun
SENDGRID_API_KEY=SG.xxxx...
MAILGUN_API_KEY=key-xxxx...
MAILGUN_DOMAIN=mail.seudominio.com

# N8N
N8N_API_URL=https://agentesiaphbb.app.n8n.cloud
N8N_API_KEY=sua-api-key
```

---

## 📞 TROUBLESHOOTING

### ❌ Erro: "Variáveis de ambiente do Supabase não configuradas"

```sql
-- Verificar RLS policies
SELECT * FROM pg_policies 
WHERE schemaname = 'public';

-- Se necessário, disable RLS temporariamente para debug:
ALTER TABLE usage_tracking DISABLE ROW LEVEL SECURITY;
```

### ❌ Erro: "Emails não estão sendo enviados"

```
1. Verificar status em: 
   SELECT * FROM email_queue WHERE status = 'failed';

2. Ver erro:
   SELECT error_message FROM email_queue WHERE id = 'xxx';

3. Se SendGrid falhar, Mailgun será fallback

4. Verificar logs no N8N:
   https://agentesiaphbb.app.n8n.cloud/workflows
```

### ❌ Workflows não estão sendo executados

```
1. Verificar se estão "Active":
   Workflow menu → Status deve ser "Active"

2. Verificar logs:
   Clique em "Executions" para ver histórico

3. Verificar credenciais Supabase:
   Nó Supabase → Edit → Testar conexão
```

---

## 🎯 PRÓXIMOS PASSOS (Após Implementação)

1. ✅ Integrar Stripe para pagamentos reais
2. ✅ Criar dashboard de admin completo
3. ✅ Implementar analytics avançado (Mixpanel/Segment)
4. ✅ Adicionar suporte a múltiplas moedas
5. ✅ Criar sistema de referência (indique 3 amigos)
6. ✅ Implementar limite de API rate per minute
7. ✅ Adicionar logs de auditoria (quem fez o quê e quando)

---

**Status**: ✅ Pronto para implementação
**Tempo estimado**: 3-4 horas (uma pessoa)
**Complexidade**: Média (requer conhecimento básico de N8N e SQL)

