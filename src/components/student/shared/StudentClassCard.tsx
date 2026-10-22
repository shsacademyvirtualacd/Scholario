import React, { useState, useEffect } from 'react';
import {
  Video,
  VideoOff,
  Clock,
  Lock,
  CheckCircle2,
  XCircle,
  Play,
  Calendar,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  getPKTNow,
  timeStrToMins,
  formatTime12h,
  calcDuration,
  getSlotSubject,
  getClosestDateForDayOfWeek,
} from '../../../lib/scheduleUtils';
import { getSubjectCardClasses } from '../../../lib/scheduleCardTheme';
import { markStudentSelfAttendance, getSessionLink } from '../../../lib/db';
import { useRealtimeTable } from '../../../hooks/useRealtimeTable';
import type { ClassSlot, Attendance } from '../../../types';
import { formatProperName, formatBoardLabel } from '../../../utils/studentFormatting';

interface StudentClassCardProps {
  slot: ClassSlot;
  studentId: string;
  sessionDate?: string; // YYYY-MM-DD
  attendanceRecord?: Attendance | null;
  onAttendanceMarked?: (slotId: string, record: Attendance) => void;
  isNextOrLive?: boolean;
}

export const StudentClassCard: React.FC<StudentClassCardProps> = ({
  slot,
  studentId,
  sessionDate: propSessionDate,
  attendanceRecord: initialAttendance,
  onAttendanceMarked,
  isNextOrLive = false,
}) => {
  const [pktnow, setPktnow] = useState(getPKTNow);
  const [sessionLinkUrl, setSessionLinkUrl] = useState<string | null>(null);
  const [substituteTeacher, setSubstituteTeacher] = useState<string | null>(null);
  const [isMarking, setIsMarking] = useState(false);
  const [localAttendance, setLocalAttendance] = useState<Attendance | null>(initialAttendance || null);

  const effectiveSessionDate = propSessionDate || (
    slot.day_of_week === pktnow.dayIndex
      ? pktnow.dateString
      : getClosestDateForDayOfWeek(slot.day_of_week ?? 0, pktnow)
  );

  useEffect(() => {
    setLocalAttendance(initialAttendance || null);
  }, [initialAttendance]);

  // Fetch session-specific link & substitute teacher
  const fetchLink = async () => {
    if (!slot?.id || !effectiveSessionDate) return;
    try {
      const rec = await getSessionLink(slot.id, effectiveSessionDate, slot.offering_id);
      setSessionLinkUrl(rec?.link_url || null);
      setSubstituteTeacher(rec?.substitute_teacher_name || slot.substitute_teacher_name || null);
    } catch (err) {
      console.warn('[StudentClassCard] Link fetch error:', err);
    }
  };

  useEffect(() => {
    fetchLink();
    const pollInterval = setInterval(fetchLink, 20_000);
    return () => clearInterval(pollInterval);
  }, [slot?.id, slot?.offering_id, effectiveSessionDate]);

  useRealtimeTable({
    table: 'class_session_links',
    debounceMs: 500,
    onAny: fetchLink,
  });

  useRealtimeTable({
    table: 'live_sessions',
    debounceMs: 500,
    onAny: fetchLink,
  });

  const rawLink = sessionLinkUrl || slot.room_or_link || null;
  const effectiveLink = rawLink && rawLink.trim().length > 0 ? rawLink.trim() : null;
  const targetUrl = effectiveLink
    ? effectiveLink.startsWith('http://') || effectiveLink.startsWith('https://')
      ? effectiveLink
      : `https://${effectiveLink}`
    : '';

  const subject = getSlotSubject(slot);
  const rawTeacherName =
    substituteTeacher ||
    slot.offering?.teacher?.full_name ||
    (slot as any).teacher_name ||
    (slot.offering as any)?.teacher_name ||
    'Teacher not assigned';
  const teacherName = formatProperName(rawTeacherName);

  const rawGrade = slot.offering?.grade || (slot.offering as any)?.class?.grade || '';
  const cleanGrade = rawGrade.replace(/^grade\s+/i, '').trim();
  const rawBoard =
    slot.offering?.board ||
    (slot.offering as any)?.class?.board?.name ||
    (slot.offering as any)?.board_name ||
    '';
  const boardLabel = formatBoardLabel(rawBoard);

  const startMins = slot.start_time ? timeStrToMins(slot.start_time) : 0;
  const endMins = slot.end_time ? timeStrToMins(slot.end_time) : startMins + 60;

  const isToday = effectiveSessionDate === pktnow.dateString;
  const isPastDate = effectiveSessionDate < pktnow.dateString;
  const isFutureDate = effectiveSessionDate > pktnow.dateString;

  const currentTotalSec = pktnow.totalMins * 60 + (pktnow.second || 0);
  const targetStartSec = startMins * 60;
  const targetEndSec = endMins * 60;

  const isOngoing = isToday && currentTotalSec >= targetStartSec && currentTotalSec < targetEndSec;
  const isFinished = isPastDate || (isToday && currentTotalSec >= targetEndSec);
  const isUpcoming = isFutureDate || (isToday && currentTotalSec < targetStartSec);

  const secsUntilStart = isToday ? Math.max(0, targetStartSec - currentTotalSec) : 999999;
  const minsUntilStart = Math.floor(secsUntilStart / 60);

  // Ticker: update once a minute normally, or every 1 second in the last 10 minutes
  useEffect(() => {
    const isUnder10Min = isToday && minsUntilStart <= 10 && minsUntilStart >= 0;
    const intervalMs = isUnder10Min ? 1000 : 60_000;
    const timer = setInterval(() => {
      setPktnow(getPKTNow());
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isToday, minsUntilStart]);

  const handleMarkAttendance = async () => {
    if (!studentId || !isOngoing || isMarking) return;
    setIsMarking(true);
    try {
      const rec = await markStudentSelfAttendance(studentId, slot.id, effectiveSessionDate);
      setLocalAttendance(rec);
      onAttendanceMarked?.(slot.id, rec);
    } catch (err) {
      console.error('[StudentClassCard] Failed to mark attendance:', err);
      const fallbackRec: Attendance = {
        id: `att-${Date.now()}`,
        student_id: studentId,
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
        console.warn('Window open fallback:', err);
      }
    }
  };

  // Formatted countdown string
  const renderCountdown = () => {
    if (!isToday || isPastDate || isFinished) return null;
    if (minsUntilStart <= 10) {
      const mins = Math.floor(secsUntilStart / 60);
      const secs = secsUntilStart % 60;
      return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    }
    const hours = Math.floor(minsUntilStart / 60);
    const mins = minsUntilStart % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const theme = getSubjectCardClasses(subject);

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 border-l-[4px] flex flex-col justify-between gap-3.5 shadow-2xs ${
        isFinished
          ? 'bg-neutral-50 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 border-l-neutral-400 dark:border-l-neutral-600 opacity-80'
          : isOngoing
          ? 'bg-white dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-600/70 border-l-emerald-500 shadow-xs'
          : isNextOrLive
          ? 'bg-white dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60 border-l-amber-500 shadow-xs'
          : 'bg-white dark:bg-neutral-900 border-neutral-200/90 dark:border-neutral-800 border-l-amber-400'
      }`}
    >
      {/* Header Info */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white truncate">
              {subject}
            </h3>
            {cleanGrade && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                Grade {cleanGrade}
              </span>
            )}
            {boardLabel && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                {boardLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 truncate">
            <span>{teacherName}</span>
            {substituteTeacher && (
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/50 px-1.5 py-0.2 rounded">
                Substitute
              </span>
            )}
          </div>
        </div>

        {/* Status Pill */}
        <div className="shrink-0">
          {isOngoing ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Live Now
            </span>
          ) : isFinished ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full border border-neutral-200 dark:border-neutral-700">
              <Clock size={12} />
              Ended
            </span>
          ) : isNextOrLive ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-800">
              Next Up
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full border border-neutral-200 dark:border-neutral-700">
              Scheduled
            </span>
          )}
        </div>
      </div>

      {/* Class Timing */}
      <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-xs text-neutral-600 dark:text-neutral-400">
        <Clock size={14} className={isOngoing ? 'text-emerald-500' : 'text-neutral-400'} />
        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
          {formatTime12h(slot.start_time)} – {formatTime12h(slot.end_time)}
        </span>
        <span>•</span>
        <span>{calcDuration(slot.start_time, slot.end_time) || '1 hr'}</span>
      </div>

      {/* Single State Action / Badge Slot */}
      <div className="pt-1">
        {/* State 1: Finished */}
        {isFinished && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-xs">
            {localAttendance?.status === 'present' || localAttendance?.status === 'late' ? (
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={15} />
                Attended ({localAttendance.status === 'late' ? 'Late' : 'Present'})
              </span>
            ) : localAttendance?.status === 'absent' && (localAttendance.marked_by === 'teacher' || localAttendance.marked_by === 'admin') ? (
              <span className="inline-flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                <XCircle size={15} />
                Missed (Absent)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-medium text-neutral-500 dark:text-neutral-400">
                <Clock size={15} />
                Class Ended
              </span>
            )}
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Session closed</span>
          </div>
        )}

        {/* State 2: Ongoing */}
        {isOngoing && (
          <div>
            {effectiveLink ? (
              <button
                type="button"
                onClick={handleJoinClass}
                className="min-h-[44px] min-w-[44px] w-full py-2.5 px-4 rounded-xl font-black text-sm bg-amber-400 hover:bg-amber-300 text-neutral-950 flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Video size={17} />
                <span>Join Now</span>
                {(!localAttendance || localAttendance.status === 'absent') && (
                  <span className="text-[11px] font-semibold text-neutral-800 bg-amber-500/30 px-2 py-0.5 rounded-md">
                    Marks attendance
                  </span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleMarkAttendance}
                disabled={isMarking || Boolean(localAttendance && localAttendance.status !== 'absent')}
                className={`min-h-[44px] min-w-[44px] w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs ${
                  localAttendance?.status === 'present' || localAttendance?.status === 'late'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                    : localAttendance?.status === 'pending'
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                    : 'bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black cursor-pointer'
                }`}
              >
                {localAttendance?.status === 'present' || localAttendance?.status === 'late' ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Attendance Confirmed</span>
                  </>
                ) : localAttendance?.status === 'pending' ? (
                  <>
                    <Clock size={16} className="animate-spin" />
                    <span>Attendance Claim Submitted</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>{isMarking ? 'Submitting...' : 'Mark Attendance (Link Pending)'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* State 3: Upcoming */}
        {isUpcoming && (
          <div>
            {effectiveLink && minsUntilStart <= 10 && isToday ? (
              <button
                type="button"
                onClick={handleJoinClass}
                className="min-h-[44px] min-w-[44px] w-full py-2.5 px-4 rounded-xl font-black text-sm bg-amber-400 hover:bg-amber-300 text-neutral-950 flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Video size={17} />
                <span>Join Now</span>
                <span className="text-[11px] font-semibold text-neutral-800 bg-amber-500/30 px-2 py-0.5 rounded-md">
                  Starts in {renderCountdown()}
                </span>
              </button>
            ) : effectiveLink ? (
              <div
                title="Class link is ready. Unlocks 10 minutes before class start time."
                className="min-h-[44px] min-w-[44px] w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Play size={14} className="text-amber-500 shrink-0" />
                  <span>Link ready</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                  <Lock size={12} />
                  <span>
                    {isToday && renderCountdown() ? `Starts in ${renderCountdown()}` : 'Unlocks 10m before'}
                  </span>
                </div>
              </div>
            ) : (
              <div
                title="Your teacher will publish the class link before session start time."
                className="min-h-[44px] min-w-[44px] w-full py-2.5 px-4 rounded-xl text-xs font-medium bg-neutral-50 dark:bg-neutral-850 border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <VideoOff size={14} className="text-neutral-400 shrink-0" />
                  <span>Waiting for teacher link</span>
                </div>
                {isToday && renderCountdown() && (
                  <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                    Starts in {renderCountdown()}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentClassCard;
