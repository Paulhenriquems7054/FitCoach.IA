# 🏢 Implementação Completa: Companies e Company Licenses (B2B)

## 📋 Resumo

Implementação completa do modelo B2B usando tabelas `companies` e `company_licenses` para gerenciar academias e suas licenças.

---

## ✅ O que foi implementado

### 1. **Tabelas do Banco de Dados**

#### `companies` (Academias B2B)
- ✅ Informações da empresa (nome, email, telefone, CNPJ, endereço)
- ✅ Plano contratado (starter_mini, starter, growth, pro)
- ✅ Código Mestre único (gerado automaticamente)
- ✅ Status e pagamento
- ✅ Relacionamento com subscription e owner (admin)

#### `company_licenses` (Licenças Ativas)
- ✅ Vincula alunos (`user_id`) à empresa (`company_id`)
- ✅ Status (active, revoked, expired)
- ✅ Relacionamento com subscription do aluno
- ✅ Metadados (quem ativou, notas)

#### Funções SQL
- ✅ `generate_master_code()` - Gera código mestre único
- ✅ `get_active_licenses_count()` - Conta licenças ativas
- ✅ View `companies_summary` - Resumo de empresas

#### Segurança (RLS)
- ✅ Políticas para companies (admins podem gerenciar)
- ✅ Políticas para licenses (admins da empresa podem ver)

---

### 2. **Serviços TypeScript**

#### `services/companyService.ts`
- ✅ `createCompany()` - Cria nova empresa
- ✅ `getCompanyByMasterCode()` - Busca empresa pelo código mestre
- ✅ `getAllCompanies()` - Lista todas (para painel dev)
- ✅ `addCompanyLicense()` - Adiciona licença (vincula aluno)
- ✅ `revokeCompanyLicense()` - Remove licença
- ✅ `getCompanyLicenses()` - Lista licenças de uma empresa

---

### 3. **Integração com Webhook Cakto**

#### `supabase/functions/cakto-webhook/index.ts`
- ✅ Detecta quando um plano B2B é comprado (via `checkout_id`)
- ✅ Cria `company` automaticamente
- ✅ Cria `subscription` vinculada à company
- ✅ Gera código mestre automaticamente
- ✅ Configura usuário como admin da academia
- ✅ Cria chave de API automaticamente

**Mapeamento de Checkout IDs:**
- `3b2kpwc_671196` → `academy_starter_mini`
- `cemyp2n_668537` → `academy_starter`
- `vi6djzq_668541` → `academy_growth`
- `3dis6ds_668546` → `academy_pro`

---

### 4. **Ativação de Alunos**

#### `services/activationCodeService.ts`
- ✅ `activateUserWithCompanyCode()` - **NOVO**: Ativa aluno via código mestre
- ✅ `activateUserWithCode()` - Mantido para compatibilidade (legado)
- ✅ Integração com `companyService` para adicionar licenças
- ✅ Verifica limites de licenças antes de ativar
- ✅ Cria assinatura e vincula aluno à empresa

**Fluxo de Ativação:**
1. Aluno digita código mestre no app
2. Sistema busca empresa pelo código
3. Verifica se há licenças disponíveis
4. Cria assinatura para o aluno
5. Adiciona licença na empresa
6. Vincula aluno à empresa (`gym_id`, `gym_role: 'student'`)

---

## 📝 Como usar

### 1. Executar Migration SQL

```sql
-- Execute no SQL Editor do Supabase
\i supabase/migration_criar_companies_licenses.sql
```

### 2. Testar Criação de Company (via Webhook)

Quando uma academia compra um plano B2B no Cakto:
1. Webhook recebe `subscription.paid` com `checkout_id` do plano B2B
2. Sistema detecta automaticamente
3. Cria `company` com código mestre
4. Envia email com código mestre (TODO: implementar serviço de email)

### 3. Ativar Aluno via Código Mestre

```typescript
import { activateUserWithCompanyCode } from './services/activationCodeService';

const result = await activateUserWithCompanyCode(userId, 'ACADEMIA-ABC');
if (result.success) {
  console.log(`Aluno ativado na empresa: ${result.companyName}`);
} else {
  console.error(result.error);
}
```

### 4. Gerenciar Licenças (Painel Admin)

```typescript
import { 
  getAllCompanies, 
  getCompanyLicenses, 
  revokeCompanyLicense 
} from './services/companyService';

// Listar todas as empresas
const companies = await getAllCompanies();

// Ver licenças de uma empresa
const licenses = await getCompanyLicenses(companyId);

// Revogar licença
await revokeCompanyLicense(licenseId, 'Aluno cancelou matrícula');
```

---

## 🔄 Fluxo Completo B2B

### 1. Academia Compra Plano
```
Academia → Cakto Checkout → Pagamento Confirmado
  ↓
Webhook Cakto recebe subscription.paid
  ↓
Sistema detecta checkout_id B2B
  ↓
Cria company + subscription + código mestre
  ↓
Email com código mestre enviado (TODO)
```

### 2. Aluno Ativa com Código
```
Aluno abre app → "Tenho código de academia"
  ↓
Digita código mestre (ex: ACADEMIA-ABC)
  ↓
activateUserWithCompanyCode()
  ↓
Verifica licenças disponíveis
  ↓
Cria subscription + company_license
  ↓
Aluno tem acesso Premium
```

### 3. Admin Gerencia Licenças
```
Admin acessa painel → Ver lista de alunos
  ↓
Pode revogar licença (aluno cancelou)
  ↓
Licença revogada → Assinatura cancelada
  ↓
Aluno volta para modo free
```

---

## 📊 Estrutura de Dados

### Company (Exemplo)
```json
{
  "id": "uuid",
  "name": "Academia Fit",
  "email": "contato@academiafit.com",
  "masterCode": "ACADEMIA-ABC",
  "planType": "academy_growth",
  "planName": "Pack Growth",
  "maxLicenses": 50,
  "licensesUsed": 12,
  "status": "active",
  "paymentStatus": "paid"
}
```

### Company License (Exemplo)
```json
{
  "id": "uuid",
  "companyId": "uuid",
  "userId": "uuid",
  "status": "active",
  "activatedAt": "2025-01-27T10:00:00Z",
  "subscriptionId": "uuid"
}
```

---

## ⚠️ Próximos Passos (Opcional)

1. **Serviço de Email**
   - Enviar email com código mestre quando company é criada
   - Template bonito com instruções

2. **Painel de Admin da Academia**
   - Interface para ver licenças ativas
   - Revogar licenças
   - Ver estatísticas

3. **Notificações**
   - Avisar quando licenças estão acabando
   - Sugerir upgrade

4. **Migração de Dados**
   - Migrar `activation_codes` existentes para `companies`
   - Manter compatibilidade durante transição

---

## ✅ Checklist de Implementação

- [x] Migration SQL criada
- [x] Tabelas `companies` e `company_licenses` criadas
- [x] Funções SQL (generate_master_code, get_active_licenses_count)
- [x] View `companies_summary`
- [x] RLS policies configuradas
- [x] Serviço `companyService.ts` completo
- [x] Integração com webhook Cakto
- [x] Ativação de alunos via código mestre
- [ ] **Executar migration no Supabase** ⚠️
- [ ] Testar criação de company via webhook
- [ ] Testar ativação de aluno
- [ ] Implementar serviço de email

---

**Última atualização**: 2025-01-27  
**Status**: Implementação completa, aguardando execução da migration e testes

