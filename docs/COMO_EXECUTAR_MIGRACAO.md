# 📋 Como Executar a Migração SQL

## ⚠️ IMPORTANTE

**NÃO copie o conteúdo de arquivos `.md` (markdown) para o SQL Editor!**

Os arquivos `.md` contêm formatação markdown (como ` ```sql `) que não é SQL válido.

## ✅ Forma Correta

### Opção 1: Usar o Arquivo SQL Direto (Recomendado)

1. Abra o arquivo: **`supabase/migration_criar_sistema_ativacao_academias_EXECUTAR.sql`**
2. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)
3. Acesse: Supabase Dashboard → SQL Editor
4. **Cole o conteúdo** (Ctrl+V)
5. Clique em **"Run"** ou pressione **Ctrl+Enter**

### Opção 2: Executar em Partes

Se preferir executar em partes menores:

#### Parte 1: Adicionar Campos em academy_subscriptions

```sql
ALTER TABLE public.academy_subscriptions
ADD COLUMN IF NOT EXISTS licenses_used INTEGER DEFAULT 0;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'academy_subscriptions' 
        AND column_name = 'activation_code'
    ) THEN
        ALTER TABLE public.academy_subscriptions
        ADD COLUMN activation_code TEXT UNIQUE;
    END IF;
END $$;
```

#### Parte 2: Criar Tabela student_academy_links

```sql
CREATE TABLE IF NOT EXISTS public.student_academy_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id UUID NOT NULL,
  academy_subscription_id UUID NOT NULL,
  activation_code TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'expired')),
  activated_at TIMESTAMPTZ DEFAULT now(),
  blocked_at TIMESTAMPTZ,
  FOREIGN KEY (academy_subscription_id) REFERENCES public.academy_subscriptions(id) ON DELETE CASCADE
);
```

#### Parte 3: Criar Índices

```sql
CREATE INDEX IF NOT EXISTS idx_student_academy_links_user 
  ON public.student_academy_links(student_user_id);

CREATE INDEX IF NOT EXISTS idx_student_academy_links_academy 
  ON public.student_academy_links(academy_subscription_id);

CREATE INDEX IF NOT EXISTS idx_student_academy_links_status 
  ON public.student_academy_links(status);

CREATE INDEX IF NOT EXISTS idx_academy_subscriptions_code 
  ON public.academy_subscriptions(activation_code) 
  WHERE activation_code IS NOT NULL;
```

#### Parte 4: Configurar RLS

```sql
ALTER TABLE public.student_academy_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own academy links" ON public.student_academy_links;
CREATE POLICY "Users can view own academy links"
  ON public.student_academy_links
  FOR SELECT
  USING (auth.uid() = student_user_id);

DROP POLICY IF EXISTS "Users can create own academy links" ON public.student_academy_links;
CREATE POLICY "Users can create own academy links"
  ON public.student_academy_links
  FOR INSERT
  WITH CHECK (auth.uid() = student_user_id);

DROP POLICY IF EXISTS "Service role can manage academy links" ON public.student_academy_links;
CREATE POLICY "Service role can manage academy links"
  ON public.student_academy_links
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

---

## ✅ Verificar se Funcionou

Execute esta query para verificar:

```sql
-- Verificar se campos foram adicionados
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'academy_subscriptions'
AND column_name IN ('licenses_used', 'activation_code');

-- Verificar se tabela foi criada
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'student_academy_links';

-- Verificar índices
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'student_academy_links';
```

---

## 🔍 Troubleshooting

### Erro: "relation academy_subscriptions does not exist"

**Solução:** A tabela `academy_subscriptions` precisa existir primeiro. Ela é criada automaticamente quando uma academia compra um plano via webhook, ou você pode criá-la manualmente.

### Erro: "column already exists"

**Solução:** Normal! O `IF NOT EXISTS` previne esse erro. Pode ignorar.

### Erro: "syntax error at or near"

**Solução:** Você provavelmente copiou conteúdo de um arquivo `.md`. Use o arquivo `.sql` diretamente!

---

**Arquivo correto para usar:** `supabase/migration_criar_sistema_ativacao_academias_EXECUTAR.sql`

