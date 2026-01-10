# 📘 Guia Completo: FitCoach.IA - Sistema de Gestão para Academias

## 🎯 Visão Geral

Este documento explica **passo a passo** como funciona o sistema FitCoach.IA desde a aquisição do plano até o acesso completo de todos os usuários (administradores, alunos, professores e recepcionistas).

---

## 📋 Índice

1. [Aquisição do Plano](#1-aquisição-do-plano)
2. [Primeiro Acesso do Administrador](#2-primeiro-acesso-do-administrador)
3. [Configuração da Academia](#3-configuração-da-academia)
4. [Cadastro de Usuários - Duas Opções](#4-cadastro-de-usuários)
5. [Processo de Login](#5-processo-de-login)
6. [Comparação: Importação vs Convites](#6-comparação-importação-vs-convites)
7. [Exemplo Prático Completo](#7-exemplo-prático-completo)

---

## 1️⃣ Aquisição do Plano

### 📊 Planos Disponíveis

| Plano | Preço Mensal | Nº de Licenças | Ideal Para |
|-------|--------------|----------------|------------|
| **Starter Mini** | R$ 149,90 | 10 alunos | Academias pequenas |
| **Pack Starter** | R$ 299,90 | 20 alunos | Academias iniciantes |
| **Pack Growth** | R$ 649,90 | 50 alunos | Academias em expansão |
| **Pack Pro** | R$ 1.199,90 | 100 alunos | Academias grandes |

### 🔄 Processo de Compra

1. **Acesso à Página de Vendas**
   - URL: `https://fit-coach-ia.vercel.app/premium`
   - Escolha do plano adequado ao número de alunos

2. **Pagamento via Cakto**
   - Redirecionamento automático para plataforma de pagamento
   - Processamento seguro do pagamento

3. **Processamento Automático**
   - ✅ **Sistema cria automaticamente:**
     - Empresa na base de dados
     - Código mestre único (ex: `ACADEMIA-ABC123`)
     - Código de convite padrão
     - Vínculo do email do pagador como administrador

### 📧 O que a Academia Recebe por Email

Após a compra confirmada, a academia recebe um email automático com:

- ✅ **Código Mestre**: `ACADEMIA-ABC123` (identificador único da academia)
- ✅ **Código de Convite Padrão**: `ABC123` (para primeiro acesso)
- ✅ **Link do App**: `https://fit-coach-ia.vercel.app/`
- ✅ **Link Direto com Código**: `https://fit-coach-ia.vercel.app/#/login?invite=ABC123`
- ✅ **Instruções de uso completas**

---

## 2️⃣ Primeiro Acesso do Administrador

O administrador tem **duas formas** de acessar o sistema pela primeira vez:

### Opção A: Cadastro com Código Mestre (Recomendado)

1. Acesse: `https://fit-coach-ia.vercel.app/`
2. Clique em **"Criar Conta"** ou **"Login"**
3. No campo de código, insira o **Código Mestre** recebido por email
4. Preencha os dados:
   - Nome completo
   - Email
   - Senha
5. Clique em **"Criar Conta"**

**Resultado:** O sistema cria automaticamente seu perfil como administrador da academia.

### Opção B: Login Direto (se já tiver conta)

1. Acesse a página de login
2. Use seu email e senha cadastrados
3. O sistema detecta automaticamente seu vínculo com a empresa e concede acesso administrativo

---

## 3️⃣ Configuração da Academia

Após fazer login, o administrador deve configurar os dados da academia:

### 📍 Onde Configurar

Acesse: **Configurações** → **Configuração da Academia**

### 📝 Dados Obrigatórios

- **Nome da Academia**
- **CNPJ**
- **Telefone de Contato**
- **Endereço Completo**
  - Rua/Avenida
  - Número
  - Complemento
  - Bairro
  - Cidade
  - Estado (UF)
  - CEP

### 🎨 Personalização (Opcional)

- **Logo da Academia**
- **Cores do Tema** (cores primária, secundária e de destaque)
- **QR Code** para distribuição aos alunos

**Todas essas informações ficam salvas e vinculadas à sua empresa.**

---

## 4️⃣ Cadastro de Usuários

O administrador tem **DUAS OPÇÕES** para dar acesso a alunos, professores e recepcionistas:

### 🔹 Opção 1: Sistema de Convites (RECOMENDADO)

#### ✅ Vantagens
- Alunos recebem **trial gratuito de 3 dias de IA**
- Processo mais profissional
- Link personalizado por aluno
- Histórico de uso dos convites

#### 📋 Como Funciona

**Para Alunos:**

1. Acesse: **Gerenciamento de Usuários**
2. Clique em **"🔗 Gerar Convite Aluno"**
3. O sistema gera um link único, por exemplo:
   ```
   https://fit-coach-ia.vercel.app/#/login?invite=XYZ789
   ```
4. **Compartilhe o link** com o aluno via:
   - WhatsApp
   - Email
   - QR Code impresso
5. O aluno acessa o link e:
   - O código já vem pré-preenchido
   - Clica em "Criar Conta"
   - Preenche: Nome, Email, Senha
   - Conta criada e vinculada automaticamente à academia
   - ✅ **Recebe trial de 3 dias de IA grátis**

**Para Professores (Personal Trainers):**

1. Clique em **"🧑‍🏫 Gerar Convite Personal"**
2. Compartilhe o link gerado
3. O professor faz o cadastro e já fica vinculado à academia

**Para Recepcionistas:**

1. Crie manualmente na seção **"Método Alternativo: Criação Manual"**
2. Defina nome, email e senha
3. O recepcionista recebe as credenciais para login

---

### 🔹 Opção 2: Importação em Massa ou Criação Manual

#### ✅ Vantagens
- Criação rápida de muitos alunos de uma vez
- Ideal para academias que já têm lista de alunos
- Login imediato (sem necessidade de esperar convite)

#### ⚠️ Limitação
- Alunos **NÃO recebem trial de IA automaticamente**
- Se quiserem usar IA, precisam assinar plano individual

#### 📋 Como Funciona

**Importação em Massa (Recomendado para muitos alunos):**

1. Acesse: **Gerenciamento de Usuários**
2. Clique em **"📥 Importar Alunos (CSV)"**
3. Prepare um arquivo CSV ou TXT com o formato:
   ```
   Nome, Matrícula, Idade, Gênero
   João Silva, MAT123, 30, Masculino
   Maria Santos, MAT124, 25, Feminino
   ```
4. Selecione o arquivo
5. O sistema cria **automaticamente** todas as contas

**Credenciais Geradas:**
- **Username:** Nome do aluno (exato como no arquivo)
- **Senha:** Matrícula do aluno

**Limite:** Máximo de 100 alunos por importação (arquivos maiores precisam ser divididos).

**Criação Individual Manual:**

1. Acesse: **Gerenciamento de Usuários**
2. Clique em **"➕ Criar Aluno Manualmente"** (ou Professor/Recepcionista)
3. Preencha os dados:
   - Nome
   - Matrícula (para alunos)
   - Email (opcional)
   - Senha
4. Clique em **"Salvar"**

---

## 5️⃣ Processo de Login

Cada tipo de usuário faz login de forma diferente:

### 👨‍💼 Administrador

- **Username:** Email cadastrado ou código mestre usado no cadastro
- **Senha:** Senha definida no cadastro
- **Acesso:** Dashboard administrativo completo

**Funcionalidades disponíveis:**
- Gerenciar alunos, professores e recepcionistas
- Configurar dados da academia
- Gerar convites
- Ver relatórios e estatísticas
- Gerenciar permissões

---

### 🎓 Aluno

#### Se foi importado:
- **Username:** Nome completo (exatamente como está no arquivo)
- **Senha:** Matrícula

**Exemplo:**
- Nome: "João Silva"
- Matrícula: "MAT123"
- Login: Username = "João Silva", Senha = "MAT123"

#### Se usou convite:
- **Username:** Email ou nome cadastrado
- **Senha:** Senha definida no cadastro

**Acesso após login:**
- ✅ Dashboard do aluno
- ✅ Plano de treino personalizado
- ✅ Análise de progresso
- ✅ Funcionalidades de IA:
  - **Com convite:** Trial de 3 dias grátis (5 min/dia de voz)
  - **Importado:** Sem trial, precisa assinar plano individual
- ✅ Enquete inicial (peso, altura, objetivo) no primeiro acesso

---

### 🏋️ Professor/Treinador

- **Username:** Email ou nome cadastrado
- **Senha:** Senha definida no cadastro ou recebida

**Acesso após login:**
- ✅ Dashboard do personal trainer
- ✅ Visualização de todos os alunos da academia
- ✅ Criação de treinos personalizados
- ✅ Acompanhamento de progresso dos alunos
- ✅ Relatórios de performance

---

### 👤 Recepcionista

- **Username:** Email ou nome cadastrado
- **Senha:** Senha definida no cadastro

**Acesso após login:**
- ✅ Dashboard básico
- ✅ Visualização de informações da academia
- ✅ Funcionalidades limitadas conforme permissões definidas pelo administrador

---

## 6️⃣ Comparação: Importação vs Convites

### 📊 Tabela Comparativa

| Aspecto | Importação em Massa | Sistema de Convites |
|---------|---------------------|---------------------|
| **Criação de Contas** | ✅ Todas de uma vez (até 100) | ⏱️ Um por vez |
| **Velocidade** | ⚡ Muito rápida | 🐌 Mais lenta |
| **Trial de IA** | ❌ Não recebe automaticamente | ✅ 3 dias grátis |
| **Profissionalismo** | ⭐⭐ Bom | ⭐⭐⭐⭐⭐ Excelente |
| **Rastreabilidade** | ⚠️ Limitada | ✅ Histórico completo |
| **Ideal Para** | Muitos alunos já cadastrados | Novos alunos, experiência premium |

### 🎯 Quando Usar Cada Método

**Use IMPORTAÇÃO quando:**
- ✅ Já tem lista completa de alunos
- ✅ Quer criar todas as contas rapidamente
- ✅ Não é prioridade oferecer trial de IA
- ✅ Precisa de acesso imediato

**Use CONVITES quando:**
- ✅ Quer oferecer experiência premium aos alunos
- ✅ Quer que alunos experimentem IA grátis (3 dias)
- ✅ Prefere processo mais profissional
- ✅ Precisa de controle e rastreamento individual

---

## 7️⃣ Exemplo Prático Completo

### 📖 Cenário: Academia "FitLife" com Pack Growth (50 licenças)

#### Passo 1: Compra do Plano
- Academia acessa página de vendas
- Escolhe **Pack Growth** (50 licenças)
- Efetua pagamento de R$ 649,90/mês
- ✅ Recebe email com código mestre `ACADEMIA-XYZ123`

#### Passo 2: Primeiro Acesso do Administrador
- Administrador acessa `https://fit-coach-ia.vercel.app/`
- Usa código mestre `ACADEMIA-XYZ123` para criar conta
- Preenche: Nome, Email, Senha
- ✅ Login realizado com sucesso

#### Passo 3: Configuração
- Acessa **Configurações** → **Configuração da Academia**
- Preenche:
  - Nome: "Academia FitLife"
  - CNPJ: "12.345.678/0001-90"
  - Endereço completo
  - Logo e cores personalizadas
- ✅ Academia configurada

#### Passo 4A: Estratégia de Cadastro - OPÇÃO 1 (Convites)

Administrador decide usar convites para oferecer trial de IA:

1. Acessa **Gerenciamento de Usuários**
2. Gera 50 links de convite para alunos:
   ```
   https://fit-coach-ia.vercel.app/#/login?invite=XYZ789
   https://fit-coach-ia.vercel.app/#/login?invite=XYZ790
   ... (48 links mais)
   ```
3. Compartilha links via WhatsApp com cada aluno
4. Cada aluno:
   - Recebe link personalizado
   - Acessa e cria conta
   - ✅ Recebe 3 dias grátis de IA
   - ✅ Pode usar funcionalidades premium durante trial

**Resultado:** 50 alunos cadastrados, todos com trial de IA ativo.

---

#### Passo 4B: Estratégia de Cadastro - OPÇÃO 2 (Importação)

Administrador decide importar todos os alunos de uma vez:

1. Prepara arquivo CSV com 50 alunos:
   ```csv
   João Silva, MAT001, 30, Masculino
   Maria Santos, MAT002, 25, Feminino
   Pedro Oliveira, MAT003, 35, Masculino
   ... (47 alunos mais)
   ```
2. Acessa **Gerenciamento de Usuários**
3. Clica em **"📥 Importar Alunos (CSV)"**
4. Seleciona o arquivo
5. ✅ Sistema cria 50 contas automaticamente

**Credenciais geradas:**
- Aluno "João Silva": Username = "João Silva", Senha = "MAT001"
- Aluno "Maria Santos": Username = "Maria Santos", Senha = "MAT002"
- E assim por diante...

6. Administrador envia mensagem para todos os alunos:
   ```
   Olá! Sua conta no FitCoach.IA foi criada.
   
   Link: https://fit-coach-ia.vercel.app/
   Username: [NOME DO ALUNO]
   Senha: [MATRÍCULA]
   ```

**Resultado:** 50 alunos cadastrados, todos podem fazer login imediatamente (sem trial de IA).

---

#### Passo 5: Login dos Usuários

**Administrador:**
- Login: Email + Senha
- ✅ Acessa dashboard administrativo

**Alunos (Importados):**
- Login: Nome + Matrícula
- ✅ Acessam dashboard do aluno
- ⚠️ Para usar IA, precisam assinar plano individual

**Alunos (Com Convite):**
- Login: Email + Senha (criada no cadastro)
- ✅ Acessam dashboard do aluno
- ✅ Trial de 3 dias de IA ativo

---

## 📌 Checklist Rápido

### Para a Academia (Administrador)

- [ ] Comprou plano adequado ao número de alunos
- [ ] Recebeu código mestre por email
- [ ] Criou conta usando código mestre
- [ ] Configurou dados da academia
- [ ] Decidiu estratégia: Importação OU Convites
- [ ] Cadastrou todos os usuários
- [ ] Informou credenciais aos alunos/colaboradores

### Para os Alunos

- [ ] Recebeu link de convite OU credenciais de login
- [ ] Criou conta (se usou convite)
- [ ] Fez login no sistema
- [ ] Preencheu enquete inicial (peso, altura, objetivo)
- [ ] Começou a usar o app

---

## ❓ Perguntas Frequentes (FAQ)

### 1. Posso usar ambos os métodos (importação e convites)?

✅ **Sim!** Você pode importar alguns alunos e usar convites para outros. O sistema suporta ambas as formas simultaneamente.

### 2. Se eu importar alunos, eles podem receber trial de IA depois?

⚠️ **Não automaticamente.** Alunos importados não recebem trial de IA. Eles precisam assinar um plano individual se quiserem usar funcionalidades de IA.

### 3. Quantos alunos posso importar de uma vez?

📊 **Máximo de 100 alunos por importação.** Para mais alunos, divida o arquivo em múltiplas importações.

### 4. Os convites expiram?

⏰ **Sim.** Os convites expiram em 7 dias por padrão. Você pode gerar novos convites quando necessário.

### 5. Posso ver quem usou cada convite?

✅ **Sim!** Na página de Gerenciamento de Usuários, há um botão **"📊 Ver Histórico de Uso"** que mostra quem usou cada convite, quando e de qual IP.

### 6. O que acontece se um aluno esquecer a senha?

🔐 Alunos importados podem usar a função de recuperação de senha. Para alunos com convite, eles também podem recuperar a senha pelo email cadastrado.

### 7. Posso criar professores e recepcionistas via importação?

⚠️ **Não.** A importação é apenas para alunos. Professores e recepcionistas devem ser criados manualmente ou via convite.

### 8. Como sei quantas licenças já usei?

📊 No dashboard administrativo, você pode ver quantas licenças foram utilizadas em relação ao total do seu plano.

---

## 📞 Suporte

Para dúvidas ou problemas:
- **Email:** suporte@fitcoach.ia
- **WhatsApp:** (XX) XXXXX-XXXX
- **Documentação:** https://docs.fitcoach.ia

---

## 📅 Versão do Documento

- **Versão:** 1.0
- **Data:** Janeiro 2026
- **Última Atualização:** Janeiro 2026

---

**© 2026 FitCoach.IA - Todos os direitos reservados**

