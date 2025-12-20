# Solução para Problema com Vite

## Problema
O Vite não está sendo instalado localmente no `node_modules`, mesmo após múltiplas tentativas com npm e yarn.

## Soluções Alternativas

### Solução 1: Instalar Vite Globalmente
```bash
npm install -g vite@5.4.21
```

Depois, modifique o `package.json`:
```json
{
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 3000"
  }
}
```

### Solução 2: Usar npx com versão específica
Modifique o `package.json`:
```json
{
  "scripts": {
    "dev": "npx vite@5.4.21 --host 0.0.0.0 --port 3000"
  }
}
```

**Nota:** Esta solução pode ter problemas porque o `vite.config.ts` precisa do módulo `vite` localmente.

### Solução 3: Verificar Permissões e Antivírus
1. Verifique se há um antivírus bloqueando a instalação
2. Execute o PowerShell como Administrador
3. Verifique permissões da pasta `node_modules`

### Solução 4: Reinstalar Node.js e npm
1. Desinstale o Node.js atual
2. Baixe e instale a versão LTS mais recente do Node.js
3. Reinstale as dependências:
```bash
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

### Solução 5: Usar Yarn (Recomendado)
Se o npm não estiver funcionando, use Yarn:
```bash
# Instalar Yarn globalmente (se não tiver)
npm install -g yarn

# Remover node_modules e lock files
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
Remove-Item -Force yarn.lock

# Instalar dependências
yarn install

# Iniciar servidor
yarn dev
```

### Solução 6: Verificar Espaço em Disco
Certifique-se de que há espaço suficiente no disco:
```powershell
Get-PSDrive C | Select-Object Used, Free
```

## Status Atual
- ✅ Vite está no `package.json`
- ❌ Vite não está sendo instalado no `node_modules`
- ✅ Outras dependências estão instaladas
- ❌ Servidor não está iniciando

## Próximos Passos
1. Tente a Solução 5 (Yarn) primeiro
2. Se não funcionar, tente a Solução 1 (Vite global)
3. Se ainda não funcionar, verifique permissões e antivírus (Solução 3)

