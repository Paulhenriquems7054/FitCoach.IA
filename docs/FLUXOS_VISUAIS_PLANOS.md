# 📊 Fluxos Visuais: Como Cada Tipo de Plano Funciona

## 🎯 Visão Geral

Este documento mostra visualmente como cada tipo de plano funciona, desde a compra até a liberação de acesso no app.

---

## 1️⃣ Plano B2C (Mensal/Anual)

### Fluxo Completo

```
┌─────────────────┐
│ Cliente compra  │
│ na página de    │
│ vendas          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cakto processa  │
│ pagamento       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Webhook enviado │
│ para Supabase   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Edge Function identifica        │
│ plan_group = 'b2c'              │
│ em app_plans                    │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Cria registro em                │
│ user_subscriptions:             │
│ - user_email                    │
│ - plan_slug                     │
│ - status = 'active'              │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ App verifica:                   │
│ SELECT * FROM user_subscriptions│
│ WHERE user_email = ...          │
│ AND status = 'active'            │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────┐
│ ✅ Acesso       │
│ Premium         │
│ Liberado        │
└─────────────────┘
```

### Tabelas Envolvidas

- `app_plans` → Mapeamento do plano
- `user_subscriptions` → Assinatura do usuário

---

## 2️⃣ Plano B2B Academia

### Fluxo Completo

```
┌─────────────────┐
│ Academia compra  │
│ plano B2B        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cakto processa  │
│ pagamento       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Webhook enviado │
│ para Supabase   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Edge Function identifica        │
│ plan_group = 'b2b_academia'     │
│ em app_plans                    │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Cria registro em                │
│ academy_subscriptions:           │
│ - academy_email                 │
│ - plan_slug                     │
│ - max_licenses                  │
│ - licenses_used = 0             │
│ - activation_code = "ACADEMIA- │
│   XYZ123" (gerado)              │
│ - status = 'active'             │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Envia email para academia com  │
│ código de ativação              │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Academia distribui código para │
│ alunos (WhatsApp, email, etc.)  │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Aluno ativa código no app       │
│ usando validateAndActivateCode()│
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ App cria registro em            │
│ student_academy_links:          │
│ - student_user_id               │
│ - academy_subscription_id       │
│ - activation_code               │
│ - status = 'active'             │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ App incrementa licenses_used    │
│ em academy_subscriptions        │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────┐
│ ✅ Aluno ganha  │
│ acesso Premium  │
│ (enquanto       │
│ academia está   │
│ ativa)          │
└─────────────────┘
```

### Tabelas Envolvidas

- `app_plans` → Mapeamento do plano
- `academy_subscriptions` → Assinatura da academia + código
- `student_academy_links` → Vínculo aluno ↔ academia

---

## 3️⃣ Recarga (One-Time)

### Fluxo Completo

```
┌─────────────────┐
│ Cliente compra  │
│ recarga         │
│ (Turbo/Voz/Pass)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cakto processa  │
│ pagamento       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Webhook enviado │
│ para Supabase   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Edge Function identifica        │
│ plan_group = 'recarga'           │
│ em app_plans                    │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Cria registro em recharges:     │
│ - user_email                    │
│ - recharge_slug                 │
│ - recharge_type (turbo/voz/pass)│
│ - quantity (30min/100min/30d)   │
│ - status = 'active'             │
│ - expires_at (para turbo/pass)  │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ App verifica recargas ativas    │
│ ao calcular limites de uso      │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Aplica benefício:               │
│ - Turbo: +30min boost (24h)     │
│ - Voz: +100min saldo (∞)        │
│ - Pass: ilimitado (30 dias)    │
└─────────────────────────────────┘
```

### Tabelas Envolvidas

- `app_plans` → Mapeamento da recarga
- `recharges` → Recarga comprada

---

## 🔄 Comparação dos Fluxos

| Aspecto | B2C | B2B Academia | Recarga |
|---------|-----|--------------|---------|
| **Tabela Criada** | `user_subscriptions` | `academy_subscriptions` | `recharges` |
| **Código Gerado?** | ❌ Não | ✅ Sim | ❌ Não |
| **Vínculo Necessário?** | ❌ Não | ✅ Sim (`student_academy_links`) | ❌ Não |
| **Verificação no App** | Por `user_email` | Por `student_user_id` → `academy_subscriptions` | Por `user_email` |
| **Expira?** | Sim (mensal/anual) | Sim (quando academia cancela) | Depende do tipo |
| **Renovação** | Automática | Manual (academia renova) | One-time |

---

## 📝 Exemplo Prático: Fluxo B2B Completo

### Passo 1: Academia Compra

```
Academia "FitLife" compra plano "Pack Starter" (R$ 299,90/mês)
  ↓
Cakto processa pagamento
  ↓
Webhook enviado para Supabase
```

### Passo 2: Edge Function Processa

```typescript
// Edge Function recebe webhook
{
  "event": "payment.completed",
  "data": {
    "product": { "short_id": "cemyp2n_668537" },
    "customer": { "email": "academia@fitlife.com" }
  }
}

// Busca em app_plans
SELECT * FROM app_plans 
WHERE cakto_checkout_id = 'cemyp2n_668537';
// Retorna: plan_group = 'b2b_academia', slug = 'b2b_academia_starter'

// Cria academy_subscriptions
INSERT INTO academy_subscriptions VALUES (
  academy_email: 'academia@fitlife.com',
  plan_slug: 'b2b_academia_starter',
  max_licenses: 20,
  licenses_used: 0,
  activation_code: 'ACADEMIA-XYZ123', // Gerado
  status: 'active'
);
```

### Passo 3: Academia Recebe Código

```
Email enviado para academia@fitlife.com:
"Seu código de ativação: ACADEMIA-XYZ123
Compartilhe este código com seus alunos para que eles tenham acesso Premium."
```

### Passo 4: Aluno Ativa Código

```
Aluno "João" cria conta no app
  ↓
Aluno digita código: "ACADEMIA-XYZ123"
  ↓
App valida código:
  ✓ Código existe
  ✓ Academia está ativa
  ✓ Licenças disponíveis (0 < 20)
  ✓ João não está vinculado a outra academia
  ↓
App cria vínculo:
INSERT INTO student_academy_links VALUES (
  student_user_id: 'joao-uuid',
  academy_subscription_id: 'academia-uuid',
  activation_code: 'ACADEMIA-XYZ123',
  status: 'active'
);
  ↓
App incrementa contador:
UPDATE academy_subscriptions 
SET licenses_used = 1 
WHERE id = 'academia-uuid';
  ↓
João ganha acesso Premium! ✅
```

### Passo 5: Verificação Contínua

```
Toda vez que João usa o app:
  ↓
App verifica:
SELECT * FROM student_academy_links
WHERE student_user_id = 'joao-uuid'
AND status = 'active'
  ↓
App verifica se academia ainda está ativa:
SELECT * FROM academy_subscriptions
WHERE id = 'academia-uuid'
AND status = 'active'
  ↓
Se ambos ativos → Acesso Premium mantido ✅
Se academia cancelou → Acesso revogado ❌
```

---

## ✅ Checklist de Implementação

### Backend (Supabase)

- [x] Tabela `app_plans` criada e preenchida
- [x] Tabela `academy_subscriptions` criada
- [x] Tabela `user_subscriptions` criada
- [x] Tabela `recharges` criada
- [x] Tabela `student_academy_links` criada
- [x] Edge Function `cakto-webhook` configurada
- [x] Edge Function gera códigos de ativação
- [x] Campo `licenses_used` em `academy_subscriptions`

### Frontend (App)

- [x] Função `checkUserAccess()` implementada
- [x] Hook `useAccess()` implementado
- [x] Função `validateAndActivateCode()` implementada
- [ ] Tela de ativação de código implementada
- [ ] Verificação de acesso em todas as telas premium
- [ ] Componente `ProtectedFeature` implementado

---

**Última atualização:** Dezembro 2025

