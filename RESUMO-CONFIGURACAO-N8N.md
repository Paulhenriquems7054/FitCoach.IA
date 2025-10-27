# 📋 Resumo da Configuração N8N - Nutri.IA

## ✅ O que foi configurado

### 1. Fluxo N8N (`n8n-flow.json`)
- ✅ Webhook para receber mensagens do app Nutri.IA
- ✅ Switch para identificar tipo de mensagem (texto/imagem)
- ✅ Processamento de mensagens de texto com Gemini AI
- ✅ Processamento de imagens com Gemini Vision
- ✅ Consolidação de respostas em formato padronizado
- ✅ Retorno de resposta JSON para o app

### 2. Documentação (`N8N-FLOW-README.md`)
- ✅ Instruções completas de importação
- ✅ Configuração de credenciais (Gemini API)
- ✅ Exemplos de mensagens e respostas
- ✅ Guia de teste e monitoramento
- ✅ Solução de problemas
- ✅ Notas sobre limites e custos

## 🔄 Como o Fluxo Funciona

```
App Nutri.IA
    ↓ (POST com JSON)
Webhook N8N
    ↓ (verifica messageType)
Switch - Tipo de Mensagem
    ↓
    ├─→ Texto → Gemini AI → Resposta
    └─→ Imagem → Gemini Vision → Análise Nutricional
                    ↓
            Consolidar Resposta
                    ↓
            Responder ao App
```

## 🚀 Próximos Passos

### 1. Importar o Fluxo no N8N
```bash
# Acesse: https://agentesiaphbb.app.n8n.cloud
# Importe o arquivo n8n-flow.json
```

### 2. Configurar Credenciais
- Obter chave Gemini API: https://makersuite.google.com/app/apikey
- Adicionar credenciais nos nós Gemini
- Testar o fluxo com dados de exemplo

### 3. Configurar o App
O app já está configurado para usar o webhook através da variável:
```env
VITE_N8N_WEBHOOK_URL=https://agentesiaphbb.app.n8n.cloud/webhook/Nutri.IA
```

Certifique-se de que esta URL está no arquivo `.env`

## 📝 Estrutura de Mensagens

### Enviado pelo App
```json
{
  "messageType": "text",
  "message": "Quantas calorias tem uma maçã?",
  "userId": "João Silva",
  "timestamp": "2025-10-26T14:00:00.000Z"
}
```

### Retornado pelo N8N
```json
{
  "messageType": "text",
  "processedContent": "Uma maçã média possui aproximadamente 95 calorias...",
  "userId": "João Silva",
  "timestamp": "2025-10-26T14:00:01.234Z",
  "success": true
}
```

## 🔧 Melhorias Futuras (Opcional)

1. **Memória de Conversação**: Adicionar nó de memória para contexto
2. **Análise de Áudio**: Implementar transcrição de voz com Whisper
3. **Cache de Respostas**: Cachear respostas similares para economia
4. **Rate Limiting**: Limitar requisições por usuário
5. **Logs Personalizados**: Armazenar conversas para análise
6. **Múltiplos Idiomas**: Suporte para pt/en/es baseado em preferência

## ⚠️ Observações Importantes

1. **Modelos Gemini**:
   - Texto: `gemini-2.5-flash`
   - Imagens: `gemini-2.5-flash-vision`
   - Ambos são gratuitos com limites

2. **Limites de Uso**:
   - 15 RPM (requisições por minuto)
   - 1500 RPM (requisições por dia)
   - 1M tokens por minuto

3. **Latência Esperada**:
   - Texto: 1-3 segundos
   - Imagens: 5-30 segundos (dependendo do tamanho)

4. **Formato de Imagens**:
   - Aceita: JPEG, PNG
   - Tamanho máximo: 20MB
   - Recomendado: <5MB para melhor performance

## 📚 Arquivos Modificados

- ✅ `n8n-flow.json` - Fluxo N8N configurado
- ✅ `N8N-FLOW-README.md` - Documentação atualizada
- ✅ `RESUMO-CONFIGURACAO-N8N.md` - Este arquivo

## 🎯 Status da Integração

- ✅ Fluxo N8N criado e configurado
- ✅ Documentação completa
- ⏳ Aguardando importação no N8N
- ⏳ Aguardando configuração de credenciais
- ⏳ Aguardando teste de integração

---

**Criado em**: 26 de Janeiro de 2025  
**Versão**: 1.0  
**Status**: Pronto para uso

