# 🔗 Redirecionamento para Página de Vendas Externa

## 📋 Resumo

O app redireciona **alunos** (students) para a **página de vendas externa** quando querem adquirir créditos para usar a IA. A página externa está em: **https://fit-coach-ia.vercel.app**

## 🎯 Quando Redirecionar

### Para Alunos (B2B2C)
Quando um aluno quer adquirir créditos para usar a IA, o app deve redirecionar para:
- **URL**: `https://fit-coach-ia.vercel.app/#pricing`
- **Seção**: Planos B2C (Individuais - IA)

### Para Outros Usuários
- **Academias**: `https://fit-coach-ia.vercel.app/?activePage=b2b`
- **Personal Trainers**: `https://fit-coach-ia.vercel.app/?activePage=personal`
- **Individuais B2C**: `https://fit-coach-ia.vercel.app/#pricing`

## 🔧 Implementação

### Constante Criada
**Arquivo**: `constants/salesPage.ts`

```typescript
export const SALES_PAGE_URL = 'https://fit-coach-ia.vercel.app';

export const SALES_PAGE_SECTIONS = {
  B2C_PRICING: `${SALES_PAGE_URL}/#pricing`,
  B2B: `${SALES_PAGE_URL}/?activePage=b2b`,
  PERSONAL: `${SALES_PAGE_URL}/?activePage=personal`,
  RECHARGE: `${SALES_PAGE_URL}/?activePage=recharge`,
  HOME: SALES_PAGE_URL,
};

export function redirectToSalesPage(section?: keyof typeof SALES_PAGE_SECTIONS) {
  const url = section ? SALES_PAGE_SECTIONS[section] : SALES_PAGE_SECTIONS.HOME;
  window.open(url, '_blank');
}
```

## ✅ Componentes Atualizados

### 1. **TrialExpiredPaywall.tsx**
- **Antes**: Redirecionava para `#/student-ai-plans` ou `#/premium`
- **Agora**: 
  - Alunos → `redirectToSalesPage('B2C_PRICING')`
  - Academias → `redirectToSalesPage('B2B')`
  - Individuais → `redirectToSalesPage('B2C_PRICING')`

### 2. **StudentAiPlansPage.tsx**
- **Antes**: Fallback redirecionava para `#/premium`
- **Agora**: Fallback redireciona para `redirectToSalesPage('B2C_PRICING')`
- **Checkout**: Continua abrindo checkout Cakto diretamente (correto)

### 3. **TrialCounter.tsx**
- **Antes**: Redirecionava para `#/premium`
- **Agora**: 
  - Alunos → `redirectToSalesPage('B2C_PRICING')`
  - Outros → `#/premium` (interno)

### 4. **TrialExpiredBanner.tsx**
- **Antes**: Redirecionava para `#/premium`
- **Agora**: 
  - Alunos → `redirectToSalesPage('B2C_PRICING')`
  - Academias → `redirectToSalesPage('B2B')`
  - Individuais → `redirectToSalesPage('B2C_PRICING')`

### 5. **NutriVoiceAssistant.tsx**
- **Antes**: Redirecionava para `#/premium` quando quer comprar mais tempo
- **Agora**: 
  - Alunos → `redirectToSalesPage('RECHARGE')` (seção de recargas)
  - Outros → `#/premium` (interno)

### 6. **PremiumGate.tsx**
- **Antes**: Redirecionava para `#/premium`
- **Agora**: 
  - Alunos → `redirectToSalesPage('B2C_PRICING')`
  - Outros → `#/premium` (interno)

### 7. **ProtectedFeature.tsx**
- **Antes**: Redirecionava para `#/premium`
- **Agora**: 
  - Alunos → `redirectToSalesPage('B2C_PRICING')`
  - Outros → `#/premium` (interno)

## 🔄 Fluxo Completo

```
┌─────────────────────┐
│  Aluno usa IA       │
│  (chat, voz, etc)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Trial expirado?    │
│  Sem créditos?      │
└──────────┬──────────┘
           │
      ┌────┴────┐
      │         │
     SIM       NÃO
      │         │
      ▼         ▼
┌──────────┐ ┌──────────┐
│ Paywall  │ │ Continua │
│ Aparece  │ │ Usando   │
└────┬─────┘ └──────────┘
     │
     │ Clica "Assinar Agora"
     ▼
┌─────────────────────┐
│  Verifica: Aluno?   │
└──────────┬──────────┘
           │
      ┌────┴────┐
      │         │
     SIM       NÃO
      │         │
      ▼         ▼
┌──────────┐ ┌──────────┐
│ Página   │ │ Premium  │
│ Externa  │ │ Interna  │
│ B2C      │ │ (#/premium)│
└──────────┘ └──────────┘
```

## 📍 URLs da Página Externa

### Seções Disponíveis

1. **B2C (Individuais - IA)**
   - URL: `https://fit-coach-ia.vercel.app/#pricing`
   - Planos: Mensal (R$ 34,90) e Anual VIP (R$ 297,00)

2. **B2B (Academias)**
   - URL: `https://fit-coach-ia.vercel.app/?activePage=b2b`
   - Planos: Starter Mini, Starter, Growth, Pro

3. **Personal Trainers**
   - URL: `https://fit-coach-ia.vercel.app/?activePage=personal`
   - Planos: Team 5, Team 15

4. **Recargas**
   - URL: `https://fit-coach-ia.vercel.app/?activePage=recharge`
   - Planos: Ajuda Rápida, Minutos de Reserva, Conversa Ilimitada

## ✅ Status

- ✅ Constante `salesPage.ts` criada
- ✅ `TrialExpiredPaywall` atualizado
- ✅ `StudentAiPlansPage` atualizado
- ✅ `TrialCounter` atualizado
- ✅ `TrialExpiredBanner` atualizado
- ✅ `NutriVoiceAssistant` atualizado
- ✅ `PremiumGate` atualizado
- ✅ `ProtectedFeature` atualizado

## 🧪 Como Testar

1. **Fazer login como aluno**
2. **Tentar usar IA** (chat, voz, análise de fotos)
3. **Se trial expirado**: Verificar se redireciona para página externa
4. **Clicar em "Assinar Agora"**: Verificar se abre `https://fit-coach-ia.vercel.app/#pricing`

---

**Última atualização**: 23/12/2025





