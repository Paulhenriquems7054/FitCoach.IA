# Verificação de Migração: Campos de Limites de Trial

## ✅ Status: Migração Aplicada com Sucesso

A migração `migration_adicionar_campos_trial_limits.sql` foi executada com sucesso no Supabase.

## Campos Criados

Os seguintes campos foram adicionados à tabela `public.users`:

### 1. `trial_voice_total_seconds`
- **Tipo:** INTEGER
- **Default:** 0
- **Nullable:** YES
- **Descrição:** Total de segundos de voz usados durante todo o período de trial (máximo 900 = 15 minutos)

### 2. `trial_photo_analysis_count`
- **Tipo:** INTEGER
- **Default:** 0
- **Nullable:** YES
- **Descrição:** Quantidade de análises de prato feitas durante o trial (máximo 1)

### 3. `trial_meal_plan_count`
- **Tipo:** INTEGER
- **Default:** 0
- **Nullable:** YES
- **Descrição:** Quantidade de planos alimentares gerados durante o trial (máximo 1)

## Limites Implementados

### Para Usuários em Trial (3 dias):

1. **Voz:**
   - 5 minutos diários (300 segundos)
   - Total máximo de 15 minutos (900 segundos) durante todo o trial
   - Reset diário automático

2. **Análise de Prato:**
   - 1 análise durante todo o trial
   - Não reseta diariamente

3. **Geração de Plano Alimentar:**
   - 1 geração durante todo o trial
   - Não reseta diariamente

## Funcionalidades Implementadas

### Serviços Criados/Modificados:

1. **`services/trialLimitsService.ts`** (NOVO)
   - `getTrialLimitsStatus()`: Obtém status completo dos limites
   - `recordTrialVoiceUsage()`: Registra uso de voz
   - `recordTrialPhotoAnalysis()`: Registra análise de foto
   - `recordTrialMealPlan()`: Registra geração de plano
   - `canUsePhotoAnalysis()`: Verifica se pode usar análise
   - `canUseMealPlan()`: Verifica se pode gerar plano

2. **`services/assistantService.ts`** (MODIFICADO)
   - Verifica limites antes de analisar foto
   - Registra uso após análise bem-sucedida

3. **`services/geminiService.ts`** (MODIFICADO)
   - Verifica limites antes de gerar plano
   - Registra uso após geração bem-sucedida

4. **`services/usageLimitService.ts`** (MODIFICADO)
   - Registra uso de voz no trial durante consumo

## Próximos Passos

1. ✅ Migração SQL executada
2. ✅ Serviços implementados
3. ✅ Integrações concluídas
4. ⏳ Testar fluxo completo de trial:
   - Criar usuário trial
   - Testar limite de voz (5 min/dia, 15 min total)
   - Testar limite de análise de prato (1 total)
   - Testar limite de plano alimentar (1 total)
   - Verificar bloqueio após atingir limites

## Notas Importantes

- Os limites são aplicados apenas durante o período de trial (`subscription_status = 'trial'`)
- Após o trial expirar, todas as funcionalidades são bloqueadas até assinatura
- Os contadores não são resetados automaticamente (exceto voz que reseta diariamente)
- O limite de voz é cumulativo durante todo o trial (não apenas diário)

