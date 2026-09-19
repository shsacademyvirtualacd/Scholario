import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../../features/auth/AuthContext';
import {
  getActiveDashboardAnnouncements,
  dismissDashboardAnnouncement,
} from '../../lib/announcementService';
import type { Announcement } from '../../types';

interface DashboardNoticeModalProps {
  role: 'student' | 'teacher';
}

export const DashboardNoticeModal: React.FC<DashboardNoticeModalProps> = ({ role }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [queue, setQueue] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(true); // checked by default for convenience
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const userId = user?.id || profile?.id;

    getActiveDashboardAnnouncements(role, userId)
      .then((announcements) => {
        if (!isMounted) return;
        if (announcements && announcements.length > 0) {
          setQueue(announcements);
          setCurrentIndex(0);
          // Show modal after dashboard initial render settles
          const timer = setTimeout(() => {
            if (isMounted) setIsOpen(true);
          }, 500);
          return () => clearTimeout(timer);
        }
      })
      .catch((err) => {
        console.warn('[DashboardNoticeModal] Error loading active announcements:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [role, user?.id, profile?.id]);

  if (!isOpen || queue.length === 0 || currentIndex >= queue.length) {
    return null;
  }

  const currentAnnouncement = queue[currentIndex];
  const totalCount = queue.length;
  const isLast = currentIndex === totalCount - 1;

  const handleDismissAndAdvance = async (permanent: boolean) => {
    const userId = user?.id || profile?.id;
    if (permanent && userId && currentAnnouncement?.id) {
      try {
        setIsSubmitting(true);
        await dismissDashboardAnnouncement(currentAnnouncement.id, userId);
      } catch (err) {
        console.warn('[DashboardNoticeModal] Error recording dismissal:', err);
      } finally {
        setIsSubmitting(false);
      }
    }

    // Advance to next announcement in queue if any, else close modal
    if (!isLast) {
      setCurrentIndex((prev) => prev + 1);
      setDontShowAgain(true); // reset for next item
    } else {
      setIsOpen(false);
    }
  };

  const handleActionClick = async () => {
    const targetUrl = currentAnnouncement.action_url;
    if (dontShowAgain) {
      await handleDismissAndAdvance(true);
    } else {
      await handleDismissAndAdvance(false);
    }

    if (targetUrl) {
      if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      } else {
        navigate(targetUrl);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E5E5E5] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Banner */}
        <div className="relative bg-[#111111] p-6 text-white shrink-0 overflow-hidden">
          {/* Subtle gold glow in corner */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-[#F4C430]/15 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#F4C430] text-[#111111] shadow-2xs">
                  <Sparkles size={12} className="text-[#111111]" />
                  {currentAnnouncement.badge_label || (role === 'student' ? 'Student Guide' : 'Faculty Guide')}
                </span>

                {totalCount > 1 && (
                  <span className="text-[11px] font-bold text-[#A3A3A3] bg-white/10 px-2.5 py-0.5 rounded-full">
                    Notice {currentIndex + 1} of {totalCount}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                {currentAnnouncement.title}
              </h2>
            </div>

            <button
              onClick={() => handleDismissAndAdvance(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#A3A3A3] hover:text-white transition-all shrink-0"
              title="Close for now"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Rich Markdown Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-[#333333] leading-relaxed select-text">
          <div className="prose prose-sm max-w-none text-[#404040]">
            <Markdown remarkPlugins={[remarkGfm]}>
              {currentAnnouncement.body}
            </Markdown>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-[#FAFAFA] border-t border-[#E5E5E5] flex flex-col gap-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Don't show again checkbox */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-semibold text-[#525252] hover:text-[#111111]">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 text-[#F4C430] rounded border-gray-300 focus:ring-[#F4C430] cursor-pointer"
              />
              <span>Don't show this notice again on my account</span>
            </label>

            {/* Actions */}
            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDismissAndAdvance(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#737373] hover:text-[#111111] hover:bg-[#EAEAEA] transition-all"
              >
                Remind me later
              </button>

              {currentAnnouncement.action_label ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleActionClick}
                  className="px-5 py-2.5 rounded-xl bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] text-xs font-black shadow-sm transition-all flex items-center gap-1.5 hover:scale-[1.02] active:scale-95"
                >
                  <span>{currentAnnouncement.action_label}</span>
                  {currentAnnouncement.action_url?.startsWith('http') ? (
                    <ExternalLink size={14} />
                  ) : (
                    <ArrowRight size={14} />
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDismissAndAdvance(dontShowAgain)}
                  className="px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-[#222222] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 hover:scale-[1.02] active:scale-95"
                >
                  <CheckCircle2 size={14} className="text-[#22c55e]" />
                  <span>{isLast ? 'Got it, continue' : 'Next Notice'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardNoticeModal;
