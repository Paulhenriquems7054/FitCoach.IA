#!/bin/bash
# Script para Iniciar o Servidor Ollama no Linux/macOS
# Execute este script para iniciar o servidor Ollama localmente

echo "========================================"
echo "Iniciando Servidor Ollama Local"
echo "========================================"
echo ""

# Verificar se Ollama está instalado
if ! command -v ollama &> /dev/null; then
    echo "Ollama não encontrado!"
    echo "Execute primeiro: ./install_model.sh"
    exit 1
fi

# Verificar se já está rodando
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "Ollama já está rodando!"
    echo "Endpoint: http://localhost:11434"
    exit 0
fi

echo "Iniciando servidor Ollama..."
echo ""

# Iniciar Ollama em background
ollama serve > ollama.log 2>&1 &
OLLAMA_PID=$!

# Aguardar alguns segundos
sleep 3

# Verificar se iniciou com sucesso
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "Ollama iniciado com sucesso! (PID: $OLLAMA_PID)"
    echo "Endpoint: http://localhost:11434"
    echo ""
    echo "Para parar o servidor, execute: kill $OLLAMA_PID"
    echo "Ou use: pkill ollama"
    echo ""
    echo "Logs estão em: ollama.log"
else
    echo "Erro ao iniciar Ollama. Verifique se está instalado corretamente."
    exit 1
fi

