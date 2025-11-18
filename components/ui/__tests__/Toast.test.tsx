import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ToastProvider, useToast } from '../Toast';

const TestComponent = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  return (
    <div>
      <button onClick={() => showSuccess('Sucesso!')}>Show Success</button>
      <button onClick={() => showError('Erro!')}>Show Error</button>
      <button onClick={() => showWarning('Aviso!')}>Show Warning</button>
      <button onClick={() => showInfo('Info!')}>Show Info</button>
    </div>
  );
};

describe('Toast', () => {
  it('deve exibir toast de sucesso', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Success');
    button.click();

    await waitFor(() => {
      expect(screen.getByText('Sucesso!')).toBeInTheDocument();
    });
  });

  it('deve exibir toast de erro', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Error');
    button.click();

    await waitFor(() => {
      expect(screen.getByText('Erro!')).toBeInTheDocument();
    });
  });

  it('deve ter role="alert" para acessibilidade', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Error');
    button.click();

    await waitFor(() => {
      const toast = screen.getByRole('alert');
      expect(toast).toBeInTheDocument();
    });
  });
});

