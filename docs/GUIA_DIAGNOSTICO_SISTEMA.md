# 🔍 Guia de Diagnóstico do Sistema

Este guia explica como usar a query SQL de diagnóstico para verificar se a integração entre a **Página de Vendas**, **Cakto**, **Supabase** e o **App** está funcionando corretamente.

## 📋 Como Usar

### 1. Acesse o SQL Editor do Supabase

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Clique em **New Query**

### 2. Execute a Query

1. Abra o arquivo `docs/DIAGNOSTICO_SISTEMA_COMPLETO.sql`
2. Copie **todo o conteúdo** do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione `Ctrl+Enter`)

### 3. Analise os Resultados

A query retorna **12 seções** diferentes, cada uma verificando um aspecto específico do sistema:

---

## 📊 Seções da Query

### 1. ✅ Planos Configurados (`app_plans`)

**O que verifica:**
- Se todos os planos da página de vendas estão cadastrados
- Se cada plano tem um `cakto_checkout_id` configurado
- Preços e limites de licenças

**O que procurar:**
- ✅ Todos os planos devem ter `status_checkout = '✅ OK'`
- ❌ Se algum plano mostrar `❌ SEM CHECKOUT ID`, você precisa:
  - Adicionar o `cakto_checkout_id` na tabela `app_plans`
  - Ou verificar se o ID está correto

**Planos esperados:**
- `b2b_academia`: `academy_starter_mini`, `academy_starter`, `academy_growth`, `academy_pro`
- `b2c`: `b2c_mensal`, `b2c_anual_vip`
- `personal`: `personal_team_5`, `personal_team_15`
- `recarga`: `recarga_turbo`, `recarga_banco_voz_100`, `recarga_passe_livre_30d`

---

### 2. 🏢 Academias Cadastradas (`companies`)

**O que verifica:**
- Academias que compraram planos B2B
- Status de pagamento e assinatura
- Código mestre gerado
- Licenças usadas vs disponíveis

**O que procurar:**
- ✅ `status_geral = '✅ ATIVA E PAGA'` → Academia funcionando normalmente
- ⚠️ `status_geral = '⚠️ ATIVA MAS NÃO PAGA'` → Verificar webhook da Cakto
- ❌ `status_geral = '❌ INATIVA'` → Academia cancelada ou suspensa

**Campos importantes:**
- `codigo_mestre`: Código que a academia distribui para alunos
- `licencas_ativas`: Quantas licenças estão sendo usadas
- `licencas_disponiveis`: Quantas ainda podem ser ativadas

---

### 3. 🎫 Licenças de Academias (`company_licenses`)

**O que verifica:**
- Alunos vinculados a academias
- Status de cada licença (ativa, revogada, expirada)
- Datas de ativação e revogação

**O que procurar:**
- ✅ `status_licenca = '✅ ATIVA'` → Aluno tem acesso Premium via academia
- ❌ `status_licenca = '❌ REVOGADA'` → Aluno perdeu acesso (cancelou matrícula)
- ⏰ `status_licenca = '⏰ EXPIRADA'` → Licença expirou (plano da academia expirou)

---

### 4. 👤 Assinaturas B2C (`user_subscriptions`)

**O que verifica:**
- Usuários que compraram planos individuais (mensal/anual)
- Status de pagamento e assinatura
- Valores pagos e transações da Cakto

**O que procurar:**
- ✅ `status_assinatura = '✅ ATIVA'` → Usuário tem acesso Premium individual
- ❌ `status_assinatura = '❌ CANCELADA'` → Usuário cancelou
- ⏰ `status_assinatura = '⏰ EXPIRADA'` → Assinatura expirou

---

### 5. 🏋️ Assinaturas de Academias (`academy_subscriptions`)

**O que verifica:**
- Registro de compras de planos B2B pela academia
- Histórico de pagamentos
- Limite de licenças do plano

**O que procurar:**
- ✅ `status_assinatura = '✅ ATIVA'` → Academia tem plano ativo
- Verificar se `max_licencas` corresponde ao plano comprado

---

### 6. 💪 Assinaturas de Personal Trainers (`personal_subscriptions`)

**O que verifica:**
- Personal trainers que compraram planos Team 5 ou Team 15
- Limite de clientes (licenças)
- Status de pagamento

**O que procurar:**
- ✅ `status_assinatura = '✅ ATIVA'` → Personal tem plano ativo
- Verificar se `max_licencas` corresponde ao plano (5 ou 15)

---

### 7. ⚡ Recargas (`recharges`)

**O que verifica:**
- Recargas compradas (Turbo, Banco de Voz, Passe Livre)
- Status e validade de cada recarga
- Se foram usadas ou expiraram

**O que procurar:**
- ✅ `status_recarga = '✅ ATIVA'` → Recarga disponível para uso
- ⏰ `status_recarga = '⏰ EXPIRADA'` → Recarga expirou (deve ser atualizada)
- ✅ `status_recarga = '✅ USADA'` → Recarga já foi aplicada

**Tipos de recarga:**
- `recarga_turbo`: +30 minutos de voz (válido 24h)
- `recarga_banco_voz_100`: +100 minutos de voz (não expira)
- `recarga_passe_livre_30d`: Ilimitado por 30 dias

---

### 8. 🎟️ Cupons de Convite (`coupons`)

**O que verifica:**
- Cupons criados para distribuição
- Quantos usos restam
- Se estão ativos e válidos

**O que procurar:**
- ✅ `status_cupom = '✅ DISPONÍVEL'` → Cupom pode ser usado
- ⚠️ `status_cupom = '⚠️ ESGOTADO'` → Cupom atingiu limite de usos
- ⏰ `status_cupom = '⏰ EXPIRADO'` → Cupom expirou
- ❌ `status_cupom = '❌ INATIVO'` → Cupom desativado manualmente

---

### 9. 📨 Webhooks da Cakto (`cakto_webhooks`)

**O que verifica:**
- Webhooks recebidos da Cakto
- Se foram processados com sucesso
- Erros ocorridos

**O que procurar:**
- ✅ `status_webhook = '✅ SUCESSO'` → Webhook processado corretamente
- ❌ `status_webhook = '❌ FALHOU'` → Verificar `erro` para ver o motivo
- ⏳ `status_webhook = '⏳ PENDENTE'` → Webhook ainda não foi processado

**Se não houver registros:**
- Pode ser que a tabela `cakto_webhooks` não exista
- Ou nenhum webhook foi recebido ainda
- Verifique os logs da Edge Function `cakto-webhook` no Supabase

---

### 10. 📈 Resumo Geral

**O que verifica:**
- Totais de cada tipo de registro
- Visão geral do sistema

**O que procurar:**
- Verificar se os números fazem sentido
- Comparar com expectativas de uso

---

### 11. ⚠️ Problemas Detectados

**O que verifica:**
- Problemas comuns automaticamente
- Inconsistências no banco de dados

**Problemas que podem aparecer:**

1. **Planos sem checkout_id**
   - **Causa:** Plano não tem `cakto_checkout_id` configurado
   - **Solução:** Adicionar o ID na tabela `app_plans`

2. **Academias ativas sem pagamento**
   - **Causa:** Webhook da Cakto não foi processado ou falhou
   - **Solução:** Verificar logs da Edge Function e reprocessar webhook

3. **Academias com licenças esgotadas**
   - **Causa:** Academia atingiu limite do plano
   - **Solução:** Academia precisa fazer upgrade de plano

4. **Recargas expiradas ainda marcadas como ativas**
   - **Causa:** Status não foi atualizado automaticamente
   - **Solução:** Executar job de limpeza ou atualizar manualmente

5. **Cupons expirados ainda marcados como ativos**
   - **Causa:** Status não foi atualizado automaticamente
   - **Solução:** Atualizar `is_active = false` para cupons expirados

---

### 12. 🔗 Vínculos Usuário ↔ Academia

**O que verifica:**
- Usuários vinculados a academias
- Se o vínculo está ativo e válido
- Papel do usuário na academia (aluno, admin, trainer, etc.)

**O que procurar:**
- ✅ `status_vinculo = '✅ VÍNCULO ATIVO'` → Tudo OK
- ⚠️ `status_vinculo = '⚠️ ACADEMIA INATIVA'` → Academia cancelou plano
- ⚠️ `status_vinculo = '⚠️ LICENÇA INATIVA'` → Licença foi revogada

---

## 🛠️ Solução de Problemas Comuns

### Problema: Planos sem checkout_id

**Solução:**
```sql
-- Atualizar plano com checkout_id
UPDATE app_plans
SET cakto_checkout_id = 'SEU_CHECKOUT_ID_AQUI'
WHERE slug = 'nome_do_plano';
```

### Problema: Academia ativa mas sem pagamento

**Solução:**
1. Verificar logs da Edge Function `cakto-webhook`
2. Verificar se o webhook foi recebido
3. Se necessário, atualizar manualmente:
```sql
UPDATE companies
SET payment_status = 'paid',
    status = 'active'
WHERE id = 'ID_DA_ACADEMIA';
```

### Problema: Licenças esgotadas

**Solução:**
- Academia precisa fazer upgrade de plano
- Ou revogar licenças de alunos inativos:
```sql
UPDATE company_licenses
SET status = 'revoked',
    revoked_at = NOW()
WHERE company_id = 'ID_DA_ACADEMIA'
AND user_id = 'ID_DO_USUARIO';
```

### Problema: Recargas expiradas

**Solução:**
```sql
-- Atualizar status de recargas expiradas
UPDATE recharges
SET status = 'expired'
WHERE status = 'active'
AND expires_at IS NOT NULL
AND expires_at <= NOW();
```

---

## 📝 Checklist de Validação

Após executar a query, verifique:

- [ ] Todos os planos têm `cakto_checkout_id` configurado
- [ ] Academias ativas têm `payment_status = 'paid'`
- [ ] Licenças não ultrapassam `max_licenses` das academias
- [ ] Assinaturas B2C ativas correspondem a pagamentos reais
- [ ] Recargas não estão expiradas e ainda marcadas como ativas
- [ ] Cupons disponíveis têm usos restantes
- [ ] Webhooks da Cakto estão sendo processados com sucesso
- [ ] Vínculos usuário ↔ academia estão consistentes

---

## 🔄 Quando Executar

Execute esta query:

- ✅ **Semanalmente** para monitorar saúde do sistema
- ✅ **Após cada deploy** para verificar se nada quebrou
- ✅ **Quando houver problemas** reportados por usuários
- ✅ **Antes de relatórios** para garantir dados corretos
- ✅ **Após mudanças** na configuração de planos ou webhooks

---

## 📞 Suporte

Se encontrar problemas que não consegue resolver:

1. **Copie os resultados** da seção "PROBLEMAS DETECTADOS"
2. **Verifique os logs** da Edge Function `cakto-webhook`
3. **Consulte a documentação** do Supabase e Cakto
4. **Entre em contato** com o suporte técnico

---

## 📚 Referências

- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação da Cakto](https://docs.cakto.com.br)
- [Edge Functions do Supabase](https://supabase.com/docs/guides/functions)

---

**Última atualização:** Dezembro 2025

