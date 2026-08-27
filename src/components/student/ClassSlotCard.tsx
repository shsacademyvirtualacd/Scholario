import React, { useState, useEffect } from 'react';
import { Video, VideoOff, Clock, Lock, CheckCircle2, Check, XCircle, X } from 'lucide-react';
import StatusPill from '../ui/StatusPill';
import { calcDuration, formatTime12h, getPKTNow, getLinkAvailabilityStatus, isSlotOngoing, getClosestDateForDayOfWeek } from '../../lib/scheduleUtils';
import { useAuth } from '../../features/auth/AuthContext';
import { markStudentSelfAttendance, getSessionLink } from '../../lib/db';
import { pageCache } from '../../lib/pageCache';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import type { Attendance, ClassSlot } from '../../types';

interface ClassSlotCardProps {
  slot: ClassSlot;
  sessionDate?: string;
  sessionLinkUrl?: string | null;
  attendanceRecord?: Attendance | null;
  onAttendanceMarked?: (slotId: string, record: Attendance) => void;
  isMarkedPresent?: boolean;
}

export const ClassSlotCard: React.FC<ClassSlotCardProps> = ({
  slot,
  sessionDate: propSessionDate,
  sessionLinkUrl: propSessionLinkUrl,
  attendanceRecord: propAttendance,
  onAttendanceMarked,
}) => {
  const { user } = useAuth();
  const [pktnow, setPktnow] = useState(getPKTNow);
  const [isMarking, setIsMarking] = useState(false);
  const [fetchedLink, setFetchedLink] = useState<string | null>(null);

  const effectiveSessionDate = propSessionDate || (
    slot.day_of_week === pktnow.dayIndex
      ? pktnow.dateString
      : getClosestDateForDayOfWeek(slot.day_of_week ?? 0, pktnow)
  );

  const fetchLink = async () => {
    if (propSessionLinkUrl !== undefined) return;
    if (!slot?.id || !effectiveSessionDate) return;
    try {
      const rec = await getSessionLink(slot.id, effectiveSessionDate);
      setFetchedLink(rec?.link_url || null);
    } catch (err) {
      console.warn('[ClassSlotCard] fetch link error:', err);
    }
  };

  useEffect(() => {
    fetchLink();
  }, [slot?.id, effectiveSessionDate, propSessionLinkUrl]);

  useRealtimeTable({
    table: 'class_session_links',
    debounceMs: 1000,
    onAny: fetchLink,
  });

  const rawEffectiveLink = propSessionLinkUrl !== undefined ? propSessionLinkUrl : (fetchedLink || slot?.room_or_link || null);
  const effectiveLink = (rawEffectiveLink && rawEffectiveLink.trim().length > 0) ? rawEffectiveLink.trim() : null;

  // Re-evaluate PKT clock and link availability every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setPktnow(getPKTNow());
    }, 5_000);
    return () => clearInterval(timer);
  }, []);

  // Look up attendance record for (student.id, slot.id, effectiveSessionDate)
  const getCachedOrPropAttendance = (): Attendance | null => {
    if (propAttendance !== undefined) return propAttendance;
    if (!user?.id) return null;
    const cachedAtt = pageCache.get<Attendance[]>('student_attendance', user.id);
    const found = cachedAtt?.find(
      a => a.slot_id === slot.id && a.session_date === effectiveSessionDate
    );
    return found || null;
  };

  const [localAttendance, setLocalAttendance] = useState<Attendance | null>(getCachedOrPropAttendance);

  useEffect(() => {
    if (propAttendance !== undefined) {
      setLocalAttendance(propAttendance);
    } else if (user?.id) {
      const cachedAtt = pageCache.get<Attendance[]>('student_attendance', user.id);
      const found = cachedAtt?.find(
        a => a.slot_id === slot.id && a.session_date === effectiveSessionDate
      );
      if (found) setLocalAttendance(found);
    }
  }, [propAttendance, slot.id, effectiveSessionDate, user?.id]);

  const isCancelled = slot.is_cancelled;
  const rawSubj = slot.custom_title || (slot.offering as any)?.subject_name || slot.offering?.subject || 'Class';
  const subject = typeof rawSubj === 'string' ? rawSubj : (rawSubj?.name || 'Class');
  const teacherName = slot.offering?.teacher?.full_name || 'Staff';

  // Duration computed from raw time strings — no Date objects, no TZ distortion
  const duration = calcDuration(slot.start_time, slot.end_time);

  // Color mappings
  const getSubjectColor = (sub: string) => {
    switch (sub.toLowerCase()) {
      case 'mathematics': return '#F4C430';
      case 'physics': return '#3b82f6';
      case 'chemistry': return '#10b981';
      default: return '#8b5cf6';
    }
  };

  const subjectColor = getSubjectColor(subject);

  // 10-minute timing restriction status
  const linkStatus = getLinkAvailabilityStatus(slot, pktnow, effectiveLink, effectiveSessionDate);
  const hasLink = Boolean(effectiveLink);
  const isOngoing = isSlotOngoing(slot, pktnow);

  const targetUrl = effectiveLink
    ? (effectiveLink.startsWith('http://') || effectiveLink.startsWith('https://')
        ? effectiveLink
        : `https://${effectiveLink}`)
    : '';

  const handleMarkAttendance = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user?.id || isCancelled || !isOngoing || isMarking) return;
    setIsMarking(true);
    try {
      const rec = await markStudentSelfAttendance(user.id, slot.id, effectiveSessionDate);
      setLocalAttendance(rec);
      onAttendanceMarked?.(slot.id, rec);
    } catch (err) {
      console.error('Failed to claim attendance:', err);
      // Optimistic fallback
      const fallbackRec: Attendance = {
        id: `att-${Date.now()}`,
        student_id: user.id,
        slot_id: slot.id,
        session_date: effectiveSessionDate,
        status: 'pending',
        marked_at: new Date().toISOString(),
        marked_by: 'student',
      };
      setLocalAttendance(fallbackRec);
      onAttendanceMarked?.(slot.id, fallbackRec);
    } finally {
      setIsMarking(false);
    }
  };

  const handleJoinClass = () => {
    if (isOngoing && (!localAttendance || localAttendance.status === 'absent')) {
      handleMarkAttendance();
    }
    if (targetUrl) {
      try {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      } catch (err) {
        console.warn('Window open fallback error:', err);
      }
    }
  };

  return (
    <div
      className={`bg-white border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 border-[#E5E5E5] hover:border-[#D4D4D4] hover:shadow-sm ${
        isCancelled ? 'opacity-60 bg-gray-50' : ''
      }`}
      style={{ borderLeft: isCancelled ? '4px solid #D4D4D4' : `4px solid ${subjectColor}` }}
    >
      {/* Time & Duration */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#737373] shrink-0">
          <Clock size={16} />
        </div>
        <div>
          <div className={`text-sm font-extrabold text-[#111111] ${isCancelled ? 'line-through' : ''}`}>
            {formatTime12h(slot.start_time)} – {formatTime12h(slot.end_time)}
          </div>
          {duration && (
            <span className="text-[10px] text-[#A3A3A3] font-bold">{duration}</span>
          )}
        </div>
      </div>

      {/* Class info */}
      <div className="flex-1 min-w-0 md:pl-4 md:border-l border-[#F5F5F5]">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className={`text-base font-extrabold text-[#111111] leading-tight truncate ${isCancelled ? 'line-through text-[#737373]' : ''}`}>
            {subject}
          </h3>
          {/* Status badge */}
          {localAttendance && !isCancelled && (
            localAttendance.status === 'pending' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 shrink-0">
                <Clock size={10} className="animate-spin text-amber-600" /> Awaiting Approval
              </span>
            ) : localAttendance.status === 'present' || localAttendance.status === 'late' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                <Check size={10} strokeWidth={3} /> {localAttendance.status === 'late' ? 'Late' : 'Present'}
              </span>
            ) : localAttendance.status === 'absent' && (localAttendance.marked_by === 'teacher' || localAttendance.marked_by === 'admin') ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 shrink-0">
                <X size={10} strokeWidth={3} /> Absent
              </span>
            ) : null
          )}
        </div>
        <p className="text-xs text-[#737373] mt-0.5 font-medium truncate">{teacherName}</p>
      </div>

      {/* Attendance & Join Actions */}
      <div className="flex items-center gap-3 shrink-0 justify-between md:justify-end flex-wrap sm:flex-nowrap">
        {/* Attendance Button / State Indicator */}
        {!isCancelled && (() => {
          if (localAttendance?.status === 'pending') {
            return (
              <button
                disabled
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 cursor-not-allowed shadow-xs"
                title="Your attendance claim has been submitted and is awaiting teacher approval"
              >
                <Clock size={13} className="text-amber-600 animate-pulse" />
                <span>Awaiting Teacher Approval</span>
              </button>
            );
          }

          if (localAttendance?.status === 'present' || localAttendance?.status === 'late') {
            const timeStr = localAttendance.marked_at
              ? new Date(localAttendance.marked_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
              : '';
            return (
              <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-xs">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>{timeStr ? `Attendance Confirmed (${timeStr})` : 'Attendance Confirmed'}</span>
              </div>
            );
          }

          if (localAttendance?.status === 'absent' && (localAttendance.marked_by === 'teacher' || localAttendance.marked_by === 'admin')) {
            return (
              <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 shadow-xs">
                <XCircle size={13} className="text-rose-600 shrink-0" />
                <span>Attendance Not Confirmed</span>
              </div>
            );
          }

          // No row / not yet clicked
          return (
            <button
              onClick={handleMarkAttendance}
              disabled={!isOngoing || isMarking}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-xs ${
                isOngoing
                  ? 'bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] cursor-pointer hover:scale-102 active:scale-98'
                  : 'bg-[#F4C430]/40 text-[#737373] border border-[#E5E5E5] cursor-not-allowed opacity-60'
              }`}
              title={
                isOngoing
                  ? 'Mark your attendance for this ongoing class session'
                  : 'Mark My Attendance is enabled only while class is in session'
              }
            >
              <CheckCircle2 size={13} className={isOngoing ? 'text-[#111111]' : 'text-[#737373]'} />
              <span>{isMarking ? 'Submitting...' : 'Mark My Attendance'}</span>
            </button>
          );
        })()}

        {/* Location / Join links with 10m timing restriction */}
        {linkStatus.isAvailable && targetUrl ? (
          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleJoinClass}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white transition-all shadow-xs hover:scale-105 interactive cursor-pointer"
            title={`Open live class: ${targetUrl}`}
          >
            <Video size={13} className="text-white" />
            <span>Join Class</span>
          </a>
        ) : linkStatus.status === 'locked' ? (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border bg-amber-50 border-amber-200 text-amber-700" title="Link opens 10 minutes before class start time">
            <Lock size={12} className="text-amber-600 shrink-0" />
            <span className="truncate max-w-[140px]">{linkStatus.message}</span>
          </div>
        ) : linkStatus.status === 'ended' ? (
          <div className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border bg-gray-100 border-gray-200 text-gray-500">
            <Clock size={12} className="text-gray-400 shrink-0" />
            <span>Session Ended</span>
          </div>
        ) : !hasLink ? (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-dashed border-amber-200 bg-amber-50/70 text-amber-800" title="The teacher has not added a live class link for this session yet">
            <VideoOff size={12} className="text-amber-600 shrink-0" />
            <span className="truncate max-w-[150px]">Class link not available yet</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border bg-gray-50 border-gray-200 text-gray-500" title="Link accessible 10 minutes before class">
            <Lock size={12} className="text-gray-400 shrink-0" />
            <span>Unlocks 10m before</span>
          </div>
        )}
        
        {/* Status Pill */}
        <StatusPill status={isCancelled ? 'cancelled' : 'upcoming'} />
      </div>
    </div>
  );
};

export default ClassSlotCard;
