#!/bin/bash
# Script de Instalação do Ollama e Modelo para Linux/macOS
# Execute este script para instalar o Ollama e baixar o modelo

echo "========================================"
echo "Instalação do Ollama e Modelo de IA Local"
echo "========================================"
echo ""

# Verificar se Ollama está instalado
if ! command -v ollama &> /dev/null; then
    echo "Ollama não encontrado. Iniciando instalação..."
    echo ""
    
    # Detectar sistema operacional
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "Instalando Ollama no Linux..."
        curl -fsSL https://ollama.com/install.sh | sh
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Instalando Ollama no macOS..."
        if command -v brew &> /dev/null; then
            brew install ollama
        else
            echo "Homebrew não encontrado. Instale manualmente de: https://ollama.com/download"
            exit 1
        fi
    else
        echo "Sistema operacional não suportado. Instale manualmente de: https://ollama.com/download"
        exit 1
    fi
fi

echo "Ollama encontrado!"
echo ""

# Verificar se o serviço está rodando
echo "Verificando se o Ollama está rodando..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "Ollama está rodando!"
else
    echo "Ollama não está rodando. Iniciando..."
    
    # Iniciar Ollama em background
    ollama serve > /dev/null 2>&1 &
    OLLAMA_PID=$!
    
    # Aguardar alguns segundos
    sleep 3
    
    # Verificar novamente
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "Ollama iniciado com sucesso! (PID: $OLLAMA_PID)"
    else
        echo "Erro ao iniciar Ollama. Execute manualmente: ollama serve"
        exit 1
    fi
fi

echo ""
echo "Verificando modelos disponíveis..."
MODELS=$(ollama list 2>/dev/null || echo "")

# Modelos recomendados (em ordem de preferência)
RECOMMENDED_MODELS=("phi3:mini" "llama3.1:8b" "mistral:7b" "qwen2.5:7b")

MODEL_TO_INSTALL=""
for MODEL in "${RECOMMENDED_MODELS[@]}"; do
    if echo "$MODELS" | grep -q "$MODEL"; then
        echo "Modelo $MODEL já está instalado!"
        MODEL_TO_INSTALL=""
        break
    else
        if [ -z "$MODEL_TO_INSTALL" ]; then
            MODEL_TO_INSTALL="$MODEL"
        fi
    fi
done

if [ -n "$MODEL_TO_INSTALL" ]; then
    echo ""
    echo "Instalando modelo: $MODEL_TO_INSTALL"
    echo "Isso pode levar alguns minutos..."
    echo ""
    
    ollama pull "$MODEL_TO_INSTALL"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "Modelo $MODEL_TO_INSTALL instalado com sucesso!"
    else
        echo ""
        echo "Erro ao instalar modelo. Tente manualmente: ollama pull $MODEL_TO_INSTALL"
        exit 1
    fi
fi

echo ""
echo "========================================"
echo "Instalação concluída!"
echo "========================================"
echo ""
echo "Para testar, execute: ollama run phi3:mini 'Olá, como você está?'"
echo ""
echo "O servidor Ollama deve estar rodando em: http://localhost:11434"
echo ""

