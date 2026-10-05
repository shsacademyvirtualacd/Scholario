import { Component, ErrorInfo, ReactNode } from 'react';
import { CHUNK_RELOAD_STORAGE_KEY } from '../../utils/lazyWithRetry';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

function isChunkLoadError(error: Error | null): boolean {
  if (!error) return false;
  const msg = error.message || String(error);
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('dynamically imported module') ||
    msg.includes('Loading CSS chunk') ||
    (error.name === 'TypeError' && msg.includes('fetch')) ||
    (msg.includes('/assets/') && msg.includes('.js'))
  );
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Error caught:', error.message);
    if ((import.meta as any).env?.DEV) {
      console.error('[ErrorBoundary] Stack:', error.stack);
      console.error('[ErrorBoundary] Component stack:', errorInfo?.componentStack);
    }
    this.setState({ errorInfo });

    // Automatic single-reload recovery for chunk load errors
    if (isChunkLoadError(error)) {
      const hasRetried = window.sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY) === 'true';
      if (!hasRetried) {
        console.warn('[ErrorBoundary] Stale build chunk detected. Automatically reloading once...');
        window.sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, 'true');
        window.location.reload();
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      const isChunk = isChunkLoadError(this.state.error);
      const isDev = Boolean((import.meta as any).env?.DEV);

      if (isChunk) {
        return (
          <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111111] flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-md bg-white dark:bg-[#18181b] border border-[#E5E5E5] dark:border-[#27272a] rounded-3xl p-6 sm:p-8 shadow-xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-200/80 dark:border-amber-700/50 flex items-center justify-center mx-auto mb-4 text-[#F4C430]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-[#111111] dark:text-white mb-2">
                A new version is available
              </h1>
              <p className="text-xs sm:text-sm text-[#737373] dark:text-zinc-400 mb-6 leading-relaxed">
                Scholario has been updated with the latest improvements. Tap below to refresh and load the latest release.
              </p>
              <button
                type="button"
                onClick={() => {
                  window.sessionStorage.removeItem('scholario_chunk_reload_done');
                  window.location.reload();
                }}
                className="w-full py-3 px-5 bg-[#111111] hover:bg-black text-[#F4C430] rounded-2xl font-bold text-sm shadow-md transition-all interactive cursor-pointer"
              >
                Tap to refresh
              </button>
            </div>
          </div>
        );
      }

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
            <p className="text-xs sm:text-sm text-[#737373] dark:text-zinc-400 mb-6">
              An unexpected error occurred while loading this page. Please try refreshing.
            </p>

            {isDev && this.state.error && (
              <div className="text-left mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 overflow-hidden">
                <div className="text-xs font-bold text-rose-800 dark:text-rose-300 font-mono break-words mb-2">
                  {this.state.error.name}: {this.state.error.message}
                </div>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-rose-700/80 dark:text-rose-400/80 font-mono overflow-x-auto max-h-40 whitespace-pre-wrap">
                    {this.state.error.stack}
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
                onClick={() => {
                  window.sessionStorage.removeItem('scholario_chunk_reload_done');
                  window.location.reload();
                }}
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

interface SectionProps {
  name?: string;
  fallbackTitle?: string;
  onRetry?: () => void;
  children?: ReactNode;
}

interface SectionState {
  hasError: boolean;
  error: Error | null;
}

export class SectionErrorBoundary extends Component<SectionProps, SectionState> {
  public state: SectionState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<SectionState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[SectionErrorBoundary:${this.props.name || 'Unknown'}] Error:`, error.message);
    console.error(`[SectionErrorBoundary:${this.props.name || 'Unknown'}] Stack:`, error.stack);
    console.error(`[SectionErrorBoundary:${this.props.name || 'Unknown'}] Component:`, errorInfo?.componentStack);
  }

  public reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 my-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  {this.props.fallbackTitle || `Unable to load ${this.props.name || 'this section'}`}
                </h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 font-medium">
                  {this.state.error?.message || 'A transient rendering error occurred.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={this.reset}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-bold text-xs hover:bg-amber-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
            >
              Retry Section
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
