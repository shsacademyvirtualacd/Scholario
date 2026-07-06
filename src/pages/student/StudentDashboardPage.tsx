import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Calendar, Clock,
  Bell, Search, Flame, ChevronRight, Play, Pause,
  RotateCcw, User, LogOut, Timer, BookMarked,
  ClipboardCheck, CheckCircle2, Circle, ArrowRight
} from 'lucide-react';
import Logo from '../../components/ui/Logo';
import { useAuth } from '../../features/auth/AuthContext';

// ─── Mock data (replaced with Supabase queries in Batch 4) ───────
const MOCK_STREAK = 7;
const MOCK_CLASSES_LEFT = 34;
const MOCK_TOTAL_CLASSES = 48;

const MOCK_NEXT_CLASS = {
  subject: 'Mathematics',
  teacher: 'Mr. Ahmad Khan',
  time: '4:00 PM',
  date: 'Today',
  board: 'FBISE',
  grade: '10',
};

const MOCK_TODAY_CLASSES = [
  { subject: 'Mathematics', time: '4:00 PM', duration: '90 min', teacher: 'Mr. Ahmad', status: 'upcoming', color: '#F4C430' },
  { subject: 'Physics', time: '6:00 PM', duration: '90 min', teacher: 'Ms. Sara', status: 'upcoming', color: '#3b82f6' },
];

const MOCK_RECENT_NOTES = [
  { chapter: 'Chapter 4 — Algebraic Expressions', subject: 'Mathematics', date: '2 days ago' },
  { chapter: 'Chapter 2 — Vectors & Forces', subject: 'Physics', date: '4 days ago' },
  { chapter: 'Chapter 6 — Chemical Bonding', subject: 'Chemistry', date: '1 week ago' },
];

const MOCK_ATTENDANCE = { attended: 14, total: 18 };

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
    <div className="stat-card flex flex-col gap-3 min-w-[200px]">
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

// ─── Sidebar navigation items ──────────────────────────────────────
const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/student' },
  { icon: BookMarked,      label: 'Notes',      path: '/student/notes' },
  { icon: Calendar,        label: 'Schedule',   path: '/student/schedule' },
  { icon: ClipboardCheck,  label: 'Attendance', path: '/student/attendance' },
];

// ─── Main page ────────────────────────────────────────────────────
const StudentDashboardPage: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('/student');

  const handleNav = (path: string) => {
    setActiveNav(path);
    setSidebarOpen(false);
    navigate(path);
  };

  const attendancePct = Math.round((MOCK_ATTENDANCE.attended / MOCK_ATTENDANCE.total) * 100);
  const classesUsed = MOCK_TOTAL_CLASSES - MOCK_CLASSES_LEFT;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>

      {/* ── Sidebar overlay (mobile) ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#111111] flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-[#1F1F1F] shrink-0">
          <Logo size="sm" variant="full" darkMode />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              onClick={() => handleNav(path)}
              className={`sidebar-link w-full ${activeNav === path ? 'active' : ''}`}
            >
              <Icon size={17} className={`sidebar-icon shrink-0 ${activeNav === path ? '' : 'text-[#525252]'}`} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Profile + logout */}
        <div className="p-3 border-t border-[#1F1F1F] space-y-0.5">
          <button
            onClick={() => handleNav('/student/profile')}
            className="sidebar-link w-full"
          >
            <User size={17} className="sidebar-icon text-[#525252] shrink-0" />
            <div className="flex flex-col items-start">
              <span className="text-white text-xs font-semibold leading-tight">{profile?.full_name ?? 'Student'}</span>
              <span className="text-[#525252] text-[10px]">View profile</span>
            </div>
          </button>
          <button onClick={signOut} className="sidebar-link w-full text-[#525252] hover:text-red-400">
            <LogOut size={17} className="shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-[#E5E5E5] flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-[#F5F5F5] transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <div className="w-5 h-3.5 flex flex-col justify-between">
                <span className="h-0.5 bg-[#111111] rounded" />
                <span className="h-0.5 bg-[#111111] rounded w-3/4" />
                <span className="h-0.5 bg-[#111111] rounded" />
              </div>
            </button>
            <div className="relative hidden sm:block">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
              <input
                placeholder="Search notes, schedule…"
                className="input pl-9 py-2 text-sm w-52 bg-[#FAFAFA] border-[#F0F0F0]"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative w-9 h-9 rounded-lg border border-[#E5E5E5] flex items-center justify-center hover:bg-[#F5F5F5] transition-colors">
              <Bell size={16} className="text-[#525252]" />
              <span className="notif-dot" />
            </button>
            <button
              onClick={() => handleNav('/student/profile')}
              className="w-9 h-9 rounded-lg bg-[#F4C430] flex items-center justify-center text-sm font-bold text-[#111111]"
            >
              {(profile?.full_name?.[0] ?? 'S').toUpperCase()}
            </button>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-4 sm:p-6 space-y-6">

          {/* ── Welcome ── */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-[#111111] tracking-tight">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
                {profile?.full_name?.split(' ')[0] ?? 'Student'} 👋
              </h1>
              <p className="text-sm text-[#737373] mt-1">Here's what's on for today.</p>
            </div>
          </div>

          {/* ── Top strip: Streak · Classes Left · Next Class · Pomodoro ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

            {/* Streak */}
            <div className="stat-card flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Day Streak</span>
                <span className="text-xl">🔥</span>
              </div>
              <div className="stat-value">{MOCK_STREAK}</div>
              <div className="stat-label">days in a row</div>
              <div className="flex gap-1 mt-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-1.5 rounded-full transition-all duration-300"
                    style={{ background: i < MOCK_STREAK ? '#F4C430' : '#F0F0F0' }}
                  />
                ))}
              </div>
              <p className="text-[11px] text-[#A3A3A3]">Keep going — you're on a roll!</p>
            </div>

            {/* Classes Left */}
            <div className="stat-card flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Classes Left</span>
                <BookOpen size={16} className="text-[#3b82f6]" />
              </div>
              <div className="stat-value">{MOCK_CLASSES_LEFT}</div>
              <div className="stat-label">of {MOCK_TOTAL_CLASSES} total</div>
              <div className="progress-bar mt-1">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(classesUsed / MOCK_TOTAL_CLASSES) * 100}%`,
                    background: '#3b82f6',
                  }}
                />
              </div>
              <p className="text-[11px] text-[#A3A3A3]">{classesUsed} classes attended so far</p>
            </div>

            {/* Next Class */}
            <div className="stat-card flex flex-col gap-3 sm:col-span-2 xl:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Next Class</span>
                <span className="badge badge-gold text-[10px]">{MOCK_NEXT_CLASS.date}</span>
              </div>
              <div>
                <div className="text-base font-bold text-[#111111]">{MOCK_NEXT_CLASS.subject}</div>
                <div className="text-xs text-[#737373] mt-0.5">{MOCK_NEXT_CLASS.teacher}</div>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-[#F5F5F5]">
                <Clock size={13} className="text-[#F4C430] shrink-0" />
                <span className="text-sm font-semibold text-[#111111]">{MOCK_NEXT_CLASS.time}</span>
                <span className="text-xs text-[#A3A3A3]">·</span>
                <span className="text-xs text-[#737373]">{MOCK_NEXT_CLASS.board} · Gr. {MOCK_NEXT_CLASS.grade}</span>
              </div>
            </div>

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
                  onClick={() => handleNav('/student/schedule')}
                  className="text-xs text-[#737373] hover:text-[#111111] flex items-center gap-1 transition-colors"
                >
                  Full schedule <ChevronRight size={12} />
                </button>
              </div>
              <div className="space-y-3">
                {MOCK_TODAY_CLASSES.length === 0 ? (
                  <div className="empty-state">
                    <CheckCircle2 size={32} className="text-[#D4D4D4]" />
                    <p className="empty-state-description">No classes today — enjoy your rest day!</p>
                  </div>
                ) : (
                  MOCK_TODAY_CLASSES.map((cls, i) => (
                    <div key={i} className="flex items-center gap-4 p-3.5 rounded-xl border border-[#F0F0F0] hover:border-[#E5E5E5] transition-all hover:shadow-sm">
                      <div className="w-1 h-12 rounded-full shrink-0" style={{ background: cls.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-[#111111]">{cls.subject}</div>
                        <div className="text-xs text-[#737373] mt-0.5">{cls.teacher} · {cls.duration}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-[#111111]">{cls.time}</div>
                        <span className="badge badge-gold text-[10px] mt-1">{cls.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Notes */}
            <div className="card card-elevated">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-[#111111]">Recent Notes</h2>
                <button
                  onClick={() => handleNav('/student/notes')}
                  className="text-xs text-[#737373] hover:text-[#111111] flex items-center gap-1 transition-colors"
                >
                  Notes library <ChevronRight size={12} />
                </button>
              </div>
              <div className="space-y-2">
                {MOCK_RECENT_NOTES.map((note, i) => (
                  <button
                    key={i}
                    onClick={() => handleNav('/student/notes')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#FAFAFA] transition-colors text-left group"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: '#FFFBF0', border: '1px solid #F4C43033' }}
                    >
                      <BookMarked size={15} style={{ color: '#F4C430' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#262626] truncate">{note.chapter}</div>
                      <div className="text-xs text-[#A3A3A3] mt-0.5">{note.subject} · {note.date}</div>
                    </div>
                    <ArrowRight size={14} className="text-[#D4D4D4] group-hover:text-[#737373] transition-colors shrink-0" />
                  </button>
                ))}
              </div>
              <button
                onClick={() => handleNav('/student/notes')}
                className="btn btn-ghost btn-sm w-full mt-3"
              >
                View all notes
              </button>
            </div>
          </div>

          {/* ── Attendance summary ── */}
          <div className="card card-elevated">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#111111]">Attendance Overview</h2>
              <button
                onClick={() => handleNav('/student/attendance')}
                className="text-xs text-[#737373] hover:text-[#111111] flex items-center gap-1 transition-colors"
              >
                View history <ChevronRight size={12} />
              </button>
            </div>
            <div className="flex items-center gap-6">
              {/* Big pct */}
              <div className="relative w-20 h-20 shrink-0">
                <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
                  <circle cx="40" cy="40" r="33" fill="none" stroke="#F5F5F5" strokeWidth="7" />
                  <circle
                    cx="40" cy="40" r="33" fill="none"
                    stroke={attendancePct >= 75 ? '#22c55e' : attendancePct >= 60 ? '#F4C430' : '#ef4444'}
                    strokeWidth="7"
                    strokeDasharray={`${2 * Math.PI * 33}`}
                    strokeDashoffset={`${2 * Math.PI * 33 * (1 - attendancePct / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-extrabold text-[#111111]">{attendancePct}%</span>
                </div>
              </div>
              {/* Details */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={15} className="text-[#22c55e] shrink-0" />
                  <span className="text-sm text-[#525252]">Attended: <strong className="text-[#111111]">{MOCK_ATTENDANCE.attended}</strong> classes</span>
                </div>
                <div className="flex items-center gap-3">
                  <Circle size={15} className="text-[#D4D4D4] shrink-0" />
                  <span className="text-sm text-[#525252]">Missed: <strong className="text-[#111111]">{MOCK_ATTENDANCE.total - MOCK_ATTENDANCE.attended}</strong> classes</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={15} className="text-[#F4C430] shrink-0" />
                  <span className="text-sm text-[#525252]">Total scheduled: <strong className="text-[#111111]">{MOCK_ATTENDANCE.total}</strong> classes</span>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default StudentDashboardPage;
