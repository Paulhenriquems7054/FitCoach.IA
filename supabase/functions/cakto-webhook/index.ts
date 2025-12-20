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
    const checkoutId: string = body?.data?.checkout_id || body?.data?.checkoutId || "";
    const transactionId: string = body?.data?.id || body?.data?.transaction_id || "";
    const amountPaid: number = body?.data?.amount || 0;
    const customerEmail: string = body?.data?.customer_email || body?.data?.buyer?.email || "";

    if (!checkoutId) {
      console.error("checkout_id não encontrado no payload");
      return new Response("checkout_id ausente", { status: 400 });
    }

    // 3) Buscar plano correspondente na tabela subscription_plans
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("cakto_checkout_id", checkoutId)
      .single();

    if (planError || !plan) {
      console.error("Plano não encontrado para checkout_id:", checkoutId, planError);
      return new Response("Plano não encontrado", { status: 404 });
    }

    console.log("Plano encontrado:", { plan_group: plan.plan_group, slug: plan.slug });

    // 4) Filtrar só eventos de pagamento confirmado (ajustar depois conforme Cakto)
    const isPaidEvent =
      eventType === "payment.completed" ||
      eventType === "subscription.created" ||
      eventType === "subscription.payment_succeeded";

    if (!isPaidEvent) {
      console.log("Evento não é de pagamento confirmado, ignorando:", eventType);
      return new Response("Evento ignorado", { status: 200 });
    }

    // 5) Processar por tipo de plano
    switch (plan.plan_group) {
      case "b2b_academia":
        await handleAcademyPlan({ plan, transactionId, amountPaid, customerEmail, body });
        await logAuditEvent("academy_plan_activated", {
          planSlug: plan.slug,
          transactionId,
          customerEmail,
        });
        break;
      case "b2c":
        // Planos B2C foram removidos - não existem mais na página de vendas nem na Cakto
        console.warn("Plano B2C recebido mas foi removido:", plan.slug);
        // Não processar - apenas logar para auditoria
        break;
      case "recarga":
        await handleRecharge({ plan, transactionId, amountPaid, customerEmail, body });
        await logAuditEvent("recharge_activated", {
          planSlug: plan.slug,
          transactionId,
          customerEmail,
        });
        break;
      case "personal":
        // Planos Personal Trainer foram removidos - não existem mais na página de vendas nem na Cakto
        console.warn("Plano Personal Trainer recebido mas foi removido:", plan.slug);
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
    const planName = planNameMap[plan.slug] || plan.display_name || plan.name;

    // 3. Calcular data de expiração (30 dias a partir de agora)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 4. Criar empresa na tabela companies
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        name: planName + " - " + customerEmail, // Nome temporário, pode ser atualizado depois
        email: customerEmail,
        plan_type: plan.slug,
        plan_name: planName,
        max_licenses: plan.max_licenses || 10,
        master_code: masterCode,
        status: 'active',
        payment_status: 'paid',
        cakto_transaction_id: transactionId,
        cakto_checkout_id: plan.cakto_checkout_id,
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
          plan_slug: plan.slug,
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
          plan_slug: plan.slug,
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
      plan_slug: plan.slug,
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
}) {
  const { plan, transactionId, amountPaid, customerEmail } = args;

  const { error } = await supabase.from("user_subscriptions").insert({
    user_email: customerEmail,
    plan_slug: plan.slug,
    plan_group: plan.plan_group,
    cakto_checkout_id: plan.cakto_checkout_id,
    cakto_transaction_id: transactionId,
    amount_paid: amountPaid,
    status: "active",
  });

  if (error) console.error("Erro ao criar assinatura B2C:", error);
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
  
  const rechargeType = rechargeTypeMap[plan.slug] || 'turbo';
  
  // 2. Mapear nome da recarga
  const rechargeNameMap: Record<string, string> = {
    'recarga_turbo': 'Sessão Turbo',
    'recarga_banco_voz_100': 'Banco de Voz 100',
    'recarga_passe_livre_30d': 'Passe Livre 30 Dias',
  };
  
  const rechargeName = rechargeNameMap[plan.slug] || plan.name || 'Recarga';
  
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
    cakto_checkout_id: plan.cakto_checkout_id,
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
    plan_slug: plan.slug,
    plan_group: plan.plan_group,
    cakto_checkout_id: plan.cakto_checkout_id,
    cakto_transaction_id: transactionId,
    amount_paid: amountPaid,
    max_licenses: plan.max_licenses,
    status: "active",
  });

  if (error) console.error("Erro ao criar assinatura de personal:", error);
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