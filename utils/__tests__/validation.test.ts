import { describe, it, expect } from '@jest/globals';
import { validateUserData } from '../validation';

describe('validateUserData', () => {
  it('deve validar dados corretos', () => {
    const result = validateUserData({
      nome: 'João Silva',
      idade: 30,
      genero: 'Masculino',
      peso: 75,
      altura: 180,
      objetivo: 'perder peso',
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('deve rejeitar idade inválida (menor que 1)', () => {
    const result = validateUserData({
      idade: 0,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'idade',
      message: 'Idade deve estar entre 1 e 120 anos',
    });
  });

  it('deve rejeitar idade inválida (maior que 120)', () => {
    const result = validateUserData({
      idade: 121,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'idade',
      message: 'Idade deve estar entre 1 e 120 anos',
    });
  });

  it('deve rejeitar peso inválido (menor que 20kg)', () => {
    const result = validateUserData({
      peso: 19,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'peso',
      message: 'Peso deve estar entre 20kg e 300kg',
    });
  });

  it('deve rejeitar peso inválido (maior que 300kg)', () => {
    const result = validateUserData({
      peso: 301,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'peso',
      message: 'Peso deve estar entre 20kg e 300kg',
    });
  });

  it('deve rejeitar altura inválida (menor que 50cm)', () => {
    const result = validateUserData({
      altura: 49,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'altura',
      message: 'Altura deve estar entre 50cm e 250cm',
    });
  });

  it('deve rejeitar altura inválida (maior que 250cm)', () => {
    const result = validateUserData({
      altura: 251,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'altura',
      message: 'Altura deve estar entre 50cm e 250cm',
    });
  });

  it('deve rejeitar nome muito curto', () => {
    const result = validateUserData({
      nome: 'A',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'nome',
      message: 'Nome deve ter pelo menos 2 caracteres',
    });
  });

  it('deve rejeitar nome muito longo', () => {
    const result = validateUserData({
      nome: 'A'.repeat(101),
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'nome',
      message: 'Nome deve ter no máximo 100 caracteres',
    });
  });

  it('deve rejeitar gênero inválido', () => {
    const result = validateUserData({
      genero: 'Outro',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'genero',
      message: 'Gênero deve ser Masculino ou Feminino',
    });
  });

  it('deve rejeitar objetivo inválido', () => {
    const result = validateUserData({
      objetivo: 'objetivo_invalido',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'objetivo',
      message: 'Objetivo inválido',
    });
  });
});

