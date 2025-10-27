# Fluxo N8N - Nutri.IA

Este documento explica como configurar e usar o fluxo N8N para processar mensagens do aplicativo Nutri.IA.

## 📋 Visão Geral

O fluxo N8N foi projetado para receber e processar três tipos de mensagens:
- **Texto**: Mensagens de texto diretas
- **Imagem**: Imagens de refeições para análise nutricional
- **Áudio**: Gravações de voz para transcrição e análise

## 🔄 Fluxo de Processamento

```
Webhook → Switch (Tipo) → Processamento Específico → Gemini AI → Consolidação → Resposta
```

### Fluxo Detalhado

1. **Webhook** - Recebe todas as mensagens do app Nutri.IA
2. **Switch - Tipo de Mensagem** - Identifica o tipo de mensagem (texto/imagem) e encaminha para o processamento adequado
3. **Processamento**:
   - **Texto**: 
     - Extrai a mensagem e dados do usuário
     - Envia para Gemini AI com contexto nutricional
     - Recebe resposta do Gemini
   - **Imagem**: 
     - Extrai dados da imagem (base64)
     - Envia para Gemini Vision com prompt de análise nutricional
     - Recebe análise detalhada da refeição
4. **Consolidar Resposta** - Combina todas as respostas em formato padronizado
5. **Responder ao App** - Retorna a resposta JSON ao aplicativo

## 🚀 Como Importar no N8N

1. Acesse seu workspace N8N em `https://agentesiaphbb.app.n8n.cloud`
2. Clique em "Importar Workflow"
3. Cole o conteúdo do arquivo `n8n-flow.json`
4. Clique em "Importar"
5. Configure as credenciais necessárias (veja seção abaixo)

## ⚙️ Configuração de Credenciais

### Google Gemini API

1. No nó "Gemini AI - Resposta Texto", clique em "Add Credential"
2. Selecione "Google Gemini API"
3. Cole sua chave de API do Gemini (obtenha em https://makersuite.google.com/app/apikey)
4. Repita para o nó "Gemini Vision - Análise"

**Importante**: Para obter sua chave do Gemini:
- Acesse: https://makersuite.google.com/app/apikey
- Faça login com sua conta Google
- Clique em "Get API Key"
- Copie a chave e cole nas credenciais do N8N

## 📨 Formato de Mensagens

### Mensagem de Texto

```json
{
  "messageType": "text",
  "message": "Quantas calorias tem uma maçã?",
  "userId": "João Silva",
  "timestamp": "2025-10-26T14:00:00.000Z"
}
```

### Mensagem de Imagem

```json
{
  "messageType": "image",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "userId": "João Silva",
  "timestamp": "2025-10-26T14:00:00.000Z"
}
```

### Estrutura de Dados do Usuário (Opcional)

O app também pode enviar informações do usuário para personalização:

```json
{
  "messageType": "text",
  "message": "Preciso de ajuda nutricional",
  "userId": "João Silva",
  "user": {
    "nome": "João Silva",
    "idade": 30,
    "objetivo": "perder peso",
    "peso": 75,
    "altura": 180
  },
  "timestamp": "2025-10-26T14:00:00.000Z"
}
```

## 📤 Formato de Resposta

A resposta do fluxo n8n retorna:

```json
{
  "messageType": "text",
  "processedContent": "Uma maçã média (182g) possui aproximadamente 95 calorias...",
  "userId": "João Silva",
  "timestamp": "2025-10-26T14:00:01.234Z",
  "success": true
}
```

**Observação**: O app Nutri.IA processa esta resposta e exibe no chat do usuário.

## 🔗 Webhook URL

Após importar o fluxo, o webhook estará disponível em:
```
https://agentesiaphbb.app.n8n.cloud/webhook/Nutri.IA
```

## 🧪 Testando o Fluxo

### Testando Diretamente no N8N

1. Abra o fluxo importado
2. Clique no botão "Test workflow" no canto superior direito
3. Será aberta uma janela onde você pode enviar dados de teste
4. Cole um dos exemplos JSON abaixo e clique em "Execute"

### Teste de Texto

```json
{
  "messageType": "text",
  "message": "Olá, como posso melhorar minha alimentação?",
  "userId": "Teste Usuário",
  "timestamp": "2025-10-26T14:00:00.000Z"
}
```

### Teste de Imagem (com imagem base64)

```json
{
  "messageType": "image",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...",
  "userId": "Teste Usuário",
  "timestamp": "2025-10-26T14:00:00.000Z"
}
```

## 🐛 Solução de Problemas

### Erro 401 - Unauthorized
- Verifique se as credenciais de API estão configuradas corretamente

### Erro 400 - Bad Request
- Verifique o formato JSON da mensagem
- Certifique-se de incluir o campo `messageType`

### Webhook não responde
- Verifique se o fluxo está ativo no N8N
- Confirme que o webhook está "Production Ready"

## 📊 Monitoramento

Você pode monitorar as execuções do fluxo na aba "Executions" do N8N. Cada execução mostra:
- Status (sucesso/erro)
- Tempo de execução
- Dados de entrada e saída
- Logs detalhados de cada nó

## 🔐 Segurança

- **Credenciais**: Mantenha suas chaves de API seguras no gerenciador de credenciais do N8N
- **Webhook**: O webhook está protegido pela autenticação do N8N Cloud
- **Rate Limiting**: Considere adicionar rate limiting se o app tiver muitos usuários
- **Validação**: O fluxo valida automaticamente o formato das mensagens

## 📝 Notas Importantes

- **Modelos de IA**: 
  - Gemini 2.5 Flash é gratuito com limites de uso
  - Latência pode variar entre 1-5 segundos
  - Imagens grandes podem demorar mais (10-30 segundos)
  
- **Limites**:
  - Máximo de mensagens de texto: ~1500 tokens por requisição
  - Imagens: máximo 20MB (recomendado <5MB)
  - Formato de imagem: JPEG, PNG
  
- **Custos**:
  - Gemini API é gratuita dentro dos limites
  - Monitore seu uso em: https://makersuite.google.com/

## 🔗 Integração com o App

O app Nutri.IA está configurado para usar este fluxo através da variável de ambiente:
```
VITE_N8N_WEBHOOK_URL=https://agentesiaphbb.app.n8n.cloud/webhook/Nutri.IA
```

Configure esta URL no arquivo `.env` do projeto.
