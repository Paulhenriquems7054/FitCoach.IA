# 🚀 Quick Start - Supabase Setup

## 1. Criar Projeto no Supabase

1. Acesse https://supabase.com
2. Crie um novo projeto
3. Anote:
   - **URL do projeto**: `https://xxxxx.supabase.co`
   - **Anon Key**: encontrada em Settings > API

## 2. Executar SQL no Supabase

1. No painel do Supabase, vá em **SQL Editor**
2. Execute `schema.sql` (cria todas as tabelas)
3. Execute `rls_policies.sql` (configura segurança)

## 3. Configurar Variáveis de Ambiente

Crie/edite `.env.local`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-key
```

## 4. Testar Conexão

```typescript
import { initSupabase, getSubscriptionPlans } from './services/supabaseService';

// Inicializar
initSupabase();

// Testar - obter planos
const plans = await getSubscriptionPlans();
console.log('Planos disponíveis:', plans);
```

## ✅ Pronto!

O banco de dados está configurado e pronto para uso com sistema de assinaturas!

## 📚 Documentação

- `README.md` - Documentação completa
- `MIGRATION_GUIDE.md` - Guia de migração do IndexedDB
- `schema.sql` - Estrutura do banco
- `rls_policies.sql` - Políticas de segurança

