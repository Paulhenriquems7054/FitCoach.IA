/**
 * Edge Function para processar webhooks da Cakto
 * Atualiza assinaturas e recargas quando pagamentos são confirmados
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CaktoWebhookEvent {
  type: string;
  data: {
    id: string;
    status: string;
    subscription_id?: string;
    transaction_id?: string;
    checkout_id?: string;
    user_id?: string;
    product_id?: string;
    amount?: number;
    currency?: string;
    customer_email?: string;
    customer_name?: string;
    created_at?: string;
    paid_at?: string;
  };
}

// Logger simples para Edge Function
const log = (level: 'info' | 'error' | 'warn', message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const logData = data ? ` | Data: ${JSON.stringify(data)}` : '';
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}${logData}`);
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Log inicial de TODAS as requisições recebidas (para debug)
  const requestHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    requestHeaders[key] = value;
  });
  log('info', `Requisição recebida: ${req.method}`, { 
    url: req.url,
    headers: requestHeaders 
  });

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar autenticação do webhook (ajustar conforme API da Cakto)
    const authHeader = req.headers.get('authorization');
    const webhookSecret = Deno.env.get('CAKTO_WEBHOOK_SECRET');
    
    // Log de debug da autenticação
    log('info', 'Verificando autenticação', {
      hasAuthHeader: !!authHeader,
      authHeaderPrefix: authHeader ? authHeader.substring(0, 20) + '...' : 'none',
      hasWebhookSecret: !!webhookSecret,
      webhookSecretPrefix: webhookSecret ? webhookSecret.substring(0, 10) + '...' : 'none'
    });
    
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      log('warn', 'Falha na autenticação do webhook', {
        expectedFormat: `Bearer ${webhookSecret.substring(0, 10)}...`,
        received: authHeader || 'none'
      });
      
      // Salvar tentativa de webhook falhada no banco para debug
      try {
        const bodyText = await req.clone().text();
        await supabaseClient.from('cakto_webhooks').insert({
          type: 'authentication_failed',
          payload: JSON.parse(bodyText || '{}'),
          status: 'failed',
          error_message: 'Unauthorized: Secret mismatch',
          created_at: new Date().toISOString()
        });
      } catch (insertError) {
        log('error', 'Erro ao salvar webhook falhado no banco', insertError);
      }
      
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Webhook secret mismatch' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const event: CaktoWebhookEvent = await req.json();

    log('info', `Webhook recebido: ${event.type}`, { eventId: event.data.id, status: event.data.status });

    // Salvar webhook no banco ANTES de processar (para debug e auditoria)
    try {
      await supabaseClient.from('cakto_webhooks').insert({
        type: event.type || 'unknown',
        payload: event,
        status: 'received',
        created_at: new Date().toISOString()
      });
      log('info', 'Webhook salvo no banco de dados', { type: event.type });
    } catch (insertError) {
      log('error', 'Erro ao salvar webhook no banco (continuando processamento)', insertError);
    }

    switch (event.type) {
      case 'subscription.paid':
      case 'subscription.renewed':
      case 'payment.paid':
        // Verificar se é um plano B2B (academia) baseado no checkout_id
        const checkoutId = event.data.checkout_id;
        let isB2BPlan = false;
        let b2bPlanType: string | null = null;

        if (checkoutId) {
          // Mapear checkout IDs para planos B2B
          const b2bCheckoutMap: Record<string, string> = {
            '3b2kpwc_671196': 'academy_starter_mini',
            'cemyp2n_668537': 'academy_starter',
            'vi6djzq_668541': 'academy_growth',
            '3dis6ds_668546': 'academy_pro',
          };

          b2bPlanType = b2bCheckoutMap[checkoutId] || null;
          isB2BPlan = !!b2bPlanType;
        }

        // Se for plano B2B e ainda não existe company, criar
        if (isB2BPlan && b2bPlanType && event.data.customer_email) {
          try {
            // Buscar usuário pelo username (email pode ser usado como username)
            const usernameFromEmail = event.data.customer_email.split('@')[0];
            let { data: userProfile } = await supabaseClient
              .from('users')
              .select('id, username, nome')
              .eq('username', usernameFromEmail)
              .maybeSingle();

            // Se não encontrar, tentar buscar por nome (se customer_name for fornecido)
            if (!userProfile && event.data.customer_name) {
              const { data: userByName } = await supabaseClient
                .from('users')
                .select('id, username, nome')
                .eq('nome', event.data.customer_name)
                .eq('gym_role', 'admin')
                .maybeSingle();
              
              if (userByName) {
                userProfile = userByName;
              }
            }

            // Se ainda não encontrar, criar perfil básico
            // NOTA: O usuário precisará fazer login depois para vincular ao auth.users
            if (!userProfile) {
              const username = usernameFromEmail;
              const { data: newProfile, error: createError } = await supabaseClient
                .from('users')
                .insert({
                  nome: event.data.customer_name || 'Academia',
                  username: username,
                  role: 'professional',
                  gym_role: 'admin',
                  subscription: 'free',
                  idade: 30,
                  genero: 'Masculino',
                  peso: 70,
                  altura: 170,
                  objetivo: 'manter peso',
                  points: 0,
                  discipline_score: 80,
                  completed_challenge_ids: [],
                  is_anonymized: false,
                  weight_history: [],
                  is_gym_managed: false,
                  access_blocked: false,
                })
                .select()
                .single();
              
              if (!createError && newProfile) {
                userProfile = newProfile;
                log('info', `Perfil básico criado para ${username} (será vinculado ao auth.users no primeiro login)`);
              }
            }

            if (userProfile) {

              if (userProfile) {
                // Buscar plano
                const { data: plan } = await supabaseClient
                  .from('subscription_plans')
                  .select('id, name, display_name, price_monthly, limits')
                  .eq('name', b2bPlanType)
                  .single();

                if (plan) {
                  // Criar assinatura primeiro
                  const now = new Date();
                  const periodEnd = new Date(now);
                  periodEnd.setMonth(periodEnd.getMonth() + 1);

                  const { data: subscription, error: subError } = await supabaseClient
                    .from('user_subscriptions')
                    .insert({
                      user_id: userProfile.id,
                      plan_id: plan.id,
                      status: 'active',
                      billing_cycle: 'monthly',
                      current_period_start: now.toISOString(),
                      current_period_end: periodEnd.toISOString(),
                      payment_provider: 'cakto',
                      provider_payment_id: event.data.subscription_id || event.data.id,
                    })
                    .select()
                    .single();

                  if (!subError && subscription) {
                    // Gerar código mestre
                    const { data: masterCode, error: codeError } = await supabaseClient
                      .rpc('generate_master_code');

                    if (!codeError && masterCode) {
                      // Criar company
                      const maxLicenses = (plan.limits as any)?.max_licenses || 0;
                      const { data: company, error: companyError } = await supabaseClient
                        .from('companies')
                        .insert({
                          name: event.data.customer_name || userProfile.nome || 'Academia',
                          email: event.data.customer_email,
                          plan_type: b2bPlanType,
                          plan_name: plan.display_name,
                          max_licenses: maxLicenses,
                          master_code: masterCode,
                          owner_id: userProfile.id,
                          subscription_id: subscription.id,
                          cakto_transaction_id: event.data.transaction_id || event.data.id,
                          cakto_checkout_id: checkoutId,
                          monthly_amount: parseFloat(plan.price_monthly || '0'),
                          payment_status: 'paid',
                          status: 'active',
                          currency: 'BRL',
                        })
                        .select()
                        .single();

                      if (!companyError && company) {
                        log('info', `Company criada: ${company.name} (${masterCode}) para plano ${b2bPlanType}`);
                        
                        // Atualizar usuário como admin da academia
                        await supabaseClient
                          .from('users')
                          .update({
                            plan_type: b2bPlanType,
                            subscription_status: 'active',
                            gym_id: company.id,
                            gym_role: 'admin',
                            is_gym_managed: false, // Admin não é gerenciado pela academia
                          })
                          .eq('id', userProfile.id);

                        // Criar chave de API automaticamente
                        try {
                          const { autoSetupGymApiKey } = await import('../../services/gymApiKeyService.ts');
                          await autoSetupGymApiKey(userProfile.id, 'active');
                          log('info', `Chave de API configurada para empresa ${company.id}`);
                        } catch (apiKeyError) {
                          log('warn', 'Erro ao configurar chave de API (não crítico)', apiKeyError);
                        }

                        // Enviar email com código mestre (TODO: implementar serviço de email)
                        log('info', `Código mestre gerado: ${masterCode} para ${event.data.customer_email}`);
                      }
                    }
                  }
                }
              }
            }
          } catch (b2bError) {
            log('error', 'Erro ao processar plano B2B', b2bError);
            // Continuar com fluxo normal mesmo se falhar
          }
        }

        // Atualizar assinatura como ativa (fluxo normal)
        if (event.data.subscription_id || event.data.id) {
          const subscriptionId = event.data.subscription_id || event.data.id;
          
          // Buscar assinatura pelo subscription_id ou transaction_id
          const { data: subscription, error: findError } = await supabaseClient
            .from('user_subscriptions')
            .select('id, user_id, plan_id, status')
            .or(`payment_method_id.eq.${subscriptionId},provider_payment_id.eq.${subscriptionId},cakto_subscription_id.eq.${subscriptionId}`)
            .maybeSingle();

          if (findError) {
            log('error', 'Erro ao buscar assinatura', findError);
          } else if (subscription) {
            // Atualizar assinatura
            const updateData: Record<string, unknown> = {
              status: 'active',
              updated_at: new Date().toISOString(),
            };

            // Se tiver data de pagamento, atualizar período
            if (event.data.paid_at) {
              const paidAt = new Date(event.data.paid_at);
              const periodEnd = new Date(paidAt);
              
              // Buscar plano para determinar período
              if (subscription.plan_id) {
                const { data: plan } = await supabaseClient
                  .from('subscription_plans')
                  .select('name')
                  .eq('id', subscription.plan_id)
                  .single();
                
                if (plan?.name?.includes('annual') || plan?.name?.includes('yearly')) {
                  periodEnd.setFullYear(periodEnd.getFullYear() + 1);
                } else {
                  periodEnd.setMonth(periodEnd.getMonth() + 1);
                }
                
                updateData.current_period_start = paidAt.toISOString();
                updateData.current_period_end = periodEnd.toISOString();
              }
            }

            const { error: updateError } = await supabaseClient
              .from('user_subscriptions')
              .update(updateData)
              .eq('id', subscription.id);

            if (updateError) {
              log('error', 'Erro ao atualizar assinatura', updateError);
            } else {
              log('info', `Assinatura ${subscription.id} atualizada para ativa`);
              
              // Criar chave de API automaticamente se for admin de academia
              try {
                const { autoSetupGymApiKey } = await import('../../services/gymApiKeyService.ts');
                await autoSetupGymApiKey(subscription.user_id, 'active');
                log('info', `Chave de API configurada para usuário ${subscription.user_id}`);
              } catch (apiKeyError) {
                log('warn', 'Erro ao configurar chave de API (não crítico)', apiKeyError);
              }
            }
          } else {
            log('warn', `Assinatura não encontrada para subscription_id: ${subscriptionId}`);
          }
        }
        break;

      case 'subscription.canceled':
      case 'payment.canceled':
        // Atualizar assinatura como cancelada
        if (event.data.subscription_id || event.data.id) {
          const subscriptionId = event.data.subscription_id || event.data.id;
          
          const { data: subscription, error: findError } = await supabaseClient
            .from('user_subscriptions')
            .select('id, user_id')
            .or(`payment_method_id.eq.${subscriptionId},provider_payment_id.eq.${subscriptionId},cakto_subscription_id.eq.${subscriptionId}`)
            .maybeSingle();

          if (findError) {
            log('error', 'Erro ao buscar assinatura para cancelamento', findError);
          } else if (subscription) {
            const { error: updateError } = await supabaseClient
              .from('user_subscriptions')
              .update({
                status: 'canceled',
                canceled_at: new Date().toISOString(),
                cancel_at_period_end: false,
                updated_at: new Date().toISOString(),
              })
              .eq('id', subscription.id);

            if (updateError) {
              log('error', 'Erro ao cancelar assinatura', updateError);
            } else {
              log('info', `Assinatura ${subscription.id} cancelada via webhook`);
              
              // Desabilitar API para academia
              try {
                const { autoSetupGymApiKey } = await import('../../services/gymApiKeyService.ts');
                await autoSetupGymApiKey(subscription.user_id, 'canceled');
              } catch (apiKeyError) {
                log('warn', 'Erro ao desabilitar API (não crítico)', apiKeyError);
              }
            }
          } else {
            log('warn', `Assinatura não encontrada para cancelamento: ${subscriptionId}`);
          }
        }
        break;

      case 'recharge.paid':
        // Processar recarga paga
        if (event.data.transaction_id || event.data.id) {
          const transactionId = event.data.transaction_id || event.data.id;
          
          // Buscar recarga pelo transaction_id
          const { data: recharge, error: findError } = await supabaseClient
            .from('recharges')
            .select('*')
            .or(`cakto_transaction_id.eq.${transactionId},transaction_id.eq.${transactionId}`)
            .maybeSingle();

          if (findError) {
            log('error', 'Erro ao buscar recarga', findError);
          } else if (!recharge) {
            log('warn', `Recarga não encontrada para transaction_id: ${transactionId}`);
          } else {
            // Atualizar status da recarga
            const { error: updateError } = await supabaseClient
              .from('recharges')
              .update({
                status: 'active',
                payment_status: 'paid',
                paid_at: event.data.paid_at || new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', recharge.id);

            if (updateError) {
              log('error', 'Erro ao atualizar recarga', updateError);
            } else {
              log('info', `Recarga ${recharge.id} marcada como paga`);
              
              // Aplicar recarga
              try {
                const { processPendingRecharges } = await import('../../services/rechargeService.ts');
                await processPendingRecharges(recharge.user_id);
                log('info', `Recarga aplicada para usuário ${recharge.user_id}`);
              } catch (rechargeError) {
                log('error', 'Erro ao aplicar recarga', rechargeError);
              }
            }
          }
        }
        break;

      case 'payment.failed':
      case 'subscription.payment_failed':
        // Marcar pagamento como falhado
        if (event.data.subscription_id || event.data.id) {
          const subscriptionId = event.data.subscription_id || event.data.id;
          
          const { data: subscription, error: findError } = await supabaseClient
            .from('user_subscriptions')
            .select('id')
            .or(`payment_method_id.eq.${subscriptionId},provider_payment_id.eq.${subscriptionId},cakto_subscription_id.eq.${subscriptionId}`)
            .maybeSingle();

          if (findError) {
            log('error', 'Erro ao buscar assinatura para falha de pagamento', findError);
          } else if (subscription) {
            const { error: updateError } = await supabaseClient
              .from('user_subscriptions')
              .update({
                status: 'past_due',
                updated_at: new Date().toISOString(),
              })
              .eq('id', subscription.id);

            if (updateError) {
              log('error', 'Erro ao atualizar status para past_due', updateError);
            } else {
              log('info', `Assinatura ${subscription.id} marcada como past_due (pagamento falhou)`);
            }
          }
        }
        break;

      default:
        log('warn', `Tipo de evento não tratado: ${event.type}`, { eventId: event.data.id });
    }

    return new Response(
      JSON.stringify({ success: true, processed: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    log('error', 'Erro ao processar webhook', { error: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
