# ✅ Cupons Criados com Sucesso

## 📋 Status dos Cupons

Todos os cupons foram criados no banco de dados. Aqui está o resumo:

### ✅ Cupons Disponíveis para Teste (Sem Cakto)

Estes cupons **funcionam imediatamente** sem necessidade de pagamento:

1. **`TESTE-FREE`** ✅
   - Plano: `free`
   - Usos: 0/100
   - Status: Ativo
   - **Use este para teste básico!**

2. **`TESTE-MONTHLY`** ✅
   - Plano: `monthly`
   - Usos: 0/50
   - Status: Ativo
   - **Use para testar plano mensal**

3. **`TESTE-ANNUAL`** ✅
   - Plano: `annual`
   - Usos: 0/30
   - Status: Ativo
   - **Use para testar plano anual**

### ⚠️ Cupons que Requerem Pagamento Cakto Ativo

Estes cupons **precisam de um perfil de pagamento ativo** no `user_profiles`:

4. **`ACADEMIA-STARTER`** ⚠️
   - Plano: `academy_starter`
   - Usos: 0/50
   - Status: Ativo
   - **Requer:** `cakto_customer_id = 'cakto_customer_academia_starter'` com status `active`

5. **`ACADEMIA-GROWTH`** ⚠️
   - Plano: `academy_growth`
   - Usos: 0/100
   - Status: Ativo
   - **Requer:** `cakto_customer_id = 'cakto_customer_academia_growth'` com status `active`

6. **`PERSONAL-TEAM`** ⚠️
   - Plano: `personal_team`
   - Usos: 0/30
   - Status: Ativo
   - **Requer:** `cakto_customer_id = 'cakto_customer_personal_team'` com status `active`

7. **`PERSONAL-LIMITADO`** ⚠️
   - Plano: `personal_team`
   - Usos: 0/10
   - Limite de contas: 2 (para testar limite)
   - Status: Ativo
   - **Requer:** `cakto_customer_id = 'cakto_customer_personal_limitado'` com status `active`

### ❌ Cupons para Teste de Bloqueio

Estes cupons foram criados para testar cenários de erro:

8. **`TESTE-ESGOTADO`** ❌
   - Status: Esgotado (5/5 usos)
   - **Use para testar:** Mensagem "Código de convite atingiu o limite de usos"

9. **`TESTE-INATIVO`** ❌
   - Status: Inativo (`is_active = false`)
   - **Use para testar:** Mensagem "Código de convite inválido"

10. **`ACADEMIA-INATIVO`** ⚠️
    - Status: Ativo, mas pagamento inativo
    - **Use para testar:** Mensagem "Pagamento inativo" (quando não houver perfil ativo)

## 🧪 Como Testar

### Teste 1: Cupom Simples (Recomendado para começar)

1. Abra o app
2. Digite: **`TESTE-FREE`**
3. Deve validar com sucesso ✅
4. Preencha email e senha
5. Crie a conta
6. Deve funcionar normalmente ✅

### Teste 2: Cupom Esgotado

1. Digite: **`TESTE-ESGOTADO`**
2. Deve mostrar: "Este código de convite atingiu o limite de usos" ❌

### Teste 3: Cupom Inativo

1. Digite: **`TESTE-INATIVO`**
2. Deve mostrar: "Código de convite inválido" ❌

### Teste 4: Cupom com Cakto (Sem Pagamento)

1. Digite: **`ACADEMIA-STARTER`**
2. Deve mostrar: "Pagamento inativo" ou "Código de convite inválido" ❌
3. (Porque não há perfil de pagamento ativo)

## 🔧 Para Testar Cupons com Cakto

Se quiser testar os cupons vinculados a Cakto, você precisa criar um perfil de pagamento ativo:

```sql
-- 1. Primeiro, crie um usuário de teste (ou use um existente)
-- 2. Depois, crie o perfil de pagamento:

INSERT INTO user_profiles (
  user_id,
  cakto_customer_id,
  plan_type,
  status,
  expiry_date,
  name,
  email
)
VALUES (
  'uuid-do-usuario-aqui',  -- Substitua pelo ID real
  'cakto_customer_academia_starter',
  'academy_starter',
  'active',
  '2025-12-31'::date,  -- Data futura
  'Academia Teste',
  'academia@teste.com'
)
ON CONFLICT (user_id) DO UPDATE
SET cakto_customer_id = EXCLUDED.cakto_customer_id,
    plan_type = EXCLUDED.plan_type,
    status = EXCLUDED.status,
    expiry_date = EXCLUDED.expiry_date;
```

Depois disso, o cupom `ACADEMIA-STARTER` deve funcionar.

## ✅ Checklist de Testes

- [ ] Teste com `TESTE-FREE` - Deve funcionar ✅
- [ ] Teste com `TESTE-ESGOTADO` - Deve bloquear ❌
- [ ] Teste com `TESTE-INATIVO` - Deve bloquear ❌
- [ ] Teste com `ACADEMIA-STARTER` - Deve bloquear (sem pagamento) ⚠️
- [ ] Criar conta com `TESTE-FREE` - Deve criar com sucesso ✅
- [ ] Verificar que `current_uses` foi incrementado ✅
- [ ] Verificar que `linked_accounts_count` foi incrementado ✅

## 📊 Verificar Uso dos Cupons

Após testar, execute:

```sql
SELECT 
  code,
  current_uses,
  max_uses,
  linked_accounts_count,
  max_linked_accounts
FROM coupons
WHERE code IN ('TESTE-FREE', 'TESTE-MONTHLY', 'TESTE-ANNUAL')
ORDER BY code;
```

Os valores de `current_uses` e `linked_accounts_count` devem ter aumentado.

## 🎯 Próximos Passos

1. ✅ Cupons criados - **FEITO**
2. ⏳ Testar no app - **FAÇA AGORA**
3. ⏳ Verificar incremento de usos - **Após criar conta**
4. ⏳ Testar cupons com Cakto - **Opcional (requer perfil de pagamento)**

## 💡 Dica

Comece sempre com **`TESTE-FREE`** para garantir que o fluxo básico está funcionando!

