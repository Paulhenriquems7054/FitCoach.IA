# Estrutura de GIFs do Projeto

## 📁 Organização

O projeto usa **apenas a pasta `public/GIFS`** para armazenar os GIFs animados dos exercícios.

### Estrutura de Pastas

```
public/GIFS/
├── Abdômen (18)-20241202T155424Z-001/
│   └── Abdômen (18)/
│       └── [arquivos.gif]
├── Bíceps (51)-20241202T155806Z-001/
│   └── Bíceps (51)/
│       └── [arquivos.gif]
└── ...
```

### Formato de Nomenclatura

- **Pasta externa**: `[Grupo] ([número])-[timestamp]/`
- **Pasta interna**: `[Grupo] ([número])/`
- **Arquivos**: `[Nome do Exercício].gif`

## ➕ Como Adicionar Novos GIFs

### Método 1: Adicionar em pasta existente

1. Localize a pasta do grupo muscular em `public/GIFS/`
2. Navegue até a subpasta interna (ex: `Bíceps (51)-20241202T155806Z-001/Bíceps (51)/`)
3. Adicione o novo arquivo `.gif`
4. Faça commit normalmente

### Método 2: Criar novo grupo

1. Crie uma nova pasta em `public/GIFS/` com o formato:
   ```
   [Nome do Grupo]-[timestamp]/
   └── [Nome do Grupo]/
       └── [arquivos.gif]
   ```
2. Use timestamp no formato: `yyyyMMddTHHmmssZ`
   - Exemplo: `20241202T155424Z-001`
3. Adicione os arquivos `.gif` na subpasta interna
4. Atualize `services/exerciseGifService.ts` com o novo grupo

## 🔧 Atualização do Serviço

Quando adicionar novos grupos ou arquivos, atualize:

1. **`services/exerciseGifService.ts`**:
   - Adicione o grupo em `muscleGroupFolders`
   - Adicione a lista de arquivos em `availableGifsByGroup`
   - Adicione o mapeamento em `groupNameMap`

## 📝 Notas Importantes

- ✅ **Apenas `public/GIFS` é versionada no Git**
- ❌ A pasta `Gifs Animados` (se existir localmente) **não é versionada**
- 🎯 Todos os GIFs devem estar em `public/GIFS` para serem servidos pela aplicação
- 📦 A pasta `public/GIFS` é servida diretamente pelo Vite na raiz (`/GIFS/...`)

## 🔍 Verificação

Para verificar se todos os GIFs estão corretos:

```powershell
# Contar arquivos
Get-ChildItem -Path "public\GIFS" -Recurse -Filter "*.gif" -File | Measure-Object

# Verificar estrutura
Get-ChildItem -Path "public\GIFS" -Directory
```

