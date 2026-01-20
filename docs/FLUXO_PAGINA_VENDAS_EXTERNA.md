# 🚀 Fluxo Completo: App Demo + Página de Vendas Externa

## 📋 Visão Geral

O FitCoach.AI agora funciona como um **sistema híbrido**:
- **App FitCoach** = **DEMO** (cliente vê como funciona)
- **Página de Vendas Externa** = **Onde o cliente escolhe e paga**

---

## 🔗 URL da Página de Vendas Externa

**URL Base:** `https://pagina-de-vendas-fit-coach-ai.vercel.app`

---

## 🎯 Fluxo Completo do Cliente

### **1. Cliente Acessa o App (Demo)**

```
Cliente recebe link do app → Acessa FitCoach.AI
```

**O que acontece:**
- Cliente pode **explorar o app** e ver como funciona
- Pode testar funcionalidades (com limites de demo)
- Vê a interface, recursos, etc.

**Links compartilhados:**
- Link do app: `https://fit-coach-ia.vercel.app` (ou seu domínio)
- Link da página de vendas: `https://pagina-de-vendas-fit-coach-ai.vercel.app`

---

### **2. Cliente Quer Escolher um Plano**

**Cenários que redirecionam para página externa:**

#### **A) Cliente acessa `/premium` no app**
- **O que acontece:** App redireciona automaticamente para página externa
- **Seção:** Baseada no tipo de usuário:
  - Alunos → `#pricing` (Planos Individuais COM IA)
  - Academias → `?activePage=b2b` (Planos B2B COM IA)
  - Individuais → `#pricing` (Planos B2C COM IA)

#### **B) Trial expira**
- **O que acontece:** App redireciona para página externa
- **Seção:** Baseada no tipo de conta

#### **C) Cliente clica em "Assinar" ou "Escolher Plano"**
- **O que acontece:** Abre página externa em nova aba
- **Seção:** Baseada no contexto (B2B, B2C, Recargas, etc.)

---

### **3. Cliente Escolhe Plano na Página Externa**

**Página Externa:** `https://pagina-de-vendas-fit-coach-ai.vercel.app`

**Seções disponíveis:**

| Seção | URL | Para Quem |
|-------|-----|-----------|
| **Planos B2C (COM IA)** | `/#pricing` | Alunos e Individuais |
| **Planos B2B (COM IA)** | `/?activePage=b2b` | Academias |
| **Planos B2B Manual (SEM IA)** | `/?activePage=b2b_manual` | Academias (economia) |
| **Planos B2C Manual (SEM IA)** | `/?activePage=b2c_manual` | Individuais (economia) |
| **Recargas** | `/?activePage=recharge` | Todos (FitVoice) |
| **Personal Trainers** | `/?activePage=personal` | Personal Trainers |

**O que o cliente vê:**
- Todos os planos disponíveis
- Preços e características
- Botões "Quero este plano" / "Assinar"

---

### **4. Cliente Paga na Cakto**

**Quando clica em "Assinar":**
1. Cliente é redirecionado para **checkout da Cakto**
2. Escolhe método de pagamento (Pix, Cartão)
3. Completa o pagamento

**URL de retorno configurada na Cakto:**
```
https://[seu-projeto].supabase.co/functions/v1/cakto-webhook
```

---

### **5. Webhook Processa Pagamento**

**O que acontece:**
1. Cakto envia webhook para Supabase Edge Function
2. Webhook processa o pagamento:
   - Cria/atualiza empresa na tabela `companies`
   - Cria assinatura na tabela `subscriptions`
   - Gera código de ativação (para planos B2B)
   - Envia email com link e código

---

### **6. Cliente Recebe Email**

**Email contém:**
- **Link do app:** `https://fit-coach-ia.vercel.app`
- **Código de ativação:** Ex: `ABC123-XYZ789`
- **Instruções:** Como compartilhar com alunos

**Para planos B2B (Academias):**
- Código mestre para compartilhar com alunos
- Link do app para compartilhar

**Para planos B2C (Individuais):**
- Link do app
- Instruções de acesso

---

### **7. Cliente Compartilha com Alunos**

**Academias (B2B):**
1. Recebe código mestre (ex: `ABC123-XYZ789`)
2. Compartilha código + link do app com alunos
3. Alunos acessam app e inserem código
4. Alunos recebem acesso automático

**Individuais (B2C):**
1. Recebe link do app
2. Acessa diretamente (já está vinculado à conta)

---

## 🔧 Implementação Técnica

### **1. Arquivo: `constants/salesPage.ts`**

```typescript
export const SALES_PAGE_URL = 'https://pagina-de-vendas-fit-coach-ai.vercel.app';

export const SALES_PAGE_SECTIONS = {
  B2C_PRICING: `${SALES_PAGE_URL}/#pricing`,
  B2B: `${SALES_PAGE_URL}/?activePage=b2b`,
  B2B_MANUAL: `${SALES_PAGE_URL}/?activePage=b2b_manual`,
  B2C_MANUAL: `${SALES_PAGE_URL}/?activePage=b2c_manual`,
  RECHARGE: `${SALES_PAGE_URL}/?activePage=recharge`,
  PERSONAL: `${SALES_PAGE_URL}/?activePage=personal`,
  HOME: SALES_PAGE_URL,
};

// Redireciona em nova aba
export function redirectToSalesPage(section?: keyof typeof SALES_PAGE_SECTIONS)

// Redireciona na mesma aba (substitui página atual)
export function redirectToSalesPageSameTab(section?: keyof typeof SALES_PAGE_SECTIONS)
```

---

### **2. Arquivo: `pages/PremiumPage.tsx`**

**Comportamento:**
- Se **NÃO tem assinatura ativa** → Redireciona automaticamente para página externa
- Se **TEM assinatura ativa** → Mostra informações da assinatura (gerenciamento)

**Código:**
```typescript
useEffect(() => {
  if (loading) return;
  
  if (!activeSubscription) {
    let section: keyof typeof SALES_PAGE_SECTIONS = 'HOME';
    
    if (isStudent) {
      section = 'B2C_PRICING';
    } else if (user?.accountType === 'academy') {
      section = 'B2B';
    } else {
      section = 'B2C_PRICING';
    }
    
    redirectToSalesPageSameTab(section);
    return;
  }
}, [loading, activeSubscription, isStudent, user]);
```

---

### **3. Arquivo: `App.tsx`**

**Quando trial expira:**
- Redireciona para página externa (em vez de `/premium`)
- Seção baseada no tipo de conta

**Código:**
```typescript
if (isExpired && !isStudent) {
  const section = accountType === 'academy' ? 'B2B' : 'B2C_PRICING';
  redirectToSalesPage(section);
}
```

---

## 📊 Mapeamento de Redirecionamentos

| Situação | Tipo de Usuário | Seção Redirecionada |
|----------|----------------|---------------------|
| Acessa `/premium` | Aluno | `B2C_PRICING` |
| Acessa `/premium` | Academia | `B2B` |
| Acessa `/premium` | Individual | `B2C_PRICING` |
| Trial expira | Academia | `B2B` |
| Trial expira | Individual | `B2C_PRICING` |
| Clica "Assinar" | Aluno | `B2C_PRICING` |
| Clica "Assinar" | Academia | `B2B` |
| Quer recarga | Todos | `RECHARGE` |

---

## ✅ Vantagens do Sistema Híbrido

1. **App como Demo:**
   - Cliente vê como funciona antes de comprar
   - Aumenta conversão
   - Reduz dúvidas

2. **Página Externa Dedicada:**
   - Foco total em vendas
   - Melhor SEO
   - Mais espaço para copywriting

3. **Fluxo Simplificado:**
   - Cliente explora app → Vai para página externa → Paga → Recebe código → Compartilha

4. **Flexibilidade:**
   - Pode atualizar página de vendas sem mexer no app
   - Pode fazer A/B testing na página externa
   - Pode usar diferentes domínios

---

## 🧪 Como Testar

### **Teste 1: Redirecionamento Automático**
1. Acesse `https://fit-coach-ia.vercel.app/#/premium` (sem assinatura)
2. Deve redirecionar automaticamente para `https://pagina-de-vendas-fit-coach-ai.vercel.app/#pricing`

### **Teste 2: Trial Expirado**
1. Faça login com conta sem assinatura
2. Tente acessar funcionalidade bloqueada
3. Deve redirecionar para página externa

### **Teste 3: Botões de Assinar**
1. Clique em qualquer botão "Assinar" ou "Escolher Plano"
2. Deve abrir página externa em nova aba

---

## 📝 Checklist de Configuração

- [x] ✅ URL da página externa atualizada em `constants/salesPage.ts`
- [x] ✅ Seções de planos manuais adicionadas
- [x] ✅ `PremiumPage.tsx` redireciona automaticamente
- [x] ✅ `App.tsx` redireciona quando trial expira
- [ ] ⚠️ Verificar se página externa tem todas as seções configuradas
- [ ] ⚠️ Testar fluxo completo end-to-end
- [ ] ⚠️ Verificar se webhook está processando corretamente
- [ ] ⚠️ Verificar se emails estão sendo enviados

---

## 🎯 Próximos Passos

1. **Configurar página externa:**
   - Garantir que todas as seções estão funcionando
   - Verificar links de checkout da Cakto

2. **Testar fluxo completo:**
   - Fazer uma compra de teste
   - Verificar se webhook processa
   - Verificar se email é enviado

3. **Monitorar:**
   - Acompanhar conversões
   - Ajustar copywriting se necessário

---

**Data:** 2026-01-18  
**Status:** ✅ **IMPLEMENTADO** - Pronto para testes
