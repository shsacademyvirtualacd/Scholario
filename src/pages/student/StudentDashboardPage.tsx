import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookMarked, CheckCircle2, ChevronRight, ArrowRight, GraduationCap,
  Clock, Play, Pause, RotateCcw, Zap, Lock, Video
} from 'lucide-react';
import StudentShell from '../../components/student/StudentShell';
import StatusPill from '../../components/ui/StatusPill';
import { useAuth } from '../../features/auth/AuthContext';
import { getSlotsForStudent, getNotesForOfferings, getOfferingsForStudent, getAttendanceForStudent, computeAttendanceStreak } from '../../lib/db';
import { pageCache } from '../../lib/pageCache';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import { useMobile } from '../../hooks/useMobile';
import type { ClassSlot, Note, Attendance } from '../../types';
import {
  getPKTNow, classWidgetState, formatCountdown, getSlotSubject,
  formatTime12h, calcDuration, getLinkAvailabilityStatus
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
const StudentLiveLink: React.FC<{ slot: ClassSlot }> = ({ slot }) => {
  const [pktnow, setPktnow] = useState(getPKTNow);

  // Dynamic 10-second timer tick so the link unlocks in real time
  useEffect(() => {
    const timer = setInterval(() => setPktnow(getPKTNow()), 10_000);
    return () => clearInterval(timer);
  }, []);

  const linkStatus = getLinkAvailabilityStatus(slot, pktnow);
  const hasRawLink = Boolean(slot?.room_or_link && slot.room_or_link.trim().length > 0);

  if (!hasRawLink && linkStatus.status === 'no_link') return null;

  if (linkStatus.isAvailable) {
    return (
      <a 
        href={slot.room_or_link!.startsWith('http') ? slot.room_or_link! : `https://${slot.room_or_link!}`}
        target="_blank" 
        rel="noreferrer" 
        className="mt-2 flex items-center justify-center gap-1.5 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-2 rounded-md transition-all hover:scale-[1.02] shadow-xs"
      >
        <Video size={13} /> Join Live Class
      </a>
    );
  }

  if (linkStatus.status === 'locked') {
    return (
      <div 
        className="mt-2 flex items-center justify-center gap-1.5 w-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold py-1.5 px-2 rounded-md"
        title="Class link will become accessible 10 minutes before class start time"
      >
        <Lock size={12} className="text-amber-600 shrink-0" />
        <span className="truncate">{linkStatus.message}</span>
      </div>
    );
  }

  if (linkStatus.status === 'ended') {
    return (
      <div className="mt-2 flex items-center justify-center gap-1.5 w-full bg-gray-100 text-gray-500 text-[11px] font-medium py-1.5 px-2 rounded-md border border-gray-200">
        <Clock size={12} className="text-gray-400 shrink-0" />
        <span>Class Session Ended</span>
      </div>
    );
  }

  if (hasRawLink) {
    return (
      <div className="mt-2 flex items-center justify-center gap-1.5 w-full bg-gray-50 text-gray-500 text-[11px] font-medium py-1.5 px-2 rounded-md border border-gray-200">
        <Lock size={12} className="text-gray-400 shrink-0" />
        <span>Unlocks 10m Before Class</span>
      </div>
    );
  }

  return null;
};

// ─── Live Next Class Countdown Widget ─────────────────────────────
const NextClassWidget: React.FC<{ slots: ClassSlot[] }> = ({ slots }) => {
  const [pktnow, setPktnow] = useState(getPKTNow);

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
        <StudentLiveLink slot={state.activeSlot} />
      </div>
    );
  }

  // ── States B/C/D with an upcoming class ─────────────────────────────
  const nextSlot = state.nextSlot!;
  const minsUntil = state.minsUntil ?? 0;
  const subject = getSlotSubject(nextSlot);
  
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
      <StudentLiveLink slot={nextSlot} />
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

  const [scheduleSlots, setScheduleSlots] = useState<ClassSlot[]>(cachedSlots || []);
  const [studentNotes, setStudentNotes] = useState<Note[]>(cachedNotes || []);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>(cachedAttendance || []);
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

    if (initSlots && scheduleSlots.length === 0 && mounted) setScheduleSlots(initSlots);
    if (initNotes && studentNotes.length === 0 && mounted) setStudentNotes(initNotes);
    if (initAtt && attendanceRecords.length === 0 && mounted) setAttendanceRecords(initAtt);
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

  const recentNotes = studentNotes.slice(0, 3);

  // Get Today's classes — PKT-aware day index
  const currentDayIndex = getPKTNow().dayIndex;
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
            <div className="stat-card flex flex-col justify-between min-h-[140px] interactive relative opacity-40 select-none">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Day Streak</span>
                <span className="absolute top-2.5 right-2.5 text-[8px] bg-zinc-200 text-zinc-600 font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                  Soon
                </span>
              </div>
              <div>
                <div className="stat-value">—</div>
                <div className="stat-label">coming soon</div>
              </div>
              <div className="pt-2 border-t border-[#F5F5F5] flex items-center justify-between">
                <div className="flex gap-0.5 flex-1 max-w-[120px]">
                  {[false, false, false, false, false, false, false].map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 h-1.5 rounded-full transition-all duration-300"
                      style={{ background: '#F0F0F0' }}
                      title="Coming Soon"
                    />
                  ))}
                </div>
                <span className="text-[10px] text-[#A3A3A3] font-bold">PB: —</span>
              </div>
            </div>
            {/* Academic Program */}
            <div className="stat-card flex flex-col justify-between min-h-[140px] interactive">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide block">Academic Program</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-[#F4C430] flex items-center justify-center">
                  <GraduationCap size={14} />
                </div>
              </div>
              <div>
                <div className="stat-value text-lg leading-tight truncate">{profile?.class?.display_name || offerings[0]?.class?.display_name || 'Grade Setup'}</div>
                <div className="stat-label truncate mt-0.5">{profile?.class?.board?.name || offerings[0]?.class?.board?.name || 'FBISE'}</div>
              </div>
              <div className="pt-2 border-t border-[#F5F5F5] flex items-center justify-between text-[10px] text-[#A3A3A3] font-bold">
                <span className="truncate">{profile?.stream_obj?.name || profile?.stream || offerings[0]?.stream || 'General'} Stream</span>
                <span className="text-emerald-600 shrink-0">Enrolled</span>
              </div>
            </div>

            {/* Next Class Countdown */}
            <NextClassWidget slots={scheduleSlots} />

            {/* Pomodoro Timer */}
            <PomodoroTimer />
          </>
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
                return (
                  <div
                    key={cls.id}
                    className="flex items-center gap-4 p-3.5 rounded-xl border border-[#F0F0F0] hover:border-[#E5E5E5] transition-all hover:shadow-sm bg-white"
                  >
                    <div className="w-1.5 h-12 rounded-full shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-[#111111]">{clsSubj}</div>
                      <div className="text-xs text-[#737373] font-medium mt-0.5 truncate">
                        {cls.offering?.teacher?.full_name || 'Staff'} · {calcDuration(cls.start_time, cls.end_time) || '90m'}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-extrabold text-[#111111]">{formatClassTime(cls.start_time)}</div>
                      <div className="mt-1">
                        <StatusPill status={cls.is_cancelled ? 'cancelled' : 'upcoming'} />
                      </div>
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
