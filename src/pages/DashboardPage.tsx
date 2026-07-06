import React, { useState } from 'react';
import {
  LayoutDashboard, BookOpen, Users, Calendar, Award, Settings,
  Bell, Search, TrendingUp, ChevronRight, Play, Clock,
  BarChart2, ArrowUpRight, FileText,
  MessageSquare, Zap, Menu, X, ChevronDown, MoreHorizontal, ShieldCheck, Home
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true, badge: null },
  { icon: BookOpen, label: 'My Courses', active: false, badge: '12' },
  { icon: Users, label: 'Students', active: false, badge: null },
  { icon: Calendar, label: 'Schedule', active: false, badge: '3' },
  { icon: Award, label: 'Grades', active: false, badge: null },
  { icon: FileText, label: 'Assignments', active: false, badge: '5' },
  { icon: MessageSquare, label: 'Messages', active: false, badge: '2' },
  { icon: BarChart2, label: 'Analytics', active: false, badge: null },
];

const stats = [
  {
    label: 'Total Students',
    value: '2,847',
    change: '+12%',
    changeLabel: 'vs last month',
    positive: true,
    icon: Users,
    color: '#3b82f6',
    bg: '#EFF6FF',
  },
  {
    label: 'Active Courses',
    value: '48',
    change: '+3',
    changeLabel: 'new this month',
    positive: true,
    icon: BookOpen,
    color: '#F4C430',
    bg: '#FFFBF0',
  },
  {
    label: 'Completion Rate',
    value: '87%',
    change: '+4%',
    changeLabel: 'improvement',
    positive: true,
    icon: TrendingUp,
    color: '#22c55e',
    bg: '#F0FDF4',
  },
  {
    label: 'Certificates Issued',
    value: '1,293',
    change: '+89',
    changeLabel: 'this month',
    positive: true,
    icon: Award,
    color: '#a855f7',
    bg: '#FAF5FF',
  },
];

const courses = [
  { name: 'Mathematics — Grade 10', students: 64, progress: 78, status: 'Active', color: '#F4C430' },
  { name: 'Physics — Grade 11', students: 38, progress: 55, status: 'Active', color: '#3b82f6' },
  { name: 'English Literature', students: 52, progress: 91, status: 'Active', color: '#22c55e' },
  { name: 'Computer Science — A Level', students: 41, progress: 43, status: 'Active', color: '#a855f7' },
  { name: 'Chemistry — Grade 12', students: 29, progress: 22, status: 'Draft', color: '#f97316' },
];

const announcements = [
  {
    title: 'Mid-term exams schedule released',
    time: '2 hours ago',
    unread: true,
    icon: '📋',
    priority: 'high',
  },
  {
    title: 'New course: Data Structures & Algorithms is now live',
    time: '5 hours ago',
    unread: true,
    icon: '🚀',
    priority: 'medium',
  },
  {
    title: 'Holiday notice — Eid ul-Adha break (June 15–20)',
    time: '1 day ago',
    unread: false,
    icon: '🎉',
    priority: 'low',
  },
  {
    title: 'Platform maintenance scheduled for Sunday 2–4 AM',
    time: '2 days ago',
    unread: false,
    icon: '⚙️',
    priority: 'low',
  },
];

const upcomingClasses = [
  { title: 'Calculus — Differentiation', time: '9:00 AM', duration: '90 min', type: 'Live', students: 64, color: '#ef4444' },
  { title: 'Physics Lab Q&A Session', time: '11:30 AM', duration: '60 min', type: 'Live', students: 38, color: '#3b82f6' },
  { title: 'CS Assignment Review', time: '2:00 PM', duration: '45 min', type: 'Recorded', students: 41, color: '#a855f7' },
];

const recentStudents = [
  { name: 'Aisha Malik', email: 'aisha@student.com', course: 'Mathematics', grade: 'A', avatar: 'AM', trend: 'up' },
  { name: 'Bilal Raza', email: 'bilal@student.com', course: 'Physics', grade: 'B+', avatar: 'BR', trend: 'up' },
  { name: 'Hina Farooq', email: 'hina@student.com', course: 'English', grade: 'A+', avatar: 'HF', trend: 'up' },
  { name: 'Omar Sheikh', email: 'omar@student.com', course: 'CS', grade: 'B', avatar: 'OS', trend: 'down' },
  { name: 'Sadia Khan', email: 'sadia@student.com', course: 'Chemistry', grade: 'C+', avatar: 'SK', trend: 'down' },
];

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
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
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2.5 cursor-pointer bg-transparent border-none">
            {/* Icon tile */}
            <div
              style={{
                width: 36,
                height: 36,
                background: '#F4C430',
                borderRadius: 9,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <polygon points="12,3 22,8 12,8 2,8" fill="#111111" />
                <path d="M5 9.5v5.5c0 1.5 3 3.5 7 3.5s7-2 7-3.5V9.5" fill="#111111" fillOpacity="0.25" stroke="#111111" strokeWidth="1.2" strokeLinejoin="round" />
                <line x1="22" y1="8" x2="22" y2="14" stroke="#111111" strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="22" cy="15" r="1.2" fill="#111111" />
                <path
                  d="M14.5 10.5C14.5 9.4 13.4 8.5 12 8.5C10.6 8.5 9.5 9.4 9.5 10.5C9.5 11.6 10.6 12.5 12 12.5C13.4 12.5 14.5 13.4 14.5 14.5C14.5 15.6 13.4 16.5 12 16.5C10.6 16.5 9.5 15.6 9.5 14.5"
                  stroke="#111111"
                  strokeWidth="1.4"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-extrabold text-white tracking-tight" style={{ letterSpacing: '-0.03em' }}>Scholario</span>
              <span className="text-[9px] text-[#525252] tracking-widest uppercase mt-0.5">Learn · Grow · Achieve</span>
            </div>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-[#525252] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Admin badge */}
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg" style={{ background: '#1F1F1F' }}>
          <div className="flex items-center gap-2">
            <ShieldCheck size={12} className="text-[#F4C430]" />
            <span className="text-[11px] font-semibold text-[#F4C430]">Admin Panel</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {/* Main section */}
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#404040] px-3 py-2 mt-1">Main</div>
          {navItems.slice(0, 4).map(({ icon: Icon, label, badge }) => (
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

          <div className="text-[10px] font-bold uppercase tracking-widest text-[#404040] px-3 py-2 mt-4">Academic</div>
          {navItems.slice(4).map(({ icon: Icon, label, badge }) => (
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
            <div className="w-8 h-8 rounded-full bg-[#F4C430] flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-[#111111]">AK</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white font-semibold leading-tight truncate">Ahmad Khan</div>
              <div className="text-xs text-[#525252]">School Administrator</div>
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
                placeholder="Search students, courses, assignments…"
                className="input pl-9 py-2 text-sm"
                style={{ fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Back to Home */}
            <button
              onClick={() => onNavigate('home')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] border border-[#E5E5E5] transition-all"
            >
              <Home size={14} />
              Back to Site
            </button>

            {/* Notifications */}
            <button className="relative p-2.5 rounded-xl border border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] transition-all">
              <Bell size={17} className="text-[#525252]" />
              <div className="notif-dot" />
            </button>

            {/* Quick Action */}
            <button className="btn btn-gold btn-sm hidden sm:flex">
              <Zap size={14} />
              New Course
            </button>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-[#111111] flex items-center justify-center cursor-pointer ml-1">
              <span className="text-xs font-bold text-[#F4C430]">AK</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 p-4 sm:p-6 space-y-6">
          {/* Welcome */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-[#111111] tracking-tight">
                Good morning, Ahmad 👋
              </h1>
              <p className="text-[#737373] text-sm mt-1">
                Monday, 14 July 2025 · Here's what's happening today
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-ghost btn-sm">
                <Calendar size={14} />
                View Schedule
              </button>
              <button className="btn btn-primary btn-sm">
                + Add Course
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(({ label, value, change, changeLabel, positive, icon: Icon, color, bg }) => (
              <div key={label} className="stat-card group">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: bg }}
                  >
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div className="flex items-center gap-1">
                    <ArrowUpRight
                      size={12}
                      style={{
                        color: positive ? '#22c55e' : '#ef4444',
                        transform: positive ? 'none' : 'rotate(90deg)',
                      }}
                    />
                    <span
                      className="text-xs font-bold"
                      style={{ color: positive ? '#22c55e' : '#ef4444' }}
                    >
                      {change}
                    </span>
                  </div>
                </div>
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
                <div className="text-[11px] text-[#A3A3A3] mt-1">{changeLabel}</div>
              </div>
            ))}
          </div>

          {/* Middle Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Courses Table */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#F5F5F5]">
                  <h2 className="font-bold text-[#111111] text-base">Active Courses</h2>
                  <button className="flex items-center gap-1 text-sm text-[#737373] hover:text-[#111111] transition-colors">
                    View all <ChevronRight size={14} />
                  </button>
                </div>
                <div className="divide-y divide-[#F5F5F5]">
                  {courses.map((course) => (
                    <div
                      key={course.name}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-[#FAFAFA] transition-colors cursor-pointer group"
                    >
                      <div
                        className="w-1.5 h-8 rounded-full shrink-0"
                        style={{ background: course.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-[#111111] truncate">{course.name}</div>
                        <div className="text-xs text-[#A3A3A3] mt-0.5">{course.students} students enrolled</div>
                      </div>
                      <div className="hidden sm:block w-28">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[#737373]">Progress</span>
                          <span className="text-xs font-semibold text-[#111111]">{course.progress}%</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${course.progress}%`, background: course.color }}
                          />
                        </div>
                      </div>
                      <span
                        className={`badge shrink-0 ${
                          course.status === 'Active' ? 'badge-green' : 'badge-gray'
                        }`}
                      >
                        {course.status}
                      </span>
                      <MoreHorizontal
                        size={16}
                        className="text-[#D4D4D4] group-hover:text-[#737373] transition-colors shrink-0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Announcements */}
            <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#F5F5F5]">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-[#111111] text-base">Announcements</h2>
                  <span className="badge badge-gold">2 new</span>
                </div>
                <button className="text-sm text-[#737373] hover:text-[#111111]">+ Post</button>
              </div>
              <div className="divide-y divide-[#F5F5F5]">
                {announcements.map((a, i) => (
                  <div
                    key={i}
                    className="flex gap-3 px-5 py-4 hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                  >
                    <span className="text-xl shrink-0 mt-0.5">{a.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm leading-snug ${
                          a.unread ? 'font-semibold text-[#111111]' : 'font-medium text-[#525252]'
                        }`}
                      >
                        {a.title}
                      </div>
                      <div className="text-xs text-[#A3A3A3] mt-1">{a.time}</div>
                    </div>
                    {a.unread && (
                      <div className="w-2 h-2 rounded-full bg-[#F4C430] shrink-0 mt-2" />
                    )}
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
                        <span className="flex items-center gap-1 text-xs text-[#A3A3A3]">
                          <Users size={11} /> {cls.students}
                        </span>
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

            {/* Recent Students */}
            <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#F5F5F5]">
                <h2 className="font-bold text-[#111111] text-base">Recent Students</h2>
                <button className="flex items-center gap-1 text-sm text-[#737373] hover:text-[#111111] transition-colors">
                  All Students <ChevronRight size={14} />
                </button>
              </div>
              <div className="divide-y divide-[#F5F5F5]">
                {recentStudents.map((student, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#F5F5F5] flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[#737373]">{student.avatar}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-[#111111]">{student.name}</div>
                      <div className="text-xs text-[#A3A3A3]">{student.course}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-sm font-bold"
                        style={{
                          color: ['A+', 'A'].includes(student.grade)
                            ? '#22c55e'
                            : student.grade.startsWith('B')
                            ? '#3b82f6'
                            : '#f97316',
                        }}
                      >
                        {student.grade}
                      </span>
                      <ArrowUpRight
                        size={14}
                        style={{
                          color: student.trend === 'up' ? '#22c55e' : '#ef4444',
                          transform: student.trend === 'down' ? 'rotate(90deg)' : 'none',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Overview */}
          <div className="bg-[#111111] rounded-2xl p-6 md:p-8 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white opacity-[0.02] pointer-events-none" />
            <div className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full bg-white opacity-[0.02] pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <div className="text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: '#F4C430' }}>
                  Performance Overview
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  Platform Health — July 2025
                </h2>
              </div>
              <button className="btn btn-gold btn-sm self-start md:self-auto">
                Full Analytics Report →
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { label: 'Avg. Session Duration', value: '28 min', sub: 'per student', positive: true },
                { label: 'Student Satisfaction', value: '4.9★', sub: 'from 1,240 ratings', positive: true },
                { label: 'Content Engagement', value: '73%', sub: 'videos watched fully', positive: true },
                { label: 'At-Risk Students', value: '42', sub: 'flagged this month', positive: false },
              ].map(({ label, value, sub, positive }) => (
                <div key={label} className="p-4 rounded-xl border border-[#1F1F1F] hover:border-[#262626] transition-colors">
                  <div className="text-2xl font-extrabold text-white tracking-tight mb-1">{value}</div>
                  <div className="text-xs font-semibold text-[#525252] mb-0.5 uppercase tracking-wide">{label}</div>
                  <div className="flex items-center gap-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: positive ? '#22c55e' : '#ef4444' }}
                    />
                    <span className="text-xs text-[#525252]">{sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
