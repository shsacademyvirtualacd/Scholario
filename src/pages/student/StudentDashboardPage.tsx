import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, Play, Pause, RotateCcw,
  BookMarked, CheckCircle2, ChevronRight, ArrowRight
} from 'lucide-react';
import StudentShell from '../../components/student/StudentShell';
import StatusPill from '../../components/ui/StatusPill';
import { useAuth } from '../../features/auth/AuthContext';
import { MOCK_ENROLLMENT, MOCK_OFFERINGS } from '../../lib/mockData';
import { getSlotsForStudent, getNotesForOfferings, getOfferingsForStudent, getEnrollmentsForStudent } from '../../lib/db';
import type { ClassSlot, Note, Enrollment } from '../../types';

// ─── Pomodoro Timer Component ──────────────────────────────────────
type TimerMode = 'focus' | 'break';

const PomodoroTimer: React.FC = () => {
  const FOCUS_SECS = 25 * 60;
  const BREAK_SECS = 5 * 60;

  const [mode, setMode] = useState<TimerMode>('focus');
  const [seconds, setSeconds] = useState(FOCUS_SECS);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            if (mode === 'focus') {
              setSessions((n) => n + 1);
              setMode('break');
              return BREAK_SECS;
            } else {
              setMode('focus');
              return FOCUS_SECS;
            }
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
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
    <div className="stat-card flex flex-col gap-3 min-w-[220px]">
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
          className="w-8 h-8 rounded-full border border-[#E5E5E5] flex items-center justify-center text-[#737373] hover:bg-[#F5F5F5] transition-colors"
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

// ─── Live Next Class Countdown Widget ─────────────────────────────
const NextClassWidget: React.FC<{ slots: ClassSlot[] }> = ({ slots }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  const currentDayIndex = (new Date().getDay() + 6) % 7; // 0=Mon ... 6=Sun

  // Sort slots by day and time to find upcoming ones
  const upcomingSlots = slots
    .filter(slot => slot.day_of_week >= currentDayIndex && !slot.is_cancelled)
    .sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
      return a.start_time.localeCompare(b.start_time);
    });

  const nextSlot = upcomingSlots[0] || slots[0]; // Fallback to first class next week if none today/later this week

  useEffect(() => {
    if (!nextSlot) return;

    const updateCountdown = () => {
      const now = new Date();
      const target = new Date();

      // Calculate days to add to get to the class's day of week
      let targetDay = nextSlot.day_of_week;
      let currentDay = (now.getDay() + 6) % 7;

      let daysToAdd = targetDay - currentDay;
      if (daysToAdd < 0 || (daysToAdd === 0 && nextSlot.start_time < `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`)) {
        daysToAdd += 7; // Next week
      }

      target.setDate(now.getDate() + daysToAdd);

      const [hours, minutes] = nextSlot.start_time.split(':').map(Number);
      target.setHours(hours, minutes, 0, 0);

      const diffMs = target.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeLeft('Starting now');
        return;
      }

      const diffMins = Math.floor(diffMs / 60000);
      const h = Math.floor(diffMins / 60);
      const m = diffMins % 60;

      if (h > 0) {
        setTimeLeft(`in ${h}h ${m}m`);
      } else {
        setTimeLeft(`in ${m}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [nextSlot]);

  if (!nextSlot) {
    return (
      <div className="stat-card flex flex-col gap-2">
        <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Next Class</span>
        <div className="text-sm font-medium text-[#737373]">No classes scheduled</div>
      </div>
    );
  }

  const formatClassTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="stat-card flex flex-col justify-between min-h-[140px]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Next Class</span>
        <span className="badge badge-gold text-[10px] font-bold">{timeLeft}</span>
      </div>
      <div>
        <div className="text-base font-extrabold text-[#111111] truncate">{nextSlot.offering?.subject}</div>
        <div className="text-xs text-[#737373] font-medium truncate mt-0.5">{nextSlot.offering?.teacher?.full_name}</div>
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-[#F5F5F5]">
        <Clock size={13} className="text-[#F4C430] shrink-0" />
        <span className="text-xs font-bold text-[#111111]">{formatClassTime(nextSlot.start_time)}</span>
        <span className="text-xs text-[#A3A3A3]">·</span>
        <span className="text-xs font-semibold text-[#737373] capitalize">
          {nextSlot.offering?.board} · Gr. {nextSlot.offering?.grade}
        </span>
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────
const StudentDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const studentId = profile?.id || '';

  // ── DB-fetched data ──────────────────────────────────────────────
  const [scheduleSlots, setScheduleSlots] = useState<ClassSlot[]>([]);
  const [studentNotes, setStudentNotes] = useState<Note[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  useEffect(() => {
    if (!studentId) return;
    // Load slots, notes, and enrollments in parallel
    getSlotsForStudent(studentId).then(setScheduleSlots).catch(console.error);
    getEnrollmentsForStudent(studentId).then(setEnrollments).catch(console.error);
    getOfferingsForStudent(studentId).then(async (offs) => {
      const ids = offs.map(o => o.id);
      const n = await getNotesForOfferings(ids).catch(() => [] as Note[]);
      setStudentNotes(n);
    }).catch(console.error);
  }, [studentId]);

  const recentNotes = studentNotes.slice(0, 3);

  // Compute classes left details using real enrollments table
  const totalClasses = enrollments.reduce((sum, e) => sum + e.total_classes, 0) || 48;
  const classesUsed = 0;
  const classesRemaining = totalClasses;
  const classesLeftPct = 100;

  // Get Today's classes
  const currentDayIndex = (new Date().getDay() + 6) % 7; // 0=Mon ... 6=Sun
  const todayClasses = scheduleSlots
    .filter(slot => slot.day_of_week === currentDayIndex)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Dynamic colors for subjects
  const getSubjectColor = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'mathematics': return '#F4C430'; // Gold
      case 'physics': return '#3b82f6'; // Blue
      case 'chemistry': return '#10b981'; // Green
      default: return '#8b5cf6'; // Purple
    }
  };

  const formatClassTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* Streak */}
        <div className="stat-card flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Day Streak</span>
            <span className="text-xl fire-anim">🔥</span>
          </div>
          <div>
            <div className="stat-value">{MOCK_ENROLLMENT.streak}</div>
            <div className="stat-label">days in a row</div>
          </div>
          <div className="pt-2 border-t border-[#F5F5F5] flex items-center justify-between">
            <div className="flex gap-0.5 flex-1 max-w-[120px]">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-1.5 rounded-full transition-all duration-300"
                  style={{ background: i < MOCK_ENROLLMENT.streak ? '#F4C430' : '#F0F0F0' }}
                />
              ))}
            </div>
            <span className="text-[10px] text-[#A3A3A3] font-bold">PB: {MOCK_ENROLLMENT.personal_best_streak}d</span>
          </div>
        </div>

        {/* Classes Left (Progress Ring) */}
        <div className="stat-card flex items-center justify-between min-h-[140px] gap-2">
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide block">Classes Left</span>
            <div className="stat-value mt-1">{classesRemaining}</div>
            <div className="stat-label">of {totalClasses} total</div>
            <p className="text-[10px] text-[#A3A3A3] mt-2 font-medium">{classesUsed} attended so far</p>
          </div>
          
          <div className="relative w-16 h-16 shrink-0">
            <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
              <circle cx="32" cy="32" r="26" fill="none" stroke="#F5F5F5" strokeWidth="5" />
              <circle
                cx="32"
                cy="32"
                r="26"
                fill="none"
                stroke={classesLeftPct > 30 ? '#F4C430' : classesLeftPct > 10 ? '#f97316' : '#ef4444'}
                strokeWidth="5"
                strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={`${2 * Math.PI * 26 * (1 - classesLeftPct / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-extrabold text-[#111111]">{classesLeftPct}%</span>
            </div>
          </div>
        </div>

        {/* Next Class Countdown */}
        <NextClassWidget slots={scheduleSlots} />

        {/* Pomodoro Timer */}
        <PomodoroTimer />
      </div>

      {/* ── Today's Classes + Recent Notes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Today's Classes */}
        <div className="card card-elevated">
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
            {todayClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-[#FAFAFA] border border-dashed border-[#E5E5E5] rounded-xl">
                <CheckCircle2 size={32} className="text-[#D4D4D4] mb-2" />
                <p className="text-xs text-[#737373] font-semibold">No classes scheduled for today.</p>
                <p className="text-[10px] text-[#A3A3A3] mt-0.5">Enjoy your rest day!</p>
              </div>
            ) : (
              todayClasses.map((cls) => {
                const color = getSubjectColor(cls.offering?.subject || '');
                return (
                  <div
                    key={cls.id}
                    className="flex items-center gap-4 p-3.5 rounded-xl border border-[#F0F0F0] hover:border-[#E5E5E5] transition-all hover:shadow-sm bg-white"
                  >
                    <div className="w-1.5 h-12 rounded-full shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-[#111111]">{cls.offering?.subject}</div>
                      <div className="text-xs text-[#737373] font-medium mt-0.5 truncate">
                        {cls.offering?.teacher?.full_name} · 90 min
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
        <div className="card card-elevated flex flex-col justify-between">
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
              {recentNotes.map((note) => {
                const offering = MOCK_OFFERINGS.find(o => o.id === note.offering_id);
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
              })}
            </div>
          </div>
          <button
            onClick={() => navigate('/student/notes')}
            className="btn btn-ghost btn-sm w-full mt-4 border border-[#E5E5E5] hover:bg-[#F5F5F5] font-bold"
          >
            View all notes
          </button>
        </div>
      </div>

    </StudentShell>
  );
};

export default StudentDashboardPage;
