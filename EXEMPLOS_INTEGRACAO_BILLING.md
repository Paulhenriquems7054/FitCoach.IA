/**
 * EXEMPLOS DE INTEGRAÇÃO - Sistema de Billing
 * Mostra como usar os hooks e componentes na aplicação
 */

// ============================================
// 1. USAR NO DASHBOARD
// ============================================

import { UsageIndicator, SpendingReport } from '@/hooks/useSpendingTracker';

export function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna esquerda: Uso */}
        <div className="lg:col-span-2">
          <UsageIndicator />
          <SpendingReport />
        </div>

        {/* Coluna direita: Menu rápido */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Planos</h3>
          <a href="/plans" className="block w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 mb-2">
            Ver Todos os Planos
          </a>
          <a href="/billing" className="block w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600">
            Histórico de Faturas
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 2. RASTREAR USO AO FAZER ANÁLISE DE REFEIÇÃO
// ============================================

import { useSpendingTracker } from '@/hooks/useSpendingTracker';
import { useState } from 'react';

export function MealAnalysisPage() {
  const { trackOperation, isLimitExceeded } = useSpendingTracker();
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyzeImage = async (imageFile: File) => {
    if (isLimitExceeded()) {
      alert('Você atingiu o limite do seu plano. Faça upgrade para continuar.');
      return;
    }

    try {
      setAnalyzing(true);

      // Enviar imagem para Gemini Vision
      const base64Image = await fileToBase64(imageFile);
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });

      const result = await response.json();

      // ✅ RASTREAR O USO
      await trackOperation(
        'image_analysis',
        result.tokensUsed || 0,
        result.estimatedCost || 0.05
      );

      // Exibir resultado
      console.log('Análise:', result.analysis);

    } catch (error) {
      console.error('Erro ao analisar imagem:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Analisar Refeição</h1>
      
      <input
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files && handleAnalyzeImage(e.target.files[0])}
        disabled={analyzing}
      />

      {analyzing && <p className="mt-2 text-gray-600">Analisando imagem...</p>}
    </div>
  );
}

// ============================================
// 3. RASTREAR USO AO FAZER PERGUNTA COM IA
// ============================================

import { useSpendingTracker } from '@/hooks/useSpendingTracker';
import { useState } from 'react';

export function ChatPage() {
  const { trackOperation, usage, isLimitExceeded, isNearLimit } = useSpendingTracker();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Verificar limite
    if (isLimitExceeded()) {
      alert('Você atingiu o limite. Upgrade necessário.');
      return;
    }

    try {
      setSending(true);
      const userMessage = input;
      setInput('');
      setMessages([...messages, { role: 'user', content: userMessage }]);

      // Chamar API do Gemini
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages
        })
      });

      const result = await response.json();

      // ✅ RASTREAR O USO
      await trackOperation(
        'text_analysis',
        result.tokensUsed || 100,
        result.estimatedCost || 0.002
      );

      setMessages(prev => [...prev, { role: 'assistant', content: result.response }]);

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Desculpe, houve um erro ao processar sua mensagem.' 
      }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header com info de uso */}
      <div className="bg-white border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Assistente IA</h1>
        {usage && (
          <div className="text-sm text-gray-600">
            {isNearLimit() && <span className="text-yellow-600">⚠️ Próximo do limite</span>}
            {isLimitExceeded() && <span className="text-red-600">❌ Limite atingido</span>}
            {!isNearLimit() && !isLimitExceeded() && (
              <span>{usage.used}/{usage.limit} requisições</span>
            )}
          </div>
        )}
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block max-w-xs p-3 rounded ${
              msg.role === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-800'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Digite sua pergunta..."
            disabled={sending || isLimitExceeded()}
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            onClick={handleSendMessage}
            disabled={sending || isLimitExceeded()}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {sending ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 4. VERIFICAR LIMITE ANTES DE OPERAÇÃO CARA
// ============================================

import { useSpendingTracker } from '@/hooks/useSpendingTracker';

export function PremiumFeatureButton() {
  const { usage, plan, isLimitExceeded } = useSpendingTracker();

  // Verificar se operação é permitida
  const canUseFeature = () => {
    if (!usage || !plan) return false;
    
    // Feature premium precisa de 50 requisições livres
    const remainingRequests = usage.limit - usage.used;
    return remainingRequests >= 50 && !isLimitExceeded();
  };

  if (!canUseFeature()) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-700 mb-2">
          Esta feature premium requer espaço suficiente no plano.
        </p>
        <a href="/plans" className="text-sm text-yellow-600 hover:underline">
          Upgrade para plano superior →
        </a>
      </div>
    );
  }

  return (
    <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
      Usar Feature Premium
    </button>
  );
}

// ============================================
// 5. PÁGINA DE SELEÇÃO DE PLANOS
// ============================================

import { useSpendingTracker } from '@/hooks/useSpendingTracker';
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabaseClient';

export function PlansPage() {
  const { plan: currentPlan, subscription } = useSpendingTracker();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;
        setPlans(data);
      } catch (err) {
        console.error('Erro ao carregar planos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleUpgrade = async (planId: string) => {
    // Redirecionar para checkout do Stripe
    window.location.href = `/checkout?plan=${planId}`;
  };

  if (loading) return <div>Carregando planos...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Escolha seu Plano</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`border-2 rounded-lg p-6 ${
              currentPlan?.id === p.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200'
            }`}
          >
            {currentPlan?.id === p.id && (
              <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full inline-block mb-2">
                Plano Atual
              </div>
            )}

            <h3 className="text-2xl font-bold mb-2">{p.name}</h3>
            <p className="text-4xl font-bold text-blue-600 mb-4">
              R$ {p.price === 0 ? 'Grátis' : p.price}
              {p.price > 0 && <span className="text-sm text-gray-600">/mês</span>}
            </p>

            <ul className="space-y-2 mb-6">
              <li className="text-sm">
                <span className="font-semibold">{p.requests_per_month}</span> requisições/mês
              </li>
              <li className="text-sm">
                <span className="font-semibold">{p.image_analysis_per_month}</span> análises de imagem
              </li>
              {p.features?.advanced_reports && (
                <li className="text-sm">✅ Relatórios avançados</li>
              )}
              {p.features?.priority_support && (
                <li className="text-sm">✅ Suporte prioritário</li>
              )}
            </ul>

            {currentPlan?.id === p.id ? (
              <button disabled className="w-full bg-gray-400 text-white py-2 rounded cursor-not-allowed">
                Plano Atual
              </button>
            ) : (
              <button
                onClick={() => handleUpgrade(p.id)}
                className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
              >
                {p.price === 0 ? 'Fazer Downgrade' : 'Upgrade'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// 6. HELPER: Converter arquivo para base64
// ============================================

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove o data:image/...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
}

// ============================================
// 7. WEBHOOK RECEPTOR (Para Stripe)
// ============================================

// Arquivo: pages/api/webhooks/stripe.ts

import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { supabase } from '@/services/supabaseClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const body = req.body;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Atualizar status de pagamento
        await supabase
          .from('invoices')
          .update({ status: 'paid', paid_at: new Date() })
          .eq('stripe_invoice_id', invoice.id);

        // Resetar contador de uso se renovação de assinatura
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          
          // Atualizar período de renovação
          await supabase
            .from('subscriptions')
            .update({
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString().split('T')[0],
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0]
            })
            .eq('stripe_subscription_id', subscription.id);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        await supabase
          .from('invoices')
          .update({ status: 'failed' })
          .eq('stripe_invoice_id', invoice.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
}
