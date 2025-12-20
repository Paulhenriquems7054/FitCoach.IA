# WebSocket para Live Audio - Arquitetura

## 🎯 Objetivo

Migrar `startLiveAudioSession` do frontend para usar um proxy WebSocket no backend, removendo completamente a exposição da API key Gemini no cliente.

## 📋 Status Atual

- ✅ Chat de texto migrado para `/ai/text`
- ✅ Grounded (web search) migrado para `/ai/grounded`
- ✅ Maps migrado para `/ai/maps`
- ✅ TTS migrado para `/ai/tts`
- ⏳ **Live Audio ainda usa SDK direto no frontend** (precisa migrar)

## 🏗️ Arquitetura Proposta

### Frontend → Backend (WebSocket)

```
Frontend (Browser)
    │
    │ WebSocket: ws://backend/ai/live
    │
    ├─ Envia: { type: 'audio_chunk', data: 'base64...' }
    ├─ Recebe: { type: 'model_audio', data: 'base64...' }
    ├─ Recebe: { type: 'transcription', user: '...', model: '...' }
    └─ Recebe: { type: 'tool_call', name: 'searchWeb', query: '...' }
    │
Backend (NestJS + WebSocket Gateway)
    │
    ├─ Conecta com Gemini Live API (server-side)
    ├─ Proxy de áudio bidirecional
    ├─ Valida limites de voz
    ├─ Log de uso em ai_usage_logs
    └─ Encerra sessão quando limite atingido
```

## 📦 Dependências Necessárias

No `backend/package.json`:

```json
{
  "dependencies": {
    "@nestjs/websockets": "^11.0.0",
    "@nestjs/platform-socket.io": "^11.0.0",
    "socket.io": "^4.7.0",
    "@google/genai": "^1.0.0"
  }
}
```

## 🔌 Estrutura do WebSocket Gateway

### Backend: `backend/src/ai/ai-live.gateway.ts`

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GoogleGenAI, LiveSession } from '@google/genai';

@WebSocketGateway({ 
  path: '/ai/live',
  cors: { origin: '*' } // Ajustar CORS em produção
})
export class AiLiveGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private sessions = new Map<string, LiveSession>(); // socketId -> LiveSession

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const session = this.sessions.get(client.id);
    if (session) {
      session.close();
      this.sessions.delete(client.id);
    }
  }

  @SubscribeMessage('init')
  async handleInit(
    client: Socket,
    payload: {
      userId: string;
      gymId?: string | null;
      voiceName?: string;
      systemInstruction?: string;
      useWebSearch?: boolean;
      useMapsSearch?: boolean;
    },
  ) {
    // 1. Validar limites de voz (chamar usageLimitService)
    // 2. Criar sessão Gemini Live
    // 3. Configurar callbacks (onmessage, onerror, etc)
    // 4. Armazenar sessão em this.sessions
  }

  @SubscribeMessage('audio_chunk')
  async handleAudioChunk(
    client: Socket,
    payload: { data: string }, // base64 PCM
  ) {
    const session = this.sessions.get(client.id);
    if (!session) {
      client.emit('error', { message: 'Session not initialized' });
      return;
    }

    // Converter base64 para Blob e enviar para Gemini
    const blob = this.base64ToBlob(payload.data);
    await session.sendRealtimeInput({ media: blob });
  }

  @SubscribeMessage('stop')
  async handleStop(client: Socket) {
    const session = this.sessions.get(client.id);
    if (session) {
      session.close();
      this.sessions.delete(client.id);
      client.emit('stopped');
    }
  }
}
```

## 📤 Formato de Mensagens

### Cliente → Servidor

```typescript
// Inicializar sessão
socket.emit('init', {
  userId: 'uuid',
  gymId: 'string|null',
  voiceName: 'Zephyr',
  systemInstruction: '...',
  useWebSearch: true,
  useMapsSearch: false,
});

// Enviar chunk de áudio
socket.emit('audio_chunk', {
  data: 'base64_encoded_pcm_audio',
});

// Parar sessão
socket.emit('stop');
```

### Servidor → Cliente

```typescript
// Áudio do modelo
socket.on('model_audio', (data: { audioBase64: string }) => {
  // Tocar áudio no navegador
});

// Transcrição do usuário
socket.on('user_transcription', (data: { text: string }) => {
  // Mostrar transcrição em tempo real
});

// Transcrição do modelo
socket.on('model_transcription', (data: { text: string }) => {
  // Mostrar resposta em texto
});

// Tool call iniciado
socket.on('tool_call_start', (data: { name: string; query: string }) => {
  // Mostrar "Buscando na web..."
});

// Tool call completo
socket.on('tool_call_result', (data: { name: string; results: any }) => {
  // Mostrar resultados (webResults, mapsResults)
});

// Turn completo
socket.on('turn_complete', (data: { webResults?: [], mapsResults?: [] }) => {
  // Finalizar turn, mostrar resultados
});

// Erro
socket.on('error', (data: { message: string }) => {
  // Mostrar erro ao usuário
});

// Limite atingido
socket.on('limit_reached', () => {
  // Encerrar sessão, mostrar mensagem
});
```

## 🔄 Fluxo Completo

### 1. Inicialização

```
Frontend: socket.connect() → ws://backend/ai/live
Frontend: socket.emit('init', { userId, gymId, ... })
Backend: Valida limites → Cria sessão Gemini → Configura callbacks
Backend: socket.emit('ready') → Frontend inicia captura de áudio
```

### 2. Envio de Áudio

```
Frontend: Captura PCM (16kHz) → Converte para base64
Frontend: socket.emit('audio_chunk', { data: base64 })
Backend: Converte base64 → Blob → session.sendRealtimeInput()
Gemini: Processa áudio → Envia resposta
Backend: Gemini callback → socket.emit('model_audio', ...)
Frontend: Recebe áudio → Toca no navegador
```

### 3. Tool Calls (Web Search / Maps)

```
Gemini: Decide chamar searchWeb()
Backend: socket.emit('tool_call_start', { name: 'searchWeb', query: '...' })
Frontend: Mostra "Buscando na web..."

Backend: Chama /ai/grounded internamente (ou reutiliza lógica)
Backend: socket.emit('tool_call_result', { name: 'searchWeb', results: {...} })
Frontend: Mostra resultados

Backend: Envia resposta do tool para Gemini via session.sendToolResponse()
Gemini: Continua gerando resposta com os resultados
```

### 4. Monitoramento de Limites

```
Backend: setInterval() a cada 1 segundo
Backend: Verifica tempo decorrido
Backend: Chama usageLimitService.consumeVoiceSeconds()
Backend: Se limite atingido → session.close() → socket.emit('limit_reached')
Frontend: Para captura → Mostra mensagem → Fecha conexão
```

## ⚠️ Considerações Importantes

### 1. Conversão de Áudio

O frontend captura PCM a 16kHz, mas precisa converter para o formato que o Gemini espera:

```typescript
// Frontend já tem createBlob() que faz isso
// Backend precisa fazer o inverso ou aceitar o formato pronto
```

### 2. Buffer e Latência

- Buffer pequeno = menor latência, mas mais mensagens
- Buffer grande = maior latência, menos mensagens
- Recomendado: 4096 samples ≈ 256ms a 16kHz

### 3. Reconexão Automática

Implementar retry logic no frontend caso a conexão caia:

```typescript
socket.on('disconnect', () => {
  // Tentar reconectar após 1 segundo
  setTimeout(() => socket.connect(), 1000);
});
```

### 4. Limpeza de Recursos

- Sempre fechar `LiveSession` quando desconectar
- Limpar intervalos de monitoramento
- Liberar streams de áudio no frontend

## 🚀 Próximos Passos

1. **Instalar dependências WebSocket no backend**
   ```bash
   cd backend
   npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
   ```

2. **Criar `AiLiveGateway`** (esqueleto acima)

3. **Migrar lógica de tool calls** para o backend

4. **Atualizar frontend** para usar WebSocket em vez de SDK direto

5. **Testar em ambiente local**

6. **Deploy e validação em produção**

## 📚 Referências

- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)
- [Socket.IO](https://socket.io/docs/v4/)
- [Gemini Live API Docs](https://ai.google.dev/gemini-api/docs/live)

---

**Nota:** Esta é uma implementação complexa que requer testes extensivos. Recomenda-se fazer em etapas:
1. Primeiro: WebSocket básico (sem tool calls)
2. Depois: Tool calls (web search, maps)
3. Por último: Monitoramento de limites e reconexão

