# 📋 Resumo da Atualização de Planos

## ✅ O que foi implementado

### 1. **StudentAiPlansPage.tsx** - Planos B2C Atualizados
- ✅ **Plano Mensal**: R$ 34,90/mês (checkout: R$ 35,89)
  - Link: https://pay.cakto.com.br/zeygxve_668421
  - Features: Chat ilimitado, 15 min/dia de voz, análise de fotos ilimitada, treinos personalizados
  
- ✅ **Plano Anual VIP**: R$ 297,00/ano (checkout: R$ 297,99)
  - Link: https://pay.cakto.com.br/wvbkepi_668441
  - Features: Tudo do mensal + economia de R$ 200,00 + garantia de satisfação
  - Parcelamento: 12x de R$ 34,53

### 2. **Script SQL** - Estrutura de Dados
- ✅ Criado `docs/ATUALIZACAO_PLANOS_VENDAS.sql` com:
  - Planos B2C (Mensal e Anual VIP)
  - Planos B2B (Starter Mini, Starter, Growth, Pro)
  - Planos Personal (Team 5, Team 15)
  - Recargas (Ajuda Rápida, Minutos de Reserva, Conversa Ilimitada)
  - Campos de checkout (URLs e preços Cakto)

## 📝 Próximos Passos

### 1. **Executar SQL no Supabase**
```sql
-- Execute o arquivo: docs/ATUALIZACAO_PLANOS_VENDAS.sql
-- No Supabase Dashboard > SQL Editor
```

### 2. **Atualizar PremiumPage.tsx**
- Adicionar seções para:
  - Planos B2B (academias)
  - Planos Personal Trainers
  - Recargas
- Implementar navegação por abas (B2C, B2B, Personal, Recargas)

### 3. **Implementar Lógica de Bloqueio**
- Verificar se trial expirou
- Bloquear acesso à IA se sem plano ativo
- Mostrar apenas tela de pagamento se bloqueado

### 4. **Integração com Cakto**
- Redirecionar para URLs de checkout ao selecionar plano
- Implementar webhook para confirmar pagamento
- Atualizar status de assinatura após pagamento

## 🔗 Links de Checkout

### B2C (Individuais)
- Mensal: https://pay.cakto.com.br/zeygxve_668421
- Anual VIP: https://pay.cakto.com.br/wvbkepi_668441

### B2B (Academias)
- Starter Mini: https://pay.cakto.com.br/3b2kpwc_671196
- Starter: https://pay.cakto.com.br/cemyp2n_668537
- Growth: https://pay.cakto.com.br/vi6djzq_668541
- Pro: https://pay.cakto.com.br/3dis6ds_668546

### Personal Trainers
- Team 5: https://pay.cakto.com.br/3dgheuc_666289
- Team 15: https://pay.cakto.com.br/3etp85e_666303

### Recargas
- Ajuda Rápida: https://pay.cakto.com.br/ihfy8cz_668443
- Minutos de Reserva: https://pay.cakto.com.br/hhxugxb_668446
- Conversa Ilimitada: https://pay.cakto.com.br/trszqtv_668453

## 📊 Estrutura de Dados

### Tabela `plans`
- `id`: Identificador único do plano
- `name`: Nome técnico (ex: 'ai_monthly')
- `display_name`: Nome de exibição (ex: 'Plano Mensal')
- `description`: Descrição completa
- `price_monthly`: Preço mensal
- `price_yearly`: Preço anual (se aplicável)
- `plan_category`: Categoria (b2c_ai, b2b_platform, personal_platform, recharge)
- `features`: Array de features
- `limits`: JSON com limites (max_students, max_prompts_per_month, etc.)
- `checkout_url_monthly`: URL do checkout Cakto (mensal)
- `checkout_url_yearly`: URL do checkout Cakto (anual)
- `checkout_price_monthly`: Preço no checkout (mensal)
- `checkout_price_yearly`: Preço no checkout (anual)

## 🎯 Modelo B2B2C

### Academia (B2B)
- Contrata plano de plataforma (Starter Mini, Starter, Growth, Pro)
- Paga mensalmente pela plataforma
- Recebe código mestre e acesso aos painéis
- Pode criar convites para alunos
- **NÃO paga** pelo uso de IA dos alunos

### Aluno (B2C)
- Recebe convite da academia
- Inicia trial gratuito (7 dias)
- Após trial, escolhe plano individual (Mensal ou Anual)
- Paga diretamente pelo uso da IA
- Academia acompanha engajamento (sem ver pagamentos)

## ⚠️ Pontos de Atenção

1. **Bloqueio após trial**: Implementar verificação clara e bloqueio total sem plano ativo
2. **Separação de cobrança**: Academia paga plataforma; aluno paga IA
3. **CTAs**: Todos os botões devem redirecionar para https://fit-coach-ia.vercel.app/
4. **Foco de vendas**: Página inicial deve focar em B2B (academias)

---

**Última atualização**: 23/12/2025

