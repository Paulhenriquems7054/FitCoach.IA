# ✅ RESUMO: Implementação do Novo Modelo de Planos

## 📦 Arquivos Criados

### 🗄️ **SQL Migrations:**
1. **`supabase/migrations/003_novo_modelo_planos_academia.sql`**
   - Tabela `companies`: Adiciona campos `plano`, `alunos_max`, `limite_texto`, `limite_imagem`, `limite_voz`
   - Tabela `users`: Adiciona campos `uso_texto`, `uso_imagem`, `uso_voz_minutos`, `saldo_voz_extra`, `periodo_uso_mes`, `modo_demo`, `interacoes_demo_usadas`, `academias_id`
   - Tabela `recargas`: Nova tabela para compras de minutos FitVoice
   - Funções RPC: `verificar_limite_antes_uso()`, `processar_recarga_paga()`, `reset_uso_mensal_alunos()`

### 🔧 **Serviços:**
2. **`services/academiaLimitsService.ts`**
   - Verificação de limites antes de uso
   - Consumo de uso após chamada
   - Obtenção de limites e uso atual

3. **`services/novoAiAccessService.ts`**
   - Substitui `aiAccessService.ts` (mantido por compatibilidade)
   - Verificação de acesso baseada em limites de academia
   - Suporte a modo demo (3 interações)

4. **`services/recargaService.ts`**
   - Criação de recargas
   - Processamento de recargas pagas (webhook)
   - Listagem de recargas do aluno

### 🎨 **Componentes Frontend:**
5. **`components/RecargaModal.tsx`**
   - Modal para compra de recargas FitVoice
   - 3 opções: FitVoice 20 (R$ 5,00), 60 (R$ 12,90), 120 (R$ 19,90)

6. **`components/LimitesUsageIndicator.tsx`**
   - Indicador visual de limites (texto, imagem, voz)
   - Barras de progresso coloridas
   - Links para recarga quando próximo do limite

### 📚 **Documentação:**
7. **`docs/GUIA_MIGRACAO_NOVO_MODELO.md`**
   - Guia completo de migração
   - Passo a passo de implementação
   - Checklist de atualizações

8. **`services/atualizarChamadasIa.md`**
   - Guia específico para atualizar chamadas IA
   - Exemplos de código antes/depois

---

## 🔄 Próximos Passos (ATUALIZAR NO CÓDIGO)

### 1. Atualizar Serviços de Chamada IA

**Arquivo:** `chatbot/services/geminiService.ts`
- Substituir `assertAiAccessOrThrow` por `assertNovoAiAccessOrThrow`
- Adicionar `consumirUsoAposChamada` após chamadas bem-sucedidas
- Atualizar `sendMessageToGemini` (texto) e `processImageWithGemini` (imagem)

**Arquivo:** `services/assistantService.ts`
- Substituir verificação de acesso para voz
- Adicionar consumo de minutos em tempo real durante sessão
- Atualizar `startAssistantAudioSession`

### 2. Remover Lógica de Trial

**Arquivo:** `services/inviteService.ts`
- Remover código que ativa trial para alunos (linhas 182-194)
- Alunos vinculados à academia não recebem trial/demo

**Arquivo:** `pages/LoginPage.tsx`
- Substituir ativação de trial por modo demo (3 interações)
- Usar `deveAtivarModoDemo()` do `novoAiAccessService`

**Arquivo:** `App.tsx`
- Remover verificação de trial expirado (linhas 344-377)
- Remover redirecionamentos baseados em trial

### 3. Integrar Componentes

**Arquivo:** `pages/BillingPage.tsx`
- Adicionar `<LimitesUsageIndicator />` na renderização
- O modal de recarga já está integrado no componente

**Arquivo:** `chatbot/components/ChatbotPopup.tsx`
- Adicionar contador de minutos de voz restantes
- Abrir modal de recarga quando minutos zerarem

---

## 📊 Estrutura de Dados

### Academias (companies)
- `plano`: Enum de planos (FitCoach50, 100, 200, 400, 500)
- `limite_texto`: Limite de mensagens/mês por aluno
- `limite_imagem`: Limite de análises/mês por aluno
- `limite_voz`: Limite de minutos/mês por aluno

### Alunos (users)
- `academias_id`: Vinculação com academia
- `uso_texto`, `uso_imagem`, `uso_voz_minutos`: Contadores mensais
- `saldo_voz_extra`: Minutos extras comprados
- `modo_demo`: Se está em modo demo (3 interações)
- `interacoes_demo_usadas`: Contador de interações demo

### Recargas (nova tabela)
- `aluno_id`: Aluno que comprou
- `tipo_recarga`: FitVoice20, 60 ou 120
- `minutos_comprados`: 20, 60 ou 120
- `valor_pago`: Preço da recarga
- `status`: pending, paid, failed, refunded

---

## ⚠️ BREAKING CHANGES

### Campos Deprecated (manter por compatibilidade, não usar):
- `trial_active`, `trial_expires_at`
- `trial_voice_total_seconds`, `trial_photo_analysis_count`, `trial_meal_plan_count`
- `ai_subscription_status`

### Serviços Deprecated:
- `services/aiAccessService.ts` → Usar `novoAiAccessService.ts`
- `services/trialLimitsService.ts` → Lógica integrada em `academiaLimitsService.ts`

---

## ✅ Checklist de Implementação

- [x] SQL migrations criadas
- [x] Serviços de verificação de limites criados
- [x] Componentes frontend criados
- [x] Documentação criada
- [ ] **Executar migration SQL no Supabase**
- [ ] Atualizar `chatbot/services/geminiService.ts` - sendMessageToGemini
- [ ] Atualizar `chatbot/services/geminiService.ts` - processImageWithGemini
- [ ] Atualizar `services/assistantService.ts` - startAssistantAudioSession
- [ ] Atualizar `services/inviteService.ts` - remover trial
- [ ] Atualizar `pages/LoginPage.tsx` - modo demo
- [ ] Atualizar `App.tsx` - remover verificação de trial
- [ ] Integrar componentes no frontend
- [ ] Configurar webhook de pagamento para recargas
- [ ] Testar fluxo completo

---

## 🚀 COMO COMEÇAR

1. **Execute a migration SQL:**
   ```sql
   -- No Supabase SQL Editor
   -- Executar: supabase/migrations/003_novo_modelo_planos_academia.sql
   ```

2. **Atualize um serviço por vez:**
   - Comece por `sendMessageToGemini` (texto)
   - Depois `processImageWithGemini` (imagem)
   - Por último `startAssistantAudioSession` (voz)

3. **Teste cada atualização:**
   - Verifique se limites são respeitados
   - Confirme que mensagens de erro são exibidas
   - Teste consumo de uso após chamadas

4. **Integre componentes:**
   - Adicione `LimitesUsageIndicator` na BillingPage
   - Teste modal de recarga

---

## 📝 NOTAS IMPORTANTES

- ⚠️ **NÃO remover código antigo imediatamente** - Mantenha por compatibilidade durante transição
- ✅ **Teste extensivamente** antes de remover código antigo
- 🔄 **Reset mensal automático** via função RPC (executar via cron no Supabase)
- 💳 **Webhook de pagamento** precisa ser configurado para processar recargas automaticamente
