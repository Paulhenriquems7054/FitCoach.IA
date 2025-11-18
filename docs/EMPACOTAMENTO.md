# 📦 Guia de Empacotamento - Nutri.IA

Este documento descreve como empacotar o Nutri.IA como aplicativo nativo para PC e dispositivos móveis, incluindo a IA Local (Ollama) embutida.

## 🎯 Opções de Empacotamento

### 1. **Capacitor** (Recomendado) ⭐
- ✅ Suporta Windows, macOS, Linux, Android, iOS
- ✅ Acesso completo a APIs nativas
- ✅ Pode embutir Ollama
- ✅ Mantido pela equipe do Ionic
- ✅ Baseado em WebView nativo

### 2. **Electron** (Apenas Desktop)
- ✅ Windows, macOS, Linux
- ❌ Não suporta mobile nativamente
- ✅ Muito maduro e estável
- ⚠️ Bundle maior (~100-200MB)

### 3. **Tauri** (Desktop Leve)
- ✅ Windows, macOS, Linux
- ❌ Não suporta mobile
- ✅ Bundle muito menor (~5-10MB)
- ⚠️ Mais novo, menos recursos

### 4. **PWA** (Progressive Web App)
- ✅ Funciona em todos os dispositivos
- ✅ Instalação via navegador
- ❌ Limitações de acesso nativo
- ❌ Ollama precisa ser instalado separadamente

## 🚀 Solução Recomendada: Capacitor

Vamos usar **Capacitor** porque:
- Suporta desktop E mobile
- Permite embutir Ollama
- Acesso completo a recursos do sistema
- Uma única base de código

---

## 📋 Pré-requisitos

### Para Desktop:
- Node.js 18+
- npm ou pnpm
- Capacitor CLI

### Para Android:
- Android Studio
- JDK 17+
- Android SDK

### Para iOS (apenas macOS):
- Xcode 14+
- CocoaPods
- macOS

---

## 🔧 Instalação do Capacitor

### 1. Instalar Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/app @capacitor/haptics @capacitor/keyboard @capacitor/status-bar
npm install @capacitor/electron @capacitor/android @capacitor/ios
```

### 2. Inicializar Capacitor

```bash
npx cap init "Nutri.IA" "com.nutria.app" --web-dir="dist"
```

### 3. Adicionar Plataformas

```bash
# Desktop
npx cap add electron

# Android
npx cap add android

# iOS (apenas macOS)
npx cap add ios
```

---

## 📱 Configuração por Plataforma

### Electron (Desktop)

**capacitor.config.ts:**
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nutria.app',
  appName: 'Nutri.IA',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Electron: {
      appId: 'com.nutria.app',
      appName: 'Nutri.IA',
      webDir: 'dist',
      bundledWebRuntime: false
    }
  }
};

export default config;
```

### Android

**android/app/build.gradle:**
```gradle
android {
    compileSdkVersion 34
    defaultConfig {
        applicationId "com.nutria.app"
        minSdkVersion 22
        targetSdkVersion 34
    }
}
```

### iOS

**ios/App/App.xcodeproj:**
- Configurar via Xcode
- Definir Bundle Identifier: `com.nutria.app`

---

## 🤖 Embutir Ollama

### Estratégia

1. **Desktop (Electron):**
   - Incluir binário do Ollama no bundle
   - Iniciar automaticamente ao abrir app
   - Gerenciar processo em background

2. **Android:**
   - Usar Ollama via termux ou binário compilado
   - Ou usar API remota como fallback

3. **iOS:**
   - Limitações de segurança
   - Usar API remota ou serviço externo

### Implementação para Electron

**electron/main.js:**
```javascript
const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let ollamaProcess = null;
let mainWindow = null;

// Caminho do Ollama embutido
const OLLAMA_PATH = path.join(__dirname, 'resources', 'ollama');

function startOllama() {
  if (fs.existsSync(OLLAMA_PATH)) {
    ollamaProcess = spawn(OLLAMA_PATH, ['serve'], {
      cwd: path.dirname(OLLAMA_PATH),
      stdio: 'ignore',
      detached: true
    });
    
    ollamaProcess.unref();
    console.log('Ollama iniciado');
  }
}

function stopOllama() {
  if (ollamaProcess) {
    ollamaProcess.kill();
    ollamaProcess = null;
  }
}

app.whenReady().then(() => {
  // Iniciar Ollama antes de criar janela
  startOllama();
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  
  mainWindow.loadFile('dist/index.html');
});

app.on('before-quit', () => {
  stopOllama();
});
```

---

## 📦 Scripts de Build

### package.json

```json
{
  "scripts": {
    "build": "vite build",
    "build:electron": "npm run build && npx cap sync electron",
    "build:android": "npm run build && npx cap sync android",
    "build:ios": "npm run build && npx cap sync ios",
    "electron:dev": "npm run build && npx cap open electron",
    "electron:build": "npm run build:electron && cd electron && npm run build",
    "android:dev": "npm run build:android && npx cap open android",
    "android:build": "npm run build:android && cd android && ./gradlew assembleRelease",
    "ios:dev": "npm run build:ios && npx cap open ios"
  }
}
```

---

## 🎯 Estrutura Final

```
nutri-ia/
├── dist/                    # Build web (Vite)
├── electron/                # App Electron
│   ├── main.js
│   ├── resources/
│   │   └── ollama/         # Ollama embutido
│   └── package.json
├── android/                 # App Android
│   └── app/
├── ios/                     # App iOS
│   └── App/
├── capacitor.config.ts
└── package.json
```

---

## 📱 Distribuição

### Desktop

**Windows:**
- `.exe` via Electron Builder
- Instalador MSI
- Auto-updater opcional

**macOS:**
- `.dmg` via Electron Builder
- App Store (opcional)

**Linux:**
- `.AppImage`
- `.deb` / `.rpm`

### Mobile

**Android:**
- `.apk` (desenvolvimento)
- `.aab` (Google Play Store)

**iOS:**
- `.ipa` (TestFlight / App Store)

---

## 🔐 Considerações de Segurança

1. **Ollama embutido:**
   - Verificar assinatura digital
   - Validar integridade dos binários
   - Isolar processo

2. **API Keys:**
   - Nunca commitar no código
   - Usar variáveis de ambiente
   - Criptografar no armazenamento local

3. **Dados do usuário:**
   - IndexedDB já é seguro
   - Adicionar criptografia para dados sensíveis

---

## 🚀 Próximos Passos

1. Instalar Capacitor
2. Configurar plataformas
3. Adaptar código para Capacitor
4. Embutir Ollama (desktop)
5. Testar em cada plataforma
6. Criar builds de distribuição

---

## 📝 Notas Importantes

### Ollama em Mobile

- **Android:** Pode ser desafiador devido a limitações
- **iOS:** Muito restritivo, melhor usar API remota
- **Solução:** Usar API remota como padrão em mobile, IA Local apenas em desktop

### Tamanho do Bundle

- **Desktop com Ollama:** ~200-300MB
- **Mobile sem Ollama:** ~20-30MB
- **Mobile com Ollama:** ~250-350MB (se possível)

### Performance

- IA Local funciona melhor em desktop
- Mobile: priorizar API remota
- Fallback automático já implementado

---

**Status:** 📋 Plano de Implementação  
**Próximo passo:** Instalar e configurar Capacitor

