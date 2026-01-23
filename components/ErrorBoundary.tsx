import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log detalhado no console
    console.error('❌ ErrorBoundary capturou um erro:', error);
    console.error('📋 Mensagem do erro:', error.message);
    console.error('📍 Stack trace:', error.stack);
    console.error('🔍 Component stack:', errorInfo.componentStack);
    console.error('📦 Error info completo:', errorInfo);
    
    // Tentar enviar para serviço de rastreamento de erros se disponível
    try {
      if (window.errorTracking && typeof window.errorTracking.captureError === 'function') {
        window.errorTracking.captureError(error, {
          componentStack: errorInfo.componentStack,
          errorBoundary: true
        });
      }
    } catch (trackingError) {
      console.warn('Erro ao enviar para tracking:', trackingError);
    }
    
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
              Ops! Algo deu errado
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Ocorreu um erro inesperado. Por favor, recarregue a página.
            </p>
            {this.state.error && (
              <details className="mb-4 text-xs text-slate-500 dark:text-slate-400" open>
                <summary className="cursor-pointer mb-2 font-semibold">Detalhes do erro</summary>
                <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-700 rounded overflow-auto max-h-64">
                  <div className="mb-2">
                    <strong>Mensagem:</strong>
                    <pre className="mt-1 whitespace-pre-wrap break-words">{this.state.error.message || this.state.error.toString()}</pre>
                  </div>
                  {this.state.error.stack && (
                    <div className="mb-2">
                      <strong>Stack Trace:</strong>
                      <pre className="mt-1 whitespace-pre-wrap break-words text-xs">{this.state.error.stack}</pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap break-words text-xs">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.reload();
              }}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

