# Solução para Erro "Internal Server Error - The server is being restarted or closed"

## 🔍 Problema

O erro `Internal Server Error - The server is being restarted or closed. Request is outdated` ocorre quando:

1. O servidor Vite está sendo reiniciado enquanto há requisições pendentes
2. Múltiplas instâncias do servidor estão tentando rodar simultaneamente
3. O servidor foi fechado abruptamente e o navegador ainda está tentando se conectar
4. O cache do Vite está corrompido

## ✅ Soluções Aplicadas

### 1. Configurações Melhoradas no Vite

- **HMR (Hot Module Replacement)** configurado com mais tentativas de reconexão
- **Timeout aumentado** para evitar falhas prematuras
- **Delays apropriados** no script de inicialização

### 2. Script de Inicialização Melhorado

- Aguarda 3 segundos após limpar processos antes de iniciar
- Verifica se a porta 3000 está realmente livre
- Fornece mensagens claras sobre o que está acontecendo

## 🚀 Como Resolver

### Passo 1: Parar Tudo

**Pressione `Ctrl+C` no terminal** onde o servidor está rodando (se estiver rodando).

### Passo 2: Limpar Completamente

Execute na ordem:

```bash
# 1. Matar todos os processos Node e liberar portas
npm run kill:ports

# 2. Aguarde 5 segundos
# (O script já faz isso, mas aguarde um pouco mais para garantir)

# 3. Limpar cache do Vite
npm run clean:cache
```

### Passo 3: Aguardar

**Aguarde pelo menos 10 segundos** para garantir que:
- Todos os processos foram encerrados
- Todas as portas foram liberadas
- O sistema operacional limpou as conexões

### Passo 4: Reiniciar o Servidor

```bash
npm run dev:clean
```

**IMPORTANTE:** Aguarde o servidor iniciar completamente antes de abrir o navegador. Você verá uma mensagem como:

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Passo 5: Limpar Cache do Navegador

1. **Feche TODAS as abas** do navegador com o app
2. **Limpe o cache:**
   - Pressione `Ctrl+Shift+Delete`
   - Selecione "Todo o período"
   - Marque "Imagens e arquivos em cache"
   - Clique em "Limpar dados"
3. **Abra uma nova aba** (ou modo anônimo)
4. **Acesse:** `http://localhost:3000`

## 🔧 Se o Erro Persistir

### Opção 1: Reiniciar o Terminal

1. Feche completamente o terminal/PowerShell
2. Abra um novo terminal
3. Execute:
   ```bash
   npm run dev:clean
   ```

### Opção 2: Verificar Processos Manualmente

```powershell
# Ver processos Node
Get-Process -Name "node"

# Ver portas em uso
netstat -ano | findstr :3000

# Se encontrar processos, mate-os manualmente:
# Stop-Process -Id <PID> -Force
```

### Opção 3: Reiniciar o Computador

Se nada funcionar, pode haver processos travados no sistema operacional. Reinicie o computador e tente novamente.

## 📝 Comandos Úteis

```bash
# Limpeza completa e reinício
npm run dev:clean

# Apenas matar processos
npm run kill:ports

# Apenas limpar cache
npm run clean:cache

# Forçar re-otimização
npm run dev:force
```

## ⚠️ Prevenção

Para evitar este erro no futuro:

1. **Sempre use `Ctrl+C`** para parar o servidor (não feche o terminal abruptamente)
2. **Aguarde alguns segundos** antes de reiniciar após parar
3. **Use `npm run dev:clean`** em vez de `npm run dev` quando houver problemas
4. **Não abra múltiplas instâncias** do servidor simultaneamente

## 💡 Dica

Se você está desenvolvendo e precisa reiniciar o servidor frequentemente:

1. Use `npm run dev:clean` sempre que reiniciar
2. Mantenha uma aba do navegador em modo anônimo para testes
3. Use Hard Refresh (`Ctrl+Shift+R`) após cada reinício

## 🐛 Diagnóstico

Se o erro continuar aparecendo:

1. Verifique se há múltiplos terminais com `npm run dev` rodando
2. Verifique se há processos Node órfãos:
   ```powershell
   Get-Process -Name "node"
   ```
3. Verifique se a porta 3000 está realmente livre:
   ```powershell
   netstat -ano | findstr :3000
   ```
4. Tente usar uma porta diferente temporariamente para testar:
   ```bash
   vite --port 3001
   ```

Se funcionar na porta 3001, o problema é algo ocupando a porta 3000.

