# Relatório de Implementações do Nutri.IA

Este documento resume as principais funcionalidades, integrações e melhorias já presentes no sistema **Nutri.IA – Agente Nutricional Inteligente**.

## 1. Visão Geral do Projeto
- Aplicação construída com **React 19 + Vite** e estilização via **TailwindCSS**, com suporte a modo escuro por padrão.
- Roteamento baseado em hash através do hook `useRouter`, permitindo SPA sem dependências externas de roteamento.
- Estrutura modular dividida em páginas temáticas (`pages/`), componentes reutilizáveis (`components/`) e serviços (`services/`).

## 2. Integrações com a Gemini API
- Serviço centralizado em `services/geminiService.ts`, utilizando o SDK `@google/genai` e leitura da chave `VITE_GEMINI_API_KEY` via Vite.
- **Geração de plano alimentar** (`generateMealPlan`) com schema estruturado de resposta, salvando resultados no `sessionStorage`.
- **Chat nutricional contínuo** (`startChat`, `sendMessageToChat`) com suporte a streaming de respostas, reconhecimento de voz e síntese de fala na UI.
- **Análise de foto de refeição** (`analyzeMealPhoto`) que envia imagem em base64 e retorna identificação de alimentos e macros.
- **Busca de receitas personalizadas** (`searchRecipes`) alinhada ao objetivo do usuário.
- **Moderação de conteúdo** (`moderateContent`) para manter interações seguras.
- **Relatórios e planos avançados**: geração de relatório semanal (`generateWeeklyReport`), plano de bem-estar completo (`generateWellnessPlan`), análise de progresso (`analyzeProgress`), explicações rápidas de refeições (`explainMeal`) e sugestões de substituições (`getFoodSubstitutions`).

## 3. Gestão de Estado Global
- `UserContext`: armazena dados do usuário, histórico de peso, pontuação, desafios concluídos e permite operações como ganho de pontos, atualização de peso e upgrade para premium.
- `ThemeContext`: controla tema **dark** como padrão, com persistência no `localStorage` e suporte a tema do sistema.
- `I18nContext`: internacionalização em **português, inglês e espanhol**, com detecção automática do idioma do navegador e persistência da escolha.

## 4. Experiência do Usuário e Componentização
- Layout responsivo (`components/layout/Layout.tsx`) com **header**, **sidebar dinâmica**, detecção de status offline (`useOnlineStatus`) e animações sutis.
- Componentes UI reutilizáveis (p. ex. `Button`, `Card`, `Alert`, `Skeleton`) com testes unitários básicos em `components/ui/*.test.tsx`.
- Formulários e exibições ricas: `PlanGeneratorForm`, `MealPlanDisplay`, `Dashboard` com gráficos `recharts`, `ImageUploader` com preview e remoção.
- Ícones customizados em `components/icons/`, mantendo consistência visual no modo escuro.

## 5. Páginas Implementadas
- `HomePage`: visão geral com destaques da plataforma (layout rico em cards e chamadas para ação).
- `GeneratorPage`: fluxo para coletar dados do usuário e gerar plano alimentar com IA, incluindo `MealPlanSkeleton` durante o carregamento e feedback de erro.
- `AnalyzerPage`: upload e análise de fotos de pratos com feedback visual das macros e pontos ganhos.
- `ReportsPage`: listagem de relatórios padronizados com suporte a exportação via `html2pdf.js` (`exportPDF`).
- `WellnessPlanPage`, `AnalysisPage`, `SmartMealPage` e demais páginas temáticas disponibilizam conteúdos de apoio, planos semanais, biblioteca de materiais, desafios e painel profissional.
- `SettingsPage`: preferências, inclusive mudança de idioma, tema e alternância de perfil (usuário x profissional).

## 6. Configuração e Infraestrutura
- `vite.config.ts` garante injeção das variáveis de ambiente (`process.env.API_KEY` e `import.meta.env.VITE_GEMINI_API_KEY`) e configura HMR para desenvolvimento local.
- Arquivo `.env.local` (ignorado pelo Git) armazena a chave do Gemini. Referência e template documentados no `README.md` atualizado.
- `public/service-worker.js` habilita comportamento PWA básico, com registro em `index.tsx`.
- Scripts auxiliares (`start-server.bat`, `copy-all-deps.ps1`, `fix-npm.bat`) facilitam setup em ambientes Windows.

## 7. Melhorias Recentes
- Atualização do `README.md` com instruções em português e solução de problemas para a API do Gemini.
- Criação do template `.env.local` e orientação para configuração segura da chave.
- Organização da documentação em `docs/` para centralizar relatórios e guias futuros.

## 8. Próximos Passos Sugeridos
- Implementar persistência remota (ex.: backend ou Supabase) para salvar planos e históricos reais dos usuários.
- Adicionar testes de integração para fluxos críticos (geração de plano, análise de refeição e chat).
- Expandir suporte offline com cache inteligente e fallback para funcionalidades não dependentes da IA.
- Criar pipeline de CI com lint/test automáticos e checklist para validação da chave da API em produção.

---

*Documento gerado em 07/11/2025 para registrar o estado atual das implementações do sistema.*

