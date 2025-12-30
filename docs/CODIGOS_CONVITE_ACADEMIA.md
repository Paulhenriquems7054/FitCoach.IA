# 📋 Códigos de Convite da Academia - Como Funciona

## 🎯 Resumo

**✅ SIM:** O sistema cria automaticamente o **`master_code`** quando uma academia compra um plano B2B.

**❌ NÃO:** O sistema **NÃO** cria automaticamente os **códigos de convite** (invites). Estes precisam ser criados manualmente pela academia.

## 🔑 Diferença entre `master_code` e Códigos de Convite

### 1. `master_code` (Código Mestre)
- **Formato:** `ACADEMIA-XXX` (ex: `ACADEMIA-ABC`)
- **Quando é criado:** Automaticamente no webhook quando academia compra plano B2B
- **Onde fica:** Tabela `companies.master_code`
- **Função:** Identificador único da academia
- **Uso:** Não é usado diretamente por alunos para se cadastrar

### 2. Códigos de Convite (Invites)
- **Formato:** 6 caracteres aleatórios (ex: `ABC123`)
- **Quando é criado:** Manualmente pela academia via interface
- **Onde fica:** Tabela `invites`
- **Função:** Permite que alunos se cadastrem e sejam vinculados à academia
- **Uso:** Alunos usam este código para se cadastrar e receber trial de 3 dias

## 🔄 Fluxo Completo

### 1. Academia Compra Plano B2B

**Webhook Cakto processa pagamento:**
```typescript
// supabase/functions/cakto-webhook/index.ts
async function handleAcademyPlan() {
  // 1. Gera master_code automaticamente
  const { data: masterCode } = await supabase.rpc('generate_master_code');
  // Resultado: "ACADEMIA-ABC"
  
  // 2. Cria empresa na tabela companies
  await supabase.from("companies").insert({
    master_code: masterCode, // ✅ Criado automaticamente
    // ... outros campos
  });
  
  // 3. Cria registro em gyms
  await supabase.from("gyms").insert({
    id: company.id,
    // ...
  });
}
```

**Função SQL que gera o `master_code`:**
```sql
-- supabase/migration_criar_companies_licenses.sql
CREATE OR REPLACE FUNCTION generate_master_code()
RETURNS TEXT AS $$
DECLARE
  prefix TEXT := 'ACADEMIA';
  random_suffix TEXT;
  final_code TEXT;
BEGIN
  LOOP
    -- Gerar sufixo aleatório (3 letras maiúsculas)
    random_suffix := upper(substring(md5(random()::text) from 1 for 3));
    final_code := prefix || '-' || random_suffix;
    
    -- Verificar se já existe
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.companies WHERE master_code = final_code);
  END LOOP;
  
  RETURN final_code;
END;
$$ LANGUAGE plpgsql;
```

### 2. Academia Precisa Criar Códigos de Convite

**A academia acessa a interface e cria convites:**
```typescript
// services/inviteService.ts
export async function createInvite(
  academyId: string,
  createdByUserId: string,
  invitedRole: 'student' | 'personal',
  expiresInDays: number = 7
): Promise<{ code: string }> {
  // Gera código aleatório de 6 caracteres
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Insere na tabela invites
  await supabase.from('invites').insert({
    academy_id: academyId,
    created_by_user_id: createdByUserId,
    invited_role: invitedRole,
    code,
    expires_at: expiresAt.toISOString(),
    status: 'pending',
  });
  
  return { code };
}
```

### 3. Aluno Usa Código de Convite

**Aluno se cadastra usando o código:**
```typescript
// services/inviteService.ts
export async function acceptInvite(code: string, userId: string) {
  // Valida código
  const validation = await validateInvite(code);
  
  // Vincula aluno à academia
  await supabase.from('users').update({
    academy_id: validation.academyId,
    tenant_role: 'student',
    // ✅ Ativa trial de 3 dias automaticamente
    trial_active: true,
    trial_expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  });
}
```

## 📊 Estrutura no Banco de Dados

### Tabela `companies`
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY,
  master_code TEXT UNIQUE NOT NULL, -- ✅ Criado automaticamente
  name TEXT,
  email TEXT,
  -- ...
);
```

### Tabela `invites`
```sql
CREATE TABLE invites (
  id UUID PRIMARY KEY,
  academy_id UUID REFERENCES companies(id),
  code TEXT UNIQUE NOT NULL, -- ❌ Criado manualmente
  invited_role TEXT, -- 'student' ou 'personal'
  status TEXT, -- 'pending', 'accepted', 'expired'
  expires_at TIMESTAMP,
  -- ...
);
```

## ✅ O Que Já Está Implementado

1. **✅ Geração automática de `master_code`**
   - Função SQL `generate_master_code()` existe
   - Webhook chama esta função ao processar pagamento B2B
   - Código é salvo na tabela `companies`

2. **✅ Criação manual de códigos de convite**
   - Função `createInvite()` existe em `inviteService.ts`
   - Academia pode criar convites via interface

3. **✅ Validação e aceitação de convites**
   - Função `validateInvite()` existe
   - Função `acceptInvite()` existe e ativa trial automaticamente

## ❌ O Que NÃO Está Implementado

1. **❌ Criação automática de códigos de convite no webhook**
   - O webhook não cria convites automaticamente
   - Academia precisa criar manualmente após comprar o plano

## 💡 Sugestão de Melhoria (Opcional)

Se quiser criar convites automaticamente quando a academia compra um plano, você pode adicionar no webhook:

```typescript
// supabase/functions/cakto-webhook/index.ts
async function handleAcademyPlan() {
  // ... código existente ...
  
  // NOVO: Criar código de convite padrão para alunos
  const { data: invite, error: inviteError } = await supabase
    .from('invites')
    .insert({
      academy_id: company.id,
      created_by_user_id: company.id, // ou buscar owner da academia
      invited_role: 'student',
      code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 ano
      status: 'pending',
    })
    .select()
    .single();
  
  if (!inviteError && invite) {
    console.log(`✅ Código de convite criado automaticamente: ${invite.code}`);
  }
}
```

## 🧪 Como Testar

### 1. Verificar se `master_code` foi criado
```sql
SELECT id, name, master_code, email
FROM companies
WHERE email = 'email-da-academia@exemplo.com';
```

### 2. Criar código de convite manualmente
```typescript
import { createInvite } from './services/inviteService';

const { code } = await createInvite(
  academyId,
  userId,
  'student',
  30 // expira em 30 dias
);

console.log(`Código criado: ${code}`);
```

### 3. Verificar convites criados
```sql
SELECT code, invited_role, status, expires_at
FROM invites
WHERE academy_id = 'id-da-academia'
ORDER BY created_at DESC;
```

## 📝 Resumo Final

| Item | Criado Automaticamente? | Onde? |
|------|------------------------|-------|
| **`master_code`** | ✅ SIM | Webhook Cakto |
| **Códigos de Convite** | ❌ NÃO | Manual via interface |
| **Trial de 3 dias** | ✅ SIM | Quando aluno aceita convite |

**Conclusão:** O sistema cria automaticamente o `master_code` quando a academia compra um plano, mas os códigos de convite precisam ser criados manualmente pela academia através da interface de administração.

