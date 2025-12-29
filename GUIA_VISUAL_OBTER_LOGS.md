# 📸 Guia Visual: Como Obter os Logs do Cadastro

## ⚠️ IMPORTANTE: Os logs que você compartilhou são da INICIALIZAÇÃO, não do CADASTRO

Precisamos dos logs que aparecem **QUANDO VOCÊ CLICA EM "CRIAR CONTA"**.

---

## 🎯 Passo a Passo (COM IMAGENS MENTAIS)

### PASSO 1: Preparar o Ambiente

1. Abra o app no navegador
2. **Pressione F12** (ou clique direito → Inspecionar)
3. Vá para a aba **"Console"** (não Network ainda)

### PASSO 2: Limpar o Console

1. Clique no ícone 🗑️ (limpar) no canto superior esquerdo do console
2. Ou pressione **Ctrl+L** (Windows) / **Cmd+K** (Mac)
3. **O console deve estar COMPLETAMENTE VAZIO**

### PASSO 3: Fazer o Cadastro

1. Na página de login, clique em **"Não tem código? Testar Grátis por 3 dias"**
2. Preencha:
   - Nome (ex: "Teste")
   - Email (ex: "teste@exemplo.com")
   - Senha (ex: "123456")
   - Confirmar senha
3. **NÃO clique em "Criar Conta" ainda!**

### PASSO 4: Agora SIM - Criar Conta e Capturar Logs

1. **Olhe para o console** (mantenha-o visível)
2. Clique em **"Criar Conta"**
3. **IMEDIATAMENTE**, enquanto o cadastro está processando, **copie TODOS os logs** que aparecem

### PASSO 5: O Que Procurar

Procure por logs que contenham:
- `[LoginPage]` - especialmente importante!
- `função RPC` ou `insert_user_profile`
- `❌ Erro` ou `ERRO CRÍTICO`
- Qualquer coisa em **VERMELHO**
- Números como `400`, `403`, `500`

---

## 🔍 Alternativa: Usar a Aba Network (Mais Fácil!)

### PASSO 1: Preparar

1. Abra o app
2. **F12** → Aba **"Network"** (Rede)
3. Clique no ícone 🗑️ para limpar

### PASSO 2: Filtrar

1. Na barra de busca do Network, digite: **`rpc`**
2. Isso mostrará apenas requisições RPC

### PASSO 3: Fazer Cadastro

1. Clique em "Não tem código? Testar Grátis por 3 dias"
2. Preencha os dados
3. **Clique em "Criar Conta"**

### PASSO 4: Ver Resultado

1. Procure por uma requisição chamada: **`insert_user_profile_after_signup`**
2. Veja a coluna **"Status"**:
   - Se for **200** = ✅ Funcionou!
   - Se for **400, 403, 500** = ❌ Erro!

### PASSO 5: Ver Detalhes do Erro

1. **Clique** na requisição `insert_user_profile_after_signup`
2. Vá para a aba **"Response"** (Resposta)
3. **Copie TODO o conteúdo** (geralmente é um JSON com a mensagem de erro)
4. Compartilhe aqui!

---

## 📋 Exemplo do Que Queremos Ver

### Se der ERRO na aba Network:

```
Nome: insert_user_profile_after_signup
Status: 400 (Bad Request)
Type: fetch

Response:
{
  "message": "função não encontrada",
  "code": "42883",
  "details": "...",
  "hint": "..."
}
```

### Se der ERRO no Console:

```
[LoginPage] Tentativa 1/3 de chamar função RPC insert_user_profile_after_signup
[LoginPage] Parâmetros RPC (tentativa 1): {...}
[LoginPage] ❌ Erro na tentativa 1 da função RPC: {
  code: "400",
  message: "...",
  ...
}
[LoginPage] ❌ ERRO CRÍTICO: Falha ao criar usuário via função RPC
```

---

## ⏱️ Timing é Importante

**O cadastro acontece rápido!** Você precisa:
1. ✅ Ter o console/network aberto ANTES de clicar
2. ✅ Clicar em "Criar Conta"
3. ✅ IMEDIATAMENTE copiar os logs/erros que aparecem

**NÃO** espere a página carregar completamente - os logs aparecem durante o processo!

---

## 🎯 Resumo Rápido

1. F12 → Network
2. Filtrar: `rpc`
3. Limpar (🗑️)
4. Fazer cadastro
5. Procurar `insert_user_profile_after_signup`
6. Ver Status e Response
7. Compartilhar aqui!

---

**Vamos tentar de novo com esses passos específicos!** 🚀

