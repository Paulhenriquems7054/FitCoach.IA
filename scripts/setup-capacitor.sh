#!/bin/bash
# Script de Configuração do Capacitor para Empacotamento
# Execute este script para configurar o Capacitor no projeto

echo "========================================"
echo "Configuração do Capacitor"
echo "========================================"
echo ""

# Verificar Node.js
echo "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "Node.js não encontrado! Instale Node.js 18+ primeiro."
    exit 1
fi

NODE_VERSION=$(node --version)
echo "Node.js encontrado: $NODE_VERSION"
echo ""

# Instalar dependências do Capacitor
echo "Instalando Capacitor..."
npm install @capacitor/core @capacitor/cli --save-dev
npm install @capacitor/app @capacitor/haptics @capacitor/keyboard @capacitor/status-bar --save
npm install @capacitor/electron @capacitor/android @capacitor/ios --save

if [ $? -ne 0 ]; then
    echo "Erro ao instalar Capacitor!"
    exit 1
fi

echo "Capacitor instalado com sucesso!"
echo ""

# Inicializar Capacitor
echo "Inicializando Capacitor..."
npx cap init "Nutri.IA" "com.nutria.app" --web-dir="dist"

if [ $? -ne 0 ]; then
    echo "Erro ao inicializar Capacitor!"
    exit 1
fi

echo "Capacitor inicializado!"
echo ""

# Perguntar quais plataformas adicionar
echo "Quais plataformas deseja adicionar?"
echo "1. Electron (Desktop - Windows/macOS/Linux)"
echo "2. Android"
echo "3. iOS (apenas macOS)"
echo "4. Todas (Electron + Android)"
echo ""

read -p "Escolha (1-4): " choice

case $choice in
    1)
        echo "Adicionando Electron..."
        npx cap add electron
        ;;
    2)
        echo "Adicionando Android..."
        npx cap add android
        ;;
    3)
        echo "Adicionando iOS..."
        echo "Nota: iOS requer macOS e Xcode"
        npx cap add ios
        ;;
    4)
        echo "Adicionando Electron e Android..."
        npx cap add electron
        npx cap add android
        ;;
    *)
        echo "Opção inválida. Adicionando apenas Electron..."
        npx cap add electron
        ;;
esac

echo ""
echo "========================================"
echo "Configuração concluída!"
echo "========================================"
echo ""
echo "Próximos passos:"
echo "1. Execute: npm run build"
echo "2. Execute: npx cap sync"
echo "3. Para desenvolvimento:"
echo "   - Desktop: npx cap open electron"
echo "   - Android: npx cap open android"
echo ""

