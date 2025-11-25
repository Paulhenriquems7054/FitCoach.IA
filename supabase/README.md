# Configuração do Supabase para FitCoach.IA

Este diretório contém os arquivos SQL necessários para configurar o banco de dados Supabase para o FitCoach.IA com suporte a assinaturas e multi-tenancy.

## 📋 Pré-requisitos

1. Conta no [Supabase](https://supabase.com)
2. Projeto criado no Supabase
3. URL e chaves de API do projeto

## 🚀 Configuração

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a URL do projeto e as chaves de API

### 2. Executar o Schema SQL

1. No painel do Supabase, vá em **SQL Editor**
2. Execute o arquivo `schema.sql` completo
3. Isso criará todas as tabelas, índices, funções e triggers necessários

### 3. Configurar Políticas de Segurança (RLS)

1. No **SQL Editor**, execute o arquivo `rls_policies.sql`
2. Isso habilitará Row Level Security e criará todas as políticas de acesso

### 4. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-key
```

**Importante**: A chave `anon` é pública e segura para uso no frontend. Ela é protegida pelas políticas RLS.

### 5. Configurar Autenticação

No painel do Supabase:
1. Vá em **Authentication** > **Settings**
2. Configure os provedores de autenticação desejados (Email, Google, etc.)
3. Configure as URLs de redirecionamento

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

- **users**: Dados dos usuários
- **subscription_plans**: Planos de assinatura disponíveis
- **user_subscriptions**: Assinaturas ativas dos usuários
- **payments**: Histórico de pagamentos
- **invoices**: Faturas geradas
- **gyms**: Academias (multi-tenancy)
- **weight_history**: Histórico de peso
- **wellness_plans**: Planos de treino
- **meal_plans**: Planos alimentares
- **meal_analyses**: Análises de refeições
- **recipes**: Receitas salvas
- **chat_messages**: Mensagens do chat

## 🔒 Segurança

O banco utiliza **Row Level Security (RLS)** para garantir que:
- Usuários só acessem seus próprios dados
- Admins de academia só vejam dados da sua academia
- Trainers só vejam dados dos alunos da sua academia

## 💳 Planos de Assinatura

O schema inclui 4 planos padrão:

1. **Free** (Gratuito)
   - Recursos básicos
   - Limites reduzidos

2. **Basic** (R$ 29,90/mês)
   - Recursos intermediários
   - Limites aumentados

3. **Premium** (R$ 59,90/mês)
   - Todos os recursos
   - Limites ilimitados para usuário individual

4. **Enterprise** (R$ 199,90/mês)
   - Multi-academia
   - Gerenciamento de alunos
   - Recursos ilimitados

## 🔄 Migração de Dados

Para migrar dados do IndexedDB local para o Supabase:

1. Use o serviço `supabaseService.ts` que já está configurado
2. Os dados serão sincronizados automaticamente quando o usuário fizer login
3. Considere criar um script de migração em lote se necessário

## 📝 Próximos Passos

1. Integrar com gateway de pagamento (Stripe, Mercado Pago, etc.)
2. Configurar webhooks para atualizar status de assinaturas
3. Implementar sistema de notificações de pagamento
4. Configurar backups automáticos

## 🛠️ Comandos Úteis

### Resetar banco de dados (CUIDADO!)
```sql
-- Desabilitar RLS temporariamente
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- ... (fazer alterações)
-- Reabilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

### Verificar assinaturas ativas
```sql
SELECT u.nome, sp.display_name, us.status, us.current_period_end
FROM user_subscriptions us
JOIN users u ON u.id = us.user_id
JOIN subscription_plans sp ON sp.id = us.plan_id
WHERE us.status = 'active';
```

### Verificar pagamentos pendentes
```sql
SELECT u.nome, p.amount, p.status, p.created_at
FROM payments p
JOIN users u ON u.id = p.user_id
WHERE p.status = 'pending'
ORDER BY p.created_at DESC;
```

## 📚 Documentação

- [Documentação do Supabase](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)

