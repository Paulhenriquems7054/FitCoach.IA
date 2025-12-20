# 📋 GUIA DE IMPLEMENTAÇÃO - PRÓXIMOS PASSOS

**Data:** 2025-01-27  
**Status:** Implementações criadas, aguardando integração

---

## ✅ ARQUIVOS CRIADOS

### **1. Middleware de Validação**
- ✅ `backend/src/common/middleware/subscription-validation.middleware.ts`
- ✅ `backend/src/app.module.ts` (atualizado para usar middleware)

### **2. Sistema de Auditoria**
- ✅ `services/auditService.ts`
- ✅ `supabase/migration_criar_tabela_audit_logs.sql`
- ✅ `supabase/functions/cakto-webhook/index.ts` (atualizado com logging)

### **3. Scripts de Teste**
- ✅ `supabase/scripts/teste_fluxo_completo.sql`

### **4. Migração IndexedDB → Supabase**
- ✅ `supabase/migration_migrar_indexeddb_para_supabase.sql`
- ✅ `services/migrationService.ts`

### **5. Sistema de Monitoramento**
- ✅ `services/monitoringService.ts`

---

## 🚀 IMPLEMENTAÇÕES NECESSÁRIAS

### **PASSO 1: Executar Migrations SQL**

Execute no Supabase SQL Editor (nesta ordem):

1. `supabase/migration_criar_tabela_audit_logs.sql`
2. `supabase/migration_migrar_indexeddb_para_supabase.sql`

### **PASSO 2: Integrar Middleware no Backend**

O middleware já está configurado em `app.module.ts`, mas você precisa:

1. **Instalar dependências do NestJS** (se necessário):
```bash
cd backend
npm install @nestjs/common @nestjs/core
```

2. **Verificar se está funcionando:**
   - O middleware valida automaticamente todas as rotas `/ai/*`
   - Retorna 403 se assinatura estiver inativa

### **PASSO 3: Integrar Auditoria no Frontend**

Adicione logging de auditoria em ações críticas:

```typescript
// Exemplo: Ao fazer login
import { logUserLogin } from './services/auditService';

await logUserLogin(userId, username);
```

**Locais para adicionar:**
- Login/Logout (`services/databaseService.ts`)
- Criação de alunos (`services/studentManagementService.ts`)
- Bloqueio/Desbloqueio (`services/studentManagementService.ts`)
- Criação de assinatura (`services/supabaseService.ts`)

### **PASSO 4: Executar Testes**

Execute o script de teste:

```sql
-- No Supabase SQL Editor
\i supabase/scripts/teste_fluxo_completo.sql
```

Ou copie e cole o conteúdo do arquivo.

### **PASSO 5: Migrar Dados do IndexedDB**

**OPÇÃO A - Migração Automática (Recomendado):**

Crie um componente React que executa a migração:

```typescript
// components/DataMigrationPrompt.tsx
import { migrateAllDataToSupabase } from '../services/migrationService';
import { useUser } from '../context/UserContext';

export function DataMigrationPrompt() {
  const { user } = useUser();
  
  const handleMigrate = async () => {
    if (!user?.id) return;
    
    const result = await migrateAllDataToSupabase(user.id);
    
    if (result.success) {
      // Limpar IndexedDB após migração
      await clearIndexedDBAfterMigration();
      alert('Migração concluída!');
    } else {
      alert('Erro na migração: ' + result.errors.join(', '));
    }
  };
  
  // Mostrar prompt se houver dados no IndexedDB
  return (
    <div>
      <p>Deseja migrar seus dados para o servidor?</p>
      <button onClick={handleMigrate}>Migrar Agora</button>
    </div>
  );
}
```

**OPÇÃO B - Criptografar IndexedDB:**

Se preferir manter IndexedDB, crie um serviço de criptografia:

```typescript
// services/encryptionService.ts
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-key-change-in-production';

export function encryptData(data: any): string {
  return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
}

export function decryptData(encrypted: string): any {
  const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}
```

### **PASSO 6: Adicionar Monitoramento**

Crie uma página de dashboard para admins:

```typescript
// pages/AdminDashboard.tsx
import { getSystemMetrics, checkSystemHealth } from '../services/monitoringService';

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [health, setHealth] = useState<any>(null);
  
  useEffect(() => {
    loadMetrics();
  }, []);
  
  const loadMetrics = async () => {
    const [metricsData, healthData] = await Promise.all([
      getSystemMetrics(),
      checkSystemHealth()
    ]);
    setMetrics(metricsData);
    setHealth(healthData);
  };
  
  // Renderizar métricas...
}
```

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### **Curto Prazo (Hoje)**
- [ ] Executar `migration_criar_tabela_audit_logs.sql`
- [ ] Executar `migration_migrar_indexeddb_para_supabase.sql`
- [ ] Testar middleware no backend (fazer requisição sem assinatura)
- [ ] Executar script de teste `teste_fluxo_completo.sql`
- [ ] Verificar isolamento de dados entre academias

### **Esta Semana**
- [ ] Integrar `logAuditEvent` em ações críticas
- [ ] Criar componente de migração de dados
- [ ] Implementar dashboard de monitoramento
- [ ] Testar cancelamento e revogação
- [ ] Documentar APIs

### **Médio Prazo**
- [ ] Migrar todos os dados do IndexedDB
- [ ] Remover ou criptografar IndexedDB
- [ ] Adicionar alertas de monitoramento
- [ ] Configurar notificações para admins

---

## 🔍 COMO TESTAR

### **1. Testar Isolamento Multi-Tenant**

```sql
-- Executar script de teste
\i supabase/scripts/teste_fluxo_completo.sql

-- Verificar que Academia A não vê dados da Academia B
SELECT * FROM public.weight_history 
WHERE gym_id = (SELECT id::text FROM public.companies WHERE master_code = 'ACADEMIA-TESTA');
```

### **2. Testar Middleware de Validação**

```bash
# Fazer requisição sem assinatura ativa
curl -X POST http://localhost:3000/ai/text \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-sem-assinatura",
    "prompt": "teste"
  }'

# Deve retornar 403 Forbidden
```

### **3. Testar Revogação Automática**

```sql
-- Cancelar uma academia
UPDATE public.companies 
SET status = 'cancelled' 
WHERE master_code = 'ACADEMIA-TESTA';

-- Executar função de revogação
SELECT * FROM revoke_expired_subscriptions();

-- Verificar que alunos foram bloqueados
SELECT * FROM public.users 
WHERE gym_id = (SELECT id::text FROM public.companies WHERE master_code = 'ACADEMIA-TESTA')
AND access_blocked = TRUE;
```

---

## 📊 MÉTRICAS DE SUCESSO

Após implementação, verificar:

- ✅ Middleware bloqueia requisições sem assinatura
- ✅ Dados isolados entre academias
- ✅ Cancelamento revoga acesso automaticamente
- ✅ Auditoria registra eventos importantes
- ✅ Monitoramento mostra métricas corretas
- ✅ Migração de dados funciona

---

**Documento gerado automaticamente**  
**Última atualização:** 2025-01-27

