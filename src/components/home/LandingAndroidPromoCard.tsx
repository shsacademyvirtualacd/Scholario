import React from 'react';
import { Smartphone, Download, AlertCircle } from 'lucide-react';
import { useLatestApk } from '../../hooks/useLatestApk';

export const LandingAndroidPromoCard: React.FC = () => {
  const { apkInfo, isIos } = useLatestApk();

  // If latest.json is missing or fails to load, hide completely. Never show a broken button.
  if (!apkInfo || !apkInfo.url) {
    return null;
  }

  return (
    <section className="relative z-10 -mt-6 sm:-mt-8 mb-12 sm:mb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div
        className="rounded-3xl p-6 sm:p-8 backdrop-blur-xl bg-white/75 dark:bg-[#151518]/80 border border-black/[0.08] dark:border-white/[0.12] shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex flex-col md:flex-row items-center justify-between gap-6 transition-all relative overflow-hidden"
      >
        {/* Decorative subtle gold glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#F2C230]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Left Side: Icon & Copy */}
        <div className="flex items-start sm:items-center gap-4 min-w-0 text-left w-full md:w-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#F2C230]/20 text-[#8A6A00] dark:text-[#F2C230] flex items-center justify-center shrink-0 shadow-xs">
            <Smartphone size={30} className="stroke-[2.2]" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                Scholario for Android
              </h3>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#F2C230]/20 text-[#8A6A00] dark:text-[#F2C230]">
                Official APK
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 font-medium">
              Learn, track attendance and take tests from your phone.
            </p>
          </div>
        </div>

        {/* Right Side: Gold Download Button + Version/Size + Install note */}
        <div className="flex flex-col items-center md:items-end gap-1.5 w-full md:w-auto shrink-0">
          {isIos ? (
            <div className="w-full md:w-auto min-h-[48px] px-6 rounded-2xl bg-neutral-100 dark:bg-white/[0.06] border border-neutral-300 dark:border-neutral-700 text-neutral-500 font-bold text-sm flex items-center justify-center select-none">
              Android only
            </div>
          ) : (
            <a
              id="landing-apk-download-btn"
              href={apkInfo.url}
              download={apkInfo.fileName || `scholario-${apkInfo.version}.apk`}
              className="w-full md:w-auto min-h-[48px] px-6 py-3 rounded-2xl bg-[#F2C230] hover:bg-[#E5B520] text-neutral-950 font-extrabold text-sm shadow-[0_4px_20px_rgba(242,194,48,0.35)] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              <Download size={18} className="stroke-[2.5]" />
              <span>Download Scholario App</span>
            </a>
          )}

          {/* Underneath: v1.0.3 · 24 MB */}
          <div className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
            v{apkInfo.version} · {apkInfo.size}
          </div>

          {/* Install Note */}
          <div className="flex items-center gap-1 text-[11px] text-neutral-400 dark:text-neutral-500">
            <AlertCircle size={11} className="shrink-0 text-[#8A6A00] dark:text-[#F2C230]" />
            <span>Allow install from unknown sources if prompted.</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingAndroidPromoCard;
