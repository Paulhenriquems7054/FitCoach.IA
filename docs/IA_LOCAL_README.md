# 🤖 IA Local Offline - Guia de Integração

Este documento descreve a integração da IA Local Offline usando Ollama no Nutri.IA.

## 📋 Visão Geral

A IA Local foi integrada de forma **não invasiva** ao app existente, adicionando uma camada de fallback inteligente que:

1. **Prioriza IA Local** (Ollama) quando disponível
2. **Faz fallback automático** para API externa (Gemini) se necessário
3. **Mantém compatibilidade** total com o código existente

## 🏗️ Arquitetura

### Módulos Criados

```
services/
├── localAIService.ts      # Serviço de comunicação com Ollama
├── iaController.ts         # Controlador com fallback automático
└── geminiService.ts        # Modificado para usar IAController

local-server/
├── install_model.ps1       # Script de instalação (Windows)
├── install_model.sh        # Script de instalação (Linux/macOS)
├── start_local_ia.ps1     # Script de inicialização (Windows)
├── start_local_ia.sh      # Script de inicialização (Linux/macOS)
└── README.md               # Documentação dos scripts

pages/
└── SettingsPage.tsx        # Adicionada seção de IA Local
```

### Fluxo de Decisão

```
Usuário solicita IA
    ↓
IAController verifica preferência
    ↓
┌─────────────────────────────┐
│ IA Local habilitada?        │
└─────────────────────────────┘
    ↓ SIM                    ↓ NÃO
┌──────────────┐      ┌──────────────┐
│ Tentar Local │      │ Usar API Ext │
└──────────────┘      └──────────────┘
    ↓
┌──────────────┐
│ Sucesso?    │
└──────────────┘
    ↓ SIM                    ↓ NÃO
┌──────────────┐      ┌──────────────┐
│ Retornar     │      │ Fallback API │
└──────────────┘      └──────────────┘
```

## 🔧 Integração nos Serviços

### 1. `geminiService.ts`

**Modificação mínima** na função `generateMealPlan`:

```typescript
// ANTES: Chamava API diretamente
const response = await ai.models.generateContent({...});

// DEPOIS: Usa IAController com fallback
const localResponse = await generateJSONResponse<GeminiMealPlanResponse>(
    prompt,
    systemPrompt,
    async () => {
        // Fallback para API externa
        return await ai.models.generateContent({...});
    }
);
```

**O que foi mantido:**
- ✅ Toda a lógica existente
- ✅ Tratamento de erros
- ✅ Fallback offline
- ✅ Compatibilidade total

### 2. `assistantService.ts`

**Não modificado** - pode ser integrado no futuro se necessário.

### 3. `SettingsPage.tsx`

**Adicionada seção** de configuração de IA Local:

- Checkbox para habilitar/desabilitar
- Botão de teste
- Instruções de instalação
- Feedback visual do status

## 🚀 Como Usar

### Instalação

1. **Windows:**
   ```powershell
   cd local-server
   .\install_model.ps1
   ```

2. **Linux/macOS:**
   ```bash
   cd local-server
   chmod +x install_model.sh
   ./install_model.sh
   ```

### Configuração no App

1. Abra o app
2. Vá em **Configurações**
3. Ative **"Usar IA Local Offline (Ollama)"**
4. Clique em **"Testar IA Local"** para verificar

### Uso Automático

Uma vez configurado, o app **automaticamente**:

- Tenta usar IA Local primeiro (se habilitada)
- Faz fallback para API externa se necessário
- Usa modo offline se tudo falhar

## 📝 Detalhes Técnicos

### `localAIService.ts`

**Funções principais:**
- `checkOllamaHealth()` - Verifica se Ollama está rodando
- `generateLocalResponse()` - Gera resposta usando Ollama
- `testLocalIA()` - Testa a conexão
- `getAvailableModel()` - Obtém modelo disponível

**Modelos suportados:**
- `phi3:mini` (recomendado - ~2.3 GB)
- `llama3.1:8b` (~4.7 GB)
- `mistral:7b` (~4.1 GB)
- `qwen2.5:7b` (~4.4 GB)

### `iaController.ts`

**Funções principais:**
- `generateResponse()` - Gera resposta com fallback
- `generateJSONResponse()` - Gera JSON estruturado
- `shouldUseLocalAI()` - Verifica preferência do usuário
- `setUseLocalAI()` - Define preferência

**Configuração:**
- Armazenada em `localStorage` com chave `nutria.useLocalAI`
- Padrão: `true` (IA Local é primeira opção)

## 🔄 Fallback Automático

O sistema de fallback funciona em 3 níveis:

1. **IA Local (Ollama)**
   - Verifica se está habilitada
   - Verifica se Ollama está rodando
   - Tenta gerar resposta
   - Se falhar → próximo nível

2. **API Externa (Gemini)**
   - Verifica se há API key
   - Chama API do Gemini
   - Se falhar → próximo nível

3. **Modo Offline**
   - Usa respostas pré-definidas
   - Sempre disponível

## 🛡️ Compatibilidade

### O que NÃO foi alterado:

- ✅ Estrutura de pastas
- ✅ Componentes existentes
- ✅ Lógica de negócio
- ✅ Tratamento de erros
- ✅ Fallback offline existente

### O que foi adicionado:

- ✅ Novos serviços (`localAIService.ts`, `iaController.ts`)
- ✅ Scripts de instalação
- ✅ Seção nas configurações
- ✅ Integração opcional em `geminiService.ts`

## 🧪 Testes

### Testar IA Local

1. Inicie o servidor Ollama:
   ```bash
   # Windows
   .\start_local_ia.ps1
   
   # Linux/macOS
   ./start_local_ia.sh
   ```

2. No app, vá em **Configurações**
3. Clique em **"Testar IA Local"**
4. Deve mostrar: "IA Local está funcionando! Modelo: phi3:mini"

### Testar Fallback

1. Desabilite IA Local nas configurações
2. Use o app normalmente
3. Deve usar API externa como antes

## 📊 Performance

### IA Local (Ollama)

- **Vantagens:**
  - Funciona offline
  - Sem custos de API
  - Privacidade total
  - Sem limites de uso

- **Desvantagens:**
  - Requer instalação
  - Consome recursos locais
  - Pode ser mais lento (depende do hardware)

### API Externa (Gemini)

- **Vantagens:**
  - Mais rápida
  - Não consome recursos locais
  - Modelos mais poderosos

- **Desvantagens:**
  - Requer internet
  - Pode ter custos
  - Limites de uso

## 🔍 Solução de Problemas

### Ollama não inicia

1. Verifique instalação: `ollama --version`
2. Tente iniciar manualmente: `ollama serve`
3. Verifique porta 11434: `curl http://localhost:11434/api/tags`

### Modelo não encontrado

1. Liste modelos: `ollama list`
2. Instale modelo: `ollama pull phi3:mini`

### App não usa IA Local

1. Verifique se está habilitada nas Configurações
2. Verifique se Ollama está rodando
3. Teste a conexão: clique em "Testar IA Local"

## 🔗 Links Úteis

- [Documentação do Ollama](https://github.com/ollama/ollama)
- [Lista de Modelos](https://ollama.com/library)
- [Guia de Instalação](https://ollama.com/download)

## 📝 Notas de Implementação

### Decisões de Design

1. **Não invasivo:** A integração foi feita de forma que o app continue funcionando normalmente mesmo sem Ollama
2. **Fallback inteligente:** Sistema de 3 níveis garante que sempre há uma opção disponível
3. **Configurável:** Usuário pode escolher preferir IA Local ou API externa
4. **Modular:** Serviços separados facilitam manutenção e testes

### Próximos Passos (Opcional)

- [ ] Integrar IA Local no chatbot (`assistantService.ts`)
- [ ] Adicionar streaming para IA Local
- [ ] Suporte a múltiplos modelos
- [ ] Cache de respostas locais
- [ ] Métricas de performance

---

**Integrado em:** 2025-01-13  
**Versão:** 1.0  
**Status:** ✅ Funcional e Testado

