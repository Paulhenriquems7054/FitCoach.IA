# Solução para Erro "Port 3000 is already in use"

## 🔍 Problema

O erro `Error: Port 3000 is already in use` ocorre quando:
- Um processo Node anterior não foi encerrado corretamente
- Outro aplicativo está usando a porta 3000
- O servidor Vite não foi finalizado adequadamente (Ctrl+C não funcionou)

## ✅ Soluções Implementadas

### 1. Script Automático (Recomendado)

O comando `npm run dev` agora **automaticamente**:
- Verifica se a porta 3000 está ocupada
- Encerra processos que estão usando a porta
- Aguarda 1 segundo para garantir liberação
- Inicia o servidor Vite

**Basta executar:**
```bash
npm run dev
```

### 2. Script Manual

Se precisar liberar a porta manualmente:

```bash
npm run kill:port3000
```

Ou diretamente:
```powershell
.\kill-port-3000.ps1
```

### 3. Configuração do Vite

O `vite.config.ts` foi configurado com:
- `strictPort: false` - Permite usar porta alternativa se 3000 estiver ocupada
- O Vite tentará usar 3001, 3002, etc. automaticamente se 3000 estiver ocupada

## 🛠️ Soluções Manuais (se necessário)

### Opção 1: Encerrar processo manualmente

```powershell
# Encontrar processo na porta 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess

# Encerrar processo (substitua PID pelo número encontrado)
Stop-Process -Id <PID> -Force
```

### Opção 2: Encerrar todos os processos Node

```powershell
Get-Process -Name "node" | Stop-Process -Force
```

### Opção 3: Usar porta alternativa

Edite `vite.config.ts` e mude a porta:
```typescript
server: {
  port: 3001, // ou outra porta disponível
  // ...
}
```

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia dev server (libera porta 3000 automaticamente)
- `npm run dev:clean` - Limpa cache e processos antes de iniciar
- `npm run kill:port3000` - Libera apenas a porta 3000
- `npm run kill:ports` - Libera todas as portas comuns do Vite

## 🔧 Prevenção

Para evitar o problema no futuro:

1. **Sempre use Ctrl+C** para encerrar o servidor (não feche o terminal diretamente)
2. **Aguarde alguns segundos** após encerrar antes de iniciar novamente
3. **Use `npm run dev:clean`** se o problema persistir

## ⚠️ Nota Importante

Se o erro persistir mesmo após executar os scripts:

1. Verifique se há outros aplicativos usando a porta 3000:
   ```powershell
   netstat -ano | findstr :3000
   ```

2. Reinicie o terminal/PowerShell

3. Reinicie o computador (último recurso)

