import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Sparkles,
  ArrowRight,
  GraduationCap,
  CheckCircle2,
  Award,
  Video,
  ExternalLink,
  Megaphone,
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  getPublicAnnouncement,
  isPublicAnnouncementDismissed,
  dismissPublicAnnouncement,
} from '../../lib/announcementService';
import type { Announcement } from '../../types';

export const PublicAnnouncementModal: React.FC = () => {
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getPublicAnnouncement()
      .then((ann) => {
        if (!isMounted) return;
        if (ann && ann.is_active !== false) {
          setAnnouncement(ann);
          const dismissed = isPublicAnnouncementDismissed(ann.id);
          if (!dismissed) {
            // Small delay to allow landing page to load smoothly before popup
            const timer = setTimeout(() => {
              if (isMounted) setIsOpen(true);
            }, 600);
            return () => clearTimeout(timer);
          } else {
            setMinimized(true);
          }
        }
      })
      .catch((err) => {
        console.warn('[PublicAnnouncementModal] Error fetching announcement:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !announcement) return null;

  const handleClose = () => {
    if (announcement) {
      dismissPublicAnnouncement(announcement.id);
    }
    setIsOpen(false);
    setMinimized(true);
  };

  const handleReopen = () => {
    setIsOpen(true);
    setMinimized(false);
  };

  const handleActionClick = () => {
    if (announcement?.id) {
      dismissPublicAnnouncement(announcement.id);
    }
    setIsOpen(false);
    const targetUrl = announcement?.action_url || '/register';
    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } else {
      navigate(targetUrl);
    }
  };

  return (
    <>
      {/* ─── Floating Persistent Re-open Pill (When Dismissed) ─── */}
      {minimized && !isOpen && (
        <button
          onClick={handleReopen}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#111111] text-white shadow-xl hover:bg-[#222222] border border-[#333333] transition-all hover:scale-105 active:scale-95 group text-xs font-bold"
          title="View announcement"
        >
          <span className="w-2 h-2 rounded-full bg-[#F4C430] animate-pulse" />
          <Megaphone size={15} className="text-[#F4C430] group-hover:rotate-12 transition-transform" />
          <span className="truncate max-w-[200px]">
            {announcement.badge_label || 'Admissions Notice'}
          </span>
          <ArrowRight size={13} className="text-[#A3A3A3] group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* ─── Modal Backdrop & Dialog ─── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#E5E5E5] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Top Admissions Banner / Header with Scholario Gold theme */}
            <div className="relative bg-gradient-to-r from-[#111111] via-[#1a1a1a] to-[#262626] p-6 text-white overflow-hidden shrink-0">
              {/* Subtle ambient gold accent glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#F4C430]/15 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />

              <div className="relative z-10 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#F4C430] text-[#111111] shadow-2xs">
                      <Sparkles size={13} className="text-[#111111]" />
                      {announcement.badge_label || 'Official Announcement'}
                    </span>
                    <span className="text-[11px] text-[#A3A3A3] font-medium flex items-center gap-1">
                      <GraduationCap size={13} className="text-[#F4C430]" />
                      SHS Virtual Academy
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug">
                    {announcement.title}
                  </h2>
                </div>

                <button
                  onClick={handleClose}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#D4D4D4] hover:text-white transition-all shrink-0 -mr-1 -mt-1"
                  title="Close announcement"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Admissions Quick Info Cards */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10">
                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                  <div className="flex items-center justify-center text-[#F4C430] mb-1">
                    <GraduationCap size={16} />
                  </div>
                  <p className="text-[10px] text-[#A3A3A3] uppercase font-bold tracking-wider">Curriculum</p>
                  <p className="text-xs font-bold text-white mt-0.5">FBISE 9–12</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                  <div className="flex items-center justify-center text-[#22c55e] mb-1">
                    <Video size={16} />
                  </div>
                  <p className="text-[10px] text-[#A3A3A3] uppercase font-bold tracking-wider">Format</p>
                  <p className="text-xs font-bold text-white mt-0.5">Live HD Classes</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                  <div className="flex items-center justify-center text-[#F4C430] mb-1">
                    <Award size={16} />
                  </div>
                  <p className="text-[10px] text-[#A3A3A3] uppercase font-bold tracking-wider">Aid</p>
                  <p className="text-xs font-bold text-white mt-0.5">Merit Grants</p>
                </div>
              </div>
            </div>

            {/* Scrollable Rich Body (Markdown) */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-[#333333] leading-relaxed select-text">
              <div className="prose prose-sm max-w-none text-[#404040]">
                <Markdown remarkPlugins={[remarkGfm]}>
                  {announcement.body}
                </Markdown>
              </div>

              {/* Verified Trust Badges */}
              <div className="p-3.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-2xl flex items-center justify-between gap-3 text-xs text-[#525252]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#16a34a] shrink-0" />
                  <span className="font-semibold">
                    Small batch sizes • Certified Subject Specialists • Comprehensive Solved Past Papers
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-5 bg-[#FAFAFA] border-t border-[#E5E5E5] flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#D4D4D4] text-[#525252] hover:text-[#111111] hover:bg-white text-xs font-bold transition-all text-center"
              >
                Close & Continue to Website
              </button>

              {announcement.action_label && (
                <button
                  type="button"
                  onClick={handleActionClick}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
                >
                  <span>{announcement.action_label}</span>
                  {announcement.action_url?.startsWith('http') ? (
                    <ExternalLink size={14} />
                  ) : (
                    <ArrowRight size={14} />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PublicAnnouncementModal;
