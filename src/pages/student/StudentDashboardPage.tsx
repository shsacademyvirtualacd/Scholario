import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookMarked, CheckCircle2, ChevronRight, ArrowRight,
  Clock, Play, Pause, RotateCcw, Zap, Lock, Video, VideoOff, Check, X, XCircle,
  ClipboardCheck
} from 'lucide-react';
import StudentShell from '../../components/student/StudentShell';
import StatusPill from '../../components/ui/StatusPill';
import { useAuth } from '../../features/auth/AuthContext';
import {
  getSlotsForStudent,
  getNotesForOfferings,
  getOfferingsForStudent,
  getAttendanceForStudent,
  computeAttendanceStreak,
  markStudentSelfAttendance,
  getTeacherAttendanceRatingsForStudent,
  getSessionLink
} from '../../lib/db';
import TeacherAttendanceRatingCard from '../../components/student/TeacherAttendanceRatingCard';
import NotificationPermissionBanner from '../../components/student/NotificationPermissionBanner';
import { pageCache } from '../../lib/pageCache';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import { useMobile } from '../../hooks/useMobile';
import type { ClassSlot, Note, Attendance, TeacherAttendanceRating } from '../../types';
import {
  getPKTNow, classWidgetState, formatCountdown, getSlotSubject,
  formatTime12h, calcDuration, getLinkAvailabilityStatus, isSlotOngoing,
  getClosestDateForDayOfWeek
} from '../../lib/scheduleUtils';

// ─── Pomodoro Timer Component ──────────────────────────────────────
type TimerMode = 'focus' | 'break';

const PomodoroTimer: React.FC = () => {
  const FOCUS_SECS = 25 * 60;
  const BREAK_SECS = 5 * 60;

  const [mode, setMode] = useState<TimerMode>('focus');
  const [seconds, setSeconds] = useState(FOCUS_SECS);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            if (mode === 'focus') {
              setSessions(s => s + 1);
              setMode('break');
              return BREAK_SECS;
            } else {
              setMode('focus');
              return FOCUS_SECS;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, mode]);

  const reset = () => {
    setRunning(false);
    setSeconds(mode === 'focus' ? FOCUS_SECS : BREAK_SECS);
  };

  const switchMode = (m: TimerMode) => {
    setRunning(false);
    setMode(m);
    setSeconds(m === 'focus' ? FOCUS_SECS : BREAK_SECS);
  };

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  const progress = mode === 'focus'
    ? ((FOCUS_SECS - seconds) / FOCUS_SECS) * 100
    : ((BREAK_SECS - seconds) / BREAK_SECS) * 100;

  return (
    <div className="stat-card flex flex-col gap-3 min-w-[220px] interactive">
      {/* Mode tabs */}
      <div className="flex items-center gap-1 bg-[#F5F5F5] rounded-lg p-1">
        {(['focus', 'break'] as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`flex-1 py-1 rounded-md text-xs font-semibold transition-all duration-200 capitalize ${
              mode === m ? 'bg-white text-[#111111] shadow-sm' : 'text-[#737373]'
            }`}
          >
            {m === 'focus' ? '🍅 Focus' : '☕ Break'}
          </button>
        ))}
      </div>

      {/* Timer display */}
      <div className="relative flex flex-col items-center py-2">
        <svg width="90" height="90" viewBox="0 0 90 90" className="-rotate-90">
          <circle cx="45" cy="45" r="38" fill="none" stroke="#F5F5F5" strokeWidth="6" />
          <circle
            cx="45" cy="45" r="38" fill="none"
            stroke={mode === 'focus' ? '#F4C430' : '#22c55e'}
            strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 38}`}
            strokeDashoffset={`${2 * Math.PI * 38 * (1 - progress / 100)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-[#111111] tracking-tight font-mono">
            {mins}:{secs}
          </span>
          <span className="text-[10px] text-[#A3A3A3] font-medium uppercase tracking-wide mt-0.5">
            {mode}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="w-8 h-8 rounded-full border border-[#E5E5E5] flex items-center justify-center text-[#737373] hover:bg-[#F5F5F5] transition-colors interactive"
        >
          <RotateCcw size={13} />
        </button>
        <button
          onClick={() => setRunning(!running)}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
          style={{ background: mode === 'focus' ? '#F4C430' : '#22c55e' }}
        >
          {running ? <Pause size={16} className="text-[#111111]" /> : <Play size={16} className="text-[#111111] translate-x-0.5" />}
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(sessions, 4) }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-[#F4C430]" />
          ))}
          {Array.from({ length: Math.max(0, 4 - sessions) }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-[#F0F0F0]" />
          ))}
        </div>
      </div>
      <p className="text-center text-xs text-[#A3A3A3]">{sessions} session{sessions !== 1 ? 's' : ''} today</p>
    </div>
  );
};

// ─── Live Link Join Button for Student ────────────────────────────
const StudentLiveLink: React.FC<{
  slot: ClassSlot;
  sessionDate?: string;
  studentId?: string;
  attendanceRecord?: Attendance | null;
  onAttendanceMarked?: (slotId: string, record: Attendance) => void;
}> = ({ slot, sessionDate, studentId, attendanceRecord: propAttendance, onAttendanceMarked }) => {
  const [pktnow, setPktnow] = useState(getPKTNow);
  const [isMarking, setIsMarking] = useState(false);
  const [localAttendance, setLocalAttendance] = useState<Attendance | null>(propAttendance || null);
  const [sessionLinkUrl, setSessionLinkUrl] = useState<string | null>(null);
  const [isLoadingLink, setIsLoadingLink] = useState<boolean>(true);

  const effectiveSessionDate = sessionDate || (
    slot.day_of_week === pktnow.dayIndex
      ? pktnow.dateString
      : getClosestDateForDayOfWeek(slot.day_of_week ?? 0, pktnow)
  );

  const fetchSessionLink = async () => {
    if (!slot?.id || !effectiveSessionDate) {
      setIsLoadingLink(false);
      return;
    }
    try {
      const rec = await getSessionLink(slot.id, effectiveSessionDate);
      setSessionLinkUrl(rec?.link_url || null);
    } catch (err) {
      console.warn('[StudentLiveLink] fetch link err:', err);
      setSessionLinkUrl(null);
    } finally {
      setIsLoadingLink(false);
    }
  };

  useEffect(() => {
    setLocalAttendance(propAttendance || null);
  }, [propAttendance]);

  useEffect(() => {
    setIsLoadingLink(true);
    fetchSessionLink();
  }, [slot?.id, effectiveSessionDate]);

  // Realtime updates for session links
  useRealtimeTable({
    table: 'class_session_links',
    debounceMs: 1000,
    onAny: fetchSessionLink,
  });

  // Dynamic 10-second timer tick so the link unlocks in real time
  useEffect(() => {
    const timer = setInterval(() => setPktnow(getPKTNow()), 10_000);
    return () => clearInterval(timer);
  }, []);

  const isOngoing = isSlotOngoing(slot, pktnow);
  const effectiveLink = (sessionLinkUrl && sessionLinkUrl.trim().length > 0)
    ? sessionLinkUrl.trim()
    : (slot.room_or_link && slot.room_or_link.trim().length > 0 ? slot.room_or_link.trim() : null);

  const linkStatus = getLinkAvailabilityStatus(slot, pktnow, effectiveLink, effectiveSessionDate);
  const hasLink = Boolean(effectiveLink);

  const targetUrl = effectiveLink
    ? (effectiveLink.startsWith('http://') || effectiveLink.startsWith('https://')
        ? effectiveLink
        : `https://${effectiveLink}`)
    : '';

  const handleMarkAttendance = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!studentId || !isOngoing || isMarking) return;
    setIsMarking(true);
    try {
      const rec = await markStudentSelfAttendance(studentId, slot.id, effectiveSessionDate);
      setLocalAttendance(rec);
      onAttendanceMarked?.(slot.id, rec);
    } catch (e) {
      console.error('Failed marking attendance:', e);
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

  const handleJoinClick = () => {
    // If student attendance is not yet marked and class is ongoing, trigger background attendance marking
    if (isOngoing && (!localAttendance || localAttendance.status === 'absent')) {
      handleMarkAttendance();
    }
    // Also perform window.open fallback if anchor is clicked via keyboard or specialized context
    if (targetUrl) {
      try {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      } catch (err) {
        console.warn('Window open fallback error:', err);
      }
    }
  };

  return (
    <div className="mt-2 space-y-1.5 w-full">
      {/* 4 Attendance States */}
      {(() => {
        if (localAttendance?.status === 'pending') {
          return (
            <button
              disabled
              className="flex items-center justify-center gap-1.5 w-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold py-1.5 px-2 rounded-md cursor-not-allowed shadow-xs"
              title="Your attendance claim has been submitted and is awaiting teacher approval"
            >
              <Clock size={12} className="text-amber-600 animate-pulse" />
              <span>Awaiting Teacher Approval</span>
            </button>
          );
        }

        if (localAttendance?.status === 'present' || localAttendance?.status === 'late') {
          const timeStr = localAttendance.marked_at
            ? new Date(localAttendance.marked_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
            : '';
          return (
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 py-1.5 px-2 rounded-md shadow-xs">
              <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
              <span>{timeStr ? `Attendance Confirmed (${timeStr})` : 'Attendance Confirmed'}</span>
            </div>
          );
        }

        if (localAttendance?.status === 'absent' && (localAttendance.marked_by === 'teacher' || localAttendance.marked_by === 'admin')) {
          return (
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 py-1.5 px-2 rounded-md shadow-xs">
              <XCircle size={12} className="text-rose-600 shrink-0" />
              <span>Attendance Not Confirmed</span>
            </div>
          );
        }

        // Not yet marked
        return (
          <button
            onClick={handleMarkAttendance}
            disabled={!isOngoing || isMarking}
            className={`flex items-center justify-center gap-1.5 w-full text-[11px] font-bold py-1.5 px-2 rounded-md transition-all shadow-xs ${
              isOngoing
                ? 'bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] cursor-pointer interactive'
                : 'bg-[#F4C430]/40 text-[#737373] border border-[#E5E5E5] cursor-not-allowed opacity-60'
            }`}
            title={isOngoing ? 'Mark your attendance for this ongoing class session' : 'Mark My Attendance is enabled only while class is in session'}
          >
            <CheckCircle2 size={12} className={isOngoing ? 'text-[#111111]' : 'text-[#737373]'} />
            <span>{isMarking ? 'Submitting...' : 'Mark My Attendance'}</span>
          </button>
        );
      })()}

      {/* Video link / Status indicators / Missing link fallback */}
      {isLoadingLink ? (
        <div className="flex items-center justify-center gap-1.5 w-full bg-gray-50 border border-gray-200 text-gray-400 text-[11px] font-medium py-2 rounded-md animate-pulse">
          <Clock size={12} />
          <span>Checking class link...</span>
        </div>
      ) : linkStatus.isAvailable && targetUrl ? (
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleJoinClick}
          className="flex items-center justify-center gap-1.5 w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-[11px] font-bold py-2 rounded-md transition-all hover:scale-[1.02] shadow-xs interactive cursor-pointer"
          title={`Join Live Class: ${targetUrl}`}
        >
          <Video size={13} />
          <span>Join Live Class</span>
        </a>
      ) : linkStatus.status === 'locked' ? (
        <div 
          className="flex items-center justify-center gap-1.5 w-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold py-1.5 px-2 rounded-md"
          title="Class link will become accessible 10 minutes before class start time"
        >
          <Lock size={12} className="text-amber-600 shrink-0" />
          <span className="truncate">{linkStatus.message}</span>
        </div>
      ) : linkStatus.status === 'ended' ? (
        <div className="flex items-center justify-center gap-1.5 w-full bg-gray-100 text-gray-500 text-[11px] font-medium py-1.5 px-2 rounded-md border border-gray-200">
          <Clock size={12} className="text-gray-400 shrink-0" />
          <span>Class Session Ended</span>
        </div>
      ) : !hasLink ? (
        <div 
          className="flex items-center justify-center gap-1.5 w-full bg-amber-50/70 border border-dashed border-amber-200 text-amber-800 text-[11px] font-semibold py-1.5 px-2 rounded-md"
          title="The teacher has not added a live class link for this session yet. It will appear here once added."
        >
          <VideoOff size={12} className="text-amber-600 shrink-0" />
          <span>Class link not available yet</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-1.5 w-full bg-gray-50 text-gray-500 text-[11px] font-medium py-1.5 px-2 rounded-md border border-gray-200">
          <Lock size={12} className="text-gray-400 shrink-0" />
          <span>Unlocks 10m Before Class</span>
        </div>
      )}
    </div>
  );
};

// ─── Live Next Class Countdown Widget ─────────────────────────────
const NextClassWidget: React.FC<{
  slots: ClassSlot[];
  studentId?: string;
  attendanceRecords?: Attendance[];
  onAttendanceMarked?: (slotId: string) => void;
}> = ({ slots, studentId, attendanceRecords, onAttendanceMarked }) => {
  const [pktnow, setPktnow] = useState(getPKTNow);
  const todayStr = getPKTNow().dateString || new Date().toISOString().slice(0, 10);

  // Re-evaluate every 60 seconds against PKT clock
  useEffect(() => {
    const id = setInterval(() => setPktnow(getPKTNow()), 60_000);
    return () => clearInterval(id);
  }, []);

  const state = classWidgetState(slots, pktnow);

  // ── State B: end-of-day with no next class scheduled at all ────────
  if (state.type === 'end-of-day' && !state.nextSlot) {
    return (
      <div className="stat-card flex flex-col justify-between min-h-[140px] interactive">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Next Class</span>
          <span className="badge badge-gold text-[10px] font-bold">End of Day</span>
        </div>
        <div>
          <div className="text-base font-extrabold text-[#111111] truncate">No classes scheduled</div>
          <div className="text-xs text-[#737373] font-medium mt-0.5">See you next session! 🌙</div>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-[#F5F5F5]">
          <Clock size={13} className="text-[#A3A3A3] shrink-0" />
          <span className="text-xs text-[#A3A3A3] font-semibold">TBA</span>
        </div>
      </div>
    );
  }

  // ── State A: class is ongoing ───────────────────────────────────────
  if (state.type === 'ongoing') {
    const subject = getSlotSubject(state.activeSlot);
    const remH = Math.floor(state.minsRemaining / 60);
    const remM = state.minsRemaining % 60;
    const remLabel = remH > 0 ? `${remH}h ${remM}m remaining` : `${remM}m remaining`;
    const slotAttendance = attendanceRecords?.find(
      a => a.slot_id === state.activeSlot.id && a.session_date === todayStr
    );
    const sessionDate = pktnow.dateString;

    return (
      <div className="stat-card flex flex-col justify-between min-h-[140px] interactive">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Now In Session</span>
          <span className="badge badge-gold text-[10px] font-bold animate-pulse">● Live</span>
        </div>
        <div>
          <div className="text-base font-extrabold text-[#111111] truncate">{subject}</div>
          <div className="text-xs text-emerald-600 font-bold mt-0.5">{remLabel}</div>
          {state.nextSlot && (
            <div className="text-[10px] text-[#A3A3A3] font-medium mt-1 truncate">
              Up next: {getSlotSubject(state.nextSlot)} · {formatTime12h(state.nextSlot.start_time)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-[#F5F5F5]">
          <Zap size={13} className="text-emerald-500 shrink-0" />
          <span className="text-xs font-bold text-[#111111]">{formatTime12h(state.activeSlot.start_time)} – {formatTime12h(state.activeSlot.end_time)}</span>
        </div>
        <StudentLiveLink
          slot={state.activeSlot}
          sessionDate={sessionDate}
          studentId={studentId}
          attendanceRecord={slotAttendance}
          onAttendanceMarked={onAttendanceMarked}
        />
      </div>
    );
  }

  // ── States B/C/D with an upcoming class ─────────────────────────────
  const nextSlot = state.nextSlot!;
  const minsUntil = state.minsUntil ?? 0;
  const subject = getSlotSubject(nextSlot);
  const sessionDate = nextSlot.day_of_week === pktnow.dayIndex
    ? pktnow.dateString
    : getClosestDateForDayOfWeek(nextSlot.day_of_week ?? 0, pktnow);
  const nextSlotAttendance = attendanceRecords?.find(
    a => a.slot_id === nextSlot.id && a.session_date === sessionDate
  );
  
  let badgeLabel = '';
  let isPulsing = false;

  if (state.type === 'end-of-day') {
    badgeLabel = 'No classes for today';
  } else {
    badgeLabel = formatCountdown(minsUntil);
    if (state.type === 'morning-buffer') {
      isPulsing = true;
    }
  }

  const formatClassTimeLabel = (slot: ClassSlot) => {
    if (slot.day_of_week == null) return formatTime12h(slot.start_time);
    let daysAhead = slot.day_of_week - pktnow.dayIndex;
    if (daysAhead < 0) daysAhead += 7;

    const timeStr = formatTime12h(slot.start_time);
    if (daysAhead === 0) return timeStr;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return `${days[slot.day_of_week]} at ${timeStr}`;
  };

  return (
    <div className="stat-card flex flex-col justify-between min-h-[140px] interactive">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Next Class</span>
        <span className={`badge badge-gold text-[10px] font-bold ${isPulsing ? 'animate-pulse' : ''}`}>{badgeLabel}</span>
      </div>
      <div>
        <div className="text-base font-extrabold text-[#111111] truncate">{subject}</div>
        <div className="text-xs text-[#737373] font-medium truncate mt-0.5">{nextSlot.offering?.teacher?.full_name}</div>
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-[#F5F5F5]">
        <Clock size={13} className="text-[#F4C430] shrink-0" />
        <span className="text-xs font-bold text-[#111111]">{formatClassTimeLabel(nextSlot)}</span>
        <span className="text-xs text-[#A3A3A3]">·</span>
        <span className="text-xs font-semibold text-[#737373] capitalize">
          FBISE · Gr. {nextSlot.offering?.grade || '10'}
        </span>
      </div>
      <StudentLiveLink
        slot={nextSlot}
        sessionDate={sessionDate}
        studentId={studentId}
        attendanceRecord={nextSlotAttendance}
        onAttendanceMarked={onAttendanceMarked}
      />
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────
const StudentDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobile();

  const studentId = profile?.id || '';

  // ── DB-fetched data ──────────────────────────────────────────────
  const cachedSlots = studentId ? pageCache.get<ClassSlot[]>('schedule_slots', studentId) : null;
  const cachedNotes = studentId ? pageCache.get<Note[]>('student_notes', studentId) : null;
  const cachedAttendance = studentId ? pageCache.get<Attendance[]>('student_attendance', studentId) : null;
  const cachedOfferings = studentId ? pageCache.get<any[]>('student_offerings', studentId) : null;
  const cachedRatings = studentId ? pageCache.get<TeacherAttendanceRating[]>('student_teacher_ratings', studentId) : null;

  const [scheduleSlots, setScheduleSlots] = useState<ClassSlot[]>(cachedSlots || []);
  const [studentNotes, setStudentNotes] = useState<Note[]>(cachedNotes || []);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>(cachedAttendance || []);
  const [teacherRatings, setTeacherRatings] = useState<TeacherAttendanceRating[]>(cachedRatings || []);
  const [offerings, setOfferings] = useState<any[]>(cachedOfferings || []);
  const [loading, setLoading] = useState(!cachedOfferings || cachedOfferings.length === 0);

  useEffect(() => {
    if (!studentId) return;
    let mounted = true;

    // Render cached data immediately on studentId ready
    const initSlots = pageCache.get<ClassSlot[]>('schedule_slots', studentId);
    const initNotes = pageCache.get<Note[]>('student_notes', studentId);
    const initAtt = pageCache.get<Attendance[]>('student_attendance', studentId);
    const initOffs = pageCache.get<any[]>('student_offerings', studentId);
    const initRats = pageCache.get<TeacherAttendanceRating[]>('student_teacher_ratings', studentId);

    if (initSlots && scheduleSlots.length === 0 && mounted) setScheduleSlots(initSlots);
    if (initNotes && studentNotes.length === 0 && mounted) setStudentNotes(initNotes);
    if (initAtt && attendanceRecords.length === 0 && mounted) setAttendanceRecords(initAtt);
    if (initRats && teacherRatings.length === 0 && mounted) setTeacherRatings(initRats);
    if (initOffs && offerings.length === 0 && mounted) setOfferings(initOffs);

    // Background fetch + diff update
    Promise.all([
      getSlotsForStudent(studentId).then((slots) => {
        if (!mounted) return;
        const currentSlots = pageCache.get<ClassSlot[]>('schedule_slots', studentId);
        if (!currentSlots || JSON.stringify(currentSlots) !== JSON.stringify(slots)) {
          setScheduleSlots(slots);
          pageCache.set('schedule_slots', slots, studentId);
        }
      }),
      getAttendanceForStudent(studentId).then((att) => {
        if (!mounted) return;
        const currentAtt = pageCache.get<Attendance[]>('student_attendance', studentId);
        if (!currentAtt || JSON.stringify(currentAtt) !== JSON.stringify(att)) {
          setAttendanceRecords(att);
          pageCache.set('student_attendance', att, studentId);
        }
      }),
      getTeacherAttendanceRatingsForStudent(studentId).then((rats) => {
        if (!mounted) return;
        const currentRats = pageCache.get<TeacherAttendanceRating[]>('student_teacher_ratings', studentId);
        if (!currentRats || JSON.stringify(currentRats) !== JSON.stringify(rats)) {
          setTeacherRatings(rats);
          pageCache.set('student_teacher_ratings', rats, studentId);
        }
      }),
      getOfferingsForStudent(studentId).then(async (offs) => {
        if (!mounted) return;
        const currentOffs = pageCache.get<any[]>('student_offerings', studentId);
        if (!currentOffs || JSON.stringify(currentOffs) !== JSON.stringify(offs)) {
          setOfferings(offs);
          pageCache.set('student_offerings', offs, studentId);
        }

        const ids = offs.map(o => o.id);
        const n = await getNotesForOfferings(ids).catch(() => [] as Note[]);
        if (!mounted) return;
        
        const currentNotes = pageCache.get<Note[]>('student_notes', studentId);
        if (!currentNotes || JSON.stringify(currentNotes) !== JSON.stringify(n)) {
          setStudentNotes(n);
          pageCache.set('student_notes', n, studentId);
        }
      })
    ]).catch(console.error).finally(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [studentId]);

  // ── Realtime Updates ──────────────────────────────────────────────
  const fetchSlots = async () => {
    if (!studentId) return;
    const slots = await getSlotsForStudent(studentId);
    setScheduleSlots(slots);
    pageCache.set('schedule_slots', slots, studentId);
  };
  
  const fetchNotes = async () => {
    if (!studentId || offerings.length === 0) return;
    const ids = offerings.map(o => o.id);
    const n = await getNotesForOfferings(ids).catch(() => [] as Note[]);
    setStudentNotes(n);
    pageCache.set('student_notes', n, studentId);
  };

  const fetchAttendance = async () => {
    if (!studentId) return;
    const att = await getAttendanceForStudent(studentId);
    setAttendanceRecords(att);
    pageCache.set('student_attendance', att, studentId);
  };

  const fetchTeacherRatings = async () => {
    if (!studentId) return;
    const rats = await getTeacherAttendanceRatingsForStudent(studentId);
    setTeacherRatings(rats);
    pageCache.set('student_teacher_ratings', rats, studentId);
  };

  useRealtimeTable({
    table: 'class_slots',
    debounceMs: 2000,
    onAny: fetchSlots
  });

  useRealtimeTable({
    table: 'notes',
    debounceMs: 2000,
    onAny: fetchNotes
  });

  useRealtimeTable({
    table: 'attendance',
    debounceMs: 500,
    onAny: fetchAttendance
  });

  useRealtimeTable({
    table: 'teacher_attendance_ratings',
    debounceMs: 500,
    onAny: fetchTeacherRatings
  });

  const recentNotes = studentNotes.slice(0, 3);

  const pktnow = getPKTNow();
  const currentDayIndex = pktnow.dayIndex;
  const todayClasses = scheduleSlots
    .filter(slot => slot.day_of_week === currentDayIndex)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  // Dynamic colors for subjects
  const getSubjectColor = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'mathematics': return '#F4C430'; // Gold
      case 'physics': return '#3b82f6'; // Blue
      case 'chemistry': return '#10b981'; // Green
      default: return '#8b5cf6'; // Purple
    }
  };

  const formatClassTime = formatTime12h;
  const streakMetrics = computeAttendanceStreak(attendanceRecords);
  const todayStr = getPKTNow().dateString || new Date().toISOString().slice(0, 10);

  // ── Attendance section state & calculations ────────────────────────
  const [showAllAttendanceHistory, setShowAllAttendanceHistory] = useState(false);

  // Only consider classes as 'present' if verified by teacher/admin
  const totalClassesHeld = attendanceRecords.length;
  const totalClassesAttended = attendanceRecords.filter(
    (r) => (r.marked_by === 'teacher' || r.marked_by === 'admin') && (r.status === 'present' || r.status === 'late')
  ).length;
  const attendanceRate = totalClassesHeld > 0
    ? Math.round((totalClassesAttended / totalClassesHeld) * 100)
    : 0;

  // Total term classes and remaining calculation (from offerings or baseline term total)
  const classesTotal = offerings.reduce((acc, curr) => acc + (curr.total_classes || 0), 0) || (totalClassesHeld > 0 ? Math.max(totalClassesHeld, 48) : 48);
  const classesLeft = Math.max(0, classesTotal - totalClassesAttended);

  // Sorted with most recent date first
  const sortedAttendanceRecords = [...attendanceRecords].sort((a, b) => {
    const dateA = a.session_date || '';
    const dateB = b.session_date || '';
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    const timeA = a.slot?.start_time || '';
    const timeB = b.slot?.start_time || '';
    return timeB.localeCompare(timeA);
  });

  const thirtyDaysAgoDate = new Date();
  thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgoDate.toISOString().slice(0, 10);

  const last30DaysRecords = sortedAttendanceRecords.filter(
    (r) => (r.session_date || '') >= thirtyDaysAgoStr
  );

  const displayedAttendanceRecords = showAllAttendanceHistory
    ? sortedAttendanceRecords
    : last30DaysRecords;

  const formatSessionDate = (dStr?: string) => {
    if (!dStr) return '—';
    try {
      const [y, m, d] = dStr.split('-').map(Number);
      if (!y || !m || !d) return dStr;
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  const getAttendanceStatusBadge = (rec: Attendance) => {
    const isTeacherMarked = rec.marked_by === 'teacher' || rec.marked_by === 'admin';
    if (isTeacherMarked) {
      if (rec.status === 'present' || rec.status === 'late') {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
            <span>Present</span>
          </span>
        );
      }
      if (rec.status === 'absent') {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            <XCircle size={12} className="text-rose-600 shrink-0" />
            <span>Absent</span>
          </span>
        );
      }
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
        <Clock size={12} className="text-amber-600 shrink-0" />
        <span>Not Marked</span>
      </span>
    );
  };

  const handleMarkTodayAttendance = async (slotId: string) => {
    if (!studentId) return;
    try {
      const rec = await markStudentSelfAttendance(studentId, slotId, todayStr);
      setAttendanceRecords(prev => [rec, ...prev.filter(p => !(p.slot_id === slotId && p.session_date === todayStr))]);
    } catch (err) {
      console.error('Failed to mark attendance:', err);
    }
  };

  return (
    <StudentShell>
      <style>{`
        @keyframes fire-pulse {
          0% { transform: scale(1); filter: drop-shadow(0 0 0px rgba(244, 196, 48, 0)); }
          50% { transform: scale(1.2); filter: drop-shadow(0 0 8px rgba(244, 196, 48, 0.7)); }
          100% { transform: scale(1); filter: drop-shadow(0 0 0px rgba(244, 196, 48, 0)); }
        }
        .fire-anim {
          animation: fire-pulse 2s infinite ease-in-out;
          display: inline-block;
        }
      `}</style>

      {/* ── Notification Permission Request Banner ── */}
      <NotificationPermissionBanner />

      {/* ── Welcome ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111] tracking-tight">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            {profile?.full_name?.split(' ')[0] ?? 'Student'} 👋
          </h1>
          <p className="text-sm text-[#737373] mt-1 font-medium">Here's your study overview for today.</p>
        </div>
      </div>

      {/* ── Top strip: Streak · Classes Left · Next Class · Pomodoro ── */}
      <div className={`${isMobile ? 'flex flex-col gap-4' : 'grid sm:grid-cols-2 xl:grid-cols-4 gap-4'}`}>
        {loading ? (
          [1, 2, 3, 4].map((n) => (
            <div key={n} className="stat-card flex flex-col justify-between min-h-[140px] animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-3 bg-gray-100 rounded w-24" />
                <div className="w-7 h-7 rounded-lg bg-gray-100" />
              </div>
              <div className="space-y-2">
                <div className="h-7 bg-gray-100 rounded w-12" />
                <div className="h-3 bg-gray-100 rounded w-36" />
              </div>
              <div className="pt-2 border-t border-[#F5F5F5] flex items-center justify-between">
                <div className="h-2.5 bg-gray-100 rounded w-24" />
                <div className="h-2.5 bg-gray-100 rounded w-10" />
              </div>
            </div>
          ))
        ) : (
          <>
            {/* Streak */}
            <div className="stat-card flex flex-col justify-between min-h-[140px] interactive relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Day Streak</span>
                {streakMetrics.currentStreak > 0 ? (
                  <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    🔥 Active
                  </span>
                ) : (
                  <span className="text-[10px] bg-gray-100 text-[#737373] border border-gray-200 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    ○ Inactive
                  </span>
                )}
              </div>
              <div>
                <div className="stat-value">{streakMetrics.currentStreak} {streakMetrics.currentStreak === 1 ? 'day' : 'days'}</div>
                <div className="stat-label">
                  {streakMetrics.currentStreak === 0
                    ? 'Start your streak today!'
                    : streakMetrics.currentStreak === 1
                    ? 'Streak started! Keep it going'
                    : 'Consistent attendance!'}
                </div>
              </div>
              <div className="pt-2 border-t border-[#F5F5F5] flex items-center justify-between">
                <div className="flex gap-1 flex-1 max-w-[130px]">
                  {streakMetrics.last7Days.map((attended, i) => (
                    <div
                      key={i}
                      className="flex-1 h-2 rounded-full transition-all duration-300"
                      style={{ background: attended ? '#22c55e' : '#F0F0F0' }}
                      title={attended ? 'Present' : 'Absent/No class'}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-[#737373] font-bold">
                  {streakMetrics.personalBest > 0 ? `PB: ${streakMetrics.personalBest}d` : 'PB: —'}
                </span>
              </div>
            </div>
            {/* Attendance Card with Circular Ring */}
            <div 
              onClick={() => navigate('/student/attendance')}
              className="stat-card flex flex-col justify-between min-h-[140px] interactive relative cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Attendance</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                  Verified
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 my-1">
                {/* Left: Percentage & Attended classes */}
                <div>
                  <div className="stat-value">{loading ? '—' : `${attendanceRate}%`}</div>
                  <div className="stat-label">
                    {loading ? '—' : `${totalClassesAttended} attended`}
                  </div>
                </div>

                {/* Right: Circular Progress Ring with attended count inside */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="relative w-11 h-11 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="16" stroke="#F5F5F5" strokeWidth="3.5" fill="transparent" />
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke={attendanceRate >= 75 ? '#22c55e' : '#F4C430'}
                        strokeWidth="3.5"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 16}
                        strokeDashoffset={2 * Math.PI * 16 * (1 - Math.min(attendanceRate, 100) / 100)}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                      />
                    </svg>
                    <span className="absolute text-xs font-extrabold text-[#111111]">
                      {loading ? '—' : totalClassesAttended}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#737373] font-medium pt-2 border-t border-[#F5F5F5]">
                <span>{loading ? '—' : `${classesLeft} classes left`}</span>
                <span className="font-bold text-[#111111]">{loading ? '—' : `${classesTotal} Total`}</span>
              </div>
            </div>

            {/* Next Class Countdown */}
            <NextClassWidget
              slots={scheduleSlots}
              studentId={studentId}
              attendanceRecords={attendanceRecords}
              onAttendanceMarked={(slotId) => {
                const todayStr = getPKTNow().dateString || new Date().toISOString().slice(0, 10);
                const newRec: Attendance = {
                  id: `att-${Date.now()}`,
                  student_id: studentId,
                  slot_id: slotId,
                  session_date: todayStr,
                  status: 'present',
                  marked_at: new Date().toISOString(),
                };
                setAttendanceRecords(prev => [newRec, ...prev.filter(p => !(p.slot_id === slotId && p.session_date === todayStr))]);
              }}
            />

            {/* Pomodoro Timer */}
            <PomodoroTimer />
          </>
        )}
      </div>

      {/* ── Teacher Attendance Verification Card ── */}
      {!loading && studentId && (
        <TeacherAttendanceRatingCard
          slots={scheduleSlots}
          studentId={studentId}
          ratings={teacherRatings}
          onRatingSubmitted={(newRating) => {
            setTeacherRatings(prev => [
              newRating,
              ...prev.filter(r => !(r.slot_id === newRating.slot_id && r.session_date === newRating.session_date))
            ]);
            pageCache.set(
              'student_teacher_ratings',
              [
                newRating,
                ...teacherRatings.filter(r => !(r.slot_id === newRating.slot_id && r.session_date === newRating.session_date))
              ],
              studentId
            );
          }}
        />
      )}

      {/* ── Attendance Section & Session History ── */}
      <div id="student-attendance-section" className="card card-elevated p-5 interactive">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#F4C430] flex items-center justify-center shrink-0">
              <ClipboardCheck size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111111]">Attendance</h2>
              <p className="text-xs text-[#737373] font-medium">
                Verified class attendance records marked by teachers
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/student/attendance')}
            className="text-xs text-[#737373] hover:text-[#111111] flex items-center gap-1 transition-colors font-semibold"
          >
            Full details <ChevronRight size={12} />
          </button>
        </div>

        {/* Summary Line */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl mb-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#737373]">Total Classes Attended:</span>
              <span className="text-xs font-extrabold text-[#111111]">
                {loading ? '—' : `${totalClassesAttended} of ${totalClassesHeld} held`}
              </span>
            </div>
            <span className="text-[#D4D4D4] hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#737373] font-medium">Attendance Rate:</span>
              <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${
                totalClassesHeld === 0
                  ? 'bg-gray-100 text-gray-500 border-gray-200'
                  : attendanceRate >= 85
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : attendanceRate >= 75
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {loading ? '—' : totalClassesHeld === 0 ? '0%' : `${attendanceRate}%`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[11px] text-[#737373] font-medium">
              Showing: <strong className="text-[#111111]">{showAllAttendanceHistory ? 'All History' : 'Last 30 Days'}</strong> ({displayedAttendanceRecords.length})
            </span>
            {sortedAttendanceRecords.length > 0 && (
              <button
                onClick={() => setShowAllAttendanceHistory(prev => !prev)}
                className="text-[11px] font-bold text-[#111111] hover:text-[#B38E1B] bg-white border border-[#E5E5E5] px-2.5 py-1 rounded-md transition-colors shadow-2xs hover:bg-[#F5F5F5] cursor-pointer"
              >
                {showAllAttendanceHistory ? 'Show last 30 days' : 'View all'}
              </button>
            )}
          </div>
        </div>

        {/* Attendance Table */}
        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-12 bg-gray-100 rounded-xl" />
            ))}
          </div>
        ) : displayedAttendanceRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-[#FAFAFA] border border-dashed border-[#E5E5E5] rounded-xl">
            <CheckCircle2 size={28} className="text-[#D4D4D4] mb-2" />
            <p className="text-xs text-[#737373] font-semibold">
              {showAllAttendanceHistory
                ? 'No class attendance records stored yet.'
                : 'No attendance records in the last 30 days.'}
            </p>
            <p className="text-[10px] text-[#A3A3A3] mt-0.5">
              Attendance records will appear here as your teachers conduct and mark class sessions.
            </p>
            {!showAllAttendanceHistory && sortedAttendanceRecords.length > 0 && (
              <button
                onClick={() => setShowAllAttendanceHistory(true)}
                className="mt-3 text-xs font-bold text-[#111111] hover:text-[#F4C430] underline underline-offset-2"
              >
                View all past records ({sortedAttendanceRecords.length})
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#F0F0F0]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F0F0F0] bg-[#FAFAFA] text-[#737373] uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-3.5">Date</th>
                  <th className="py-3 px-3.5">Subject</th>
                  <th className="py-3 px-3.5">Teacher</th>
                  <th className="py-3 px-3.5">Time</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5] bg-white">
                {displayedAttendanceRecords.map((rec) => {
                  const rawSubj = rec.subject || (rec.slot?.offering as any)?.subject_name || (rec.slot?.offering as any)?.subject?.name || (rec.slot?.offering as any)?.subject || 'Class Session';
                  const subj = typeof rawSubj === 'string' ? rawSubj : (rawSubj?.name || 'Class Session');
                  const teacherName = rec.teacher?.full_name || (rec.slot?.offering as any)?.teacher?.full_name || 'Staff';
                  const timeStr = rec.slot?.start_time ? `${formatTime12h(rec.slot.start_time)} – ${formatTime12h(rec.slot.end_time)}` : '—';
                  const dateStr = formatSessionDate(rec.session_date);

                  return (
                    <tr key={rec.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="py-3 px-3.5 font-semibold text-[#111111] whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-[#111111] whitespace-nowrap">
                        {subj}
                      </td>
                      <td className="py-3 px-3.5 text-[#737373] whitespace-nowrap">
                        {teacherName}
                      </td>
                      <td className="py-3 px-3.5 text-[#737373] whitespace-nowrap">
                        {timeStr}
                      </td>
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        {getAttendanceStatusBadge(rec)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Today's Classes + Recent Notes ── */}
      <div className={`${isMobile ? 'flex flex-col gap-5' : 'grid lg:grid-cols-2 gap-5'}`}>
        
        {/* Today's Classes */}
        <div className="card card-elevated interactive">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#111111]">Today's Classes</h2>
            <button
              onClick={() => navigate('/student/schedule')}
              className="text-xs text-[#737373] hover:text-[#111111] flex items-center gap-1 transition-colors font-semibold"
            >
              Full schedule <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2].map((n) => (
                  <div key={n} className="flex items-center gap-4 p-3.5 rounded-xl border border-[#F0F0F0] bg-white">
                    <div className="w-1.5 h-12 bg-gray-100 rounded-full shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-24" />
                      <div className="h-3 bg-gray-100 rounded w-32" />
                    </div>
                    <div className="h-4 bg-gray-100 rounded w-16 shrink-0" />
                  </div>
                ))}
              </div>
            ) : todayClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-[#FAFAFA] border border-dashed border-[#E5E5E5] rounded-xl">
                <CheckCircle2 size={32} className="text-[#D4D4D4] mb-2" />
                <p className="text-xs text-[#737373] font-semibold">No classes scheduled for today.</p>
                <p className="text-[10px] text-[#A3A3A3] mt-0.5">Enjoy your rest day!</p>
              </div>
            ) : (
              todayClasses.map((cls) => {
                const rawClsSubj = cls.custom_title || (cls.offering as any)?.subject_name || cls.offering?.subject || '';
                const clsSubj = typeof rawClsSubj === 'string' ? rawClsSubj : ((rawClsSubj as any)?.name || 'Class');
                const color = getSubjectColor(clsSubj);
                const att = attendanceRecords.find(
                  a => a.slot_id === cls.id && a.session_date === todayStr
                );
                const isClsOngoing = isSlotOngoing(cls, pktnow);
                return (
                  <div
                    key={cls.id}
                    className="flex items-center gap-3 sm:gap-4 p-3.5 rounded-xl border border-[#F0F0F0] hover:border-[#E5E5E5] transition-all hover:shadow-sm bg-white"
                  >
                    <div className="w-1.5 h-12 rounded-full shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#111111] truncate">{clsSubj}</span>
                        {att?.status === 'pending' ? (
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0 inline-flex items-center gap-1">
                            <Clock size={9} className="animate-spin text-amber-600" /> Awaiting Approval
                          </span>
                        ) : att?.status === 'present' || att?.status === 'late' ? (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0 inline-flex items-center gap-1">
                            <Check size={9} strokeWidth={3} /> {att.status === 'late' ? 'Late' : 'Present'}
                          </span>
                        ) : att?.status === 'absent' && (att.marked_by === 'teacher' || att.marked_by === 'admin') ? (
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 shrink-0 inline-flex items-center gap-1">
                            <X size={9} strokeWidth={3} /> Not Confirmed
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-[#737373] font-medium mt-0.5 truncate">
                        {cls.offering?.teacher?.full_name || 'Staff'} · {calcDuration(cls.start_time, cls.end_time) || '90m'}
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <div className="text-sm font-extrabold text-[#111111]">{formatClassTime(cls.start_time)}</div>
                      {!att && !cls.is_cancelled ? (
                        <button
                          onClick={() => handleMarkTodayAttendance(cls.id)}
                          disabled={!isClsOngoing}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs transition-all ${
                            isClsOngoing
                              ? 'bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] cursor-pointer interactive'
                              : 'bg-[#F4C430]/40 text-[#737373] border border-[#E5E5E5] cursor-not-allowed opacity-60'
                          }`}
                          title={isClsOngoing ? 'Mark your attendance for this class' : 'Attendance can only be marked while class is ongoing'}
                        >
                          Mark My Attendance
                        </button>
                      ) : (
                        <StatusPill status={cls.is_cancelled ? 'cancelled' : 'upcoming'} />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Notes */}
        <div className="card card-elevated flex flex-col justify-between interactive">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#111111]">Recent Notes</h2>
              <button
                onClick={() => navigate('/student/notes')}
                className="text-xs text-[#737373] hover:text-[#111111] flex items-center gap-1 transition-colors font-semibold"
              >
                Notes library <ChevronRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {loading ? (
                <div className="space-y-2 animate-pulse">
                  {[1, 2].map((n) => (
                    <div key={n} className="flex items-center gap-3 p-3 rounded-xl border border-transparent bg-white">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-32" />
                        <div className="h-3 bg-gray-100 rounded w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-[#FAFAFA] border border-dashed border-[#E5E5E5] rounded-xl">
                  <BookMarked size={32} className="text-[#D4D4D4] mb-2" />
                  <p className="text-xs text-[#737373] font-semibold">No notes uploaded yet.</p>
                  <p className="text-[10px] text-[#A3A3A3] mt-0.5">Your study materials will appear here once teachers upload them.</p>
                </div>
              ) : (
                recentNotes.map((note) => {
                  const offering = note.offering;
                  const color = getSubjectColor(offering?.subject || '');
                  return (
                    <button
                      key={note.id}
                      onClick={() => navigate('/student/notes')}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-[#E5E5E5] hover:bg-[#FAFAFA] transition-all text-left group"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${color}1A`, border: `1.5px solid ${color}33` }}
                      >
                        <BookMarked size={16} style={{ color: color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-[#111111] truncate">{note.chapter_name}</div>
                        <div className="text-xs text-[#737373] font-medium mt-0.5 truncate">
                          {offering?.subject} · {note.title}
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-[#D4D4D4] group-hover:text-[#111111] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
          <button
            onClick={() => navigate('/student/notes')}
            className="btn btn-ghost btn-sm w-full mt-4 border border-[#E5E5E5] hover:bg-[#F5F5F5] font-bold interactive"
          >
            View all notes
          </button>
        </div>
      </div>

    </StudentShell>
  );
};

export default StudentDashboardPage;
