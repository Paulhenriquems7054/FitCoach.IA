# 🔧 Troubleshooting - Backend

## Erro 500 ao testar endpoints

### Possíveis Causas e Soluções

#### 1. Variáveis de Ambiente Não Configuradas

**Sintoma:** Erro 500 ao chamar qualquer endpoint

**Solução:**
1. Acesse o painel do Railway: https://railway.com/project/SEU_PROJECT_ID/service/SEU_SERVICE_ID/variables
2. Verifique se todas as variáveis estão configuradas:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `PORT=3000`

3. Após adicionar/atualizar variáveis, faça redeploy:
   ```bash
   railway up
   ```

#### 2. API Key do Gemini Inválida ou Expirada

**Sintoma:** Erro ao chamar `/ai/text` ou outros endpoints de IA

**Solução:**
1. Verifique se a `GEMINI_API_KEY` está correta
2. Teste a API key diretamente:
   ```bash
   curl https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=SUA_API_KEY \
     -H 'Content-Type: application/json' \
     -d '{"contents":[{"parts":[{"text":"teste"}]}]}'
   ```
3. Se necessário, gere uma nova API key em: https://aistudio.google.com/apikey

#### 3. Problema com Conexão ao Supabase

**Sintoma:** Erro ao salvar logs (mas a IA funciona)

**Solução:**
1. Verifique se `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão corretos
2. Teste a conexão:
   ```sql
   -- No SQL Editor do Supabase
   SELECT * FROM ai_usage_logs LIMIT 1;
   ```
3. Verifique se as tabelas existem:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
     AND table_name IN ('ai_usage_logs', 'ai_monthly_usage');
   ```

#### 4. Verificar Logs do Railway

**Para ver os logs em tempo real:**
```bash
cd backend
railway link  # Se ainda não estiver vinculado
railway logs --tail 100
```

**Ou acesse via web:**
1. Acesse: https://railway.com/project/SEU_PROJECT_ID/service/SEU_SERVICE_ID
2. Clique em "Deployments"
3. Clique no deployment mais recente
4. Veja os logs do build e runtime

#### 5. Teste de Health Check

**Teste básico:**
```bash
curl https://backend-production-c4af.up.railway.app
```

Deve retornar: `Hello World!`

**Se não funcionar:**
- Verifique se o serviço está rodando no Railway
- Verifique se a URL está correta
- Verifique os logs do Railway

#### 6. Teste Endpoint de IA com Debug

**PowerShell:**
```powershell
$body = @{
    userId = "test-user"
    gymId = $null
    feature = "chat"
    model = "gemini-1.5-flash"
    prompt = "Olá"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "https://backend-production-c4af.up.railway.app/ai/text" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body
    $response.Content
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Erro: $responseBody"
}
```

## Checklist de Verificação

- [ ] Variáveis de ambiente configuradas no Railway
- [ ] Backend fazendo deploy com sucesso
- [ ] Health check (`GET /`) funcionando
- [ ] API key do Gemini válida
- [ ] Credenciais do Supabase corretas
- [ ] Tabelas criadas no Supabase
- [ ] Logs do Railway não mostram erros críticos

## Contato e Suporte

Se o problema persistir:
1. Verifique os logs completos do Railway
2. Teste cada variável de ambiente individualmente
3. Verifique se todas as dependências estão instaladas corretamente

