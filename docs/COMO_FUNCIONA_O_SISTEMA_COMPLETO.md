# 🔄 Como Funciona o Sistema FitCoach.IA Completo

## 📋 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                   1. PÁGINA DE VENDA                     │
│                   (Frontend no Vercel)                   │
│                                                           │
│  URL: https://fit-coach-ia.vercel.app/#/premium          │
│  Componente: pages/PremiumPage.tsx                       │
│                                                           │
│  Exibe planos:                                           │
│  - FitCoach 50 (R$ 299,90)                               │
│  - FitCoach 100 (R$ 549,90)                              │
│  - FitCoach 200 (R$ 999,90)                              │
│  - FitCoach 400 (R$ 1.799,90)                            │
│  - Recargas FitVoice (20/60/120 min)                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Cliente clica "Assinar"
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   2. CHECKOUT CAKTO                      │
│                   (Gateway de Pagamento)                 │
│                                                           │
│  URL gerada: https://pay.cakto.com.br/[checkout_id]     │
│  Serviço: services/caktoService.ts                      │
│                                                           │
│  Exemplos:                                               │
│  - FitCoach 50: pay.cakto.com.br/cemyp2n_668537         │
│  - FitVoice 120: pay.cakto.com.br/3smg99n_693764        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Cliente paga
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              3. WEBHOOK SUPABASE                         │
│           (Supabase Edge Function)                       │
│                                                           │
│  URL: https://[projeto].supabase.co/functions/v1/       │
│       cakto-webhook                                      │
│  Arquivo: supabase/functions/cakto-webhook/index.ts     │
│                                                           │
│  O que faz:                                              │
│  1. Recebe payload do Cakto                              │
│  2. Valida autenticação (CAKTO_WEBHOOK_SECRET)          │
│  3. Extrai checkout_id e identifica produto              │
│  4. Processa conforme tipo:                              │
│     - B2B (Academia) → Cria empresa                      │
│     - B2C (Individual) → Cria assinatura                 │
│     - Recarga → Processa recarga                         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Atualiza banco
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                 4. BANCO DE DADOS                        │
│                  (Supabase PostgreSQL)                   │
│                                                           │
│  Tabelas principais:                                     │
│                                                           │
│  companies (Academias):                                  │
│  - id, nome, email                                       │
│  - plano (FitCoach50/100/200/400)                        │
│  - alunos_max, limite_texto, limite_imagem, limite_voz  │
│  - master_code (ex: ACADEMIA-ABC123)                     │
│                                                           │
│  users (Alunos/Usuários):                                │
│  - id, nome, email                                       │
│  - academias_id (FK → companies)                         │
│  - uso_texto, uso_imagem, uso_voz_minutos               │
│  - saldo_voz_extra                                       │
│  - periodo_uso_mes (YYYY-MM)                             │
│  - modo_demo, interacoes_demo_usadas                     │
│                                                           │
│  recargas (Recargas FitVoice):                           │
│  - id, aluno_id                                          │
│  - tipo_recarga, minutos_comprados, valor_pago           │
│  - status, cakto_transaction_id                          │
│                                                           │
│  user_subscriptions (Assinaturas B2C):                   │
│  - id, user_email, plan_slug                             │
│  - status, current_period_start, current_period_end      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Consulta dados
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  5. APP FITCOACH                         │
│                 (Frontend no Vercel)                     │
│                                                           │
│  URL: https://fit-coach-ia.vercel.app                    │
│                                                           │
│  Componentes principais:                                 │
│  - pages/LoginPage.tsx → Login/Cadastro                  │
│  - chatbot/components/ChatbotPopup.tsx → Chat de IA      │
│  - pages/BillingPage.tsx → Indicadores de uso            │
│  - components/LimitesUsageIndicator.tsx → Barras         │
│  - components/RecargaModal.tsx → Modal de recarga        │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 FLUXO COMPLETO PASSO A PASSO

### **1️⃣ PÁGINA DE VENDA (Vercel)**

**Onde:** `https://fit-coach-ia.vercel.app/#/premium`  
**Componente:** `pages/PremiumPage.tsx`

**O que acontece:**

1. **Cliente acessa a página de vendas**
   - Vê planos disponíveis (FitCoach50, FitCoach100, FitCoach200, FitCoach400)
   - Vê recargas FitVoice (20/60/120 minutos)
   - Preços e features de cada plano

2. **Cliente escolhe um plano**
   - Clica em "Assinar [Nome do Plano]"
   - Sistema identifica qual checkout usar via `services/caktoService.ts`

3. **Redirecionamento para Cakto**
   ```typescript
   // services/caktoService.ts
   const checkoutUrl = getCaktoCheckoutUrl('FitCoach50');
   // Retorna: https://pay.cakto.com.br/cemyp2n_668537
   window.open(checkoutUrl, '_blank');
   ```

**Código responsável:**
- `pages/PremiumPage.tsx` - Exibe planos e botões "Assinar"
- `services/caktoService.ts` - Mapeamento de planos para Checkout IDs
- `getCaktoCheckoutUrl(planName)` - Função que retorna URL de checkout

---

### **2️⃣ CHECKOUT NA CAKTO**

**Onde:** `https://pay.cakto.com.br/[checkout_id]`

**O que acontece:**

1. **Cliente efetua pagamento**
   - Preenche dados pessoais
   - Escolhe método de pagamento (Pix, Cartão, etc)
   - Completa o pagamento

2. **Cakto processa pagamento**
   - Valida pagamento
   - Confirma transação
   - Gera `transaction_id`

3. **Cakto envia webhook**
   ```json
   POST https://[seu-projeto].supabase.co/functions/v1/cakto-webhook
   
   {
     "event": "purchase_approved",
     "data": {
       "id": "tx_abc123",
       "checkout_id": "cemyp2n_668537",
       "customer_email": "academia@example.com",
       "amount": 299.90,
       "status": "paid"
     }
   }
   ```

---

### **3️⃣ WEBHOOK NO SUPABASE (Edge Function)**

**Onde:** Supabase Edge Function → `supabase/functions/cakto-webhook/index.ts`

**O que acontece:**

#### **Passo 1: Validação**
```typescript
// 1. Valida autenticação do webhook
const headerSecret = req.headers.get("x-webhook-secret");
if (headerSecret !== CAKTO_WEBHOOK_SECRET) {
  return new Response("Unauthorized", { status: 401 });
}

// 2. Extrai informações do payload
const checkoutId = body?.data?.checkout_id; // Ex: "cemyp2n_668537"
const customerEmail = body?.data?.customer?.email;
const transactionId = body?.data?.id;
```

#### **Passo 2: Identificação do Produto**
```typescript
// 3. Busca plano na tabela subscription_plans
const { data: plan } = await supabase
  .from("subscription_plans")
  .select("*")
  .or(`checkout_url_monthly.ilike.%${checkoutId}%,
        checkout_url_yearly.ilike.%${checkoutId}%`)
  .single();

// 4. Identifica categoria do plano
const planCategory = plan.plan_category; 
// 'b2b_platform' → Academia
// 'b2c_ai' → Individual
// 'recharge' → Recarga FitVoice
```

#### **Passo 3: Processamento por Tipo**

**A) Se for Plano B2B (Academia - `b2b_platform`):**
```typescript
// 1. Gera master_code usando função RPC
const { data: masterCode } = await supabase.rpc('generate_master_code');
// Ex: "ACADEMIA-ABC123"

// 2. Cria empresa na tabela companies
const { data: company } = await supabase
  .from("companies")
  .insert({
    nome: "Academia Example",
    email: customerEmail,
    plano: "FitCoach50", // Identificado pelo checkout_id
    alunos_max: 50,
    limite_texto: 1000,
    limite_imagem: 100,
    limite_voz: 450,
    master_code: masterCode,
    status: 'active',
    payment_status: 'paid'
  });

// 3. Cria código de convite padrão
const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
// Ex: "ABC123"

await supabase
  .from("invites")
  .insert({
    academy_id: company.id,
    code: inviteCode,
    invited_role: 'student',
    expires_at: +1 ano,
    status: 'pending'
  });

// 4. Envia email com código de convite
await sendActivationEmail({
  email: customerEmail,
  masterCode: masterCode,
  inviteCode: inviteCode,
  planName: "FitCoach 50"
});
```

**B) Se for Plano B2C (Individual - `b2c_ai`):**
```typescript
// Cria/atualiza assinatura na tabela user_subscriptions
await supabase
  .from("user_subscriptions")
  .insert({
    user_email: customerEmail,
    plan_slug: "ai_monthly", // ou "ai_annual_vip"
    status: "active",
    current_period_start: hoje.toISOString(),
    current_period_end: (hoje + 30 dias).toISOString()
  });
```

**C) Se for Recarga FitVoice (`recharge`):**
```typescript
// 1. Busca recarga pendente na tabela recargas
const { data: recarga } = await supabase
  .from("recargas")
  .select("*")
  .eq("cakto_checkout_id", checkoutId)
  .eq("status", "pending")
  .single();

// 2. Chama função RPC para processar recarga
await supabase.rpc("processar_recarga_paga", {
  p_recarga_id: recarga.id,
  p_cakto_transaction_id: transactionId
});

// A função RPC faz:
// 1. Adiciona minutos ao saldo_voz_extra do aluno
// 2. Atualiza status da recarga para "paid"
// 3. Registra data de pagamento
```

---

### **4️⃣ APP VERIFICA LIMITES ANTES DE USAR IA**

**Onde:** Frontend (Vercel) → `services/novoAiAccessService.ts`

**Fluxo quando aluno usa IA:**

```
Aluno abre chat → Digita mensagem → Clica "Enviar"
                     ↓
┌──────────────────────────────────────────┐
│  1. Verifica acesso ANTES de chamar IA   │
│     novoAiAccessService.getNovoAiAccessStatus()
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  2. Busca academia do aluno               │
│     academiaLimitsService.alunoPertenceAcademiaAtiva()
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  3. Verifica limites via RPC              │
│     Supabase RPC: verificar_limite_antes_uso()
│                                             │
│     A função RPC faz:                      │
│     1. Busca limites da academia (companies)│
│     2. Busca uso atual do aluno (users)     │
│     3. Verifica período_uso_mes             │
│     4. Compara: usado + quantidade <= limite│
│     5. Retorna: { pode_usar: true/false }   │
└──────────────┬───────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
   ✅ Pode usar    ❌ Limite excedido
        │             │
        │             └─→ Bloqueia uso
        │                   Mostra mensagem:
        │                   "Você atingiu o limite..."
        │
        ▼
┌──────────────────────────────────────────┐
│  4. Chama Gemini API                      │
│     geminiService.sendMessageToGemini()   │
│                                             │
│     - Envia mensagem para IA              │
│     - Recebe resposta                     │
│     - Stream de resposta para o usuário   │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  5. Após resposta bem-sucedida:           │
│     Consome uso                           │
│     novoAiAccessService.consumirUsoAposChamada()
│                                             │
│     - Atualiza contador: uso_texto += 1    │
│     - Salva no banco (users table)        │
│     - Verifica período_uso_mes             │
└──────────────────────────────────────────┘
```

**Código responsável:**

**Antes de usar IA:**
```typescript
// services/novoAiAccessService.ts
const status = await getNovoAiAccessStatus(user, 'chat');
if (!status.hasAccess) {
  throw new Error('Limite excedido');
}

// services/academiaLimitsService.ts
const verificacao = await verificarLimiteAntesUso(userId, 'texto', 1);
// Chama RPC: verificar_limite_antes_uso(userId, 'texto', 1)
```

**Após usar IA:**
```typescript
// services/novoAiAccessService.ts
await consumirUsoAposChamada(userId, 'chat', 1);

// services/academiaLimitsService.ts
await consumirUso(userId, 'texto', 1);
// Atualiza: uso_texto += 1 no banco
```

---

### **5️⃣ TIPOS DE USO E CONSUMO**

#### **A) Texto (Chat)**

**Serviço:** `chatbot/services/geminiService.ts`  
**Função:** `sendMessageToGemini()`

```typescript
// 1. Verifica acesso
await assertNovoAiAccessOrThrow(user, 'chat');

// 2. Chama Gemini API
const response = await gemini.generateContent(...);

// 3. Após sucesso, consome uso
await consumirUsoAposChamada(userId, 'chat', 1);
// Atualiza: uso_texto += 1
```

---

#### **B) Imagem (Análise de Foto)**

**Serviço:** `chatbot/services/geminiService.ts`  
**Função:** `processImageWithGemini()`

```typescript
// 1. Verifica acesso
await assertNovoAiAccessOrThrow(user, 'vision');

// 2. Chama Gemini Vision API
const response = await gemini.generateContent([...imageParts]);

// 3. Após sucesso, consome uso
await consumirUsoAposChamada(userId, 'vision', 1);
// Atualiza: uso_imagem += 1
```

---

#### **C) Voz (Conversa ao Vivo)**

**Serviço:** `chatbot/services/geminiService.ts`  
**Função:** `startLiveAudioSession()`

```typescript
// 1. Verifica acesso
await assertNovoAiAccessOrThrow(user, 'voice');

// 2. Inicia sessão de voz com Gemini Live API
const session = await gemini.startLiveAudioSession(...);

// 3. Monitora uso em tempo real (a cada minuto)
let totalSecondsElapsed = 0;
let minutosConsumidos = 0;

const monitoringInterval = setInterval(async () => {
  totalSecondsElapsed += 30; // A cada 30 segundos verifica
  
  const minutosCompletos = Math.floor(totalSecondsElapsed / 60);
  
  if (minutosCompletos > minutosConsumidos) {
    const minutosParaConsumir = minutosCompletos - minutosConsumidos;
    
    // Verifica se ainda pode usar
    const verificacao = await verificarLimiteAntesUso(
      userId, 'voz', minutosParaConsumir
    );
    
    if (!verificacao.podeUsar) {
      // Bloqueia e abre modal de recarga
      stopLiveAudioSession();
      setShowRecargaModal(true);
      clearInterval(monitoringInterval);
    } else {
      // Consome minutos usados
      await consumirUsoAposChamada(userId, 'voice', minutosParaConsumir);
      minutosConsumidos = minutosCompletos;
    }
  }
}, 30000); // A cada 30 segundos

// 4. Após sessão terminar, consome minutos restantes
session.onclose = () => {
  const minutosPendentes = Math.floor(totalSecondsElapsed / 60) - minutosConsumidos;
  if (minutosPendentes > 0) {
    consumirUsoAposChamada(userId, 'voice', minutosPendentes)
      .then(() => console.log('Uso final consumido'))
      .catch(err => logger.warn('Erro ao consumir uso final', err));
  }
};
```

**Observação:** Voz consome primeiro do limite mensal e depois do `saldo_voz_extra`.

---

#### **D) Planos de Treino**

**Serviço:** `services/geminiService.ts`  
**Função:** `generateMealPlan()`

```typescript
// 1. Verifica acesso
await assertNovoAiAccessOrThrow(user, 'plan');

// 2. Gera plano alimentar via Gemini
const plan = await gemini.generateContent(...);

// 3. Após sucesso, consome uso (conta como texto)
await consumirUsoAposChamada(userId, 'plan', 1);
// Atualiza: uso_texto += 1
```

---

### **6️⃣ RECARGA FITVOICE**

**Fluxo quando minutos de voz acabam:**

```
Aluno está usando voz → Minutos acabam
                          ↓
┌──────────────────────────────────────────┐
│  Sistema detecta: saldo_voz_extra = 0    │
│  e uso_voz_minutos >= limite_voz         │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  Abre modal de recarga                   │
│  components/RecargaModal.tsx             │
│  Exibido em: ChatbotPopup quando minutos │
│  acabam OU BillingPage ao clicar botão   │
│                                             │
│  Mostra opções:                           │
│  - FitVoice 20 (R$ 5,00)                  │
│  - FitVoice 60 (R$ 12,90)               │
│  - FitVoice 120 (R$ 19,90)                │
└──────────────┬───────────────────────────┘
               │
               │ Aluno escolhe pacote
               │
               ▼
┌──────────────────────────────────────────┐
│  Cria recarga pendente                   │
│  services/recargaService.ts              │
│                                             │
│  1. Insere na tabela recargas:            │
│     - aluno_id                            │
│     - tipo_recarga: "FitVoice60"          │
│     - minutos_comprados: 60               │
│     - valor_pago: 12.90                   │
│     - status: "pending"                   │
│                                             │
│  2. Gera checkout URL:                    │
│     - getCaktoCheckoutUrl("FitVoice60")   │
│     - Retorna: pay.cakto.com.br/          │
│       hhxugxb_668446                      │
└──────────────┬───────────────────────────┘
               │
               │ Redireciona para Cakto
               │
               ▼
┌──────────────────────────────────────────┐
│  Cliente paga na Cakto                   │
│  pay.cakto.com.br/hhxugxb_668446        │
└──────────────┬───────────────────────────┘
               │
               │ Webhook processa
               │
               ▼
┌──────────────────────────────────────────┐
│  Edge Function processa recarga          │
│  supabase/functions/cakto-webhook/       │
│  index.ts → handleRecharge()             │
│                                             │
│  1. Busca recarga pendente                │
│  2. Chama RPC: processar_recarga_paga()   │
│  3. RPC adiciona minutos ao saldo:        │
│     - saldo_voz_extra += 60               │
│  4. Atualiza status: status = "paid"      │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  Aluno pode usar voz novamente           │
│  (60 minutos extras adicionados)         │
└──────────────────────────────────────────┘
```

**Código responsável:**
- `components/RecargaModal.tsx` - Modal de seleção de recarga
- `services/recargaService.ts` - Criação de recarga e geração de checkout
- `services/caktoService.ts` - Geração de URL de checkout
- `supabase/functions/cakto-webhook/index.ts` - Processamento de pagamento

---

### **7️⃣ INDICADORES VISUAIS**

#### **A) LimitesUsageIndicator**

**Local:** `components/LimitesUsageIndicator.tsx`  
**Exibido em:** `pages/BillingPage.tsx`

**O que exibe:**
- Barra de progresso de texto (mensagens usadas / limite)
- Barra de progresso de imagem (análises usadas / limite)
- Barra de progresso de voz (minutos usados / limite + extra)
- Alerta quando próximo do limite (>80%)
- Botão "Recarregue" quando minutos acabam

**Código:**
```typescript
// Busca info de uso
const infoUso = await obterInfoUsoAluno(userId);

// Exibe barras de progresso
<div>
  Texto: {infoUso.texto.usado} / {infoUso.texto.limite}
  Imagem: {infoUso.imagem.usado} / {infoUso.imagem.limite}
  Voz: {infoUso.voz.usado} / {infoUso.voz.limite + infoUso.voz.saldoExtra}
</div>
```

---

#### **B) VoiceMinutesCounter**

**Local:** `components/VoiceMinutesCounter.tsx`  
**Exibido em:** `chatbot/components/ChatbotPopup.tsx`

**O que exibe:**
- Contador de minutos restantes durante sessão de voz
- Quando chega a 0, chama `onMinutesExhausted()`
- Abre `RecargaModal` automaticamente

---

#### **C) RecargaModal**

**Local:** `components/RecargaModal.tsx`  
**Exibido em:**
- `chatbot/components/ChatbotPopup.tsx` (quando minutos acabam)
- `components/LimitesUsageIndicator.tsx` (ao clicar "Recarregue")

**O que faz:**
1. Mostra opções de recarga (FitVoice 20/60/120)
2. Aluno escolhe pacote
3. Cria recarga pendente no banco
4. Redireciona para checkout Cakto

---

## 📊 RESUMO TÉCNICO

### **Tecnologias Utilizadas**

| Componente | Tecnologia | Onde está |
|------------|-----------|-----------|
| **Frontend** | React + TypeScript + Vite | Vercel |
| **Backend (Webhook)** | Deno (Edge Functions) | Supabase |
| **Banco de Dados** | PostgreSQL | Supabase |
| **Pagamentos** | Cakto | Externo |
| **IA** | Gemini API | Google Cloud |

---

### **URLs Importantes**

| Serviço | URL |
|---------|-----|
| **App Principal** | `https://fit-coach-ia.vercel.app` |
| **Página de Vendas** | `https://fit-coach-ia.vercel.app/#/premium` |
| **Webhook Cakto** | `https://[projeto].supabase.co/functions/v1/cakto-webhook` |
| **Checkout Cakto** | `https://pay.cakto.com.br/[checkout_id]` |

---

### **Variáveis de Ambiente**

#### **Frontend (Vercel):**
```env
VITE_SUPABASE_URL=https://[projeto].supabase.co
VITE_SUPABASE_ANON_KEY=[chave anon]
VITE_GEMINI_API_KEY=[chave Gemini]
VITE_GIF_CDN_URL=[URL do CDN]
```

#### **Backend (Supabase Edge Function):**
```env
SUPABASE_URL=https://[projeto].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service role key]
CAKTO_WEBHOOK_SECRET=[segredo do webhook]
```

---

### **Mapeamento de Checkout IDs**

**Arquivo:** `services/caktoService.ts`

```typescript
const CAKTO_CHECKOUT_IDS = {
  // Recargas FitVoice ✅
  'FitVoice20': 'ihfy8cz_668443',      // R$ 5,00
  'FitVoice60': 'hhxugxb_668446',      // R$ 12,90
  'FitVoice120': '3smg99n_693764',     // R$ 19,90
  
  // Planos FitCoach ✅
  'FitCoach50': 'cemyp2n_668537',      // R$ 299,90
  'FitCoach100': 'vi6djzq_668541',     // R$ 549,90
  'FitCoach200': '3b2kpwc_671196',     // R$ 999,90
  'FitCoach400': '3dis6ds_668546',     // R$ 1.799,90
  
  // Plano Anual VIP ✅
  'annual_vip': 'xphpm5f_703310',      // R$ 2.199,90
};
```

---

## 🔄 FLUXO VISUAL COMPLETO

```
┌──────────────┐
│   CLIENTE    │
│  (Academia)  │
└──────┬───────┘
       │ 1. Acessa página de vendas
       │    fit-coach-ia.vercel.app/#/premium
       ▼
┌───────────────────────────────────┐
│   PÁGINA DE VENDAS (Vercel)       │
│   - Exibe planos FitCoach         │
│   - Mostra preços e features      │
└──────┬────────────────────────────┘
       │ 2. Clica "Assinar FitCoach 50"
       │    → getCaktoCheckoutUrl('FitCoach50')
       ▼
┌───────────────────────────────────┐
│   CHECKOUT CAKTO                  │
│   pay.cakto.com.br/cemyp2n_668537 │
│   - Cliente preenche dados        │
│   - Efetua pagamento              │
└──────┬────────────────────────────┘
       │ 3. Pagamento confirmado
       │    → Cakto envia webhook
       ▼
┌───────────────────────────────────┐
│   WEBHOOK SUPABASE                │
│   Edge Function: cakto-webhook    │
│   - Valida autenticação           │
│   - Identifica produto            │
│   - Processa pagamento            │
└──────┬────────────────────────────┘
       │ 4. Atualiza banco
       ▼
┌───────────────────────────────────┐
│   BANCO DE DADOS (Supabase)       │
│   - Cria empresa (companies)      │
│   - Gera master_code              │
│   - Cria código de convite        │
│   - Envia email                   │
└──────┬────────────────────────────┘
       │ 5. Academia recebe código
       │    Compartilha com alunos
       ▼
┌───────────────────────────────────┐
│   ALUNO USA CÓDIGO                │
│   - Cadastra no app               │
│   - Vinculado à academia          │
│   - Recebe limites do plano       │
└──────┬────────────────────────────┘
       │ 6. Aluno usa IA
       ▼
┌───────────────────────────────────┐
│   VERIFICAÇÃO DE LIMITES          │
│   - Antes de cada chamada IA      │
│   - Consulta limites da academia  │
│   - Verifica uso atual            │
│   - Permite ou bloqueia           │
└──────┬────────────────────────────┘
       │ 7. Se permitido, chama IA
       ▼
┌───────────────────────────────────┐
│   GEMINI API                      │
│   - Processa mensagem/imagem/voz  │
│   - Retorna resposta              │
└──────┬────────────────────────────┘
       │ 8. Após sucesso, consome uso
       ▼
┌───────────────────────────────────┐
│   ATUALIZA USO                    │
│   - uso_texto += 1                │
│   - uso_imagem += 1               │
│   - uso_voz_minutos += X          │
│   - Salva no banco                │
└───────────────────────────────────┘
```

---

## 🎯 FUNCIONALIDADES PRINCIPAIS

### **1. Verificação de Limites**
- ✅ Antes de cada uso de IA
- ✅ Consulta limites da academia
- ✅ Bloqueia se excedido
- ✅ Mensagem específica baseada no motivo

### **2. Consumo de Uso**
- ✅ Texto: +1 mensagem por chamada
- ✅ Imagem: +1 análise por foto
- ✅ Voz: +1 minuto (tempo real durante sessão)
- ✅ Planos: +1 geração (conta como texto)

### **3. Recargas FitVoice**
- ✅ Modal quando minutos acabam
- ✅ 3 pacotes: 20/60/120 minutos
- ✅ Checkout integrado com Cakto
- ✅ Adição automática ao saldo

### **4. Indicadores Visuais**
- ✅ Barras de progresso por tipo de uso
- ✅ Alertas quando próximo do limite
- ✅ Botão de recarga quando necessário
- ✅ Contador de minutos em tempo real (voz)

---

## ✅ STATUS ATUAL

**✅ SISTEMA 100% FUNCIONAL**

- ✅ Página de venda funcionando
- ✅ Checkout Cakto funcionando
- ✅ Webhook processando pagamentos
- ✅ Banco de dados atualizado
- ✅ Verificação de limites ativa
- ✅ Consumo de uso funcionando
- ✅ Recargas FitVoice integradas
- ✅ Indicadores visuais exibindo corretamente
- ✅ Modo demo implementado (3 interações)
- ✅ Trial removido

---

**Data:** 2026-01-18  
**Status:** ✅ **SISTEMA COMPLETO E FUNCIONAL**
