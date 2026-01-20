# ⚡ QUICK START - 30 minutos para começar

**Tempo total**: 30 minutos  
**Conhecimento necessário**: Básico em SQL e N8N

---

## 🔥 Passo 1: Executar Migration SQL (5 min)

```bash
1. Acessar: https://app.supabase.com/project/seu-projeto/sql/new

2. Copiar TODO o conteúdo de:
   supabase/migrations/001_create_billing_system.sql

3. Colar no SQL Editor

4. Clique em RUN

5. Aguardar... ✅ Pronto!
```

**Verificar se funcionou**:
```sql
SELECT * FROM plans;
-- Deve retornar 3 planos: Free, Pro, Premium
```

---

## 🔥 Passo 2: Importar Workflows N8N (15 min)

### 2A - Workflow de Limite (5 min)

```bash
1. Acessar: https://agentesiaphbb.app.n8n.cloud

2. Clique em "+" (novo workflow)

3. Clique em "..." → "Import from URL" ou "Import"

4. Cole este arquivo:
   n8n-workflows/workflow-billing-limit-check.json

5. Clique em "Import"

6. Configurar credenciais Supabase:
   - Host: seu-projeto.supabase.co
   - User: postgres
   - Password: sua-senha-master
   - Database: postgres

7. Clique em "..." → "Activate"
```

### 2B - Workflow de Email (5 min)

```bash
1. Novo workflow ("+" → "Import")

2. Cole: n8n-workflows/workflow-email-processor.json

3. Configurar Supabase (mesmas credenciais acima)

4. Configurar SendGrid:
   - Obter API Key: https://app.sendgrid.com/settings/api_keys
   - No N8N → credencial nova → SendGrid
   - Colar API Key

5. Ativar workflow
```

### 2C - Workflow de IA (5 min)

```bash
1. Novo workflow ("+" → "Import")

2. Cole: n8n-workflows/workflow-ai-spending-analysis.json

3. Configurar Supabase

4. Adicionar variável GEMINI_API_KEY:
   Admin → Settings → Variables
   Nome: GEMINI_API_KEY
   Valor: sua-chave-gemini

5. Ativar workflow
```

---

## 🔥 Passo 3: Testar Tudo (10 min)

### Teste 1: Verificar BD
```sql
-- Supabase SQL Editor
SELECT * FROM plans;
SELECT * FROM email_templates;
SELECT * FROM subscriptions;
-- Deve tudo estar vazio/criado
```

### Teste 2: Testar Workflow Manual
```
1. N8N → Workflow "Verificação de Limite"
2. Clique em "Execute" (play button)
3. Deve rodar sem erros
4. Aguarde 5s
```

### Teste 3: Testar Email
```sql
-- Inserir email de teste no BD
INSERT INTO email_queue (
  user_id, 
  recipient_email, 
  template_id, 
  type, 
  status
) VALUES (
  gen_random_uuid(),
  'seu-email@test.com',
  (SELECT id FROM email_templates LIMIT 1),
  'test',
  'pending'
);

-- Aguarde 5 minutos (workflow processa a cada 5 min)
-- Verificar se foi enviado:
SELECT status, error_message 
FROM email_queue 
WHERE recipient_email = 'seu-email@test.com';
```

---

## ✅ Pronto para usar!

Se todos os 3 testes passaram, você tem:

✅ **Banco de dados** criado com 9 tabelas  
✅ **Verificação automática** de limite (diariamente)  
✅ **Envio automático** de emails (a cada 5 min)  
✅ **Análise IA** de gastos (toda quinta-feira)  

---

## 🎯 Próximo: Integrar no Frontend

Para rastrear uso no seu app React:

```typescript
// Importar hook
import { useSpendingTracker } from '@/hooks/useSpendingTracker';

// Usar no componente
const { trackOperation } = useSpendingTracker();

// Rastrear uma operação
await trackOperation('text_analysis', 150, 0.015);
```

**Mais detalhes em**: `EXEMPLOS_INTEGRACAO_BILLING.md`

---

## 🆘 Se algo não funcionar

| Problema | Solução |
|----------|---------|
| SQL Error | Verificar se não rodou 2x. Delete and retry. |
| N8N não conecta | Verificar credenciais Supabase (Host, User, Password) |
| Email não chega | Verificar SendGrid API Key em Variables do N8N |
| Workflow não executa | Clique em "..." → "Activate" |

---

## 📞 Checklist Final

- [ ] Migration SQL executada
- [ ] 3 workflows importados no N8N
- [ ] Credenciais Supabase configuradas
- [ ] SendGrid API Key adicionada
- [ ] GEMINI_API_KEY adicionada em N8N
- [ ] Todos os 3 testes passaram
- [ ] Workflows estão "Active"

**Se tudo ✅, você está pronto!**

Próximas fases:
1. Integrar `useSpendingTracker` no seu código
2. Adicionar página de planos
3. Configurar Stripe (pagamentos)

**Tempo gasto**: ~30 minutos ⏱️  
**Valor**: Sistema de billing automático pronto para produção 🚀

