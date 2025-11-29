# Solução: "Nome de usuário ou senha incorretos"

## 🔴 Problema

Ao tentar fazer login, aparece o erro:
```
Nome de usuário ou senha incorretos
```

## 🔍 Causa

O problema ocorre porque existem **dois fluxos de autenticação** no sistema:

1. **Fluxo Antigo (Local)**: Usuários criados no IndexedDB (banco local)
   - Login usando `username` e `password`
   - Armazenado localmente no navegador

2. **Fluxo Novo (Supabase)**: Usuários criados no Supabase Auth (com código de convite)
   - Login usando **EMAIL** e `password`
   - Armazenado no Supabase

O `LoginPage.tsx` estava tentando apenas o login local, mas se o usuário foi criado no Supabase, ele não encontrava o usuário.

## ✅ Solução Implementada

O código foi atualizado para suportar **ambos os fluxos**:

1. **Tenta login no Supabase primeiro**:
   - Se username parece email (`@`), usa diretamente
   - Se não, tenta `username@fitcoach.ia`
   - Tenta múltiplas variações de email

2. **Se falhar, tenta login local**:
   - Busca no IndexedDB usando username e senha
   - Para compatibilidade com usuários antigos

3. **Mensagens de erro melhoradas**:
   - Dicas específicas baseadas no tipo de login tentado
   - Indica se deve usar email ou username

## 📝 Como Fazer Login Corretamente

### Se você criou a conta com código de convite (Supabase):

**Use o EMAIL** (não o username):

- ✅ **Correto**: `seuemail@exemplo.com`
- ✅ **Se não forneceu email**: `seuusuario@fitcoach.ia`
- ❌ **Incorreto**: `seuusuario` (sem @)

### Se você criou a conta localmente (sem código):

**Use o USERNAME**:

- ✅ **Correto**: `seuusuario`
- ❌ **Incorreto**: `seuusuario@fitcoach.ia`

## 🔧 Verificações

### 1. Verificar Email Usado no Cadastro

Execute este SQL no Supabase:

```sql
-- Ver usuários recentes e seus emails no Auth
SELECT 
    id,
    email,
    created_at,
    confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
```

### 2. Verificar Perfil na Tabela users

```sql
-- Ver perfis criados
SELECT 
    id,
    nome,
    username,
    email,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;
```

### 3. Verificar se Usuário Existe Localmente

No console do navegador (F12), execute:

```javascript
// Verificar usuários no IndexedDB
const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('FitCoachDB', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
});

const transaction = db.transaction(['users'], 'readonly');
const store = transaction.objectStore('users');
const request = store.getAll();
request.onsuccess = () => {
    console.log('Usuários locais:', request.result.map(u => ({ username: u.username, nome: u.nome })));
};
```

## 🧪 Teste

1. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
2. **Recarregue a página** (F5)
3. **Tente fazer login**:
   - Se criou com código de convite: use o **EMAIL**
   - Se criou localmente: use o **USERNAME**
4. **Verifique o console** para ver qual método de login foi usado

## ⚠️ Importante

- **Use EMAIL para contas criadas com código de convite**
- **Use USERNAME para contas criadas localmente**
- **Se não forneceu email no cadastro**, use `seuusuario@fitcoach.ia`
- **Verifique a senha** - ela deve ser a mesma usada no cadastro

## 📚 Arquivos Modificados

- `pages/LoginPage.tsx` - Suporte para login Supabase e local
- `SOLUCAO_LOGIN_CREDENCIAIS_INCORRETAS.md` - Este guia

---

**Solução**: O sistema agora tenta login no Supabase primeiro (usando email) e, se falhar, tenta login local (usando username). Use o **EMAIL** se você criou a conta com código de convite, ou o **USERNAME** se criou localmente.

