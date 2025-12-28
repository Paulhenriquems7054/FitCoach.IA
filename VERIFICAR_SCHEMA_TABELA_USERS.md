# 🔍 Verificação do Schema da Tabela `users`

## Objetivo

Verificar o schema completo da tabela `users` no Supabase para confirmar:
1. Quais colunas existem
2. Tipos de dados de cada coluna
3. Constraints (CHECK, FOREIGN KEY, etc.)
4. Comparar com campos usados no código

## Scripts SQL Criados

### 1. `supabase/verificar_schema_tabela_users.sql`

Script completo que verifica:
- ✅ Se a tabela existe
- ✅ Todas as colunas com tipos de dados
- ✅ Constraints (CHECK, FOREIGN KEY, PRIMARY KEY, UNIQUE)
- ✅ Campos relacionados a expiração/trial/subscription
- ✅ Foreign keys
- ✅ Índices
- ✅ Valores permitidos para `subscription_status` e `plan_type`

### 2. `supabase/comparar_campos_codigo_vs_banco.sql`

Script que compara:
- ✅ Campos esperados pelo código vs campos que existem no banco
- ✅ Campos extras que existem mas não são usados pelo código
- ✅ Status de cada campo (existe ou não existe)

## Como Usar

1. **Abra o SQL Editor no Supabase Dashboard**
2. **Execute o primeiro script** (`verificar_schema_tabela_users.sql`)
   - Isso mostrará o schema completo da tabela
3. **Execute o segundo script** (`comparar_campos_codigo_vs_banco.sql`)
   - Isso mostrará quais campos esperados existem e quais faltam

## Campos Críticos para Verificar

### Campos de Expiração/Trial
- `expiry_date` ou `subscription_expiry` ou `trial_end_date`
- O código usa `expiryDate` → precisa mapear para o campo correto

### Campos de Subscription
- `subscription_status` (deve ter CHECK constraint com valores: 'trial', 'active', 'inactive', 'expired')
- `plan_type` (deve ter CHECK constraint)

### Campos de Voz
- `voice_daily_limit_seconds`
- `voice_used_today_seconds`
- `voice_balance_upsell`

### Campos de Texto
- `text_msg_count_today`

## Resultado Esperado

Após executar os scripts, você terá:
1. ✅ Lista completa de colunas da tabela `users`
2. ✅ Tipos de dados de cada coluna
3. ✅ Constraints e valores permitidos
4. ✅ Comparação campos código vs banco
5. ✅ Identificação de campos faltantes ou extras

## Próximos Passos

Com os resultados dos scripts, poderemos:
1. Confirmar se todos os campos necessários existem
2. Corrigir nomes de campos se houver divergência
3. Ajustar a função RPC `insert_user_profile_after_signup` se necessário
4. Atualizar o código para usar os nomes corretos dos campos

---

**Execute os scripts e compartilhe os resultados para continuarmos a correção!**

