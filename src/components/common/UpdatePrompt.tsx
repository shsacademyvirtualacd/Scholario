import React, { useState, useEffect } from 'react';
import { RotateCw, X, Sparkles } from 'lucide-react';
import { UPDATE_AVAILABLE_EVENT, applyUpdateAndReload } from '../../lib/serviceWorkerRegistration';

export const UpdatePrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [versionKey, setVersionKey] = useState<string>('');

  useEffect(() => {
    // Check if user already dismissed update for this browser session
    const isDismissed = sessionStorage.getItem('scholario_update_dismissed') === 'true';
    if (isDismissed) return;

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ reason?: string; version?: string }>;
      const ver = customEvent.detail?.version || Date.now().toString(36);
      
      // Check if this specific version was already dismissed
      const dismissedVer = sessionStorage.getItem('scholario_update_dismissed_version');
      if (dismissedVer && dismissedVer === ver) {
        return;
      }

      // Safety check: Never show while student is actively taking a quiz or uploading a file
      const isTakingQuiz = 
        window.location.pathname.includes('/student/self-testing') && 
        Boolean(document.querySelector('[data-quiz-active="true"], [data-exam-active="true"]'));
      const isUploading = Boolean(document.querySelector('[data-is-uploading="true"], input[type="file"]:disabled'));
      const isProctoredExam = Boolean(document.querySelector('.proctored-exam-container, [data-exam-modal="true"]'));

      if (isTakingQuiz || isUploading || isProctoredExam) {
        // Suppress prompt during active exam session
        return;
      }

      setVersionKey(ver);
      setShowPrompt(true);
    };

    window.addEventListener(UPDATE_AVAILABLE_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(UPDATE_AVAILABLE_EVENT, handleUpdate);
    };
  }, []);

  const handleDismiss = () => {
    // Hide for the rest of the browser session and record version
    sessionStorage.setItem('scholario_update_dismissed', 'true');
    if (versionKey) {
      sessionStorage.setItem('scholario_update_dismissed_version', versionKey);
    }
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <aside
      aria-label="Application update available"
      role="alert"
      className="fixed top-0 inset-x-0 z-[9999] bg-[#111111] text-white border-b border-[#F4C430] shadow-md px-3 sm:px-6 py-2 transition-all animate-in slide-in-from-top duration-300"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-6 h-6 rounded-md bg-[#F4C430] text-black flex items-center justify-center shrink-0">
            <Sparkles size={13} className="text-black" />
          </span>
          <span className="font-bold truncate">
            New update available:
          </span>
          <span className="text-neutral-300 hidden sm:inline truncate">
            An updated version of Scholario is ready.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={applyUpdateAndReload}
            className="min-h-[32px] sm:min-h-[36px] px-3 py-1 bg-[#F4C430] hover:bg-[#E5B520] text-black font-extrabold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <RotateCw size={12} className="animate-spin-reverse" />
            <span>Reload</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="min-h-[32px] sm:min-h-[36px] px-2.5 py-1 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            Later
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="min-h-[32px] min-w-[32px] p-1 text-neutral-400 hover:text-white rounded-lg flex items-center justify-center cursor-pointer"
            title="Dismiss"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default UpdatePrompt;
