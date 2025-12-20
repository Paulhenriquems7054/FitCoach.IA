# 🧹 Limpeza de Arquivos .env

## ⚠️ Problema Identificado

Foram encontrados múltiplos arquivos de ambiente que podem causar confusão:
- `.envv` (typo - não será carregado pelo Vite)
- `.env.local` (será carregado)
- `.env.local.backup` (não será carregado pelo Vite)

## 📋 Ordem de Precedência do Vite

O Vite carrega arquivos `.env` nesta ordem (do mais específico para o menos específico):

1. `.env.[mode].local` (ex: `.env.development.local`) - **MAIS ESPECÍFICO**
2. `.env.local` - **ESPECÍFICO PARA AMBIENTE LOCAL**
3. `.env.[mode]` (ex: `.env.development`)
4. `.env` - **ARQUIVO BASE**

**Valores em arquivos mais específicos sobrescrevem valores em arquivos menos específicos.**

## ✅ Solução Recomendada

### 1. Manter apenas `.env.local` como arquivo ativo

O arquivo `.env.local` é o correto para desenvolvimento local e:
- ✅ É carregado pelo Vite automaticamente
- ✅ Está no `.gitignore` (não será commitado)
- ✅ Sobrescreve valores do `.env` base

### 2. Remover ou renomear arquivos problemáticos

**Opção A: Remover completamente**
```powershell
# Remover arquivo com typo
Remove-Item .envv -ErrorAction SilentlyContinue

# Remover backup (se não precisar mais)
Remove-Item .env.local.backup -ErrorAction SilentlyContinue
```

**Opção B: Mover para pasta de backup**
```powershell
# Criar pasta de backups
New-Item -ItemType Directory -Path "backups" -Force

# Mover arquivos
Move-Item .envv backups\ -ErrorAction SilentlyContinue
Move-Item .env.local.backup backups\ -ErrorAction SilentlyContinue
```

### 3. Verificar conteúdo do `.env.local`

Certifique-se de que o `.env.local` contém todas as variáveis necessárias:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-key-aqui

# Gemini API Key
VITE_GEMINI_API_KEY=sua-chave-gemini-aqui

# Backend API URL (opcional)
VITE_AI_BACKEND_URL=http://localhost:3001
```

## 🔍 Como Verificar Qual Arquivo Está Sendo Usado

Para verificar quais variáveis estão sendo carregadas:

1. **No código:**
   ```typescript
   console.log('VITE_GEMINI_API_KEY:', import.meta.env.VITE_GEMINI_API_KEY);
   ```

2. **No terminal (após iniciar o servidor):**
   ```powershell
   # O Vite mostra no console quais arquivos .env foram carregados
   ```

## ⚠️ Possíveis Problemas com Múltiplos Arquivos

1. **Confusão sobre qual arquivo está ativo**
   - Difícil saber qual valor está sendo usado
   - Pode causar bugs difíceis de rastrear

2. **Conflitos de valores**
   - Se `.env.local` e `.env` tiverem valores diferentes, o `.env.local` vence
   - Mas se você editar o `.env` esperando que mude, não vai funcionar

3. **Arquivo `.envv` não é carregado**
   - Se você estava usando `.envv` pensando que era `.env`, as variáveis não estão sendo carregadas

## ✅ Checklist de Limpeza

- [ ] Verificar se `.env.local` tem todas as variáveis necessárias
- [ ] Remover ou mover `.envv` para backup
- [ ] Remover ou mover `.env.local.backup` para backup
- [ ] Verificar se `.env` (se existir) tem valores base corretos
- [ ] Reiniciar o servidor de desenvolvimento após limpeza
- [ ] Testar se as variáveis estão sendo carregadas corretamente

## 📝 Estrutura Final Recomendada

```
FitCoach.IA/
├── .env                    # Valores base (opcional, pode estar no git)
├── .env.local              # Valores locais (NUNCA no git) ✅ USAR ESTE
├── .env.example            # Template de exemplo (no git)
└── backups/                # Backups antigos (opcional)
    ├── .envv
    └── .env.local.backup
```

