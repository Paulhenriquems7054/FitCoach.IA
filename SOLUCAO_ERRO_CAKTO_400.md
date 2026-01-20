# 🔧 Solução: Erro 400 na API Cakto

## ❌ Erro Encontrado

```
api.cakto.com.br/api/offers/brvbzvh/:1  Failed to load resource: the server responded with a status of 400 ()
[OfferModal] submit error: O
```

## 🔍 Causa Provável

O erro está ocorrendo porque o código está tentando acessar uma **oferta/checkout da Cakto com ID `brvbzvh`** que:

1. **Não existe mais** na Cakto (foi removido/desativado)
2. **É inválido** ou está em formato errado
3. **Não está configurado** corretamente no código
4. **Pode estar vindo de um script externo** ou widget da Cakto

**Nota:** Não encontrei referências a `brvbzvh` no código do FitCoach.IA. Isso sugere que o erro pode estar vindo de:
- Um widget/biblioteca JavaScript da Cakto
- Código carregado dinamicamente
- Uma extensão do navegador
- Um script de terceiros

## ✅ Soluções

### **1. Verificar Checkout IDs no Código**

Procure por referências a `brvbzvh` no código:

```bash
# No terminal, dentro da pasta do projeto:
grep -r "brvbzvh" .
```

### **2. Verificar Mapeamento de Checkout IDs**

**Arquivo:** `services/caktoService.ts`

Verifique se há algum ID inválido no mapeamento:

```typescript
const CAKTO_CHECKOUT_IDS: Record<string, string> = {
  // Verificar se todos os IDs estão corretos e existem na Cakto
  'FitCoach50': 'SEU_CHECKOUT_ID_AQUI',      // ⚠️ Verificar se existe
  'FitCoach100': 'SEU_CHECKOUT_ID_AQUI',     // ⚠️ Verificar se existe
  // ...
};
```

### **3. Verificar se Checkout IDs Existem na Cakto**

1. Acesse: https://app.cakto.com.br
2. Vá em **Produtos**
3. Verifique se os Checkout IDs do código existem nos produtos
4. Se algum não existir:
   - **Criar novo produto** na Cakto ou
   - **Atualizar o código** com o ID correto

### **4. Verificar Recargas FitVoice**

**Arquivo:** `services/recargaService.ts`

Se o erro está relacionado a recargas, verifique:

```typescript
// Adicionar mapping de Checkout IDs das recargas
export const RECARGAS_CAKTO_IDS: Record<TipoRecarga, string> = {
  'FitVoice20': 'SEU_CHECKOUT_ID_AQUI',   // ⚠️ Verificar se existe na Cakto
  'FitVoice60': 'SEU_CHECKOUT_ID_AQUI',   // ⚠️ Verificar se existe na Cakto
  'FitVoice120': 'SEU_CHECKOUT_ID_AQUI',  // ⚠️ Verificar se existe na Cakto
};
```

### **5. Verificar Widgets/Bibliotecas da Cakto**

Se você está usando algum widget ou biblioteca JavaScript da Cakto:

1. **Verificar scripts carregados:**
   - Abrir DevTools (F12) → **Sources** → **Page**
   - Procurar por scripts que contenham `cakto` ou `offer`
   - Verificar se há algum script que tenta criar ofertas automaticamente

2. **Verificar HTML da página:**
   - Procurar por tags `<script>` que carregam widgets da Cakto
   - Verificar se há parâmetros hardcoded com IDs antigos

3. **Verificar configuração de widgets:**
   - Se estiver usando widgets da Cakto, verificar configuração
   - Remover ou atualizar IDs antigos

### **6. Verificar Código que Cria Checkouts Dinamicamente**

Se o código está tentando criar checkouts dinamicamente via API da Cakto, verifique:

1. **Se a API key está configurada:**
   ```env
   VITE_CAKTO_API_KEY=seu-api-key-aqui
   ```

2. **Se o endpoint está correto:**
   ```typescript
   // Verificar se está usando a API correta
   const apiUrl = 'https://api.cakto.com.br/v1'; // ou v2
   ```

3. **Se os parâmetros estão corretos:**
   ```typescript
   // Verificar payload da requisição
   const payload = {
     product_id: 'ID_VALIDO',
     customer_email: 'email@exemplo.com',
     // ...
   };
   ```

### **7. Verificar Console do Navegador**

Abra o console do navegador (F12) e verifique:

1. **Rede (Network):**
   - Veja qual requisição está falhando
   - Verifique o payload enviado
   - Verifique a resposta do servidor

2. **Console:**
   - Veja se há mais erros relacionados
   - Verifique se há stack trace completo

### **8. Verificar se é um Checkout Antigo**

Se `brvbzvh` é um checkout antigo que não existe mais:

1. **Remover referências** ao ID antigo no código
2. **Criar novo produto** na Cakto se necessário
3. **Atualizar o código** com o novo Checkout ID

## 🔍 Verificações Específicas

### **Verificar Página de Planos**

**Arquivo:** `pages/PremiumPage.tsx` ou `pages/StudentAiPlansPage.tsx`

Verifique se há links hardcoded com IDs antigos:

```typescript
// ❌ ERRADO: ID hardcoded que pode não existir
onClick={() => window.open('https://pay.cakto.com.br/brvbzvh', ...)}

// ✅ CORRETO: Usar função que busca ID do mapeamento
onClick={() => {
  const url = getCaktoCheckoutUrl('planName');
  window.open(url, ...);
}}
```

### **Verificar Componente de Recarga**

**Arquivo:** `components/RecargaModal.tsx`

Verifique se está tentando acessar um checkout que não existe:

```typescript
// Verificar se criarRecarga está retornando um checkoutUrl válido
const resultado = await criarRecarga(user.id, tipoRecarga);

if (!resultado.checkoutUrl) {
  // Erro: checkout não configurado
  showError('Recarga não disponível. Contate o suporte.');
  return;
}
```

## ✅ Checklist de Verificação

- [ ] Procurar por `brvbzvh` no código
- [ ] Verificar se Checkout IDs existem na Cakto
- [ ] Verificar mapeamento em `services/caktoService.ts`
- [ ] Verificar mapeamento em `services/recargaService.ts`
- [ ] Verificar links hardcoded em páginas
- [ ] Verificar console do navegador para mais detalhes
- [ ] Verificar se API key da Cakto está configurada
- [ ] Verificar se produtos foram criados na Cakto

## 🧪 Testar Correção

Após corrigir:

1. **Limpar cache do navegador** (Ctrl+Shift+Del)
2. **Recarregar a página** (F5)
3. **Testar fluxo de checkout:**
   - Tentar assinar um plano
   - Tentar comprar uma recarga
4. **Verificar console:**
   - Não deve haver mais erro 400
   - Verificar se checkout abre corretamente

## 📞 Se o Erro Persistir

### **Solução Temporária (Ignorar Erro)**

Se o erro não está bloqueando a funcionalidade:

1. **Verificar se é um erro que pode ser ignorado:**
   - Se o checkout funciona normalmente, o erro pode ser de um script antigo
   - Pode ser um retry automático de uma requisição falha anterior

2. **Adicionar tratamento de erro:**
   ```typescript
   // Capturar e ignorar erros específicos da Cakto
   window.addEventListener('error', (event) => {
     if (event.message?.includes('cakto') || event.filename?.includes('cakto')) {
       console.warn('Erro Cakto ignorado:', event.message);
       event.preventDefault(); // Prevenir que apareça no console
     }
   });
   ```

### **Solução Permanente**

1. **Capturar detalhes do erro:**
   - Abrir DevTools (F12)
   - Ir em **Network**
   - Filtrar por `cakto`
   - Clicar na requisição que falhou (`api.cakto.com.br/api/offers/brvbzvh/`)
   - Ver **Headers**, **Payload**, **Response**
   - Verificar qual script está fazendo essa requisição (coluna **Initiator**)

2. **Identificar origem do erro:**
   - Na coluna **Initiator**, ver qual arquivo/script está fazendo a requisição
   - Verificar se é um arquivo do projeto ou externo

3. **Verificar produtos na Cakto:**
   - https://app.cakto.com.br → Produtos
   - Confirmar que todos os produtos estão ativos
   - Verificar se há algum produto com ID `brvbzvh`

4. **Verificar logs no Supabase:**
   - Dashboard → Edge Functions → cakto-webhook → Logs
   - Verificar se há tentativas de processar checkout com ID `brvbzvh`

---

**Data:** 2026-01-18  
**Status:** 🔍 Investigação em andamento
