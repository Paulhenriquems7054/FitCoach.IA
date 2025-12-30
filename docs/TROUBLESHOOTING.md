# 🔧 Guia de Troubleshooting - FitCoach.IA

Este guia ajuda a resolver problemas comuns do app.

---

## 🚨 Problemas Críticos

### 1. App não carrega / Tela branca

**Sintomas:**
- Tela branca ao abrir o app
- Nada acontece após carregar
- Erro no console do navegador

**Soluções:**

#### Solução 1: Limpar Cache
```bash
# No navegador:
1. Pressione Ctrl+Shift+Delete (Windows) ou Cmd+Shift+Delete (Mac)
2. Selecione "Cache" e "Cookies"
3. Clique em "Limpar dados"
4. Recarregue a página (F5)
```

#### Solução 2: Verificar Console
1. Abra DevTools (F12)
2. Vá na aba **Console**
3. Procure por erros em vermelho
4. Anote a mensagem de erro
5. Entre em contato com suporte se necessário

#### Solução 3: Testar em Modo Anônimo
1. Abra uma janela anônima (Ctrl+Shift+N)
2. Acesse o app
3. Se funcionar, o problema é cache/extensões

#### Solução 4: Verificar Variáveis de Ambiente
Se você é desenvolvedor/configurador:
- Verifique se `VITE_GEMINI_API_KEY` está configurada
- Verifique se `VITE_SUPABASE_URL` está configurada
- Verifique se `VITE_SUPABASE_ANON_KEY` está configurada

---

### 2. Erro "API key not valid"

**Sintomas:**
- Mensagem de erro sobre API key
- Funcionalidades de IA não funcionam

**Soluções:**

#### Solução 1: Verificar Configuração
1. Verifique se a API key do Gemini está correta
2. Acesse: https://aistudio.google.com/apikey
3. Verifique se a chave não expirou
4. Gere uma nova chave se necessário

#### Solução 2: Limpar Cache
- Siga os passos da Solução 1 acima

#### Solução 3: Verificar Variável de Ambiente
Se você é desenvolvedor:
- Verifique se `VITE_GEMINI_API_KEY` está no `.env.local`
- Reinicie o servidor após modificar

---

### 3. Erro "Supabase não configurado"

**Sintomas:**
- Mensagem sobre Supabase não configurado
- Sistema de assinaturas não funciona
- Convites não funcionam

**Soluções:**

#### Solução 1: Verificar Configuração
1. Verifique se `VITE_SUPABASE_URL` está configurada
2. Verifique se `VITE_SUPABASE_ANON_KEY` está configurada
3. Acesse: https://app.supabase.com
4. Verifique se o projeto está ativo

#### Solução 2: Verificar Variáveis no Vercel
Se você é desenvolvedor:
1. Acesse: https://vercel.com
2. Vá em **Settings** → **Environment Variables**
3. Verifique se as variáveis estão configuradas
4. Verifique se estão habilitadas para **Production**

---

## 💬 Problemas com Chat

### 4. Chat de texto não responde

**Sintomas:**
- Mensagens não são enviadas
- Respostas não aparecem
- Erro ao enviar mensagem

**Soluções:**

#### Solução 1: Verificar Conexão
1. Verifique sua conexão com a internet
2. Tente acessar outro site
3. Recarregue a página (F5)

#### Solução 2: Verificar Limites
1. Verifique se não atingiu limite de mensagens
2. Verifique se sua assinatura está ativa
3. Verifique se o trial não expirou

#### Solução 3: Limpar Cache
- Siga os passos da Solução 1 acima

---

### 5. Chat de voz não funciona

**Sintomas:**
- Botão de voz não responde
- Microfone não é detectado
- Erro ao iniciar sessão de voz

**Soluções:**

#### Solução 1: Verificar Permissões
1. Verifique se o navegador tem permissão para usar microfone
2. Clique no ícone de cadeado na barra de endereço
3. Permita acesso ao microfone

#### Solução 2: Verificar Navegador
- **Recomendado:** Chrome ou Edge
- **Não recomendado:** Firefox (pode ter problemas)

#### Solução 3: Verificar Limites
1. Verifique se não atingiu limite diário de voz
2. Verifique se sua assinatura está ativa
3. Verifique se o trial não expirou

#### Solução 4: Verificar Hardware
1. Teste o microfone em outro app
2. Verifique se o microfone está conectado
3. Verifique se não está mudo

---

## 📸 Problemas com Análise de Imagem

### 6. Análise de imagem não funciona

**Sintomas:**
- Foto não é processada
- Erro ao analisar imagem
- Análise não retorna resultados

**Soluções:**

#### Solução 1: Verificar Imagem
1. Certifique-se de que a imagem está nítida
2. Certifique-se de que a refeição está visível
3. Tente com outra foto

#### Solução 2: Verificar Limites
1. Verifique se não atingiu limite de análises
2. **Trial:** Máximo 1 análise durante todo o trial
3. Verifique se sua assinatura está ativa

#### Solução 3: Verificar Tamanho
1. Verifique se a imagem não é muito grande (>10MB)
2. Tente reduzir o tamanho da imagem
3. Use formato JPG ou PNG

---

## 💳 Problemas com Pagamentos

### 7. Pagamento não é processado

**Sintomas:**
- Pagamento não é confirmado
- Assinatura não é ativada
- Erro ao processar pagamento

**Soluções:**

#### Solução 1: Verificar Webhook
Se você é desenvolvedor:
1. Verifique se o webhook do Cakto está configurado
2. Verifique os logs do Supabase Functions
3. Teste o webhook manualmente

#### Solução 2: Verificar Cakto
1. Acesse: https://app.cakto.com.br
2. Verifique se o pagamento foi processado
3. Verifique se há erros no painel

#### Solução 3: Contatar Suporte
- Entre em contato com suporte
- Forneça o número do pedido
- Forneça o email usado no pagamento

---

## 🔐 Problemas com Autenticação

### 8. Não consigo fazer login

**Sintomas:**
- Login não funciona
- Senha incorreta (mas está correta)
- Erro ao fazer login

**Soluções:**

#### Solução 1: Verificar Credenciais
1. Verifique se o email está correto
2. Verifique se a senha está correta
3. Tente recuperar a senha

#### Solução 2: Recuperar Senha
1. Clique em "Esqueci minha senha"
2. Digite seu email
3. Verifique sua caixa de entrada
4. Siga as instruções do email

#### Solução 3: Limpar Dados
1. Limpe cookies e cache
2. Tente fazer login novamente
3. Se não funcionar, entre em contato com suporte

---

### 9. Não consigo me cadastrar

**Sintomas:**
- Cadastro não é concluído
- Erro ao criar conta
- Formulário não envia

**Soluções:**

#### Solução 1: Verificar Dados
1. Verifique se todos os campos estão preenchidos
2. Verifique se o email é válido
3. Verifique se a senha atende aos requisitos

#### Solução 2: Verificar Email
1. Verifique se o email já não está cadastrado
2. Tente usar outro email
3. Verifique se recebeu email de confirmação

---

## 🏋️ Problemas com Sistema de Academias

### 10. Código de convite não funciona

**Sintomas:**
- Código não é aceito
- Erro ao usar código
- Convite expirado

**Soluções:**

#### Solução 1: Verificar Código
1. Verifique se o código está correto
2. Verifique se não há espaços extras
3. Tente copiar e colar o código

#### Solução 2: Verificar Expiração
1. Verifique se o código não expirou
2. Solicite um novo código à academia
3. Entre em contato com a academia

#### Solução 3: Verificar Uso
1. Verifique se o código não foi usado antes
2. Cada código pode ter limite de usos
3. Solicite um novo código se necessário

---

## 📱 Problemas em Mobile

### 11. App não funciona bem no mobile

**Sintomas:**
- Interface quebrada
- Botões não funcionam
- Performance ruim

**Soluções:**

#### Solução 1: Verificar Navegador
- **Recomendado:** Chrome ou Safari
- Atualize o navegador para a versão mais recente

#### Solução 2: Instalar como PWA
1. Abra o app no navegador
2. Menu do navegador → "Adicionar à tela inicial"
3. Use o app instalado

#### Solução 3: Limpar Cache
1. Limpe cache e dados do navegador
2. Recarregue o app
3. Tente novamente

---

## 🔍 Como Obter Mais Ajuda

### Verificar Logs

Se você é desenvolvedor:

1. **Console do Navegador:**
   - Abra DevTools (F12)
   - Vá na aba **Console**
   - Procure por erros

2. **Network:**
   - Abra DevTools (F12)
   - Vá na aba **Network**
   - Verifique requisições falhando

3. **Logs do Vercel:**
   - Acesse: https://vercel.com
   - Vá em **Deployments** → **Logs**

4. **Logs do Supabase:**
   - Acesse: https://app.supabase.com
   - Vá em **Logs** → **Edge Functions**

### Contatar Suporte

Ao entrar em contato, forneça:

1. **Descrição do problema:**
   - O que você estava fazendo?
   - O que esperava que acontecesse?
   - O que aconteceu?

2. **Informações técnicas:**
   - Navegador e versão
   - Sistema operacional
   - Mensagens de erro (se houver)

3. **Screenshots:**
   - Capture a tela com o problema
   - Capture mensagens de erro

4. **Passos para reproduzir:**
   - Liste os passos que levaram ao problema
   - Isso ajuda a reproduzir e corrigir

---

## ✅ Checklist de Troubleshooting

Antes de entrar em contato, tente:

- [ ] Limpar cache e cookies
- [ ] Recarregar a página (F5)
- [ ] Testar em outro navegador
- [ ] Testar em modo anônimo
- [ ] Verificar conexão com internet
- [ ] Verificar se não atingiu limites
- [ ] Verificar se assinatura está ativa
- [ ] Verificar console do navegador (F12)

---

**Última atualização:** 2025-01-13

