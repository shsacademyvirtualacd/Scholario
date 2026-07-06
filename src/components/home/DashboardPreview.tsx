import React from 'react';
import {
  BookOpen, Users, TrendingUp, Award, Bell, Search,
  Clock, BarChart2, ChevronRight,
  Calendar, Star, ArrowUpRight
} from 'lucide-react';

const DashboardPreview: React.FC = () => {
  const stats = [
    { label: 'Active Students', value: '2,847', change: '+12%', icon: Users, color: '#3b82f6' },
    { label: 'Courses Active', value: '48', change: '+3', icon: BookOpen, color: '#F4C430' },
    { label: 'Completion Rate', value: '87%', change: '+4%', icon: TrendingUp, color: '#22c55e' },
    { label: 'Certificates', value: '1,293', change: '+89', icon: Award, color: '#a855f7' },
  ];

  const courses = [
    { name: 'Mathematics — Grade 10', students: 64, progress: 78, color: '#F4C430' },
    { name: 'Physics — Grade 11', students: 38, progress: 55, color: '#3b82f6' },
    { name: 'English Literature', students: 52, progress: 91, color: '#22c55e' },
    { name: 'Computer Science', students: 41, progress: 43, color: '#a855f7' },
  ];

  const upcoming = [
    { title: 'Calculus — Live Session', time: '9:00 AM', tag: 'Live', tagColor: '#ef4444' },
    { title: 'Physics Lab Report Due', time: '11:59 PM', tag: 'Deadline', tagColor: '#f97316' },
    { title: 'CS Mock Exam', time: '2:00 PM', tag: 'Exam', tagColor: '#3b82f6' },
  ];

  const announcements = [
    { title: 'Mid-term exams schedule released', time: '2h ago', unread: true },
    { title: 'New course: Data Structures & Algorithms', time: '5h ago', unread: true },
    { title: 'Holiday notice — Eid ul-Adha break', time: '1d ago', unread: false },
  ];

  const navItems = [
    { icon: BarChart2, label: 'Dashboard', active: true },
    { icon: BookOpen, label: 'Courses', active: false },
    { icon: Users, label: 'Students', active: false },
    { icon: Calendar, label: 'Schedule', active: false },
    { icon: Award, label: 'Grades', active: false },
  ];

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-[#E5E5E5]"
      style={{
        background: '#FAFAFA',
        aspectRatio: '16/10',
        maxHeight: 560,
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#E5E5E5]" style={{ minHeight: 44 }}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 mx-3">
          <div className="bg-[#F5F5F5] rounded-md px-3 py-1 text-[10px] text-[#737373] max-w-[200px] mx-auto text-center">
            app.scholario.pk/dashboard
          </div>
        </div>
      </div>

      {/* Dashboard layout */}
      <div className="flex h-full" style={{ height: 'calc(100% - 44px)' }}>
        {/* Sidebar */}
        <div className="w-[180px] shrink-0 bg-[#111111] flex flex-col py-4 px-3" style={{ minWidth: 180 }}>
          {/* Logo */}
          <div className="flex items-center gap-2 px-2 mb-6">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#F4C430' }}>
              <span className="text-[10px] font-extrabold text-[#111111]">S</span>
            </div>
            <span className="text-white text-xs font-bold tracking-tight">Scholario</span>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-0.5 flex-1">
            {navItems.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all"
                style={{
                  background: active ? '#1F1F1F' : 'transparent',
                  color: active ? '#F4C430' : '#737373',
                }}
              >
                <Icon size={13} />
                <span className="text-[11px] font-medium">{label}</span>
              </div>
            ))}
          </nav>

          {/* User */}
          <div className="flex items-center gap-2 px-2 pt-3 border-t border-[#262626]">
            <div className="w-6 h-6 rounded-full bg-[#F4C430] flex items-center justify-center shrink-0">
              <span className="text-[9px] font-bold text-[#111111]">AK</span>
            </div>
            <div>
              <div className="text-[10px] text-white font-semibold leading-tight">Ahmad Khan</div>
              <div className="text-[9px] text-[#525252]">Educator</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-[#F0F0F0]">
            <div>
              <div className="text-[12px] font-bold text-[#111111]">Good morning, Ahmad 👋</div>
              <div className="text-[10px] text-[#737373]">Monday, 14 July 2025</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#F5F5F5] rounded-lg px-2.5 py-1.5">
                <Search size={11} className="text-[#A3A3A3]" />
                <span className="text-[10px] text-[#A3A3A3]">Search...</span>
              </div>
              <div className="relative w-7 h-7 flex items-center justify-center rounded-lg bg-[#F5F5F5]">
                <Bell size={13} className="text-[#525252]" />
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#F4C430]" />
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ fontSize: '10px' }}>
            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-3">
              {stats.map(({ label, value, change, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-xl border border-[#F0F0F0] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                      <Icon size={12} style={{ color }} />
                    </div>
                    <span className="text-[9px] font-semibold" style={{ color: '#22c55e' }}>{change}</span>
                  </div>
                  <div className="text-[15px] font-extrabold text-[#111111] leading-tight">{value}</div>
                  <div className="text-[9px] text-[#737373] mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Middle Row */}
            <div className="grid grid-cols-5 gap-3">
              {/* Courses */}
              <div className="col-span-3 bg-white rounded-xl border border-[#F0F0F0] p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-[#111111]">Active Courses</span>
                  <button className="flex items-center gap-1 text-[9px] text-[#737373] hover:text-[#111111]">
                    View all <ChevronRight size={10} />
                  </button>
                </div>
                <div className="space-y-2.5">
                  {courses.map((course) => (
                    <div key={course.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium text-[#262626] truncate mr-2">{course.name}</span>
                        <span className="text-[9px] text-[#737373] shrink-0">{course.students} students</span>
                      </div>
                      <div className="h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${course.progress}%`, background: course.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming */}
              <div className="col-span-2 bg-white rounded-xl border border-[#F0F0F0] p-3">
                <div className="text-[11px] font-bold text-[#111111] mb-3">Today's Schedule</div>
                <div className="space-y-2">
                  {upcoming.map((item) => (
                    <div key={item.title} className="flex items-start gap-2">
                      <div className="w-1 h-full min-h-[32px] rounded-full shrink-0" style={{ background: item.tagColor }} />
                      <div>
                        <div className="text-[9.5px] font-semibold text-[#262626] leading-tight">{item.title}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock size={8} className="text-[#A3A3A3]" />
                          <span className="text-[8.5px] text-[#737373]">{item.time}</span>
                          <span
                            className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: `${item.tagColor}18`, color: item.tagColor }}
                          >
                            {item.tag}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Announcements */}
              <div className="bg-white rounded-xl border border-[#F0F0F0] p-3">
                <div className="text-[11px] font-bold text-[#111111] mb-3">Announcements</div>
                <div className="space-y-2">
                  {announcements.map((item) => (
                    <div key={item.title} className="flex items-start gap-2">
                      {item.unread && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#F4C430] shrink-0 mt-1" />
                      )}
                      <div className={item.unread ? '' : 'ml-3.5'}>
                        <div className="text-[10px] font-medium text-[#262626] leading-tight">{item.title}</div>
                        <div className="text-[8.5px] text-[#A3A3A3] mt-0.5">{item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-[#111111] rounded-xl p-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-5 bg-white -translate-y-4 translate-x-4" />
                <div className="text-[11px] font-bold text-white mb-1">Platform Performance</div>
                <div className="text-[9px] text-[#525252] mb-3">Last 30 days</div>
                <div className="space-y-2">
                  {[
                    { label: 'Avg. Session', value: '28 min', icon: Clock },
                    { label: 'Satisfaction', value: '4.9 ★', icon: Star },
                    { label: 'Engagement', value: '+18%', icon: ArrowUpRight },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Icon size={9} style={{ color: '#F4C430' }} />
                        <span className="text-[9px] text-[#737373]">{label}</span>
                      </div>
                      <span className="text-[10px] font-bold text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPreview;
