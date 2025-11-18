import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('deve renderizar o botão com texto', () => {
    render(<Button>Clique aqui</Button>);
    expect(screen.getByRole('button', { name: /clique aqui/i })).toBeInTheDocument();
  });

  it('deve estar desabilitado quando isLoading é true', () => {
    render(<Button isLoading>Carregando</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('deve estar desabilitado quando disabled é true', () => {
    render(<Button disabled>Desabilitado</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('deve aplicar variante primary por padrão', () => {
    render(<Button>Botão</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-primary-600');
  });

  it('deve aplicar variante secondary quando especificado', () => {
    render(<Button variant="secondary">Botão</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-white');
  });
});

