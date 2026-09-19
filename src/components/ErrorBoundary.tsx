import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary atrapó un error:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.removeItem('solar_sync_key');
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0c130d] text-[#ecf5ea] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#142015] border border-rose-900/50 rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-xl bg-rose-950/60 border border-rose-800 flex items-center justify-center mx-auto mb-4 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">
              Hubo un problema al cargar los datos
            </h2>
            <p className="text-xs text-[#8ca48a] mb-6">
              {this.state.error?.message || 'Error inesperado en la inicialización de la interfaz.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2 bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs rounded-lg transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Recargar página
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-[#1a261c] hover:bg-[#243527] border border-[#2e4230] text-xs text-[#d4e4cf] font-semibold rounded-lg transition-colors"
              >
                Restablecer datos locales
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
