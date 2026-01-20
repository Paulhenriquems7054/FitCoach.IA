# 🎯 Instruções Finais para Implementação do Novo Modelo

## ✅ O QUE JÁ FOI CRIADO

### 1. **SQL Migrations** ✅
- `supabase/migrations/003_novo_modelo_planos_academia.sql`
- **AÇÃO NECESSÁRIA:** Executar no Supabase SQL Editor

### 2. **Serviços Backend** ✅
- `services/academiaLimitsService.ts` - Verificação de limites
- `services/novoAiAccessService.ts` - Acesso à IA (substitui aiAccessService)
- `services/recargaService.ts` - Recargas FitVoice
- **AÇÃO NECESSÁRIA:** Substituir chamadas antigas nos serviços de IA

### 3. **Componentes Frontend** ✅
- `components/RecargaModal.tsx` - Modal de compra de recargas
- `components/LimitesUsageIndicator.tsx` - Indicador de limites
- **AÇÃO NECESSÁRIA:** Integrar nos componentes existentes

### 4. **Documentação** ✅
- `docs/GUIA_MIGRACAO_NOVO_MODELO.md` - Guia completo
- `RESUMO_IMPLEMENTACAO_NOVO_MODELO.md` - Resumo executivo

---

## 🚀 PASSOS PARA IMPLEMENTAÇÃO

### **PASSO 1: Executar Migration SQL** ⚠️ CRÍTICO

1. Abra o **Supabase SQL Editor**
2. Execute o arquivo: `supabase/migrations/003_novo_modelo_planos_academia.sql`
3. Verifique se todas as colunas foram criadas com:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_schema = 'public' 
   AND table_name = 'companies'
   AND column_name IN ('plano', 'alunos_max', 'limite_texto', 'limite_imagem', 'limite_voz');
   ```

### **PASSO 2: Configurar Planos das Academias**

⚠️ **IMPORTANTE:** O placeholder `<id_da_academia>` deve ser substituído por um UUID real!

**Opção 1: Usar Script Completo (Recomendado)**
```sql
-- Execute o arquivo: supabase/CONFIGURAR_PLANOS_ACADEMIAS.sql
-- Ele lista as academias existentes e permite configurar automaticamente
```

**Opção 2: Configurar Manualmente**

1. **Primeiro, liste as academias existentes:**
```sql
SELECT id, name, email, plan_type FROM public.companies ORDER BY created_at DESC;
```

2. **Copie o UUID (id) da academia e execute:**
```sql
-- Exemplo: Configurar plano FitCoach50 (50 alunos, limites básicos)
-- ⚠️ SUBSTITUA '<UUID_DA_ACADEMIA>' pelo UUID real copiado acima!
UPDATE public.companies
SET 
  plano = 'FitCoach50',
  alunos_max = 50,
  limite_texto = 1000,  -- 1000 mensagens/mês por aluno
  limite_imagem = 100,  -- 100 análises/mês por aluno
  limite_voz = 450      -- 450 min/mês por aluno (15 min/dia * 30 dias)
WHERE id = '<UUID_DA_ACADEMIA>'; -- ⚠️ Use o UUID real!
```

**Opção 3: Configuração Automática (se já tem plan_type)**
```sql
-- Mapeia automaticamente baseado no plan_type existente
-- Execute o bloco 4 do arquivo CONFIGURAR_PLANOS_ACADEMIAS.sql
```

**Valores sugeridos por plano:**
- **FitCoach50** (50 alunos): texto=1000, imagem=100, voz=450
- **FitCoach100** (100 alunos): texto=1000, imagem=100, voz=450
- **FitCoach200** (200 alunos): texto=2000, imagem=200, voz=600
- **FitCoach400** (400 alunos): texto=3000, imagem=300, voz=900
- **FitCoach500** (500 alunos): texto=5000, imagem=500, voz=1200

📖 **Consulte:** `docs/COMO_CONFIGURAR_PLANOS_ACADEMIAS.md` para guia completo

### **PASSO 3: Atualizar Chamadas IA** 🔄

Siga o guia em `services/atualizacaoChamadasIa.md`:

**Arquivos a atualizar:**
1. `chatbot/services/geminiService.ts` - `sendMessageToGemini` (texto)
2. `chatbot/services/geminiService.ts` - `processImageWithGemini` (imagem)
3. `services/assistantService.ts` - `startAssistantAudioSession` (voz)

**Padrão de atualização:**
```typescript
// ANTES
import { assertAiAccessOrThrow } from '../../services/aiAccessService';
await assertAiAccessOrThrow(user, 'chat');

// DEPOIS
import { assertNovoAiAccessOrThrow, consumirUsoAposChamada } from '../../services/novoAiAccessService';
await assertNovoAiAccessOrThrow(user, 'chat');
// ... fazer chamada IA ...
await consumirUsoAposChamada(user.id as string, 'chat', 1);
```

### **PASSO 4: Integrar Componentes Frontend**

**Adicionar em `pages/BillingPage.tsx`:**
```typescript
import { LimitesUsageIndicator } from '../components/LimitesUsageIndicator';

// Na renderização:
<LimitesUsageIndicator />
```

**Adicionar em `chatbot/components/ChatbotPopup.tsx`:**
- Importar `RecargaModal`
- Mostrar contador de minutos restantes
- Abrir modal quando minutos zerarem

### **PASSO 5: Configurar Webhook de Pagamento** 💳

**Integração Cakto/Stripe para recargas:**

1. Criar endpoint `/api/recarga/webhook` (Edge Function ou backend)
2. Receber evento de pagamento confirmado
3. Chamar `processarRecargaPaga(recargaId, transactionId)`

**Exemplo de webhook:**
```typescript
// Edge Function ou backend API
import { processarRecargaPaga } from '../services/recargaService';

export async function handlePaymentWebhook(event: PaymentEvent) {
  if (event.type === 'payment.succeeded' && event.metadata?.recargaId) {
    await processarRecargaPaga(
      event.metadata.recargaId,
      event.transactionId
    );
  }
}
```

---

## 🧪 TESTES NECESSÁRIOS

### Teste 1: Limites de Texto
1. Aluno vinculado a academia
2. Enviar mensagens até atingir limite
3. Verificar bloqueio com mensagem correta
4. Verificar reset mensal

### Teste 2: Limites de Imagem
1. Aluno vinculado a academia
2. Fazer análises até atingir limite
3. Verificar bloqueio com mensagem correta

### Teste 3: Limites de Voz + Recarga
1. Aluno vinculado a academia
2. Usar minutos até atingir limite
3. Verificar modal de recarga aparece
4. Simular compra de recarga
5. Verificar minutos adicionados ao saldo extra
6. Verificar uso consome primeiro do limite mensal, depois do extra

### Teste 4: Modo Demo
1. Novo usuário NÃO vinculado a academia
2. Fazer 3 interações (texto/imagem)
3. Verificar bloqueio após 3 interações
4. Verificar mensagem correta

### Teste 5: Reset Mensal
1. Aluno com uso no mês anterior
2. Aguardar início do novo mês (ou simular)
3. Verificar contadores resetam automaticamente

---

## ⚠️ IMPORTANTE

### Não Remover Código Antigo Imediatamente

**Mantenha por compatibilidade durante transição:**
- `services/aiAccessService.ts` (usar `novoAiAccessService.ts` mas manter antigo)
- `services/trialLimitsService.ts` (deprecated mas ainda pode ser referenciado)
- Campos de trial na tabela `users` (deprecated mas não remover)

**Após testes completos:**
- Remover código antigo gradualmente
- Atualizar todas as referências
- Limpar campos deprecated do banco

---

## 📞 SUPORTE

Se encontrar problemas:

1. **Verificar logs do Supabase:**
   - Funções RPC: `verificar_limite_antes_uso`, `processar_recarga_paga`
   - Verificar se migration foi executada corretamente

2. **Verificar logs do frontend:**
   - Console do navegador
   - Verificar se serviços estão sendo importados corretamente

3. **Verificar estrutura do banco:**
   - Confirmar que todas as colunas foram criadas
   - Verificar se `academias_id` está sendo populado corretamente

---

## 📝 CHECKLIST FINAL

- [ ] Migration SQL executada no Supabase
- [ ] Planos das academias configurados com limites
- [ ] `chatbot/services/geminiService.ts` atualizado (texto)
- [ ] `chatbot/services/geminiService.ts` atualizado (imagem)
- [ ] `services/assistantService.ts` atualizado (voz)
- [ ] `services/inviteService.ts` atualizado (removido trial)
- [ ] `pages/LoginPage.tsx` atualizado (modo demo)
- [ ] `pages/BillingPage.tsx` atualizado (componentes integrados)
- [ ] Webhook de pagamento configurado
- [ ] Testes realizados
- [ ] Código antigo removido (após testes)

---

**Data de Criação:** 2026-01-18
**Status:** Pronto para implementação
