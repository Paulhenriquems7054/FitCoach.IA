# 🚨 INSTRUÇÕES URGENTES: Precisamos dos Logs do Console

## ⚠️ Problema Identificado

O cadastro está criando a conta no Supabase Auth, mas **não está criando o perfil na tabela `users`**. Isso causa:
1. Mensagem: "Conta criada no sistema, mas houve um problema ao salvar seu perfil"
2. Login falha porque não há perfil na tabela `users`

## 🔍 COMO OBTER OS LOGS (PASSO A PASSO)

### Passo 1: Abrir o DevTools
- Pressione **F12** no navegador
- Ou clique com botão direito → "Inspecionar" → Aba "Console"

### Passo 2: Limpar o Console
- Clique no ícone de limpar (🗑️) ou pressione **Ctrl+L**

### Passo 3: Fazer o Cadastro
1. Tente cadastrar um novo usuário (sem código, para testar trial)
2. Preencha os dados e clique em "Criar Conta"
3. **NÃO FECHE O CONSOLE**

### Passo 4: Copiar os Logs
Procure por estas mensagens e **copie TUDO**:

#### ✅ Logs que começam com `[LoginPage]`
Especialmente:
- `[LoginPage] Tentativa X/3 de chamar função RPC`
- `[LoginPage] Parâmetros RPC (tentativa X):`
- `[LoginPage] ❌ Erro na tentativa X da função RPC:`
- `[LoginPage] 📋 Detalhes completos do erro RPC:`
- `[LoginPage] ❌ ERRO CRÍTICO:`

#### ✅ Logs em vermelho (erros)
Qualquer erro que apareça em vermelho no console

#### ✅ Logs sobre função RPC
Qualquer log que mencione "função RPC" ou "insert_user_profile_after_signup"

### Passo 5: Verificar a Aba Network (Opcional mas Útil)

1. Vá para a aba **Network** (Rede) no DevTools
2. Filtre por **"rpc"** ou **"insert_user_profile"**
3. Procure por requisições que falharam (status 400, 403, 500, etc.)
4. Clique na requisição e veja:
   - **Status Code** (ex: 400, 403, 500)
   - Aba **Response** (Resposta) - copie o conteúdo
   - Aba **Request** (Requisição) - veja os parâmetros enviados

## 📋 Exemplo do que Queremos Ver

```
[LoginPage] Chamando função RPC insert_user_profile_after_signup com retry logic
[LoginPage] Parâmetros completos que serão enviados para a função RPC: {p_user_id: "...", p_nome: "...", ...}
[LoginPage] Tentativa 1/3 de chamar função RPC insert_user_profile_after_signup
[LoginPage] Parâmetros RPC (tentativa 1): {p_user_id: "...", p_nome: "...", ...}
[LoginPage] ❌ Erro na tentativa 1 da função RPC: {
  code: "400",
  message: "...",
  details: "...",
  hint: "...",
  status: 400
}
[LoginPage] 📋 Detalhes completos do erro RPC: {...}
[LoginPage] ❌ ERRO CRÍTICO: Falha ao criar usuário via função RPC após todas as tentativas
[LoginPage] CRÍTICO: Falha ao criar usuário na tabela users. Erro: {...}
```

## 💡 Dica: Como Copiar os Logs

### Opção 1: Copiar Texto
- Clique com botão direito no console
- Selecione "Save as..." ou "Export visible messages to file"
- Compartilhe o arquivo

### Opção 2: Captura de Tela
- Tire uma captura de tela completa do console
- Compartilhe a imagem

### Opção 3: Copiar Manualmente
- Selecione o texto no console
- Ctrl+C para copiar
- Cole aqui na conversa

## 🎯 Por Que Precisamos Disso?

Com os logs detalhados, podemos identificar:
- ✅ Qual é o erro exato (código e mensagem)
- ✅ Quais parâmetros estão sendo enviados
- ✅ Se é problema de permissões, parâmetros, ou outra coisa
- ✅ Como corrigir o problema

**SEM OS LOGS, NÃO PODEMOS IDENTIFICAR O PROBLEMA!**

---

## ⏱️ Fazer Agora

1. Abra o console (F12)
2. Limpe o console (Ctrl+L)
3. Faça um cadastro de teste
4. Copie TODOS os logs que aparecem
5. Cole aqui na conversa

Vamos resolver isso rapidamente! 🚀

