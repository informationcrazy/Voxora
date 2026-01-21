import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    // Clear local storage if it might be the cause (optional, but safe for critical errors)
    // localStorage.clear(); 
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
          <div className="relative mb-8">
             <div className="absolute inset-0 bg-red-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
             <div className="relative bg-white dark:bg-slate-900 p-6 rounded-full shadow-2xl border border-red-100 dark:border-red-900/50">
                <AlertTriangle className="w-12 h-12 text-red-500" />
             </div>
          </div>
          
          <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">
            Something went wrong
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md text-sm leading-relaxed">
            The application encountered an unexpected error. It's not your fault.
            <br/>
            <span className="font-mono text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded mt-2 inline-block text-red-500">
                {this.state.error?.message || "Unknown Error"}
            </span>
          </p>

          <div className="flex gap-4">
            <button 
              onClick={this.handleReload}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Reload App
            </button>
            <button 
              onClick={this.handleReset}
              className="px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all flex items-center gap-2"
            >
              <Home className="w-4 h-4" /> Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;