# 📋 Como a Página de Vendas Deve Mostrar os Planos

## 🎯 Estrutura da Página de Vendas

A página de vendas deve ter **navegação por seções/abas** para organizar os diferentes tipos de planos:

### 1. **Seção #pricing (Planos B2C - Individuais)**

**Localização**: Página Home, seção `#pricing`

**Planos a exibir**:

#### Plano Mensal (Uso da IA)
- **Preço**: R$ 34,90/mês (checkout: R$ 35,89)
- **Checkout URL**: https://pay.cakto.com.br/zeygxve_668421
- **Features**:
  - Análise de fotos e treinos com IA
  - Treinos personalizados sob demanda
  - Chat de texto ilimitado
  - 15 min/dia de consultoria de voz (Live)
  - Cobrança individual, cancelamento a qualquer momento
- **Limites**:
  - Chat: Ilimitado
  - Voz: 15 min/dia
  - Visão: Ilimitado
  - Planos: Ilimitado

#### Plano Anual VIP (Uso da IA)
- **Preço**: R$ 297,00/ano ou 12x de R$ 34,53 (checkout: R$ 297,99)
- **Checkout URL**: https://pay.cakto.com.br/wvbkepi_668441
- **Economia**: R$ 200,00 em relação ao mensal
- **Features**:
  - Tudo do plano mensal
  - Acesso imediato
  - Garantia de satisfação
  - Economia de R$ 200,00
- **Badge**: "Mais Vantajoso" ou "Mais Popular"

**Layout**: 2 colunas (grid responsivo)

---

### 2. **Seção B2B (Planos para Academias)**

**Localização**: Aba/Página B2B (`activePage === 'b2b'`)

**Planos a exibir**:

#### Starter Mini (NOVO)
- **Preço**: R$ 149,90/mês (checkout: R$ 150,89)
- **Checkout URL**: https://pay.cakto.com.br/3b2kpwc_671196
- **Capacidade**: até ~10 alunos
- **Features**:
  - Painel do Administrador
  - Cadastro de unidades e profissionais
  - Convites por link/QR Code para até 10 alunos
  - Visão geral de trials, ativos e inativos
  - Relatórios gerais de engajamento

#### Starter
- **Preço**: R$ 299,90/mês (checkout: R$ 300,89)
- **Checkout URL**: https://pay.cakto.com.br/cemyp2n_668537
- **Capacidade**: até ~20 alunos
- **Features**:
  - Dashboards para Administrador e Personais
  - Convites por link/QR para dezenas de alunos
  - Acompanhamento de trials, ativos e inativos
  - Gestão centralizada da base de alunos digitais

#### Growth (Mais Vendido)
- **Preço**: R$ 649,90/mês (checkout: R$ 650,89)
- **Checkout URL**: https://pay.cakto.com.br/vi6djzq_668541
- **Capacidade**: até ~50 alunos
- **Badge**: "MAIS VENDIDO"
- **Features**:
  - Painel em tempo real de engajamento por unidade
  - Organização de alunos por turma, horário e professor
  - Exportação de relatórios (CSV/PDF) para diretoria
  - Diferentes níveis de acesso (admin, coordenação, personal)
  - Suporte prioritário

#### Pro
- **Preço**: R$ 1.199,90/mês (checkout: R$ 1.200,89)
- **Checkout URL**: https://pay.cakto.com.br/3dis6ds_668546
- **Capacidade**: até ~100 alunos
- **Features**:
  - Gestão de grandes volumes de alunos
  - Contas para múltiplos gestores e coordenadores
  - Comparativo de engajamento entre unidades
  - Relatórios executivos para diretoria
  - Suporte próximo para implementação

**Layout**: 4 colunas (grid responsivo: 1 col mobile, 2 cols tablet, 4 cols desktop)

---

### 3. **Seção Personal Trainers**

**Localização**: Aba/Página Personal Trainers (`activePage === 'personal'`)

**Planos a exibir**:

#### Team 5 (Iniciante)
- **Preço**: R$ 99,90/mês (checkout: R$ 100,89)
- **Checkout URL**: https://pay.cakto.com.br/3dgheuc_666289
- **Capacidade**: até ~5 alunos
- **Features**:
  - Painel para organizar até ~5 alunos ativos
  - Histórico de treinos e acompanhamento básico
  - Convites por link/QR Code enviados pelo WhatsApp
  - Relatórios básicos de engajamento

#### Team 15 (Elite - Mais Vantajoso)
- **Preço**: R$ 249,90/mês (checkout: R$ 250,89)
- **Checkout URL**: https://pay.cakto.com.br/3etp85e_666303
- **Capacidade**: até ~15 alunos
- **Badge**: "MAIS VANTAJOSO"
- **Features**:
  - Organização de até ~15 alunos ativos
  - Visão clara de quem está em trial, ativo ou parado
  - Ferramentas para renovar planos e aumentar retenção
  - Relatórios para mostrar resultados na renovação

**Layout**: 2 colunas (grid responsivo)

---

### 4. **Seção Recargas**

**Localização**: Aba/Página Recarga (`activePage === 'recharge'`)

**Planos a exibir**:

#### Ajuda Rápida (Urgência)
- **Preço**: R$ 5,00 (checkout: R$ 5,99)
- **Checkout URL**: https://pay.cakto.com.br/ihfy8cz_668443
- **Benefício**: +20 minutos de voz
- **Validade**: 24 horas
- **Badge**: "URGÊNCIA"

#### Minutos de Reserva (Melhor Escolha)
- **Preço**: R$ 12,90 (checkout: R$ 13,89)
- **Checkout URL**: https://pay.cakto.com.br/hhxugxb_668446
- **Benefício**: +100 minutos de voz
- **Validade**: não expira (banco de minutos)
- **Badge**: "MELHOR ESCOLHA"

#### Conversa Ilimitada (VIP)
- **Preço**: R$ 19,90 (checkout: R$ 20,89)
- **Checkout URL**: https://pay.cakto.com.br/trszqtv_668453
- **Benefício**: ilimitado por 30 dias
- **Funcionalidade**: remove o limite de 15 minutos diários
- **Badge**: "VIP"

**Layout**: 3 colunas (grid responsivo)

---

## 🎨 Design e UX

### Navegação por Abas
```
┌─────────────────────────────────────────┐
│ [Planos Individuais] [Academias]       │
│ [Personal Trainers] [Recargas]         │
└─────────────────────────────────────────┘
```

### Cards de Planos

Cada plano deve ter:
- **Título**: Nome do plano
- **Preço**: Destaque visual grande
- **Badge** (se aplicável): "Mais Vendido", "Mais Vantajoso", "Melhor Escolha", etc.
- **Descrição**: Texto explicativo
- **Features**: Lista com checkmarks (✓)
- **Botão CTA**: "Assinar Agora" ou "Comprar Agora"
- **Checkout**: Redireciona para URL Cakto em nova aba

### Exemplo de Card

```
┌─────────────────────────────┐
│    [MAIS VENDIDO]           │
│                             │
│  Growth                     │
│  R$ 649,90/mês              │
│                             │
│  Painel em tempo real...    │
│                             │
│  ✓ Painel tempo real        │
│  ✓ Organização por turma    │
│  ✓ Exportação CSV/PDF       │
│  ✓ Suporte prioritário      │
│                             │
│  [Assinar Agora]            │
└─────────────────────────────┘
```

## 🔗 Integração com Checkout

### Comportamento do Botão
1. Usuário clica em "Assinar Agora" / "Comprar Agora"
2. Verifica se tem `checkout_url_monthly` ou `checkout_url_yearly`
3. Se tiver URL: abre checkout Cakto em nova aba (`window.open(url, '_blank')`)
4. Se não tiver URL: redireciona para `/login` ou `/premium`

### URLs de Checkout
Todos os planos têm URLs Cakto configuradas no banco de dados (`subscription_plans.checkout_url_monthly` ou `checkout_url_yearly`).

## 📱 Responsividade

- **Mobile**: 1 coluna
- **Tablet**: 2 colunas (B2C, Personal) ou 3 colunas (Recargas)
- **Desktop**: 2-4 colunas conforme categoria

## ✅ Checklist de Implementação

- [x] Navegação por abas implementada
- [x] Planos B2C carregados do banco
- [x] Planos B2B carregados do banco
- [x] Planos Personal carregados do banco
- [x] Recargas carregadas do banco
- [x] Badges para planos populares
- [x] Botões de checkout funcionando
- [x] Layout responsivo
- [x] Loading states
- [x] Features listadas com checkmarks

---

**Última atualização**: 23/12/2025

