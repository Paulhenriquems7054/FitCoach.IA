# 📋 Qual Arquivo de Diagnóstico Usar?

## 🚨 Se você recebeu o erro: `relation "companies" does not exist`

**Use este arquivo:**
- `docs/DIAGNOSTICO_SISTEMA_SEGURO.sql`

Este arquivo verifica quais tabelas existem antes de consultá-las, então não vai dar erro mesmo se algumas tabelas não existirem.

---

## ✅ Se todas as tabelas já existem no seu banco

**Use este arquivo:**
- `docs/DIAGNOSTICO_SISTEMA_COMPLETO.sql`

Este arquivo é mais direto e completo, mas vai dar erro se alguma tabela não existir.

---

## 🔧 O que fazer se a tabela `companies` não existir?

Se você recebeu o erro `relation "companies" does not exist`, significa que a migração que cria essa tabela ainda não foi executada.

### Solução:

1. **Execute a migração no Supabase:**
   
   **Opção A - Versão Simplificada (RECOMENDADA):**
   - Abra o arquivo `supabase/migration_criar_companies_licenses_SIMPLIFICADA.sql`
   - Copie todo o conteúdo
   - Cole no SQL Editor do Supabase
   - Execute (Run)
   - ✅ Esta versão funciona mesmo se algumas dependências não existirem
   
   **Opção B - Versão Completa:**
   - Abra o arquivo `supabase/migration_criar_companies_licenses.sql`
   - Copie todo o conteúdo
   - Cole no SQL Editor do Supabase
   - Execute (Run)
   - ⚠️ Requer que as tabelas `users` e `user_subscriptions` já existam

2. **Depois execute o diagnóstico:**
   - Use `docs/DIAGNOSTICO_SISTEMA_SEGURO.sql` (versão segura)
   - Ou `docs/DIAGNOSTICO_SISTEMA_COMPLETO.sql` (versão completa)

---

## 📊 Diferenças entre os arquivos

| Característica | DIAGNOSTICO_SISTEMA_COMPLETO.sql | DIAGNOSTICO_SISTEMA_SEGURO.sql |
|----------------|----------------------------------|--------------------------------|
| Verifica existência de tabelas | ❌ Não | ✅ Sim |
| Funciona se tabelas não existirem | ❌ Não | ✅ Sim |
| Mostra mensagens de erro | ❌ Não | ✅ Sim |
| Performance | ⚡ Mais rápido | ⚡ Um pouco mais lento |
| Completo | ✅ Sim | ✅ Sim |

---

## 🎯 Recomendação

**Use sempre `DIAGNOSTICO_SISTEMA_SEGURO.sql`** se você não tem certeza de quais tabelas existem no seu banco.

Ele vai:
- ✅ Mostrar quais tabelas existem
- ✅ Pular tabelas que não existem (sem dar erro)
- ✅ Mostrar mensagens informativas quando tabelas estão faltando
- ✅ Funcionar mesmo se o banco estiver incompleto

---

## 📝 Tabelas que o sistema precisa

Para o sistema funcionar completamente, você precisa destas tabelas:

- ✅ `app_plans` - Planos de assinatura
- ✅ `user_subscriptions` - Assinaturas B2C
- ✅ `academy_subscriptions` - Assinaturas de academias
- ✅ `personal_subscriptions` - Assinaturas de personal trainers
- ✅ `recharges` - Recargas (Turbo, Banco de Voz, etc.)
- ✅ `coupons` - Cupons de convite
- ⚠️ `companies` - Academias B2B (opcional, só se usar B2B)
- ⚠️ `company_licenses` - Licenças de academias (opcional, só se usar B2B)
- ⚠️ `cakto_webhooks` - Logs de webhooks (opcional, útil para debug)

---

## 🚀 Próximos Passos

1. Execute `DIAGNOSTICO_SISTEMA_SEGURO.sql`
2. Veja quais tabelas existem e quais faltam
3. Execute as migrações necessárias
4. Execute o diagnóstico novamente para verificar

---

**Última atualização:** Dezembro 2025

