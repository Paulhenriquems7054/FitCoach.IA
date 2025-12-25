# ✅ Resumo: Redirecionamento para Página de Vendas Externa

## 🎯 Objetivo

Quando um **aluno** quer adquirir mais créditos para falar com a IA, o app deve redirecionar para a **página de vendas externa** em vez de páginas internas.

## 📍 URL da Página Externa

**Base**: `https://fit-coach-ia.vercel.app`

## 🔗 Seções da Página Externa

### Para Alunos (B2B2C) - Adquirir Créditos de IA
- **URL**: `https://fit-coach-ia.vercel.app/#pricing`
- **Seção**: Planos B2C (Individuais - Uso da IA)
- **Planos**: Mensal (R$ 34,90) e Anual VIP (R$ 297,00)

### Para Recargas (Alunos)
- **URL**: `https://fit-coach-ia.vercel.app/?activePage=recharge`
- **Seção**: Recargas
- **Planos**: Ajuda Rápida, Minutos de Reserva, Conversa Ilimitada

### Para Academias
- **URL**: `https://fit-coach-ia.vercel.app/?activePage=b2b`
- **Seção**: Planos B2B

### Para Personal Trainers
- **URL**: `https://fit-coach-ia.vercel.app/?activePage=personal`
- **Seção**: Planos Personal

## ✅ Componentes Atualizados

Todos os componentes que redirecionam alunos para adquirir créditos agora usam `redirectToSalesPage()`:

1. ✅ **TrialExpiredPaywall** → Alunos vão para `B2C_PRICING`
2. ✅ **StudentAiPlansPage** → Fallback vai para `B2C_PRICING`
3. ✅ **TrialCounter** → Alunos vão para `B2C_PRICING`
4. ✅ **TrialExpiredBanner** → Alunos vão para `B2C_PRICING`
5. ✅ **NutriVoiceAssistant** → Alunos vão para `RECHARGE` (quando quer comprar mais tempo)
6. ✅ **PremiumGate** → Alunos vão para `B2C_PRICING`
7. ✅ **ProtectedFeature** → Alunos vão para `B2C_PRICING`

## 🔧 Como Funciona

### Constante Criada
```typescript
// constants/salesPage.ts
export const SALES_PAGE_URL = 'https://fit-coach-ia.vercel.app';

export function redirectToSalesPage(section?: 'B2C_PRICING' | 'B2B' | 'PERSONAL' | 'RECHARGE') {
  const url = section ? SALES_PAGE_SECTIONS[section] : SALES_PAGE_SECTIONS.HOME;
  window.open(url, '_blank'); // Abre em nova aba
}
```

### Lógica de Redirecionamento
```typescript
const isStudent = user?.tenantRole === 'student' && user?.academyId;

if (isStudent) {
  // Aluno quer adquirir créditos → Página externa B2C
  redirectToSalesPage('B2C_PRICING');
} else {
  // Outros usuários → Página interna
  window.location.hash = '#/premium';
}
```

## 📋 Checklist

- [x] Constante `salesPage.ts` criada
- [x] Todos os componentes atualizados
- [x] Redirecionamento para alunos implementado
- [x] Redirecionamento para recargas implementado
- [x] Documentação criada

## 🧪 Teste

1. Fazer login como aluno
2. Tentar usar IA (chat, voz, análise)
3. Se trial expirado, clicar em "Assinar Agora"
4. **Verificar**: Deve abrir `https://fit-coach-ia.vercel.app/#pricing` em nova aba

---

**Status**: ✅ Implementado
**Última atualização**: 23/12/2025





