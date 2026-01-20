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
    
    // 4) Verificar se é evento de teste ANTES de buscar no banco
    if (cleanCheckoutId === "EXAMPLE" || cleanCheckoutId === "123") {
      console.log("✅ Evento de teste detectado (checkout_id: EXAMPLE/123). Em produção, use um checkout_id real.");
      await logAuditEvent("test_event_received", {
        checkoutId: cleanCheckoutId,
        transactionId: body?.data?.id || body?.data?.transaction_id,
        message: "Evento de teste - checkout_id não corresponde a plano real"
      });
      return new Response("Evento de teste - checkout_id não corresponde a plano real", { status: 200 });
    }
    
    console.log("Buscando plano com checkout_id limpo:", cleanCheckoutId);
    
    // 5) Buscar planos que tenham esse ID nas URLs checkout_url_monthly ou checkout_url_yearly
    let { data: plans, error: plansError } = await supabase
      .from("subscription_plans")
      .select("*")
      .or(`checkout_url_monthly.ilike.%${cleanCheckoutId}%,checkout_url_yearly.ilike.%${cleanCheckoutId}%`);
    
    let plan = plans && plans.length > 0 ? plans[0] : null;
    let planError = plansError;
    
    if (plan) {
      console.log("✅ Plano encontrado via checkout_url:", plan.name || plan.slug);
    } else {
      console.warn("⚠️ Nenhum plano encontrado com checkout_id:", cleanCheckoutId);
    }

    if (planError || !plan) {
      console.error("❌ Plano não encontrado para checkout_id:", cleanCheckoutId, planError?.message || null);
      return new Response("Plano não encontrado", { status: 404 });
    }

    // Determinar categoria do plano (priorizar plan_category, fallback para plan_group)
    const planCategory = plan.plan_category || plan.plan_group;
    
    console.log("Plano encontrado:", { 
      plan_category: plan.plan_category,
      plan_group: plan.plan_group,
      categoria_usada: planCategory,
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
    // Mapear plan_category (usado na página) para handlers do webhook
    // Suporta tanto plan_category quanto plan_group para compatibilidade
    switch (planCategory) {
      // B2B - Academias (plan_category: 'b2b_platform' ou plan_group: 'b2b_academia')
      case "b2b_platform":
      case "b2b_academia":
      case "b2b":
        await handleAcademyPlan({ plan, transactionId, amountPaid, customerEmail, body, checkoutId: cleanCheckoutId });
        await logAuditEvent("academy_plan_activated", {
          planSlug: plan.name || plan.slug,
          planCategory: planCategory,
          transactionId,
          customerEmail,
        });
        break;
      
      // B2C - Individuais (plan_category: 'b2c_ai' ou plan_group: 'b2c'/'b2c_ai')
      case "b2c_ai":
      case "b2c":
        await handleB2CPlan({ plan, transactionId, amountPaid, customerEmail, body, checkoutId });
        await logAuditEvent("b2c_plan_activated", {
          planSlug: plan.name || plan.slug,
          planCategory: planCategory,
          transactionId,
          customerEmail,
        });
        break;
      
      // Recargas (plan_category: 'recharge' ou plan_group: 'recarga')
      case "recharge":
      case "recarga":
        await handleRecharge({ plan, transactionId, amountPaid, customerEmail, body, checkoutId: cleanCheckoutId });
        await logAuditEvent("recharge_activated", {
          planSlug: plan.name || plan.slug,
          planCategory: planCategory,
          transactionId,
          customerEmail,
        });
        break;
      
      // B2B Manual - Academias sem IA (plan_category: 'b2b_manual')
      case "b2b_manual":
        await handleAcademyManualPlan({ plan, transactionId, amountPaid, customerEmail, body, checkoutId: cleanCheckoutId });
        await logAuditEvent("academy_manual_plan_activated", {
          planSlug: plan.name || plan.slug,
          planCategory: planCategory,
          transactionId,
          customerEmail,
        });
        break;
      
      // B2C Manual - Individuais sem IA (plan_category: 'b2c_manual')
      case "b2c_manual":
        await handleB2CManualPlan({ plan, transactionId, amountPaid, customerEmail, body, checkoutId });
        await logAuditEvent("b2c_manual_plan_activated", {
          planSlug: plan.name || plan.slug,
          planCategory: planCategory,
          transactionId,
          customerEmail,
        });
        break;
      
      // Personal Trainers (plan_category: 'personal_platform' ou plan_group: 'personal')
      case "personal_platform":
      case "personal":
        // Planos Personal Trainer foram removidos - não existem mais na página de vendas nem na Cakto
        console.warn("Plano Personal Trainer recebido mas foi removido:", plan.name || plan.slug);
        // Não processar - apenas logar para auditoria
        await logAuditEvent("personal_plan_ignored", {
          planSlug: plan.name || plan.slug,
          planCategory: planCategory,
          transactionId,
          customerEmail,
          reason: "Planos Personal Trainer foram removidos"
        });
        break;
      
      default:
        console.warn("⚠️ Categoria/grupo de plano desconhecido:", {
          plan_category: plan.plan_category,
          plan_group: plan.plan_group,
          categoria_usada: planCategory,
          plan_name: plan.name
        });
        await logAuditEvent("unknown_plan_category", {
          planSlug: plan.name || plan.slug,
          planCategory: planCategory,
          plan_category: plan.plan_category,
          plan_group: plan.plan_group,
          transactionId,
          customerEmail,
        });
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
  checkoutId: string;
}) {
  const { plan, transactionId, amountPaid, customerEmail, checkoutId } = args;
  
  // Limpar checkoutId
  const cleanCheckoutId = checkoutId.includes('/') 
    ? checkoutId.split('/').pop()?.split('?')[0] 
    : checkoutId.split('?')[0];

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

    // 5.5. Criar código de convite padrão para alunos automaticamente
    // Gera código aleatório de 6 caracteres (mesmo formato do inviteService)
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    // Expira em 1 ano (365 dias) - tempo suficiente para a academia usar
    const inviteExpiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    let inviteCodeCreated = false;
    const { data: invite, error: inviteError } = await supabase
      .from("invites")
      .insert({
        academy_id: company.id,
        created_by_user_id: company.id, // Usar company.id como criador (será atualizado quando owner criar conta)
        invited_role: 'student',
        code: inviteCode,
        expires_at: inviteExpiresAt.toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (inviteError) {
      console.warn("Erro ao criar código de convite padrão (não crítico):", inviteError);
    } else {
      inviteCodeCreated = true;
      console.log(`✅ Código de convite padrão criado automaticamente: ${inviteCode} (expira em 1 ano)`);
      // Registrar no log de auditoria
      await logAuditEvent("default_invite_created", {
        company_id: company.id,
        invite_code: inviteCode,
        master_code: masterCode,
        expires_at: inviteExpiresAt.toISOString(),
      });
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

    // 8. Enviar email com código de convite e informações de ativação
    if (inviteCodeCreated && inviteCode) {
      try {
        await sendActivationEmail({
          email: customerEmail,
          companyName: planName + " - " + customerEmail,
          masterCode: masterCode,
          inviteCode: inviteCode,
          planName: planName,
        });
        console.log(`✅ Email de ativação enviado para ${customerEmail}`);
      } catch (emailError) {
        console.warn("Erro ao enviar email de ativação (não crítico):", emailError);
        // Não falhar o processo se o email falhar
      }
    }

    // 9. Log de auditoria
    await logAuditEvent("company_created", {
      company_id: company.id,
      master_code: masterCode,
      plan_slug: planSlug,
      customer_email: customerEmail,
      transaction_id: transactionId,
      default_invite_code: inviteCodeCreated ? inviteCode : null,
    });

    console.log(`✅ Processo completo! Código mestre gerado: ${masterCode} para ${customerEmail}`);
    if (inviteCodeCreated) {
      console.log(`📧 Código de convite padrão para alunos: ${inviteCode}`);
      console.log(`   A academia pode usar este código para convidar alunos.`);
    }
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
  checkoutId: string;
}) {
  const { plan, transactionId, amountPaid, customerEmail, checkoutId } = args;
  
  // Limpar checkoutId
  const cleanCheckoutId = checkoutId.includes('/') 
    ? checkoutId.split('/').pop()?.split('?')[0] 
    : checkoutId.split('?')[0];

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
  checkoutId: string;
}) {
  const { plan, transactionId, amountPaid, customerEmail, checkoutId } = args;
  
  // Limpar checkoutId
  const cleanCheckoutId = checkoutId.includes('/') 
    ? checkoutId.split('/').pop()?.split('?')[0] 
    : checkoutId.split('?')[0];

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

// ============ FUNÇÃO DE ENVIO DE EMAIL ============

interface ActivationEmailData {
  email: string;
  companyName: string;
  masterCode: string;
  inviteCode: string;
  planName: string;
}

async function sendActivationEmail(data: ActivationEmailData): Promise<void> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "noreply@fitcoach.ia";
  const APP_URL = Deno.env.get("APP_URL") || "https://pagina-de-vendas-fit-coach-ai.vercel.app";

  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY não configurada, pulando envio de email");
    return;
  }

  const activationUrl = `${APP_URL}/#/activation-success?email=${encodeURIComponent(data.email)}`;

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Academia Ativada - FitCoach.IA</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Pagamento Confirmado!</h1>
    <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Sua academia foi ativada com sucesso</p>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px; margin-bottom: 20px;">Olá,</p>
    <p style="font-size: 16px; margin-bottom: 20px;">
      Parabéns! Seu pagamento foi processado com sucesso e sua academia <strong>${data.companyName}</strong> 
      está agora ativa no FitCoach.IA.
    </p>

    <div style="background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h2 style="color: #059669; margin-top: 0; font-size: 20px;">📧 Código de Convite para Alunos</h2>
      <p style="font-size: 14px; color: #6b7280; margin-bottom: 15px;">
        Use este código para convidar seus alunos. Eles receberão <strong>3 dias grátis</strong> de IA automaticamente.
      </p>
      <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 6px; padding: 15px; text-align: center; margin: 15px 0;">
        <p style="font-size: 32px; font-weight: bold; color: #059669; font-family: monospace; letter-spacing: 3px; margin: 0;">
          ${data.inviteCode}
        </p>
      </div>
      <p style="font-size: 12px; color: #6b7280; margin-top: 10px; margin-bottom: 0;">
        Link completo: <a href="${APP_URL}/#/login?invite=${data.inviteCode}" style="color: #10b981;">${APP_URL}/#/login?invite=${data.inviteCode}</a>
      </p>
    </div>

    <div style="background: white; border: 2px solid #6b7280; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h2 style="color: #374151; margin-top: 0; font-size: 20px;">🔑 Código Mestre da Academia</h2>
      <p style="font-size: 14px; color: #6b7280; margin-bottom: 15px;">
        Este é o identificador único da sua academia. Guarde este código com segurança.
      </p>
      <div style="background: #f9fafb; border: 2px solid #6b7280; border-radius: 6px; padding: 15px; text-align: center; margin: 15px 0;">
        <p style="font-size: 24px; font-weight: bold; color: #374151; font-family: monospace; margin: 0;">
          ${data.masterCode}
        </p>
      </div>
    </div>

    <div style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h2 style="color: #1e40af; margin-top: 0; font-size: 20px;">🚀 Próximos Passos</h2>
      <ol style="padding-left: 20px; color: #1e3a8a;">
        <li style="margin-bottom: 10px;">Crie sua conta de administrador usando o email: <strong>${data.email}</strong></li>
        <li style="margin-bottom: 10px;">Use o código de convite acima para convidar seus alunos</li>
        <li style="margin-bottom: 10px;">Seus alunos receberão <strong>3 dias grátis</strong> de IA automaticamente</li>
        <li style="margin-bottom: 10px;">Após o trial, seus alunos podem assinar planos individuais de IA</li>
      </ol>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${activationUrl}" 
         style="display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
        Acessar Página de Ativação
      </a>
    </div>

    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin-top: 25px;">
      <p style="font-size: 14px; color: #92400e; margin: 0;">
        <strong>💡 Dica:</strong> Você também pode acessar diretamente: 
        <a href="${APP_URL}/#/login" style="color: #d97706;">${APP_URL}/#/login</a>
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
      Este é um email automático. Por favor, não responda.<br>
      FitCoach.IA - Sistema de Gestão para Academias
    </p>
  </div>
</body>
</html>
  `;

  const emailText = `
✅ Pagamento Confirmado!

Sua academia foi ativada com sucesso!

📧 Código de Convite para Alunos: ${data.inviteCode}
   Link: ${APP_URL}/#/login?invite=${data.inviteCode}

🔑 Código Mestre da Academia: ${data.masterCode}

🚀 Próximos Passos:
1. Crie sua conta de administrador usando o email: ${data.email}
2. Use o código de convite acima para convidar seus alunos
3. Seus alunos receberão 3 dias grátis de IA automaticamente
4. Após o trial, seus alunos podem assinar planos individuais de IA

Acesse: ${activationUrl}

---
FitCoach.IA - Sistema de Gestão para Academias
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: data.email,
        subject: `✅ Academia Ativada - Código de Convite: ${data.inviteCode}`,
        html: emailHtml,
        text: emailText,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`Email enviado com sucesso. ID: ${result.id}`);
  } catch (error) {
    console.error("Erro ao enviar email via Resend:", error);
    throw error;
  }
}

// ============ HANDLER PARA PLANOS MANUAIS (SEM IA) ============

/**
 * Processa planos B2B Manual (Academias sem IA)
 * Cria empresa com limites ZERO para bloquear acesso à IA
 */
async function handleAcademyManualPlan(args: {
  plan: any;
  transactionId: string;
  amountPaid: number;
  customerEmail: string;
  body: any;
  checkoutId: string;
}) {
  const { plan, transactionId, amountPaid, customerEmail, checkoutId } = args;
  
  const cleanCheckoutId = checkoutId.includes('/') 
    ? checkoutId.split('/').pop()?.split('?')[0] 
    : checkoutId.split('?')[0];

  try {
    // 1. Gerar master_code
    const { data: masterCodeData, error: masterCodeError } = await supabase
      .rpc('generate_master_code');

    if (masterCodeError || !masterCodeData) {
      console.error("Erro ao gerar master_code:", masterCodeError);
      return;
    }

    const masterCode = masterCodeData as string;

    // 2. Mapear nome do plano
    const planNameMap: Record<string, string> = {
      'FitCoachManual50': 'FitCoach Manual 50',
      'FitCoachManual100': 'FitCoach Manual 100',
      'FitCoachManual200': 'FitCoach Manual 200',
      'FitCoachManual300': 'FitCoach Manual 300',
      'FitCoachManual400': 'FitCoach Manual 400',
      'FitCoachManual500': 'FitCoach Manual 500',
      'FitCoachManual600': 'FitCoach Manual 600',
    };
    const planSlug = plan.name || plan.slug;
    const planName = planNameMap[planSlug] || plan.display_name || plan.name;

    // 3. Extrair alunos_max do plano
    const alunosMax = plan.limits?.maxUsers || 50;

    // 4. Calcular data de expiração
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 5. Criar empresa na tabela companies COM LIMITES ZERO (sem IA)
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        name: planName + " - " + customerEmail,
        email: customerEmail,
        plan_type: planSlug, // Ex: 'FitCoachManual50'
        plan_name: planName,
        plano: planSlug, // Para compatibilidade com enum (se necessário)
        alunos_max: alunosMax,
        limite_texto: 0,      // ⚠️ ZERO = SEM IA
        limite_imagem: 0,     // ⚠️ ZERO = SEM IA
        limite_voz: 0,        // ⚠️ ZERO = SEM IA
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
      console.error("Erro ao criar empresa manual:", companyError);
      return;
    }

    console.log(`✅ Empresa manual criada: ${company.id} com master_code: ${masterCode}`);
    console.log(`⚠️ Limites de IA definidos como ZERO (sem acesso à IA)`);

    // 6. Criar gym (se necessário)
    const { error: gymError } = await supabase
      .from("gyms")
      .insert({
        id: company.id.toString(),
        name: planName + " - " + customerEmail,
        email: customerEmail,
        is_active: true,
      })
      .select()
      .single();

    if (gymError) {
      console.warn("Gym já existe ou erro ao criar:", gymError);
    }

    // 7. Criar código de convite padrão
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error: inviteError } = await supabase
      .from("invites")
      .insert({
        academy_id: company.id,
        code: inviteCode,
        invited_role: 'student',
        expires_at: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
      });

    if (inviteError) {
      console.warn("Erro ao criar código de convite:", inviteError);
    }

    // 8. Enviar email de ativação
    try {
      await sendActivationEmail({
        email: customerEmail,
        masterCode: masterCode,
        inviteCode: inviteCode,
        planName: planName,
      });
    } catch (emailError) {
      console.warn("Erro ao enviar email (não crítico):", emailError);
    }

    console.log(`✅ Plano manual ativado: ${planName} para ${customerEmail}`);
    console.log(`📧 Código de convite: ${inviteCode}`);
  } catch (error) {
    console.error("Erro ao processar plano manual:", error);
    await logAuditEvent("manual_plan_error", {
      error: error instanceof Error ? error.message : String(error),
      customer_email: customerEmail,
      transaction_id: transactionId,
    });
  }
}

/**
 * Processa planos B2C Manual (Individuais sem IA)
 * Cria assinatura sem acesso à IA
 */
async function handleB2CManualPlan(args: {
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
    
    const { data: userByEmail, error: userEmailError } = await supabase
      .from("users")
      .select("id")
      .eq("email", customerEmail)
      .maybeSingle();
    
    if (userByEmail && !userEmailError) {
      userId = userByEmail.id;
      console.log(`Usuário encontrado pelo email: ${customerEmail} (${userId})`);
    } else {
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
      console.error(`Não foi possível encontrar usuário para email: ${customerEmail}`);
      return;
    }

    // 2. Calcular datas do período
    const now = new Date();
    const periodStart = now.toISOString();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // 3. Verificar se já existe assinatura ativa
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
          plan_slug: plan.name || plan.slug,
          status: "active",
          current_period_start: periodStart,
          current_period_end: periodEnd.toISOString(),
          billing_cycle: 'monthly',
          payment_method_id: transactionId,
          payment_provider: 'cakto',
          updated_at: now.toISOString(),
        })
        .eq("id", existingSubscription.id)
        .select()
        .single();

      if (updateError || !updated) {
        console.error("Erro ao atualizar assinatura manual:", updateError);
        return;
      }
      subscription = updated;
      console.log(`✅ Assinatura manual atualizada: ${subscription.id}`);
    } else {
      // Criar nova assinatura
      const { data: created, error: createError } = await supabase
        .from("user_subscriptions")
        .insert({
          user_id: userId,
          user_email: customerEmail,
          plan_slug: plan.name || plan.slug,
          status: "active",
          current_period_start: periodStart,
          current_period_end: periodEnd.toISOString(),
          billing_cycle: 'monthly',
          payment_method_id: transactionId,
          payment_provider: 'cakto',
        })
        .select()
        .single();

      if (createError || !created) {
        console.error("Erro ao criar assinatura manual:", createError);
        return;
      }
      subscription = created;
      console.log(`✅ Assinatura manual B2C criada: ${subscription.id}`);
    }

    console.log(`⚠️ Plano manual B2C ativado - usuário NÃO terá acesso à IA`);
  } catch (error) {
    console.error("Erro ao processar plano manual B2C:", error);
    await logAuditEvent("b2c_manual_plan_error", {
      error: error instanceof Error ? error.message : String(error),
      customer_email: customerEmail,
      transaction_id: transactionId,
    });
  }
}

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