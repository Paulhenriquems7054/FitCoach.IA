# 🔧 Resolução Rápida: Erro "Server is being restarted"

## ⚡ Solução Imediata (3 Passos)

### 1️⃣ Pare TUDO
```bash
# Pressione Ctrl+C no terminal onde o servidor está rodando
# Se não funcionar, feche o terminal completamente
```

### 2️⃣ Execute Limpeza Completa
```bash
npm run kill:ports
```

**Aguarde 10 segundos** ⏱️

### 3️⃣ Reinicie com Limpeza
```bash
npm run dev:clean
```

**AGUARDE** até ver esta mensagem no terminal:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:3000/
```

**SÓ ENTÃO** abra o navegador em uma **nova aba** (ou modo anônimo).

---

## 🚨 Se AINDA Não Funcionar

### Opção A: Limpeza Manual Completa

```powershell
# 1. Matar todos os processos Node
Get-Process -Name "node" | Stop-Process -Force

# 2. Aguardar 10 segundos
Start-Sleep -Seconds 10

# 3. Limpar cache do Vite
Remove-Item -Path "node_modules/.vite" -Recurse -Force -ErrorAction SilentlyContinue

# 4. Limpar timestamps
Get-ChildItem -Path "." -Filter "vite.config.ts.timestamp-*" | Remove-Item -Force

# 5. Reiniciar
npm run dev
```

### Opção B: Reiniciar Terminal

1. **Feche completamente** o terminal/PowerShell
2. **Abra um novo terminal**
3. Execute:
   ```bash
   npm run dev:clean
   ```

### Opção C: Verificar Processos

```powershell
# Ver processos Node
Get-Process -Name "node"

# Se houver processos, mate-os:
Stop-Process -Id <PID> -Force

# Verificar porta 3000
netstat -ano | findstr :3000
```

---

## ✅ Verificação de Sucesso

O servidor está funcionando corretamente quando você vê:

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

**E NÃO vê:**
- ❌ "Internal Server Error"
- ❌ "The server is being restarted"
- ❌ "Request is outdated"
- ❌ Erros 504

---

## 💡 Dicas de Prevenção

1. **Sempre use `Ctrl+C`** para parar o servidor (não feche o terminal)
2. **Aguarde 5-10 segundos** antes de reiniciar
3. **Use `npm run dev:clean`** em vez de `npm run dev` quando houver problemas
4. **Não abra o navegador** até ver a mensagem "ready"
5. **Limpe o cache do navegador** se os erros persistirem

---

## 🆘 Último Recurso

Se **NADA** funcionar:

1. **Reinicie o computador**
2. **Aguarde 1 minuto** após reiniciar
3. **Execute:**
   ```bash
   npm run kill:ports
   npm run clean:cache
   npm run dev:clean
   ```

