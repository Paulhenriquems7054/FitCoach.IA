# Solução para Erro: Port 3000 is already in use

## O que causa esse erro?

Este erro acontece quando:
1. **Servidor já está rodando**: Você já iniciou o servidor em outro terminal/processo
2. **Processo não foi encerrado**: O servidor anterior não foi fechado corretamente (Ctrl+C não funcionou)
3. **Outra aplicação**: Outro programa está usando a porta 3000

## Soluções Rápidas

### Opção 1: Usar o script de limpeza (Recomendado)
```bash
npm run dev:clean
```
Este comando automaticamente:
- Encerra processos na porta 3000
- Limpa cache do Vite
- Inicia o servidor novamente

### Opção 2: Encerrar processo manualmente (Windows)

1. **Encontrar o processo:**
```powershell
netstat -ano | findstr :3000
```

2. **Encerrar o processo:**
```powershell
taskkill /PID <NUMERO_DO_PID> /F
```

Exemplo:
```powershell
taskkill /PID 2908 /F
taskkill /PID 13904 /F
```

### Opção 3: Usar outra porta

Se você não conseguir liberar a porta 3000, pode usar outra porta:

1. Edite `vite.config.ts` e mude a porta:
```typescript
server: {
  port: 3001, // ou qualquer outra porta disponível
  // ...
}
```

2. Ou use variável de ambiente:
```bash
# Windows PowerShell
$env:PORT=3001; npm run dev

# Windows CMD
set PORT=3001 && npm run dev
```

## Prevenção

Para evitar esse problema no futuro:

1. **Sempre feche o servidor corretamente:**
   - Use `Ctrl+C` no terminal onde o servidor está rodando
   - Aguarde a mensagem de encerramento

2. **Verifique antes de iniciar:**
   ```powershell
   netstat -ano | findstr :3000
   ```
   Se houver resultados, encerre os processos antes de iniciar novamente

3. **Use o script de limpeza:**
   ```bash
   npm run dev:clean
   ```
   Este é o método mais seguro e confiável.

## Script Automático

O projeto já tem um script `start-dev.ps1` que faz tudo automaticamente. Use:
```bash
npm run dev:clean
```

