# 🧪 Guia: Sistema de Acesso de Teste para Avaliação e Divulgação

## 📋 Status Atual do Sistema

### ✅ O que JÁ EXISTE:

#### 1. **Plano Gratuito (Free Tier) - Modo Demo/Trial**

O sistema já oferece acesso gratuito limitado para avaliação:

**Recursos Disponíveis (Gratuito):**
- ❌ **0 análises de fotos por dia** (BLOQUEADO - requer Premium)
- ❌ **0 análises de treino por dia** (BLOQUEADO - requer Premium)
- ❌ **0 treinos personalizados por mês** (BLOQUEADO - requer Premium)
- ❌ **0 mensagens de texto por dia** (BLOQUEADO - requer Premium)
- ❌ **0 minutos de voz** (chat de voz bloqueado)

**⚠️ ATENÇÃO:** O acesso free tier está **TOTALMENTE BLOQUEADO** para avaliação. Usuários precisam assinar um plano Premium para usar qualquer funcionalidade.

**Como Funciona:**
- Usuário cria conta normalmente
- Automaticamente recebe plano `free`
- Pode usar recursos limitados sem pagar
- Ideal para demonstração e avaliação

**Limitações:**
- Recursos são limitados (quotas diárias/mensais)
- Chat de voz não disponível
- Não tem acesso a relatórios avançados

---

### ⚠️ O que NÃO EXISTE (mas pode ser implementado):

#### 1. **Período de Trial Premium**
- ❌ Acesso Premium completo por tempo limitado (ex: 7 dias)
- ❌ Status `trialing` na tabela `user_subscriptions` (campo existe, mas não usado)

#### 2. **Códigos Promocionais de Teste**
- ❌ Códigos especiais para avaliação (ex: `TESTE-7DIAS`)
- ❌ Códigos para influenciadores/divulgadores
- ❌ Códigos para parceiros

#### 3. **Acesso de Demonstração**
- ❌ Conta demo pré-configurada
- ❌ Modo demonstração sem necessidade de cadastro

---

## 🎯 Como Usar o Sistema Atual para Avaliação

### **Opção 1: Acesso Gratuito Limitado (Atual)**

#### Para Avaliadores/Testadores:

1. **Criar conta normal**
   - Acessar app
   - Criar conta (sem pagamento)
   - Automaticamente recebe plano `free`

2. **Usar recursos disponíveis**
   - 3 análises de foto por dia
   - 3 análises de treino por dia
   - 1 treino personalizado por mês
   - 10 mensagens de texto por dia

3. **Limitações**
   - Não tem chat de voz
   - Recursos limitados
   - Ideal para testar funcionalidades básicas

#### Vantagens:
- ✅ Não requer pagamento
- ✅ Acesso imediato
- ✅ Permite testar funcionalidades principais

#### Desvantagens:
- ❌ Recursos limitados
- ❌ Não testa chat de voz
- ❌ Não testa recursos Premium completos

---

### **Opção 2: Código de Ativação B2B/Personal (Atual)**

#### Para Divulgação com Academias/Personais:

1. **Criar código de teste manualmente no banco**
   ```sql
   INSERT INTO activation_codes (
     code,
     type,
     plan_type,
     licenses_total,
     licenses_used,
     is_active,
     expires_at
   ) VALUES (
     'TESTE-DEMO',
     'b2b',
     'academy_growth',
     50,
     0,
     true,
     '2025-12-31'::timestamp
   );
   ```

2. **Distribuir código para testadores**
   - Enviar código: `TESTE-DEMO`
   - Testadores ativam no app (`#/activation`)
   - Recebem acesso Premium completo

3. **Vantagens:**
   - ✅ Acesso Premium completo
   - ✅ Testa todas as funcionalidades
   - ✅ Ideal para avaliação completa

4. **Desvantagens:**
   - ⚠️ Requer criação manual no banco
   - ⚠️ Não tem controle automático de expiração
   - ⚠️ Não tem limite de uso por pessoa

---

## 🚀 Recomendações para Implementar Sistema de Teste Completo

### **1. Implementar Período de Trial Premium**

#### Funcionalidade:
- Usuário pode ativar trial de 7 dias Premium
- Acesso completo durante trial
- Após 7 dias, volta para plano free (ou pede assinatura)

#### Implementação Necessária:

```typescript
// services/trialService.ts
export async function startTrialPeriod(userId: string): Promise<void> {
  // Criar assinatura com status 'trialing'
  // Definir trial_start e trial_end
  // Dar acesso Premium por 7 dias
}

export async function checkTrialStatus(userId: string): Promise<boolean> {
  // Verificar se está em trial
  // Verificar se trial expirou
  // Retornar status
}
```

#### Benefícios:
- ✅ Permite testar todas as funcionalidades
- ✅ Período limitado (não abusa do sistema)
- ✅ Conversão natural para assinatura paga

---

### **2. Implementar Códigos Promocionais de Teste**

#### Funcionalidade:
- Códigos especiais para avaliação (ex: `TESTE-7DIAS`, `DEMO-2025`)
- Códigos para influenciadores (ex: `INFLUENCER-ABC`)
- Códigos para parceiros (ex: `PARCEIRO-XYZ`)

#### Implementação Necessária:

```typescript
// services/promotionalCodeService.ts
export async function validatePromotionalCode(
  code: string
): Promise<{ valid: boolean; type: 'trial' | 'discount' | 'free'; days?: number }> {
  // Verificar código promocional
  // Retornar tipo e benefícios
}

export async function applyPromotionalCode(
  userId: string,
  code: string
): Promise<void> {
  // Aplicar código
  // Criar trial ou desconto conforme tipo
}
```

#### Benefícios:
- ✅ Controle sobre códigos de teste
- ✅ Rastreamento de uso
- ✅ Expiração automática
- ✅ Ideal para divulgação

---

### **3. Implementar Conta Demo Pré-configurada**

#### Funcionalidade:
- Conta demo com dados pré-preenchidos
- Acesso sem necessidade de cadastro
- Reset automático após uso

#### Implementação Necessária:

```typescript
// services/demoService.ts
export async function createDemoSession(): Promise<string> {
  // Criar sessão demo temporária
  // Retornar token de acesso
}

export async function getDemoUser(): Promise<User> {
  // Retornar usuário demo pré-configurado
}
```

#### Benefícios:
- ✅ Acesso instantâneo
- ✅ Sem necessidade de cadastro
- ✅ Ideal para demonstrações rápidas

---

## 📊 Comparação de Opções

| Opção | Acesso | Limitações | Implementação | Ideal Para |
|-------|--------|------------|---------------|------------|
| **Free Tier (Atual)** | Limitado | Quotas diárias | ✅ Já existe | Teste básico |
| **Código B2B Manual** | Premium completo | Manual, sem controle | ⚠️ Parcial | Avaliação completa |
| **Trial Period** | Premium 7 dias | Expira após período | ❌ Não existe | Conversão |
| **Códigos Promocionais** | Variável | Conforme código | ❌ Não existe | Divulgação |
| **Conta Demo** | Limitado | Sessão temporária | ❌ Não existe | Demonstração rápida |

---

## 🎯 Estratégia Recomendada para Avaliação e Divulgação

### **Fase 1: Uso Imediato (Atual)**

#### Para Avaliadores Individuais:
1. ✅ Usar plano **Free Tier** atual
2. ✅ Testar funcionalidades básicas
3. ✅ Avaliar UX e interface

#### Para Divulgação com Parceiros:
1. ✅ Criar código B2B manual no banco
2. ✅ Distribuir código para parceiros
3. ✅ Parceiros ativam e testam Premium completo

---

### **Fase 2: Implementar Trial Period (Recomendado)**

#### Implementar:
1. Sistema de trial de 7 dias Premium
2. Ativação automática na primeira vez
3. Notificação antes de expirar
4. Conversão para assinatura paga

#### Benefícios:
- ✅ Melhor experiência de avaliação
- ✅ Maior taxa de conversão
- ✅ Testa todas as funcionalidades

---

### **Fase 3: Implementar Códigos Promocionais (Opcional)**

#### Implementar:
1. Sistema de códigos promocionais
2. Tipos: trial, desconto, acesso gratuito
3. Controle de uso e expiração
4. Dashboard de rastreamento

#### Benefícios:
- ✅ Controle sobre divulgação
- ✅ Rastreamento de origem
- ✅ Flexibilidade para campanhas

---

## 💡 Exemplos de Uso para Divulgação

### **Cenário 1: Influenciador Fitness**

**Situação:**
- Influenciador quer testar o app
- Precisa de acesso Premium para avaliação completa
- Vai fazer review no canal

**Solução Atual:**
1. Criar código manual: `INFLUENCER-ABC123`
2. Enviar código para influenciador
3. Influenciador ativa e testa Premium completo

**Solução Futura (com Trial):**
1. Influenciador cria conta
2. Sistema oferece trial de 7 dias automaticamente
3. Influenciador testa e faz review
4. Após 7 dias, pode assinar ou continuar free

---

### **Cenário 2: Parceiro de Academia**

**Situação:**
- Academia quer avaliar antes de comprar
- Precisa testar com alguns alunos
- Quer ver como funciona na prática

**Solução Atual:**
1. Criar código B2B de teste: `TESTE-ACADEMIA-XYZ`
2. Academia distribui para 5-10 alunos
3. Alunos testam e dão feedback
4. Academia decide se compra

**Solução Futura (com Trial):**
1. Academia cria conta
2. Recebe trial de 7 dias com 10 licenças
3. Testa com alunos
4. Após trial, decide se compra pacote

---

### **Cenário 3: Evento/Feira**

**Situação:**
- Apresentar app em feira de fitness
- Visitantes querem testar rapidamente
- Não querem criar conta na hora

**Solução Atual:**
- ❌ Limitado - precisam criar conta
- ⚠️ Pode usar conta demo manual

**Solução Futura (com Demo):**
1. Conta demo pré-configurada
2. Visitante acessa sem cadastro
3. Testa funcionalidades principais
4. Se interessar, cria conta real

---

## 🔧 Como Criar Código de Teste Manualmente (Atual)

### **Passo 1: Acessar Banco de Dados Supabase**

1. Ir para: https://app.supabase.com
2. Selecionar projeto
3. Ir em "SQL Editor"

### **Passo 2: Criar Código de Ativação**

```sql
-- Criar código de teste para avaliação
INSERT INTO activation_codes (
  code,
  type,
  plan_type,
  licenses_total,
  licenses_used,
  is_active,
  expires_at,
  created_at
) VALUES (
  'TESTE-DEMO-2025',           -- Código único
  'b2b',                        -- Tipo: B2B ou 'personal'
  'academy_growth',             -- Plano: academy_growth, academy_pro, etc.
  50,                           -- Licenças disponíveis
  0,                            -- Licenças usadas (inicia em 0)
  true,                         -- Ativo
  '2025-12-31 23:59:59'::timestamp,  -- Data de expiração
  NOW()
);
```

### **Passo 3: Distribuir Código**

- Enviar código para testadores
- Testadores ativam em `#/activation`
- Recebem acesso Premium completo

### **Passo 4: Monitorar Uso**

```sql
-- Verificar uso do código
SELECT 
  code,
  licenses_total,
  licenses_used,
  (licenses_total - licenses_used) as disponiveis,
  is_active,
  expires_at
FROM activation_codes
WHERE code = 'TESTE-DEMO-2025';
```

---

## 📝 Checklist para Implementar Sistema de Teste Completo

### **Prioridade Alta:**
- [ ] Implementar Trial Period (7 dias Premium)
- [ ] Adicionar botão "Experimentar Grátis" na página de planos
- [ ] Sistema de notificação antes de trial expirar
- [ ] Conversão automática após trial

### **Prioridade Média:**
- [ ] Sistema de códigos promocionais
- [ ] Dashboard de rastreamento de códigos
- [ ] Tipos de códigos: trial, desconto, acesso gratuito

### **Prioridade Baixa:**
- [ ] Conta demo pré-configurada
- [ ] Modo demonstração sem cadastro
- [ ] Reset automático de sessão demo

---

## 🎯 Resumo Executivo

### **O que Existe Agora:**
- ✅ Plano Free com recursos limitados (3 análises/dia, 10 mensagens/dia)
- ✅ Sistema de códigos B2B/Personal (pode ser usado manualmente para teste)
- ✅ Acesso imediato sem pagamento (plano free)

### **O que Falta:**
- ❌ Trial Period Premium (7 dias)
- ❌ Códigos promocionais de teste
- ❌ Conta demo pré-configurada

### **Recomendação:**
1. **Curto Prazo:** Usar código B2B manual para avaliações completas
2. **Médio Prazo:** Implementar Trial Period para melhor experiência
3. **Longo Prazo:** Sistema completo de códigos promocionais

---

## 📞 Próximos Passos

### **Para Usar Agora:**
1. Criar código de teste manualmente no Supabase
2. Distribuir para testadores
3. Monitorar uso via SQL

### **Para Implementar:**
1. Criar `services/trialService.ts`
2. Adicionar botão "Experimentar Grátis"
3. Implementar lógica de trial period
4. Adicionar notificações de expiração

---

**Última Atualização:** 2025-01-27  
**Versão:** 1.0.0

