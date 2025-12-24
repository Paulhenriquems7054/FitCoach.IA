/**
 * URL da página de vendas externa
 * Esta é a página onde os usuários podem ver e comprar planos
 */
export const SALES_PAGE_URL = 'https://fit-coach-ia.vercel.app';

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
   * Seção de planos B2B (Academias)
   * Localização: Página B2B (activePage === 'b2b')
   */
  B2B: `${SALES_PAGE_URL}/?activePage=b2b`,
  
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
 * Redireciona para a página de vendas externa
 * @param section - Seção específica para redirecionar (opcional)
 */
export function redirectToSalesPage(section?: keyof typeof SALES_PAGE_SECTIONS) {
  const url = section ? SALES_PAGE_SECTIONS[section] : SALES_PAGE_SECTIONS.HOME;
  window.open(url, '_blank');
}


