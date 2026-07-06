import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, BarChart2,
  Bell, Search, TrendingUp, ChevronRight, Clock,
  ArrowUpRight, BookMarked, LogOut, User,
  GraduationCap, ClipboardCheck, Menu, X,
  UserCheck, Percent, BookOpen,
} from 'lucide-react';
import Logo from '../../components/ui/Logo';
import { useAuth } from '../../features/auth/AuthContext';

// ─── Mock data (replaced with Supabase queries in Batch 4) ──────
const MOCK_STATS = [
  {
    label: 'Total Students',
    value: '142',
    change: '+8',
    changeLabel: 'this month',
    positive: true,
    icon: Users,
    color: '#3b82f6',
    bg: '#EFF6FF',
  },
  {
    label: 'Attendance Rate',
    value: '83%',
    change: '+2%',
    changeLabel: 'vs last week',
    positive: true,
    icon: Percent,
    color: '#22c55e',
    bg: '#F0FDF4',
  },
  {
    label: 'Teachers on Staff',
    value: '12',
    change: '+1',
    changeLabel: 'new this month',
    positive: true,
    icon: GraduationCap,
    color: '#F4C430',
    bg: '#FFFBF0',
  },
  {
    label: 'Classes This Week',
    value: '38',
    change: '-2',
    changeLabel: 'vs last week',
    positive: false,
    icon: Calendar,
    color: '#a855f7',
    bg: '#FAF5FF',
  },
];

const MOCK_TEACHERS = [
  { name: 'Mr. Ahmad Khan', subject: 'Mathematics', board: 'FBISE', grade: '10 & 11', students: 34, classesPerWeek: 8, avatar: 'AK' },
  { name: 'Ms. Sara Ali', subject: 'Physics', board: 'Local', grade: '9 & 11', students: 28, classesPerWeek: 6, avatar: 'SA' },
  { name: 'Mr. Usman Shah', subject: 'Chemistry', board: 'O Level', grade: 'O1 & O2', students: 22, classesPerWeek: 6, avatar: 'US' },
  { name: 'Ms. Nadia Iqbal', subject: 'Computer Science', board: 'A Level', grade: 'AS & A2', students: 18, classesPerWeek: 4, avatar: 'NI' },
  { name: 'Mr. Hassan Raza', subject: 'English', board: 'FBISE', grade: '9 & 12', students: 40, classesPerWeek: 8, avatar: 'HR' },
];

const MOCK_UPCOMING = [
  { subject: 'Mathematics Gr.10', teacher: 'Mr. Ahmad', time: '4:00 PM', board: 'FBISE', students: 18, color: '#F4C430' },
  { subject: 'Physics Gr.11', teacher: 'Ms. Sara', time: '5:30 PM', board: 'Local', students: 14, color: '#3b82f6' },
  { subject: 'Chemistry O2', teacher: 'Mr. Usman', time: '7:00 PM', board: 'O Level', students: 11, color: '#22c55e' },
];

const MOCK_LOW_ATTENDANCE = [
  { name: 'Ali Hassan', subject: 'Mathematics', pct: 58, classes: 7, total: 12 },
  { name: 'Sara Malik', subject: 'Physics', pct: 63, classes: 5, total: 8 },
  { name: 'Usman Khan', subject: 'Chemistry', pct: 67, classes: 6, total: 9 },
];

// ─── Sidebar nav ─────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',    path: '/admin' },
  { icon: Calendar,        label: 'Schedule',     path: '/admin/schedule' },
  { icon: GraduationCap,   label: 'Teachers',     path: '/admin/teachers' },
  { icon: Users,           label: 'Students',     path: '/admin/students' },
  { icon: BookMarked,      label: 'Notes',        path: '/admin/notes' },
  { icon: ClipboardCheck,  label: 'Attendance',   path: '/admin/attendance/all' },
];

// ─── Main ────────────────────────────────────────────────────────
const AdminDashboardPage: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('/admin');

  const handleNav = (path: string) => {
    setActiveNav(path);
    setSidebarOpen(false);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#111111] flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center px-5 border-b border-[#1F1F1F] shrink-0">
          <Logo size="sm" variant="full" darkMode />
        </div>

        {/* Admin badge */}
        <div className="px-4 py-2.5 border-b border-[#1F1F1F]">
          <span className="badge badge-gold text-[10px]">⚙ Admin Panel</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              onClick={() => handleNav(path)}
              className={`sidebar-link w-full ${activeNav === path ? 'active' : ''}`}
            >
              <Icon size={17} className={`sidebar-icon shrink-0 ${activeNav !== path ? 'text-[#525252]' : ''}`} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-[#1F1F1F] space-y-0.5">
          <button onClick={() => handleNav('/admin/profile')} className="sidebar-link w-full">
            <User size={17} className="sidebar-icon text-[#525252] shrink-0" />
            <div className="flex flex-col items-start">
              <span className="text-white text-xs font-semibold leading-tight">{profile?.full_name ?? 'Admin'}</span>
              <span className="text-[#525252] text-[10px]">Administrator</span>
            </div>
          </button>
          <button onClick={signOut} className="sidebar-link w-full text-[#525252] hover:text-red-400">
            <LogOut size={17} className="shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-[#E5E5E5] flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg hover:bg-[#F5F5F5]" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="relative hidden sm:block">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
              <input placeholder="Search students, teachers…" className="input pl-9 py-2 text-sm w-56 bg-[#FAFAFA] border-[#F0F0F0]" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative w-9 h-9 rounded-lg border border-[#E5E5E5] flex items-center justify-center hover:bg-[#F5F5F5]">
              <Bell size={16} className="text-[#525252]" />
              <span className="notif-dot" />
            </button>
            <div className="w-9 h-9 rounded-lg bg-[#111111] flex items-center justify-center text-sm font-bold text-[#F4C430]">
              {(profile?.full_name?.[0] ?? 'A').toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-4 sm:p-6 space-y-6">

          {/* Heading */}
          <div>
            <h1 className="text-2xl font-extrabold text-[#111111] tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-sm text-[#737373] mt-1">
              {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {MOCK_STATS.map((stat) => (
              <div key={stat.label} className="stat-card">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: stat.bg }}
                  >
                    <stat.icon size={17} style={{ color: stat.color }} />
                  </div>
                  <span className={`flex items-center gap-0.5 text-xs font-semibold ${stat.positive ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                    <ArrowUpRight size={12} style={{ transform: stat.positive ? 'none' : 'rotate(90deg)' }} />
                    {stat.change}
                  </span>
                </div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
                <div className="text-[11px] text-[#A3A3A3] mt-0.5">{stat.changeLabel}</div>
              </div>
            ))}
          </div>

          {/* ── Today's classes + Low attendance ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Today's upcoming classes */}
            <div className="card card-elevated">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-[#111111]">Today's Classes</h2>
                <button
                  onClick={() => handleNav('/admin/schedule')}
                  className="text-xs text-[#737373] hover:text-[#111111] flex items-center gap-1 transition-colors"
                >
                  Manage schedule <ChevronRight size={12} />
                </button>
              </div>
              <div className="space-y-3">
                {MOCK_UPCOMING.map((cls, i) => (
                  <div key={i} className="flex items-center gap-4 p-3.5 rounded-xl border border-[#F0F0F0] hover:border-[#E5E5E5] transition-all">
                    <div className="w-1 h-12 rounded-full shrink-0" style={{ background: cls.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-[#111111]">{cls.subject}</div>
                      <div className="text-xs text-[#737373] mt-0.5">{cls.teacher} · {cls.board}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-[#111111]">{cls.time}</div>
                      <div className="text-xs text-[#A3A3A3] mt-0.5">{cls.students} students</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Low attendance alerts */}
            <div className="card card-elevated">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-[#111111]">⚠️ Low Attendance</h2>
                <button
                  onClick={() => handleNav('/admin/students')}
                  className="text-xs text-[#737373] hover:text-[#111111] flex items-center gap-1 transition-colors"
                >
                  All students <ChevronRight size={12} />
                </button>
              </div>
              <div className="space-y-3">
                {MOCK_LOW_ATTENDANCE.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#FEF2F2] border border-[#ef444420]">
                    <div className="w-8 h-8 rounded-full bg-[#ef4444] flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {s.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#111111]">{s.name}</div>
                      <div className="text-xs text-[#737373]">{s.subject} · {s.classes}/{s.total} classes</div>
                    </div>
                    <span className="text-sm font-bold text-[#ef4444]">{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Teachers overview ── */}
          <div className="card card-elevated">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-[#111111]">Teacher Workload</h2>
              <button
                onClick={() => handleNav('/admin/teachers')}
                className="btn btn-ghost btn-sm"
              >
                Manage teachers <ChevronRight size={14} />
              </button>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Teacher</th>
                    <th>Subject</th>
                    <th>Board</th>
                    <th>Grade(s)</th>
                    <th>Students</th>
                    <th>Classes/wk</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TEACHERS.map((t, i) => (
                    <tr key={i}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#F4C430] flex items-center justify-center text-xs font-bold text-[#111111] shrink-0">
                            {t.avatar}
                          </div>
                          <span className="font-medium text-[#111111]">{t.name}</span>
                        </div>
                      </td>
                      <td>{t.subject}</td>
                      <td><span className="badge badge-gray">{t.board}</span></td>
                      <td className="text-[#525252]">{t.grade}</td>
                      <td>
                        <span className="font-semibold text-[#111111]">{t.students}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="progress-bar w-16">
                            <div className="progress-fill" style={{ width: `${(t.classesPerWeek / 10) * 100}%` }} />
                          </div>
                          <span className="text-xs text-[#737373]">{t.classesPerWeek}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
