# Solução para Erros 504 (Outdated Request) e ERR_EMPTY_RESPONSE no Vite

## 🔍 Problemas

### Erro 504 (Outdated Request)
Erros `504 (Outdated Request)` ocorrem quando o Vite tenta carregar módulos que foram invalidados ou atualizados, mas o navegador ainda está tentando usar versões antigas em cache.

### Erro ERR_EMPTY_RESPONSE
Erros `ERR_EMPTY_RESPONSE` (geralmente na porta 3029 ou outras portas alternativas) ocorrem quando:
- O servidor Vite está rodando em uma porta diferente da esperada (3000)
- O servidor travou ou não está respondendo
- Há múltiplas instâncias do servidor rodando simultaneamente

## ✅ Soluções Aplicadas

### 1. Configurações Melhoradas no Vite

- **HMR (Hot Module Replacement)** configurado com mais tentativas de reconexão
- **Timeout aumentado** para evitar falhas prematuras
- **Headers de cache** configurados para desenvolvimento

### 2. Scripts de Limpeza

Foram adicionados scripts para facilitar a limpeza do cache:

```bash
# Limpar cache do Vite
npm run clean:cache

# Iniciar com cache limpo (PowerShell)
npm run dev:clean

# Forçar re-otimização de dependências
npm run dev:force
```

## 🚀 Como Resolver os Erros

### Para Erros 504 ou ERR_EMPTY_RESPONSE

### Passo 1: Parar e Limpar Todos os Processos
**Opção A - Script Automático (Recomendado):**
```bash
npm run kill:ports
```

**Opção B - Limpeza Completa:**
```bash
npm run dev:clean
```

**Opção C - Manual:**
```powershell
# No PowerShell
powershell -ExecutionPolicy Bypass -File ./kill-node-processes.ps1
```

### Passo 2: Limpar o Cache

**Opção A - Script Automático (Recomendado):**
```bash
npm run dev:clean
```

**Opção B - Limpeza Manual:**
```bash
npm run clean:cache
npm run dev
```

**Opção C - Limpeza Completa:**
```powershell
# No PowerShell
Remove-Item -Path "node_modules/.vite" -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path "." -Filter "vite.config.ts.timestamp-*" | Remove-Item -Force
npm run dev
```

### Passo 3: Limpar Cache do Navegador (CRÍTICO para erros 504)

**IMPORTANTE:** Se você está vendo erros 504 em `index.css`, `@vite/client` ou `index.tsx`, o cache do navegador está causando o problema.

**Opção A - Hard Refresh (Rápido):**
- **Chrome/Edge:** `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac)
- **Firefox:** `Ctrl+F5` (Windows) ou `Cmd+Shift+R` (Mac)
- **Safari:** `Cmd+Option+R` (Mac)

**Opção B - Limpar Cache Completo:**
1. Pressione `Ctrl+Shift+Delete` (ou `Cmd+Shift+Delete` no Mac)
2. Selecione "Imagens e arquivos em cache"
3. Selecione "Todo o período" ou "Última hora"
4. Clique em "Limpar dados"
5. **Feche todas as abas** do navegador com o app
6. **Abra uma nova aba** e acesse `http://localhost:3000`

**Opção C - Modo Anônimo/Privado (Recomendado para teste):**
1. Abra uma janela anônima/privada (`Ctrl+Shift+N` no Chrome/Edge)
2. Acesse `http://localhost:3000`
3. Se funcionar, o problema é cache do navegador

### Passo 4: Reiniciar o Servidor

```bash
npm run dev
```

## 🔧 Configurações Aplicadas

### vite.config.ts

- **HMR reconnect**: 10 tentativas (antes: 3)
- **HMR timeout**: 10000ms (antes: 5000ms)
- **Headers de cache**: Desabilitados em desenvolvimento
- **Watch mode**: Configurado para evitar loops

### start-dev.ps1

- Limpa processos na porta 3000
- Remove cache do Vite (`node_modules/.vite`)
- Remove timestamps antigos do Vite
- Inicia o servidor com cache limpo

## 📝 Comandos Úteis

```bash
# Desenvolvimento normal
npm run dev

# Desenvolvimento com cache limpo
npm run dev:clean

# Forçar re-otimização de dependências
npm run dev:force

# Limpar apenas o cache (sem iniciar servidor)
npm run clean:cache

# Matar todos os processos Node e liberar portas
npm run kill:ports
```

## 🔧 Resolução Rápida para Erros 504 em index.css, @vite/client ou index.tsx

Se você está vendo erros 504 especificamente nestes arquivos:

1. **Pare o servidor** (`Ctrl+C`)

2. **Limpe tudo:**
   ```bash
   npm run kill:ports
   npm run clean:cache
   ```

3. **Limpe o cache do navegador:**
   - Pressione `Ctrl+Shift+Delete`
   - Selecione "Todo o período"
   - Marque "Imagens e arquivos em cache"
   - Clique em "Limpar dados"

4. **Feche TODAS as abas** do navegador

5. **Reinicie o servidor:**
   ```bash
   npm run dev:clean
   ```

6. **Abra uma nova aba em modo anônimo** e acesse `http://localhost:3000`

7. **Se ainda não funcionar**, tente:
   ```bash
   npm run dev:force
   ```

## 🔧 Resolução Rápida para ERR_EMPTY_RESPONSE

Se você está vendo `ERR_EMPTY_RESPONSE` na porta 3029 (ou outra porta):

1. **Execute o script de limpeza:**
   ```bash
   npm run kill:ports
   ```

2. **Aguarde 5 segundos** para os processos serem encerrados

3. **Limpe o cache:**
   ```bash
   npm run clean:cache
   ```

4. **Reinicie o servidor:**
   ```bash
   npm run dev:clean
   ```

5. **Verifique a porta no terminal** - o Vite mostrará em qual porta está rodando (deve ser 3000)

6. **Acesse a URL correta** - se o Vite estiver na porta 3000, acesse `http://localhost:3000`

## ⚠️ Quando os Erros Acontecem

Os erros 504 e ERR_EMPTY_RESPONSE geralmente ocorrem quando:

1. **Mudanças significativas** em arquivos principais (App.tsx, contextos, etc.)
2. **Múltiplas instâncias** do servidor rodando simultaneamente
3. **Cache desatualizado** do navegador
4. **Dependências atualizadas** sem limpar o cache
5. **Porta ocupada** - Vite tenta usar porta alternativa (3029, 3030, etc.) mas o navegador ainda aponta para porta antiga
6. **Servidor travado** - processo Node travou mas ainda está ocupando a porta

## 💡 Dicas

- **Sempre use `npm run dev:clean`** após mudanças significativas no código
- **Limpe o cache do navegador** se os erros persistirem
- **Verifique se há múltiplas instâncias** do servidor rodando
- **Use Hard Refresh** (`Ctrl+Shift+R`) quando o app parecer desatualizado

## 🐛 Se os Erros Persistirem

1. **Execute o script de limpeza completa:**
   ```bash
   npm run kill:ports
   ```

2. **Aguarde 10 segundos** para garantir que todos os processos foram encerrados

3. **Feche todas as abas do navegador** com o app

4. **Limpe o cache:**
   ```bash
   npm run clean:cache
   ```

5. **Limpe o cache do navegador completamente** (`Ctrl+Shift+Delete`)

6. **Reinicie o servidor:**
   ```bash
   npm run dev:clean
   ```

7. **Aguarde o servidor iniciar completamente** (veja a mensagem no terminal)

8. **Abra uma nova aba do navegador** em modo anônimo/privado

9. **Acesse a URL correta** - verifique no terminal qual porta o Vite está usando

### Verificar Portas em Uso

Se ainda houver problemas, verifique manualmente:

```powershell
# Ver processos Node
Get-Process -Name "node"

# Ver portas em uso
netstat -ano | findstr :3000
netstat -ano | findstr :3029
netstat -ano | findstr :5173
```

## 📚 Referências

- [Vite HMR Documentation](https://vitejs.dev/guide/api-hmr.html)
- [Vite Server Options](https://vitejs.dev/config/server-options.html)

