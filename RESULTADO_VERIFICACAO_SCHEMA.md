# ✅ Resultado da Verificação do Schema da Tabela `users`

## Campos Extras Identificados

Foram identificados **21 campos extras** na tabela `users` que não estavam na lista inicial de campos esperados:

### Campos de Academia/Gym (B2B2C)
- `gym_id` (TEXT) - ID da academia
- `gym_role` (TEXT) - Role na academia (admin, student, etc.)
- `is_gym_managed` (BOOLEAN) - Se é gerenciado pela academia
- `academy_id` (UUID) - ID da academia (alternativo)
- `tenant_role` (TEXT) - Role no tenant/academia
- `matricula` (TEXT) - Matrícula do aluno

### Campos de Bloqueio/Acesso
- `access_blocked` (BOOLEAN) - Se o acesso está bloqueado
- `blocked_at` (TIMESTAMPTZ) - Quando foi bloqueado
- `blocked_by` (UUID) - Quem bloqueou
- `blocked_reason` (TEXT) - Motivo do bloqueio

### Campos de Sincronização
- `last_sync_at` (TIMESTAMPTZ) - Última sincronização
- `gym_server_url` (TEXT) - URL do servidor da academia

### Campos de IA/Trial de IA
- `ai_subscription_status` (TEXT) - Status da assinatura de IA
- `ai_trial_start_at` (TIMESTAMPTZ) - Início do trial de IA
- `ai_trial_end_at` (TIMESTAMPTZ) - Fim do trial de IA
- `ai_plan_type` (TEXT) - Tipo de plano de IA

### Campos de Uso/Atividade
- `last_usage_date` (DATE) - Última data de uso
- `last_msg_date` (DATE) - Última data de mensagem

### Campos de Permissões/Segurança
- `data_permissions` (JSONB) - Permissões de dados
- `security_settings` (JSONB) - Configurações de segurança

### Campos de Perfil
- `photo_url` (TEXT) - URL da foto de perfil

## ✅ Conclusão

Todos os campos críticos para o cadastro e trial estão presentes:
- ✅ `expiry_date` existe (confirmado na função RPC)
- ✅ `subscription_status` existe
- ✅ `plan_type` existe
- ✅ `voice_daily_limit_seconds` existe
- ✅ Todos os campos básicos do usuário existem

## 🔧 Correções Aplicadas

1. ✅ Corrigido erro SQL de ambiguidade em `constraint_name`
2. ✅ Atualizado script de comparação para incluir campos extras identificados
3. ✅ Scripts agora estão funcionando corretamente

## 📝 Observação

Os campos extras são normais e fazem parte do sistema completo (funcionalidades de academia, trial de IA, bloqueio, etc.). A função RPC `insert_user_profile_after_signup` só precisa inserir os campos básicos do cadastro, os campos extras podem ser preenchidos depois conforme necessário.

