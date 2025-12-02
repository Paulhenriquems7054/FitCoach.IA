/**
 * Serviço de Gerenciamento de Companies (Academias B2B)
 * Gerencia criação, atualização e consulta de empresas e licenças
 */

import { getSupabaseClient } from './supabaseService';
import { logger } from '../utils/logger';

export interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cnpj?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  planType: 'academy_starter_mini' | 'academy_starter' | 'academy_growth' | 'academy_pro';
  planName: string;
  maxLicenses: number;
  masterCode: string;
  status: 'active' | 'suspended' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  monthlyAmount: number;
  currency: string;
  startedAt: string;
  expiresAt?: string;
  cancelledAt?: string;
  nextBillingDate?: string;
  subscriptionId?: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyLicense {
  id: string;
  companyId: string;
  userId: string;
  status: 'active' | 'revoked' | 'expired';
  activatedAt: string;
  revokedAt?: string;
  expiresAt?: string;
  activatedBy?: string;
  notes?: string;
  subscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySummary {
  id: string;
  name: string;
  email: string;
  masterCode: string;
  planType: string;
  planName: string;
  maxLicenses: number;
  status: string;
  paymentStatus: string;
  monthlyAmount: number;
  startedAt: string;
  nextBillingDate?: string;
  licensesUsed: number;
  licensesAvailable: number;
  ownerUsername?: string;
  ownerName?: string;
}

/**
 * Cria uma nova empresa (academia) B2B
 */
export async function createCompany(data: {
  name: string;
  email: string;
  phone?: string;
  cnpj?: string;
  address?: Company['address'];
  planType: Company['planType'];
  ownerId: string;
  subscriptionId?: string;
  caktoTransactionId?: string;
  caktoCheckoutId?: string;
  monthlyAmount: number;
}): Promise<{ success: boolean; company?: Company; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    // 1. Buscar informações do plano
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('name, display_name, limits')
      .eq('name', data.planType)
      .single();

    if (planError || !plan) {
      logger.error(`Plano ${data.planType} não encontrado`, 'companyService', planError);
      return { success: false, error: 'Plano não encontrado' };
    }

    const maxLicenses = (plan.limits as any)?.max_licenses || 0;
    if (!maxLicenses) {
      return { success: false, error: 'Plano não possui limite de licenças definido' };
    }

    // 2. Gerar código mestre único
    const { data: masterCodeData, error: codeError } = await supabase
      .rpc('generate_master_code');

    if (codeError || !masterCodeData) {
      logger.error('Erro ao gerar código mestre', 'companyService', codeError);
      return { success: false, error: 'Erro ao gerar código mestre' };
    }

    const masterCode = masterCodeData as string;

    // 3. Criar empresa
    const { data: company, error: createError } = await supabase
      .from('companies')
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        cnpj: data.cnpj,
        address: data.address || null,
        plan_type: data.planType,
        plan_name: plan.display_name,
        max_licenses: maxLicenses,
        master_code: masterCode,
        owner_id: data.ownerId,
        subscription_id: data.subscriptionId || null,
        cakto_transaction_id: data.caktoTransactionId || null,
        cakto_checkout_id: data.caktoCheckoutId || null,
        monthly_amount: data.monthlyAmount,
        payment_status: data.caktoTransactionId ? 'paid' : 'pending',
        status: 'active',
        currency: 'BRL',
      })
      .select()
      .single();

    if (createError || !company) {
      logger.error('Erro ao criar empresa', 'companyService', createError);
      return { success: false, error: 'Erro ao criar empresa' };
    }

    logger.info(`Empresa criada: ${company.name} (${masterCode})`, 'companyService');

    return {
      success: true,
      company: mapCompanyFromDb(company),
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('Erro ao criar empresa', 'companyService', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Busca uma empresa pelo código mestre
 */
export async function getCompanyByMasterCode(
  masterCode: string
): Promise<{ success: boolean; company?: Company; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('master_code', masterCode.toUpperCase().trim())
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return { success: false, error: 'Empresa não encontrada ou inativa' };
    }

    return {
      success: true,
      company: mapCompanyFromDb(data),
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('Erro ao buscar empresa', 'companyService', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Busca uma empresa pelo ID do dono (owner)
 */
export async function getCompanyByUserId(
  userId: string
): Promise<{ success: boolean; company?: Company; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('owner_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return { success: false, error: 'Empresa não encontrada' };
    }

    return {
      success: true,
      company: mapCompanyFromDb(data),
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('Erro ao buscar empresa por userId', 'companyService', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Busca todas as empresas (para painel do desenvolvedor)
 */
export async function getAllCompanies(): Promise<CompanySummary[]> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('companies_summary')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Erro ao buscar empresas', 'companyService', error);
      return [];
    }

    return (data || []).map(mapCompanySummaryFromDb);
  } catch (error) {
    logger.error('Erro ao buscar empresas', 'companyService', error);
    return [];
  }
}

/**
 * Adiciona uma licença (vincula aluno à empresa)
 */
export async function addCompanyLicense(data: {
  companyId: string;
  userId: string;
  subscriptionId: string;
  activatedBy?: string;
  notes?: string;
}): Promise<{ success: boolean; license?: CompanyLicense; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    // 1. Verificar se empresa existe e tem licenças disponíveis
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, max_licenses, status')
      .eq('id', data.companyId)
      .single();

    if (companyError || !company) {
      return { success: false, error: 'Empresa não encontrada' };
    }

    if (company.status !== 'active') {
      return { success: false, error: 'Empresa não está ativa' };
    }

    // 2. Contar licenças ativas
    const { count, error: countError } = await supabase
      .from('company_licenses')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', data.companyId)
      .eq('status', 'active');

    if (countError) {
      logger.error('Erro ao contar licenças', 'companyService', countError);
      return { success: false, error: 'Erro ao verificar licenças disponíveis' };
    }

    if ((count || 0) >= company.max_licenses) {
      return {
        success: false,
        error: `Todas as ${company.max_licenses} licenças já foram utilizadas. A academia precisa fazer upgrade.`,
      };
    }

    // 3. Verificar se usuário já tem licença nesta empresa
    const { data: existingLicense } = await supabase
      .from('company_licenses')
      .select('id')
      .eq('company_id', data.companyId)
      .eq('user_id', data.userId)
      .maybeSingle();

    if (existingLicense) {
      // Reativar licença existente se estiver revogada
      const { data: updated, error: updateError } = await supabase
        .from('company_licenses')
        .update({
          status: 'active',
          activated_at: new Date().toISOString(),
          revoked_at: null,
          subscription_id: data.subscriptionId,
          activated_by: data.activatedBy,
          notes: data.notes,
        })
        .eq('id', existingLicense.id)
        .select()
        .single();

      if (updateError || !updated) {
        return { success: false, error: 'Erro ao reativar licença' };
      }

      return {
        success: true,
        license: mapLicenseFromDb(updated),
      };
    }

    // 4. Criar nova licença
    const { data: license, error: createError } = await supabase
      .from('company_licenses')
      .insert({
        company_id: data.companyId,
        user_id: data.userId,
        subscription_id: data.subscriptionId,
        status: 'active',
        activated_by: data.activatedBy,
        notes: data.notes,
      })
      .select()
      .single();

    if (createError || !license) {
      logger.error('Erro ao criar licença', 'companyService', createError);
      return { success: false, error: 'Erro ao criar licença' };
    }

    logger.info(`Licença criada: usuário ${data.userId} → empresa ${data.companyId}`, 'companyService');

    return {
      success: true,
      license: mapLicenseFromDb(license),
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('Erro ao adicionar licença', 'companyService', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Remove/revoga uma licença
 */
export async function revokeCompanyLicense(
  licenseId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('company_licenses')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        notes: reason || 'Licença revogada pelo administrador',
      })
      .eq('id', licenseId);

    if (error) {
      logger.error('Erro ao revogar licença', 'companyService', error);
      return { success: false, error: 'Erro ao revogar licença' };
    }

    // Cancelar assinatura do usuário
    const { data: license } = await supabase
      .from('company_licenses')
      .select('subscription_id')
      .eq('id', licenseId)
      .single();

    if (license?.subscription_id) {
      await supabase
        .from('user_subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
        })
        .eq('id', license.subscription_id);
    }

    logger.info(`Licença revogada: ${licenseId}`, 'companyService');

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('Erro ao revogar licença', 'companyService', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Obtém estatísticas de licenças de uma empresa
 */
export async function getCompanyLicenseStats(companyId: string): Promise<{
  total: number;
  active: number;
  revoked: number;
  expired: number;
  available: number;
  maxLicenses: number;
}> {
  try {
    const supabase = getSupabaseClient();

    // Buscar empresa para obter max_licenses
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('max_licenses')
      .eq('id', companyId)
      .single();

    const maxLicenses = company?.max_licenses || 0;

    // Contar licenças por status
    const { data: licenses, error } = await supabase
      .from('company_licenses')
      .select('status')
      .eq('company_id', companyId);

    if (error) {
      logger.error('Erro ao buscar estatísticas de licenças', 'companyService', error);
      return {
        total: 0,
        active: 0,
        revoked: 0,
        expired: 0,
        available: maxLicenses,
        maxLicenses,
      };
    }

    const active = licenses?.filter(l => l.status === 'active').length || 0;
    const revoked = licenses?.filter(l => l.status === 'revoked').length || 0;
    const expired = licenses?.filter(l => l.status === 'expired').length || 0;
    const total = licenses?.length || 0;
    const available = Math.max(0, maxLicenses - active);

    return {
      total,
      active,
      revoked,
      expired,
      available,
      maxLicenses,
    };
  } catch (error) {
    logger.error('Erro ao buscar estatísticas de licenças', 'companyService', error);
    return {
      total: 0,
      active: 0,
      revoked: 0,
      expired: 0,
      available: 0,
      maxLicenses: 0,
    };
  }
}

/**
 * Busca licenças de uma empresa
 */
export async function getCompanyLicenses(companyId: string): Promise<CompanyLicense[]> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('company_licenses')
      .select('*')
      .eq('company_id', companyId)
      .order('activated_at', { ascending: false });

    if (error) {
      logger.error('Erro ao buscar licenças', 'companyService', error);
      return [];
    }

    return (data || []).map(mapLicenseFromDb);
  } catch (error) {
    logger.error('Erro ao buscar licenças', 'companyService', error);
    return [];
  }
}

// ============================================
// FUNÇÕES AUXILIARES (Mapeamento)
// ============================================

function mapCompanyFromDb(db: any): Company {
  return {
    id: db.id,
    name: db.name,
    email: db.email,
    phone: db.phone,
    cnpj: db.cnpj,
    address: db.address,
    planType: db.plan_type,
    planName: db.plan_name,
    maxLicenses: db.max_licenses,
    masterCode: db.master_code,
    status: db.status,
    paymentStatus: db.payment_status,
    monthlyAmount: parseFloat(db.monthly_amount || '0'),
    currency: db.currency || 'BRL',
    startedAt: db.started_at,
    expiresAt: db.expires_at,
    cancelledAt: db.cancelled_at,
    nextBillingDate: db.next_billing_date,
    subscriptionId: db.subscription_id,
    ownerId: db.owner_id,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function mapLicenseFromDb(db: any): CompanyLicense {
  return {
    id: db.id,
    companyId: db.company_id,
    userId: db.user_id,
    status: db.status,
    activatedAt: db.activated_at,
    revokedAt: db.revoked_at,
    expiresAt: db.expires_at,
    activatedBy: db.activated_by,
    notes: db.notes,
    subscriptionId: db.subscription_id,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function mapCompanySummaryFromDb(db: any): CompanySummary {
  return {
    id: db.id,
    name: db.name,
    email: db.email,
    masterCode: db.master_code,
    planType: db.plan_type,
    planName: db.plan_name,
    maxLicenses: db.max_licenses,
    status: db.status,
    paymentStatus: db.payment_status,
    monthlyAmount: parseFloat(db.monthly_amount || '0'),
    startedAt: db.started_at,
    nextBillingDate: db.next_billing_date,
    licensesUsed: db.licenses_used || 0,
    licensesAvailable: db.licenses_available || 0,
    ownerUsername: db.owner_username,
    ownerName: db.owner_name,
  };
}

