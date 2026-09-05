import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Phone,
  Video,
  Search,
  Bell,
  BellOff,
  Mail,
  GraduationCap,
  Image as ImageIcon,
  ChevronRight,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import ProfileAvatar from '../common/ProfileAvatar';
import type { Profile } from '../../types';

interface ContactInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Profile | null | undefined;
  isOnline?: boolean;
  statusText?: string;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onOpenSearch?: () => void;
  onOpenMedia?: () => void;
  mediaCount?: number;
}

export const ContactInfoModal: React.FC<ContactInfoModalProps> = ({
  isOpen,
  onClose,
  contact,
  isOnline = false,
  statusText,
  isMuted = false,
  onToggleMute,
  onOpenSearch,
  onOpenMedia,
  mediaCount = 0,
}) => {
  if (!isOpen || !contact) return null;

  const roleTitle =
    contact.role === 'teacher'
      ? (contact as any)?.teacher_display_title || 'Faculty Teacher'
      : contact.role === 'admin'
      ? (contact as any)?.admin_tag || 'Administrator'
      : contact.class?.display_name || 'Student';

  const teacherSubjects = (contact as any)?.teacher_subjects as string[] | undefined;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="w-full max-w-md bg-[#F0F2F5] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-[#E5E5E5]"
        >
          {/* Header */}
          <div className="bg-white px-4 py-3.5 border-b border-[#E5E5E5] flex items-center justify-between shrink-0">
            <h3 className="text-base font-bold text-[#111111]">Contact info</h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#54656F] hover:text-[#111111] hover:bg-[#F5F5F5] transition-colors"
              aria-label="Close"
            >
              <X size={19} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {/* Contact Hero Card */}
            <div className="bg-white rounded-xl p-5 border border-[#E5E5E5] flex flex-col items-center text-center shadow-2xs">
              <div className="relative mb-3">
                <ProfileAvatar
                  avatarUrl={contact.avatar_url}
                  name={contact.full_name || 'User'}
                  role={contact.role || 'student'}
                  size="xl"
                  showOnlineBadge={isOnline}
                />
              </div>

              <h2 className="text-lg font-bold text-[#111111] leading-snug">
                {contact.full_name || 'Contact'}
              </h2>

              <p className="text-xs text-[#667781] mt-0.5 font-medium">
                {(contact as any).email || contact.phone || roleTitle}
              </p>

              {/* Status Indicator */}
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0F2F5] text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                  }`}
                />
                <span className={isOnline ? 'text-emerald-700 font-semibold' : 'text-[#667781]'}>
                  {isOnline ? 'Online now' : statusText || 'Offline'}
                </span>
              </div>

              {/* Action Quick Buttons */}
              <div className="grid grid-cols-3 gap-2 w-full mt-4 pt-4 border-t border-[#F0F0F0]">
                <button
                  type="button"
                  onClick={() => toast.info('Voice calling will be available in an upcoming update.')}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-[#F0F2F5] text-[#54656F] hover:text-[#111111] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#F0F2F5] group-hover:bg-[#25D366]/15 group-hover:text-[#25D366] flex items-center justify-center transition-colors">
                    <Phone size={18} />
                  </div>
                  <span className="text-[11px] font-medium">Audio</span>
                </button>

                <button
                  type="button"
                  onClick={() => toast.info('Video calling will be available in an upcoming update.')}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-[#F0F2F5] text-[#54656F] hover:text-[#111111] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#F0F2F5] group-hover:bg-[#25D366]/15 group-hover:text-[#25D366] flex items-center justify-center transition-colors">
                    <Video size={18} />
                  </div>
                  <span className="text-[11px] font-medium">Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSearch?.();
                  }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-[#F0F2F5] text-[#54656F] hover:text-[#111111] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#F0F2F5] group-hover:bg-[#111111]/10 group-hover:text-[#111111] flex items-center justify-center transition-colors">
                    <Search size={18} />
                  </div>
                  <span className="text-[11px] font-medium">Search</span>
                </button>
              </div>
            </div>

            {/* Academic Role & Bio Card */}
            <div className="bg-white rounded-xl p-4 border border-[#E5E5E5] space-y-3 shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#F4C430]/15 flex items-center justify-center text-[#B8860B] shrink-0 mt-0.5">
                  <GraduationCap size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-[#8696A0] uppercase tracking-wider">
                    Role & Affiliation
                  </p>
                  <p className="text-sm font-bold text-[#111111] mt-0.5">{roleTitle}</p>
                  {teacherSubjects && teacherSubjects.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {teacherSubjects.map((subj) => (
                        <span
                          key={subj}
                          className="px-2 py-0.5 rounded-md bg-[#F4C430]/20 text-[#855D00] text-[11px] font-medium"
                        >
                          {subj}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px bg-[#F0F0F0]" />

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#F0F2F5] flex items-center justify-center text-[#54656F] shrink-0 mt-0.5">
                  <Mail size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-[#8696A0] uppercase tracking-wider">
                    Official Contact
                  </p>
                  <p className="text-xs sm:text-sm text-[#111111] font-mono mt-0.5 select-all">
                    {(contact as any).email || contact.phone || 'scholario.portal/academic'}
                  </p>
                </div>
              </div>
            </div>

            {/* Media, Links and Docs shortcut */}
            <div className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMedia?.();
                }}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#F9F9F9] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <ImageIcon size={18} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-[#111111]">
                      Media, links and docs
                    </p>
                    <p className="text-[11px] text-[#8696A0]">
                      {mediaCount > 0 ? `${mediaCount} shared items` : 'Photos, documents & files'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[#8696A0]">
                  <span className="text-xs font-semibold text-[#111111]">{mediaCount}</span>
                  <ChevronRight size={16} />
                </div>
              </button>
            </div>

            {/* Notifications & Settings */}
            <div className="bg-white rounded-xl border border-[#E5E5E5] divide-y divide-[#F0F0F0] overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={onToggleMute}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#F9F9F9] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isMuted
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-[#F0F2F5] text-[#54656F]'
                    }`}
                  >
                    {isMuted ? <BellOff size={18} /> : <Bell size={18} />}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-[#111111]">
                      Mute notifications
                    </p>
                    <p className="text-[11px] text-[#8696A0]">
                      {isMuted ? 'Muted for this chat' : 'Show sound and popup alerts'}
                    </p>
                  </div>
                </div>
                <div
                  className={`w-10 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                    isMuted ? 'bg-[#25D366]' : 'bg-[#D1D5DB]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform ${
                      isMuted ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </button>

              <div className="px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Lock size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-[#111111]">
                    End-to-end encryption
                  </p>
                  <p className="text-[11px] text-[#8696A0]">
                    Messages and calls are secured with end-to-end encryption.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
