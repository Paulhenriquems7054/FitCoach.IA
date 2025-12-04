# ============================================
# CRIAR USUÁRIO DE TESTE VIA API SUPABASE
# Execute este script no PowerShell
# ============================================

# CONFIGURAÇÃO - PREENCHA AQUI
$SupabaseUrl = "https://dbugchiwqwnrnnnsszel.supabase.co"
$ServiceRoleKey = "COLE_SUA_SERVICE_ROLE_KEY_AQUI"
$Email = "teste@exemplo.com"
$Password = "teste123456"

# Verificar se a Service Role Key foi preenchida
if ($ServiceRoleKey -eq "COLE_SUA_SERVICE_ROLE_KEY_AQUI") {
    Write-Host ""
    Write-Host "❌ ERRO: Preencha a Service Role Key!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Como obter:" -ForegroundColor Yellow
    Write-Host "  1. Acesse: Supabase Dashboard → Settings → API" -ForegroundColor White
    Write-Host "  2. Copie a 'service_role' key (NÃO a 'anon' key!)" -ForegroundColor White
    Write-Host "  3. Cole no script acima" -ForegroundColor White
    Write-Host ""
    exit
}

Write-Host ""
Write-Host "=== Criando Usuário de Teste ===" -ForegroundColor Cyan
Write-Host "Email: $Email" -ForegroundColor Gray
Write-Host ""

# Preparar corpo da requisição
$Body = @{
    email = $Email
    password = $Password
    email_confirm = $true
    user_metadata = @{
        nome = "Usuário Teste"
    }
} | ConvertTo-Json

try {
    Write-Host "Enviando requisição..." -ForegroundColor Yellow
    
    $Response = Invoke-RestMethod `
        -Uri "$SupabaseUrl/auth/v1/admin/users" `
        -Method POST `
        -Headers @{
            "apikey" = $ServiceRoleKey
            "Authorization" = "Bearer $ServiceRoleKey"
            "Content-Type" = "application/json"
        } `
        -Body $Body
    
    Write-Host ""
    Write-Host "✅ Usuário criado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "ID do usuário: $($Response.id)" -ForegroundColor Cyan
    Write-Host "Email: $($Response.email)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Próximo passo:" -ForegroundColor Yellow
    Write-Host "  1. Acesse: Supabase Dashboard → SQL Editor" -ForegroundColor White
    Write-Host "  2. Execute a query: docs/CRIAR_USUARIO_TESTE.sql" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Erro ao criar usuário: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $Reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $ResponseBody = $Reader.ReadToEnd()
        Write-Host "Detalhes do erro:" -ForegroundColor Yellow
        Write-Host $ResponseBody -ForegroundColor Red
        Write-Host ""
    }
    
    # Verificar se o usuário já existe
    try {
        Write-Host "Verificando se o usuário já existe..." -ForegroundColor Yellow
        $CheckResponse = Invoke-RestMethod `
            -Uri "$SupabaseUrl/auth/v1/admin/users?email=$Email" `
            -Method GET `
            -Headers @{
                "apikey" = $ServiceRoleKey
                "Authorization" = "Bearer $ServiceRoleKey"
            }
        
        if ($CheckResponse.users.Count -gt 0) {
            Write-Host ""
            Write-Host "✅ O usuário já existe!" -ForegroundColor Green
            Write-Host "ID: $($CheckResponse.users[0].id)" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Próximo passo: Execute a query SQL: docs/CRIAR_USUARIO_TESTE.sql" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Não foi possível verificar se o usuário existe." -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "Verifique:" -ForegroundColor Yellow
    Write-Host "  1. Se a Service Role Key está correta" -ForegroundColor White
    Write-Host "  2. Se o email já está em uso" -ForegroundColor White
    Write-Host "  3. Se a URL do Supabase está correta" -ForegroundColor White
    Write-Host ""
}

