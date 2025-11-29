# Diagnóstico: Erro "Usuário não encontrado"

## 🔍 Onde o Erro Pode Estar Ocorrendo

O erro "Usuário não encontrado" pode aparecer em diferentes momentos:

### 1. Durante o Cadastro (registerWithInvite)
- **Local**: `services/supabaseService.ts` → `registerWithInvite`
- **Causa**: Não consegue buscar o usuário após criar
- **Solução**: Já implementada - código garante retorno de usuário válido

### 2. Após o Cadastro (LoginOrRegister)
- **Local**: `components/LoginOrRegister.tsx` → `handleRegister`
- **Causa**: `result.user` está vazio ou inválido
- **Solução**: Adicionada validação antes de usar `result.user`

### 3. Ao Buscar Perfil (getCurrentUserProfile)
- **Local**: `services/supabaseService.ts` → `getCurrentUserProfile`
- **Causa**: RLS bloqueando leitura ou usuário não existe
- **Solução**: Já implementada - retry após 1 segundo

### 4. Durante Login
- **Local**: `components/LoginOrRegister.tsx` → `handleLogin`
- **Causa**: Usuário não encontrado no banco
- **Solução**: Verificar se o usuário foi criado corretamente

## 🔧 Verificações Necessárias

### 1. Verificar se o Usuário Foi Criado no Supabase

1. Acesse: https://app.supabase.com
2. Vá em **Authentication** → **Users**
3. Verifique se o usuário foi criado
4. Anote o **User ID** (UUID)

### 2. Verificar se o Perfil Foi Criado na Tabela `users`

1. Acesse: https://app.supabase.com
2. Vá em **Table Editor** → **users**
3. Procure pelo **User ID** anotado acima
4. Verifique se o registro existe

### 3. Verificar Políticas RLS

Execute estas migrações se ainda não executou:

1. `supabase/migration_corrigir_rls_recursao.sql`
2. `supabase/migration_corrigir_politica_insert_users.sql`

### 4. Verificar Logs do Console

Abra o console do navegador (F12) e procure por:

- `[authFlowService]` - logs do processo de registro
- `[authService]` - logs ao buscar perfil
- Erros relacionados a `getUserFromSupabase`
- Erros relacionados a `getCurrentUserProfile`

## ✅ Melhorias Implementadas

### 1. Validação no Componente
- Verifica se `result.user` existe antes de usar
- Valida campos obrigatórios (`id`, `nome`)
- Mostra erro claro se o usuário não foi retornado

### 2. Garantia de Retorno no Serviço
- Sempre retorna um usuário válido, mesmo se não conseguir buscar do banco
- Cria usuário básico como fallback se necessário
- Logs detalhados para debug

### 3. Retry em getCurrentUserProfile
- Tenta buscar novamente após 1 segundo se não encontrar
- Logs informativos sobre o processo

## 🧪 Como Testar

1. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
2. **Abra o console do navegador** (F12)
3. **Recarregue a página** (F5)
4. **Tente criar uma conta** com o cupom `TESTE-FREE`
5. **Observe os logs no console**:
   - Deve aparecer: `[authFlowService] Usuário retornado após registro`
   - Não deve aparecer: `Usuário não encontrado`

## 📝 Se o Erro Persistir

### Verificar no Console

Procure por estas mensagens nos logs:

```
[authFlowService] Usuário retornado após registro: [username] ([id])
```

Se não aparecer, o problema está na criação do usuário.

### Verificar no Supabase

1. **Authentication → Users**: Verifica se o usuário foi criado no Auth
2. **Table Editor → users**: Verifica se o perfil foi criado na tabela
3. **SQL Editor**: Execute para verificar:

```sql
-- Verificar se o usuário existe
SELECT id, nome, username, created_at 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Verificar políticas RLS
SELECT * FROM pg_policies 
WHERE tablename = 'users';
```

### Verificar Políticas RLS

Execute este SQL para verificar as políticas:

```sql
-- Verificar se RLS está habilitado
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'users';

-- Verificar políticas de SELECT
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users' AND cmd = 'SELECT';

-- Verificar políticas de INSERT
SELECT policyname, cmd, with_check 
FROM pg_policies 
WHERE tablename = 'users' AND cmd = 'INSERT';
```

## 🔧 Solução Rápida

Se o problema persistir, tente:

1. **Executar todas as migrações SQL**:
   - `migration_corrigir_rls_recursao.sql`
   - `migration_corrigir_politica_insert_users.sql`
   - `migration_criar_funcao_insert_user_profile.sql`

2. **Verificar se a função SQL existe**:
   ```sql
   SELECT proname FROM pg_proc 
   WHERE proname = 'insert_user_profile_after_signup';
   ```

3. **Verificar se as políticas estão corretas**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```

4. **Limpar e recriar** (se necessário):
   - Delete o usuário do Supabase Auth
   - Delete o registro da tabela `users`
   - Tente criar novamente

## 📚 Arquivos Modificados

- `services/supabaseService.ts` - Garantia de retorno de usuário válido
- `components/LoginOrRegister.tsx` - Validação antes de usar result.user
- `DIAGNOSTICO_USUARIO_NAO_ENCONTRADO.md` - Este guia

---

**Próximos passos**: Verifique os logs do console e o Supabase para identificar exatamente onde o erro está ocorrendo.


