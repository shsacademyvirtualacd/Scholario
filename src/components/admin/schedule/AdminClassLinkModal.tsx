import React, { useState, useEffect } from 'react';
import {
  X,
  Video,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Loader2,
  Bell,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../features/auth/AuthContext';
import { adminOverrideClassLink, getSessionLink, deleteSessionLink } from '../../../lib/db';
import { formatTime12h, getPKTNow, getClosestDateForDayOfWeek } from '../../../lib/scheduleUtils';
import type { ClassSlot, ClassSessionLink, Teacher } from '../../../types';

interface AdminClassLinkModalProps {
  open: boolean;
  onClose: () => void;
  slot: (ClassSlot & {
    streamName?: string;
    offering?: {
      id?: string;
      class_id?: string;
      stream_id?: string | null;
      subject_name?: string;
      subject?: string;
      board?: string;
      grade?: string;
      teacher_id?: string;
      teacher?: { id?: string; full_name?: string; email?: string };
    };
  }) | null;
  teachers: Teacher[];
  onLinkUpdated?: (result: { sessionLink?: ClassSessionLink; slot?: ClassSlot; linkUrl: string | null }) => void;
}

export const AdminClassLinkModal: React.FC<AdminClassLinkModalProps> = ({
  open,
  onClose,
  slot,
  teachers,
  onLinkUpdated,
}) => {
  const { user } = useAuth();
  const pktnow = getPKTNow();

  const [sessionDate, setSessionDate] = useState<string>('');
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [substituteTeacherId, setSubstituteTeacherId] = useState<string>('');
  const [applyScope, setApplyScope] = useState<'both' | 'session_only' | 'slot_default'>('both');
  const [notifyStudents, setNotifyStudents] = useState<boolean>(true);

  const [isLoadingSessionLink, setIsLoadingSessionLink] = useState(false);
  const [existingSessionLink, setExistingSessionLink] = useState<ClassSessionLink | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Compute default session date for the slot
  useEffect(() => {
    if (!open || !slot) return;

    const defaultDate = slot.day_of_week === pktnow.dayIndex
      ? pktnow.dateString
      : getClosestDateForDayOfWeek(slot.day_of_week ?? 0, pktnow);

    setSessionDate(defaultDate);
    setSubstituteTeacherId(slot.substitute_teacher_id || '');
  }, [open, slot?.id, slot?.day_of_week]);

  // Fetch existing session link whenever slot or sessionDate changes
  useEffect(() => {
    if (!open || !slot?.id || !sessionDate) return;

    let isMounted = true;
    setIsLoadingSessionLink(true);

    getSessionLink(slot.id, sessionDate)
      .then((rec) => {
        if (!isMounted) return;
        setExistingSessionLink(rec);
        // Pre-fill link input: prioritize session-specific link, fallback to recurring slot link
        const currentEffective = rec?.link_url || slot.room_or_link || '';
        setLinkUrl(currentEffective);
        if (rec?.substitute_teacher_id) {
          setSubstituteTeacherId(rec.substitute_teacher_id);
        } else if (slot.substitute_teacher_id) {
          setSubstituteTeacherId(slot.substitute_teacher_id);
        } else {
          setSubstituteTeacherId('');
        }
      })
      .catch((err) => {
        console.warn('[AdminClassLinkModal] fetch session link error:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingSessionLink(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, slot?.id, sessionDate]);

  if (!open || !slot) return null;

  const subject = slot.custom_title || slot.offering?.subject_name || slot.offering?.subject || 'Class Session';
  const assignedTeacher = slot.offering?.teacher?.full_name || 'Assigned Teacher';
  const effectiveLink = (linkUrl || '').trim();

  // Audit trail extraction
  const activeAuditRole = existingSessionLink?.link_updated_by_role || slot.link_updated_by_role || (existingSessionLink?.created_by ? 'teacher' : null);
  const activeAuditTimestamp = existingSessionLink?.link_updated_at || slot.link_updated_at || existingSessionLink?.created_at;
  const activeSubstituteName = existingSessionLink?.substitute_teacher_name || slot.substitute_teacher_name;

  const formatTimestamp = (ts?: string | null) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return ts;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slot.id) return;

    const trimmedLink = linkUrl.trim();
    if (trimmedLink && !trimmedLink.startsWith('http://') && !trimmedLink.startsWith('https://')) {
      toast.error('Please enter a valid URL starting with https:// or http://');
      return;
    }

    setIsSaving(true);
    try {
      const substituteTeacher = teachers.find((t) => t.id === substituteTeacherId);
      const substituteTeacherName = substituteTeacher?.full_name || null;

      const res = await adminOverrideClassLink({
        slotId: slot.id,
        sessionDate,
        linkUrl: trimmedLink,
        applyToSessionDate: applyScope === 'both' || applyScope === 'session_only',
        applyToRecurringSlot: applyScope === 'both' || applyScope === 'slot_default',
        offeringId: slot.offering_id || slot.offering?.id,
        adminProfileId: user?.id,
        substituteTeacherId: substituteTeacherId || null,
        substituteTeacherName,
        notifyStudents: notifyStudents && Boolean(trimmedLink),
        subjectName: subject,
        slotTimeDisplay: `${formatTime12h(slot.start_time)} – ${formatTime12h(slot.end_time)}`,
        classId: slot.class_id || slot.offering?.class_id,
        streamId: slot.stream_id || slot.offering?.stream_id,
      });

      toast.success(
        trimmedLink
          ? `Class link ${substituteTeacherName ? `and substitute (${substituteTeacherName})` : ''} saved!`
          : 'Class link removed successfully.'
      );

      onLinkUpdated?.({
        sessionLink: res.sessionLink,
        slot: res.slot,
        linkUrl: trimmedLink || null,
      });

      onClose();
    } catch (err: any) {
      console.error('[AdminClassLinkModal] save error:', err);
      toast.error(err.message || 'Failed to update class link.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearLink = async () => {
    if (!slot.id) return;
    setIsRemoving(true);
    try {
      // Clear session link for this date
      await deleteSessionLink(slot.id, sessionDate);

      // Clear recurring slot link if in both or slot_default scope
      if (applyScope === 'both' || applyScope === 'slot_default') {
        await adminOverrideClassLink({
          slotId: slot.id,
          sessionDate,
          linkUrl: '',
          applyToSessionDate: true,
          applyToRecurringSlot: true,
          offeringId: slot.offering_id,
          adminProfileId: user?.id,
          notifyStudents: false,
        });
      }

      setLinkUrl('');
      setExistingSessionLink(null);
      toast.success('Class meeting link has been cleared.');

      onLinkUpdated?.({
        linkUrl: null,
      });
      onClose();
    } catch (err: any) {
      console.error('[AdminClassLinkModal] clear link error:', err);
      toast.error('Failed to clear class link.');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-white border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F4C430] text-[#111111] flex items-center justify-center shadow-xs">
              <Video size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[#111111] tracking-tight">
                  Class Link &amp; Teacher Substitution
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck size={11} /> Admin Access
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Add, override or substitute teacher link on behalf of staff.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5">
          {/* Class & Teacher Details Card */}
          <div className="p-3.5 bg-gray-50 border border-gray-200/80 rounded-xl space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-black text-[#111111] uppercase tracking-wide block">
                  {subject}
                </span>
                <span className="text-[11px] font-bold text-gray-600 block mt-0.5">
                  Assigned Teacher: <strong className="text-gray-900">{assignedTeacher}</strong>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-gray-700 bg-white border border-gray-200 px-2 py-0.5 rounded-md inline-block">
                  {formatTime12h(slot.start_time)} – {formatTime12h(slot.end_time)}
                </span>
                {slot.streamName && (
                  <span className="text-[10px] font-extrabold text-purple-700 block mt-1">
                    Stream: {slot.streamName}
                  </span>
                )}
              </div>
            </div>

            {/* Audit Trail Banner */}
            <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-gray-600">
                <Clock size={12} className="text-gray-400 shrink-0" />
                {activeAuditRole === 'admin' ? (
                  <span>
                    <strong className="text-amber-700 font-extrabold">Admin Override:</strong>{' '}
                    Updated {activeAuditTimestamp ? formatTimestamp(activeAuditTimestamp) : 'recently'}
                    {activeSubstituteName && ` • Substitute: ${activeSubstituteName}`}
                  </span>
                ) : activeAuditRole === 'teacher' ? (
                  <span>
                    <strong className="text-blue-700 font-bold">Teacher Set:</strong>{' '}
                    Updated {activeAuditTimestamp ? formatTimestamp(activeAuditTimestamp) : 'recently'}
                  </span>
                ) : slot.room_or_link ? (
                  <span>
                    <strong className="text-gray-700 font-bold">Default Slot Link:</strong> Set in schedule
                  </span>
                ) : (
                  <span className="text-amber-800 font-semibold flex items-center gap-1">
                    <AlertCircle size={12} className="text-amber-600" />
                    No live link currently set for this class
                  </span>
                )}
              </div>

              {effectiveLink && (
                <a
                  href={effectiveLink.startsWith('http') ? effectiveLink : `https://${effectiveLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <span>Test Link</span>
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>

          {/* Session Date Target */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Calendar size={13} className="text-gray-500" />
                <span>Session Date (Target Instance)</span>
              </label>
              {sessionDate === pktnow.dateString && (
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Today's Session
                </span>
              )}
            </div>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white"
            />
          </div>

          {/* Meeting Link URL Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Video size={13} className="text-gray-500" />
                <span>Meeting Link URL (Zoom / Google Meet / Teams)</span>
              </span>
              {isLoadingSessionLink && (
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Loader2 size={11} className="animate-spin" /> Loading...
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="https://meet.google.com/xyz-abc or https://zoom.us/j/..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full text-xs font-medium pl-3 pr-20 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white shadow-2xs"
                autoFocus
              />
              {linkUrl && (
                <button
                  type="button"
                  onClick={() => setLinkUrl('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 text-[11px] font-bold"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-[11px] text-gray-500">
              Entering a link here directly overrides any teacher link and activates this session for students immediately.
            </p>
          </div>

          {/* Substitute Teacher Selector */}
          <div className="space-y-1.5 p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl">
            <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <UserCheck size={13} className="text-amber-700" />
              <span>Substitute Teacher (Optional)</span>
            </label>
            <select
              value={substituteTeacherId}
              onChange={(e) => setSubstituteTeacherId(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 border border-amber-300 rounded-xl bg-white focus:outline-none focus:border-amber-500 text-gray-800"
            >
              <option value="">No substitute — keep assigned teacher ({assignedTeacher})</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  Substitute: {t.full_name} ({t.email})
                </option>
              ))}
            </select>
            {substituteTeacherId && (
              <p className="text-[11px] text-amber-900 font-medium pt-1">
                ⭐ <strong className="font-bold">Substitute noted:</strong> Students will see that this session is being conducted by{' '}
                {teachers.find((t) => t.id === substituteTeacherId)?.full_name}.
              </p>
            )}
          </div>

          {/* Update Scope */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-900 block">
              Application Scope
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label
                className={`p-2.5 border rounded-xl flex items-start gap-2 cursor-pointer transition-all ${
                  applyScope === 'both'
                    ? 'border-amber-500 bg-amber-50/60 text-amber-950 font-bold'
                    : 'border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="applyScope"
                  value="both"
                  checked={applyScope === 'both'}
                  onChange={() => setApplyScope('both')}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div className="text-[11px] leading-tight">
                  <span className="block font-black">Both (Recommended)</span>
                  <span className="text-[10px] text-gray-500 mt-0.5 block">
                    Today &amp; Recurring slot
                  </span>
                </div>
              </label>

              <label
                className={`p-2.5 border rounded-xl flex items-start gap-2 cursor-pointer transition-all ${
                  applyScope === 'session_only'
                    ? 'border-amber-500 bg-amber-50/60 text-amber-950 font-bold'
                    : 'border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="applyScope"
                  value="session_only"
                  checked={applyScope === 'session_only'}
                  onChange={() => setApplyScope('session_only')}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div className="text-[11px] leading-tight">
                  <span className="block font-black">This Session Only</span>
                  <span className="text-[10px] text-gray-500 mt-0.5 block">
                    Only for {sessionDate}
                  </span>
                </div>
              </label>

              <label
                className={`p-2.5 border rounded-xl flex items-start gap-2 cursor-pointer transition-all ${
                  applyScope === 'slot_default'
                    ? 'border-amber-500 bg-amber-50/60 text-amber-950 font-bold'
                    : 'border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="applyScope"
                  value="slot_default"
                  checked={applyScope === 'slot_default'}
                  onChange={() => setApplyScope('slot_default')}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div className="text-[11px] leading-tight">
                  <span className="block font-black">Recurring Default</span>
                  <span className="text-[10px] text-gray-500 mt-0.5 block">
                    Slot default for all weeks
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Student Notification Toggle */}
          <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl flex items-start gap-3">
            <input
              type="checkbox"
              id="notifyStudents"
              checked={notifyStudents}
              onChange={(e) => setNotifyStudents(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="notifyStudents" className="text-xs text-blue-950 cursor-pointer">
              <span className="font-extrabold flex items-center gap-1">
                <Bell size={12} className="text-blue-600" />
                Notify enrolled students immediately
              </span>
              <span className="text-[11px] text-blue-800 block mt-0.5">
                Sends an instant in-app announcement &amp; notification to all students in this class with the updated meeting link and substitute teacher details.
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
            {effectiveLink ? (
              <button
                type="button"
                onClick={handleClearLink}
                disabled={isRemoving || isSaving}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isRemoving ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                <span>Clear Link</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving || isRemoving}
                className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isRemoving}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-black text-[#111111] bg-[#F4C430] hover:bg-[#E5B520] rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>Save &amp; Override Link</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminClassLinkModal;
