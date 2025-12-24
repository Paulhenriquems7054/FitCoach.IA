# 🎨 Estrutura Visual da Página de Vendas - Como Mostrar os Planos

## 📐 Layout Geral

```
┌─────────────────────────────────────────────────────────┐
│                    HEADER                                │
│  [Logo]                                    [Entrar]     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    HERO SECTION                          │
│  Treinos e Nutrição Consciente                          │
│  Planos alimentares personalizados...                   │
│                                                          │
│  [DESLIZE PARA ENTRAR]                                  │
│  [Tenho um convite]                                     │
│  [Ver Planos e Preços] ← NOVO                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              SEÇÃO DE PLANOS (PRICING)                   │
│                                                          │
│  [← Voltar]  Planos e Preços                            │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │ [B2C] [B2B] [Personal] [Recargas]           │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  PLANO   │  │  PLANO   │  │  PLANO   │             │
│  │   CARD   │  │   CARD   │  │   CARD   │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Seção 1: Planos B2C (Individuais - IA)

### Layout: 2 Colunas

```
┌─────────────────────────────────────────────────────────┐
│        Planos Individuais - Uso da IA                   │
│  Escolha o plano ideal para continuar usando...         │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────┐  ┌──────────────────────────┐
│                          │  │    [MAIS VANTAJOSO]      │
│   Plano Mensal           │  │                          │
│                          │  │  Plano Anual VIP         │
│   R$ 34,90/mês           │  │                          │
│                          │  │  R$ 297,00/ano           │
│  Análise de fotos...     │  │  ou 12x de R$ 34,53     │
│                          │  │                          │
│  ✓ Chat ilimitado        │  │  ✓ Tudo do mensal        │
│  ✓ Voz 15min/dia         │  │  ✓ Economia R$ 200      │
│  ✓ Análise fotos         │  │  ✓ Garantia satisfação   │
│  ✓ Treinos personalizados│  │  ✓ Acesso imediato       │
│                          │  │                          │
│  [Assinar Agora]         │  │  [Assinar Agora]         │
└──────────────────────────┘  └──────────────────────────┘
```

### Detalhes do Card B2C

**Plano Mensal**:
- Título: "Plano Mensal"
- Preço: **R$ 34,90** (destaque grande)
- Período: "/mês"
- Descrição: Texto explicativo
- Features: Lista com checkmarks
- Botão: "Assinar Agora" → Abre checkout Cakto

**Plano Anual VIP**:
- Badge: "MAIS VANTAJOSO" (topo do card)
- Título: "Plano Anual VIP"
- Preço: **R$ 297,00** (destaque grande)
- Período: "/ano"
- Parcelamento: "ou 12x de R$ 34,53"
- Economia: "Economia de R$ 200,00" (destaque verde)
- Features: Lista com checkmarks
- Botão: "Assinar Agora" → Abre checkout Cakto

---

## 🏢 Seção 2: Planos B2B (Academias)

### Layout: 4 Colunas (Desktop) / 2 Colunas (Tablet) / 1 Coluna (Mobile)

```
┌─────────────────────────────────────────────────────────┐
│        Planos para Academias                            │
│  Ofereça acesso Premium aos seus alunos...              │
└─────────────────────────────────────────────────────────┘

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Starter  │ │ Starter  │ │[MAIS     │ │   Pro    │
│   Mini   │ │          │ │VENDIDO]  │ │          │
│          │ │          │ │          │ │          │
│ R$ 149,90│ │ R$ 299,90│ │ R$ 649,90│ │ R$ 1.199 │
│          │ │          │ │          │ │          │
│ ✓ Painel │ │ ✓ Dash   │ │ ✓ Tempo  │ │ ✓ Grandes│
│ ✓ 10 al. │ │ ✓ 20 al. │ │ ✓ 50 al. │ │ ✓ 100 al.│
│          │ │          │ │          │ │          │
│ [Assinar]│ │ [Assinar]│ │ [Assinar]│ │ [Assinar]│
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### Detalhes dos Cards B2B

**Starter Mini**:
- Título: "Starter Mini"
- Preço: **R$ 149,90/mês**
- Capacidade: "até ~10 alunos"
- Features: Lista resumida
- Botão: "Assinar Agora"

**Starter**:
- Título: "Starter"
- Preço: **R$ 299,90/mês**
- Capacidade: "até ~20 alunos"
- Features: Lista resumida
- Botão: "Assinar Agora"

**Growth** (Mais Vendido):
- Badge: "MAIS VENDIDO" (topo do card, animado)
- Título: "Growth"
- Preço: **R$ 649,90/mês**
- Capacidade: "até ~50 alunos"
- Features: Lista completa
- Destaque: Ring/borda destacada
- Botão: "Assinar Agora"

**Pro**:
- Título: "Pro"
- Preço: **R$ 1.199,90/mês**
- Capacidade: "até ~100 alunos"
- Features: Lista completa
- Botão: "Assinar Agora"

---

## 💪 Seção 3: Personal Trainers

### Layout: 2 Colunas

```
┌─────────────────────────────────────────────────────────┐
│        Planos para Personal Trainers                    │
│  Gerencie seus alunos e ofereça treinos...              │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────┐  ┌──────────────────────────┐
│   Team 5                 │  │    [MAIS VANTAJOSO]      │
│   (Iniciante)            │  │                          │
│                          │  │  Team 15                 │
│   R$ 99,90/mês           │  │  (Elite)                 │
│                          │  │                          │
│  ✓ Até 5 alunos          │  │  R$ 249,90/mês           │
│  ✓ Histórico básico      │  │                          │
│  ✓ Convites WhatsApp     │  │  ✓ Até 15 alunos         │
│  ✓ Relatórios básicos    │  │  ✓ Visão trials/ativos   │
│                          │  │  ✓ Ferramentas retenção  │
│  [Assinar Agora]         │  │  ✓ Relatórios renovação  │
│                          │  │                          │
│                          │  │  [Assinar Agora]         │
└──────────────────────────┘  └──────────────────────────┘
```

---

## ⚡ Seção 4: Recargas

### Layout: 3 Colunas

```
┌─────────────────────────────────────────────────────────┐
│        Recargas Instantâneas                            │
│  Precisa de mais tempo de conversa? Recarregue...      │
└─────────────────────────────────────────────────────────┘

┌──────────┐  ┌──────────┐  ┌──────────┐
│[URGÊNCIA]│  │[MELHOR   │  │  [VIP]   │
│          │  │ESCOLHA]  │  │          │
│Ajuda     │  │Minutos   │  │Conversa  │
│Rápida    │  │Reserva   │  │Ilimitada │
│          │  │          │  │          │
│R$ 5,00   │  │R$ 12,90  │  │R$ 19,90  │
│          │  │          │  │          │
│✓ +20 min │  │✓ +100 min│  │✓ 30 dias │
│✓ 24h     │  │✓ Não exp │  │✓ Sem lim │
│          │  │          │  │          │
│[Comprar] │  │[Comprar] │  │[Comprar] │
└──────────┘  └──────────┘  └──────────┘
```

---

## 🎨 Elementos Visuais

### Badges
- **"MAIS VENDIDO"**: Growth (B2B) - Badge animado, cor primária
- **"MAIS VANTAJOSO"**: Anual VIP (B2C), Team 15 (Personal) - Badge verde
- **"MELHOR ESCOLHA"**: Minutos de Reserva (Recarga) - Badge azul
- **"URGÊNCIA"**: Ajuda Rápida (Recarga) - Badge amarelo/laranja
- **"VIP"**: Conversa Ilimitada (Recarga) - Badge roxo

### Cores
- **Primária**: Verde esmeralda (#10b981, #1A4D2E)
- **Destaque**: Amarelo/Âmbar para badges especiais
- **Texto**: Slate (cinza escuro)
- **Background**: Gradiente verde claro → slate claro

### Tipografia
- **Títulos**: Font-serif, bold, tamanho grande
- **Preços**: Font-bold, tamanho 4xl, cor primária
- **Features**: Font-normal, tamanho sm, com checkmarks

### Interatividade
- **Hover**: Cards aumentam levemente (scale-105)
- **Click**: Botões mudam de cor
- **Badges**: Animação pulse nos planos populares
- **Loading**: Spinner durante carregamento

---

## 📱 Responsividade

### Mobile (< 768px)
- 1 coluna para todos os planos
- Abas empilhadas verticalmente
- Cards em largura total
- Botões em largura total

### Tablet (768px - 1024px)
- B2C: 2 colunas
- B2B: 2 colunas
- Personal: 2 colunas
- Recargas: 3 colunas

### Desktop (> 1024px)
- B2C: 2 colunas
- B2B: 4 colunas
- Personal: 2 colunas
- Recargas: 3 colunas

---

## ✅ Checklist de Implementação

- [x] Navegação por abas
- [x] Seção B2C com 2 planos
- [x] Seção B2B com 4 planos
- [x] Seção Personal com 2 planos
- [x] Seção Recargas com 3 planos
- [x] Badges nos planos populares
- [x] Cards com design consistente
- [x] Botões de checkout funcionando
- [x] Layout responsivo
- [x] Loading states
- [x] Features listadas
- [x] Preços destacados
- [x] Descrições dos planos

---

**Última atualização**: 23/12/2025

