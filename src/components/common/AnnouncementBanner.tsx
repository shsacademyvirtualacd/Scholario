import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  Info,
  AlertTriangle,
  AlertOctagon,
  X,
  Phone,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { supabase } from '../../lib/supabase';
import { getActiveSiteAnnouncements } from '../../lib/db';
import type { SiteAnnouncement, SiteAnnouncementType } from '../../types';

const DISMISSED_STORAGE_KEY = 'scholario_dismissed_site_announcements';

// Helper: load and save dismissed IDs with their updated_at timestamps
function getDismissedMap(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(DISMISSED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDismissed(id: string, updatedAt: string) {
  if (typeof window === 'undefined') return;
  try {
    const map = getDismissedMap();
    map[id] = updatedAt;
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('[AnnouncementBanner] Failed to save dismissal in localStorage:', err);
  }
}

// Formats message by auto-detecting URLs and phone numbers
export const FormattedMessage: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const parts = useMemo(() => {
    // Regex matching URLs and international/local phone numbers
    // URL pattern: https?://...
    // Phone pattern: +92..., 03..., or +xxx with 10 to 14 digits
    const regex = /(https?:\/\/[^\s<>"']+)|(\+?\d{1,4}[\s-]?)?(03\d{2}[\s-]?\d{7}|\+92[\s-]?\d{3}[\s-]?\d{7}|\+?[0-9]{10,14})/g;

    const tokens: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        tokens.push(text.slice(lastIndex, matchIndex));
      }

      const matchText = match[0];
      if (matchText.startsWith('http://') || matchText.startsWith('https://')) {
        tokens.push(
          <a
            key={`url-${matchIndex}`}
            href={matchText}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 decoration-current hover:opacity-85 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <span>{matchText}</span>
            <ExternalLink size={12} className="inline opacity-80" />
          </a>
        );
      } else {
        // Phone number
        const cleanPhone = matchText.replace(/[\s-]/g, '');
        tokens.push(
          <a
            key={`phone-${matchIndex}`}
            href={`tel:${cleanPhone}`}
            className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 decoration-current hover:opacity-85 transition-opacity"
            onClick={(e) => e.stopPropagation()}
            title={`Call ${matchText}`}
          >
            <Phone size={12} className="inline opacity-80" />
            <span>{matchText}</span>
          </a>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      tokens.push(text.slice(lastIndex));
    }

    return tokens;
  }, [text]);

  return <span className={className}>{parts}</span>;
};

// Styling configurations by announcement type matching dark/light themes
export const TYPE_STYLES: Record<
  SiteAnnouncementType,
  {
    container: string;
    iconColor: string;
    IconComponent: React.ComponentType<{ size?: number; className?: string }>;
    accentBorder: string;
    closeBtn: string;
    pulseIcon?: boolean;
    label: string;
  }
> = {
  success: {
    container:
      'bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-teal-500/15 text-emerald-950 dark:text-emerald-100 border-l-4 border-l-emerald-500 border-b border-emerald-500/20 shadow-sm backdrop-blur-md',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    IconComponent: CheckCircle2,
    accentBorder: 'border-l-emerald-500',
    closeBtn: 'text-emerald-700 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-emerald-100 hover:bg-emerald-500/10',
    pulseIcon: false,
    label: 'Success',
  },
  info: {
    container:
      'bg-gradient-to-r from-sky-500/15 via-sky-500/10 to-blue-500/15 text-sky-950 dark:text-sky-100 border-l-4 border-l-sky-500 border-b border-sky-500/20 shadow-sm backdrop-blur-md',
    iconColor: 'text-sky-600 dark:text-sky-400',
    IconComponent: Info,
    accentBorder: 'border-l-sky-500',
    closeBtn: 'text-sky-700 hover:text-sky-950 dark:text-sky-300 dark:hover:text-sky-100 hover:bg-sky-500/10',
    pulseIcon: false,
    label: 'Info',
  },
  warning: {
    container:
      'bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/15 text-amber-950 dark:text-amber-100 border-l-4 border-l-amber-500 border-b border-amber-500/20 shadow-sm backdrop-blur-md',
    iconColor: 'text-amber-600 dark:text-amber-400',
    IconComponent: AlertTriangle,
    accentBorder: 'border-l-amber-500',
    closeBtn: 'text-amber-700 hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100 hover:bg-amber-500/10',
    pulseIcon: false,
    label: 'Warning',
  },
  urgent: {
    container:
      'bg-gradient-to-r from-rose-500/20 via-rose-500/15 to-red-500/20 text-rose-950 dark:text-rose-100 border-l-4 border-l-rose-500 border-b border-rose-500/30 shadow-md backdrop-blur-md',
    iconColor: 'text-rose-600 dark:text-rose-400',
    IconComponent: AlertOctagon,
    accentBorder: 'border-l-rose-500',
    closeBtn: 'text-rose-700 hover:text-rose-950 dark:text-rose-300 dark:hover:text-rose-100 hover:bg-rose-500/15',
    pulseIcon: true,
    label: 'Urgent',
  },
};

export const AnnouncementBannerItem: React.FC<{
  announcement: SiteAnnouncement;
  onDismiss?: (id: string, updatedAt: string) => void;
  isDismissing?: boolean;
}> = ({ announcement, onDismiss, isDismissing = false }) => {
  const typeConfig = TYPE_STYLES[announcement.type] || TYPE_STYLES.info;
  const { IconComponent, pulseIcon } = typeConfig;

  return (
    <div
      role="alert"
      className={`relative w-full rounded-b-lg px-3.5 sm:px-6 py-2.5 sm:py-3 transition-all duration-300 ease-out flex items-center justify-between gap-3 min-h-[48px] overflow-hidden ${
        typeConfig.container
      } ${isDismissing ? 'opacity-0 -translate-y-4 max-h-0 py-0 overflow-hidden' : 'opacity-100 translate-y-0 max-h-40'}`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
        {/* Type Icon with subtle pulse for urgent */}
        <div className={`shrink-0 ${pulseIcon ? 'animate-pulse' : ''}`}>
          <IconComponent size={19} className={typeConfig.iconColor} />
        </div>

        {/* Content text */}
        <div className="flex-1 text-xs sm:text-sm leading-snug flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {announcement.title && (
            <span className="font-bold tracking-tight shrink-0">
              {announcement.title}
            </span>
          )}
          <FormattedMessage text={announcement.message} className="font-normal opacity-95 break-words" />
        </div>
      </div>

      {/* Dismiss Button */}
      {announcement.is_dismissible && onDismiss && (
        <button
          type="button"
          onClick={() => onDismiss(announcement.id, announcement.updated_at || announcement.created_at)}
          className={`shrink-0 p-1.5 rounded-md transition-colors interactive ${typeConfig.closeBtn}`}
          aria-label="Dismiss announcement"
          title="Dismiss"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export const AnnouncementBanner: React.FC = () => {
  const { profile } = useAuth();
  const userRole = profile?.role || 'student';
  const [announcements, setAnnouncements] = useState<SiteAnnouncement[]>([]);
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set());

  const fetchBanners = useCallback(async () => {
    try {
      const active = await getActiveSiteAnnouncements(userRole);
      const dismissedMap = getDismissedMap();

      // Filter out dismissed announcements unless updated_at is newer than stored dismissed time
      const visible = active.filter((item) => {
        if (!item.is_dismissible) return true;
        const dismissedAt = dismissedMap[item.id];
        if (!dismissedAt) return true;
        const currentUpdated = new Date(item.updated_at || item.created_at).getTime();
        const storedDismissed = new Date(dismissedAt).getTime();
        return currentUpdated > storedDismissed;
      });

      // Show newest first, stack at most 2
      const sorted = [...visible].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setAnnouncements(sorted.slice(0, 2));
    } catch (err) {
      console.warn('[AnnouncementBanner] Error fetching announcements:', err);
    }
  }, [userRole]);

  useEffect(() => {
    fetchBanners();

    // 1. Supabase Realtime subscription
    const channel = supabase
      .channel('site-announcements-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_announcements' },
        () => {
          fetchBanners();
        }
      )
      .subscribe();

    // 2. 30-second polling fallback
    const interval = setInterval(fetchBanners, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchBanners]);

  const handleDismiss = (id: string, updatedAt: string) => {
    setDismissingIds((prev) => new Set(prev).add(id));
    saveDismissed(id, updatedAt);

    // Allow slide-up animation to complete before removing from state
    setTimeout(() => {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      setDismissingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  };

  if (announcements.length === 0) {
    return null;
  }

  return (
    <div className="w-full z-[55] space-y-1.5 px-2 sm:px-4 pt-2">
      {announcements.map((ann) => (
        <AnnouncementBannerItem
          key={ann.id}
          announcement={ann}
          onDismiss={handleDismiss}
          isDismissing={dismissingIds.has(ann.id)}
        />
      ))}
    </div>
  );
};

export default AnnouncementBanner;
