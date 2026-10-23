import React, { useState, useEffect } from 'react';
import { RotateCw, X, Sparkles } from 'lucide-react';
import {
  UPDATE_AVAILABLE_EVENT,
  performFullUpdateAndReload,
} from '../../lib/serviceWorkerRegistration';

export const UpdatePrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [versionKey, setVersionKey] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Check if running inside Android WebView with "ScholarioApp" in user agent
  const isScholarioApp =
    typeof navigator !== 'undefined' &&
    /ScholarioApp/i.test(navigator.userAgent || '');

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ reason?: string; version?: string }>;
      const ver = customEvent.detail?.version || Date.now().toString(36);

      // 1. Prevent prompt from appearing right after a successful update
      const lastUpdatedVer = localStorage.getItem('scholario_last_updated_version');
      if (lastUpdatedVer && lastUpdatedVer === ver) {
        return;
      }

      // Check if update was completed in the last 20 seconds
      const lastUpdateTime = Number(localStorage.getItem('scholario_last_update_time') || 0);
      if (Date.now() - lastUpdateTime < 20000) {
        return;
      }

      // 2. Check if user dismissed this specific version during this browser session
      const dismissedVer = sessionStorage.getItem('scholario_update_dismissed_version');
      if (dismissedVer && dismissedVer === ver) {
        return;
      }

      // 3. Safety check: Never interrupt student during active quiz, exam or upload
      const isTakingQuiz =
        window.location.pathname.includes('/student/self-testing') &&
        Boolean(document.querySelector('[data-quiz-active="true"], [data-exam-active="true"]'));
      const isUploading = Boolean(
        document.querySelector('[data-is-uploading="true"], input[type="file"]:disabled')
      );
      const isProctoredExam = Boolean(
        document.querySelector('.proctored-exam-container, [data-exam-modal="true"]')
      );

      if (isTakingQuiz || isUploading || isProctoredExam) {
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

  const handleUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    await performFullUpdateAndReload(versionKey);
  };

  const handleDismiss = () => {
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
      className="fixed top-0 inset-x-0 z-[999999] pointer-events-auto shadow-2xl transition-all animate-in slide-in-from-top duration-300"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="bg-[#121214] text-white border-b-2 border-[#F4C430] px-3.5 sm:px-6 py-2 shadow-lg">
        {isScholarioApp ? (
          /* Android App (WebView with "ScholarioApp" UA) */
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-7 h-7 rounded-lg bg-[#F4C430] text-black flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles size={15} className="text-black stroke-[2.5]" />
              </span>
              <span className="font-extrabold text-white text-xs sm:text-sm truncate">
                A new version is available
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleUpdate}
                className="min-h-[36px] sm:min-h-[38px] px-4 py-1.5 bg-[#F4C430] hover:bg-[#E5B520] active:scale-95 text-black font-black text-xs sm:text-sm rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-75 disabled:cursor-wait"
              >
                <RotateCw size={14} className={isUpdating ? 'animate-spin' : ''} />
                <span>{isUpdating ? 'Updating...' : 'Update App'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Regular Browser */
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#F4C430] text-black flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles size={14} className="text-black stroke-[2.5]" />
              </span>
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-extrabold text-white">New update available:</span>
                <span className="text-neutral-300 hidden sm:inline truncate">
                  An updated version of Scholario is ready.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleUpdate}
                className="min-h-[32px] sm:min-h-[36px] px-3.5 py-1 bg-[#F4C430] hover:bg-[#E5B520] active:scale-95 text-black font-extrabold text-xs sm:text-sm rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-75 disabled:cursor-wait"
              >
                <RotateCw size={13} className={isUpdating ? 'animate-spin' : ''} />
                <span>{isUpdating ? 'Updating...' : 'Refresh'}</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="min-h-[32px] sm:min-h-[36px] px-2.5 py-1 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer text-xs"
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
                <X size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default UpdatePrompt;
