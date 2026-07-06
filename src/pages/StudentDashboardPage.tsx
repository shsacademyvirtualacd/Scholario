import React, { useState } from 'react';
import {
  LayoutDashboard, BookOpen, Calendar, Award, FileText,
  Bell, Search, ChevronRight, Play, Clock,
  ArrowUpRight, MessageSquare, Settings,
  Menu, X, ChevronDown, Star, CheckCircle2, Circle, Flame,
} from 'lucide-react';

const studentNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', badge: null },
  { icon: BookOpen, label: 'My Courses', badge: '6' },
  { icon: Calendar, label: 'Schedule', badge: '2' },
  { icon: FileText, label: 'Assignments', badge: '3' },
  { icon: Award, label: 'Grades', badge: null },
  { icon: MessageSquare, label: 'Messages', badge: '1' },
];

const enrolledCourses = [
  { name: 'Mathematics — Grade 10', instructor: 'Mr. Ahmad Khan', progress: 78, total: 48, completed: 37, color: '#F4C430', nextLesson: 'Differential Equations' },
  { name: 'Physics — Grade 11', instructor: 'Ms. Sara Ali', progress: 55, total: 32, completed: 18, color: '#3b82f6', nextLesson: "Newton's Laws" },
  { name: 'English Literature', instructor: 'Mr. Usman Shah', progress: 91, total: 24, completed: 22, color: '#22c55e', nextLesson: 'Hamlet — Act III' },
  { name: 'Computer Science — A Level', instructor: 'Ms. Nadia Iqbal', progress: 43, total: 56, completed: 24, color: '#a855f7', nextLesson: 'Data Structures' },
];

const upcomingClasses = [
  { title: 'Calculus — Differentiation', time: '9:00 AM', duration: '90 min', type: 'Live', instructor: 'Mr. Ahmad', color: '#ef4444' },
  { title: 'Physics Lab Q&A Session', time: '11:30 AM', duration: '60 min', type: 'Live', instructor: 'Ms. Sara', color: '#3b82f6' },
  { title: 'CS Lecture — Binary Trees', time: '2:00 PM', duration: '45 min', type: 'Recorded', instructor: 'Ms. Nadia', color: '#a855f7' },
];

const assignments = [
  { title: 'Math Problem Set 7', course: 'Mathematics', due: 'Due Tomorrow', status: 'pending', priority: 'high' },
  { title: 'Physics Lab Report', course: 'Physics', due: 'Due in 3 days', status: 'pending', priority: 'medium' },
  { title: 'Essay: Hamlet Themes', course: 'English', due: 'Submitted', status: 'done', priority: 'low' },
  { title: 'CS Binary Trees Quiz', course: 'Computer Science', due: 'Due in 5 days', status: 'pending', priority: 'medium' },
];

const grades = [
  { subject: 'Mathematics', grade: 'A', score: 92, trend: 'up' },
  { subject: 'Physics', grade: 'B+', score: 84, trend: 'up' },
  { subject: 'English', grade: 'A+', score: 97, trend: 'up' },
  { subject: 'Computer Science', grade: 'B', score: 79, trend: 'down' },
];

interface StudentDashboardPageProps {
  onNavigate: (page: string) => void;
}

const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({ onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Dashboard');

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#111111] flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-[#1F1F1F]">
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F4C430' }}>
              <svg width="20" height="20" viewBox="0 0 100 100" fill="none">
                <polygon points="50,8 90,28 50,28 10,28" fill="#111111" />
                <path d="M22 86 Q22 78 30 76 L50 72 L70 76 Q78 78 78 86 L78 92 L22 92 Z" fill="#111111" />
                <path d="M50 72 L50 92" stroke="#F4C430" strokeWidth="2" />
                <path
                  d="M62 38 C62 33 57 29 50 29 C43 29 38 33 38 38 C38 43 43 47 50 47 L50 53 C43 53 38 57 38 62 C38 67 43 71 50 71 C57 71 62 67 62 62"
                  stroke="#111111"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-extrabold text-white tracking-tight">Scholario</span>
              <span className="text-[9px] text-[#525252] tracking-widest uppercase">Learn · Grow · Achieve</span>
            </div>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-[#525252] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Student badge */}
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg" style={{ background: '#1F1F1F' }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
            <span className="text-[11px] font-semibold text-[#22c55e]">Student Portal</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#404040] px-3 py-2 mt-1">Main</div>
          {studentNavItems.map(({ icon: Icon, label, badge }) => (
            <button
              key={label}
              onClick={() => setActiveNav(label)}
              className={`sidebar-link w-full ${activeNav === label ? 'active' : ''}`}
            >
              <Icon size={16} className="sidebar-icon shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {badge && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                  style={{
                    background: activeNav === label ? '#F4C43020' : '#262626',
                    color: activeNav === label ? '#F4C430' : '#737373',
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
          ))}

          <div className="pt-4 mt-2 border-t border-[#1F1F1F]">
            <button className="sidebar-link w-full">
              <Settings size={16} className="sidebar-icon shrink-0" />
              Settings
            </button>
          </div>
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-[#1F1F1F]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#3b82f6] flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">AM</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white font-semibold leading-tight truncate">Aisha Malik</div>
              <div className="text-xs text-[#525252]">Grade 10 Student</div>
            </div>
            <ChevronDown size={14} className="text-[#525252] shrink-0" />
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-[#E5E5E5] px-4 sm:px-6 py-3.5 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-[#F5F5F5] transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
              <input
                type="text"
                placeholder="Search courses, assignments…"
                className="input pl-9 py-2 text-sm"
                style={{ fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Notifications */}
            <button className="relative p-2.5 rounded-xl border border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] transition-all">
              <Bell size={17} className="text-[#525252]" />
              <div className="notif-dot" />
            </button>

            {/* Streak */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E5E5] bg-white">
              <Flame size={14} className="text-[#f97316]" />
              <span className="text-sm font-bold text-[#111111]">14</span>
              <span className="text-xs text-[#A3A3A3]">day streak</span>
            </div>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-[#3b82f6] flex items-center justify-center cursor-pointer ml-1">
              <span className="text-xs font-bold text-white">AM</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 p-4 sm:p-6 space-y-6">
          {/* Welcome */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-[#111111] tracking-tight">
                Good morning, Aisha 👋
              </h1>
              <p className="text-[#737373] text-sm mt-1">
                Monday, 14 July 2025 · You have 3 classes today
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-ghost btn-sm">
                <Calendar size={14} />
                My Schedule
              </button>
              <button className="btn btn-primary btn-sm">
                Continue Learning →
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Courses Enrolled', value: '6', change: '2 in progress', icon: BookOpen, color: '#F4C430', bg: '#FFFBF0' },
              { label: 'Assignments Due', value: '3', change: '1 due tomorrow', icon: FileText, color: '#ef4444', bg: '#FEF2F2' },
              { label: 'Average Grade', value: 'A−', change: '+0.3 GPA this term', icon: Award, color: '#22c55e', bg: '#F0FDF4' },
              { label: 'Study Streak', value: '14d', change: 'Personal best!', icon: Flame, color: '#f97316', bg: '#FFF7ED' },
            ].map(({ label, value, change, icon: Icon, color, bg }) => (
              <div key={label} className="stat-card group">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: bg }}
                  >
                    <Icon size={18} style={{ color }} />
                  </div>
                  <ArrowUpRight size={12} style={{ color: '#22c55e' }} />
                </div>
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
                <div className="text-[11px] text-[#A3A3A3] mt-1">{change}</div>
              </div>
            ))}
          </div>

          {/* Middle Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* My Courses */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#F5F5F5]">
                  <h2 className="font-bold text-[#111111] text-base">My Courses</h2>
                  <button className="flex items-center gap-1 text-sm text-[#737373] hover:text-[#111111] transition-colors">
                    View all <ChevronRight size={14} />
                  </button>
                </div>
                <div className="divide-y divide-[#F5F5F5]">
                  {enrolledCourses.map((course) => (
                    <div
                      key={course.name}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-[#FAFAFA] transition-colors cursor-pointer group"
                    >
                      <div
                        className="w-1.5 h-10 rounded-full shrink-0"
                        style={{ background: course.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-[#111111] truncate">{course.name}</div>
                        <div className="text-xs text-[#A3A3A3] mt-0.5">{course.instructor}</div>
                        <div className="text-xs text-[#A3A3A3] mt-0.5">Next: {course.nextLesson}</div>
                      </div>
                      <div className="hidden sm:block w-28">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[#737373]">{course.completed}/{course.total}</span>
                          <span className="text-xs font-semibold text-[#111111]">{course.progress}%</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${course.progress}%`, background: course.color }}
                          />
                        </div>
                      </div>
                      <button
                        className="btn btn-sm opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        style={{ background: course.color + '20', color: course.color, border: `1px solid ${course.color}40` }}
                      >
                        <Play size={12} /> Resume
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Assignments */}
            <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#F5F5F5]">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-[#111111] text-base">Assignments</h2>
                  <span className="badge badge-red">3 pending</span>
                </div>
              </div>
              <div className="divide-y divide-[#F5F5F5]">
                {assignments.map((a, i) => (
                  <div
                    key={i}
                    className="flex gap-3 px-5 py-4 hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                  >
                    {a.status === 'done'
                      ? <CheckCircle2 size={18} className="text-[#22c55e] shrink-0 mt-0.5" />
                      : <Circle size={18} className={`shrink-0 mt-0.5 ${a.priority === 'high' ? 'text-[#ef4444]' : 'text-[#A3A3A3]'}`} />
                    }
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm leading-snug ${
                          a.status === 'done' ? 'line-through text-[#A3A3A3]' : 'font-semibold text-[#111111]'
                        }`}
                      >
                        {a.title}
                      </div>
                      <div className="text-xs text-[#A3A3A3] mt-1">{a.course}</div>
                      <div
                        className={`text-xs font-semibold mt-1 ${
                          a.due.includes('Tomorrow') ? 'text-[#ef4444]' :
                          a.due === 'Submitted' ? 'text-[#22c55e]' : 'text-[#737373]'
                        }`}
                      >
                        {a.due}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Today's Classes */}
            <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#F5F5F5]">
                <h2 className="font-bold text-[#111111] text-base">Today's Classes</h2>
                <button className="btn btn-ghost btn-sm text-xs">
                  Full Schedule
                </button>
              </div>
              <div className="p-4 space-y-3">
                {upcomingClasses.map((cls, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-xl border border-[#F5F5F5] hover:border-[#E5E5E5] hover:bg-[#FAFAFA] transition-all cursor-pointer group"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${cls.color}15` }}
                    >
                      {cls.type === 'Live'
                        ? <Play size={16} style={{ color: cls.color }} />
                        : <BookOpen size={16} style={{ color: cls.color }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-[#111111] truncate">{cls.title}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-[#A3A3A3]">
                          <Clock size={11} /> {cls.time}
                        </span>
                        <span className="text-xs text-[#A3A3A3]">{cls.instructor}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="badge text-[10px]"
                        style={{
                          background: `${cls.color}15`,
                          color: cls.color,
                          border: `1px solid ${cls.color}30`,
                        }}
                      >
                        {cls.type}
                      </span>
                      {cls.type === 'Live' && (
                        <button className="btn btn-primary btn-sm text-xs py-1 px-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          Join
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grades */}
            <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#F5F5F5]">
                <h2 className="font-bold text-[#111111] text-base">My Grades</h2>
                <button className="flex items-center gap-1 text-sm text-[#737373] hover:text-[#111111] transition-colors">
                  Full Report <ChevronRight size={14} />
                </button>
              </div>
              <div className="divide-y divide-[#F5F5F5]">
                {grades.map((g, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-[#FAFAFA] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-[#111111]">{g.subject}</div>
                      <div className="mt-1.5">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${g.score}%`,
                              background: g.score >= 90 ? '#22c55e' : g.score >= 80 ? '#3b82f6' : '#f97316'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-[#737373]">{g.score}%</span>
                      <span
                        className="text-base font-extrabold w-10 text-center"
                        style={{
                          color: ['A+', 'A'].includes(g.grade) ? '#22c55e' : g.grade.startsWith('B') ? '#3b82f6' : '#f97316',
                        }}
                      >
                        {g.grade}
                      </span>
                      <ArrowUpRight
                        size={14}
                        style={{
                          color: g.trend === 'up' ? '#22c55e' : '#ef4444',
                          transform: g.trend === 'down' ? 'rotate(90deg)' : 'none',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Achievement Banner */}
          <div className="bg-[#111111] rounded-2xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white opacity-[0.02] pointer-events-none" />
            <div className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full bg-[#F4C430] opacity-[0.04] pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
              <div>
                <div className="text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: '#F4C430' }}>
                  Your Achievements
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  Keep it up, Aisha!
                </h2>
                <p className="text-[#525252] text-sm mt-1">You are in the top 15% of your class this semester.</p>
              </div>
              <button className="btn btn-gold btn-sm self-start md:self-auto">
                View All Badges
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'XP Points', value: '4,280', sub: 'Level 12 Scholar', icon: Star },
                { label: 'Quizzes Passed', value: '34', sub: 'out of 36', icon: CheckCircle2 },
                { label: 'Class Rank', value: '#42', sub: 'top 15% in grade', icon: Award },
                { label: 'Streak Record', value: '21 days', sub: 'personal best', icon: Flame },
              ].map(({ label, value, sub, icon: Icon }) => (
                <div key={label} className="p-4 rounded-xl border border-[#1F1F1F] hover:border-[#262626] transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(244,196,48,0.1)' }}>
                    <Icon size={16} style={{ color: '#F4C430' }} />
                  </div>
                  <div className="text-xl font-extrabold text-white tracking-tight mb-0.5">{value}</div>
                  <div className="text-[10px] font-bold text-[#525252] uppercase tracking-wide">{label}</div>
                  <div className="text-xs text-[#404040] mt-0.5">{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboardPage;
