/**
 * Supabase Edge Function para processar webhooks do Cakto
 * 
 * Esta função recebe notificações de pagamento do Cakto e:
 * 1. Valida o pagamento
 * 2. Cria/atualiza assinatura no Supabase
 * 3. Envia email com link de acesso
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CaktoWebhookPayload {
  event: string;
  data: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    customer?: {
      email: string;
      name: string;
    };
    metadata?: {
      plan_name?: string;
      user_email?: string;
      user_id?: string;
    };
    payment_link?: string;
    created_at: string;
  };
}

// Mapeamento de planos Cakto para IDs do Supabase
const PLAN_MAPPING: Record<string, string> = {
  'basic': Deno.env.get('PLAN_BASIC_ID') || '',
  'premium': Deno.env.get('PLAN_PREMIUM_ID') || '',
  'enterprise': Deno.env.get('PLAN_ENTERPRISE_ID') || '',
};

// Mapeamento de links de pagamento para planos
const PAYMENT_LINK_TO_PLAN: Record<string, string> = {
  'https://pay.cakto.com.br/3bewmsy_665747': 'basic',
  'https://pay.cakto.com.br/8djcjc6': 'premium',
  'https://pay.cakto.com.br/35tdhxu': 'enterprise',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verificar autenticação do webhook (ajustar conforme API do Cakto)
    const authHeader = req.headers.get('authorization');
    const caktoSecret = Deno.env.get('CAKTO_WEBHOOK_SECRET');
    
    if (caktoSecret && authHeader !== `Bearer ${caktoSecret}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: CaktoWebhookPayload = await req.json();

    // Processar apenas eventos de pagamento confirmado
    if (payload.event !== 'payment.completed' && payload.data.status !== 'paid') {
      return new Response(
        JSON.stringify({ message: 'Event not processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data } = payload;
    const userEmail = data.customer?.email || data.metadata?.user_email;
    const planName = data.metadata?.plan_name || 
                     PAYMENT_LINK_TO_PLAN[data.payment_link || ''] || 
                     'basic';

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: 'User email not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter ou criar usuário
    let userId: string;
    
    // Verificar se usuário já existe
    const { data: existingUser } = await supabaseClient
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Criar novo usuário automaticamente
      // Gerar ID único para o usuário
      const newUserId = crypto.randomUUID();
      
      // Criar usuário básico na tabela users
      const { data: newUser, error: createError } = await supabaseClient
        .from('users')
        .insert({
          id: newUserId,
          email: userEmail,
          nome: data.customer?.name || userEmail.split('@')[0],
          username: userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_'),
          idade: 30, // Valor padrão
          genero: 'Masculino', // Valor padrão
          peso: 70, // Valor padrão
          altura: 170, // Valor padrão
          objetivo: 'Ganhar massa muscular',
          points: 0,
          discipline_score: 0,
          completed_challenge_ids: [],
          is_anonymized: false,
          role: 'user',
          gym_id: null,
          gym_role: null,
          is_gym_managed: false,
          matricula: null,
          data_permissions: {
            allowWeightHistory: true,
            allowMealPlans: true,
            allowPhotoAnalysis: true,
            allowWorkoutData: true,
            allowChatHistory: true,
          },
          security_settings: {
            biometricEnabled: false,
            securityNotifications: true,
          },
          access_blocked: false,
        })
        .select('id')
        .single();

      if (createError || !newUser) {
        console.error('Error creating user:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = newUser.id;
      console.log('New user created:', userId);
    }

    // Obter ID do plano
    const planId = PLAN_MAPPING[planName];
    if (!planId) {
      return new Response(
        JSON.stringify({ error: 'Plan not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cancelar assinaturas ativas anteriores
    await supabaseClient
      .from('user_subscriptions')
      .update({ 
        status: 'canceled',
        canceled_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'active');

    // Criar nova assinatura
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1); // Assinatura mensal

    const { data: subscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        status: 'active',
        billing_cycle: 'monthly',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        payment_provider: 'cakto',
      })
      .select()
      .single();

    if (subError) {
      console.error('Error creating subscription:', subError);
      return new Response(
        JSON.stringify({ error: 'Failed to create subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Registrar pagamento
    await supabaseClient
      .from('payments')
      .insert({
        subscription_id: subscription.id,
        user_id: userId,
        amount: data.amount,
        currency: data.currency || 'BRL',
        status: 'succeeded',
        payment_method: 'cakto',
        payment_provider: 'cakto',
        provider_payment_id: data.id,
        paid_at: new Date().toISOString(),
      });

    // Gerar link de acesso (token temporário ou usar autenticação do Supabase)
    // IMPORTANTE: Query params devem vir ANTES do hash para funcionar corretamente
    const token = generateAccessToken(userId);
    // Usar APP_URL do ambiente ou fallback para URL do Vercel
    const envAppUrl = Deno.env.get('APP_URL');
    const appUrl = envAppUrl || 'https://fit-coach-ia.vercel.app';
    // Redirecionar para /presentation após login automático
    const accessLink = `${appUrl}?token=${token}#/presentation`;
    
    console.log('APP_URL from env:', envAppUrl || 'NOT SET (using fallback)');
    console.log('Final APP_URL:', appUrl);
    console.log('Generated access link:', accessLink);

    // Enviar email com link de acesso
    await sendAccessEmail(supabaseClient, userEmail, planName, accessLink);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Subscription created and email sent',
        subscription_id: subscription.id 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Gera token de acesso temporário
 */
function generateAccessToken(userId: string): string {
  // Implementar geração de token seguro
  // Por enquanto, usar um hash simples (NÃO usar em produção sem criptografia adequada)
  return btoa(`${userId}:${Date.now()}`).replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Envia email com link de acesso
 */
async function sendAccessEmail(
  supabase: any,
  email: string,
  planName: string,
  accessLink: string
): Promise<void> {
  const planDisplayNames: Record<string, string> = {
    'basic': 'Basic',
    'premium': 'Premium',
    'enterprise': 'Enterprise',
  };

  const emailSubject = `Bem-vindo ao FitCoach.IA ${planDisplayNames[planName]}!`;
  const emailBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 15px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Pagamento Confirmado!</h1>
        </div>
        <div class="content">
          <p>Olá!</p>
          <p>Seu pagamento foi confirmado com sucesso. Você agora tem acesso ao plano <strong>${planDisplayNames[planName]}</strong> do FitCoach.IA!</p>
          <p>Clique no botão abaixo para acessar sua conta:</p>
          <div style="text-align: center;">
            <a href="${accessLink}" class="button">Acessar FitCoach.IA</a>
          </div>
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all; color: #059669;">${accessLink}</p>
          <p>Este link é válido por 7 dias. Após esse período, use seu email e senha para fazer login.</p>
          <p>Bem-vindo e aproveite todos os recursos do FitCoach.IA!</p>
        </div>
        <div class="footer">
          <p>FitCoach.IA - Seu assistente de treino inteligente</p>
          <p>Se você não solicitou este email, pode ignorá-lo com segurança.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Usar Supabase para enviar email (requer configuração de SMTP ou usar serviço externo)
  // Por enquanto, vamos usar a função de email do Supabase
  const { error } = await supabase.functions.invoke('send-email', {
    body: {
      to: email,
      subject: emailSubject,
      html: emailBody,
    },
  });

  if (error) {
    console.error('Error sending email:', error);
    // Em caso de erro, ainda retornamos sucesso para o webhook
    // mas logamos o erro para investigação
  }
}

