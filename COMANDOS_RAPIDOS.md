# 🚀 Comandos Rápidos - FitCoach.IA

## 📍 **RAIZ DO PROJETO** (`D:\FitCoach.IA`)

### Para iniciar o **FRONTEND** (React + Vite):
```bash
npm run dev
```
- Abre em: `http://localhost:3000`
- Este é o comando principal para desenvolvimento do app

### Outros comandos na raiz:
```bash
npm run build          # Build de produção
npm run preview        # Preview do build
npm run server         # Servidor Express local
npm run test           # Rodar testes
```

---

## 📍 **BACKEND** (`D:\FitCoach.IA\backend`)

### Para iniciar o **BACKEND** (NestJS):
```bash
cd backend
npm run start:dev
```
- Abre em: `http://localhost:3000` (ou porta configurada no NestJS)

### Outros comandos no backend:
```bash
npm run start          # Modo produção
npm run build          # Build do backend
npm run test           # Testes do backend
```

---

## 📍 **CHATBOT** (`D:\FitCoach.IA\chatbot`)

### Para iniciar o chatbot separado:
```bash
cd chatbot
npm run dev
```

---

## ⚠️ **POR QUE ISSO ACONTECE?**

Quando você sai de um projeto e volta, pode acontecer:

1. **Confusão de scripts**: Cada projeto tem scripts diferentes
   - Projeto A pode ter `start:dev`
   - Projeto B pode ter só `dev`
   - Projeto C pode ter `start`

2. **Pasta errada**: Você pode estar na raiz tentando rodar script do backend (ou vice-versa)

3. **Dependências não instaladas**: O `node_modules` pode estar vazio ou corrompido

4. **Solução**: Sempre verifique em qual pasta está:
   ```bash
   # Ver onde você está
   pwd    # Linux/Mac
   cd     # Windows PowerShell (mostra o caminho)
   
   # Ver scripts disponíveis
   npm run
   ```

## 🔧 **SOLUÇÃO PARA ERRO "Cannot find package 'vite'"**

Se você receber erro de que o `vite` não foi encontrado:

1. **O `npx` resolve automaticamente**: O comando `npm run dev` usa `npx vite`, que baixa o pacote se necessário
2. **Se ainda der erro**, reinstale as dependências:
   ```bash
   # Na raiz do projeto
   npm install
   
   # No backend
   cd backend
   npm install
   ```
3. **O `npx` funciona mesmo sem instalação local**: Ele baixa temporariamente o pacote necessário

---

## ✅ **CHECKLIST ANTES DE RODAR**

1. ✅ Verifique se está na pasta correta
2. ✅ Verifique se as dependências estão instaladas (`node_modules` existe)
3. ✅ Se não tiver `node_modules`, rode: `npm install`
4. ✅ Verifique se tem `.env.local` na raiz (para API key do Gemini)

---

## 🔧 **SE DER ERRO "Missing script"**

1. Verifique em qual pasta está: `cd` (PowerShell) ou `pwd` (Linux/Mac)
2. Veja os scripts disponíveis: `npm run`
3. Use o script correto para aquela pasta

