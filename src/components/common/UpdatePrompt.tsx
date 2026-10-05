import React, { useState, useEffect } from 'react';
import { RotateCw, X, Sparkles } from 'lucide-react';
import { UPDATE_AVAILABLE_EVENT, applyUpdateAndReload } from '../../lib/serviceWorkerRegistration';

export const UpdatePrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [reason, setReason] = useState<string>('update');

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ reason?: string }>;
      setReason(customEvent.detail?.reason || 'update');
      setShowPrompt(true);
    };

    window.addEventListener(UPDATE_AVAILABLE_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(UPDATE_AVAILABLE_EVENT, handleUpdate);
    };
  }, []);

  if (!showPrompt) return null;

  return (
    <aside
      aria-label="Application update available"
      role="alert"
      className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100vw-2.5rem)] animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-white dark:bg-neutral-900 border-2 border-[#111111] dark:border-neutral-700 rounded-2xl shadow-2xl p-4 sm:p-5 text-[#111111] dark:text-neutral-100 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F4C430] text-black flex items-center justify-center font-black shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight">
                New version available, reload
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 leading-snug">
                {reason === 'chunk-load-error'
                  ? 'A new build was deployed. Reload to fetch the latest assets.'
                  : 'An updated version of Scholario is ready to use.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPrompt(false)}
            className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
            title="Dismiss update notice"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={applyUpdateAndReload}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3.5 bg-[#111111] dark:bg-white hover:bg-black dark:hover:bg-neutral-100 text-[#F4C430] dark:text-black font-bold text-xs rounded-xl shadow-sm transition-all interactive cursor-pointer"
          >
            <RotateCw size={13} className="animate-spin-reverse" />
            <span>Reload Now</span>
          </button>
          <button
            type="button"
            onClick={() => setShowPrompt(false)}
            className="py-2 px-3 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-xl transition-colors cursor-pointer"
          >
            Later
          </button>
        </div>
      </div>
    </aside>
  );
};

export default UpdatePrompt;
