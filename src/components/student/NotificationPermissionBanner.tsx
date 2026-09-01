import React, { useState, useEffect } from 'react';
import { Bell, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const PERMISSION_RESOLVED_KEY = 'scholario_notifications_permission_resolved';
const BANNER_DISMISSED_KEY = 'scholario_notifications_banner_dismissed';

export const NotificationPermissionBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // 1. Check browser support
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    // 2. Check if already granted or denied at browser level
    const currentPermission = Notification.permission;
    if (currentPermission === 'granted' || currentPermission === 'denied') {
      return;
    }

    // 3. Check if user already resolved or dismissed the banner in a prior session
    const isResolved = localStorage.getItem(PERMISSION_RESOLVED_KEY) === 'true';
    const isDismissed = localStorage.getItem(BANNER_DISMISSED_KEY) === 'true';

    if (!isResolved && !isDismissed && currentPermission === 'default') {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  const handleRequestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setIsVisible(false);
      return;
    }

    setIsRequesting(true);
    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        localStorage.setItem(PERMISSION_RESOLVED_KEY, 'true');
        toast.success('Live class notifications enabled!', {
          description: "You'll receive an instant alert whenever your teacher starts a class.",
        });
        setIsVisible(false);
      } else if (permission === 'denied') {
        localStorage.setItem(PERMISSION_RESOLVED_KEY, 'true');
        toast.info('Notifications blocked in browser settings', {
          description: 'You can enable them anytime in your browser site permissions.',
        });
        setIsVisible(false);
      } else {
        // 'default' - dismissed prompt without choosing
        localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
        setIsVisible(false);
      }
    } catch (err) {
      console.warn('[NotificationPermissionBanner] request error:', err);
      setIsVisible(false);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    setIsVisible(false);
  };

  return (
    <div
      id="live-class-notification-banner"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 bg-amber-50/40 p-4 sm:p-4.5 transition-all shadow-xs"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Icon + Text */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-100/90 text-amber-900 flex items-center justify-center shrink-0 border border-amber-200">
            <Bell size={18} className="text-amber-900" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-[#111111] tracking-tight">
                Enable Live Class Alerts
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900">
                <Sparkles size={10} /> Instant
              </span>
            </div>
            <p className="text-xs text-[#525252] mt-0.5 leading-relaxed font-medium">
              Get desktop alerts the moment your teacher goes live so you can tap and join immediately.
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleDismiss}
            className="text-xs font-semibold text-[#737373] hover:text-[#111111] px-3 py-1.5 rounded-lg transition-colors interactive"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-[#111111] hover:bg-[#262626] text-white transition-all shadow-xs interactive disabled:opacity-50"
          >
            <Bell size={13} className="text-[#F4C430]" />
            <span>{isRequesting ? 'Enabling…' : 'Enable Notifications'}</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            title="Dismiss"
            className="p-1 rounded-lg text-[#737373] hover:text-[#111111] hover:bg-black/5 transition-colors interactive ml-1"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionBanner;
