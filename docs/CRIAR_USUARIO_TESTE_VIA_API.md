# 🚀 Criar Usuário de Teste - Guia Completo

## ⚠️ Problema

A tabela `public.users` referencia `auth.users`. Você precisa criar o usuário em `auth.users` primeiro!

---

## 📋 Opção 1: Via Dashboard (Mais Fácil)

### Passo a Passo Visual

1. **Acesse o Dashboard do Supabase:**
   - URL: https://app.supabase.com
   - Selecione seu projeto

2. **Navegue até Authentication:**
   - Menu lateral → **Authentication**
   - Clique em **Users**

3. **Adicione um novo usuário:**
   - Clique no botão **"Add user"** (canto superior direito)
   - Ou clique em **"Invite user"** e depois **"Add user"**

4. **Preencha os dados:**
   ```
   Email: teste@exemplo.com
   Senha: teste123456
   ✅ Auto Confirm User (IMPORTANTE: marcar esta opção!)
   ```

5. **Crie o usuário:**
   - Clique em **"Create user"**
   - Aguarde a confirmação

6. **Execute a query SQL:**
   - Vá para **SQL Editor**
   - Execute `docs/CRIAR_USUARIO_TESTE.sql`

---

## 📋 Opção 2: Via API (Automático)

### Usando PowerShell

1. **Obtenha suas credenciais:**
   - Supabase URL: https://dbugchiwqwnrnnnsszel.supabase.co
   - Service Role Key: Dashboard → Settings → API → service_role key

2. **Execute este script no PowerShell:**

```powershell
# Configuração
$SupabaseUrl = "https://dbugchiwqwnrnnnsszel.supabase.co"
$ServiceRoleKey = "COLE_SUA_SERVICE_ROLE_KEY_AQUI"
$Email = "teste@exemplo.com"
$Password = "teste123456"

# Criar usuário via API
$Body = @{
    email = $Email
    password = $Password
    email_confirm = $true
    user_metadata = @{
        nome = "Usuário Teste"
    }
} | ConvertTo-Json

try {
    $Response = Invoke-RestMethod `
        -Uri "$SupabaseUrl/auth/v1/admin/users" `
        -Method POST `
        -Headers @{
            "apikey" = $ServiceRoleKey
            "Authorization" = "Bearer $ServiceRoleKey"
            "Content-Type" = "application/json"
        } `
        -Body $Body
    
    Write-Host "✅ Usuário criado com sucesso!" -ForegroundColor Green
    Write-Host "ID: $($Response.id)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Agora execute a query SQL: docs/CRIAR_USUARIO_TESTE.sql" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Erro ao criar usuário: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $Reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $ResponseBody = $Reader.ReadToEnd()
        Write-Host "Detalhes: $ResponseBody" -ForegroundColor Yellow
    }
}
```

3. **Depois execute a query SQL:**
   - Vá para SQL Editor
   - Execute `docs/CRIAR_USUARIO_TESTE.sql`

---

## ✅ Verificar se Funcionou

Execute esta query no SQL Editor:

```sql
SELECT 
    id,
    nome,
    email,
    username,
    role,
    plan_type,
    subscription_status,
    created_at
FROM public.users 
WHERE email = 'teste@exemplo.com';
```

Se retornar uma linha, está tudo certo! ✅

---

## 🔍 Troubleshooting

### Erro: "Usuário não encontrado em auth.users"
- ✅ Solução: Crie o usuário primeiro (Opção 1 ou 2 acima)

### Erro: "duplicate key value violates unique constraint"
- ✅ Solução: O usuário já existe. Pule a criação e execute apenas a query SQL.

### Erro: "Foreign key constraint"
- ✅ Solução: Certifique-se de que o usuário existe em `auth.users` antes de criar em `public.users`

---

**Pronto!** Escolha uma opção e siga os passos. 🚀

