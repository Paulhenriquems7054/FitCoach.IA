# Guia de Migração para Supabase

Este guia explica como migrar do IndexedDB local para o Supabase.

## 📋 Passo a Passo

### 1. Configurar Supabase

Siga as instruções no `README.md` para configurar o projeto no Supabase.

### 2. Atualizar Código

O serviço `supabaseService.ts` já está criado e pronto para uso. Você precisará:

1. **Substituir chamadas do databaseService pelo supabaseService** onde necessário
2. **Configurar autenticação** do Supabase
3. **Migrar dados existentes** (opcional)

### 3. Exemplo de Uso

```typescript
import { 
  initSupabase, 
  saveUserToSupabase, 
  getUserFromSupabase,
  getActiveSubscription,
  createSubscription 
} from './services/supabaseService';

// Inicializar Supabase (fazer uma vez no início do app)
initSupabase();

// Salvar usuário
const user = await saveUserToSupabase(userData);

// Obter usuário
const user = await getUserFromSupabase();

// Verificar assinatura
const subscription = await getActiveSubscription();
if (subscription) {
  console.log('Usuário tem assinatura ativa:', subscription);
}

// Criar assinatura
const newSubscription = await createSubscription(planId, 'monthly');
```

### 4. Integração com Autenticação

O Supabase já tem sistema de autenticação integrado. Exemplo:

```typescript
import { getSupabaseClient } from './services/supabaseService';

const supabase = getSupabaseClient();

// Registrar usuário
const { data, error } = await supabase.auth.signUp({
  email: 'usuario@email.com',
  password: 'senha123',
});

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'usuario@email.com',
  password: 'senha123',
});

// Logout
await supabase.auth.signOut();

// Verificar sessão
const { data: { session } } = await supabase.auth.getSession();
```

### 5. Migração de Dados Existentes

Se você tem dados no IndexedDB que precisam ser migrados:

```typescript
import { getUser } from './services/databaseService'; // IndexedDB
import { saveUserToSupabase } from './services/supabaseService'; // Supabase

async function migrateUserData() {
  // Obter dados do IndexedDB
  const localUser = await getUser();
  
  if (localUser) {
    // Salvar no Supabase
    await saveUserToSupabase(localUser);
    console.log('Dados migrados com sucesso!');
  }
}
```

### 6. Verificação de Recursos por Assinatura

```typescript
import { checkFeatureAccess, checkUsageLimit } from './services/supabaseService';

// Verificar se usuário tem acesso a um recurso
const hasAccess = await checkFeatureAccess('photo_analysis');
if (hasAccess) {
  // Permitir análise de foto
}

// Verificar limites de uso
const canUse = await checkUsageLimit('maxPhotoAnalysesPerDay', currentUsage);
if (canUse) {
  // Permitir análise
}
```

## 🔄 Estratégia Híbrida (Recomendada)

Para uma migração suave, você pode manter ambos os sistemas temporariamente:

1. **Tentar Supabase primeiro** (se autenticado)
2. **Fallback para IndexedDB** (se não autenticado ou erro)
3. **Sincronizar dados** quando possível

Exemplo:

```typescript
async function getUserData() {
  try {
    // Tentar Supabase
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      return await getUserFromSupabase();
    }
  } catch (error) {
    logger.warn('Erro ao obter do Supabase, usando IndexedDB', 'migration', error);
  }
  
  // Fallback para IndexedDB
  return await getUser(); // do databaseService
}
```

## ⚠️ Considerações Importantes

1. **Autenticação obrigatória**: O Supabase requer autenticação para acessar dados
2. **RLS ativo**: As políticas de segurança garantem que usuários só vejam seus dados
3. **Sincronização**: Dados locais podem ficar desatualizados - considere sincronização periódica
4. **Offline**: IndexedDB funciona offline, Supabase requer conexão (exceto com cache)

## 🚀 Próximos Passos

1. Integrar gateway de pagamento (Stripe, Mercado Pago)
2. Configurar webhooks para atualizar assinaturas
3. Implementar sistema de notificações
4. Adicionar analytics e métricas

