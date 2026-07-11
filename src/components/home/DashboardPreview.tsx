import React from 'react';
import {
  LayoutDashboard, BookOpen, Calendar, Bell, Search, Clock, Play, RotateCcw
} from 'lucide-react';
import Logo from '../ui/Logo';

const DashboardPreview: React.FC = () => {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-[#E5E5E5] hidden md:block"
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
          <div className="bg-[#F5F5F5] rounded-md px-3 py-1 text-[10px] text-[#737373] max-w-[240px] mx-auto text-center font-medium">
            app.scholario.pk/student/dashboard
          </div>
        </div>
      </div>

      {/* Dashboard layout */}
      <div className="flex h-full" style={{ height: 'calc(100% - 44px)' }}>
        
        {/* Sidebar */}
        <div className="w-[200px] shrink-0 bg-[#111111] flex flex-col py-5 px-4" style={{ minWidth: 200 }}>
          
          {/* Logo */}
          <Logo size="sm" variant="full" darkMode className="mb-8" />

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 flex-1">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white font-bold bg-[#1F1F1F] text-[11px] cursor-pointer">
              <LayoutDashboard size={14} className="text-[#F4C430]" />
              <span>Dashboard</span>
            </div>
            
            <div className="flex items-center gap-3 px-3 py-2.5 text-[#737373] hover:text-white font-semibold text-[11px] cursor-pointer">
              <BookOpen size={14} />
              <span>Notes</span>
            </div>

            <div className="flex items-center gap-3 px-3 py-2.5 text-[#737373] hover:text-white font-semibold text-[11px] cursor-pointer">
              <Calendar size={14} />
              <span>Schedule</span>
            </div>

            <div className="flex items-center gap-3 px-3 py-2.5 text-[#737373] hover:text-white font-semibold text-[11px] cursor-pointer">
              <Bell size={14} />
              <span>Announcements</span>
            </div>

            <div className="flex items-center gap-3 px-3 py-2.5 text-[#404040] font-semibold text-[11px] cursor-default">
              <BookOpen size={14} />
              <span>Attendance (Coming Soon)</span>
            </div>
          </nav>

          {/* Profile at Bottom */}
          <div className="flex items-center gap-2.5 pt-3 border-t border-[#1F1F1F]">
            <div className="w-7 h-7 rounded-full bg-[#F4C430] flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-[#111111]">D</span>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-white font-semibold truncate leading-tight">Dev Student</div>
            </div>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 overflow-hidden flex flex-col bg-white">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-[#F5F5F5]">
            <div className="relative flex items-center bg-[#F5F5F5] rounded-xl px-3 py-1.5 w-64">
              <Search size={12} className="text-[#737373] shrink-0 mr-2" />
              <span className="text-[10.5px] text-[#A3A3A3]">Search notes, schedule...</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#FAFAFA] border border-[#F0F0F0] relative">
                <Bell size={13} className="text-[#525252]" />
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
              </div>
              <div className="w-8 h-8 rounded-xl bg-[#FDF3C8] text-[#D4A017] flex items-center justify-center shrink-0 border border-[#FDF3C8] font-bold text-xs">
                D
              </div>
            </div>
          </div>

          {/* Inner Content Grid */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            
            {/* Title Block */}
            <div>
              <h2 className="text-[18px] font-extrabold text-[#111111] leading-tight">Good afternoon, Dev 👋</h2>
              <p className="text-[11px] text-[#737373] mt-0.5 font-medium">Here's your study overview for today.</p>
            </div>

            {/* First Row of Cards */}
            <div className="grid grid-cols-4 gap-4">
              
              {/* Day Streak */}
              <div className="bg-white rounded-2xl border border-[#E5E5E5] p-4 flex flex-col justify-between h-[115px] relative">
                <span className="absolute top-4 right-4 text-base">🔥</span>
                <div>
                  <span className="text-[9px] font-bold text-[#A3A3A3] uppercase tracking-wider block">Day Streak</span>
                  <span className="text-[28px] font-extrabold text-[#111111] leading-tight block mt-1">7</span>
                  <span className="text-[10px] text-[#737373] font-medium">days in a row</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F5F5F5]">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                      <div key={bar} className="w-3.5 h-1.5 rounded-full bg-[#F4C430]" />
                    ))}
                  </div>
                  <span className="text-[8px] font-bold text-[#A3A3A3]">PB: 12d</span>
                </div>
              </div>

              {/* Classes Left */}
              <div className="bg-white rounded-2xl border border-[#E5E5E5] p-4 flex justify-between items-center h-[115px] relative">
                <div>
                  <span className="text-[9px] font-bold text-[#A3A3A3] uppercase tracking-wider block">Classes Left</span>
                  <span className="text-[28px] font-extrabold text-[#111111] leading-tight block mt-1">34</span>
                  <span className="text-[9px] text-[#A3A3A3] font-semibold block">of 48 total</span>
                  <span className="text-[8.5px] text-[#737373] font-medium mt-1 block">14 attended so far</span>
                </div>
                
                {/* Circular indicator */}
                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="24" cy="24" r="20" stroke="#F5F5F5" strokeWidth="3.5" fill="transparent" />
                    <circle cx="24" cy="24" r="20" stroke="#F4C430" strokeWidth="3.5" fill="transparent" strokeDasharray="125" strokeDashoffset="36" strokeLinecap="round" />
                  </svg>
                  <span className="absolute text-[10px] font-bold text-[#111111]">71%</span>
                </div>
              </div>

              {/* Next Class */}
              <div className="bg-white rounded-2xl border border-[#E5E5E5] p-4 flex flex-col justify-between h-[115px] relative">
                <span className="absolute top-4 right-4 text-[8px] font-bold px-2 py-0.5 rounded-full bg-[#FFFBF0] text-[#D4A017] border border-[#FDF3C8]">
                  in 27h 36m
                </span>
                <div>
                  <span className="text-[9px] font-bold text-[#A3A3A3] uppercase tracking-wider block">Next Class</span>
                  <span className="text-[15px] font-extrabold text-[#111111] leading-tight block mt-2 truncate">Mathematics</span>
                  <span className="text-[10px] text-[#737373] font-medium block">Mr. Ahmad Khan</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-[#737373] mt-2 pt-2 border-t border-[#F5F5F5]">
                  <Clock size={10} className="text-[#A3A3A3]" />
                  <span>4:00 PM</span>
                  <span className="text-[#D4D4D4]">•</span>
                  <span>Fbise · Gr. 10</span>
                </div>
              </div>

              {/* Pomodoro Timer */}
              <div className="bg-white rounded-2xl border border-[#E5E5E5] p-3.5 flex flex-col justify-between h-[115px] relative text-center">
                {/* Mode toggle */}
                <div className="flex justify-center bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg p-0.5 text-[8.5px]">
                  <span className="flex-1 py-0.5 font-bold rounded-md bg-white border border-[#E5E5E5] text-[#111111] flex items-center justify-center gap-1 shadow-sm">
                    <span>🍅</span> Focus
                  </span>
                  <span className="flex-1 py-0.5 font-semibold text-[#A3A3A3] flex items-center justify-center gap-1 cursor-pointer">
                    <span>☕</span> Break
                  </span>
                </div>

                <div className="my-1">
                  <span className="text-[20px] font-extrabold text-[#111111] tracking-tight block leading-none">25:00</span>
                  <span className="text-[7.5px] font-bold text-[#A3A3A3] uppercase tracking-widest mt-0.5 block">Focus</span>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-[#F5F5F5]">
                  <RotateCcw size={10} className="text-[#A3A3A3] cursor-pointer" />
                  <div className="w-5 h-5 rounded-full bg-[#F4C430] flex items-center justify-center text-[#111111] cursor-pointer">
                    <Play size={8} fill="currentColor" />
                  </div>
                  <span className="text-[8px] font-bold text-[#A3A3A3]">0 sessions</span>
                </div>
              </div>

            </div>

            {/* Second Row Grid */}
            <div className="grid grid-cols-5 gap-4">
              
              {/* Today's Classes list */}
              <div className="col-span-3 bg-white rounded-2xl border border-[#E5E5E5] p-4 h-[130px] flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2 border-b border-[#F5F5F5]">
                  <span className="text-[11px] font-extrabold text-[#111111]">Today's Classes</span>
                  <span className="text-[9px] text-[#A3A3A3] font-bold cursor-pointer">Full schedule &gt;</span>
                </div>
                
                <div className="flex-1 flex items-center justify-center py-2">
                  <div className="text-center text-[#A3A3A3] text-xs py-3">
                    <div className="w-7 h-7 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto border border-green-100 mb-1.5">
                      ✓
                    </div>
                    No classes scheduled for today.
                  </div>
                </div>
              </div>

              {/* Recent Notes */}
              <div className="col-span-2 bg-white rounded-2xl border border-[#E5E5E5] p-4 h-[130px] flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2 border-b border-[#F5F5F5]">
                  <span className="text-[11px] font-extrabold text-[#111111]">Recent Notes</span>
                  <span className="text-[9px] text-[#A3A3A3] font-bold cursor-pointer">Notes library &gt;</span>
                </div>

                <div className="flex-grow flex items-center mt-2.5">
                  <div className="w-full flex items-center justify-between p-2 rounded-xl bg-[#FAFAFA] border border-[#F5F5F5] cursor-pointer hover:border-[#D4D4D4] transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#FFFBF0] flex items-center justify-center shrink-0 border border-[#FDF3C8]">
                        <span className="text-xs">📔</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9.5px] font-bold text-[#111111] truncate">Chapter 4 — Algebraic Expressions</div>
                        <div className="text-[8.5px] text-[#737373] mt-0.5 truncate">Mathematics · Exercise 4.1 & 4.2 Solved Examples</div>
                      </div>
                    </div>
                    <span className="text-[#A3A3A3] text-[10px] shrink-0 font-bold ml-1">&gt;</span>
                  </div>
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
