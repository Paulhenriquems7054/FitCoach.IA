# ✅ Checklist de Verificação - Sistema de Cadastro

## Status Atual

### ✅ Função RPC
- [x] Função `insert_user_profile_after_signup` existe
- [x] Função tem `SECURITY DEFINER`
- [x] Função tem verificação de `auth.users`
- [x] Função tem variável `auth_user_exists`

### ✅ Permissões
- [ ] **VERIFICAR:** `GRANT EXECUTE` para `authenticated`
- [ ] **VERIFICAR:** `GRANT EXECUTE` para `anon`

**Execute este comando para verificar:**
```sql
SELECT 
    grantee, 
    privilege_type
FROM information_schema.routine_privileges 
WHERE routine_schema = 'public' 
AND routine_name = 'insert_user_profile_after_signup';
```

**Resultado Esperado:**
- `grantee`: `authenticated` com `privilege_type`: `EXECUTE`
- `grantee`: `anon` com `privilege_type`: `EXECUTE`

### ✅ Política RLS
- [x] Política "Users can insert own profile" existe
- [x] Comando: INSERT
- [x] Condição: `(auth.uid() = id)`

## Próximos Passos

1. ✅ Verificar função RPC → **CONCLUÍDO**
2. ✅ Verificar política RLS → **CONCLUÍDO**
3. ⏳ **VERIFICAR PERMISSÕES (GRANT EXECUTE)** → Execute o SQL acima
4. ⏳ Testar cadastro no app
5. ⏳ Verificar logs do console

## Se Permissões Estiverem Faltando

Execute apenas esta parte da migração no SQL Editor:

```sql
GRANT EXECUTE ON FUNCTION public.insert_user_profile_after_signup(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, 
    TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, 
    TEXT, TIMESTAMP WITH TIME ZONE, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, 
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.insert_user_profile_after_signup(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, 
    TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, 
    TEXT, TIMESTAMP WITH TIME ZONE, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, 
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO anon;
```

## Teste Final

Após verificar as permissões, teste o cadastro:
1. Abra o app no navegador
2. Vá para a página de cadastro
3. Preencha os dados
4. Clique em "Criar Conta"
5. Verifique o console (F12) para logs
6. Confirme se o perfil foi criado na tabela `users`

