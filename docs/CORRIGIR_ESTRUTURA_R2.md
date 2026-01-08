# Corrigir Estrutura de Arquivos no R2

## ⚠️ Problema Identificado

Os arquivos foram enviados para a **raiz do bucket**, mas precisam estar na estrutura:
```
GIFS/
├── Abdomen/
│   ├── Abdominais.gif
│   ├── Abdominal Bicicleta.gif
│   └── ...
├── Biceps/
│   ├── rosca-biceps.gif
│   └── ...
└── ...
```

## 🔧 Solução: Reorganizar Arquivos no R2

Você tem duas opções:

### Opção 1: Mover Arquivos no Painel R2 (Recomendado - Mais Rápido)

1. **No painel do R2:**
   - Selecione todos os arquivos que estão na raiz
   - Use a opção de mover/reorganizar (se disponível)
   - Ou delete os arquivos da raiz e faça upload novamente com a estrutura correta

2. **Criar estrutura de pastas:**
   - No painel do R2, você pode criar "prefixos" que funcionam como pastas
   - Crie: `GIFS/Abdomen/`
   - Mova os arquivos de Abdomen para lá

### Opção 2: Deletar e Fazer Upload Novamente (Mais Confiável)

1. **Deletar arquivos atuais:**
   - No painel do R2, selecione todos os arquivos na raiz
   - Delete-os

2. **Fazer upload com estrutura correta:**
   - Use o script `upload-gifs-to-r2.ps1` que já mantém a estrutura correta
   - Ou use o Wrangler CLI com o caminho completo:
     ```bash
     wrangler r2 object put fitcoach-gifs/GIFS/Abdomen/Abdominais.gif --file public/GIFS/Abdomen/Abdominais.gif
     ```

## 📋 Checklist de Estrutura Correta

Após reorganizar, você deve ver no R2:

```
fitcoach-gifs/
├── GIFS/
│   ├── Abdomen/
│   │   ├── Abdominais.gif
│   │   ├── Abdominal Bicicleta.gif
│   │   └── ... (todos os GIFs de Abdomen)
│   ├── Biceps/
│   │   ├── rosca-biceps.gif
│   │   └── ... (todos os GIFs de Biceps)
│   ├── Costas/
│   ├── Peitoral/
│   └── ... (outros grupos)
```

## ✅ Próximos Passos Após Corrigir

1. **Habilitar Acesso Público** (veja abaixo)
2. **Configurar variável de ambiente no Vercel**
3. **Fazer deploy**

