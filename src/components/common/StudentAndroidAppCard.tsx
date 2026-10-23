import React from 'react';
import { Smartphone, Download, AlertCircle } from 'lucide-react';
import { useLatestApk } from '../../hooks/useLatestApk';

export const StudentAndroidAppCard: React.FC = () => {
  const { apkInfo, isIos } = useLatestApk();

  // If latest.json is missing or fails to load, hide completely. Never show a broken button.
  if (!apkInfo || !apkInfo.url) {
    return null;
  }

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-white via-white to-[#F2C230]/5 dark:from-[#151518] dark:via-[#141416] dark:to-[#F2C230]/10 border border-neutral-200/90 dark:border-neutral-800 shadow-2xs space-y-3 relative overflow-hidden">
      {/* Decorative accent glow */}
      <div className="absolute top-0 right-0 w-28 h-28 bg-[#F2C230]/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#F2C230]/15 dark:bg-[#F2C230]/20 text-[#8A6A00] dark:text-[#F2C230] flex items-center justify-center shrink-0">
          <Smartphone size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black text-neutral-900 dark:text-white truncate">
            Scholario for Android
          </h3>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
            v{apkInfo.version} · {apkInfo.size}
          </p>
        </div>
      </div>

      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
        Access your live classes, homework, attendance records, and exams on the go with our native Android app.
      </p>

      {/* Button & Platform note */}
      <div className="pt-1 space-y-2">
        {isIos ? (
          <div className="w-full py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-neutral-800 text-center text-xs font-bold text-neutral-500">
            Android only
          </div>
        ) : (
          <a
            href={apkInfo.url}
            download={apkInfo.fileName || `scholario-${apkInfo.version}.apk`}
            className="min-h-[44px] w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#F2C230] hover:bg-[#e0b024] text-neutral-950 transition-colors shadow-xs active:scale-[0.99] cursor-pointer"
          >
            <Download size={15} />
            <span>Download Scholario App</span>
          </a>
        )}

        <div className="flex items-start gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-400">
          <AlertCircle size={12} className="shrink-0 mt-0.5 text-[#8A6A00] dark:text-[#F2C230]" />
          <span>Allow install from unknown sources if prompted.</span>
        </div>
      </div>
    </div>
  );
};

export default StudentAndroidAppCard;
