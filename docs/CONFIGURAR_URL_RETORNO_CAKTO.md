# 🔧 Configurar URL de Retorno na Cakto

## 📋 Objetivo

Configurar a URL de retorno na Cakto para que, após o pagamento, o cliente seja redirecionado para a página de ativação com o código de convite.

## 🎯 URL de Retorno

```
https://pagina-de-vendas-fit-coach-ai.vercel.app/#/activation-success?email={customer_email}
```

## 📝 Passo a Passo

### 1. Acessar Produto na Cakto

1. Faça login na Cakto: https://app.cakto.com.br
2. Vá em **Produtos** → Selecione o produto B2B (ex: Starter Mini, Starter, Growth, Pro)

### 2. Configurar URL de Retorno

1. No produto, vá em **Configurações** ou **URLs**
2. Procure por **"URL de Retorno"** ou **"Redirect URL"** ou **"Success URL"**
3. Adicione a URL:

```
https://pagina-de-vendas-fit-coach-ai.vercel.app/#/activation-success?email={email}
```

**Nota:** A Cakto pode usar diferentes variáveis. Tente também:
- `{customer_email}`
- `{buyer_email}`
- `{email}`

### 3. Configurar para Cada Plano B2B

Repita o processo para todos os planos B2B:
- ✅ Starter Mini
- ✅ Starter
- ✅ Growth
- ✅ Pro

### 4. Testar

1. Faça uma compra de teste
2. Complete o pagamento
3. Verifique se redireciona para a página de ativação
4. Verifique se o email aparece na URL

## 🔍 Verificação

### URL Esperada Após Pagamento

```
https://pagina-de-vendas-fit-coach-ai.vercel.app/#/activation-success?email=cliente@exemplo.com
```

### O Que Deve Aparecer

1. ✅ Mensagem "Pagamento Confirmado!"
2. ✅ Código de convite destacado
3. ✅ Master code da academia
4. ✅ Próximos passos
5. ✅ Botão para criar conta/login

## ⚠️ Troubleshooting

### Problema: URL não funciona

**Solução:**
- Verifique se a URL está correta (sem espaços)
- Verifique se o hash `#/` está presente
- Teste com email manual: `?email=teste@exemplo.com`

### Problema: Email não aparece na URL

**Solução:**
- Verifique qual variável a Cakto usa (`{email}`, `{customer_email}`, etc.)
- Configure a variável correta na Cakto
- O código suporta múltiplas variáveis automaticamente

### Problema: Página não carrega

**Solução:**
- Verifique se a rota está no App.tsx
- Verifique console do navegador para erros
- Teste acessando diretamente: `/#/activation-success?email=teste@exemplo.com`

## 📧 Alternativa: Email

Se a URL de retorno não funcionar, o cliente ainda receberá o código por **email automaticamente**.

O email contém:
- ✅ Código de convite
- ✅ Master code
- ✅ Link para página de ativação
- ✅ Instruções completas

## ✅ Checklist

- [ ] URL de retorno configurada na Cakto
- [ ] Testado com compra real
- [ ] Verificado redirecionamento
- [ ] Verificado exibição do código
- [ ] Verificado envio de email

