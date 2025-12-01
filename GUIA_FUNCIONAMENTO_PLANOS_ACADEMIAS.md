# 📚 Guia Completo: Como Funciona o Sistema de Planos e Assinaturas

## 🎯 Visão Geral

O FitCoach.IA oferece três tipos de planos:
1. **B2C (Consumidor Final)** - Planos individuais
2. **B2B (Academias)** - Planos para academias com múltiplas licenças
3. **Personal Trainer** - Planos para personal trainers com equipe

Este documento foca especialmente no **sistema B2B para Academias**.

---

## 🏋️ Como Funciona: Academia e Alunos

### 📋 Resumo Rápido

1. **Proprietário da Academia** compra um pacote (Pack Starter, Growth ou Pro)
2. **Academia recebe** um **Código Mestre único** (ex: `ACADEMIA-XYZ`)
3. **Academia distribui** o código para os alunos
4. **Alunos ativam** o código no app e ganham acesso Premium **GRATUITO**
5. **Acesso permanece ativo** enquanto a academia estiver pagando

---

## 🔄 Fluxo Detalhado Passo a Passo

### **PASSO 1: Proprietário da Academia Compra o Pacote**

#### O que acontece:
- Proprietário acessa a página de planos (`#/premium`)
- Escolhe um dos pacotes B2B:
  - **Pack Starter**: R$ 299,90/mês → 20 licenças
  - **Pack Growth**: R$ 649,90/mês → 50 licenças (MAIS VENDIDO)
  - **Pack Pro**: R$ 1.199,90/mês → 100 licenças
- Faz o pagamento via Cakto (cartão, PIX, etc.)
- Pagamento é processado e confirmado

#### O que é criado no sistema:
```sql
-- Tabela: activation_codes
{
  code: "ACADEMIA-XYZ",           -- Código único gerado
  type: "b2b",                    -- Tipo: B2B
  company_id: "uuid-da-academia", -- ID da academia
  plan_type: "academy_growth",    -- Plano escolhido
  licenses_total: 50,             -- Total de licenças
  licenses_used: 0,               -- Licenças usadas (inicia em 0)
  is_active: true,                 -- Código ativo
  expires_at: null                 -- Sem expiração (enquanto pagar)
}
```

#### Resultado:
✅ Academia recebe um **Código Mestre** único  
✅ Código pode ser usado por até X alunos (conforme pacote)  
✅ Código não expira enquanto pagamento estiver em dia

---

### **PASSO 2: Academia Distribui o Código para Alunos**

#### Opções de distribuição:
- **WhatsApp**: Enviar código via mensagem
- **E-mail**: Enviar código por e-mail
- **QR Code**: Gerar QR code com o código (futuro)
- **Físico**: Imprimir e colar na recepção
- **Sistema da Academia**: Integrar no sistema próprio

#### Exemplo de mensagem:
```
Olá! Sua academia agora oferece acesso Premium ao FitCoach.IA!

Seu código de ativação: ACADEMIA-XYZ

Como ativar:
1. Abra o app FitCoach.IA
2. Vá em Configurações → Ativar Código Premium
3. Digite: ACADEMIA-XYZ
4. Pronto! Acesso Premium liberado! 🎉
```

---

### **PASSO 3: Aluno Ativa o Código no App**

#### O que o aluno faz:
1. Abre o app FitCoach.IA
2. Vai para a tela de ativação (`#/activation`)
3. Digita o código: `ACADEMIA-XYZ`
4. Clica em "Ativar Código"

#### O que acontece no sistema:

```typescript
// 1. Sistema valida o código
validateActivationCode("ACADEMIA-XYZ")
  → Verifica se código existe
  → Verifica se está ativo
  → Verifica se há licenças disponíveis

// 2. Sistema cria assinatura para o aluno
activateUserWithCode(userId, "ACADEMIA-XYZ")
  → Cria registro em user_subscriptions
  → Vincula ao plano da academia
  → Incrementa licenses_used no código
  → Marca payment_provider como 'activation_code'
```

#### O que é criado no banco:

```sql
-- Tabela: user_subscriptions
{
  user_id: "id-do-aluno",
  plan_id: "id-do-plano-academy_growth",
  status: "active",
  payment_provider: "activation_code",  -- Indica que veio de código
  current_period_start: "2025-01-27",
  current_period_end: null,             -- Sem expiração (enquanto academia pagar)
  billing_cycle: "monthly"
}

-- Tabela: activation_codes (atualizada)
{
  code: "ACADEMIA-XYZ",
  licenses_used: 1,  -- Incrementado de 0 para 1
  // ... outros campos
}
```

#### Resultado:
✅ Aluno ganha acesso Premium **IMEDIATO**  
✅ Aluno **NÃO PAGA NADA**  
✅ Acesso é **GRATUITO** para o aluno  
✅ Aluno tem todas as features Premium

---

### **PASSO 4: Aluno Usa o App Premium**

#### O que o aluno pode fazer:
- ✅ Análise de Fotos Ilimitada (Comida + Treinos)
- ✅ Treinos Personalizados Ilimitados
- ✅ Chat de Texto Ilimitado
- ✅ 15 min/dia de Consultoria de Voz (Live)
- ✅ Relatórios Avançados
- ✅ Planos Personalizados

#### Controle de acesso:
```typescript
// Sistema verifica assinatura do aluno
checkSubscriptionStatus(userId)
  → Busca assinatura ativa
  → Verifica se está vinculada a código de ativação
  → Verifica se código ainda está ativo
  → Retorna status e features disponíveis
```

---

### **PASSO 5: Renovação e Manutenção**

#### Renovação Automática:
- Academia paga mensalmente (renovação automática)
- Enquanto pagamento estiver em dia:
  - ✅ Código permanece ativo
  - ✅ Alunos mantêm acesso Premium
  - ✅ Novos alunos podem ativar o código

#### Se Academia Parar de Pagar:
- ❌ Código é desativado (`is_active = false`)
- ❌ Novos alunos **NÃO PODEM** mais ativar
- ⚠️ Alunos existentes mantêm acesso até fim do período pago
- ⚠️ Após período, alunos perdem acesso Premium

#### Se Academia Cancelar:
- Código é desativado
- Alunos perdem acesso ao fim do período pago
- Academia pode reativar pagando novamente

---

## 📊 Gerenciamento de Licenças

### Como Funciona o Controle de Licenças

#### Exemplo Prático: Pack Growth (50 licenças)

```
Situação Inicial:
- Código: ACADEMIA-XYZ
- Licenças Total: 50
- Licenças Usadas: 0
- Licenças Disponíveis: 50

Aluno 1 ativa:
- Licenças Usadas: 1
- Licenças Disponíveis: 49

Aluno 2 ativa:
- Licenças Usadas: 2
- Licenças Disponíveis: 48

... (continua até 50)

Aluno 50 ativa:
- Licenças Usadas: 50
- Licenças Disponíveis: 0

Aluno 51 tenta ativar:
- ❌ ERRO: "Código esgotado. Entre em contato com sua academia."
```

### O que acontece quando licenças acabam?

1. **Sistema bloqueia novas ativações**
   - Código ainda existe e está ativo
   - Mas `licenses_used >= licenses_total`
   - Novos alunos recebem erro ao tentar ativar

2. **Academia pode fazer upgrade**
   - Pack Starter (20) → Pack Growth (50)
   - Pack Growth (50) → Pack Pro (100)
   - Licenças totais aumentam
   - Novos alunos podem ativar novamente

3. **Academia pode comprar pacote adicional**
   - Recebe um novo código
   - Distribui para novos alunos
   - Cada código tem suas próprias licenças

---

## 🔐 Segurança e Controle

### Proteções Implementadas

#### 1. **Validação de Código**
```typescript
// Sistema verifica:
- ✅ Código existe no banco
- ✅ Código está ativo (is_active = true)
- ✅ Código não expirou (expires_at > hoje)
- ✅ Há licenças disponíveis (licenses_used < licenses_total)
- ✅ Código não foi usado pelo mesmo usuário antes
```

#### 2. **Prevenção de Uso Duplicado**
- Um aluno não pode ativar o mesmo código duas vezes
- Sistema verifica se aluno já tem assinatura ativa via código
- Se já tem, retorna erro: "Você já possui assinatura ativa"

#### 3. **Controle de Expiração**
- Código expira se academia parar de pagar
- Alunos existentes mantêm acesso até fim do período
- Novos alunos não podem mais ativar código expirado

---

## 💼 Casos de Uso Práticos

### **Caso 1: Academia Nova (Pack Starter)**

**Situação:**
- Academia pequena com 15 alunos
- Compra Pack Starter (20 licenças)
- Recebe código: `ACADEMIA-ABC123`

**Ação:**
1. Academia envia código via WhatsApp para os 15 alunos
2. Alunos ativam no app
3. 15 licenças usadas, 5 disponíveis
4. Academia pode adicionar mais 5 alunos no futuro

**Resultado:**
- ✅ 15 alunos com acesso Premium gratuito
- ✅ Academia paga apenas R$ 299,90/mês
- ✅ Custo por aluno: R$ 19,99/mês (mas aluno não paga)

---

### **Caso 2: Academia em Crescimento (Upgrade)**

**Situação:**
- Academia começou com Pack Starter (20 licenças)
- Agora tem 35 alunos
- Precisa de mais licenças

**Ação:**
1. Academia faz upgrade para Pack Growth (50 licenças)
2. Código existente é atualizado:
   - `licenses_total`: 20 → 50
   - `licenses_used`: 20 (mantém)
   - `licenses_available`: 0 → 30
3. Academia pode adicionar mais 30 alunos

**Resultado:**
- ✅ 20 alunos existentes mantêm acesso
- ✅ 30 novos alunos podem ativar
- ✅ Academia paga R$ 649,90/mês (novo valor)

---

### **Caso 3: Aluno Sai da Academia**

**Situação:**
- Aluno ativou código e tinha acesso Premium
- Aluno cancelou matrícula na academia
- Academia quer revogar acesso

**Opções:**

**Opção A: Cancelar Assinatura do Aluno**
```typescript
// Academia pode cancelar assinatura específica
cancelSubscription(subscriptionId)
  → Aluno perde acesso Premium imediatamente
  → Licença fica disponível novamente
  → Outro aluno pode usar a licença
```

**Opção B: Deixar Ativo**
- Aluno mantém acesso enquanto academia pagar
- Licença continua ocupada
- Academia pode escolher deixar ativo como cortesia

---

### **Caso 4: Múltiplas Academias (Rede)**

**Situação:**
- Rede de academias com 3 unidades
- Cada unidade tem seus próprios alunos

**Solução:**
1. Cada unidade compra seu próprio pacote
2. Cada unidade recebe seu próprio código:
   - Unidade 1: `ACADEMIA-UNIDADE1`
   - Unidade 2: `ACADEMIA-UNIDADE2`
   - Unidade 3: `ACADEMIA-UNIDADE3`
3. Cada unidade gerencia seus próprios alunos
4. Licenças são independentes por unidade

**Alternativa (Futuro):**
- Rede pode comprar Pack Pro (100 licenças)
- Distribuir licenças entre unidades
- Gerenciar centralizadamente

---

## 📱 Interface do Proprietário da Academia

### O que o Proprietário Vê:

#### 1. **Página de Planos** (`#/premium`)
- Vê os 3 pacotes B2B disponíveis
- Compara preços e licenças
- Escolhe o pacote ideal
- Faz checkout via Cakto

#### 2. **Após Compra:**
- Recebe código mestre por e-mail
- Código também aparece no app (se logado)
- Pode copiar código facilmente
- Pode ver quantas licenças foram usadas

#### 3. **Gerenciamento (Futuro):**
- Dashboard de uso de licenças
- Lista de alunos ativos
- Histórico de ativações
- Opção de cancelar assinaturas individuais

---

## 📱 Interface do Aluno

### O que o Aluno Vê:

#### 1. **Tela de Ativação** (`#/activation`)
```
┌─────────────────────────────────┐
│  Ativar Código Premium          │
│                                 │
│  Digite o código fornecido      │
│  pela sua academia              │
│                                 │
│  [ACADEMIA-XYZ        ]         │
│                                 │
│  [  Ativar Código  ]            │
└─────────────────────────────────┘
```

#### 2. **Após Ativação:**
- ✅ Acesso Premium liberado
- ✅ Todas as features desbloqueadas
- ✅ Mensagem de sucesso
- ✅ Redirecionamento para home

#### 3. **Durante Uso:**
- Aluno usa normalmente
- Não vê diferença de plano pago individual
- Todas as features Premium disponíveis
- Acesso é transparente

---

## 🔄 Fluxo de Renovação

### Renovação Automática da Academia

#### Mensalmente:
1. **Cakto cobra** a academia automaticamente
2. **Webhook é enviado** para o sistema
3. **Sistema atualiza** status do código:
   - Mantém `is_active = true`
   - Renova `expires_at` (se houver)
4. **Alunos mantêm** acesso sem interrupção

#### Se Pagamento Falhar:
1. **Cakto envia webhook** de falha
2. **Sistema marca código** como inativo
3. **Novos alunos** não podem mais ativar
4. **Alunos existentes** mantêm acesso até fim do período pago
5. **E-mail de notificação** enviado para academia

#### Se Academia Cancelar:
1. **Academia cancela** no painel
2. **Código é desativado** no fim do período
3. **Alunos perdem acesso** ao fim do período pago
4. **Licenças ficam disponíveis** para reativação futura

---

## 💡 Perguntas Frequentes

### **P: O aluno precisa pagar algo?**
**R:** Não! O acesso é 100% gratuito para o aluno. A academia paga o pacote mensalmente.

### **P: O que acontece se a academia parar de pagar?**
**R:** 
- Código é desativado
- Novos alunos não podem mais ativar
- Alunos existentes mantêm acesso até fim do período pago
- Após período, todos perdem acesso Premium

### **P: Um aluno pode usar o código duas vezes?**
**R:** Não. Sistema verifica se aluno já tem assinatura ativa via código e bloqueia uso duplicado.

### **P: O que acontece quando as licenças acabam?**
**R:** 
- Código continua ativo
- Alunos existentes mantêm acesso
- Novos alunos recebem erro: "Código esgotado"
- Academia pode fazer upgrade para mais licenças

### **P: A academia pode cancelar acesso de um aluno específico?**
**R:** Sim (funcionalidade futura). Academia pode cancelar assinatura individual, liberando a licença para outro aluno.

### **P: O código expira?**
**R:** Não, enquanto a academia estiver pagando. Código só expira se:
- Academia parar de pagar
- Academia cancelar assinatura
- Código for manualmente desativado

### **P: Quantos códigos uma academia pode ter?**
**R:** Teoricamente ilimitado. Cada compra de pacote gera um novo código. Academia pode ter múltiplos códigos para diferentes grupos de alunos.

### **P: O aluno pode ver que está usando código da academia?**
**R:** Não diretamente. O aluno vê apenas que tem acesso Premium. Não há indicação visual de que veio de código de academia.

---

## 🎯 Resumo Executivo

### Para o Proprietário da Academia:
1. ✅ Compra pacote B2B (Starter, Growth ou Pro)
2. ✅ Recebe código mestre único
3. ✅ Distribui código para alunos
4. ✅ Alunos ganham acesso Premium gratuito
5. ✅ Paga mensalmente (renovação automática)
6. ✅ Gerencia licenças conforme necessário

### Para o Aluno:
1. ✅ Recebe código da academia
2. ✅ Ativa código no app (`#/activation`)
3. ✅ Ganha acesso Premium imediato
4. ✅ Usa todas as features Premium
5. ✅ Não paga nada
6. ✅ Acesso permanece enquanto academia pagar

### Benefícios:
- 🎯 **Academia**: Oferece valor agregado aos alunos sem custo para eles
- 🎯 **Aluno**: Acesso Premium gratuito
- 🎯 **FitCoach.IA**: Vendas B2B escaláveis

---

## 📞 Suporte

### Para Dúvidas:
- Consulte este documento
- Entre em contato com suporte
- Verifique a documentação técnica em `IMPLEMENTACAO_PLANOS_COMPLETA.md`

---

**Última Atualização:** 2025-01-27  
**Versão:** 1.0.0

