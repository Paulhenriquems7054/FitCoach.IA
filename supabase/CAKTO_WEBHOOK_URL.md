# URL do Webhook para Cakto

## URL Principal (Recomendada)

```
https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook
```

## Alternativas (se a primeira não funcionar)

### Opção 1: Com parâmetro de token
```
https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook?token=cakto-secret-2024-xyz123
```

### Opção 2: URL simplificada (se o Cakto aceitar)
```
https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook
```

### Opção 3: Com HTTPS explícito
```
https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook?source=cakto
```

## Configuração no Cakto

1. **URL**: Use uma das URLs acima
2. **Método**: `POST`
3. **Headers**: 
   - `Authorization: Bearer cakto-secret-2024-xyz123`
   - `Content-Type: application/json`

## Verificar se a URL está acessível

Você pode testar a URL manualmente usando curl ou Postman para verificar se está respondendo.

