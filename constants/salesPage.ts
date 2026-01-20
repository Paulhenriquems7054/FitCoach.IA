/**
 * URL da página de vendas externa
 * Esta é a página onde os usuários podem ver e comprar planos
 * 
 * IMPORTANTE: O app funciona como DEMO. Todos os botões de "Assinar" 
 * redirecionam para esta página externa onde o cliente escolhe o plano,
 * paga na Cakto, recebe email com link e código de convite.
 */
export const SALES_PAGE_URL = 'https://pagina-de-vendas-fit-coach-ai.vercel.app';

/**
 * URLs específicas por seção da página de vendas
 */
export const SALES_PAGE_SECTIONS = {
  /**
   * Seção de planos B2C (Individuais - IA)
   * Localização: Página Home, seção #pricing
   */
  B2C_PRICING: `${SALES_PAGE_URL}/#pricing`,
  
  /**
   * Seção de planos B2B (Academias - COM IA)
   * Localização: Página B2B (activePage === 'b2b')
   */
  B2B: `${SALES_PAGE_URL}/?activePage=b2b`,
  
  /**
   * Seção de planos B2B Manual (Academias - SEM IA)
   * Localização: Página B2B Manual (activePage === 'b2b_manual')
   */
  B2B_MANUAL: `${SALES_PAGE_URL}/?activePage=b2b_manual`,
  
  /**
   * Seção de planos B2C Manual (Individuais - SEM IA)
   * Localização: Página B2C Manual (activePage === 'b2c_manual')
   */
  B2C_MANUAL: `${SALES_PAGE_URL}/?activePage=b2c_manual`,
  
  /**
   * Seção de planos Personal Trainers
   * Localização: Página Personal Trainers (activePage === 'personal')
   */
  PERSONAL: `${SALES_PAGE_URL}/?activePage=personal`,
  
  /**
   * Seção de Recargas
   * Localização: Página Recarga (activePage === 'recharge')
   */
  RECHARGE: `${SALES_PAGE_URL}/?activePage=recharge`,
  
  /**
   * Página principal (home)
   */
  HOME: SALES_PAGE_URL,
} as const;

/**
 * Redireciona para a página de vendas externa em nova aba
 * @param section - Seção específica para redirecionar (opcional)
 * 
 * IMPORTANTE: Esta função abre a página externa em uma nova aba.
 * O app funciona como DEMO - o cliente vê como funciona e depois
 * é redirecionado para a página externa para escolher e pagar.
 */
export function redirectToSalesPage(section?: keyof typeof SALES_PAGE_SECTIONS) {
  const url = section ? SALES_PAGE_SECTIONS[section] : SALES_PAGE_SECTIONS.HOME;
  window.open(url, '_blank');
}

/**
 * Redireciona para a página de vendas externa na mesma aba
 * Útil quando queremos substituir a página atual (ex: PremiumPage)
 */
export function redirectToSalesPageSameTab(section?: keyof typeof SALES_PAGE_SECTIONS) {
  const url = section ? SALES_PAGE_SECTIONS[section] : SALES_PAGE_SECTIONS.HOME;
  window.location.href = url;
}





