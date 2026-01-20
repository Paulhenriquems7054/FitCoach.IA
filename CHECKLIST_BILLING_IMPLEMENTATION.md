# ✅ CHECKLIST - Sistema de Billing Automático

Data: 17/01/2026  
Status: Implementação em andamento

---

## 📋 FASE 1: Setup do Banco de Dados (Supabase)

- [ ] **1.1** Acessar Supabase SQL Editor
- [ ] **1.2** Copiar arquivo: `supabase/migrations/001_create_billing_system.sql`
- [ ] **1.3** Colar e executar SQL no Supabase
- [ ] **1.4** Verificar criação de todas as 9 tabelas
  - [ ] plans
  - [ ] subscriptions
  - [ ] usage_tracking
  - [ ] spending_logs
  - [ ] spending_analysis
  - [ ] email_templates
  - [ ] email_queue
  - [ ] invoices
  - [ ] usage_alerts
- [ ] **1.5** Verificar dados seed (3 planos inseridos)
  ```sql
  SELECT * FROM plans;
  ```
- [ ] **1.6** Verificar templates de email criados
  ```sql
  SELECT COUNT(*) FROM email_templates;
  ```
- [ ] **1.7** Verificar RLS policies habilitadas
  ```sql
  SELECT * FROM pg_policies WHERE schemaname = 'public';
  ```

---

## 🔧 FASE 2: Configuração N8N

### 2A - Verificação de Limite de Uso

- [ ] **2A.1** Copiar: `n8n-workflows/workflow-billing-limit-check.json`
- [ ] **2A.2** Acessar N8N: https://agentesiaphbb.app.n8n.cloud
- [ ] **2A.3** Criar novo workflow ("+" → "Importar")
- [ ] **2A.4** Colar JSON e importar
- [ ] **2A.5** Configurar credenciais Supabase
  - [ ] Host: `seu-projeto.supabase.co`
  - [ ] User: `postgres`
  - [ ] Password: (sua senha master)
  - [ ] Database: `postgres`
- [ ] **2A.6** Testar conexão (clique em "Teste")
- [ ] **2A.7** Ativar workflow (menu "..." → "Ativar")
- [ ] **2A.8** Verificar se mostra "Active" e schedule "Daily"

### 2B - Processador de Fila de Email

- [ ] **2B.1** Copiar: `n8n-workflows/workflow-email-processor.json`
- [ ] **2B.2** Importar novo workflow no N8N
- [ ] **2B.3** Configurar credenciais Supabase (mesmo de 2A.5)
- [ ] **2B.4** Configurar credenciais SendGrid
  - [ ] Obter API Key: https://app.sendgrid.com/settings/api_keys
  - [ ] No N8N: Credencial nova → SendGrid
  - [ ] Colar API Key
- [ ] **2B.5** Testar node "SendGrid: Enviar Email"
- [ ] **2B.6** Ativar workflow
- [ ] **2B.7** Verificar se mostra "Active" e schedule "Every 5 minutes"

### 2C - Análise IA de Gastos

- [ ] **2C.1** Copiar: `n8n-workflows/workflow-ai-spending-analysis.json`
- [ ] **2C.2** Importar novo workflow no N8N
- [ ] **2C.3** Configurar credenciais Supabase
- [ ] **2C.4** Adicionar variável de ambiente: `GEMINI_API_KEY`
  - [ ] No painel Admin N8N → Settings → Variables
  - [ ] Nome: `GEMINI_API_KEY`
  - [ ] Valor: sua chave do Gemini
  - [ ] Salvar
- [ ] **2C.5** Testar node "Gemini AI: Análise de Gasto"
- [ ] **2C.6** Ativar workflow
- [ ] **2C.7** Verificar se mostra "Active" e schedule "Thursdays 10:00"

### 2D - Variáveis de Ambiente N8N

- [ ] **2D.1** Acessar Admin N8N → Settings → Variables
- [ ] **2D.2** Adicionar `SENDGRID_API_KEY`
- [ ] **2D.3** Adicionar `MAILGUN_API_KEY` (opcional, fallback)
- [ ] **2D.4** Adicionar `MAILGUN_DOMAIN` (opcional)
- [ ] **2D.5** Adicionar `GEMINI_API_KEY`
- [ ] **2D.6** Salvar todas as variáveis

---

## 💻 FASE 3: Integração Frontend (React)

### 3A - Criar Hook de Rastreamento

- [ ] **3A.1** Criar arquivo: `hooks/useSpendingTracker.ts`
- [ ] **3A.2** Implementar funções:
  - [ ] `fetchUserData()` - Carregar uso e plano
  - [ ] `trackOperation()` - Rastrear gasto
  - [ ] `isLimitExceeded()` - Verificar se passou limite
  - [ ] `isNearLimit()` - Verificar se próximo do limite
- [ ] **3A.3** Criar componente `UsageIndicator`
- [ ] **3A.4** Criar componente `SpendingReport`
- [ ] **3A.5** Testar hook em componente de teste

### 3B - Integrar em Páginas Existentes

- [ ] **3B.1** Dashboard: Adicionar `<UsageIndicator />`
  ```tsx
  import { UsageIndicator } from '@/hooks/useSpendingTracker';
  ```
- [ ] **3B.2** Dashboard: Adicionar `<SpendingReport />`
- [ ] **3B.3** Análise de Refeição: Chamar `trackOperation` após análise
- [ ] **3B.4** Chat: Chamar `trackOperation` após resposta IA
- [ ] **3B.5** Verificar se `isLimitExceeded()` bloqueia operações

### 3C - Criar Página de Planos

- [ ] **3C.1** Criar `pages/plans.tsx`
- [ ] **3C.2** Carregar plans do Supabase
- [ ] **3C.3** Exibir cards com price, features, botão upgrade
- [ ] **3C.4** Destacar plano atual do usuário
- [ ] **3C.5** Botão "Upgrade" redireciona para checkout

### 3D - Criar Página de Faturamento

- [ ] **3D.1** Criar `pages/billing.tsx`
- [ ] **3D.2** Carregar faturas do usuário
- [ ] **3D.3** Exibir histórico de invoices
- [ ] **3D.4** Link para download de PDF
- [ ] **3D.5** Opção para mudar método de pagamento

---

## 🧪 FASE 4: Testes

### 4A - Testes do Banco de Dados

- [ ] **4A.1** Verificar tabela `plans` tem 3 registros
  ```sql
  SELECT * FROM plans WHERE is_active = true;
  -- Esperado: Free, Pro, Premium
  ```

- [ ] **4A.2** Inserir subscription de teste
  ```sql
  INSERT INTO subscriptions (user_id, plan_id, current_period_start, current_period_end, renewal_type, status)
  VALUES ('user-id-teste', (SELECT id FROM plans WHERE name = 'Free'), CURRENT_DATE, CURRENT_DATE + 30, 'monthly', 'active');
  ```

- [ ] **4A.3** Verificar RLS funcionando
  ```sql
  -- Deve retornar apenas planos ativos
  SELECT * FROM plans;
  ```

- [ ] **4A.4** Testar insert em usage_tracking
  ```sql
  INSERT INTO usage_tracking (user_id, period_start, period_end, api_calls_total)
  VALUES ('user-id-teste', CURRENT_DATE, CURRENT_DATE + 30, 10);
  ```

### 4B - Testes do N8N

- [ ] **4B.1** Testar workflow de limite manualmente
  ```
  Workflow → Execute (botão play)
  Verificar: Query retorna usuários?
  ```

- [ ] **4B.2** Verificar logs de execução
  ```
  Workflow → Executions
  Deve mostrar execução diária ou manual
  ```

- [ ] **4B.3** Inserir email de teste em email_queue
  ```sql
  INSERT INTO email_queue (user_id, recipient_email, template_id, type, status)
  VALUES (
    'user-id-teste',
    'seu-email@test.com',
    (SELECT id FROM email_templates LIMIT 1),
    'test',
    'pending'
  );
  ```

- [ ] **4B.4** Aguardar 5 minutos
- [ ] **4B.5** Verificar se email foi enviado
  ```sql
  SELECT status, sent_at, error_message 
  FROM email_queue 
  WHERE recipient_email = 'seu-email@test.com';
  -- Esperado: status = 'sent' e sent_at preenchido
  ```

- [ ] **4B.6** Testar análise IA manualmente
  ```
  Workflow análise → Execute
  Verificar logs
  ```

### 4C - Testes do Frontend

- [ ] **4C.1** Acessar dashboard e verificar `<UsageIndicator />`
  - [ ] Deve exibir uso atual
  - [ ] Deve exibir barra de progresso
  - [ ] Deve exibir % de uso

- [ ] **4C.2** Acessar página de planos
  - [ ] Deve listar 3 planos
  - [ ] Deve exibir preços corretamente
  - [ ] Deve destacar plano atual

- [ ] **4C.3** Fazer requisição (análise/chat)
  - [ ] Deve chamar `trackOperation`
  - [ ] Deve incrementar uso em dashboard
  - [ ] Deve atualizar BD

- [ ] **4C.4** Testar bloqueio de limite
  - [ ] Forçar uso = 100%
  - [ ] Tentar fazer requisição
  - [ ] Deve exibir mensagem de erro
  - [ ] Deve ofercer link para upgrade

---

## 🔌 FASE 5: Integração Stripe (Opcional)

- [ ] **5A.1** Criar conta/projeto Stripe
- [ ] **5A.2** Obter API keys
  ```
  Publishable Key: pk_live_...
  Secret Key: sk_live_...
  ```

- [ ] **5A.3** Configurar webhook no Stripe
  ```
  https://seu-dominio.com/api/webhooks/stripe
  Eventos: invoice.payment_succeeded, subscription.updated
  ```

- [ ] **5A.4** Implementar página de checkout
- [ ] **5A.5** Implementar handler do webhook
- [ ] **5A.6** Testar fluxo completo de upgrade

---

## 📧 FASE 6: Emails

- [ ] **6A.1** Verificar se SendGrid está configurado
- [ ] **6A.2** Criar conta SendGrid: https://sendgrid.com
- [ ] **6A.3** Gerar API Key
- [ ] **6A.4** Adicionar domínio verificado
  ```
  Configurações → Domínios verificados
  ```

- [ ] **6A.5** Testar envio de email manualmente
  ```
  N8N → Teste nó SendGrid
  ```

- [ ] **6A.6** Monitorar bounces e complaints
  ```
  SendGrid → Logs
  ```

---

## 📊 FASE 7: Monitoramento e Logs

- [ ] **7A.1** Criar dashboard de admin
  - [ ] MRR (Monthly Recurring Revenue)
  - [ ] Usuários ativos
  - [ ] Churn rate
  - [ ] Distribuição de planos

- [ ] **7A.2** Ativar logging no N8N
  ```
  Admin → Settings → Logging
  Nível: Debug
  ```

- [ ] **7A.3** Criar alertas para erros
  - [ ] Falha ao enviar email (retentar)
  - [ ] Webhook Stripe falha
  - [ ] API Gemini indisponível

- [ ] **7A.4** Monitorar performance
  - [ ] Tempo de execução dos workflows
  - [ ] Taxa de sucesso de envio de email
  - [ ] Erros no banco de dados

---

## 🚀 FASE 8: Deploy

- [ ] **8A.1** Testar em ambiente de staging
- [ ] **8A.2** Revisar credenciais (não deve ter hardcoded)
- [ ] **8A.3** Verificar RLS policies em produção
- [ ] **8A.4** Fazer backup do banco de dados
- [ ] **8A.5** Deploy do código React
- [ ] **8A.6** Deploy dos workflows N8N
- [ ] **8A.7** Testar workflows em produção
- [ ] **8A.8** Monitorar logs por 24h

---

## 📝 Notas / Observações

```
Data de início: 17/01/2026
Data de conclusão: ___________

Problemas encontrados:
_________________________________________________________________
_________________________________________________________________

Soluções aplicadas:
_________________________________________________________________
_________________________________________________________________

Observações:
_________________________________________________________________
_________________________________________________________________
```

---

## 📞 Contatos Úteis

| Serviço | URL | Status |
|---------|-----|--------|
| Supabase SQL Editor | https://app.supabase.com | ✅ |
| N8N Cloud | https://agentesiaphbb.app.n8n.cloud | ✅ |
| SendGrid API | https://app.sendgrid.com | ✅ |
| Stripe Dashboard | https://dashboard.stripe.com | ✅ |
| Gemini AI Studio | https://aistudio.google.com/apikey | ✅ |

---

**Status Final**: [ ] Completo e Testado ✅

