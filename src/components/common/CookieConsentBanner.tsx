import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, X, ChevronRight, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const COOKIE_CONSENT_KEY = 'scholario_cookie_consent';

export const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [allowPreferences, setAllowPreferences] = useState(true);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!consent) {
        // Small delay so it animates in cleanly after initial render
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Storage unavailable
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ type: 'all', timestamp: new Date().toISOString() }));
    } catch {}
    setIsVisible(false);
    setShowPreferencesModal(false);
  };

  const handleAcceptEssential = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ type: 'essential', timestamp: new Date().toISOString() }));
    } catch {}
    setIsVisible(false);
    setShowPreferencesModal(false);
  };

  const handleSaveCustom = () => {
    try {
      localStorage.setItem(
        COOKIE_CONSENT_KEY,
        JSON.stringify({
          type: allowPreferences ? 'custom_preferences' : 'essential',
          allowPreferences,
          timestamp: new Date().toISOString(),
        })
      );
    } catch {}
    setIsVisible(false);
    setShowPreferencesModal(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Bottom Sticky Banner */}
      <aside
        id="scholario-cookie-banner"
        role="region"
        aria-label="Cookie and Privacy Consent"
        className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 bg-white/95 dark:bg-[#141414]/95 backdrop-blur-md border-t border-[#E5E5E5] dark:border-[#262626] shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom"
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FFFBF0] dark:bg-amber-950/40 border border-[#FDE68A] dark:border-amber-800/40 text-[#D4A017] flex items-center justify-center shrink-0 mt-0.5">
              <Cookie size={20} />
            </div>
            <div className="space-y-1 text-xs">
              <p className="font-extrabold text-[#111111] dark:text-white text-sm tracking-tight flex items-center gap-1.5">
                <span>Your Privacy & Cookie Choices</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                  No Ad Trackers
                </span>
              </p>
              <p className="text-[#525252] dark:text-[#A3A3A3] leading-relaxed max-w-3xl">
                Scholario uses strictly necessary session cookies (secure authentication) and local storage for interface preferences (dark mode, chat themes). We do <strong>not</strong> use advertising or tracking cookies.{' '}
                <Link to="/cookies" className="text-[#D4A017] font-bold hover:underline">
                  Read Cookie Policy
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-[#D4A017] font-bold hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
            <button
              id="cookie-btn-manage"
              type="button"
              onClick={() => setShowPreferencesModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-bold text-[#525252] dark:text-[#A3A3A3] hover:text-[#111111] dark:hover:text-white bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Settings size={13} />
              <span>Customize</span>
            </button>

            <button
              id="cookie-btn-essential"
              type="button"
              onClick={handleAcceptEssential}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#111111] dark:text-white bg-white dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#333333] hover:bg-[#F9F9F9] dark:hover:bg-[#262626] transition-colors cursor-pointer"
            >
              Essential Only
            </button>

            <button
              id="cookie-btn-accept"
              type="button"
              onClick={handleAcceptAll}
              className="px-4 py-2 rounded-xl text-xs font-extrabold text-[#111111] bg-[#F4C430] hover:bg-[#E5B620] shadow-sm transition-all cursor-pointer flex items-center gap-1 active:scale-[0.98]"
            >
              <span>Accept All</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Preferences Modal */}
      {showPreferencesModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-lg bg-white dark:bg-[#181818] rounded-3xl border border-[#E5E5E5] dark:border-[#262626] p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#F0F0F0] dark:border-[#262626] pb-3">
              <div className="flex items-center gap-2.5">
                <Cookie size={20} className="text-[#F4C430]" />
                <h3 id="cookie-modal-title" className="text-base font-extrabold text-[#111111] dark:text-white">
                  Cookie & Storage Preferences
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferencesModal(false)}
                className="p-1.5 rounded-lg text-[#737373] hover:text-[#111111] dark:hover:text-white"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-[#525252] dark:text-[#A3A3A3]">
              {/* Category 1: Essential */}
              <div className="p-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-[#1F1F1F] border border-[#EAEAEA] dark:border-[#2E2E2E] flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#111111] dark:text-white">Strictly Necessary Cookies</span>
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Always Active</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Required for student authentication, session validation, and CSRF protection. Cannot be disabled.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="mt-1 w-4 h-4 rounded text-[#D4A017] cursor-not-allowed opacity-75"
                />
              </div>

              {/* Category 2: Preferences */}
              <div className="p-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-[#1F1F1F] border border-[#EAEAEA] dark:border-[#2E2E2E] flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#111111] dark:text-white">Preferences & Interface Customization</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Stores your chosen UI theme (Light/Dark mode) and custom chat wallpaper to enhance your study experience.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="cookie-pref-toggle"
                  checked={allowPreferences}
                  onChange={(e) => setAllowPreferences(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-[#D4A017] focus:ring-[#D4A017] cursor-pointer"
                />
              </div>

              {/* Category 3: Commercial Trackers */}
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                <span className="text-[11px] font-medium">
                  Scholario sets 0 advertising or analytical tracking cookies.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#F0F0F0] dark:border-[#262626]">
              <button
                type="button"
                onClick={handleAcceptEssential}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#737373] hover:text-[#111111] dark:hover:text-white cursor-pointer"
              >
                Reject Non-Essential
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="px-4 py-2 rounded-xl text-xs font-extrabold text-[#111111] bg-[#F4C430] hover:bg-[#E5B620] shadow-sm cursor-pointer"
              >
                Save My Choices
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieConsentBanner;
