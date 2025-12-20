# 🤖 Configuração de Modelos Gemini

## Visão Geral

O backend permite configurar qual modelo do Gemini será usado por padrão através de variáveis de ambiente. Isso oferece flexibilidade para escolher o modelo que melhor se adequa às suas necessidades.

## Variáveis de Ambiente

### `GEMINI_DEFAULT_MODEL` (Opcional)

Define o modelo padrão do Gemini a ser usado quando nenhum modelo específico é fornecido na requisição.

**Valor padrão:** `gemini-1.5-flash` (se não configurado)

**Exemplos de valores válidos:**
- `gemini-1.5-flash` - Modelo rápido e econômico (recomendado para maioria dos casos)
- `gemini-1.5-pro` - Modelo mais poderoso, melhor para tarefas complexas
- `gemini-2.0-flash-exp` - Versão experimental mais recente

## Como Configurar

### No Railway

1. Acesse o painel do Railway: https://railway.com/project/SEU_PROJECT_ID/service/SEU_SERVICE_ID/variables

2. Adicione a variável:
   ```
   GEMINI_DEFAULT_MODEL=gemini-1.5-flash
   ```

3. Ou via CLI:
   ```bash
   railway variables --set "GEMINI_DEFAULT_MODEL=gemini-1.5-flash"
   ```

4. Faça redeploy:
   ```bash
   railway up
   ```

### Localmente (Desenvolvimento)

No arquivo `backend/.env`:
```env
GEMINI_DEFAULT_MODEL=gemini-1.5-flash
```

## Modelos Disponíveis

### Modelos Recomendados para Produção

| Modelo | Descrição | Uso Recomendado |
|--------|-----------|-----------------|
| `gemini-1.5-flash` | Rápido e econômico | Chat geral, respostas rápidas |
| `gemini-1.5-pro` | Mais poderoso | Análises complexas, raciocínio avançado |
| `gemini-2.0-flash-exp` | Versão experimental | Testes de novas funcionalidades |

### Como Descobrir Modelos Disponíveis

Você pode listar os modelos disponíveis usando a API do Gemini:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=SUA_API_KEY"
```

## Sobrescrever Modelo por Requisição

Mesmo com `GEMINI_DEFAULT_MODEL` configurado, você pode especificar um modelo diferente em cada requisição:

```json
{
  "userId": "user-123",
  "feature": "chat",
  "model": "gemini-1.5-pro-002",  // Sobrescreve o padrão
  "prompt": "Análise complexa aqui..."
}
```

## Prioridade de Modelo

A ordem de prioridade é:

1. **Modelo especificado na requisição** (`model` no body)
2. **Variável de ambiente** (`GEMINI_DEFAULT_MODEL`)
3. **Fallback padrão** (`gemini-1.5-flash`)

## Mapeamento de Modelos

O backend faz um mapeamento automático de nomes simplificados para versões completas:

- `gemini-1.5-flash` → `gemini-1.5-flash` (sem alteração)
- `gemini-1.5-pro` → `gemini-1.5-pro` (sem alteração)
- `gemini-2.5-pro` → `gemini-2.0-flash-exp`

Se você usar o nome completo (ex: `gemini-1.5-flash-002`), ele será usado diretamente.

## Custos por Modelo

⚠️ **Importante:** Diferentes modelos têm custos diferentes. Verifique a tabela de preços atualizada em: https://ai.google.dev/pricing

- **Flash**: Mais barato, ideal para uso geral
- **Pro**: Mais caro, mas mais poderoso
- **Experimental**: Preços podem variar

## Troubleshooting

### Erro: "model is not found"

Se você receber este erro, significa que o modelo especificado não existe ou não está disponível na sua região/API key.

**Solução:**
1. Verifique se o nome do modelo está correto
2. Teste com `gemini-1.5-flash` (modelo mais estável)
3. Verifique se sua API key tem acesso ao modelo desejado

### Como Verificar Modelo Atual

Para ver qual modelo está sendo usado, verifique os logs do backend:

```bash
railway logs --tail 50
```

Ou verifique os logs no Supabase:
```sql
SELECT model, COUNT(*) as total
FROM ai_usage_logs
GROUP BY model
ORDER BY total DESC;
```

## Exemplos de Configuração

### Configuração para Desenvolvimento (Rápido e Barato)
```env
GEMINI_DEFAULT_MODEL=gemini-1.5-flash
```

### Configuração para Produção (Balanceado)
```env
GEMINI_DEFAULT_MODEL=gemini-1.5-flash
```

### Configuração para Análises Complexas
```env
GEMINI_DEFAULT_MODEL=gemini-1.5-pro
```

### Configuração para Testes Experimentais
```env
GEMINI_DEFAULT_MODEL=gemini-2.0-flash-exp
```

