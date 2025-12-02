/**
 * Testes de integração para serviços do Cakto
 * Testa cancelamento, verificação de status e webhook
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { cancelCaktoSubscription, checkCaktoPaymentStatus, getCaktoCheckoutUrl } from '../../services/caktoService';

describe('CaktoService', () => {
  beforeEach(() => {
    // Limpar mocks antes de cada teste
    jest.clearAllMocks();
  });

  describe('getCaktoCheckoutUrl', () => {
    it('deve retornar URL correta para plano mensal', () => {
      const url = getCaktoCheckoutUrl('monthly');
      expect(url).toBe('https://pay.cakto.com.br/zeygxve_668421');
    });

    it('deve retornar URL correta para plano anual', () => {
      const url = getCaktoCheckoutUrl('annual_vip');
      expect(url).toBe('https://pay.cakto.com.br/wvbkepi_668441');
    });

    it('deve retornar # para plano inválido', () => {
      const url = getCaktoCheckoutUrl('invalid_plan');
      expect(url).toBe('#');
    });
  });

  describe('cancelCaktoSubscription', () => {
    it('deve retornar erro se paymentId não fornecido', async () => {
      const result = await cancelCaktoSubscription('');
      expect(result.success).toBe(false);
      expect(result.error).toContain('ID de pagamento não fornecido');
    });

    it('deve processar cancelamento mesmo sem API key (confia no webhook)', async () => {
      // Mock do Supabase
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        update: jest.fn().mockReturnThis(),
      };

      // Como não temos acesso direto ao Supabase no teste, testamos a lógica
      const result = await cancelCaktoSubscription('test-payment-id');
      // Deve retornar sucesso mesmo sem encontrar assinatura (webhook processará)
      expect(result.success).toBe(true);
    });
  });

  describe('checkCaktoPaymentStatus', () => {
    it('deve retornar pending se paymentId não fornecido', async () => {
      const result = await checkCaktoPaymentStatus('');
      expect(result.status).toBe('pending');
    });

    it('deve retornar status válido', async () => {
      const result = await checkCaktoPaymentStatus('test-payment-id');
      expect(['pending', 'paid', 'failed', 'canceled']).toContain(result.status);
      expect(result.lastChecked).toBeDefined();
    });
  });
});

