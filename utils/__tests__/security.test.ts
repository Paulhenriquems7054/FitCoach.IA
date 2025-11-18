import { describe, it, expect } from '@jest/globals';
import { sanitizeInput, sanitizeNumber, sanitizeEmail, containsDangerousContent } from '../security';

describe('sanitizeInput', () => {
  it('deve remover tags HTML', () => {
    const result = sanitizeInput('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('</script>');
  });

  it('deve limitar o tamanho da string', () => {
    const longString = 'A'.repeat(2000);
    const result = sanitizeInput(longString, 100);
    expect(result.length).toBeLessThanOrEqual(100);
  });

  it('deve remover espaços no início e fim', () => {
    const result = sanitizeInput('  teste  ');
    expect(result).toBe('teste');
  });
});

describe('sanitizeNumber', () => {
  it('deve retornar número válido dentro do range', () => {
    const result = sanitizeNumber('50', 0, 100);
    expect(result).toBe(50);
  });

  it('deve limitar ao mínimo', () => {
    const result = sanitizeNumber('-10', 0, 100);
    expect(result).toBe(0);
  });

  it('deve limitar ao máximo', () => {
    const result = sanitizeNumber('150', 0, 100);
    expect(result).toBe(100);
  });

  it('deve retornar null para valores inválidos', () => {
    const result = sanitizeNumber('abc', 0, 100);
    expect(result).toBeNull();
  });
});

describe('sanitizeEmail', () => {
  it('deve remover caracteres inválidos', () => {
    const result = sanitizeEmail('test@example.com<script>');
    expect(result).not.toContain('<script>');
  });

  it('deve converter para lowercase', () => {
    const result = sanitizeEmail('TEST@EXAMPLE.COM');
    expect(result).toBe('test@example.com');
  });

  it('deve limitar o tamanho', () => {
    const longEmail = 'a'.repeat(200) + '@example.com';
    const result = sanitizeEmail(longEmail);
    expect(result.length).toBeLessThanOrEqual(254);
  });
});

describe('containsDangerousContent', () => {
  it('deve detectar scripts', () => {
    expect(containsDangerousContent('<script>alert("xss")</script>')).toBe(true);
  });

  it('deve detectar javascript: protocol', () => {
    expect(containsDangerousContent('javascript:alert("xss")')).toBe(true);
  });

  it('deve detectar event handlers', () => {
    expect(containsDangerousContent('onclick="alert(1)"')).toBe(true);
  });

  it('deve retornar false para conteúdo seguro', () => {
    expect(containsDangerousContent('Texto normal e seguro')).toBe(false);
  });
});

