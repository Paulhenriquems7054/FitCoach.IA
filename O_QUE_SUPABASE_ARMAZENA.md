# O que o Supabase Armazena

## 📊 Resumo Geral

O Supabase armazena **dados de gerenciamento, assinaturas, pagamentos e controle de acesso**. A maioria dos dados do usuário (planos, treinos, análises, etc.) fica **apenas localmente no IndexedDB** do dispositivo.

## 🗄️ Tabelas do Supabase

### 1. **users** (Dados do Usuário)
**Armazena**: Informações básicas do usuário e controle de acesso

**Campos principais**:
- `id` - ID único do usuário
- `nome` - Nome do usuário
- `username` - Nome de usuário para login
- `photo_url` - URL da foto de perfil
- `idade`, `genero`, `peso`, `altura`, `objetivo` - Dados pessoais
- `points`, `discipline_score` - Pontos e disciplina
- `completed_challenge_ids` - IDs de desafios completados
- `role` - Papel global (user/professional)
- `gym_id`, `gym_role` - Vínculo com academia (student/admin/trainer/receptionist)
- `academy_id`, `tenant_role` - Multi-tenant B2B2C
- `access_blocked`, `blocked_at`, `blocked_by`, `blocked_reason` - Controle de bloqueio
- `plan_type`, `subscription_status`, `expiry_date` - Status de assinatura
- `voice_daily_limit_seconds`, `voice_used_today_seconds`, `voice_balance_upsell` - Controle de voz
- `text_msg_count_today`, `last_msg_date` - Controle de mensagens
- `data_permissions`, `security_settings` - Permissões e configurações

**Quando é usado**: 
- Login/registro de usuários
- Sincronização de dados básicos
- Controle de acesso e bloqueios
- Gerenciamento de assinaturas

---

### 2. **user_subscriptions** (Assinaturas)
**Armazena**: Informações sobre assinaturas ativas dos usuários

**Campos principais**:
- `id` - ID da assinatura
- `user_id` - ID do usuário
- `plan_id` - ID do plano
- `status` - Status (active/canceled/expired/past_due/trialing)
- `billing_cycle` - Ciclo de cobrança (monthly/yearly)
- `current_period_start`, `current_period_end` - Período atual
- `cancel_at_period_end` - Cancelar ao final do período
- `canceled_at` - Data de cancelamento
- `trial_start`, `trial_end` - Período de trial
- `payment_method_id` - ID do método de pagamento
- `payment_provider` - Provedor de pagamento (cakto/stripe/etc)

**Quando é usado**:
- Verificação de assinaturas ativas
- Controle de trial
- Renovação e cancelamento
- Histórico de assinaturas

---

### 3. **subscription_plans** (Planos de Assinatura)
**Armazena**: Configuração dos planos disponíveis

**Campos principais**:
- `id` - ID do plano
- `name` - Nome do plano (monthly/annual_vip/academy_starter/etc)
- `display_name` - Nome para exibição
- `description` - Descrição do plano
- `price_monthly`, `price_yearly` - Preços
- `currency` - Moeda
- `limits` - Limites do plano (JSON)
- `features` - Features do plano (JSON)
- `is_active`, `is_visible` - Status do plano

**Quando é usado**:
- Exibição de planos na página Premium
- Verificação de limites e features
- Criação de novas assinaturas

---

### 4. **payments** (Pagamentos)
**Armazena**: Histórico de pagamentos

**Campos principais**:
- `id` - ID do pagamento
- `subscription_id` - ID da assinatura relacionada
- `user_id` - ID do usuário
- `amount` - Valor pago
- `currency` - Moeda
- `status` - Status (pending/processing/succeeded/failed/refunded/canceled)
- `payment_method` - Método de pagamento
- `payment_provider` - Provedor (cakto/stripe/etc)
- `provider_payment_id` - ID do pagamento no provedor
- `description` - Descrição
- `metadata` - Metadados adicionais (JSON)
- `paid_at` - Data do pagamento

**Quando é usado**:
- Registro de pagamentos
- Histórico financeiro
- Reembolsos e cancelamentos

---

### 5. **invoices** (Faturas)
**Armazena**: Faturas geradas

**Campos principais**:
- `id` - ID da fatura
- `payment_id` - ID do pagamento relacionado
- `subscription_id` - ID da assinatura
- `user_id` - ID do usuário
- `invoice_number` - Número da fatura
- `amount`, `currency` - Valor e moeda
- `status` - Status (draft/open/paid/void/uncollectible)
- `period_start`, `period_end` - Período da fatura
- `customer_name`, `customer_email`, `customer_address` - Dados do cliente
- `line_items` - Itens da fatura (JSON)
- `invoice_pdf_url`, `hosted_invoice_url` - URLs da fatura
- `due_date`, `paid_at` - Datas

**Quando é usado**:
- Geração de faturas
- Download de PDFs
- Histórico de faturas

---

### 6. **gyms** (Academias)
**Armazena**: Informações das academias

**Campos principais**:
- `id` - ID da academia
- `name` - Nome da academia
- `owner_id` - ID do proprietário
- `address`, `phone`, `email`, `website` - Contato
- `settings` - Configurações (JSON)
- `subscription_plan_id` - ID do plano da academia
- `is_active` - Status ativo

**Quando é usado**:
- Gerenciamento de academias
- Vínculo de alunos com academias
- Configurações de academias

---

### 7. **weight_history** (Histórico de Peso)
**Armazena**: Histórico de peso dos usuários

**Campos principais**:
- `id` - ID da entrada
- `user_id` - ID do usuário
- `date` - Data da medição
- `weight` - Peso em kg
- `created_at` - Data de criação

**Quando é usado**:
- Sincronização de histórico de peso
- Gráficos de evolução
- Relatórios de progresso

**Nota**: Também armazenado localmente no IndexedDB

---

### 8. **recharges** (Recargas)
**Armazena**: Recargas de tempo de voz (Passe Livre, etc)

**Campos principais**:
- `id` - ID da recarga
- `user_id` - ID do usuário
- `recharge_type` - Tipo (pass_libre/etc)
- `status` - Status (active/expired)
- `expires_at` - Data de expiração
- `amount` - Valor pago
- `created_at` - Data de criação

**Quando é usado**:
- Controle de recargas de voz
- Passe Livre ilimitado
- Histórico de compras de tempo

---

### 9. **invites** (Convites)
**Armazena**: Convites para academias

**Campos principais**:
- `id` - ID do convite
- `code` - Código do convite
- `gym_id` - ID da academia
- `created_by` - ID do criador
- `status` - Status (pending/accepted/expired)
- `expires_at` - Data de expiração
- `max_uses` - Máximo de usos
- `used_count` - Usos atuais

**Quando é usado**:
- Sistema de convites para academias
- Vinculação de alunos

---

### 10. **invite_usages** (Uso de Convites)
**Armazena**: Histórico de uso de convites

**Campos principais**:
- `id` - ID do uso
- `invite_id` - ID do convite
- `user_id` - ID do usuário que usou
- `used_at` - Data de uso

**Quando é usado**:
- Rastreamento de uso de convites
- Limite de usos por convite

---

### 11. **user_coupon_links** (Cupons de Usuários)
**Armazena**: Vínculo entre usuários e cupons

**Campos principais**:
- `id` - ID do vínculo
- `user_id` - ID do usuário
- `coupon_id` - ID do cupom
- `used_at` - Data de uso

**Quando é usado**:
- Aplicação de cupons de desconto
- Controle de uso único de cupons

---

### 12. **b2b_codes** (Códigos B2B)
**Armazena**: Códigos de ativação B2B

**Campos principais**:
- `id` - ID do código
- `code` - Código de ativação
- `plan_id` - ID do plano
- `max_activations` - Máximo de ativações
- `used_count` - Ativações usadas
- `expires_at` - Data de expiração
- `status` - Status (active/expired)

**Quando é usado**:
- Sistema de códigos B2B
- Ativação de planos corporativos

---

### 13. **b2b_code_activations** (Ativações B2B)
**Armazena**: Histórico de ativações de códigos B2B

**Campos principais**:
- `id` - ID da ativação
- `code_id` - ID do código
- `user_id` - ID do usuário que ativou
- `activated_at` - Data de ativação

**Quando é usado**:
- Rastreamento de ativações
- Limite de ativações por código

---

### 14. **student_academy_links** (Vínculos Aluno-Academia)
**Armazena**: Vínculo entre alunos e academias

**Campos principais**:
- `id` - ID do vínculo
- `student_user_id` - ID do aluno
- `academy_id` - ID da academia
- `status` - Status (active/inactive)
- `created_at` - Data de criação

**Quando é usado**:
- Vinculação de alunos a academias
- Verificação de acesso via academia

---

### 15. **academy_subscriptions** (Assinaturas de Academias)
**Armazena**: Assinaturas de academias

**Campos principais**:
- `id` - ID da assinatura
- `academy_id` - ID da academia
- `plan_id` - ID do plano
- `status` - Status (active/canceled/expired)
- `current_period_start`, `current_period_end` - Período
- `app_plans` - Relação com planos

**Quando é usado**:
- Assinaturas de academias
- Acesso de alunos via academia

---

### 16. **subscriptions** (Assinaturas de IA - Legado)
**Armazena**: Assinaturas de IA (tabela alternativa)

**Campos principais**:
- `id` - ID da assinatura
- `owner_type` - Tipo de dono (user/academy)
- `owner_id` - ID do dono
- `plan` - Plano (ai_monthly/ai_annual_vip)
- `status` - Status (active/trial/expired)

**Quando é usado**:
- Verificação de acesso à IA para alunos
- Assinaturas individuais de IA

---

### 17. **ai_events** (Eventos de IA)
**Armazena**: Eventos e métricas de uso de IA

**Campos principais**:
- `id` - ID do evento
- `user_id` - ID do usuário
- `event_type` - Tipo (trial_started/trial_expired/feature_used)
- `feature` - Feature usada (chat/voice/vision)
- `metadata` - Metadados (JSON)
- `created_at` - Data do evento

**Quando é usado**:
- Métricas de uso de IA
- Análise de comportamento
- Trial tracking

---

### 18. **ai_usage** (Uso de IA)
**Armazena**: Estatísticas de uso de IA

**Campos principais**:
- `id` - ID do registro
- `user_id` - ID do usuário
- `feature` - Feature (chat/voice/vision)
- `usage_count` - Contador de uso
- `last_used_at` - Último uso
- `period` - Período (daily/weekly/monthly)

**Quando é usado**:
- Estatísticas de uso
- Relatórios de uso de IA

---

### 19. **academies** (Academias - Alternativa)
**Armazena**: Informações de academias (tabela alternativa)

**Campos principais**:
- `id` - ID da academia
- `name` - Nome
- `settings` - Configurações
- `subscription` - Assinatura

**Quando é usado**:
- Gerenciamento de academias
- Métricas de academias

---

### 20. **companies** (Empresas)
**Armazena**: Informações de empresas/companhias

**Campos principais**:
- `id` - ID da empresa
- `name` - Nome da empresa
- `settings` - Configurações
- `subscription` - Assinatura

**Quando é usado**:
- Planos corporativos
- Gerenciamento de empresas

---

### 21. **company_licenses** (Licenças de Empresas)
**Armazena**: Licenças de empresas

**Campos principais**:
- `id` - ID da licença
- `company_id` - ID da empresa
- `user_id` - ID do usuário
- `status` - Status da licença
- `activated_at` - Data de ativação

**Quando é usado**:
- Controle de licenças corporativas
- Ativação de usuários em empresas

---

### 22. **activation_codes** (Códigos de Ativação)
**Armazena**: Códigos de ativação de planos

**Campos principais**:
- `id` - ID do código
- `code` - Código
- `plan_id` - ID do plano
- `licenses_used` - Licenças usadas
- `max_licenses` - Máximo de licenças

**Quando é usado**:
- Ativação de planos via código
- Personal Trainer

---

### 23. **promotional_codes** (Códigos Promocionais)
**Armazena**: Códigos promocionais

**Campos principais**:
- `id` - ID do código
- `code` - Código promocional
- `discount_percentage` - Percentual de desconto
- `expires_at` - Data de expiração
- `max_uses` - Máximo de usos

**Quando é usado**:
- Descontos promocionais
- Campanhas de marketing

---

### 24. **coupons** (Cupons)
**Armazena**: Cupons de desconto

**Campos principais**:
- `id` - ID do cupom
- `code` - Código do cupom
- `discount_type` - Tipo de desconto
- `discount_value` - Valor do desconto
- `expires_at` - Data de expiração

**Quando é usado**:
- Sistema de cupons
- Descontos em assinaturas

---

### 25. **audit_logs** (Logs de Auditoria)
**Armazena**: Logs de ações importantes

**Campos principais**:
- `id` - ID do log
- `user_id` - ID do usuário
- `action` - Ação realizada
- `resource_type` - Tipo de recurso
- `resource_id` - ID do recurso
- `details` - Detalhes (JSON)
- `created_at` - Data

**Quando é usado**:
- Auditoria de ações
- Rastreamento de mudanças
- Compliance

---

### 26. **chat_messages** (Mensagens de Chat)
**Armazena**: Mensagens do chat com IA

**Campos principais**:
- `id` - ID da mensagem
- `user_id` - ID do usuário
- `message` - Conteúdo da mensagem
- `role` - Papel (user/assistant)
- `created_at` - Data

**Quando é usado**:
- Histórico de conversas
- Sincronização entre dispositivos

**Nota**: Também armazenado localmente no IndexedDB

---

### 27. **wellness_plans** (Planos de Bem-Estar)
**Armazena**: Planos de bem-estar gerados

**Campos principais**:
- `id` - ID do plano
- `user_id` - ID do usuário
- `plan` - Dados do plano (JSON)
- `created_at`, `updated_at` - Datas

**Quando é usado**:
- Sincronização de planos
- Backup de planos

**Nota**: Principalmente armazenado localmente no IndexedDB

---

### 28. **meal_plans** (Planos Alimentares)
**Armazena**: Planos alimentares gerados

**Campos principais**:
- `id` - ID do plano
- `user_id` - ID do usuário
- `plan` - Dados do plano (JSON)
- `created_at`, `updated_at` - Datas

**Quando é usado**:
- Sincronização de planos alimentares
- Backup de planos

**Nota**: Principalmente armazenado localmente no IndexedDB

---

### 29. **meal_analyses** (Análises de Refeições)
**Armazena**: Análises de refeições feitas pela IA

**Campos principais**:
- `id` - ID da análise
- `user_id` - ID do usuário
- `analysis` - Dados da análise (JSON)
- `image_data` - Dados da imagem (base64)
- `created_at` - Data

**Quando é usado**:
- Histórico de análises
- Backup de análises

**Nota**: Principalmente armazenado localmente no IndexedDB

---

### 30. **recipes** (Receitas)
**Armazena**: Receitas salvas

**Campos principais**:
- `id` - ID da receita
- `user_id` - ID do usuário
- `recipe` - Dados da receita (JSON)
- `created_at` - Data

**Quando é usado**:
- Sincronização de receitas
- Backup de receitas

**Nota**: Principalmente armazenado localmente no IndexedDB

---

## 📊 Resumo: O que vai para o Supabase vs IndexedDB

### ✅ **Armazenado no Supabase** (Nuvem):
1. **Dados de Gerenciamento**:
   - Informações básicas de usuários (`users`)
   - Assinaturas e planos (`user_subscriptions`, `subscription_plans`)
   - Pagamentos e faturas (`payments`, `invoices`)
   - Academias e empresas (`gyms`, `companies`)
   - Códigos e convites (`b2b_codes`, `invites`, `activation_codes`)
   - Recargas (`recharges`)

2. **Controle de Acesso**:
   - Status de assinatura
   - Limites de uso (voz, mensagens)
   - Bloqueios de acesso
   - Permissões

3. **Métricas e Auditoria**:
   - Eventos de IA (`ai_events`)
   - Uso de IA (`ai_usage`)
   - Logs de auditoria (`audit_logs`)

4. **Sincronização (Opcional)**:
   - Histórico de peso (`weight_history`)
   - Mensagens de chat (`chat_messages`)
   - Planos de bem-estar (`wellness_plans`)
   - Planos alimentares (`meal_plans`)
   - Análises de refeições (`meal_analyses`)
   - Receitas (`recipes`)

### 💾 **Armazenado Apenas Localmente (IndexedDB)**:
- **Dados do Usuário**: Perfil completo, preferências
- **Planos de Bem-Estar**: Planos gerados pela IA
- **Treinos Concluídos**: Histórico de treinos
- **Planos Alimentares**: Planos gerados
- **Análises de Refeições**: Análises de fotos
- **Receitas**: Receitas salvas
- **Mensagens de Chat**: Histórico de conversas
- **Histórico de Peso**: Evolução do peso
- **Configurações do App**: Preferências e settings

## 🔄 Sincronização

A maioria dos dados do usuário **fica apenas localmente** no IndexedDB. O Supabase é usado principalmente para:
- ✅ Gerenciamento de assinaturas e pagamentos
- ✅ Controle de acesso e permissões
- ✅ Sincronização opcional (se implementada)
- ✅ Métricas e analytics

## 📝 Nota Importante

**Dados pessoais do usuário (planos, treinos, análises, etc.) ficam PRINCIPALMENTE no dispositivo** (IndexedDB). O Supabase armazena principalmente dados de **gerenciamento, assinaturas e controle de acesso**.

