# Checklist de Teste - Cadastro de Usuário

## ✅ Configuração Completa

- [x] Migração 1 executada: Política RLS criada
- [x] Migração 2 executada: Função RPC criada
- [x] Código atualizado: Login automático após signup

## 🧪 Teste de Cadastro

### Passo 1: Acessar Página de Login
- [ ] Acessar aplicação (local ou Vercel)
- [ ] Fazer logout (se estiver logado)
- [ ] Navegar para página de login

### Passo 2: Iniciar Cadastro
- [ ] Clicar em "Não tem código? Testar Grátis por 3 dias"
- [ ] Preencher formulário:
  - [ ] Nome completo
  - [ ] Username (ou deixar gerar automaticamente)
  - [ ] Senha
- [ ] Clicar em "Criar Conta"

### Passo 3: Verificar Console (F12)
- [ ] Ver mensagem: "Fazendo login após signup para garantir sessão ativa"
- [ ] Ver mensagem: "Login após signup bem-sucedido, sessão ativa"
- [ ] Ver mensagem: "Sessão ativa confirmada para usuário: [UUID]"
- [ ] Ver mensagem: "Usuário criado com sucesso na tabela users"

### Passo 4: Verificar no Supabase
- [ ] Acessar Supabase Dashboard → Table Editor → tabela `users`
- [ ] Confirmar que novo usuário aparece na lista
- [ ] Verificar que campos estão preenchidos corretamente

### Passo 5: Testar Login
- [ ] Tentar fazer login com as credenciais criadas
- [ ] Confirmar que login funciona sem erro
- [ ] Verificar que usuário é redirecionado para a aplicação

## ❌ Se Houver Problemas

### Erro: "Credenciais inválidas" após cadastro
- Verificar se usuário aparece na tabela `users` do Supabase
- Verificar logs no console para mensagens de erro
- Verificar se política RLS está ativa: `SELECT * FROM pg_policies WHERE tablename = 'users' AND cmd = 'INSERT';`

### Erro: "new row violates row-level security policy"
- Verificar se política existe: `SELECT policyname FROM pg_policies WHERE tablename = 'users' AND cmd = 'INSERT';`
- Verificar se função RPC existe: `SELECT proname FROM pg_proc WHERE proname = 'insert_user_profile_after_signup';`
- Verificar se RLS está habilitado: `SELECT relrowsecurity FROM pg_class WHERE relname = 'users';`

### Usuário não aparece na tabela `users`
- Verificar logs no console
- Verificar se função RPC foi chamada (deve aparecer no log)
- Tentar criar usuário manualmente via SQL para testar

## 📝 Notas

- As migrações SQL foram executadas com sucesso
- Política RLS: "Users can insert own profile" está ativa
- Função RPC: `insert_user_profile_after_signup` está criada
- Código: Login automático após signup está implementado

