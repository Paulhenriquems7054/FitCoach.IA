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

    // 3) Buscar plano correspondente na tabela app_plans
    const { data: plan, error: planError } = await supabase
      .from("app_plans")
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
        break;
      case "b2c":
        await handleB2CPlan({ plan, transactionId, amountPaid, customerEmail, body });
        break;
      case "recarga":
        await handleRecharge({ plan, transactionId, amountPaid, customerEmail, body });
        break;
      case "personal":
        await handlePersonalTrainerPlan({ plan, transactionId, amountPaid, customerEmail, body });
        break;
      default:
        console.warn("plan_group desconhecido:", plan.plan_group);
        break;
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Erro no webhook Cakto:", err);
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

  // Gerar código único de ativação
  const activationCode = generateActivationCode(); // ex: "ACADEMIA-XYZ123"

  const { data, error } = await supabase.from("academy_subscriptions").insert({
    academy_email: customerEmail,
    plan_slug: plan.slug,
    plan_group: plan.plan_group,
    cakto_checkout_id: plan.cakto_checkout_id,
    cakto_transaction_id: transactionId,
    amount_paid: amountPaid,
    max_licenses: plan.max_licenses,
    activation_code: activationCode, // ⚠️ Código gerado
    licenses_used: 0, // Iniciar com 0
    status: "active",
  }).select().single();

  if (error) {
    console.error("Erro ao criar assinatura de academia:", error);
    return;
  }

  // Enviar email com código (implementar depois)
  console.log(`Código gerado para ${customerEmail}: ${activationCode}`);
}

function generateActivationCode(): string {
  // Gerar código único no formato: ACADEMIA-XXXXXX
  const prefix = 'ACADEMIA';
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${random}`; // ex: "ACADEMIA-XYZ123"
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