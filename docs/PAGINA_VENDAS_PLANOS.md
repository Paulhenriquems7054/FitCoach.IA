# 📄 Página de Vendas - Planos e Preços

## ✅ Implementação Completa

### O que foi implementado

A **LandingPage** agora possui uma seção completa de planos e preços com navegação por abas, permitindo que visitantes não logados vejam todos os planos disponíveis.

### Estrutura da Página

#### 1. **Home (Tela Inicial)**
- Hero section com título "Treinos e Nutrição Consciente"
- Slider interativo "DESLIZE PARA ENTRAR"
- Botão "Tenho um convite"
- **NOVO**: Botão "Ver Planos e Preços" que abre a seção de pricing

#### 2. **Seção de Planos (Pricing)**
- Navegação por abas:
  - **Planos Individuais (IA)** - B2C
  - **Planos para Academias** - B2B
  - **Personal Trainers** - Personal
  - **Recargas** - Recargas

### Planos Exibidos

#### **Planos B2C (Individuais - IA)**
- **Plano Mensal**: R$ 34,90/mês
- **Plano Anual VIP**: R$ 297,00/ano (Mais Vantajoso)
- Layout: 2 colunas
- Features destacadas
- Botão "Assinar Agora" → Redireciona para checkout Cakto

#### **Planos B2B (Academias)**
- **Starter Mini**: R$ 149,90/mês
- **Starter**: R$ 299,90/mês
- **Growth**: R$ 649,90/mês (Mais Vendido)
- **Pro**: R$ 1.199,90/mês
- Layout: 4 colunas (grid responsivo)
- Features destacadas
- Botão "Assinar Agora" → Redireciona para checkout Cakto

#### **Planos Personal Trainers**
- **Team 5**: R$ 99,90/mês
- **Team 15**: R$ 249,90/mês (Mais Vantajoso)
- Layout: 2 colunas
- Features destacadas
- Botão "Assinar Agora" → Redireciona para checkout Cakto

#### **Recargas**
- **Ajuda Rápida**: R$ 5,00 (Urgência)
- **Minutos de Reserva**: R$ 12,90 (Melhor Escolha)
- **Conversa Ilimitada**: R$ 19,90 (VIP)
- Layout: 3 colunas
- Features destacadas
- Botão "Comprar Agora" → Redireciona para checkout Cakto

### Funcionalidades

1. **Carregamento Dinâmico**: Planos carregados do banco de dados (`subscription_plans`)
2. **Navegação por Abas**: Troca entre categorias de planos
3. **Checkout Direto**: Botões redirecionam para URLs Cakto
4. **Design Responsivo**: Adapta-se a diferentes tamanhos de tela
5. **Badges**: Planos populares destacados com badges
6. **Loading State**: Indicador de carregamento enquanto busca planos

### Fluxo do Usuário

```
┌─────────────────────┐
│  Landing Page       │
│  (Home)             │
└──────────┬──────────┘
           │
           │ Clica "Ver Planos e Preços"
           ▼
┌─────────────────────┐
│  Seção Pricing      │
│  (Abas)             │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌─────────┐  ┌─────────┐
│ Aba B2C │  │ Aba B2B │
│         │  │         │
│ Aba     │  │ Aba     │
│ Personal│  │ Recarga │
└────┬────┘  └────┬────┘
     │             │
     │ Clica "Assinar Agora"
     ▼
┌─────────────────────┐
│  Checkout Cakto     │
│  (Nova aba)         │
└─────────────────────┘
```

### Código Implementado

#### Estados
```typescript
const [screen, setScreen] = useState<ScreenState>('home');
const [activePricingTab, setActivePricingTab] = useState<PricingTab>('b2c');
const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);
const [loadingPlans, setLoadingPlans] = useState(false);
```

#### Carregamento de Planos
```typescript
useEffect(() => {
  if (screen === 'pricing' && allPlans.length === 0) {
    loadPlans();
  }
}, [screen]);
```

#### Seleção de Plano
```typescript
const handleSelectPlan = (plan: SubscriptionPlan) => {
  const checkoutUrl = plan.checkout_url_monthly || plan.checkout_url_yearly;
  if (checkoutUrl) {
    window.open(checkoutUrl, '_blank');
  } else {
    window.location.hash = '#/login';
  }
};
```

### Design

- **Glassmorphism**: Cards com efeito de vidro
- **Badges Animados**: Planos populares destacados
- **Hover Effects**: Interatividade nos botões
- **Responsive Grid**: Layout adaptável
- **Cores**: Paleta verde esmeralda (#1A4D2E, #10b981)

### Acessibilidade

- Botões com `aria-label`
- Navegação por teclado
- Contraste adequado
- Textos descritivos

## ✅ Status

- ✅ Seção de planos implementada
- ✅ Navegação por abas funcionando
- ✅ Carregamento dinâmico de planos
- ✅ Checkout direto para Cakto
- ✅ Design responsivo
- ✅ Badges e destaques
- ✅ Loading states

---

**Última atualização**: 23/12/2025

