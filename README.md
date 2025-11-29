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

2. **Configure as variáveis de ambiente:**
   - Crie o arquivo `.env.local` na raiz do projeto
   - Copie o conteúdo de `env.example.txt` e preencha com seus valores:
   
   **API Key do Gemini:**
   - Acesse: https://aistudio.google.com/apikey
   - Crie ou use sua API key existente
   ```
   VITE_GEMINI_API_KEY=sua_chave_api_aqui
   ```
   
   **Configuração do Supabase (obrigatório para sistema de cupons):**
   - Acesse: https://app.supabase.com/project/seu-projeto/settings/api
   - Copie a URL do projeto e a chave `anon public`
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua_chave_anon_key_aqui
   ```
   
   📖 **Guia completo:** Veja `docs/CONFIGURAR_SUPABASE.md`

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acesse no navegador:**
   ```
   http://localhost:3000
   ```

## ⚠️ Solução de Problemas

### Erro "API key not valid"
1. Verifique se o arquivo `.env.local` existe na raiz do projeto
2. Confirme que a variável está escrita como: `VITE_GEMINI_API_KEY`
3. Certifique-se de que sua API key do Gemini está válida
4. Após modificar o `.env.local`, reinicie o servidor (`Ctrl+C` e depois `npm run dev`)

### Erro "Variáveis de ambiente do Supabase não configuradas"
1. Verifique se o arquivo `.env.local` contém `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
2. Obtenha as credenciais em: https://app.supabase.com/project/seu-projeto/settings/api
3. Reinicie o servidor após adicionar as variáveis
4. 📖 Veja o guia completo: `docs/CONFIGURAR_SUPABASE.md`

## 🚀 Deploy no Vercel (Para Demonstração)

O app pode ser hospedado no Vercel para demonstração ao cliente:

### Deploy Rápido

1. **Instale Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Faça login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Configure variáveis de ambiente:**
   - No painel do Vercel, adicione: `VITE_GEMINI_API_KEY`
   - Ou via CLI: `vercel env add VITE_GEMINI_API_KEY`

5. **Deploy de produção:**
   ```bash
   vercel --prod
   ```

📖 **Guia completo:** Veja `docs/DEPLOY_VERCEL.md`

### O que funciona no Vercel:
- ✅ App completo (todas as funcionalidades)
- ✅ API Externa (Gemini) - funciona perfeitamente
- ✅ Fallback automático - já implementado
- ✅ Modo Offline - respostas pré-definidas
- ✅ PWA - pode ser instalado como app

### Limitação:
- ❌ IA Local (Ollama) - não funciona no Vercel (mas não é necessário, API externa funciona)
