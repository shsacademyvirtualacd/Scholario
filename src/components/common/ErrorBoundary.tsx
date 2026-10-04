import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CRITICAL UNCAUGHT ERROR:', error);
    console.error('COMPONENT STACK:', errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111111] flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-xl bg-white dark:bg-[#18181b] border border-[#E5E5E5] dark:border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-lg text-center">
            <div className="w-12 h-12 rounded-full bg-[#FEF2F2] dark:bg-rose-950/50 border-2 border-[#ef444433] flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#111111] dark:text-white mb-2">Something went wrong</h1>
            <p className="text-xs sm:text-sm text-[#737373] dark:text-zinc-400 mb-4">
              A critical error occurred while rendering this page.
            </p>

            {this.state.error && (
              <div className="text-left mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 overflow-hidden">
                <div className="text-xs font-bold text-rose-800 dark:text-rose-300 font-mono break-words mb-2">
                  {this.state.error.name}: {this.state.error.message}
                </div>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-rose-700/80 dark:text-rose-400/80 font-mono overflow-x-auto max-h-40 whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                )}
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono overflow-x-auto max-h-32 mt-2 pt-2 border-t border-rose-200 dark:border-rose-900/40 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[#111111] dark:text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-2.5 px-4 bg-[#111111] hover:bg-[#262626] text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
