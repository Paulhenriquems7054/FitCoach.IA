<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Nutri.IA - Agente Nutricional Inteligente

Sistema completo de gestão nutricional com inteligência artificial para criar planos alimentares personalizados, análise de refeições e muito mais.

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js instalado
- Conta Google (para obter a API key do Gemini)

### Instalação

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure a API Key do Gemini:**
   - Acesse: https://aistudio.google.com/apikey
   - Crie ou use sua API key existente
   - Crie o arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:
   ```
   VITE_GEMINI_API_KEY=sua_chave_api_aqui
   ```
   - Substitua `sua_chave_api_aqui` pela sua chave real

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acesse no navegador:**
   ```
   http://localhost:3000
   ```

## ⚠️ Solução de Problemas

Se você receber o erro "API key not valid":
1. Verifique se o arquivo `.env.local` existe na raiz do projeto
2. Confirme que a variável está escrita como: `VITE_GEMINI_API_KEY`
3. Certifique-se de que sua API key do Gemini está válida
4. Após modificar o `.env.local`, reinicie o servidor (`Ctrl+C` e depois `npm run dev`)
