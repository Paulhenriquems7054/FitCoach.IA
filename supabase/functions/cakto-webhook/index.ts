import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Segredo para validar o webhook da Cakto
const CAKTO_WEBHOOK_SECRET = Deno.env.get("CAKTO_WEBHOOK_SECRET");
// Flag opcional para pular autenticação durante testes
const SKIP_CAKTO_WEBHOOK_AUTH = Deno.env.get("SKIP_CAKTO_WEBHOOK_AUTH") === "true";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // 1) Autenticação do webhook (pode ser pulada em teste)
    if (!SKIP_CAKTO_WEBHOOK_AUTH && CAKTO_WEBHOOK_SECRET) {
      const headerSecret = req.headers.get("x-webhook-secret");
      if (headerSecret !== CAKTO_WEBHOOK_SECRET) {
        console.error("Webhook não autorizado: segredo inválido");
        return new Response("Unauthorized", { status: 401 });
      }
    }

    // 2) Ler o JSON enviado pela Cakto
    const body = await req.json();
    console.log("Payload Cakto recebido:", body);
    
    // Log de auditoria
    await logAuditEvent("webhook_received", {
      eventType: body?.event || body?.type,
      checkoutId: body?.data?.checkout_id || body?.data?.checkoutId,
      transactionId: body?.data?.id || body?.data?.transaction_id,
    });

    // ⚠️ Estes campos você precisa ajustar depois com base no JSON REAL da Cakto
    const eventType: string = body?.event || body?.type || "";
    
    // Extrair checkout_id de várias fontes possíveis
    let checkoutId: string = 
      body?.data?.checkout_id || 
      body?.data?.checkoutId || 
      body?.data?.checkout?.toString() || 
      "";
    
    // Se não encontrou, tentar extrair da checkoutUrl
    if (!checkoutId && body?.data?.checkoutUrl) {
      const urlMatch = body.data.checkoutUrl.match(/pay\.cakto\.com\.br\/([^/?]+)/);
      if (urlMatch && urlMatch[1]) {
        checkoutId = urlMatch[1].split('?')[0]; // Remove query params
        console.log("checkout_id extraído da checkoutUrl:", checkoutId);
      }
    }
    
    // Se ainda não encontrou, tentar extrair do product.short_id ou offer.id
    if (!checkoutId) {
      checkoutId = body?.data?.product?.short_id || 
                   body?.data?.offer?.id || 
                   "";
    }
    
    const transactionId: string = body?.data?.id || body?.data?.transaction_id || "";
    const amountPaid: number = body?.data?.amount || body?.data?.baseAmount || 0;
    const customerEmail: string = 
      body?.data?.customer_email || 
      body?.data?.customer?.email || 
      body?.data?.buyer?.email || 
      "";

    if (!checkoutId) {
      console.error("checkout_id não encontrado no payload. Payload recebido:", JSON.stringify(body, null, 2));
      return new Response("checkout_id ausente", { status: 400 });
    }
    
    console.log("checkout_id encontrado:", checkoutId);

    // 3) Buscar plano correspondente na tabela subscription_plans
    // A tabela subscription_plans tem checkout_url_monthly e checkout_url_yearly, mas NÃO tem cakto_checkout_id
    // Limpar checkoutId (remover query params e paths)
    const cleanCheckoutId = checkoutId.includes('/') 
      ? checkoutId.split('/').pop()?.split('?')[0] 
      : checkoutId.split('?')[0];
    
    console.log("Buscando plano com checkout_id limpo:", cleanCheckoutId);
    
    // Buscar planos que tenham esse ID nas URLs checkout_url_monthly ou checkout_url_yearly
    let { data: plans, error: plansError } = await supabase
      .from("subscription_plans")
      .select("*")
      .or(`checkout_url_monthly.ilike.%${cleanCheckoutId}%,checkout_url_yearly.ilike.%${cleanCheckoutId}%`);
    
    let plan = plans && plans.length > 0 ? plans[0] : null;
    let planError = plansError;
    
    if (plan) {
      console.log("Plano encontrado via checkout_url:", plan.name || plan.slug);
    } else {
      console.log("Nenhum plano encontrado com checkout_id:", cleanCheckoutId);
      // Se for evento de teste com "EXAMPLE" ou "123", tentar buscar por product.short_id ou offer.id
      if (cleanCheckoutId === "EXAMPLE" || cleanCheckoutId === "123") {
        console.log("Checkout_id é de teste (EXAMPLE/123), tentando buscar por product/offer do payload...");
        // Para eventos de teste, podemos tentar buscar por outros campos ou simplesmente logar
        // Em produção, isso não acontecerá pois os checkout_ids serão reais
      }
    }

    if (planError || !plan) {
      console.error("Plano não encontrado para checkout_id:", cleanCheckoutId, planError);
      // Se for evento de teste, não retornar erro 404, apenas logar
      if (cleanCheckoutId === "EXAMPLE" || cleanCheckoutId === "123") {
        console.log("Evento de teste detectado (checkout_id: EXAMPLE/123). Em produção, use um checkout_id real.");
        return new Response("Evento de teste - checkout_id não corresponde a plano real", { status: 200 });
      }
      return new Response("Plano não encontrado", { status: 404 });
    }

    console.log("Plano encontrado:", { 
      plan_group: plan.plan_group, 
      name: plan.name, 
      display_name: plan.display_name,
      checkout_url_monthly: plan.checkout_url_monthly,
      checkout_url_yearly: plan.checkout_url_yearly
    });

    // 4) Filtrar só eventos de pagamento confirmado (ajustar depois conforme Cakto)
    const isPaidEvent =
      eventType === "payment.completed" ||
      eventType === "payment.paid" ||
      eventType === "subscription.created" ||
      eventType === "subscription.payment_succeeded" ||
      eventType === "purchase_approved" ||
      eventType === "purchase.completed" ||
      eventType === "checkout.completed";

    if (!isPaidEvent) {
      console.log("Evento não é de pagamento confirmado, ignorando:", eventType);
      return new Response("Evento ignorado", { status: 200 });
    }

    // 5) Processar por tipo de plano
    switch (plan.plan_group) {
      case "b2b_academia":
        await handleAcademyPlan({ plan, transactionId, amountPaid, customerEmail, body });
        await logAuditEvent("academy_plan_activated", {
          planSlug: plan.name || plan.slug,
          transactionId,
          customerEmail,
        });
        break;
      case "b2c":
      case "b2c_ai":
        await handleB2CPlan({ plan, transactionId, amountPaid, customerEmail, body, checkoutId });
        await logAuditEvent("b2c_plan_activated", {
          planSlug: plan.name || plan.slug,
          transactionId,
          customerEmail,
        });
        break;
      case "recarga":
        await handleRecharge({ plan, transactionId, amountPaid, customerEmail, body, checkoutId: cleanCheckoutId });
        await logAuditEvent("recharge_activated", {
          planSlug: plan.name || plan.slug,
          transactionId,
          customerEmail,
        });
        break;
      case "personal":
        // Planos Personal Trainer foram removidos - não existem mais na página de vendas nem na Cakto
        console.warn("Plano Personal Trainer recebido mas foi removido:", plan.name || plan.slug);
        // Não processar - apenas logar para auditoria
        break;
      default:
        console.warn("plan_group desconhecido:", plan.plan_group);
        break;
    }

    await logAuditEvent("webhook_processed", {
      eventType: body?.event || body?.type,
      checkoutId: body?.data?.checkout_id || body?.data?.checkoutId,
      status: "success",
    });
    
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Erro no webhook Cakto:", err);
    await logAuditEvent("webhook_error", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return new Response("Erro interno", { status: 500 });
  }
});

// ============ HANDLERS (AJUSTAR PARA SUAS TABELAS) ============

async function handleAcademyPlan(args: {
  plan: any;
  transactionId: string;
  amountPaid: number;
  customerEmail: string;
  body: any;
}) {
  const { plan, transactionId, amountPaid, customerEmail } = args;

  try {
    // 1. Gerar master_code usando função SQL
    const { data: masterCodeData, error: masterCodeError } = await supabase
      .rpc('generate_master_code');

    if (masterCodeError) {
      console.error("Erro ao gerar master_code:", masterCodeError);
      return;
    }

    // A função RPC retorna o valor diretamente (string)
    const masterCode = masterCodeData as string;

    if (!masterCode) {
      console.error("Master code não foi gerado");
      return;
    }

    // 2. Mapear nome do plano
    const planNameMap: Record<string, string> = {
      'academy_starter_mini': 'Starter Mini',
      'academy_starter': 'Pack Starter',
      'academy_growth': 'Pack Growth',
      'academy_pro': 'Pack Pro',
    };
    const planSlug = plan.name || plan.slug;
    const planName = planNameMap[planSlug] || plan.display_name || plan.name;

    // 3. Calcular data de expiração (30 dias a partir de agora)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 4. Criar empresa na tabela companies
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        name: planName + " - " + customerEmail, // Nome temporário, pode ser atualizado depois
        email: customerEmail,
        plan_type: planSlug,
        plan_name: planName,
        max_licenses: plan.max_licenses || 10,
        master_code: masterCode,
        status: 'active',
        payment_status: 'paid',
        cakto_transaction_id: transactionId,
        cakto_checkout_id: cleanCheckoutId,
        monthly_amount: amountPaid,
        currency: 'BRL',
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        next_billing_date: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (companyError || !company) {
      console.error("Erro ao criar empresa:", companyError);
      return;
    }

    console.log(`✅ Empresa criada: ${company.id} com master_code: ${masterCode}`);

    // 5. Criar registro em gyms (usando o ID da company como gym_id)
    // A tabela gyms usa TEXT como ID, então convertemos o UUID para string
    const { error: gymError } = await supabase
      .from("gyms")
      .insert({
        id: company.id.toString(), // UUID convertido para string (gyms.id é TEXT)
        name: planName + " - " + customerEmail,
        email: customerEmail,
        is_active: true,
      })
      .select()
      .single();

    if (gymError) {
      // Se já existir, apenas logar (não é crítico)
      console.warn("Gym já existe ou erro ao criar:", gymError);
    } else {
      console.log(`✅ Gym criado: ${company.id}`);
    }

    // 6. Criar registro de pagamento
    const { error: paymentError } = await supabase
      .from("payments")
      .insert({
        amount: amountPaid,
        currency: 'BRL',
        status: 'succeeded',
        payment_method: 'credit_card', // Ajustar conforme Cakto
        payment_provider: 'cakto',
        provider_payment_id: transactionId,
        description: `Pagamento - ${planName}`,
        metadata: {
          company_id: company.id,
          master_code: masterCode,
          plan_slug: planSlug,
        },
        paid_at: now.toISOString(),
      });

    if (paymentError) {
      console.warn("Erro ao criar registro de pagamento:", paymentError);
    } else {
      console.log("✅ Pagamento registrado");
    }

    // 7. Criar fatura
    const { error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        amount: amountPaid,
        currency: 'BRL',
        status: 'paid',
        payment_method: 'credit_card',
        description: `Fatura - ${planName} - ${planName}`,
        metadata: {
          company_id: company.id,
          master_code: masterCode,
          plan_slug: planSlug,
        },
        paid_at: now.toISOString(),
      });

    if (invoiceError) {
      console.warn("Erro ao criar fatura:", invoiceError);
    } else {
      console.log("✅ Fatura criada");
    }

    // 8. Log de auditoria
    await logAuditEvent("company_created", {
      company_id: company.id,
      master_code: masterCode,
      plan_slug: planSlug,
      customer_email: customerEmail,
      transaction_id: transactionId,
    });

    console.log(`✅ Processo completo! Código mestre gerado: ${masterCode} para ${customerEmail}`);
  } catch (error) {
    console.error("Erro ao processar plano de academia:", error);
    await logAuditEvent("company_creation_error", {
      error: error instanceof Error ? error.message : String(error),
      customer_email: customerEmail,
      transaction_id: transactionId,
    });
  }
}

async function handleB2CPlan(args: {
  plan: any;
  transactionId: string;
  amountPaid: number;
  customerEmail: string;
  body: any;
  checkoutId: string;
}) {
  const { plan, transactionId, amountPaid, customerEmail, checkoutId } = args;

  try {
    // 1. Buscar ou criar usuário pelo email
    let userId: string | null = null;
    
    // Primeiro, tentar buscar na tabela users pelo email
    const { data: userByEmail, error: userEmailError } = await supabase
      .from("users")
      .select("id")
      .eq("email", customerEmail)
      .maybeSingle();
    
    if (userByEmail && !userEmailError) {
      userId = userByEmail.id;
      console.log(`Usuário encontrado pelo email: ${customerEmail} (${userId})`);
    } else {
      // Se não encontrou pelo email, tentar buscar em auth.users
      // Nota: auth.users não é acessível diretamente, então vamos tentar criar um usuário
      // ou usar uma função RPC que busca em auth.users
      console.warn(`Usuário não encontrado pelo email: ${customerEmail}`);
      
      // Tentar buscar via função RPC se existir
      const { data: authUser, error: authError } = await supabase
        .rpc('get_user_id_by_email', { user_email: customerEmail })
        .maybeSingle();
      
      if (authUser && !authError) {
        userId = authUser.id;
        console.log(`Usuário encontrado via RPC: ${customerEmail} (${userId})`);
      }
    }

    if (!userId) {
      console.error(`Não foi possível encontrar ou criar usuário para email: ${customerEmail}`);
      // Não podemos criar assinatura sem usuário
      return;
    }

    // 2. Determinar se é mensal ou anual baseado no checkout_id usado
    const checkoutIdFromUrl = checkoutId.includes('/') 
      ? checkoutId.split('/').pop()?.split('?')[0] 
      : checkoutId;
    
    let billingCycle: 'monthly' | 'yearly' = 'monthly';
    if (plan.checkout_url_yearly && plan.checkout_url_yearly.includes(checkoutIdFromUrl)) {
      billingCycle = 'yearly';
    } else if (plan.checkout_url_monthly && plan.checkout_url_monthly.includes(checkoutIdFromUrl)) {
      billingCycle = 'monthly';
    }

    // 3. Calcular datas do período
    const now = new Date();
    const periodStart = now.toISOString();
    const periodEnd = new Date(now);
    
    if (billingCycle === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // 4. Verificar se já existe assinatura ativa para este usuário
    const { data: existingSubscription, error: existingError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    let subscription;
    
    if (existingSubscription && !existingError) {
      // Atualizar assinatura existente
      const { data: updated, error: updateError } = await supabase
        .from("user_subscriptions")
        .update({
          plan_id: plan.id,
          status: "active",
          billing_cycle: billingCycle,
          current_period_start: periodStart,
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          payment_provider: 'cakto',
          provider_payment_id: transactionId,
          cakto_transaction_id: transactionId,
          cakto_checkout_id: checkoutIdFromUrl,
          updated_at: now.toISOString(),
        })
        .eq("id", existingSubscription.id)
        .select()
        .single();
      
      if (updateError) {
        console.error("Erro ao atualizar assinatura B2C:", updateError);
        return;
      }
      
      subscription = updated;
      console.log(`✅ Assinatura B2C atualizada: ${subscription.id}`);
    } else {
      // Criar nova assinatura
      const { data: created, error: createError } = await supabase
        .from("user_subscriptions")
        .insert({
          user_id: userId,
          plan_id: plan.id,
          status: "active",
          billing_cycle: billingCycle,
          current_period_start: periodStart,
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          payment_provider: 'cakto',
          provider_payment_id: transactionId,
          cakto_transaction_id: transactionId,
          cakto_checkout_id: checkoutIdFromUrl,
        })
        .select()
        .single();
      
      if (createError) {
        console.error("Erro ao criar assinatura B2C:", createError);
        return;
      }
      
      subscription = created;
      console.log(`✅ Assinatura B2C criada: ${subscription.id}`);
    }

    // 5. Atualizar status do usuário na tabela users
    const { error: userUpdateError } = await supabase
      .from("users")
      .update({
        subscription_status: 'active',
        updated_at: now.toISOString(),
      })
      .eq("id", userId);

    if (userUpdateError) {
      console.warn("Erro ao atualizar status do usuário (não crítico):", userUpdateError);
    } else {
      console.log(`✅ Status do usuário atualizado para 'active'`);
    }

    // 6. Criar registro de pagamento (opcional, se a tabela existir)
    try {
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          amount: amountPaid,
          currency: 'BRL',
          status: 'succeeded',
          payment_method: 'credit_card',
          payment_provider: 'cakto',
          provider_payment_id: transactionId,
          description: `Pagamento - ${plan.display_name || plan.name} (${billingCycle})`,
          metadata: {
            user_id: userId,
            plan_id: plan.id,
            subscription_id: subscription.id,
            billing_cycle: billingCycle,
          },
          paid_at: now.toISOString(),
        });

      if (paymentError) {
        console.warn("Erro ao criar registro de pagamento (não crítico):", paymentError);
      } else {
        console.log("✅ Pagamento registrado");
      }
    } catch (paymentErr) {
      // Tabela payments pode não existir, não é crítico
      console.log("Tabela payments não disponível ou erro ao registrar pagamento (não crítico)");
    }

    console.log(`✅ Processo completo! Assinatura ${billingCycle} ativada para ${customerEmail}`);
  } catch (error) {
    console.error("Erro ao processar plano B2C:", error);
    await logAuditEvent("b2c_plan_error", {
      error: error instanceof Error ? error.message : String(error),
      customer_email: customerEmail,
      transaction_id: transactionId,
    });
  }
}

async function handleRecharge(args: {
  plan: any;
  transactionId: string;
  amountPaid: number;
  customerEmail: string;
  body: any;
}) {
  const { plan, transactionId, amountPaid, customerEmail } = args;

  // 1. Mapear plan.slug para recharge_type
  const rechargeTypeMap: Record<string, string> = {
    'recarga_turbo': 'turbo',
    'recarga_banco_voz_100': 'voice_bank',
    'recarga_passe_livre_30d': 'pass_libre',
  };
  
  const planSlug = plan.name || plan.slug;
  const rechargeType = rechargeTypeMap[planSlug] || 'turbo';
  
  // 2. Mapear nome da recarga
  const rechargeNameMap: Record<string, string> = {
    'recarga_turbo': 'Sessão Turbo',
    'recarga_banco_voz_100': 'Banco de Voz 100',
    'recarga_passe_livre_30d': 'Passe Livre 30 Dias',
  };
  
  const rechargeName = rechargeNameMap[planSlug] || plan.name || 'Recarga';
  
  // 3. Calcular quantidade baseada no tipo
  const quantityMap: Record<string, number> = {
    'turbo': 30, // 30 minutos
    'voice_bank': 100, // 100 minutos
    'pass_libre': 30, // 30 dias
  };
  
  const quantity = quantityMap[rechargeType] || 0;
  
  // 4. Buscar user_id pelo email
  let userId: string | null = null;
  if (customerEmail) {
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", customerEmail)
      .maybeSingle();
    
    if (user) {
      userId = user.id;
    } else {
      console.warn(`Usuário não encontrado para email: ${customerEmail}`);
      // Tentar criar ou usar um ID temporário - ajustar conforme necessário
    }
  }
  
  if (!userId) {
    console.error("Não foi possível encontrar user_id para a recarga");
    return;
  }
  
  // 5. Calcular validade baseada no tipo
  const now = new Date();
  let validUntil: string | null = null;
  let expiresAt: string | null = null;
  
  if (rechargeType === 'turbo') {
    // Turbo: válido por 24h
    expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    validUntil = expiresAt;
  } else if (rechargeType === 'voice_bank') {
    // Banco de Voz: não expira
    validUntil = null;
    expiresAt = null;
  } else if (rechargeType === 'pass_libre') {
    // Passe Livre: 30 dias
    expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    validUntil = expiresAt;
  }

  // 6. Inserir recarga com estrutura correta
  const { error } = await supabase.from("recharges").insert({
    user_id: userId,
    recharge_type: rechargeType,
    recharge_name: rechargeName,
    amount_paid: amountPaid,
    currency: 'BRL',
    quantity: quantity,
    valid_from: now.toISOString(),
    valid_until: validUntil,
    expires_at: expiresAt,
    status: "active",
    payment_status: "paid",
    cakto_checkout_id: cleanCheckoutId || checkoutId,
    cakto_transaction_id: transactionId,
  });

  if (error) {
    console.error("Erro ao registrar recarga:", error);
  } else {
    console.log(`Recarga criada: ${rechargeName} para usuário ${userId}`);
  }
}

async function handlePersonalTrainerPlan(args: {
  plan: any;
  transactionId: string;
  amountPaid: number;
  customerEmail: string;
  body: any;
}) {
  const { plan, transactionId, amountPaid, customerEmail } = args;

  const { error } = await supabase.from("personal_subscriptions").insert({
    personal_email: customerEmail,
    plan_slug: plan.name || plan.slug,
    plan_group: plan.plan_group,
    cakto_checkout_id: cleanCheckoutId,
    cakto_transaction_id: transactionId,
    amount_paid: amountPaid,
    max_licenses: plan.max_licenses,
    status: "active",
  });

  if (error) console.error("Erro ao criar assinatura de personal:", error);
}

// Nota: handlePersonalTrainerPlan não é mais usado, mas mantido para compatibilidade

// ============ FUNÇÃO DE LOG DE AUDITORIA ============

async function logAuditEvent(eventType: string, metadata: Record<string, any> = {}): Promise<void> {
  try {
    // Tentar inserir na tabela audit_logs se existir
    const { error } = await supabase.from("audit_logs").insert({
      event_type: eventType,
      metadata: metadata,
      created_at: new Date().toISOString(),
    });

    if (error) {
      // Se a tabela não existir ou houver erro, apenas logar no console
      console.log(`[AUDIT] ${eventType}:`, metadata);
    } else {
      console.log(`[AUDIT] ${eventType} registrado`);
    }
  } catch (error) {
    // Em caso de erro, apenas logar no console
    console.log(`[AUDIT] ${eventType}:`, metadata);
  }
}