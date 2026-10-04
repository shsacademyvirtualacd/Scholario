/**
 * MultiClassLiveCard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Autonomous, independent per-class card for the Student Dashboard.
 *
 * Requirements:
 * 1. Independent: Joining or marking attendance for this class does not affect any other card.
 * 2. 4 Specific States:
 *    - Upcoming (not started): Live countdown timer (e.g. "Starts in 1h 24m 10s") instead of Join button.
 *    - Time reached, link available: "Join Now" button is green and clickable.
 *    - Time reached, no link: Button is gray, disabled, "Waiting for teacher to add link".
 *    - Finished: Visually muted, marked as completed, displays recorded attendance status.
 * 3. Highlights: Visually highlighted with a subtle accent / ring if it's currently live or next upcoming.
 * 4. Automatic updates: Supabase realtime listener for class_session_links and 1-second live countdown ticker.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import {
  Video,
  Clock,
  CheckCircle2,
  XCircle,
  Zap,
  Check,
  ExternalLink,
  Hourglass,
} from 'lucide-react';
import {
  getPKTNow,
  timeStrToMins,
  formatTime12h,
  calcDuration,
  formatCountdownPrecise,
  getSlotSubject,
} from '../../lib/scheduleUtils';
import { markStudentSelfAttendance, getSessionLink } from '../../lib/db';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import type { ClassSlot, Attendance } from '../../types';

interface MultiClassLiveCardProps {
  slot: ClassSlot;
  studentId: string;
  sessionDate: string; // YYYY-MM-DD in PKT
  initialAttendance?: Attendance | null;
  onAttendanceMarked?: (slotId: string, record: Attendance) => void;
  isNextOrLive?: boolean;
}

export const MultiClassLiveCard: React.FC<MultiClassLiveCardProps> = ({
  slot,
  studentId,
  sessionDate,
  initialAttendance,
  onAttendanceMarked,
  isNextOrLive = false,
}) => {
  // 1-second precision PKT timer for live countdowns
  const [pktnow, setPktnow] = useState(getPKTNow);
  const [sessionLinkUrl, setSessionLinkUrl] = useState<string | null>(null);
  const [isMarking, setIsMarking] = useState(false);
  const [localAttendance, setLocalAttendance] = useState<Attendance | null>(initialAttendance || null);

  useEffect(() => {
    setLocalAttendance(initialAttendance || null);
  }, [initialAttendance]);

  // Tick every second for smooth "Starts in Xh Ym Zs"
  useEffect(() => {
    const timer = setInterval(() => {
      setPktnow(getPKTNow());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch session-specific link (or fallback to slot room_or_link)
  const fetchLink = async () => {
    if (!slot?.id || !sessionDate) {
      return;
    }
    try {
      const rec = await getSessionLink(slot.id, sessionDate);
      setSessionLinkUrl(rec?.link_url || null);
    } catch (err) {
      console.warn('[MultiClassLiveCard] Link fetch error:', err);
    }
  };

  useEffect(() => {
    fetchLink();
  }, [slot?.id, sessionDate]);

  // Realtime updates if teacher adds or updates link for this specific slot
  useRealtimeTable({
    table: 'class_session_links',
    filter: slot?.id ? `slot_id=eq.${slot.id}` : undefined,
    debounceMs: 1500,
    onAny: fetchLink,
  });

  const subject = getSlotSubject(slot);
  const teacherName = slot.offering?.teacher?.full_name || 'Faculty Instructor';
  const gradeLabel = slot.offering?.grade || (slot.offering as any)?.class?.grade || '';
  const boardLabel = String(
    slot.offering?.board ||
    (slot.offering as any)?.class?.board?.name ||
    (slot.offering as any)?.board_name ||
    ''
  ).toUpperCase();

  const startMins = slot.start_time ? timeStrToMins(slot.start_time) : 0;
  const endMins = slot.end_time ? timeStrToMins(slot.end_time) : startMins + 60;

  // Effective link: session specific link takes priority over recurring slot link
  const effectiveLink = (sessionLinkUrl && sessionLinkUrl.trim().length > 0)
    ? sessionLinkUrl.trim()
    : (slot.room_or_link && slot.room_or_link.trim().length > 0 ? slot.room_or_link.trim() : null);

  const hasLink = Boolean(effectiveLink);
  const targetUrl = effectiveLink
    ? (effectiveLink.startsWith('http://') || effectiveLink.startsWith('https://')
        ? effectiveLink
        : `https://${effectiveLink}`)
    : '';

  // Determine slot timeline state:
  const isToday = sessionDate === pktnow.dateString;
  const isPastDate = sessionDate < pktnow.dateString;
  const isFutureDate = sessionDate > pktnow.dateString;

  const currentTotalSec = pktnow.totalMins * 60 + (pktnow.second || 0);
  const targetStartSec = startMins * 60;
  const targetEndSec = endMins * 60;

  const isOngoing = isToday && currentTotalSec >= targetStartSec && currentTotalSec < targetEndSec;
  const isFinished = isPastDate || (isToday && currentTotalSec >= targetEndSec);
  const isUpcoming = isFutureDate || (isToday && currentTotalSec < targetStartSec);

  // Time calculations
  const secsUntilStart = isToday ? targetStartSec - currentTotalSec : 999999;
  const minsUntilStart = Math.floor(secsUntilStart / 60);
  const minsRemaining = isOngoing ? Math.max(0, Math.ceil((targetEndSec - currentTotalSec) / 60)) : 0;

  // Mark attendance handler
  const handleMarkAttendance = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!studentId || !isOngoing || isMarking) return;
    setIsMarking(true);
    try {
      const rec = await markStudentSelfAttendance(studentId, slot.id, sessionDate);
      setLocalAttendance(rec);
      onAttendanceMarked?.(slot.id, rec);
    } catch (err) {
      console.error('[MultiClassLiveCard] Failed to mark attendance:', err);
      const fallbackRec: Attendance = {
        id: `att-${Date.now()}`,
        student_id: studentId,
        slot_id: slot.id,
        session_date: sessionDate,
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

  const handleJoinClick = (e: React.MouseEvent) => {
    // If student has not marked attendance, auto-claim in the background
    if (isOngoing && (!localAttendance || localAttendance.status === 'absent')) {
      handleMarkAttendance(e);
    }
  };

  // Color mapping based on subject
  const getSubjectBorderColor = (sub: string) => {
    const s = sub.toLowerCase();
    if (s.includes('math')) return '#F4C430';
    if (s.includes('phys')) return '#3B82F6';
    if (s.includes('chem')) return '#10B981';
    if (s.includes('bio')) return '#14B8A6';
    if (s.includes('comp')) return '#8B5CF6';
    if (s.includes('eng')) return '#EC4899';
    if (s.includes('urdu')) return '#F97316';
    if (s.includes('islam')) return '#059669';
    return '#E5E5E5';
  };

  const subjectBorder = getSubjectBorderColor(subject);

  return (
    <div
      className={`stat-card relative flex flex-col justify-between p-4.5 rounded-2xl border transition-all duration-200 ${
        isFinished
          ? 'bg-[#FAFAFA] border-[#E5E5E5] opacity-75 grayscale-[20%]'
          : isOngoing
          ? 'bg-white border-emerald-400 ring-2 ring-emerald-400/20 shadow-md'
          : isNextOrLive
          ? 'bg-[#FFFEF9] border-[#F4C430] ring-2 ring-[#F4C430]/20 shadow-sm'
          : 'bg-white border-[#E5E5E5] hover:border-[#D4D4D4] shadow-xs'
      }`}
      style={{
        borderLeftWidth: '5px',
        borderLeftColor: isFinished ? '#A3A3A3' : isOngoing ? '#22C55E' : subjectBorder,
      }}
    >
      {/* Top Header: Subject + Status Badge */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-base text-[#111111] tracking-tight truncate">
                {subject}
              </span>
              {gradeLabel && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-[#525252]">
                  Gr. {gradeLabel}
                </span>
              )}
              {boardLabel && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  {boardLabel}
                </span>
              )}
            </div>
            <p className="text-xs text-[#737373] font-medium truncate mt-0.5">
              {teacherName}
            </p>
          </div>

          {/* Top Badge: Live / Completed / Starting / Countdown */}
          <div className="shrink-0">
            {isOngoing ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full animate-pulse shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping inline-block" />
                Live Now
              </span>
            ) : isFinished ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                <Check size={11} className="text-gray-500" /> Finished
              </span>
            ) : minsUntilStart <= 10 && minsUntilStart > 0 ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md animate-pulse">
                <Zap size={11} className="text-amber-600" /> Starting Soon
              </span>
            ) : isNextOrLive ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#111111] bg-[#F4C430]/30 border border-[#F4C430] px-2 py-0.5 rounded-md">
                Next Up
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#737373] bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                Scheduled
              </span>
            )}
          </div>
        </div>

        {/* Timetable Timing */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#F5F5F5] text-xs font-semibold text-[#525252]">
          <Clock size={13} className={isOngoing ? 'text-emerald-500' : 'text-[#A3A3A3]'} />
          <span className="text-[#111111] font-bold">
            {formatTime12h(slot.start_time)} – {formatTime12h(slot.end_time)}
          </span>
          <span className="text-[#A3A3A3]">·</span>
          <span className="text-[11px] text-[#737373]">
            {calcDuration(slot.start_time, slot.end_time) || '1 hour'}
          </span>
          {isOngoing && (
            <span className="text-[10px] text-emerald-700 font-bold ml-auto bg-emerald-50 px-2 py-0.5 rounded">
              {minsRemaining}m remaining
            </span>
          )}
        </div>
      </div>

      {/* Middle & Actions Area */}
      <div className="mt-3.5 space-y-2">
        {/* Attendance status banner if marked, or Mark My Attendance button */}
        {(() => {
          if (localAttendance?.status === 'pending') {
            return (
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 py-1.5 px-2.5 rounded-lg shadow-2xs">
                <span className="flex items-center gap-1.5">
                  <Clock size={12} className="text-amber-600 animate-spin" />
                  Awaiting Teacher Approval
                </span>
                <span className="text-[10px] font-medium text-amber-700">Claimed</span>
              </div>
            );
          }

          if (localAttendance?.status === 'present' || localAttendance?.status === 'late') {
            const timeStr = localAttendance.marked_at
              ? new Date(localAttendance.marked_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
              : '';
            return (
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 py-1.5 px-2.5 rounded-lg shadow-2xs">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                  <span>{localAttendance.status === 'late' ? 'Marked Late' : 'Present'}</span>
                </span>
                {timeStr && <span className="text-[10px] text-emerald-700 font-normal">at {timeStr}</span>}
              </div>
            );
          }

          if (localAttendance?.status === 'absent' && (localAttendance.marked_by === 'teacher' || localAttendance.marked_by === 'admin')) {
            return (
              <div className="flex items-center justify-between text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 py-1.5 px-2.5 rounded-lg shadow-2xs">
                <span className="flex items-center gap-1.5">
                  <XCircle size={12} className="text-rose-600 shrink-0" />
                  <span>Marked Absent</span>
                </span>
              </div>
            );
          }

          // If session is finished and student was not marked present
          if (isFinished) {
            return (
              <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 py-1.5 px-2.5 rounded-lg">
                <span className="flex items-center gap-1.5">
                  <Clock size={12} className="text-gray-400 shrink-0" />
                  <span>Not Marked</span>
                </span>
                <span className="text-[10px] text-gray-400">Class ended</span>
              </div>
            );
          }

          // Not yet marked and class is upcoming or ongoing:
          return (
            <button
              onClick={handleMarkAttendance}
              disabled={!isOngoing || isMarking}
              className={`flex items-center justify-center gap-1.5 w-full text-xs font-bold py-1.5 px-2.5 rounded-lg transition-all shadow-xs ${
                isOngoing
                  ? 'bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] cursor-pointer interactive'
                  : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-75'
              }`}
              title={
                isOngoing
                  ? 'Mark your attendance for this class session'
                  : 'Mark My Attendance is enabled only while this class is ongoing'
              }
            >
              <CheckCircle2 size={13} className={isOngoing ? 'text-[#111111]' : 'text-gray-400'} />
              <span>{isMarking ? 'Submitting...' : 'Mark My Attendance'}</span>
            </button>
          );
        })()}

        {/* ── State 1: Upcoming (not started) ── */}
        {/* Shows live countdown (e.g. "Starts in 1h 24m 10s") instead of Join button */}
        {isUpcoming && (
          <div className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs font-bold shadow-2xs">
            <Hourglass size={13} className="text-amber-600 animate-spin" />
            <span>Starts in {formatCountdownPrecise(slot.start_time, pktnow)}</span>
          </div>
        )}

        {/* ── State 2: Time reached, link available ── */}
        {/* Join Now button is green and clickable */}
        {isOngoing && hasLink && (
          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleJoinClick}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-extrabold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer interactive"
            title={`Join Live Class on Zoom/Meet: ${targetUrl}`}
          >
            <Video size={14} className="shrink-0" />
            <span>Join Now</span>
            <ExternalLink size={12} className="opacity-70 ml-0.5" />
          </a>
        )}

        {/* ── State 3: Time reached, no link ── */}
        {/* Button is gray and disabled with "Waiting for teacher to add link" */}
        {isOngoing && !hasLink && (
          <button
            disabled
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-gray-100 border border-gray-300 text-gray-500 text-xs font-semibold cursor-not-allowed shadow-2xs"
            title="Class time has arrived, but the teacher has not uploaded the meeting link yet. It will automatically update here as soon as it is posted."
          >
            <Clock size={13} className="text-gray-400 shrink-0" />
            <span>Waiting for teacher to add link</span>
          </button>
        )}

        {/* ── State 4: Finished ── */}
        {/* Muted visually, completed state */}
        {isFinished && (
          <div className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2.5 rounded-lg bg-gray-100 text-gray-400 text-[11px] font-medium border border-gray-200">
            <Check size={12} className="text-gray-400" />
            <span>Class Completed</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiClassLiveCard;
