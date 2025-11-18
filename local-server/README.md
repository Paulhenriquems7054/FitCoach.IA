# IA Local Offline - Documentação

Este diretório contém scripts para instalar e gerenciar o servidor Ollama local, que permite usar IA offline sem depender de APIs externas.

## 📋 Pré-requisitos

- Windows 10/11 ou Linux/macOS
- Conexão com internet (apenas para instalação inicial)
- ~2-4 GB de espaço em disco (para o modelo)

## 🚀 Instalação Rápida

### Windows

1. Abra o PowerShell como Administrador
2. Execute:
   ```powershell
   cd local-server
   .\install_model.ps1
   ```

### Linux/macOS

1. Abra o terminal
2. Execute:
   ```bash
   cd local-server
   chmod +x install_model.sh start_local_ia.sh
   ./install_model.sh
   ```

## 🎯 Modelos Recomendados

O script instalará automaticamente um dos seguintes modelos (em ordem de preferência):

1. **phi3:mini** (~2.3 GB) - Modelo leve e rápido, recomendado
2. **llama3.1:8b** (~4.7 GB) - Modelo mais poderoso
3. **mistral:7b** (~4.1 GB) - Boa alternativa
4. **qwen2.5:7b** (~4.4 GB) - Outra opção

## ▶️ Iniciar o Servidor

### Windows

```powershell
.\start_local_ia.ps1
```

### Linux/macOS

```bash
./start_local_ia.sh
```

O servidor estará disponível em: `http://localhost:11434`

## 🧪 Testar a Instalação

Após instalar e iniciar, teste com:

```bash
ollama run phi3:mini "Olá, como você está?"
```

Ou use a opção de teste nas Configurações do app.

## ⚙️ Configuração no App

1. Abra o app
2. Vá em **Configurações**
3. Ative a opção **"Usar IA Local Offline"**
4. Clique em **"Testar IA Local"** para verificar se está funcionando

## 🔄 Fallback Automático

O app usa um sistema de fallback inteligente:

1. **Primeira opção**: IA Local (Ollama) - se estiver habilitada e disponível
2. **Fallback**: API Externa (Gemini) - se IA Local falhar ou não estiver disponível
3. **Último recurso**: Modo Offline - respostas pré-definidas

## 🛠️ Comandos Úteis

### Listar modelos instalados
```bash
ollama list
```

### Baixar um modelo específico
```bash
ollama pull phi3:mini
```

### Remover um modelo
```bash
ollama rm phi3:mini
```

### Ver informações do modelo
```bash
ollama show phi3:mini
```

## 📝 Notas

- O servidor Ollama precisa estar rodando para usar IA Local
- A primeira execução pode ser mais lenta (carregamento do modelo)
- Modelos maiores oferecem melhor qualidade, mas são mais lentos
- Recomendamos usar `phi3:mini` para melhor equilíbrio entre velocidade e qualidade

## ❓ Solução de Problemas

### Ollama não inicia

1. Verifique se está instalado: `ollama --version`
2. Tente iniciar manualmente: `ollama serve`
3. Verifique se a porta 11434 está livre

### Modelo não encontrado

1. Liste modelos: `ollama list`
2. Instale o modelo: `ollama pull phi3:mini`

### Erro de conexão no app

1. Verifique se o servidor está rodando: `curl http://localhost:11434/api/tags`
2. Verifique o firewall (porta 11434)
3. Tente reiniciar o servidor

## 🔗 Links Úteis

- [Documentação do Ollama](https://github.com/ollama/ollama)
- [Lista de Modelos](https://ollama.com/library)
- [Guia de Instalação](https://ollama.com/download)

