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
      // IMPORTANTE: Primeiro criar conta no Supabase Auth
      // Gerar senha temporária segura
      const tempPassword = generateTempPassword();
      
      // Criar usuário no Supabase Auth primeiro
      const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
        email: userEmail,
        password: tempPassword,
        email_confirm: true, // Confirmar email automaticamente
        user_metadata: {
          name: data.customer?.name || userEmail.split('@')[0],
        }
      });

      if (authError || !authUser) {
        console.error('Error creating auth user:', authError);
        return new Response(
          JSON.stringify({ error: 'Failed to create authentication account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const newUserId = authUser.user.id;
      const username = userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      // Criar usuário básico na tabela users com o mesmo ID do Auth
      const { data: newUser, error: createError } = await supabaseClient
        .from('users')
        .insert({
          id: newUserId, // Usar o mesmo ID do Auth
          email: userEmail,
          nome: data.customer?.name || userEmail.split('@')[0],
          username: username,
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
          plan_type: planName, // Definir plano já aqui
          subscription_status: 'active',
          voice_daily_limit_seconds: 900,
          voice_used_today_seconds: 0,
          voice_balance_upsell: 0,
          text_msg_count_today: 0,
        })
        .select('id')
        .single();

      if (createError || !newUser) {
        console.error('Error creating user:', createError);
        // Se falhar, tentar deletar o usuário do Auth
        await supabaseClient.auth.admin.deleteUser(newUserId);
        return new Response(
          JSON.stringify({ error: 'Failed to create user account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = newUser.id;
      console.log('New user created:', userId);
      
      // Armazenar senha temporária para enviar no email
      // (será usado na função sendAccessEmail)
      (payload as any).tempPassword = tempPassword;
      (payload as any).username = username;
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

    // Gerar link de acesso
    // Usar APP_URL do ambiente ou fallback para URL do Vercel
    const envAppUrl = Deno.env.get('APP_URL');
    const appUrl = envAppUrl || 'https://fit-coach-ia.vercel.app';
    
    // Obter senha temporária e username (se foi criado novo usuário)
    const tempPassword = (payload as any).tempPassword;
    const username = (payload as any).username || existingUser?.username || userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Gerar token de acesso também (para login automático opcional)
    const token = generateAccessToken(userId);
    const accessLink = `${appUrl}?token=${token}#/presentation`;
    const loginLink = `${appUrl}#/login`;
    
    console.log('APP_URL from env:', envAppUrl || 'NOT SET (using fallback)');
    console.log('Final APP_URL:', appUrl);
    console.log('Generated access link:', accessLink);
    console.log('Username:', username);
    console.log('Has temp password:', !!tempPassword);

    // Enviar email com link de acesso e credenciais
    await sendAccessEmail(supabaseClient, userEmail, planName, accessLink, loginLink, username, tempPassword);

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
 * Gera senha temporária segura
 */
function generateTempPassword(): string {
  // Gerar senha aleatória de 12 caracteres
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Envia email com link de acesso e credenciais
 */
async function sendAccessEmail(
  supabase: any,
  email: string,
  planName: string,
  accessLink: string,
  loginLink: string,
  username: string,
  tempPassword?: string
): Promise<void> {
  const planDisplayNames: Record<string, string> = {
    'basic': 'Basic',
    'premium': 'Premium',
    'enterprise': 'Enterprise',
  };

  const emailSubject = `Bem-vindo ao FitCoach.IA ${planDisplayNames[planName]}!`;
  
  // Se houver senha temporária, incluir credenciais no email
  const credentialsSection = tempPassword ? `
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
      <h3 style="margin-top: 0; color: #92400e;">🔑 Suas Credenciais de Acesso</h3>
      <p style="margin: 10px 0;"><strong>Nome de usuário:</strong> <code style="background: white; padding: 5px 10px; border-radius: 3px;">${username}</code></p>
      <p style="margin: 10px 0;"><strong>Senha temporária:</strong> <code style="background: white; padding: 5px 10px; border-radius: 3px;">${tempPassword}</code></p>
      <p style="margin: 10px 0; font-size: 14px; color: #92400e;">⚠️ <strong>Importante:</strong> Guarde esta senha com segurança. Recomendamos alterá-la após o primeiro acesso.</p>
    </div>
  ` : '';
  
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
        .button { display: inline-block; padding: 15px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .button-secondary { display: inline-block; padding: 12px 24px; background: #6b7280; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        code { font-family: 'Courier New', monospace; }
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
          
          ${credentialsSection}
          
          <h3 style="color: #059669; margin-top: 30px;">📱 Como Acessar</h3>
          <p><strong>Opção 1 - Acesso Rápido (Recomendado):</strong></p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${accessLink}" class="button">🚀 Acessar Agora (Login Automático)</a>
          </div>
          <p style="font-size: 14px; color: #6b7280; text-align: center;">Clique no botão acima para acessar automaticamente</p>
          
          <p style="margin-top: 30px;"><strong>Opção 2 - Login Manual:</strong></p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${loginLink}" class="button-secondary">🔑 Fazer Login Manual</a>
          </div>
          <p style="font-size: 14px; color: #6b7280;">Use suas credenciais acima na página de login</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p><strong>Links diretos:</strong></p>
          <ul style="font-size: 14px; color: #6b7280;">
            <li>Acesso rápido: <a href="${accessLink}" style="color: #059669; word-break: break-all;">${accessLink}</a></li>
            <li>Login manual: <a href="${loginLink}" style="color: #059669;">${loginLink}</a></li>
          </ul>
          
          <p style="margin-top: 30px;">Bem-vindo e aproveite todos os recursos do FitCoach.IA!</p>
        </div>
        <div class="footer">
          <p>FitCoach.IA - Seu assistente de treino inteligente</p>
          <p>Se você não solicitou este email, pode ignorá-lo com segurança.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Tentar enviar email via Supabase (se função existir)
  // Caso contrário, usar serviço externo ou apenas logar
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: email,
        subject: emailSubject,
        html: emailBody,
      },
    });

    if (error) {
      console.error('Error sending email via function:', error);
      // Tentar usar Resend ou outro serviço se disponível
      // Por enquanto, apenas logar
      console.log('Email que deveria ser enviado:', {
        to: email,
        subject: emailSubject,
        hasCredentials: !!tempPassword
      });
    }
  } catch (error) {
    console.error('Error invoking send-email function:', error);
    // Logar informações para debug
    console.log('Email que deveria ser enviado:', {
      to: email,
      subject: emailSubject,
      username: username,
      hasTempPassword: !!tempPassword
    });
  }
}


