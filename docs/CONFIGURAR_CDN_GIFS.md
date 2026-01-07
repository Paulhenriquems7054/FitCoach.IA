# Configuração de CDN para GIFs

## Problema

O Vercel tem limites de tamanho para arquivos estáticos:
- **Plano Hobby**: 100 MB
- **Plano Pro**: 1 GB

O conjunto de GIFs do FitCoach.IA totaliza aproximadamente **1.4 GB**, excedendo os limites do Vercel. Isso causa erros 404 ao tentar carregar os GIFs no Vercel.

## Solução: CDN Externo

Implementamos um sistema de fallback automático que:
1. **Tenta primeiro** carregar os GIFs do servidor local/Vercel
2. **Se falhar (404)**, automaticamente tenta carregar de um CDN externo configurado

## Como Configurar

> 📖 **Guia passo a passo completo:** Veja [GUIA_R2_CLOUDFLARE.md](./GUIA_R2_CLOUDFLARE.md) para instruções detalhadas do zero ao deploy.

### Opção 1: Cloudflare R2 (Recomendado - Gratuito)

1. **Siga o guia completo:** [GUIA_R2_CLOUDFLARE.md](./GUIA_R2_CLOUDFLARE.md)
   
   **Resumo rápido:**
   - Ativar R2 no Cloudflare (gratuito até 10 GB)
   - Criar bucket `fitcoach-gifs`
   - Configurar domínio público (ex: `https://pub-xxxxx.r2.dev`)
   - Fazer upload dos GIFs mantendo estrutura `GIFS/...`
   - Configurar `VITE_GIF_CDN_URL` no Vercel com a URL do R2

### Opção 2: AWS S3 + CloudFront

1. **Criar bucket no S3:**
   - Acesse: https://console.aws.amazon.com/s3/
   - Crie um bucket (ex: `fitcoach-gifs`)
   - Configure como público

2. **Fazer upload dos GIFs:**
   - Mantenha a estrutura: `GIFS/Abdomen/`, `GIFS/Biceps/`, etc.

3. **Configurar CloudFront (opcional, mas recomendado):**
   - Crie uma distribuição CloudFront apontando para o bucket S3
   - Isso melhora a performance global

4. **Configurar variável de ambiente:**
   ```bash
   VITE_GIF_CDN_URL=https://seu-cloudfront-domain.cloudfront.net
   ```

### Opção 3: Outros CDNs

Qualquer CDN que permita servir arquivos estáticos pode ser usado:
- **Bunny CDN**
- **DigitalOcean Spaces**
- **Backblaze B2**
- **Azure Blob Storage**

Basta configurar a URL base na variável `VITE_GIF_CDN_URL`.

## Estrutura de Pastas no CDN

Os GIFs devem manter a mesma estrutura de pastas que no projeto:

```
CDN_ROOT/
├── GIFS/
│   ├── Abdomen/
│   │   ├── Abdominais.gif
│   │   ├── Abdominal Bicicleta.gif
│   │   └── ...
│   ├── Biceps/
│   │   ├── maquina-de-rosca-direta.gif
│   │   └── ...
│   └── ...
```

## Como Funciona

1. **Carregamento Local Primeiro:**
   - O componente `SimpleGifDisplay` tenta primeiro carregar de `/GIFS/...`
   - Isso funciona em desenvolvimento local e no Vercel (se os arquivos estiverem disponíveis)

2. **Fallback Automático para CDN:**
   - Se o carregamento local falhar (erro 404), automaticamente tenta o CDN
   - A URL do CDN é construída como: `${VITE_GIF_CDN_URL}/GIFS/...`

3. **Transparente para o Usuário:**
   - O usuário não percebe a diferença
   - O GIF simplesmente carrega do CDN se o local não estiver disponível

## Testando

1. **Sem CDN configurado:**
   - Os GIFs tentarão carregar apenas do servidor local/Vercel
   - Se falharem, mostrarão "GIF não disponível"

2. **Com CDN configurado:**
   - Os GIFs tentarão primeiro do servidor local
   - Se falharem, automaticamente tentarão do CDN
   - Você verá logs no console indicando quando o CDN é usado

## Logs de Debug

No console do navegador, você verá:
- `[SimpleGifDisplay] 📍 Caminho recebido: ...` - Quando um GIF é solicitado
- `[SimpleGifDisplay] 🔗 URLs disponíveis: ...` - URLs local e CDN disponíveis
- `[SimpleGifDisplay] ❌ Erro ao carregar GIF: ...` - Quando o local falha
- `[SimpleGifDisplay] 🔄 Tentando CDN externo: ...` - Quando tenta CDN
- `[SimpleGifDisplay] ✅ GIF carregado com sucesso: ...` - Quando carrega com sucesso

## Custos

- **Cloudflare R2**: Gratuito até 10 GB de armazenamento e 1 milhão de operações/mês
- **AWS S3**: ~$0.023 por GB/mês + custos de transferência
- **Outros CDNs**: Variam, mas geralmente são muito baratos para arquivos estáticos

## Recomendação

Para este projeto, recomendamos **Cloudflare R2** porque:
- ✅ Gratuito para volumes pequenos/médios
- ✅ Performance excelente (rede global)
- ✅ Fácil de configurar
- ✅ Sem custos de egress (saída de dados) até certo limite

