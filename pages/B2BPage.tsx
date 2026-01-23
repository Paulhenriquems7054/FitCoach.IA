import React, { useState } from 'react';
import { Check, X, Building2, Ticket, Smartphone, Zap, ArrowRight, Star, ChevronDown, BarChart3, Users, FileText, Shield, ChevronUp, BatteryCharging, Clock, Infinity } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const B2BPage: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const scrollToPlans = () => {
    document.getElementById('b2b-plans')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePurchase = (url: string) => {
    window.open(url, '_blank');
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "A IA está incluída em todos os planos?",
      answer: "Sim. Todos os planos incluem IA multimodal completa (texto, imagem e voz) integrada. Não há custos adicionais por aluno. Recargas de voz são opcionais e geram lucro para a academia."
    },
    {
      question: "Como funcionam as 3 interações gratuitas?",
      answer: "Novos alunos recebem automaticamente 3 interações gratuitas com a IA FitCoach para experimentar todas as funcionalidades (texto, imagem e voz). Após isso, podem optar por recargas de voz opcionais que geram receita para sua academia."
    },
    {
      question: "Preciso pagar algo adicional por aluno?",
      answer: "Não. O valor do plano é fixo e baseado no número máximo de alunos. Não há custos adicionais por aluno, consumo de IA ou tokens. Recargas de voz são opcionais e compradas diretamente pelos alunos, gerando lucro para sua academia."
    },
    {
      question: "Posso cancelar a qualquer momento?",
      answer: "Sim. Não há fidelidade ou multa por cancelamento. Você pode cancelar quando quiser."
    },
    {
      question: "Como funcionam as recargas de voz?",
      answer: "As recargas de voz são opcionais e vendidas diretamente aos alunos através do app. Cada recarga gera uma comissão para sua academia, criando uma fonte adicional de receita."
    },
    {
      question: "Qual o limite de alunos por plano?",
      answer: "Cada plano tem um limite máximo de alunos: FitCoach 50 (até 50 alunos), FitCoach 100 (até 100), FitCoach 200 (até 200), FitCoach 400 (até 400) e FitCoach 500 (até 500 alunos). Todos incluem IA completa integrada."
    },
    {
      question: "Preciso cadastrar cartão de crédito para começar?",
      answer: "Sim, para assinar um plano é necessário realizar o pagamento através do checkout. Os alunos novos recebem 3 interações gratuitas sem necessidade de cadastro de cartão."
    }
  ];

  return (
    <div className="animate-fade-in-up">
      {/* 1. Hero Section – Problema do Gestor + Solução da Plataforma */}
      <section className="pt-24 md:pt-32 pb-12 md:pb-16 px-4 md:px-6 bg-blue-50 dark:bg-gray-800/50 transition-colors duration-300">
        <div className="max-w-5xl mx-auto text-center reveal">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-bold uppercase tracking-wide mb-6">
            <Building2 size={14} /> Plataforma de Gestão Digital para Academias
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-nutri-dark dark:text-white leading-tight mb-4 md:mb-6 px-2">
            Transforme sua academia em uma <span className="text-blue-600 dark:text-blue-400">plataforma inteligente</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-4 max-w-3xl mx-auto leading-relaxed font-medium px-2">
            Planos B2B para academias com IA multimodal integrada. <strong>Sem custos adicionais por aluno.</strong>
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-2xl p-4 mb-8 max-w-2xl mx-auto">
            <p className="text-base md:text-lg text-blue-800 dark:text-blue-200 font-semibold">
              ✨ <strong>IA FitCoach integrada — texto, imagem e voz inclusos</strong>
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
              Todos os planos incluem IA completa. Recargas de voz opcionais.
            </p>
          </div>
          <Button variant="primary" className="mx-auto mb-8 text-lg py-4 px-8" onClick={scrollToPlans}>
            Quero ativar FitCoach.AI na minha academia <ChevronDown size={20} />
          </Button>

          {/* Vídeo/Demo */}
          <div className="mt-12 reveal delay-100">
            <div className="relative w-full max-w-3xl mx-auto rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl bg-black">
              <div className="aspect-video w-full">
                <video
                  src="/FITCOACH.IA.mp4"
                  className="w-full h-full object-cover"
                  controls
                  playsInline
                  preload="metadata"
                >
                  Seu navegador não suporta a reprodução de vídeos.
                </video>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Como Funciona em 3 Passos */}
      <section className="py-20 px-6 max-w-7xl mx-auto bg-white dark:bg-gray-900">
        <div className="text-center mb-12 reveal">
          <h2 className="font-serif text-3xl md:text-4xl text-nutri-dark dark:text-white font-bold mb-4">
            Como Funciona
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Três passos simples para transformar sua academia em uma plataforma digital
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="bg-blue-50 dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-blue-100 dark:border-gray-700 hover:shadow-md transition-all reveal delay-100">
            <div className="w-14 h-14 bg-nutri-dark text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-xl font-bold shadow-lg shadow-nutri-dark/20">1</div>
            <h3 className="font-serif text-xl font-bold text-nutri-dark dark:text-white mb-3">Assine a Plataforma</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Escolha o plano de plataforma ideal para o porte da sua academia. 
              Você recebe acesso aos painéis de gestão e ferramentas de convite.
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-blue-100 dark:border-gray-700 hover:shadow-md transition-all reveal delay-300">
            <div className="w-14 h-14 bg-nutri-accent text-nutri-dark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-nutri-accent/20"><Ticket size={28}/></div>
            <h3 className="font-serif text-xl font-bold text-nutri-dark dark:text-white mb-3">Crie Convites</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Use os painéis para gerar convites por link ou QR Code. 
              Compartilhe com seus alunos e acompanhe quem está usando a plataforma.
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-blue-100 dark:border-gray-700 hover:shadow-md transition-all transition-all reveal delay-500">
            <div className="w-14 h-14 bg-blue-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20"><Smartphone size={28}/></div>
            <h3 className="font-serif text-xl font-bold text-nutri-dark dark:text-white mb-3">Alunos Experimentam a IA</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Os alunos recebem 3 interações gratuitas para conhecer a IA multimodal. 
              Recargas de voz são opcionais e geram lucro para sua academia.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Planos de Plataforma */}
      <section id="b2b-plans" className="py-10 px-6 max-w-7xl mx-auto mb-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="text-center mb-12 reveal">
          <h2 className="font-serif text-3xl md:text-4xl text-nutri-dark dark:text-white font-bold mb-4">
            Planos FitCoach.AI
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-4">
            Escolha o plano ideal baseado no número de alunos da sua academia. IA multimodal integrada em todos os planos.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 max-w-xl mx-auto">
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
              <strong>IA FitCoach integrada — texto, imagem e voz inclusos. Recargas de voz opcionais.</strong>
            </p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 items-start">
          
          {/* FitCoach 50 */}
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-[2rem] shadow-lg border border-gray-200 dark:border-gray-700 relative flex flex-col reveal delay-50">
            <div className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">FitCoach 50</div>
            <h3 className="font-serif text-xl md:text-2xl text-nutri-dark dark:text-white font-bold mb-1">Até 50 alunos</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Ideal para academias pequenas e médias.
            </p>
            
            <div className="mb-6">
              <span className="text-2xl md:text-3xl font-bold text-nutri-dark dark:text-white">R$ 299,90</span>
              <span className="text-gray-500 text-sm">/mês</span>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Valor total no checkout: <span className="font-semibold">R$ 300,89</span> (inclui taxa de R$ 0,99).
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-500/50 mb-6 text-left">
              <p className="text-xs uppercase font-extrabold text-blue-600 dark:text-blue-400 mb-1 tracking-wider">
                IA FitCoach integrada
              </p>
              <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1 mt-1">
                <li><Check size={14} className="inline text-blue-600 mr-1" /> IA texto, imagem e voz inclusos</li>
                <li><Check size={14} className="inline text-blue-600 mr-1" /> Recargas de voz opcionais</li>
              </ul>
            </div>

            <Button
              variant="outline"
              className="mb-8 dark:text-white dark:border-gray-600 w-full"
              onClick={() => handlePurchase('https://pay.cakto.com.br/cemyp2n_668537')}
            >
              Quero este plano
            </Button>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Até 50 alunos</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Painel de gestão</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> 3 interações grátis por aluno novo</li>
            </ul>
          </div>

          {/* FitCoach 100 */}
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-[2rem] shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col reveal delay-100">
            <div className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">FitCoach 100</div>
            <h3 className="font-serif text-xl md:text-2xl text-nutri-dark dark:text-white font-bold mb-1">Até 100 alunos</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Para academias em crescimento.</p>
            
            <div className="mb-6">
              <span className="text-2xl md:text-3xl font-bold text-nutri-dark dark:text-white">R$ 549,90</span>
              <span className="text-gray-500 text-sm">/mês</span>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Valor total no checkout: <span className="font-semibold">R$ 550,89</span> (inclui taxa de R$ 0,99).
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-500/50 mb-6 text-left">
              <p className="text-xs uppercase font-extrabold text-blue-600 dark:text-blue-400 mb-1 tracking-wider">
                IA FitCoach integrada
              </p>
              <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1 mt-1">
                <li><Check size={14} className="inline text-blue-600 mr-1" /> IA texto, imagem e voz inclusos</li>
                <li><Check size={14} className="inline text-blue-600 mr-1" /> Recargas de voz opcionais</li>
              </ul>
            </div>

            <Button
              variant="outline"
              className="mb-8 dark:text-white dark:border-gray-600 w-full"
              onClick={() => handlePurchase('https://pay.cakto.com.br/vi6djzq_668541')}
            >
              Quero este plano
            </Button>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Até 100 alunos</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Gestão avançada</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> 3 interações grátis por aluno novo</li>
            </ul>
          </div>

          {/* FitCoach 200 */}
          <div className="bg-nutri-dark dark:bg-gray-900 p-6 md:p-8 rounded-[2rem] shadow-2xl border-2 border-nutri-accent relative transform lg:-translate-y-6 flex flex-col reveal delay-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-nutri-accent text-nutri-dark px-3 md:px-4 py-1 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1 shadow-md whitespace-nowrap animate-pulse">
              MAIS VENDIDO
            </div>
            <div className="text-sm font-bold text-green-200 uppercase tracking-wider mb-2">FitCoach 200</div>
            <h3 className="font-serif text-xl md:text-2xl text-white font-bold mb-1">Até 200 alunos</h3>
            <p className="text-xs text-green-100/80 mb-4">Melhor custo-benefício para academias médias.</p>
            
            <div className="mb-6">
              <span className="text-3xl md:text-4xl font-bold text-white">R$ 999,90</span>
              <span className="text-green-200/60 text-sm">/mês</span>
              <p className="mt-1 text-[11px] text-green-200/80">
                Valor total no checkout: <span className="font-semibold">R$ 1.000,89</span> (inclui taxa de R$ 0,99).
              </p>
            </div>

             <div className="bg-nutri-accent/10 p-4 rounded-xl border-2 border-dashed border-nutri-accent mb-6 text-left">
                <p className="text-xs uppercase font-extrabold text-nutri-accent mb-1 tracking-wider">IA FitCoach integrada</p>
                <ul className="text-sm text-white/90 space-y-1 mt-1">
                  <li><Check size={14} className="inline text-nutri-accent mr-1" /> IA texto, imagem e voz inclusos</li>
                  <li><Check size={14} className="inline text-nutri-accent mr-1" /> Recargas de voz opcionais</li>
                </ul>
            </div>

            <Button
              variant="secondary"
              className="mb-8 w-full font-bold shadow-lg shadow-nutri-accent/20"
              onClick={() => handlePurchase('https://pay.cakto.com.br/3b2kpwc_671196')}
            >
              Quero este plano
            </Button>
            <ul className="space-y-2 text-sm text-white/90">
              <li className="flex items-center gap-2"><Check size={16} className="text-nutri-accent" /> Até 200 alunos</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-nutri-accent" /> Relatórios completos</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-nutri-accent" /> Suporte prioritário</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-nutri-accent" /> 3 interações grátis por aluno novo</li>
            </ul>
          </div>

          {/* FitCoach 400 */}
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-[2rem] shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col reveal delay-400">
            <div className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">FitCoach 400</div>
            <h3 className="font-serif text-xl md:text-2xl text-nutri-dark dark:text-white font-bold mb-1">Até 400 alunos</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Para academias grandes.</p>
            
            <div className="mb-6">
              <span className="text-2xl md:text-3xl font-bold text-nutri-dark dark:text-white">R$ 1.799,90</span>
              <span className="text-gray-500 text-sm">/mês</span>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Valor total no checkout: <span className="font-semibold">R$ 1.800,89</span> (inclui taxa de R$ 0,99).
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-500/50 mb-6 text-left">
              <p className="text-xs uppercase font-extrabold text-blue-600 dark:text-blue-400 mb-1 tracking-wider">
                IA FitCoach integrada
              </p>
              <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1 mt-1">
                <li><Check size={14} className="inline text-blue-600 mr-1" /> IA texto, imagem e voz inclusos</li>
                <li><Check size={14} className="inline text-blue-600 mr-1" /> Recargas de voz opcionais</li>
              </ul>
            </div>

            <Button
              variant="outline"
              className="mb-8 dark:text-white dark:border-gray-600 w-full"
              onClick={() => handlePurchase('https://pay.cakto.com.br/3dis6ds_668546')}
            >
              Quero este plano
            </Button>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Até 400 alunos</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Multi-unidade</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> 3 interações grátis por aluno novo</li>
            </ul>
          </div>

          {/* FitCoach 500 */}
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-[2rem] shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col reveal delay-500">
            <div className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">FitCoach 500</div>
            <h3 className="font-serif text-xl md:text-2xl text-nutri-dark dark:text-white font-bold mb-1">Até 500 alunos</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Para grandes redes de academias.</p>
            
            <div className="mb-6">
              <span className="text-2xl md:text-3xl font-bold text-nutri-dark dark:text-white">R$ 2.199,90</span>
              <span className="text-gray-500 text-sm">/mês</span>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Valor total no checkout: <span className="font-semibold">R$ 2.200,89</span> (inclui taxa de R$ 0,99).
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-500/50 mb-6 text-left">
              <p className="text-xs uppercase font-extrabold text-blue-600 dark:text-blue-400 mb-1 tracking-wider">
                IA FitCoach integrada
              </p>
              <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1 mt-1">
                <li><Check size={14} className="inline text-blue-600 mr-1" /> IA texto, imagem e voz inclusos</li>
                <li><Check size={14} className="inline text-blue-600 mr-1" /> Recargas de voz opcionais</li>
              </ul>
            </div>

            <Button
              variant="outline"
              className="mb-8 dark:text-white dark:border-gray-600 w-full"
              onClick={() => handlePurchase('https://pay.cakto.com.br/xphpm5f_703310')}
            >
              Quero este plano
            </Button>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Até 500 alunos</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Gestão completa</li>
              <li className="flex items-center gap-2 font-bold text-nutri-dark dark:text-white"><Check size={16} className="text-green-500" /> Suporte dedicado</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> 3 interações grátis por aluno novo</li>
            </ul>
          </div>

        </div>
      </section>

      {/* 4. Diferenciais */}
      <section className="py-20 px-6 max-w-7xl mx-auto bg-white dark:bg-gray-900">
        <div className="text-center mb-12 reveal">
          <h2 className="font-serif text-3xl md:text-4xl text-nutri-dark dark:text-white font-bold mb-4">
            Diferenciais FitCoach.AI
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Por que escolher a FitCoach.AI para sua academia
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
          <div className="bg-blue-50 dark:bg-gray-800 p-8 rounded-3xl shadow-lg border-b-4 border-blue-500 dark:border-blue-600 hover:-translate-y-1 transition-transform duration-300 reveal delay-100">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 text-2xl">
              🧠
            </div>
            <h3 className="font-serif text-xl font-bold text-nutri-dark dark:text-white mb-3">IA Multimodal Integrada</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              IA completa (texto, imagem e voz) integrada em todos os planos. Sem custos adicionais por aluno.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-gray-800 p-8 rounded-3xl shadow-lg border-b-4 border-green-500 dark:border-green-600 hover:-translate-y-1 transition-transform duration-300 reveal delay-300">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mb-6 text-2xl">
              💪
            </div>
            <h3 className="font-serif text-xl font-bold text-nutri-dark dark:text-white mb-3">Sem Custos Adicionais por Aluno</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Valor fixo mensal baseado no número máximo de alunos. Sem surpresas ou custos variáveis.
            </p>
          </div>

          <div className="bg-orange-50 dark:bg-gray-800 p-8 rounded-3xl shadow-lg border-b-4 border-orange-500 dark:border-orange-600 hover:-translate-y-1 transition-transform duration-300 reveal delay-500">
            <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mb-6 text-2xl">
              🔊
            </div>
            <h3 className="font-serif text-xl font-bold text-nutri-dark dark:text-white mb-3">Recargas Automáticas com Lucro</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Recargas opcionais de voz geram receita adicional para sua academia. Aumente sua margem de lucro.
            </p>
          </div>
        </div>

        {/* Benefícios da Plataforma */}
        <div className="text-center mb-12 reveal">
          <h2 className="font-serif text-3xl md:text-4xl text-nutri-dark dark:text-white font-bold mb-4">
            Benefícios da Plataforma
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Ferramentas de gestão que transformam sua academia em uma plataforma digital
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-blue-50 dark:bg-gray-800 p-8 rounded-3xl shadow-lg border-b-4 border-blue-500 dark:border-blue-600 hover:-translate-y-1 transition-transform duration-300 reveal delay-100">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
              <BarChart3 size={28} />
            </div>
            <h3 className="font-serif text-xl font-bold text-nutri-dark dark:text-white mb-3">Dashboards Inteligentes</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Acompanhe em tempo real quais alunos estão engajados e usando a IA. 
              Visão clara do engajamento digital da sua base.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-gray-800 p-8 rounded-3xl shadow-lg border-b-4 border-green-500 dark:border-green-600 hover:-translate-y-1 transition-transform duration-300 reveal delay-300">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mb-6">
              <Users size={28} />
            </div>
            <h3 className="font-serif text-xl font-bold text-nutri-dark dark:text-white mb-3">Gestão de Alunos</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Organize seus alunos por unidade, turma, horário e professor. 
              Controle total sobre quem está usando a plataforma.
            </p>
          </div>

          <div className="bg-orange-50 dark:bg-gray-800 p-8 rounded-3xl shadow-lg border-b-4 border-orange-500 dark:border-orange-600 hover:-translate-y-1 transition-transform duration-300 reveal delay-500">
            <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mb-6">
              <FileText size={28} />
            </div>
            <h3 className="font-serif text-xl font-bold text-nutri-dark dark:text-white mb-3">Relatórios e Exportação</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Gere relatórios de engajamento, exporte dados em CSV ou PDF. 
              Informações estratégicas para tomar decisões baseadas em dados.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Garantia: IA Integrada em Todos os Planos */}
      <section className="py-20 px-6 max-w-5xl mx-auto bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12 shadow-xl border-2 border-blue-300 dark:border-blue-700 text-center reveal">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield size={32} />
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-nutri-dark dark:text-white font-bold mb-4">
            IA FitCoach integrada em todos os planos
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            Todos os planos incluem <strong>IA multimodal completa</strong> (texto, imagem e voz). 
            Novos alunos ganham 3 interações gratuitas. Recargas de voz são opcionais e geram lucro para sua academia.
          </p>
          <div className="grid md:grid-cols-2 gap-6 mt-8 text-left">
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl">
              <h3 className="font-semibold text-nutri-dark dark:text-white mb-3">✅ Para sua academia</h3>
              <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-2">
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-green-600 mt-0.5 shrink-0" />
                  <span>IA multimodal integrada (texto, imagem e voz)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-green-600 mt-0.5 shrink-0" />
                  <span>Sem custos adicionais por aluno</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-green-600 mt-0.5 shrink-0" />
                  <span>Recargas opcionais com lucro para a academia</span>
                </li>
              </ul>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl">
              <h3 className="font-semibold text-nutri-dark dark:text-white mb-3">📱 Para os alunos</h3>
              <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-2">
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-blue-600 mt-0.5 shrink-0" />
                  <span>3 interações gratuitas para alunos novos</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-blue-600 mt-0.5 shrink-0" />
                  <span>IA completa inclusa no plano da academia</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-blue-600 mt-0.5 shrink-0" />
                  <span>Recargas de voz opcionais e transparentes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Anti-Objeção */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12 reveal">
          <h2 className="font-serif text-3xl md:text-4xl text-nutri-dark dark:text-white font-bold mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Tire suas dúvidas sobre a plataforma e o modelo B2B2C
          </p>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden reveal"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="font-semibold text-nutri-dark dark:text-white pr-4">{faq.question}</span>
                {openFaqIndex === index ? (
                  <ChevronUp size={20} className="text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400 shrink-0" />
                )}
              </button>
              {openFaqIndex === index && (
                <div className="px-6 pb-5 text-gray-600 dark:text-gray-300 text-sm md:text-base border-t border-gray-200 dark:border-gray-700 pt-4">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 7. Recargas de Voz (Opcional) */}
      <section id="recharge-plans" className="py-20 px-6 max-w-7xl mx-auto bg-nutri-bg dark:bg-gray-900">
        <div className="text-center mb-12 reveal">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-bold uppercase tracking-wide mb-4">
            <BatteryCharging size={14} /> Recarga de Voz (Opcional)
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-nutri-dark dark:text-white font-bold mb-4">
            Precisa de mais tempo de conversa?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Seu limite diário de voz acabou, mas você pode continuar com nossos pacotes de recarga instantânea.
          </p>
          <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-2">
            ✨ Consumo opcional. Sem pegadinha.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Sessão Turbo */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-md border border-gray-100 dark:border-gray-700 hover:border-orange-300 transition-all group reveal delay-100 relative">
            <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl">
              URGÊNCIA
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold text-nutri-dark dark:text-white mb-1">Sessão Turbo</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-800 dark:text-white">R$ 5,00</span>
              <div className="text-xs text-gray-400">Pagamento Único</div>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Valor total no checkout: <span className="font-semibold">R$ 5,99</span> (inclui taxa fixa de R$ 0,99 da Cakto para Pix e cartão).
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl mb-6 text-sm">
              <p className="font-bold text-nutri-dark dark:text-white mb-1">+20 Minutos de Voz</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Válido por 24h. Ideal para terminar sua conversa agora.</p>
            </div>
            <Button 
              className="bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200 w-full" 
              onClick={() => handlePurchase('https://pay.cakto.com.br/ihfy8cz_668443')}
            >
              Comprar
            </Button>
          </div>

          {/* Banco de Voz 100 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl border-2 border-nutri-dark dark:border-green-500 relative transform md:-translate-y-2 reveal delay-300">
            <div className="absolute top-0 right-0 bg-nutri-dark dark:bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl flex items-center gap-1">
              MELHOR ESCOLHA
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
              <Clock size={24} />
            </div>
            <h3 className="text-xl font-bold text-nutri-dark dark:text-white mb-1">Banco de Voz 100</h3>
            <p className="text-xs text-green-600 dark:text-green-400 font-bold uppercase mb-4">Custo-Benefício</p>
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-800 dark:text-white">R$ 12,90</span>
              <div className="text-xs text-gray-400">Pagamento Único</div>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Valor total no checkout: <span className="font-semibold">R$ 13,89</span> (inclui taxa fixa de R$ 0,99 da Cakto para Pix e cartão).
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl mb-6 text-sm">
              <p className="font-bold text-nutri-dark dark:text-white mb-1">+100 Minutos de Voz</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Não expira. Fica na conta e usa quando o diário acabar.</p>
            </div>
            <Button 
              variant="primary" 
              className="w-full" 
              onClick={() => handlePurchase('https://pay.cakto.com.br/hhxugxb_668446')}
            >
              Comprar
            </Button>
          </div>

          {/* Passe Livre 30 Dias */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-md border border-gray-100 dark:border-gray-700 hover:border-purple-300 transition-all group reveal delay-500 relative">
            <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl">
              VIP
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <Infinity size={24} />
            </div>
            <h3 className="text-xl font-bold text-nutri-dark dark:text-white mb-1">Passe Livre 30 Dias</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-800 dark:text-white">R$ 19,90</span>
              <div className="text-xs text-gray-400">Pagamento Único</div>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Valor total no checkout: <span className="font-semibold">R$ 20,89</span> (inclui taxa fixa de R$ 0,99 da Cakto para Pix e cartão).
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl mb-6 text-sm">
              <p className="font-bold text-nutri-dark dark:text-white mb-1">Voz Ilimitada por 30 dias</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Remova o limite de 15 minutos diários pelo próximo mês.</p>
            </div>
            <Button 
              className="bg-purple-500 hover:bg-purple-600 text-white shadow-purple-200 w-full" 
              onClick={() => handlePurchase('https://pay.cakto.com.br/3smg99n_693764')}
            >
              Comprar
            </Button>
          </div>
        </div>
      </section>

      {/* 9. Planos FitCoach Manual (Sem IA) */}
      <section id="manual-plans" className="py-20 px-6 max-w-7xl mx-auto bg-gray-50 dark:bg-gray-900/50">
        <div className="text-center mb-12 reveal">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full text-xs font-bold uppercase tracking-wide mb-4">
            Planos Econômicos
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-nutri-dark dark:text-white font-bold mb-4">
            FitCoach Manual — Sem IA
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-4">
            Planos mais econômicos para academias que preferem usar apenas a plataforma de gestão, sem inteligência artificial.
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl p-4 max-w-xl mx-auto">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
              ⚠️ <strong>Importante:</strong> Estes planos não incluem IA. Apenas plataforma de gestão manual.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 items-start max-w-7xl mx-auto">
          
          {/* FitCoach Manual 50 */}
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-[2rem] shadow-lg border border-gray-300 dark:border-gray-700 relative flex flex-col reveal delay-50">
            <div className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">FitCoach Manual 50</div>
            <h3 className="font-serif text-xl md:text-2xl text-nutri-dark dark:text-white font-bold mb-1">Até 50 alunos</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Plataforma manual, sem IA.</p>
            
            <div className="mb-6">
              <span className="text-2xl md:text-3xl font-bold text-nutri-dark dark:text-white">R$ 59,90</span>
              <span className="text-gray-500 text-sm">/mês</span>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Valor total no checkout: <span className="font-semibold">R$ 60,89</span> (inclui taxa de R$ 0,99).
              </p>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 mb-6 text-left">
              <p className="text-xs uppercase font-extrabold text-gray-600 dark:text-gray-300 mb-1 tracking-wider">
                Sem IA
              </p>
              <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1 mt-1">
                <li><Check size={14} className="inline text-gray-400 mr-1" /> Plataforma de gestão manual</li>
                <li><Check size={14} className="inline text-gray-400 mr-1" /> 0 interações com IA</li>
              </ul>
            </div>

            <Button
              variant="outline"
              className="mb-8 dark:text-white dark:border-gray-600 w-full"
              onClick={() => handlePurchase('https://pay.cakto.com.br/d7pupti_733873')}
            >
              Quero este plano
            </Button>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Até 50 alunos</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Painel de gestão</li>
              <li className="flex items-center gap-2 text-red-600 dark:text-red-400"><X size={16} className="text-red-600 dark:text-red-400" /> Sem IA incluída</li>
            </ul>
          </div>

          {/* FitCoach Manual 100 */}
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-[2rem] shadow-lg border border-gray-300 dark:border-gray-700 flex flex-col reveal delay-100">
            <div className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">FitCoach Manual 100</div>
            <h3 className="font-serif text-xl md:text-2xl text-nutri-dark dark:text-white font-bold mb-1">Até 100 alunos</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Plataforma manual, sem IA.</p>
            
            <div className="mb-6">
              <span className="text-2xl md:text-3xl font-bold text-nutri-dark dark:text-white">R$ 129,90</span>
              <span className="text-gray-500 text-sm">/mês</span>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Valor total no checkout: <span className="font-semibold">R$ 130,89</span> (inclui taxa de R$ 0,99).
              </p>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 mb-6 text-left">
              <p className="text-xs uppercase font-extrabold text-gray-600 dark:text-gray-300 mb-1 tracking-wider">
                Sem IA
              </p>
              <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1 mt-1">
                <li><Check size={14} className="inline text-gray-400 mr-1" /> Plataforma de gestão manual</li>
                <li><Check size={14} className="inline text-gray-400 mr-1" /> 0 interações com IA</li>
              </ul>
            </div>

            <Button
              variant="outline"
              className="mb-8 dark:text-white dark:border-gray-600 w-full"
              onClick={() => handlePurchase('https://pay.cakto.com.br/etm9bn6_733901')}
            >
              Quero este plano
            </Button>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Até 100 alunos</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Gestão avançada</li>
              <li className="flex items-center gap-2 text-red-600 dark:text-red-400"><X size={16} className="text-red-600 dark:text-red-400" /> Sem IA incluída</li>
            </ul>
          </div>

          {/* FitCoach Manual 200 */}
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-[2rem] shadow-lg border border-gray-300 dark:border-gray-700 flex flex-col reveal delay-200">
            <div className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">FitCoach Manual 200</div>
            <h3 className="font-serif text-xl md:text-2xl text-nutri-dark dark:text-white font-bold mb-1">Até 200 alunos</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Plataforma manual, sem IA.</p>
            
            <div className="mb-6">
              <span className="text-2xl md:text-3xl font-bold text-nutri-dark dark:text-white">R$ 229,90</span>
              <span className="text-gray-500 text-sm">/mês</span>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Valor total no checkout: <span className="font-semibold">R$ 230,89</span> (inclui taxa de R$ 0,99).
              </p>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 mb-6 text-left">
              <p className="text-xs uppercase font-extrabold text-gray-600 dark:text-gray-300 mb-1 tracking-wider">
                Sem IA
              </p>
              <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1 mt-1">
                <li><Check size={14} className="inline text-gray-400 mr-1" /> Plataforma de gestão manual</li>
                <li><Check size={14} className="inline text-gray-400 mr-1" /> 0 interações com IA</li>
              </ul>
            </div>

            <Button
              variant="outline"
              className="mb-8 dark:text-white dark:border-gray-600 w-full"
              onClick={() => handlePurchase('https://pay.cakto.com.br/36aesom_733906')}
            >
              Quero este plano
            </Button>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Até 200 alunos</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Relatórios completos</li>
              <li className="flex items-center gap-2 text-red-600 dark:text-red-400"><X size={16} className="text-red-600 dark:text-red-400" /> Sem IA incluída</li>
            </ul>
          </div>

          {/* FitCoach Manual 300 */}
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-[2rem] shadow-lg border border-gray-300 dark:border-gray-700 flex flex-col reveal delay-300">
            <div className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">FitCoach Manual 300</div>
            <h3 className="font-serif text-xl md:text-2xl text-nutri-dark dark:text-white font-bold mb-1">Até 300 alunos</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Plataforma manual, sem IA.</p>
            
            <div className="mb-6">
              <span className="text-2xl md:text-3xl font-bold text-nutri-dark dark:text-white">R$ 329,90</span>
              <span className="text-gray-500 text-sm">/mês</span>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Valor total no checkout: <span className="font-semibold">R$ 330,89</span> (inclui taxa de R$ 0,99).
              </p>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 mb-6 text-left">
              <p className="text-xs uppercase font-extrabold text-gray-600 dark:text-gray-300 mb-1 tracking-wider">
                Sem IA
              </p>
              <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1 mt-1">
                <li><Check size={14} className="inline text-gray-400 mr-1" /> Plataforma de gestão manual</li>
                <li><Check size={14} className="inline text-gray-400 mr-1" /> 0 interações com IA</li>
              </ul>
            </div>

            <Button
              variant="outline"
              className="mb-8 dark:text-white dark:border-gray-600 w-full"
              onClick={() => handlePurchase('https://pay.cakto.com.br/3apuwtk_733924')}
            >
              Quero este plano
            </Button>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Até 300 alunos</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Multi-unidade</li>
              <li className="flex items-center gap-2 text-red-600 dark:text-red-400"><X size={16} className="text-red-600 dark:text-red-400" /> Sem IA incluída</li>
            </ul>
          </div>

        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-start max-w-7xl mx-auto mt-6">
          
          {/* FitCoach Manual 400 */}
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-[2rem] shadow-lg border border-gray-300 dark:border-gray-700 flex flex-col reveal delay-400">
            <div className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">FitCoach Manual 400</div>
            <h3 className="font-serif text-xl md:text-2xl text-nutri-dark dark:text-white font-bold mb-1">Até 400 alunos</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Plataforma manual, sem IA.</p>
            
            <div className="mb-6">
              <span className="text-2xl md:text-3xl font-bold text-nutri-dark dark:text-white">R$ 429,90</span>
              <span className="text-gray-500 text-sm">/mês</span>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Valor total no checkout: <span className="font-semibold">R$ 430,89</span> (inclui taxa de R$ 0,99).
              </p>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 mb-6 text-left">
              <p className="text-xs uppercase font-extrabold text-gray-600 dark:text-gray-300 mb-1 tracking-wider">
                Sem IA
              </p>
              <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1 mt-1">
                <li><Check size={14} className="inline text-gray-400 mr-1" /> Plataforma de gestão manual</li>
                <li><Check size={14} className="inline text-gray-400 mr-1" /> 0 interações com IA</li>
              </ul>
            </div>

            <Button
              variant="outline"
              className="mb-8 dark:text-white dark:border-gray-600 w-full"
              onClick={() => handlePurchase('https://pay.cakto.com.br/y9i88sn_733931')}
            >
              Quero este plano
            </Button>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Até 400 alunos</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Gestão completa</li>
              <li className="flex items-center gap-2 text-red-600 dark:text-red-400"><X size={16} className="text-red-600 dark:text-red-400" /> Sem IA incluída</li>
            </ul>
          </div>

          {/* FitCoach Manual 500 */}
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-[2rem] shadow-lg border border-gray-300 dark:border-gray-700 flex flex-col reveal delay-500">
            <div className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">FitCoach Manual 500</div>
            <h3 className="font-serif text-xl md:text-2xl text-nutri-dark dark:text-white font-bold mb-1">Até 500 alunos</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Plataforma manual, sem IA.</p>
            
            <div className="mb-6">
              <span className="text-2xl md:text-3xl font-bold text-nutri-dark dark:text-white">R$ 529,90</span>
              <span className="text-gray-500 text-sm">/mês</span>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Valor total no checkout: <span className="font-semibold">R$ 530,89</span> (inclui taxa de R$ 0,99).
              </p>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 mb-6 text-left">
              <p className="text-xs uppercase font-extrabold text-gray-600 dark:text-gray-300 mb-1 tracking-wider">
                Sem IA
              </p>
              <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1 mt-1">
                <li><Check size={14} className="inline text-gray-400 mr-1" /> Plataforma de gestão manual</li>
                <li><Check size={14} className="inline text-gray-400 mr-1" /> 0 interações com IA</li>
              </ul>
            </div>

            <Button
              variant="outline"
              className="mb-8 dark:text-white dark:border-gray-600 w-full"
              onClick={() => handlePurchase('https://pay.cakto.com.br/ycavtyt_733939')}
            >
              Quero este plano
            </Button>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Até 500 alunos</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Gestão completa</li>
              <li className="flex items-center gap-2 text-red-600 dark:text-red-400"><X size={16} className="text-red-600 dark:text-red-400" /> Sem IA incluída</li>
            </ul>
          </div>

          {/* FitCoach Manual 600 */}
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-[2rem] shadow-lg border border-gray-300 dark:border-gray-700 flex flex-col reveal delay-600">
            <div className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">FitCoach Manual 600</div>
            <h3 className="font-serif text-xl md:text-2xl text-nutri-dark dark:text-white font-bold mb-1">Até 600 alunos</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Plataforma manual, sem IA.</p>
            
            <div className="mb-6">
              <span className="text-2xl md:text-3xl font-bold text-nutri-dark dark:text-white">R$ 629,90</span>
              <span className="text-gray-500 text-sm">/mês</span>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Valor total no checkout: <span className="font-semibold">R$ 630,89</span> (inclui taxa de R$ 0,99).
              </p>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 mb-6 text-left">
              <p className="text-xs uppercase font-extrabold text-gray-600 dark:text-gray-300 mb-1 tracking-wider">
                Sem IA
              </p>
              <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1 mt-1">
                <li><Check size={14} className="inline text-gray-400 mr-1" /> Plataforma de gestão manual</li>
                <li><Check size={14} className="inline text-gray-400 mr-1" /> 0 interações com IA</li>
              </ul>
            </div>

            <Button
              variant="outline"
              className="mb-8 dark:text-white dark:border-gray-600 w-full"
              onClick={() => handlePurchase('https://pay.cakto.com.br/vobyxhj_733955')}
            >
              Quero este plano
            </Button>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Até 600 alunos</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Gestão completa</li>
              <li className="flex items-center gap-2 text-red-600 dark:text-red-400"><X size={16} className="text-red-600 dark:text-red-400" /> Sem IA incluída</li>
            </ul>
          </div>

        </div>
      </section>

      {/* 10. CTA Final */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-br from-blue-600 to-nutri-dark dark:from-blue-700 dark:to-gray-900 rounded-3xl p-12 text-white reveal">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Pronto para transformar sua academia?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Ative a FitCoach.AI hoje e ofereça IA multimodal completa aos seus alunos, 
            com planos mensais e anuais que incluem tudo.
          </p>
          <Button variant="secondary" className="text-lg py-4 px-8" onClick={scrollToPlans}>
            Quero ativar FitCoach.AI na minha academia <ArrowRight size={20} className="ml-2" />
          </Button>
          <p className="text-sm text-blue-200/80 mt-4">
            Planos mensais e anuais com IA completa inclusa
          </p>
        </div>
      </section>
    </div>
  );
};
