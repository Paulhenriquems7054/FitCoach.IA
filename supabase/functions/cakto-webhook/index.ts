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

// Mapeamento de checkout IDs Cakto para produtos conforme documentação
interface ProductMapping {
  type: 'subscription' | 'recharge' | 'company' | 'personal';
  plan?: string;
  name?: string;
}

const CHECKOUT_ID_TO_PRODUCT: Record<string, ProductMapping> = {
  // Planos B2C
  'zeygxve_668421': { type: 'subscription', plan: 'monthly', name: 'Plano Mensal' },
  'wvbkepi_668441': { type: 'subscription', plan: 'annual_vip', name: 'Plano Anual VIP' },
  
  // Recargas
  'ihfy8cz_668443': { type: 'recharge', plan: 'turbo', name: 'Sessão Turbo' },
  'hhxugxb_668446': { type: 'recharge', plan: 'voice_bank', name: 'Banco de Voz 100' },
  'trszqtv_668453': { type: 'recharge', plan: 'pass_libre', name: 'Passe Livre 30 Dias' },
  
  // Planos B2B (Academias)
  'cemyp2n_668537': { type: 'company', plan: 'starter', name: 'Pack Starter' },
  'vi6djzq_668541': { type: 'company', plan: 'growth', name: 'Pack Growth' },
  '3dis6ds_668546': { type: 'company', plan: 'pro', name: 'Pack Pro' },
  
  // Planos Personal Trainers
  '3dgheuc_666289': { type: 'personal', plan: 'team_5', name: 'Team 5' },
  '3etp85e_666303': { type: 'personal', plan: 'team_15', name: 'Team 15' },
  
  // Links antigos (compatibilidade)
  '3bewmsy_665747': { type: 'subscription', plan: 'basic', name: 'Basic' },
  '8djcjc6': { type: 'subscription', plan: 'premium', name: 'Premium' },
  '35tdhxu': { type: 'subscription', plan: 'enterprise', name: 'Enterprise' },
};

/**
 * Extrai checkout ID do payment_link
 */
function extractCheckoutId(paymentLink?: string): string | null {
  if (!paymentLink) return null;
  // Formato: https://pay.cakto.com.br/zeygxve_668421
  const match = paymentLink.match(/pay\.cakto\.com\.br\/([a-z0-9_]+)/);
  return match ? match[1] : null;
}

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

    // 1. Salvar webhook no log primeiro
    let webhookLogId: string | null = null;
    try {
      const { data: webhookLog, error: logError } = await supabaseClient
        .from('cakto_webhooks')
        .insert({
          event_type: payload.event,
          cakto_transaction_id: payload.data.id,
          checkout_id: extractCheckoutId(payload.data.payment_link),
          payload: payload as any,
          processed: false,
        })
        .select('id')
        .single();

      if (logError) {
        console.error('Error logging webhook:', logError);
      } else {
        webhookLogId = webhookLog?.id || null;
      }
    } catch (error) {
      console.error('Error creating webhook log:', error);
      // Continuar mesmo se falhar o log
    }

    // Processar apenas eventos de pagamento confirmado
    if (payload.event !== 'payment.completed' && payload.data.status !== 'paid') {
      // Marcar como processado mesmo que não seja evento relevante
      if (webhookLogId) {
        await supabaseClient
          .from('cakto_webhooks')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('id', webhookLogId);
      }
      return new Response(
        JSON.stringify({ message: 'Event not processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data } = payload;
    const userEmail = data.customer?.email || data.metadata?.user_email;
    
    // Extrair checkout ID do payment_link
    const checkoutId = extractCheckoutId(data.payment_link);
    const product = checkoutId ? CHECKOUT_ID_TO_PRODUCT[checkoutId] : null;

    if (!userEmail) {
      if (webhookLogId) {
        await supabaseClient
          .from('cakto_webhooks')
          .update({ 
            processed: true, 
            processed_at: new Date().toISOString(),
            error_message: 'User email not found'
          })
          .eq('id', webhookLogId);
      }
      return new Response(
        JSON.stringify({ error: 'User email not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!product) {
      if (webhookLogId) {
        await supabaseClient
          .from('cakto_webhooks')
          .update({ 
            processed: true, 
            processed_at: new Date().toISOString(),
            error_message: `Unknown checkout_id: ${checkoutId}`
          })
          .eq('id', webhookLogId);
      }
      return new Response(
        JSON.stringify({ error: `Unknown checkout_id: ${checkoutId}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter ou criar usuário
    let userId: string;
    let existingUser: any = null;
    
    // Verificar se usuário já existe
    const { data: userData } = await supabaseClient
      .from('users')
      .select('id, username')
      .eq('email', userEmail)
      .single();

    if (userData) {
      userId = userData.id;
      existingUser = userData;
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
        if (webhookLogId) {
          await supabaseClient
            .from('cakto_webhooks')
            .update({ 
              processed: true, 
              processed_at: new Date().toISOString(),
              error_message: 'Failed to create authentication account'
            })
            .eq('id', webhookLogId);
        }
        return new Response(
          JSON.stringify({ error: 'Failed to create authentication account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const newUserId = authUser.user.id;
      const username = userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      // Determinar plan_type baseado no produto (se for subscription)
      const defaultPlanType = product.type === 'subscription' ? product.plan! : 'free';
      
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
          plan_type: defaultPlanType, // Definir plano baseado no produto
          subscription_status: product.type === 'subscription' ? 'active' : 'inactive',
          voice_daily_limit_seconds: 900,
          voice_used_today_seconds: 0,
          voice_balance_upsell: 0,
          text_msg_count_today: 0,
        })
        .select('id, username')
        .single();

      if (createError || !newUser) {
        console.error('Error creating user:', createError);
        // Se falhar, tentar deletar o usuário do Auth
        await supabaseClient.auth.admin.deleteUser(newUserId);
        if (webhookLogId) {
          await supabaseClient
            .from('cakto_webhooks')
            .update({ 
              processed: true, 
              processed_at: new Date().toISOString(),
              error_message: 'Failed to create user account'
            })
            .eq('id', webhookLogId);
        }
        return new Response(
          JSON.stringify({ error: 'Failed to create user account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = newUser.id;
      existingUser = newUser;
      console.log('New user created:', userId);
      
      // Armazenar senha temporária para enviar no email
      // (será usado na função sendAccessEmail)
      (payload as any).tempPassword = tempPassword;
      (payload as any).username = username;
    }

    // Processar baseado no tipo de produto
    let result: any = { success: true };
    
    if (product.type === 'subscription') {
      result = await processSubscription(supabaseClient, userId, product.plan!, data, userEmail, existingUser, payload);
    } else if (product.type === 'recharge') {
      result = await processRecharge(supabaseClient, userId, product.plan!, data, userEmail);
    } else if (product.type === 'company') {
      // TODO: Implementar processamento B2B
      result = { success: false, error: 'B2B processing not yet implemented' };
    } else if (product.type === 'personal') {
      // TODO: Implementar processamento Personal
      result = { success: false, error: 'Personal trainer processing not yet implemented' };
    }

    // Atualizar webhook log com resultado
    if (webhookLogId) {
      await supabaseClient
        .from('cakto_webhooks')
        .update({ 
          processed: true, 
          processed_at: new Date().toISOString(),
          subscription_id: result.subscription_id || null,
          payment_id: result.payment_id || null,
          error_message: result.error || null
        })
        .eq('id', webhookLogId);
    }

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: result.message || 'Payment processed successfully',
        subscription_id: result.subscription_id,
        recharge_id: result.recharge_id
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
 * Processa assinatura (B2C)
 */
async function processSubscription(
  supabase: any,
  userId: string,
  planName: string,
  paymentData: any,
  userEmail: string,
  existingUser: any,
  payload: any
): Promise<{ success: boolean; subscription_id?: string; payment_id?: string; message?: string; error?: string }> {
  try {
    // Buscar plano na tabela subscription_plans pelo nome
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('id, name, price_monthly, price_yearly')
      .eq('name', planName)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return { success: false, error: `Plan ${planName} not found` };
    }

    // Determinar ciclo de faturamento (mensal ou anual)
    const isAnnual = planName === 'annual_vip';
    const billingCycle = isAnnual ? 'yearly' : 'monthly';

    // Cancelar assinaturas ativas anteriores
    await supabase
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
    if (isAnnual) {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_id: plan.id,
        status: 'active',
        billing_cycle: billingCycle,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        payment_provider: 'cakto',
      })
      .select()
      .single();

    if (subError) {
      console.error('Error creating subscription:', subError);
      return { success: false, error: 'Failed to create subscription' };
    }

    // Registrar pagamento
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        subscription_id: subscription.id,
        user_id: userId,
        amount: paymentData.amount,
        currency: paymentData.currency || 'BRL',
        status: 'succeeded',
        payment_method: 'cakto',
        payment_provider: 'cakto',
        provider_payment_id: paymentData.id,
        paid_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment:', paymentError);
    }

    // Gerar link de acesso
    const envAppUrl = Deno.env.get('APP_URL');
    const appUrl = envAppUrl || 'https://fit-coach-ia.vercel.app';
    
    const tempPassword = (payload as any).tempPassword;
    const username = (payload as any).username || existingUser?.username || userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    const token = generateAccessToken(userId);
    const accessLink = `${appUrl}?token=${token}#/presentation`;
    const loginLink = `${appUrl}#/login`;

    // Enviar email com link de acesso e credenciais
    await sendAccessEmail(supabase, userEmail, planName, accessLink, loginLink, username, tempPassword);

    return { 
      success: true, 
      subscription_id: subscription.id,
      payment_id: payment?.id,
      message: 'Subscription created and email sent'
    };
  } catch (error: any) {
    console.error('Error processing subscription:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Processa recarga
 */
async function processRecharge(
  supabase: any,
  userId: string,
  rechargeType: string,
  paymentData: any,
  userEmail: string
): Promise<{ success: boolean; recharge_id?: string; payment_id?: string; message?: string; error?: string }> {
  try {
    const rechargeConfig: Record<string, { name: string; quantity: number; validUntilHours: number | null }> = {
      turbo: { name: 'Sessão Turbo', quantity: 30, validUntilHours: 24 },
      voice_bank: { name: 'Banco de Voz 100', quantity: 100, validUntilHours: null }, // Não expira
      pass_libre: { name: 'Passe Livre 30 Dias', quantity: 30, validUntilHours: 30 * 24 }, // 30 dias
    };

    const config = rechargeConfig[rechargeType];
    if (!config) {
      return { success: false, error: `Unknown recharge type: ${rechargeType}` };
    }

    const validFrom = new Date();
    const validUntil = config.validUntilHours
      ? new Date(validFrom.getTime() + config.validUntilHours * 60 * 60 * 1000)
      : null;
    const expiresAt = rechargeType === 'pass_libre' ? validUntil : null;

    // Criar recarga
    const { data: recharge, error: rechargeError } = await supabase
      .from('recharges')
      .insert({
        user_id: userId,
        recharge_type: rechargeType,
        recharge_name: config.name,
        amount_paid: paymentData.amount,
        quantity: config.quantity,
        valid_from: validFrom.toISOString(),
        valid_until: validUntil?.toISOString() || null,
        expires_at: expiresAt?.toISOString() || null,
        status: 'active',
        cakto_transaction_id: paymentData.id,
        cakto_checkout_id: extractCheckoutId(paymentData.payment_link),
        payment_status: 'paid',
      })
      .select()
      .single();

    if (rechargeError) {
      console.error('Error creating recharge:', rechargeError);
      return { success: false, error: 'Failed to create recharge' };
    }

    // Aplicar recarga ao usuário
    if (rechargeType === 'voice_bank') {
      // Somar minutos ao voice_balance_upsell (em segundos)
      const { error: updateError } = await supabase
        .from('users')
        .update({
          voice_balance_upsell: supabase.raw(`COALESCE(voice_balance_upsell, 0) + ${config.quantity * 60}`)
        })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Error updating voice balance:', updateError);
        // Continuar mesmo se falhar
      }
    } else if (rechargeType === 'pass_libre') {
      // Marcar passe livre ativo (pode usar um campo na tabela users ou criar flag)
      // Por enquanto, apenas registrar na recarga
      // TODO: Implementar lógica para remover limite diário por 30 dias
    }

    // Registrar pagamento
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        amount: paymentData.amount,
        currency: paymentData.currency || 'BRL',
        status: 'succeeded',
        payment_method: 'cakto',
        payment_provider: 'cakto',
        provider_payment_id: paymentData.id,
        paid_at: new Date().toISOString(),
        metadata: { recharge_id: recharge.id, recharge_type: rechargeType },
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment:', paymentError);
    }

    // Enviar email de confirmação de recarga
    await sendRechargeEmail(supabase, userEmail, config.name, recharge);

    return { 
      success: true, 
      recharge_id: recharge.id,
      payment_id: payment?.id,
      message: 'Recharge created successfully'
    };
  } catch (error: any) {
    console.error('Error processing recharge:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

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
    'monthly': 'Plano Mensal',
    'annual_vip': 'Plano Anual VIP',
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

/**
 * Envia email de confirmação de recarga
 */
async function sendRechargeEmail(
  supabase: any,
  email: string,
  rechargeName: string,
  recharge: any
): Promise<void> {
  const emailSubject = `Recarga ${rechargeName} confirmada!`;
  
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
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Recarga Confirmada!</h1>
        </div>
        <div class="content">
          <p>Olá!</p>
          <p>Sua recarga <strong>${rechargeName}</strong> foi confirmada com sucesso!</p>
          <p><strong>Detalhes:</strong></p>
          <ul>
            <li>Produto: ${rechargeName}</li>
            <li>Quantidade: ${recharge.quantity} ${recharge.recharge_type === 'pass_libre' ? 'dias' : 'minutos'}</li>
            <li>Valor pago: R$ ${recharge.amount_paid.toFixed(2).replace('.', ',')}</li>
            ${recharge.valid_until ? `<li>Válido até: ${new Date(recharge.valid_until).toLocaleString('pt-BR')}</li>` : '<li>Não expira</li>'}
          </ul>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${Deno.env.get('APP_URL') || 'https://fit-coach-ia.vercel.app'}#/" class="button">🚀 Acessar App</a>
          </div>
          <p>Bom treino!</p>
        </div>
        <div class="footer">
          <p>FitCoach.IA - Seu assistente de treino inteligente</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: email,
        subject: emailSubject,
        html: emailBody,
      },
    });

    if (error) {
      console.error('Error sending recharge email:', error);
    }
  } catch (error) {
    console.error('Error invoking send-email function:', error);
  }
}

