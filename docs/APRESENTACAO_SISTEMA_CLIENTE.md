# 📱 FitCoach.IA - Apresentação do Sistema para Cliente

## 🎯 Visão Geral

O **FitCoach.IA** é uma plataforma completa de treinamento e nutrição inteligente que utiliza Inteligência Artificial para personalizar planos de treino e alimentação, oferecendo suporte multimodal (texto, voz e análise de imagens).

---

## 🚀 Como o Sistema Funciona

### 1. **Acesso Inicial e Cadastro**

#### Para Clientes B2C (Individuais)

1. **Acesso à Landing Page**
   - URL: `https://fit-coach-ia.vercel.app/#/landing`
   - Página inicial com informações sobre o sistema
   - Opção de cadastro ou login

2. **Processo de Cadastro**
   - Cliente preenche dados básicos (nome, email, senha)
   - Pode escolher testar o sistema **COM IA** ou **SEM IA** (trial de 3 dias)
   - Pode inserir código de cupom se tiver
   - Sistema cria conta automaticamente

3. **Primeiro Acesso Após Cadastro**
   - Cliente é redirecionado para a **HomePage** (página inicial do app)
   - Pode explorar funcionalidades básicas
   - Se escolheu trial COM IA, tem acesso completo por 3 dias
   - Se escolheu trial SEM IA, tem acesso limitado por 3 dias

---

### 2. **Navegação e Funcionalidades**

#### Menu Lateral

O menu lateral oferece acesso a todas as funcionalidades:

- **🏠 Home**: Página inicial com visão geral
- **💚 Meu Plano de Treino**: Planos personalizados de exercícios
- **📚 Biblioteca de Exercícios**: Catálogo completo de exercícios
- **🏆 Desafios**: Desafios de treino e nutrição
- **📊 Análise de Progresso**: Acompanhamento de evolução
- **📈 Relatórios IA**: Relatórios gerados por IA
- **✨ Gerador de Planos**: Criação de planos personalizados
- **🍽️ Refeição Inteligente**: Sugestões de refeições
- **📷 Analisador de Pratos**: Análise de fotos de comida por IA
- **📅 Calendário**: Agendamento de treinos e refeições
- **💬 Comunidade**: Interação com outros usuários
- **👥 Treinos em Grupo**: Treinos coletivos
- **💳 Minha Assinatura**: Gerenciamento de assinatura e billing
- **⭐ Planos**: Link direto para página de vendas externa

---

### 3. **Sistema de Planos e Assinaturas**

#### Antes da Compra

- Cliente tem acesso à **HomePage** com funcionalidades básicas
- Pode explorar o sistema durante o período de trial (3 dias)
- Botão "Planos" no menu redireciona para página de vendas externa

#### Após a Compra

Quando o cliente **compra um plano** e a assinatura é ativada:

1. **Status da Assinatura**
   - `subscriptionStatus` muda para `'active'`
   - `planType` é atualizado (ex: 'monthly', 'annual_vip')
   - Sistema identifica automaticamente a assinatura ativa

2. **Redirecionamento Automático**
   - Cliente é **automaticamente redirecionado** para o **Dashboard Administrativo**
   - Acesso completo a todas as funcionalidades premium
   - Gerenciamento de assinatura e configurações avançadas

3. **Funcionalidades Premium**
   - Análise de imagens ilimitada
   - Chat com IA ilimitado
   - Planos de treino personalizados
   - Relatórios avançados
   - Suporte prioritário

---

### 4. **Tipos de Usuários e Acesso**

#### Cliente B2C (Individual)
- **Sem assinatura**: Acesso à HomePage básica
- **Com assinatura ativa**: Acesso ao Dashboard Administrativo
- Pode gerenciar sua própria assinatura
- Acesso a todas as funcionalidades premium

#### Aluno de Academia (B2B2C)
- Vinculado a uma academia
- Recebe convite da academia
- Trial de IA de 7 dias
- Acesso limitado conforme plano da academia

#### Personal Trainer
- Dashboard focado em gestão de alunos
- Criação de planos para alunos
- Acompanhamento de progresso dos alunos

#### Administrador de Academia
- Dashboard administrativo completo
- Gerenciamento de alunos e treinadores
- Controle de assinaturas da academia

---

### 5. **Fluxo de Compra e Ativação**

```
1. Cliente acessa landing page
   ↓
2. Faz cadastro (trial de 3 dias)
   ↓
3. Explora sistema na HomePage
   ↓
4. Clica em "Planos" → Redirecionado para página de vendas
   ↓
5. Escolhe e compra um plano
   ↓
6. Webhook processa pagamento
   ↓
7. Assinatura é ativada automaticamente
   ↓
8. Cliente faz login novamente
   ↓
9. Sistema detecta assinatura ativa
   ↓
10. Redireciona para Dashboard Administrativo
```

---

### 6. **Sistema de IA Multimodal**

O FitCoach.IA oferece três formas de interação:

#### 📝 **Chat por Texto**
- Conversas ilimitadas (com plano ativo)
- Respostas personalizadas baseadas no perfil
- Sugestões de treino e nutrição

#### 🎤 **Chat por Voz**
- Interação por voz com o assistente
- Análise de voz para melhor compreensão
- Limite diário de minutos (varia por plano)

#### 📷 **Análise de Imagens**
- Envio de fotos de comida
- IA analisa e sugere melhorias nutricionais
- Análise ilimitada (com plano ativo)

---

### 7. **Gerenciamento de Assinatura**

#### Página de Billing (`/billing`)

O cliente pode:

- **Ver status da assinatura atual**
  - Plano ativo
  - Data de renovação
  - Limites de uso

- **Gerenciar assinatura**
  - Cancelar assinatura
  - Alterar plano
  - Ver histórico de pagamentos

- **Ver uso de recursos**
  - Requisições de IA usadas/mês
  - Análises de imagem usadas/mês
  - Minutos de voz usados/dia

- **Acessar página de vendas**
  - Botão "Ver Planos" redireciona para página externa
  - Permite comprar novos planos ou fazer upgrade

---

### 8. **Segurança e Privacidade**

- **Autenticação Segura**: Login via Supabase Auth
- **Dados Protegidos**: Criptografia de dados sensíveis
- **RLS (Row Level Security)**: Controle de acesso a nível de banco
- **Sessões Seguras**: Tokens de autenticação com expiração

---

### 9. **Responsividade**

O sistema é totalmente responsivo:

- **📱 Mobile**: Interface otimizada para smartphones
- **📱 Tablet**: Layout adaptado para tablets
- **💻 Desktop**: Experiência completa em desktop

---

### 10. **Suporte e Atendimento**

- **Suporte Prioritário**: Para clientes com plano ativo
- **Documentação**: Guias e tutoriais disponíveis
- **Comunidade**: Fórum de discussão e interação

---

## 🔑 Pontos Importantes para o Cliente

### ✅ **O que o cliente pode fazer SEM assinatura:**
- Explorar a HomePage
- Ver funcionalidades básicas
- Testar durante 3 dias (trial)

### ✅ **O que o cliente pode fazer COM assinatura ativa:**
- Acesso ao Dashboard Administrativo completo
- Todas as funcionalidades premium
- IA multimodal ilimitada (conforme plano)
- Gerenciamento completo de assinatura
- Suporte prioritário

### ⚠️ **Importante:**
- Clientes B2C **sem assinatura** veem a **HomePage**
- Clientes B2C **com assinatura ativa** veem o **Dashboard Administrativo**
- O botão "Planos" sempre redireciona para a página de vendas externa
- Não há exibição de planos internamente no app

---

## 📞 Contato e Suporte

Para dúvidas ou suporte:
- Acesse a página de **Minha Assinatura** no menu
- Entre em contato através da página de vendas
- Utilize o suporte prioritário (clientes com plano ativo)

---

## 🎉 Conclusão

O **FitCoach.IA** oferece uma experiência completa e personalizada de treinamento e nutrição, utilizando Inteligência Artificial para adaptar-se às necessidades de cada usuário. O sistema é intuitivo, seguro e escalável, proporcionando resultados efetivos para todos os tipos de usuários.

---

**Versão do Documento**: 1.0  
**Data**: Dezembro 2024  
**Sistema**: FitCoach.IA
