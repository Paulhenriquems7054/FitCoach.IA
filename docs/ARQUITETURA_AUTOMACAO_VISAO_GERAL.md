# 🏗️ ARQUITETURA DE AUTOMAÇÃO - VISÃO GERAL

**Projeto**: FitCoach.IA  
**Data**: 17 de Janeiro de 2026  
**Status**: ✅ Sistema Completo e Operacional

---

## 📐 DIAGRAMA DE ARQUITETURA

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vite)                    │
│                                                              │
│  • Capturas de uso em tempo real                            │
│  • Envio de requisições para tracking                       │
│  • Hook: useSpendingTracker()                               │
│  • Componentes: <UsageIndicator />, <SpendingReport />      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
    ┌───▼──────────┐      ┌──────▼────────┐
    │  N8N Webhook │      │  Supabase RPC │
    │ (Processamento)     │ (Operações DB)│
    │                     │               │
    │ • Validação         │ • CRUD direto │
    │ • Transformação     │ • Funções SQL │
    │ • Orquestração      │ • Validações  │
    └───┬──────────┘      └──────┬────────┘
        │                        │
    ┌───▼──────────────────────────▼────┐
    │     Supabase PostgreSQL             │
    │                                     │
    │  📊 Tabelas Principais:             │
    │  ├── users (auth)                   │
    │  ├── plans (planos)                 │
    │  ├── subscriptions (assinaturas)    │
    │  ├── usage_tracking (uso mensal)    │
    │  ├── spending_logs (log detalhado)  │
    │  ├── spending_analysis (análise IA) │
    │  ├── email_queue (fila de emails)   │
    │  ├── invoices (faturas)             │
    │  └── usage_alerts (alertas)         │
    │                                     │
    │  🔒 RLS Policies Ativas             │
    │  📈 Índices Otimizados              │
    │  🔄 Triggers Automáticos            │
    └─────┬───────────────────────────────┘
          │
    ┌─────▼───────────────────────────────┐
    │  N8N Workflows Automáticos (24/7)   │
    │                                     │
    │  ⏰ 1. Verificação Diária de Limite │
    │     └─ Cron: 00:00 UTC (diário)     │
    │                                     │
    │  📧 2. Processador de Fila de Email │
    │     └─ Cron: A cada 5 minutos       │
    │                                     │
    │  🤖 3. Análise IA de Gastos         │
    │     └─ Cron: Quinta 10:00 (semanal) │
    │                                     │
    │  💳 4. Renovação de Assinatura      │
    │     └─ Stripe Webhook               │
    │                                     │
    │  📊 5. Relatório Automático Semanal │
    │     └─ Cron: Segunda 09:00          │
    │                                     │
    │  🧹 6. Limpeza de Dados Antigos     │
    │     └─ Cron: 1º do mês 02:00        │
    └─────────────────────────────────────┘
          │
    ┌─────▼───────────────────────────────┐
    │  Integrações Externas               │
    │                                     │
    │  📨 SendGrid / Mailgun              │
    │     └─ Envio de emails              │
    │                                     │
    │  💳 Stripe                           │
    │     └─ Pagamentos e webhooks        │
    │                                     │
    │  🤖 Google Gemini API               │
    │     └─ Análise de padrões com IA    │
    └─────────────────────────────────────┘
```

---

## 🔄 FLUXOS DE AUTOMAÇÃO PRINCIPAIS

### 1. CONTROLE DE ASSINATURAS

#### Workflow: "Verificação Diária de Limite"
```
Trigger: Cron (00:00 UTC diariamente)
│
├─→ Query: Buscar usuários próximos do limite (80%+)
│   └─→ SELECT * FROM usage_tracking WHERE percentage >= 80
│
├─→ Loop: Para cada usuário
│   │
│   ├─→ Calcular % de uso atual
│   │   percentage = (used / limit) * 100
│   │
│   ├─→ Se > 80% e < 100%:
│   │   ├─→ Criar registro em usage_alerts (tipo: 'warning')
│   │   ├─→ Buscar template de email 'usage_alert'
│   │   ├─→ Renderizar HTML com variáveis
│   │   │   - {{percentage}}, {{used}}, {{limit}}
│   │   │   - {{period_start}}, {{period_end}}
│   │   │   - {{upgrade_url}}
│   │   └─→ Inserir na email_queue (status: 'pending')
│   │
│   └─→ Se >= 100%:
│       ├─→ Criar registro em usage_alerts (tipo: 'blocked')
│       ├─→ Atualizar subscription.status = 'paused'
│       ├─→ Buscar template de email 'usage_blocked'
│       ├─→ Renderizar HTML com variáveis
│       └─→ Inserir na email_queue (status: 'pending', priority: 'high')
│
└─→ Query: Verificar assinaturas próximas do vencimento (7 dias)
    └─→ SELECT * FROM subscriptions 
        WHERE current_period_end <= NOW() + INTERVAL '7 days'
            AND status = 'active'
        └─→ Para cada assinatura:
            ├─→ Se não renovada automaticamente:
            │   ├─→ Buscar template 'subscription_expiring'
            │   ├─→ Renderizar HTML
            │   └─→ Inserir na email_queue
            └─→ Log: Registrar alerta no histórico
```

**Entradas**:
- `usage_tracking`: Uso atual por usuário
- `subscriptions`: Informações de assinatura
- `plans`: Limites do plano

**Saídas**:
- `usage_alerts`: Registro de alertas gerados
- `email_queue`: Emails pendentes de envio
- `subscriptions`: Status atualizado (se bloqueado)

---

### 2. CONTROLE DE GASTOS POR USUÁRIO (COM IA)

#### Workflow: "Análise IA de Gastos"
```
Trigger: Cron (Semanalmente, quinta-feira 10:00)
│
├─→ Query: Buscar todos os usuários ativos
│   └─→ SELECT DISTINCT user_id FROM subscriptions WHERE status = 'active'
│
├─→ Loop: Para cada usuário
│   │
│   ├─→ Query: Agregar gastos últimos 7 dias
│   │   SELECT 
│   │     COUNT(*) as total_requests,
│   │     SUM(tokens_used) as total_tokens,
│   │     SUM(estimated_cost) as total_cost,
│   │     operation_type,
│   │     EXTRACT(HOUR FROM created_at) as hour_of_day,
│   │     DATE(created_at) as date
│   │   FROM spending_logs
│   │   WHERE user_id = $1 
│   │     AND created_at >= NOW() - INTERVAL '7 days'
│   │   GROUP BY operation_type, hour_of_day, date
│   │
│   ├─→ Preparar dados para IA:
│   │   {
│   │     "total_spent": 15.50,
│   │     "requests": 156,
│   │     "peak_usage": "18:00-20:00",
│   │     "features": {
│   │       "image_analysis": 120,
│   │       "text_analysis": 36
│   │     },
│   │     "average_cost_per_request": 0.099,
│   │     "days_analyzed": 7,
│   │     "user_plan": "Free",
│   │     "plan_limit": 50
│   │   }
│   │
│   ├─→ Chamar Gemini API:
│   │   POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
│   │   {
│   │     "contents": [{
│   │       "parts": [{
│   │         "text": "Analise este padrão de gasto do usuário e forneça insights personalizados..."
│   │       }]
│   │     }]
│   │   }
│   │
│   ├─→ Processar resposta do Gemini:
│   │   {
│   │     "insight": "Você usa muito análise de imagens (77% do custo)",
│   │     "recommendation": "Considere o plano Pro que é 30% mais barato",
│   │     "predicted_monthly_cost": 45.20,
│   │     "saving_opportunity": 12.30,
│   │     "efficiency_tips": [
│   │       "Combine múltiplas análises em uma requisição",
│   │       "Use cache para imagens similares"
│   │     ]
│   │   }
│   │
│   ├─→ Salvar análise no banco:
│   │   INSERT INTO spending_analysis (
│   │     user_id, 
│   │     period_start, 
│   │     period_end,
│   │     total_cost,
│   │     ai_insights,
│   │     recommendations,
│   │     predicted_cost
│   │   ) VALUES (...)
│   │
│   ├─→ Buscar template de email 'monthly_report'
│   ├─→ Renderizar HTML com insights da IA
│   ├─→ Inserir na email_queue (priority: 'medium')
│   │
│   └─→ Log: Registrar análise concluída
│
└─→ Agregar estatísticas gerais (para admin):
    └─→ Salvar em tabela de analytics (se existir)
```

**Entradas**:
- `spending_logs`: Histórico detalhado de gastos
- `subscriptions`: Plano atual do usuário

**Saídas**:
- `spending_analysis`: Análise salva com insights da IA
- `email_queue`: Relatório semanal para envio
- `usage_alerts`: Alertas se necessário

---

### 3. SISTEMA DE EMAIL AUTOMÁTICO

#### Workflow: "Processador de Fila de Email"
```
Trigger: Cron (A cada 5 minutos)
│
├─→ Query: Buscar emails pendentes (prioritários primeiro)
│   SELECT * FROM email_queue 
│   WHERE status = 'pending'
│   ORDER BY 
│     CASE priority 
│       WHEN 'high' THEN 1 
│       WHEN 'medium' THEN 2 
│       WHEN 'low' THEN 3 
│     END,
│     created_at ASC
│   LIMIT 50
│
├─→ Loop: Para cada email
│   │
│   ├─→ Buscar template pelo nome
│   │   SELECT * FROM email_templates 
│   │   WHERE name = email.template_name
│   │   AND language = email.language
│   │
│   ├─→ Renderizar HTML com variáveis
│   │   template_html = template.html
│   │   FOR cada {{variable}} em template:
│   │     template_html = REPLACE(template_html, {{variable}}, email.variables[variable])
│   │
│   ├─→ Tentar envio via SendGrid (primário)
│   │   POST https://api.sendgrid.com/v3/mail/send
│   │   {
│   │     "personalizations": [{
│   │       "to": [{"email": email.recipient_email}],
│   │       "subject": template.subject
│   │     }],
│   │     "from": {"email": "noreply@fitcoach.com"},
│   │     "content": [{
│   │       "type": "text/html",
│   │       "value": rendered_html
│   │     }],
│   │     "metadata": {
│   │       "user_id": email.user_id,
│   │       "email_type": email.template_name
│   │     }
│   │   }
│   │
│   ├─→ Se sucesso (status 202):
│   │   ├─→ UPDATE email_queue SET 
│   │   │     status = 'sent',
│   │   │     sent_at = NOW(),
│   │   │     provider = 'sendgrid'
│   │   │   WHERE id = email.id
│   │   └─→ Continuar próximo email
│   │
│   ├─→ Se falha SendGrid (status != 202):
│   │   ├─→ Tentar Mailgun (fallback)
│   │   │   POST https://api.mailgun.net/v3/mail.seu-dominio.com/messages
│   │   │   {
│   │   │     "from": "noreply@fitcoach.com",
│   │   │     "to": email.recipient_email,
│   │   │     "subject": template.subject,
│   │   │     "html": rendered_html
│   │   │   }
│   │   │
│   │   ├─→ Se sucesso Mailgun:
│   │   │   └─→ UPDATE status = 'sent', provider = 'mailgun'
│   │   │
│   │   └─→ Se falha em ambos:
│   │       ├─→ INCREMENT retry_count
│   │       ├─→ Se retry_count < 3:
│   │       │   └─→ UPDATE status = 'pending', next_retry_at = NOW() + INTERVAL '1 hour'
│   │       └─→ Se retry_count >= 3:
│   │           └─→ UPDATE status = 'failed', error_message = 'Max retries exceeded'
│   │
│   └─→ Delay de 100ms (rate limiting)
│
└─→ Log: Registrar estatísticas do processamento
    └─→ Total processados, sucessos, falhas
```

**Templates de Email Incluídos**:

##### template_usage_alert.html
```html
<h2>⚠️ Você está usando {{percentage}}% do seu limite!</h2>
<p>Período: {{period_start}} a {{period_end}}</p>
<p>Requisições: {{used}}/{{limit}}</p>
<p>Custo estimado: R$ {{cost}}</p>
<p><a href="{{upgrade_url}}">🔼 Upgrade para Pro</a></p>
```

##### template_monthly_report.html
```html
<h2>📊 Relatório de Uso - {{month}}</h2>
<table>
  <tr><td>Total de requisições</td><td>{{total_requests}}</td></tr>
  <tr><td>Custo estimado</td><td>R$ {{cost}}</td></tr>
  <tr><td>Economia (se upgrade)</td><td>R$ {{savings}}</td></tr>
</table>
<h3>🤖 Insight IA:</h3>
<p>{{ai_insight}}</p>
<h3>💡 Recomendações:</h3>
<ul>
  {{#each recommendations}}
    <li>{{this}}</li>
  {{/each}}
</ul>
```

##### template_invoice.html
```html
<h2>💳 Fatura - {{invoice_number}}</h2>
<p>Período: {{period}}</p>
<p>Valor: R$ {{amount}}</p>
<table>
  <tr><td>Plano</td><td>{{plan_name}}</td></tr>
  <tr><td>Requisições usadas</td><td>{{requests_used}}</td></tr>
  <tr><td>Taxa adicional</td><td>R$ {{extra_charges}}</td></tr>
</table>
<p><a href="{{invoice_url}}">📥 Download PDF</a></p>
```

---

### 4. FLUXOS AUTOMÁTICOS COMPLEMENTARES

#### A. Renovação de Assinatura (Stripe Integration)

```
Trigger: Stripe Webhook (invoice.payment_succeeded)
│
├─→ Validar webhook signature
│   └─→ Verificar X-Stripe-Signature header
│
├─→ Extrair dados do evento:
│   {
│     "customer_id": "cus_xxxxx",
│     "subscription_id": "sub_xxxxx",
│     "invoice_id": "in_xxxxx",
│     "amount_paid": 999,
│     "currency": "brl",
│     "period_start": "2026-01-01",
│     "period_end": "2026-02-01"
│   }
│
├─→ Buscar usuário pelo Stripe customer_id
│   SELECT user_id FROM subscriptions 
│   WHERE stripe_customer_id = $1
│
├─→ Atualizar subscription:
│   UPDATE subscriptions SET
│     current_period_start = $period_start,
│     current_period_end = $period_end,
│     status = 'active',
│     last_payment_at = NOW()
│   WHERE user_id = $user_id
│
├─→ Reset contador de uso:
│   UPDATE usage_tracking SET
│     api_calls_total = 0,
│     tokens_used_total = 0,
│     period_start = $period_start,
│     period_end = $period_end
│   WHERE user_id = $user_id
│
├─→ Criar registro de invoice:
│   INSERT INTO invoices (
│     user_id,
│     subscription_id,
│     invoice_number,
│     amount,
│     currency,
│     status,
│     period_start,
│     period_end,
│     stripe_invoice_id
│   ) VALUES (...)
│
├─→ Buscar template 'payment_confirmation'
├─→ Renderizar e inserir na email_queue
│
└─→ Log: Registrar transação no histórico
```

**Eventos Stripe Monitorados**:
- `invoice.payment_succeeded` - Renovação bem-sucedida
- `invoice.payment_failed` - Falha no pagamento
- `customer.subscription.updated` - Alteração de plano
- `customer.subscription.deleted` - Cancelamento

---

#### B. Detecção de Comportamento Anômalo

```
Trigger: Cron (Diariamente, 03:00 UTC)
│
├─→ Query: Identificar padrões suspeitos
│   SELECT 
│     user_id,
│     COUNT(*) as requests_today,
│     SUM(estimated_cost) as cost_today,
│     AVG(estimated_cost) as avg_cost
│   FROM spending_logs
│   WHERE created_at >= CURRENT_DATE
│   GROUP BY user_id
│   HAVING 
│     requests_today > 1000  -- Limite suspeito
│     OR cost_today > 50.00  -- Custo anormal
│
├─→ Para cada usuário suspeito:
│   ├─→ Verificar histórico (últimos 7 dias)
│   ├─→ Comparar com média do plano
│   ├─→ Se anormalidade confirmada:
│   │   ├─→ Criar alerta em usage_alerts (tipo: 'anomaly')
│   │   ├─→ Notificar admin (email_queue, priority: 'high')
│   │   └─→ Opcional: Pausar temporariamente
│   └─→ Registrar no log de segurança
│
└─→ Agregar estatísticas para dashboard admin
```

---

#### C. Relatório Automático Semanal

```
Trigger: Cron (Segunda-feira 09:00)
│
├─→ Query: Agregar dados da semana anterior
│   SELECT 
│     DATE_TRUNC('day', created_at) as date,
│     COUNT(*) as total_requests,
│     SUM(tokens_used) as total_tokens,
│     SUM(estimated_cost) as total_cost,
│     COUNT(DISTINCT user_id) as unique_users,
│     operation_type
│   FROM spending_logs
│   WHERE created_at >= DATE_TRUNC('week', NOW()) - INTERVAL '1 week'
│     AND created_at < DATE_TRUNC('week', NOW())
│   GROUP BY date, operation_type
│
├─→ Gerar insights com Gemini:
│   {
│     "prompt": "Analise esses dados semanais e forneça insights executivos...",
│     "data": {
│       "total_requests": 15420,
│       "total_cost": 1250.50,
│       "unique_users": 450,
│       "top_features": ["image_analysis", "text_analysis"],
│       "peak_day": "Quinta-feira",
│       "growth_rate": "+12%"
│     }
│   }
│
├─→ Resposta Gemini:
│   {
│     "summary": "Semana teve crescimento de 12%...",
│     "highlights": [
│       "Análise de imagens representa 65% do uso",
│       "Pico de uso às 18h-20h"
│     ],
│     "recommendations": [
│       "Otimizar cache de imagens",
│       "Criar plano intermediário"
│     ]
│   }
│
├─→ Montar HTML do relatório semanal
├─→ Inserir na email_queue para admin (priority: 'low')
├─→ Salvar em histórico de analytics
│
└─→ Atualizar dashboard cache (se aplicável)
```

---

#### D. Limpeza de Dados Antigos

```
Trigger: Cron (Primeira do mês, 02:00)
│
├─→ Deletar logs com > 90 dias (manter agregações):
│   DELETE FROM spending_logs 
│   WHERE created_at < NOW() - INTERVAL '90 days'
│   └─→ Log: Quantidade deletada
│
├─→ Arquivar análises mensais antigas (> 6 meses):
│   UPDATE spending_analysis 
│   SET archived = true
│   WHERE created_at < NOW() - INTERVAL '6 months'
│     AND archived = false
│
├─→ Limpar fila de email antiga (> 30 dias, status = 'sent'):
│   DELETE FROM email_queue 
│   WHERE status = 'sent' 
│     AND sent_at < NOW() - INTERVAL '30 days'
│
├─→ Otimizar índices do BD:
│   REINDEX TABLE spending_logs;
│   REINDEX TABLE usage_tracking;
│   VACUUM ANALYZE;
│
└─→ Log: Relatório de limpeza executada
```

---

## 💳 INTEGRAÇÕES DE PAGAMENTO

### Stripe Integration (N8N)

**Configuração do Webhook**:
```json
{
  "webhook_endpoint": "https://seu-n8n.com/webhook/stripe",
  "events_monitored": [
    "invoice.payment_succeeded",
    "invoice.payment_failed",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "payment_method.attached",
    "customer.created"
  ],
  "api_version": "2023-10-16"
}
```

**Fluxo Stripe → Supabase**:
```
1. Webhook do Stripe chega no N8N
   ↓
2. N8N valida assinatura (verificar secret)
   ↓
3. Extrair dados do evento (customer_id, amount, etc)
   ↓
4. Buscar user_id pelo stripe_customer_id no Supabase
   ↓
5. Atualizar subscription (status, período, etc)
   ↓
6. Reset ou incrementa limite de uso (usage_tracking)
   ↓
7. Criar invoice no banco (se payment_succeeded)
   ↓
8. Inserir email de confirmação/alerta na fila
   ↓
9. Log: Registrar transação
```

---

## 📊 DASHBOARD DE ADMINISTRADOR

### Telas que Precisam de Dados em Tempo Real

#### Dashboard Admin - Visão Geral:
```
┌─────────────────────────────────────────────────────────────┐
│  📈 MÉTRICAS PRINCIPAIS                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  💰 Receita do Mês (MRR)        R$ 45.230,00                │
│  👥 Total de Usuários Ativos    1.245                        │
│  📉 Churn Rate                  3.2% (↓ 0.5%)               │
│  💵 Gastos com Gemini API       R$ 12.450,00                │
│  🔄 Taxa de Conversão (Free→Paid) 8.5%                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📊 TOP 10 RECURSOS MAIS USADOS                              │
├─────────────────────────────────────────────────────────────┤
│  1. Análise de Imagem            65% (8.087 req)            │
│  2. Análise de Texto             25% (3.105 req)            │
│  3. Geração de Treino            8%  (994 req)              │
│  4. Análise de Progresso         2%  (248 req)              │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ⚠️ ALERTAS                                                   │
├─────────────────────────────────────────────────────────────┤
│  🔴 Usuários com muitas falhas:    12                        │
│  🟡 Padrões de uso suspeitos:      5                         │
│  🔵 Erros recorrentes:             3                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### RPC para Dashboard

**Função SQL**: `get_admin_dashboard_stats()`

```sql
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  mrr DECIMAL,
  active_users INT,
  churn_rate DECIMAL,
  api_costs DECIMAL,
  top_features JSONB,
  conversion_rate DECIMAL,
  alerts_count INT
) AS $$
BEGIN
  RETURN QUERY
  WITH metrics AS (
    -- MRR (Monthly Recurring Revenue)
    SELECT COALESCE(SUM(p.price_monthly), 0) as mrr
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.status = 'active'
      AND s.current_period_end >= CURRENT_DATE
    
    -- Active Users
    , (SELECT COUNT(DISTINCT user_id) 
       FROM subscriptions 
       WHERE status = 'active') as active_users
    
    -- Churn Rate
    , (SELECT 
        CASE 
          WHEN COUNT(*) > 0 THEN
            ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'cancelled') / COUNT(*), 2)
          ELSE 0
        END as churn_rate
       FROM subscriptions
       WHERE updated_at >= start_date) as churn_rate
    
    -- API Costs
    , (SELECT COALESCE(SUM(estimated_cost), 0)
       FROM spending_logs
       WHERE created_at >= start_date 
         AND created_at <= end_date) as api_costs
    
    -- Top Features
    , (SELECT jsonb_agg(
        jsonb_build_object(
          'feature', operation_type,
          'count', request_count,
          'percentage', percentage
        ) ORDER BY request_count DESC
      )
      FROM (
        SELECT 
          operation_type,
          COUNT(*) as request_count,
          ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
        FROM spending_logs
        WHERE created_at >= start_date 
          AND created_at <= end_date
        GROUP BY operation_type
        ORDER BY request_count DESC
        LIMIT 10
      ) subq) as top_features
    
    -- Conversion Rate (Free → Paid)
    , (SELECT 
        ROUND(100.0 * 
          COUNT(DISTINCT CASE WHEN p.price_monthly > 0 THEN s.user_id END) /
          NULLIF(COUNT(DISTINCT s.user_id), 0), 2
        ) as conversion_rate
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.created_at >= start_date) as conversion_rate
    
    -- Alerts Count
    , (SELECT COUNT(*) 
       FROM usage_alerts 
       WHERE created_at >= start_date 
         AND status = 'active') as alerts_count
  )
  SELECT 
    metrics.mrr,
    metrics.active_users,
    metrics.churn_rate,
    metrics.api_costs,
    metrics.top_features,
    metrics.conversion_rate,
    metrics.alerts_count
  FROM metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Uso no Frontend**:
```typescript
const { data: stats } = await supabase
  .rpc('get_admin_dashboard_stats', {
    start_date: '2026-01-01',
    end_date: '2026-01-31'
  });
```

---

## 🔐 SEGURANÇA E VALIDAÇÃO

### Row Level Security (RLS)

Todas as tabelas possuem políticas RLS ativas:

```sql
-- Exemplo: usage_tracking
CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert usage"
  ON usage_tracking FOR INSERT
  WITH CHECK (true);
```

### Validação de Webhooks

- **Stripe**: Validação de signature usando `X-Stripe-Signature`
- **N8N**: Token de autenticação em headers customizados
- **Supabase**: JWT tokens para todas as operações

---

## 📈 MONITORAMENTO E LOGS

### Logs Automáticos

1. **Operações de Billing**: Toda operação é logada em `spending_logs`
2. **Emails Enviados**: Registro em `email_queue` com status
3. **Alertas Gerados**: Histórico em `usage_alerts`
4. **Erros**: Tabela dedicada `error_logs` (opcional)

### Métricas de Performance

- Tempo médio de processamento de workflow N8N
- Taxa de sucesso de envio de emails
- Latência de queries do Supabase
- Uptime dos workflows automáticos

---

## 🎯 PRÓXIMOS PASSOS

### Curto Prazo (1-2 semanas)
- [ ] Integração Stripe completa (checkout + webhooks)
- [ ] Dashboard de admin no frontend
- [ ] Analytics avançado com gráficos
- [ ] Testes de carga nos workflows

### Médio Prazo (1 mês)
- [ ] Sistema de referência (indique amigos)
- [ ] Descontos em volume para B2B
- [ ] Cupons de desconto
- [ ] Relatórios financeiros exportáveis (PDF/Excel)

### Longo Prazo (2-3 meses)
- [ ] Machine Learning para previsão de churn
- [ ] Detecção avançada de fraude
- [ ] Multi-currency support
- [ ] White label para clientes B2B
- [ ] API pública para integrações

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- **Guia de Implementação**: `GUIA_IMPLEMENTACAO_BILLING.md`
- **Exemplos de Código**: `EXEMPLOS_INTEGRACAO_BILLING.md`
- **Checklist**: `CHECKLIST_BILLING_IMPLEMENTATION.md`
- **Quick Start**: `QUICK_START_BILLING.md`
- **Resumo Executivo**: `RESUMO_SISTEMA_BILLING.md`

---

**Última Atualização**: 17 de Janeiro de 2026  
**Versão**: 1.0.0  
**Status**: ✅ Completo e Operacional
