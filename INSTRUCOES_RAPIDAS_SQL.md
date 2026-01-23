# ⚡ Instruções Rápidas: Criar Perfil Manualmente

## 📁 Arquivos SQL Criados

Criei dois arquivos SQL separados que você pode executar diretamente no Supabase SQL Editor:

1. **`supabase/CRIAR_PERFIL_MANUAL.sql`** - Para criar perfis manualmente
2. **`supabase/VERIFICAR_TRIGGER.sql`** - Para verificar se o trigger está funcionando

---

## 🚀 Passo a Passo

### 1. Acesse o Supabase SQL Editor

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** (no menu lateral)

### 2. Execute o Arquivo SQL

**Opção A: Copiar e Colar**

1. Abra o arquivo `supabase/CRIAR_PERFIL_MANUAL.sql` no seu editor
2. Copie todo o conteúdo
3. Cole no Supabase SQL Editor
4. **IMPORTANTE:** Antes de executar, substitua `'3197d46e-6a2c-4e2e-8714-b18e08c4f114'` pelo ID do seu usuário (ou remova a linha WHERE para criar perfis para todos)
5. Clique em **Run** (ou pressione Ctrl+Enter)

**Opção B: Executar Parte por Parte**

1. Execute apenas a **Solução 1** (para um usuário específico)
   - Lembre-se de alterar o ID do usuário
2. Ou execute a **Solução 2** (para todos os usuários sem perfil)

### 3. Verifique se Funcionou

Execute esta query:

```sql
SELECT * FROM public.users WHERE email = 'paulohmorais@hotmail.com';
```

Se retornar um resultado, o perfil foi criado com sucesso!

---

## 🔍 Verificar o Trigger

1. Abra o arquivo `supabase/VERIFICAR_TRIGGER.sql`
2. Copie e cole no Supabase SQL Editor
3. Execute para verificar:
   - Se o trigger existe
   - Se a função existe e tem SECURITY DEFINER
   - Se as políticas RLS estão corretas
   - Quais usuários não têm perfil

---

## ⚠️ Erros Comuns

### Erro: "syntax error at or near ```"

**Causa:** Você está tentando executar o arquivo `.md` (markdown) em vez do arquivo `.sql`

**Solução:** 
- Use o arquivo `CRIAR_PERFIL_MANUAL.sql` (não o `.md`)
- Ou copie apenas o código SQL (sem os ```sql)

### Erro: "permission denied"

**Causa:** Você não tem permissão para inserir na tabela `users`

**Solução:**
- Execute como `postgres` ou `service_role` no Supabase SQL Editor
- Ou verifique se a política RLS permite INSERT

### Erro: "duplicate key value"

**Causa:** O perfil já existe

**Solução:**
- Isso é normal! A query tem `ON CONFLICT (id) DO NOTHING`
- Verifique se o perfil existe com a query de verificação acima

---

## ✅ Próximos Passos

Após criar o perfil:

1. **Teste o login:**
   - Tente fazer login com `paulohmorais@hotmail.com`
   - Deve funcionar agora!

2. **Verifique o trigger:**
   - Crie um novo usuário de teste
   - Verifique se o perfil é criado automaticamente
   - Se não for, execute a migration `008_trigger_perfil_simples.sql` novamente

---

## 📞 Precisa de Ajuda?

Se ainda tiver problemas:

1. Execute a query de verificação (arquivo `VERIFICAR_TRIGGER.sql`)
2. Compartilhe os resultados
3. Verifique os logs do Supabase Dashboard → Logs
