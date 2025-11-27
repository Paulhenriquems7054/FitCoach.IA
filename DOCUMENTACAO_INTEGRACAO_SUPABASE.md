# 📋 Documentação Completa: Página de Vendas Fitcoach.ia

## 📑 Índice
1. [Visão Geral da Página de Vendas](#visão-geral)
2. [Estrutura e Componentes](#estrutura-e-componentes)
3. [Funcionalidades e Fluxos](#funcionalidades-e-fluxos)
4. [Integração com Cakto (Pagamentos)](#integração-com-cakto)
5. [Estrutura do Banco de Dados Supabase](#estrutura-do-banco-de-dados)
6. [Webhooks e Automações](#webhooks-e-automações)
7. [Instruções de Implementação](#instruções-de-implementação)

---

## 🎯 Visão Geral da Página de Vendas

A página de vendas do **Fitcoach.ia** é uma landing page React/TypeScript responsiva que apresenta o produto como uma solução completa de **Nutrição + Treinos** via Inteligência Artificial. A página oferece diferentes planos para consumidores finais (B2C), academias (B2B) e personal trainers.

### Tecnologias Utilizadas
- **React 19.2.0** com TypeScript
- **Vite** como build tool
- **Tailwind CSS** para estilização
- **Lucide React** para ícones
- **Google Gemini AI** (referência no código, mas não integrado na página de vendas)

---

## 🏗️ Estrutura e Componentes

### Arquitetura de Navegação

A página utiliza um **roteamento baseado em estado** (não usa React Router), com 4 páginas principais:

1. **Home** (`activePage === 'home'`) - Landing page principal
2. **B2B** (`activePage === 'b2b'`) - Página para academias
3. **Personais** (`activePage === 'personais'`) - Página para personal trainers
4. **Recarga** (`activePage === 'recharge'`) - Página de recargas/upgrades

### Componentes Principais

#### 1. **App.tsx** (Componente Principal)
- Gerencia o estado global da aplicação
- Controla navegação entre páginas
- Gerencia tema dark/light mode
- Controla animações de logo e scroll
- Renderiza Header, Footer e conteúdo dinâmico

**Estados Principais:**
```typescript
- activePage: 'home' | 'b2b' | 'recharge' | 'personais'
- isDarkMode: boolean
- isMenuOpen: boolean
- showFloatingNav: boolean
- openFaqIndex: number | null
```

#### 2. **HomeContent** (Página Inicial)
**Seções:**
- **Hero Section**: Título principal, vídeo promocional, CTA
- **O Problema**: 3 cards explicando dores do cliente
- **A Solução**: 3 features principais (Modo Live, Visão Inteligente, Treinos Personalizados)
- **Como Funciona**: 4 passos do processo de compra
- **Pricing**: Componente de planos B2C
- **Teaser B2B**: Convite para ver soluções corporativas
- **FAQ**: Perguntas frequentes expansíveis

#### 3. **Pricing.tsx** (Planos B2C)
**Planos Disponíveis:**
- **Plano Mensal** (R$ 34,90/mês)
  - Link: `https://pay.cakto.com.br/zeygxve_668421`
  - Features: Análise ilimitada, treinos personalizados, chat ilimitado, 15min/dia de voz
- **Plano Anual VIP** (R$ 297,00/ano)
  - Link: `https://pay.cakto.com.br/wvbkepi_668441`
  - Features: Mesmas do mensal + economia de R$ 200,00

#### 4. **B2BPage.tsx** (Página para Academias)
**Planos Disponíveis:**
- **Pack Starter** (R$ 299,90/mês - 20 licenças)
  - Link: `https://pay.cakto.com.br/cemyp2n_668537`
  - Custo por aluno: R$ 14,99
- **Pack Growth** (R$ 649,90/mês - 50 licenças)
  - Link: `https://pay.cakto.com.br/vi6djzq_668541`
  - Custo por aluno: R$ 12,99
- **Pack Pro** (R$ 1.199,90/mês - 100 licenças)
  - Link: `https://pay.cakto.com.br/3dis6ds_668546`
  - Custo por aluno: R$ 11,99

**Fluxo B2B:**
1. Academia escolhe o pacote
2. Recebe um **Código Mestre** único por e-mail
3. Alunos ativam usando o código no app

#### 5. **PersonalTrainerPage.tsx** (Página para Personais)
**Planos Disponíveis:**
- **Team 5** (R$ 99,90/mês - 5 licenças)
  - Link: `https://pay.cakto.com.br/3dgheuc_666289`
  - Custo por aluno: R$ 19,98
- **Team 15** (R$ 249,90/mês - 15 licenças)
  - Link: `https://pay.cakto.com.br/3etp85e_666303`
  - Custo por aluno: R$ 16,66

#### 6. **RechargePage.tsx** (Recargas/Upgrades)
**Produtos Disponíveis:**
- **Sessão Turbo** (R$ 5,00 - +30 minutos de voz, válido 24h)
  - Link: `https://pay.cakto.com.br/ihfy8cz_668443`
- **Banco de Voz 100** (R$ 12,90 - +100 minutos, não expira)
  - Link: `https://pay.cakto.com.br/hhxugxb_668446`
- **Passe Livre 30 Dias** (R$ 19,90 - remove limite diário por 30 dias)
  - Link: `https://pay.cakto.com.br/trszqtv_668453`

#### 7. **LiveDemo.tsx** (Demonstração Interativa)
- Simula interface do app mobile
- Alterna entre modos: Chat → Chamada → Chat
- Mostra conversas de exemplo com a IA
- Demonstra funcionalidades de voz e chat

---

## 🔄 Funcionalidades e Fluxos

### Fluxo de Compra (B2C)

1. **Usuário acessa a página** → Vê Hero com vídeo e CTA
2. **Navega pelas seções** → Problema → Solução → Como Funciona
3. **Clica em "QUERO MEU FITCOACH.IA AGORA"** → Scroll para seção de preços
4. **Escolhe plano** (Mensal ou Anual)
5. **Clica no botão do plano** → Redireciona para checkout Cakto
6. **Após pagamento** → Cakto envia webhook para Supabase
7. **Supabase cria/atualiza assinatura** → Envia e-mail com acesso

### Fluxo de Compra (B2B)

1. **Academia acessa página B2B** → Vê proposta de valor
2. **Escolhe pacote** (Starter/Growth/Pro)
3. **Clica em "Comprar"** → Redireciona para checkout Cakto
4. **Após pagamento** → Cakto envia webhook
5. **Supabase cria:**
   - Registro da empresa
   - Código Mestre único (ex: `ACADEMIA-X`)
   - Licenças disponíveis
6. **E-mail automático enviado** com:
   - Código Mestre
   - Instruções de uso
   - Link para dashboard (opcional)

### Fluxo de Compra (Personal Trainer)

1. **Personal acessa página Personais** → Vê proposta de valor
2. **Escolhe time** (Team 5 ou Team 15)
3. **Clica em "Contratar"** → Redireciona para checkout Cakto
4. **Após pagamento** → Cakto envia webhook
5. **Supabase cria:**
   - Registro do personal trainer
   - Código de Equipe único
   - Licenças disponíveis
6. **E-mail automático enviado** com código de equipe

### Fluxo de Recarga

1. **Usuário acessa página Recarga** → Vê opções de upgrade
2. **Escolhe produto** (Turbo/Banco 100/Passe Livre)
3. **Clica em "Comprar"** → Redireciona para checkout Cakto
4. **Após pagamento** → Cakto envia webhook
5. **Supabase atualiza:**
   - Saldo de minutos (para Banco de Voz)
   - Tempo de sessão turbo (válido 24h)
   - Status de passe livre (30 dias)

---

## 💳 Integração com Cakto

### Como Funciona Atualmente

A página **não possui backend próprio**. Todos os botões de compra redirecionam diretamente para os checkouts da Cakto usando `window.location.href = url`.

**Links de Checkout Configurados:**

| Produto | Tipo | Link Cakto | Preço |
|---------|------|------------|-------|
| Plano Mensal | B2C | `zeygxve_668421` | R$ 34,90 |
| Plano Anual VIP | B2C | `wvbkepi_668441` | R$ 297,00 |
| Pack Starter | B2B | `cemyp2n_668537` | R$ 299,90 |
| Pack Growth | B2B | `vi6djzq_668541` | R$ 649,90 |
| Pack Pro | B2B | `3dis6ds_668546` | R$ 1.199,90 |
| Team 5 | Personal | `3dgheuc_666289` | R$ 99,90 |
| Team 15 | Personal | `3etp85e_666303` | R$ 249,90 |
| Sessão Turbo | Recarga | `ihfy8cz_668443` | R$ 5,00 |
| Banco de Voz 100 | Recarga | `hhxugxb_668446` | R$ 12,90 |
| Passe Livre 30 Dias | Recarga | `trszqtv_668453` | R$ 19,90 |

### O que Precisa Ser Implementado

Para integrar completamente com Supabase, você precisa:

1. **Configurar Webhooks da Cakto** → Apontar para sua API/Supabase
2. **Criar Edge Functions no Supabase** → Para receber webhooks
3. **Criar tabelas no Supabase** → Para armazenar dados
4. **Implementar lógica de negócio** → Criar assinaturas, códigos, etc.

---

## 🗄️ Estrutura do Banco de Dados Supabase

### Tabelas Necessárias

#### 1. **users** (Usuários do Sistema)
Armazena informações dos clientes finais (B2C) e usuários do app.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadados do app
  app_user_id TEXT, -- ID do usuário no app mobile (se diferente)
  device_info JSONB,
  
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_app_user_id ON users(app_user_id);
```

#### 2. **subscriptions** (Assinaturas B2C)
Armazena assinaturas dos planos mensais e anuais.

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Tipo de plano
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'annual')),
  plan_name TEXT NOT NULL, -- 'Plano Mensal' ou 'Plano Anual VIP'
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired', 'suspended')),
  
  -- Datas
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ, -- Para planos mensais
  
  -- Pagamento
  cakto_transaction_id TEXT UNIQUE, -- ID da transação na Cakto
  cakto_checkout_id TEXT, -- ID do checkout usado
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  amount_paid DECIMAL(10,2),
  currency TEXT DEFAULT 'BRL',
  
  -- Features
  features JSONB DEFAULT '{
    "photo_analysis_unlimited": true,
    "workout_unlimited": true,
    "chat_unlimited": true,
    "voice_minutes_daily": 15,
    "voice_minutes_total": null
  }'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_dates CHECK (expires_at IS NULL OR expires_at > started_at)
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_cakto_transaction ON subscriptions(cakto_transaction_id);
CREATE INDEX idx_subscriptions_expires_at ON subscriptions(expires_at);
```

#### 3. **companies** (Empresas B2B - Academias)
Armazena informações das academias que compram pacotes.

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações da empresa
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  cnpj TEXT, -- Opcional
  address JSONB, -- {street, city, state, zip}
  
  -- Plano contratado
  plan_type TEXT NOT NULL CHECK (plan_type IN ('starter', 'growth', 'pro')),
  plan_name TEXT NOT NULL, -- 'Pack Starter', 'Pack Growth', 'Pack Pro'
  max_licenses INTEGER NOT NULL, -- 20, 50 ou 100
  
  -- Código Mestre
  master_code TEXT UNIQUE NOT NULL, -- Ex: 'ACADEMIA-X', gerado automaticamente
  code_generated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  
  -- Pagamento
  cakto_transaction_id TEXT UNIQUE,
  cakto_checkout_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  monthly_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'BRL',
  
  -- Datas
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Se houver data de expiração
  cancelled_at TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ, -- Para cobrança recorrente
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_email ON companies(email);
CREATE INDEX idx_companies_master_code ON companies(master_code);
CREATE INDEX idx_companies_status ON companies(status);
```

#### 4. **company_licenses** (Licenças Ativas das Academias)
Rastreia quais alunos estão usando as licenças da academia.

```sql
CREATE TABLE company_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  
  -- Datas
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Se houver expiração automática
  
  -- Metadados
  activated_by TEXT, -- Email ou nome de quem ativou
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Uma licença por usuário por empresa
  CONSTRAINT unique_user_company UNIQUE (company_id, user_id)
);

CREATE INDEX idx_company_licenses_company_id ON company_licenses(company_id);
CREATE INDEX idx_company_licenses_user_id ON company_licenses(user_id);
CREATE INDEX idx_company_licenses_status ON company_licenses(status);
```

#### 5. **personal_trainers** (Personal Trainers)
Armazena informações dos personal trainers que contratam planos.

```sql
CREATE TABLE personal_trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações do personal
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  cpf TEXT, -- Opcional
  
  -- Plano contratado
  plan_type TEXT NOT NULL CHECK (plan_type IN ('team_5', 'team_15')),
  plan_name TEXT NOT NULL, -- 'Team 5' ou 'Team 15'
  max_licenses INTEGER NOT NULL, -- 5 ou 15
  
  -- Código de Equipe
  team_code TEXT UNIQUE NOT NULL, -- Ex: 'PERSONAL-X', gerado automaticamente
  code_generated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  
  -- Pagamento
  cakto_transaction_id TEXT UNIQUE,
  cakto_checkout_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  monthly_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'BRL',
  
  -- Datas
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_personal_trainers_email ON personal_trainers(email);
CREATE INDEX idx_personal_trainers_team_code ON personal_trainers(team_code);
CREATE INDEX idx_personal_trainers_status ON personal_trainers(status);
```

#### 6. **personal_licenses** (Licenças dos Personais)
Rastreia quais clientes estão usando as licenças do personal.

```sql
CREATE TABLE personal_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_trainer_id UUID NOT NULL REFERENCES personal_trainers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  
  -- Datas
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Metadados
  activated_by TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_personal UNIQUE (personal_trainer_id, user_id)
);

CREATE INDEX idx_personal_licenses_personal_id ON personal_licenses(personal_trainer_id);
CREATE INDEX idx_personal_licenses_user_id ON personal_licenses(user_id);
```

#### 7. **recharges** (Recargas/Upgrades)
Armazena compras de recargas (Turbo, Banco de Voz, Passe Livre).

```sql
CREATE TABLE recharges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Tipo de recarga
  recharge_type TEXT NOT NULL CHECK (recharge_type IN ('turbo', 'voice_bank', 'pass_libre')),
  recharge_name TEXT NOT NULL, -- 'Sessão Turbo', 'Banco de Voz 100', 'Passe Livre 30 Dias'
  
  -- Valor e quantidade
  amount_paid DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  quantity INTEGER NOT NULL, -- Minutos ou dias
  
  -- Validade
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ, -- NULL para Banco de Voz (não expira)
  expires_at TIMESTAMPTZ, -- Para Passe Livre: 30 dias após compra
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'used', 'expired')),
  used_at TIMESTAMPTZ, -- Quando foi utilizado (se aplicável)
  
  -- Pagamento
  cakto_transaction_id TEXT UNIQUE,
  cakto_checkout_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  
  -- Metadados
  metadata JSONB, -- Informações adicionais específicas do tipo
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recharges_user_id ON recharges(user_id);
CREATE INDEX idx_recharges_type ON recharges(recharge_type);
CREATE INDEX idx_recharges_status ON recharges(status);
CREATE INDEX idx_recharges_valid_until ON recharges(valid_until);
```

#### 8. **cakto_webhooks** (Log de Webhooks)
Armazena todos os webhooks recebidos da Cakto para auditoria e debug.

```sql
CREATE TABLE cakto_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados do webhook
  event_type TEXT NOT NULL, -- 'payment.completed', 'payment.failed', etc.
  cakto_transaction_id TEXT,
  checkout_id TEXT,
  
  -- Payload completo
  payload JSONB NOT NULL,
  
  -- Status de processamento
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Relacionamentos (podem ser NULL se não processado ainda)
  subscription_id UUID REFERENCES subscriptions(id),
  company_id UUID REFERENCES companies(id),
  personal_trainer_id UUID REFERENCES personal_trainers(id),
  recharge_id UUID REFERENCES recharges(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cakto_webhooks_event_type ON cakto_webhooks(event_type);
CREATE INDEX idx_cakto_webhooks_transaction_id ON cakto_webhooks(cakto_transaction_id);
CREATE INDEX idx_cakto_webhooks_processed ON cakto_webhooks(processed);
```

#### 9. **user_voice_usage** (Uso de Minutos de Voz)
Rastreia o uso diário de minutos de voz por usuário.

```sql
CREATE TABLE user_voice_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Data e minutos
  usage_date DATE NOT NULL, -- Data do uso (YYYY-MM-DD)
  minutes_used INTEGER NOT NULL DEFAULT 0,
  minutes_limit INTEGER NOT NULL DEFAULT 15, -- Limite diário padrão
  
  -- Recargas aplicadas
  recharge_minutes INTEGER DEFAULT 0, -- Minutos do Banco de Voz usados
  turbo_active BOOLEAN DEFAULT FALSE, -- Se usou Sessão Turbo
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Um registro por usuário por dia
  CONSTRAINT unique_user_date UNIQUE (user_id, usage_date)
);

CREATE INDEX idx_user_voice_usage_user_id ON user_voice_usage(user_id);
CREATE INDEX idx_user_voice_usage_date ON user_voice_usage(usage_date);
```

### Funções e Triggers Úteis

#### Função para Gerar Código Mestre (B2B)
```sql
CREATE OR REPLACE FUNCTION generate_master_code(company_name TEXT)
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  random_suffix TEXT;
  final_code TEXT;
BEGIN
  -- Extrai iniciais do nome da empresa (máx 3 letras)
  prefix := UPPER(SUBSTRING(REGEXP_REPLACE(company_name, '[^A-Za-z]', '', 'g'), 1, 3));
  IF prefix = '' THEN
    prefix := 'ACAD';
  END IF;
  
  -- Gera sufixo aleatório de 4 caracteres
  random_suffix := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4));
  
  final_code := prefix || '-' || random_suffix;
  
  -- Verifica se já existe (improvável, mas seguro)
  WHILE EXISTS (SELECT 1 FROM companies WHERE master_code = final_code) LOOP
    random_suffix := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4));
    final_code := prefix || '-' || random_suffix;
  END LOOP;
  
  RETURN final_code;
END;
$$ LANGUAGE plpgsql;
```

#### Função para Gerar Código de Equipe (Personal)
```sql
CREATE OR REPLACE FUNCTION generate_team_code()
RETURNS TEXT AS $$
DECLARE
  random_code TEXT;
BEGIN
  random_code := 'PERSONAL-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
  
  WHILE EXISTS (SELECT 1 FROM personal_trainers WHERE team_code = random_code) LOOP
    random_code := 'PERSONAL-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
  END LOOP;
  
  RETURN random_code;
END;
$$ LANGUAGE plpgsql;
```

#### Trigger para Atualizar `updated_at`
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em todas as tabelas com updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... (repetir para todas as outras tabelas)
```

---

## 🔗 Webhooks e Automações

### Webhook da Cakto

A Cakto deve enviar webhooks para uma **Supabase Edge Function** quando ocorrerem eventos de pagamento.

**URL do Webhook:** `https://[seu-projeto].supabase.co/functions/v1/cakto-webhook`

**Eventos Esperados:**
- `payment.completed` - Pagamento confirmado
- `payment.failed` - Pagamento falhou
- `payment.refunded` - Reembolso realizado
- `subscription.cancelled` - Assinatura cancelada

### Estrutura do Payload (Exemplo)

```json
{
  "event": "payment.completed",
  "transaction_id": "tx_abc123",
  "checkout_id": "zeygxve_668421",
  "customer": {
    "email": "cliente@example.com",
    "name": "João Silva",
    "phone": "+5511999999999"
  },
  "amount": 34.90,
  "currency": "BRL",
  "status": "paid",
  "paid_at": "2025-01-15T10:30:00Z",
  "metadata": {
    "plan_type": "monthly",
    "user_id": "uuid-do-usuario" // Opcional, se você passar na URL
  }
}
```

### Edge Function: `cakto-webhook`

**Arquivo:** `supabase/functions/cakto-webhook/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()

    // 1. Salvar webhook no log
    const { data: webhookLog, error: logError } = await supabaseClient
      .from('cakto_webhooks')
      .insert({
        event_type: payload.event,
        cakto_transaction_id: payload.transaction_id,
        checkout_id: payload.checkout_id,
        payload: payload
      })
      .select()
      .single()

    if (logError) {
      console.error('Error logging webhook:', logError)
    }

    // 2. Processar baseado no tipo de evento
    if (payload.event === 'payment.completed') {
      await processPaymentCompleted(supabaseClient, payload, webhookLog?.id)
    } else if (payload.event === 'payment.failed') {
      await processPaymentFailed(supabaseClient, payload, webhookLog?.id)
    }

    // 3. Marcar webhook como processado
    if (webhookLog?.id) {
      await supabaseClient
        .from('cakto_webhooks')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('id', webhookLog.id)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

async function processPaymentCompleted(supabase: any, payload: any, webhookId: string) {
  const checkoutId = payload.checkout_id

  // Mapear checkout_id para tipo de produto
  const productMap: Record<string, { type: string, plan?: string }> = {
    'zeygxve_668421': { type: 'subscription', plan: 'monthly' },
    'wvbkepi_668441': { type: 'subscription', plan: 'annual' },
    'cemyp2n_668537': { type: 'company', plan: 'starter' },
    'vi6djzq_668541': { type: 'company', plan: 'growth' },
    '3dis6ds_668546': { type: 'company', plan: 'pro' },
    '3dgheuc_666289': { type: 'personal', plan: 'team_5' },
    '3etp85e_666303': { type: 'personal', plan: 'team_15' },
    'ihfy8cz_668443': { type: 'recharge', plan: 'turbo' },
    'hhxugxb_668446': { type: 'recharge', plan: 'voice_bank' },
    'trszqtv_668453': { type: 'recharge', plan: 'pass_libre' },
  }

  const product = productMap[checkoutId]
  if (!product) {
    throw new Error(`Unknown checkout_id: ${checkoutId}`)
  }

  // Buscar ou criar usuário
  let { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', payload.customer.email)
    .single()

  if (!user) {
    const { data: newUser } = await supabase
      .from('users')
      .insert({
        email: payload.customer.email,
        name: payload.customer.name,
        phone: payload.customer.phone
      })
      .select()
      .single()
    user = newUser
  }

  // Processar baseado no tipo
  if (product.type === 'subscription') {
    await createSubscription(supabase, user.id, product.plan!, payload, webhookId)
  } else if (product.type === 'company') {
    await createCompany(supabase, payload, product.plan!, webhookId)
  } else if (product.type === 'personal') {
    await createPersonalTrainer(supabase, payload, product.plan!, webhookId)
  } else if (product.type === 'recharge') {
    await createRecharge(supabase, user.id, product.plan!, payload, webhookId)
  }
}

async function createSubscription(supabase: any, userId: string, planType: string, payload: any, webhookId: string) {
  const isAnnual = planType === 'annual'
  const startedAt = new Date()
  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + (isAnnual ? 1 : 0))
  expiresAt.setMonth(expiresAt.getMonth() + (isAnnual ? 0 : 1))

  const { data: subscription } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan_type: planType,
      plan_name: isAnnual ? 'Plano Anual VIP' : 'Plano Mensal',
      status: 'active',
      started_at: startedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      next_billing_date: isAnnual ? null : expiresAt.toISOString(),
      cakto_transaction_id: payload.transaction_id,
      cakto_checkout_id: payload.checkout_id,
      payment_status: 'paid',
      amount_paid: payload.amount
    })
    .select()
    .single()

  // Enviar e-mail de boas-vindas (usar serviço de e-mail)
  await sendWelcomeEmail(payload.customer.email, subscription)

  // Atualizar webhook log
  await supabase
    .from('cakto_webhooks')
    .update({ subscription_id: subscription.id })
    .eq('id', webhookId)
}

async function createCompany(supabase: any, payload: any, planType: string, webhookId: string) {
  const planConfig = {
    starter: { name: 'Pack Starter', maxLicenses: 20, amount: 299.90 },
    growth: { name: 'Pack Growth', maxLicenses: 50, amount: 649.90 },
    pro: { name: 'Pack Pro', maxLicenses: 100, amount: 1199.90 }
  }

  const config = planConfig[planType as keyof typeof planConfig]

  // Gerar código mestre
  const masterCode = await generateMasterCode(supabase, payload.customer.name || 'ACADEMIA')

  const { data: company } = await supabase
    .from('companies')
    .insert({
      name: payload.customer.name || 'Academia',
      email: payload.customer.email,
      phone: payload.customer.phone,
      plan_type: planType,
      plan_name: config.name,
      max_licenses: config.maxLicenses,
      master_code: masterCode,
      status: 'active',
      cakto_transaction_id: payload.transaction_id,
      cakto_checkout_id: payload.checkout_id,
      payment_status: 'paid',
      monthly_amount: config.amount,
      started_at: new Date().toISOString(),
      next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 dias
    })
    .select()
    .single()

  // Enviar e-mail com código mestre
  await sendCompanyWelcomeEmail(payload.customer.email, company, masterCode)

  await supabase
    .from('cakto_webhooks')
    .update({ company_id: company.id })
    .eq('id', webhookId)
}

async function createPersonalTrainer(supabase: any, payload: any, planType: string, webhookId: string) {
  const planConfig = {
    team_5: { name: 'Team 5', maxLicenses: 5, amount: 99.90 },
    team_15: { name: 'Team 15', maxLicenses: 15, amount: 249.90 }
  }

  const config = planConfig[planType as keyof typeof planConfig]
  const teamCode = await generateTeamCode(supabase)

  const { data: personal } = await supabase
    .from('personal_trainers')
    .insert({
      name: payload.customer.name || 'Personal Trainer',
      email: payload.customer.email,
      phone: payload.customer.phone,
      plan_type: planType,
      plan_name: config.name,
      max_licenses: config.maxLicenses,
      team_code: teamCode,
      status: 'active',
      cakto_transaction_id: payload.transaction_id,
      cakto_checkout_id: payload.checkout_id,
      payment_status: 'paid',
      monthly_amount: config.amount,
      started_at: new Date().toISOString(),
      next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })
    .select()
    .single()

  await sendPersonalWelcomeEmail(payload.customer.email, personal, teamCode)

  await supabase
    .from('cakto_webhooks')
    .update({ personal_trainer_id: personal.id })
    .eq('id', webhookId)
}

async function createRecharge(supabase: any, userId: string, rechargeType: string, payload: any, webhookId: string) {
  const rechargeConfig = {
    turbo: { name: 'Sessão Turbo', quantity: 30, validUntil: 24 }, // 24 horas
    voice_bank: { name: 'Banco de Voz 100', quantity: 100, validUntil: null }, // Não expira
    pass_libre: { name: 'Passe Livre 30 Dias', quantity: 30, validUntil: 30 * 24 } // 30 dias em horas
  }

  const config = rechargeConfig[rechargeType as keyof typeof rechargeConfig]
  const validFrom = new Date()
  const validUntil = config.validUntil
    ? new Date(validFrom.getTime() + config.validUntil * 60 * 60 * 1000)
    : null

  const { data: recharge } = await supabase
    .from('recharges')
    .insert({
      user_id: userId,
      recharge_type: rechargeType,
      recharge_name: config.name,
      amount_paid: payload.amount,
      quantity: config.quantity,
      valid_from: validFrom.toISOString(),
      valid_until: validUntil?.toISOString() || null,
      expires_at: rechargeType === 'pass_libre' ? validUntil?.toISOString() : null,
      status: 'active',
      cakto_transaction_id: payload.transaction_id,
      cakto_checkout_id: payload.checkout_id,
      payment_status: 'paid'
    })
    .select()
    .single()

  await supabase
    .from('cakto_webhooks')
    .update({ recharge_id: recharge.id })
    .eq('id', webhookId)
}

// Funções auxiliares
async function generateMasterCode(supabase: any, companyName: string): Promise<string> {
  // Implementar lógica similar à função SQL
  const prefix = companyName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'ACAD'
  let code = `${prefix}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
  
  // Verificar se já existe
  const { data } = await supabase.from('companies').select('id').eq('master_code', code).single()
  if (data) {
    code = `${prefix}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
  }
  
  return code
}

async function generateTeamCode(supabase: any): Promise<string> {
  let code = `PERSONAL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  const { data } = await supabase.from('personal_trainers').select('id').eq('team_code', code).single()
  if (data) {
    code = `PERSONAL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  }
  return code
}

async function sendWelcomeEmail(email: string, subscription: any) {
  // Integrar com serviço de e-mail (Resend, SendGrid, etc.)
  console.log(`Sending welcome email to ${email} for subscription ${subscription.id}`)
}

async function sendCompanyWelcomeEmail(email: string, company: any, masterCode: string) {
  console.log(`Sending company welcome email to ${email} with code ${masterCode}`)
}

async function sendPersonalWelcomeEmail(email: string, personal: any, teamCode: string) {
  console.log(`Sending personal trainer welcome email to ${email} with code ${teamCode}`)
}

async function processPaymentFailed(supabase: any, payload: any, webhookId: string) {
  // Implementar lógica para pagamentos falhados
  console.log(`Payment failed for transaction ${payload.transaction_id}`)
}
```

---

## 📧 Envio de E-mails

### Serviços Recomendados
- **Resend** (recomendado para Supabase)
- **SendGrid**
- **Amazon SES**

### Templates de E-mail Necessários

#### 1. **E-mail de Boas-vindas (B2C)**
```
Assunto: Bem-vindo ao Fitcoach.ia! Seu acesso está pronto 🎉

Olá [Nome],

Sua assinatura do [Plano] foi confirmada!

Acesse o app agora:
[Link do App]

Seus benefícios:
✅ Análise de fotos ilimitada
✅ Treinos personalizados
✅ Chat ilimitado
✅ 15 minutos/dia de consultoria por voz

Qualquer dúvida, responda este e-mail.

Abraços,
Equipe Fitcoach.ia
```

#### 2. **E-mail com Código Mestre (B2B)**
```
Assunto: Seu Código Mestre Fitcoach.ia está pronto! 🏋️

Olá [Nome da Academia],

Seu pacote [Nome do Plano] foi ativado com sucesso!

📋 SEU CÓDIGO MESTRE: [MASTER_CODE]

Como usar:
1. Compartilhe este código com seus alunos
2. Eles baixam o app Fitcoach.ia
3. Inserem o código na tela de ativação
4. Pronto! Acesso Premium liberado

Licenças disponíveis: [X] de [Total]

Acesse seu painel: [Link do Dashboard]

Suporte: suporte@fitcoach.ia
```

#### 3. **E-mail com Código de Equipe (Personal)**
```
Assunto: Seu Código de Equipe Fitcoach.ia está ativo! 💪

Olá [Nome do Personal],

Seu plano [Nome do Plano] foi confirmado!

🔑 SEU CÓDIGO DE EQUIPE: [TEAM_CODE]

Como distribuir:
1. Envie o código para seus clientes via WhatsApp
2. Eles baixam o app e inserem o código
3. Acesso Premium ativado na hora!

Licenças disponíveis: [X] de [Total]

Qualquer dúvida, estamos aqui!
```

---

## 🔐 Segurança e Políticas RLS (Row Level Security)

### Habilitar RLS em Todas as Tabelas

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE recharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_voice_usage ENABLE ROW LEVEL SECURITY;
```

### Políticas de Exemplo

#### Usuários só veem seus próprios dados
```sql
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
ON users FOR UPDATE
USING (auth.uid() = id);
```

#### Assinaturas
```sql
CREATE POLICY "Users can view own subscriptions"
ON subscriptions FOR SELECT
USING (auth.uid() = user_id);
```

#### Empresas (apenas o dono)
```sql
CREATE POLICY "Companies can view own data"
ON companies FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.email = companies.email
  )
);
```

---

## 📊 Queries Úteis para Dashboard

### Total de Assinaturas Ativas
```sql
SELECT 
  plan_type,
  COUNT(*) as total,
  SUM(amount_paid) as revenue
FROM subscriptions
WHERE status = 'active'
GROUP BY plan_type;
```

### Licenças Utilizadas por Academia
```sql
SELECT 
  c.name,
  c.max_licenses,
  COUNT(cl.id) as licenses_used,
  (c.max_licenses - COUNT(cl.id)) as licenses_available
FROM companies c
LEFT JOIN company_licenses cl ON cl.company_id = c.id AND cl.status = 'active'
WHERE c.status = 'active'
GROUP BY c.id, c.name, c.max_licenses;
```

### Receita Mensal
```sql
SELECT 
  DATE_TRUNC('month', created_at) as month,
  SUM(amount_paid) as revenue
FROM subscriptions
WHERE payment_status = 'paid'
GROUP BY month
ORDER BY month DESC;
```

---

## 🚀 Instruções de Implementação

### Passo 1: Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a URL e as chaves de API

### Passo 2: Executar Scripts SQL
1. Copie todos os `CREATE TABLE` deste documento
2. Execute no SQL Editor do Supabase
3. Execute as funções e triggers

### Passo 3: Criar Edge Function
1. Instale Supabase CLI: `npm install -g supabase`
2. Faça login: `supabase login`
3. Inicialize: `supabase init`
4. Crie a function: `supabase functions new cakto-webhook`
5. Cole o código TypeScript fornecido
6. Deploy: `supabase functions deploy cakto-webhook`

### Passo 4: Configurar Webhook na Cakto
1. Acesse painel da Cakto
2. Vá em Configurações → Webhooks
3. Adicione URL: `https://[projeto].supabase.co/functions/v1/cakto-webhook`
4. Selecione eventos: `payment.completed`, `payment.failed`
5. Configure autenticação (header secreto recomendado)

### Passo 5: Configurar E-mail
1. Escolha serviço de e-mail (Resend recomendado)
2. Configure variáveis de ambiente no Supabase
3. Implemente funções de envio na Edge Function

### Passo 6: Testar
1. Faça uma compra de teste na página
2. Verifique webhook recebido em `cakto_webhooks`
3. Verifique criação de registro (subscription/company/etc)
4. Verifique e-mail enviado

---

## 📝 Notas Finais

- **Backup**: Configure backups automáticos no Supabase
- **Monitoramento**: Use Supabase Logs para debugar webhooks
- **Rate Limiting**: Configure limites na Edge Function
- **Validação**: Sempre valide payloads dos webhooks
- **Idempotência**: Use `cakto_transaction_id` para evitar duplicatas

---

## 🔗 Links Úteis

- [Documentação Supabase](https://supabase.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Cakto API](https://docs.cakto.com.br) (verificar documentação oficial)

---

**Última atualização:** Janeiro 2025
**Versão do documento:** 1.0

