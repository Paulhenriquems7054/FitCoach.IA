# Estratégia de Controle de IA para Alunos da Academia

## 📋 Visão Geral

**Modelo Híbrido B2B2C:**
- **Academia paga**: Apenas pela plataforma de gerenciamento (B2B)
- **Aluno paga**: Diretamente pelo uso da IA (B2C individual)
- **Trial**: Alunos recebem **3 dias grátis** de IA ao acessar pelo código da academia

## 🎯 Fluxo Implementado

### 1. Aluno Acessa pelo Código da Academia

```
Aluno usa código de convite → Vinculado à academia → Recebe 3 dias grátis de IA
```

**O que acontece:**
- Aluno é vinculado à academia (`academyId`, `tenantRole: 'student'`)
- Trial de 3 dias de IA é ativado automaticamente
- Limites do trial: 5 min/dia de voz, 1 análise de prato, 1 plano alimentar

### 2. Durante o Trial (3 dias)

**Aluno tem acesso a:**
- ✅ Chat de texto ilimitado
- ✅ Análise de fotos (1 vez durante todo o trial)
- ✅ Geração de plano alimentar (1 vez durante todo o trial)
- ✅ Consultoria de voz (5 minutos por dia, total 15 minutos)

**Mensagem exibida:**
```
"Período de Teste Grátis! 🎉
Você tem 3 dias grátis para experimentar todas as funcionalidades de IA.
💡 Modelo de Pagamento: A academia fornece acesso à plataforma. 
Você paga diretamente pela IA (sem custo adicional para a academia)."
```

### 3. Após Trial Expirar

**Funcionalidades bloqueadas:**
- ❌ Chat de texto bloqueado
- ❌ Análise de fotos bloqueada
- ❌ Geração de plano alimentar bloqueada
- ❌ Consultoria de voz bloqueada

**Mensagem exibida:**
```
"Seu Período de Teste Expirou ⏰
Para continuar usando as funcionalidades de IA, assine um plano individual abaixo.
💡 Você paga diretamente pela IA - a academia não tem custo adicional."
```

### 4. Aluno Assina Plano Individual

**Opções disponíveis:**
- `ai_monthly`: R$ 34,90/mês
- `ai_annual_vip`: R$ 297,00/ano
- Recargas: Ajuda Rápida, Minutos de Reserva, Conversa Ilimitada

**Após assinar:**
- ✅ Todas as funcionalidades de IA desbloqueadas
- ✅ Pagamento direto do aluno (sem passar pela academia)
- ✅ Academia continua fornecendo acesso à plataforma

## 🔧 Implementação Técnica

### Arquivos Modificados

1. **`services/inviteService.ts`**
   - `acceptInvite`: Ativa trial de 3 dias para alunos
   - Alunos recebem `trial_active: true`, `trial_expires_at: +3 dias`

2. **`services/aiAccessService.ts`**
   - `getAiAccessStatus`: Verifica trial e assinatura individual de alunos
   - Alunos precisam de assinatura individual (B2C) após trial expirar

3. **`services/trialLimitsService.ts`**
   - `isInTrial`: Inclui alunos no trial
   - Limites: 5 min/dia voz, 1 análise, 1 plano alimentar

4. **`services/usageLimitService.ts`**
   - Registra uso de voz durante trial para alunos

5. **`pages/PremiumPage.tsx`**
   - Mensagens claras sobre modelo de pagamento
   - Exibe trial para alunos
   - Mostra planos individuais após trial expirar

## 💰 Modelo de Pagamento

### Academia (B2B)
```
Plano B2B (ex: academy_starter)
├── Dashboard de gerenciamento
├── Criação/gestão de alunos
├── Códigos de convite
├── Relatórios
└── ❌ NÃO inclui uso de IA para alunos
```

**Custo:** Fixo mensal (R$ 149,90 - R$ 1.199,90)

### Aluno (B2C Individual)
```
Trial: 3 dias grátis
├── 5 min/dia de voz (15 min total)
├── 1 análise de prato
└── 1 plano alimentar

Após trial:
├── ai_monthly: R$ 34,90/mês
├── ai_annual_vip: R$ 297,00/ano
└── Recargas: R$ 5,00 - R$ 19,90
```

**Custo:** Aluno paga diretamente (sem custo para academia)

## ✅ Vantagens

### Para a Academia
- ✅ Custo fixo e previsível
- ✅ Sem surpresas com uso de IA
- ✅ Foco em gestão de alunos

### Para o Aluno
- ✅ 3 dias grátis para experimentar
- ✅ Paga apenas se usar IA
- ✅ Escolhe o plano que cabe no orçamento
- ✅ Pode cancelar quando quiser

### Para o Negócio
- ✅ Receita recorrente da academia (B2B)
- ✅ Receita adicional por aluno que usa IA (B2C)
- ✅ Modelo escalável
- ✅ Trial aumenta conversão

## 📊 Métricas

### Dashboard da Academia
- Total de alunos cadastrados
- Alunos com assinatura de IA (opcional)
- **Não mostra custos de IA** (aluno paga direto)

### Dashboard do Aluno
- Status do trial (dias restantes)
- Status da assinatura de IA
- Uso de minutos/recursos
- Histórico de pagamentos

## 🧪 Como Testar

### Teste 1: Aluno em Trial
1. Criar código de convite na academia
2. Usuário se cadastra usando o código
3. **Esperado**: Trial de 3 dias ativado
4. Acessar funcionalidades de IA
5. **Esperado**: Funciona durante trial

### Teste 2: Aluno Após Trial
1. Aguardar 3 dias (ou alterar `trial_expires_at` no banco)
2. Tentar usar funcionalidades de IA
3. **Esperado**: Bloqueado com mensagem para assinar
4. Acessar página Premium
5. **Esperado**: Ver planos individuais e recargas

### Teste 3: Aluno com Assinatura
1. Aluno assina plano individual (ai_monthly ou ai_annual_vip)
2. Tentar usar funcionalidades de IA
3. **Esperado**: Funciona normalmente
4. Verificar que academia não tem custo adicional

## 📝 Mensagens na UI

### Durante Trial
```
"Período de Teste Grátis! 🎉
Você tem 3 dias grátis para experimentar todas as funcionalidades de IA.
💡 Modelo de Pagamento: A academia fornece acesso à plataforma. 
Você paga diretamente pela IA (sem custo adicional para a academia).
Seu trial expira em: [data]"
```

### Após Trial Expirar
```
"Seu Período de Teste Expirou ⏰
Para continuar usando as funcionalidades de IA, assine um plano individual abaixo.
💡 Você paga diretamente pela IA - a academia não tem custo adicional."
```

### Na Página de Planos
```
"💰 Modelo de Pagamento: Você paga diretamente pela IA. 
A academia fornece acesso à plataforma sem custo adicional para você."
```

## 🎯 Próximos Passos (Opcional)

1. **Dashboard de Métricas para Academia**
   - Mostrar % de alunos com assinatura de IA
   - Gráficos de engajamento

2. **Notificações**
   - Lembrete 1 dia antes do trial expirar
   - Ofertas especiais para alunos

3. **Programa de Indicação**
   - Alunos podem indicar outros alunos
   - Benefícios para ambos

4. **Planos Corporativos**
   - Academia pode optar por pagar IA para todos os alunos
   - Desconto em volume

