import React, { useState } from 'react';
import {
  LayoutDashboard, BookOpen, Calendar, Bell, Search, Clock, Play, RotateCcw, Menu, Sparkles, ClipboardCheck,
  GraduationCap
} from 'lucide-react';
import Logo from '../ui/Logo';
import { useMobile } from '../../hooks/useMobile';

interface DashboardClassData {
  boardId: 'fbise' | 'sindh';
  boardName: string;
  grade: string;
  gradeLabel: string;
  studentName: string;
  stream: string;
  nextSubject: string;
  teacher: string;
  time: string;
  topic: string;
  recentNoteTitle: string;
  recentNoteSubject: string;
  recentNoteSubtitle: string;
  streak: number;
  classesLeft: number;
  classesTotal: number;
  attendedClasses: number;
  icon: string;
}

const CLASS_DASHBOARD_DATA: Record<string, DashboardClassData> = {
  // FBISE Classes
  'fbise-9': {
    boardId: 'fbise',
    boardName: 'FBISE',
    grade: '9',
    gradeLabel: 'Class 9th',
    studentName: 'Ali Raza',
    stream: 'Computer Science',
    nextSubject: 'Physics',
    teacher: 'Sir Bilal Tariq',
    time: '4:00 PM',
    topic: 'Unit 3: Dynamics & Newton\'s Laws',
    recentNoteTitle: 'Unit 3 — Dynamics & Momentum',
    recentNoteSubject: 'Physics',
    recentNoteSubtitle: 'Comprehensive Derivations & Solved Numericals',
    streak: 6,
    classesLeft: 38,
    classesTotal: 48,
    attendedClasses: 10,
    icon: '⚡',
  },
  'fbise-10': {
    boardId: 'fbise',
    boardName: 'FBISE',
    grade: '10',
    gradeLabel: 'Class 10th',
    studentName: 'Ahmed Khan',
    stream: 'Biology',
    nextSubject: 'Chemistry',
    teacher: 'Dr. Maria Siddiqui',
    time: '5:00 PM',
    topic: 'Ch 10: Chemical Equilibrium',
    recentNoteTitle: 'Chapter 10 — Law of Mass Action',
    recentNoteSubject: 'Chemistry',
    recentNoteSubtitle: 'FBISE SLOs Question Bank & Key Solutions',
    streak: 9,
    classesLeft: 32,
    classesTotal: 48,
    attendedClasses: 16,
    icon: '🧪',
  },
  'fbise-11': {
    boardId: 'fbise',
    boardName: 'FBISE',
    grade: '11',
    gradeLabel: 'Class 11th',
    studentName: 'Hamza Sheikh',
    stream: 'Pre-Engineering',
    nextSubject: 'Mathematics',
    teacher: 'Prof. Asim Mehmood',
    time: '4:30 PM',
    topic: 'Ch 4: Quadratic Equations',
    recentNoteTitle: 'Matrices & Determinants Vault',
    recentNoteSubject: 'Mathematics',
    recentNoteSubtitle: 'Higher Order Cramer\'s Rule & Inverse Proofs',
    streak: 12,
    classesLeft: 24,
    classesTotal: 48,
    attendedClasses: 24,
    icon: '📐',
  },
  'fbise-12': {
    boardId: 'fbise',
    boardName: 'FBISE',
    grade: '12',
    gradeLabel: 'Class 12th',
    studentName: 'Zainab Noor',
    stream: 'Pre-Medical',
    nextSubject: 'Biology',
    teacher: 'Dr. Farah Naz',
    time: '6:00 PM',
    topic: 'Ch 16: Support & Movement',
    recentNoteTitle: 'Ch 16 — Skeletal Anatomy Diagram Set',
    recentNoteSubject: 'Biology',
    recentNoteSubtitle: 'High-Yield Board Exam Long Questions',
    streak: 14,
    classesLeft: 18,
    classesTotal: 48,
    attendedClasses: 30,
    icon: '🧬',
  },

  // Sindh Board Classes
  'sindh-9': {
    boardId: 'sindh',
    boardName: 'Sindh Board',
    grade: '9',
    gradeLabel: 'Class 9th',
    studentName: 'Mustafa Ali',
    stream: 'Science (Bio)',
    nextSubject: 'Biology',
    teacher: 'Sir Tariq Memon',
    time: '4:00 PM',
    topic: 'Ch 2: Solving a Biological Problem',
    recentNoteTitle: 'Cellular Hierarchy & Organ Systems',
    recentNoteSubject: 'Biology',
    recentNoteSubtitle: 'Sindh Textbook Board (STBB) Aligned Notes',
    streak: 5,
    classesLeft: 40,
    classesTotal: 48,
    attendedClasses: 8,
    icon: '🔬',
  },
  'sindh-10': {
    boardId: 'sindh',
    boardName: 'Sindh Board',
    grade: '10',
    gradeLabel: 'Class 10th',
    studentName: 'Fatima Zahra',
    stream: 'Science (CS)',
    nextSubject: 'Computer Science',
    teacher: 'Engr. Kamran Shah',
    time: '5:00 PM',
    topic: 'Ch 3: Control Structures & Loops',
    recentNoteTitle: 'C++ & Python Syntax Quick Reference',
    recentNoteSubject: 'Computer Science',
    recentNoteSubtitle: 'Sindh Board Past Paper Algorithms & Flowcharts',
    streak: 8,
    classesLeft: 34,
    classesTotal: 48,
    attendedClasses: 14,
    icon: '💻',
  },
  'sindh-11': {
    boardId: 'sindh',
    boardName: 'Sindh Board',
    grade: '11',
    gradeLabel: 'Class 11th',
    studentName: 'Saad Farooqui',
    stream: 'Pre-Engineering (XI)',
    nextSubject: 'Physics',
    teacher: 'Prof. Rashid Qureshi',
    time: '4:30 PM',
    topic: 'Ch 3: Motion in Two Dimensions',
    recentNoteTitle: 'Vectors & Projectile Trajectory Formulas',
    recentNoteSubject: 'Physics',
    recentNoteSubtitle: 'Sindh Intermediate Board Short & Long Notes',
    streak: 11,
    classesLeft: 26,
    classesTotal: 48,
    attendedClasses: 22,
    icon: '🚀',
  },
  'sindh-12': {
    boardId: 'sindh',
    boardName: 'Sindh Board',
    grade: '12',
    gradeLabel: 'Class 12th',
    studentName: 'Ayesha Siddiqui',
    stream: 'Pre-Medical (XII)',
    nextSubject: 'Chemistry',
    teacher: 'Dr. Shahida Bano',
    time: '6:00 PM',
    topic: 'Ch 7: Alkyl Halides & Amines',
    recentNoteTitle: 'Organic Reaction Mechanisms & Charts',
    recentNoteSubject: 'Chemistry',
    recentNoteSubtitle: 'Comprehensive BIEK Karachi Model Solutions',
    streak: 15,
    classesLeft: 16,
    classesTotal: 48,
    attendedClasses: 32,
    icon: '🧪',
  },
};

const DashboardPreview: React.FC = () => {
  const isMobile = useMobile();
  const [activeBoard, setActiveBoard] = useState<'fbise' | 'sindh'>('sindh');
  const [activeGrade, setActiveGrade] = useState<'9' | '10' | '11' | '12'>('10');

  const selectedKey = `${activeBoard}-${activeGrade}`;
  const data = CLASS_DASHBOARD_DATA[selectedKey] || CLASS_DASHBOARD_DATA['sindh-10'];

  const attendancePercent = Math.round((data.attendedClasses / data.classesTotal) * 100);

  return (
    <div className="w-full space-y-4">
      {/* Board & Class Switcher Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#111111] text-white p-3 rounded-2xl border border-[#262626] shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#F4C430] flex items-center justify-center text-[#111111] font-extrabold text-xs">
            <GraduationCap size={15} />
          </div>
          <span className="text-xs font-extrabold uppercase tracking-wide text-[#E5E5E5]">
            Interactive Dashboard Preview:
          </span>
        </div>

        {/* Board Selection */}
        <div className="flex items-center gap-1.5 bg-[#1F1F1F] p-1 rounded-xl border border-[#333333]">
          <button
            type="button"
            onClick={() => setActiveBoard('fbise')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeBoard === 'fbise'
                ? 'bg-[#F4C430] text-[#111111] shadow-sm'
                : 'text-[#A3A3A3] hover:text-white'
            }`}
          >
            Federal Board (FBISE)
          </button>
          <button
            type="button"
            onClick={() => setActiveBoard('sindh')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeBoard === 'sindh'
                ? 'bg-[#F4C430] text-[#111111] shadow-sm'
                : 'text-[#A3A3A3] hover:text-white'
            }`}
          >
            Sindh Board
          </button>
        </div>

        {/* Grade Selection */}
        <div className="flex items-center gap-1 bg-[#1F1F1F] p-1 rounded-xl border border-[#333333]">
          {(['9', '10', '11', '12'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setActiveGrade(g)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                activeGrade === g
                  ? 'bg-white text-[#111111] shadow-sm'
                  : 'text-[#A3A3A3] hover:text-white'
              }`}
            >
              Class {g}th
            </button>
          ))}
        </div>
      </div>

      {isMobile ? (
        <div 
          className="relative w-full max-w-[320px] mx-auto rounded-[2.5rem] overflow-hidden shadow-2xl border-[8px] border-[#111111] bg-[#FAFAFA]" 
          style={{ aspectRatio: '9/19', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          {/* Dynamic Island / Notch area */}
          <div className="absolute top-0 inset-x-0 h-5 flex justify-center z-20">
             <div className="w-24 h-4 bg-[#111111] rounded-b-xl" />
          </div>
          
          {/* Mobile Header */}
          <div className="bg-[#111111] text-white px-5 pt-8 pb-4 flex items-center justify-between relative z-10">
             <Logo size="sm" variant="icon" darkMode />
             <div className="flex items-center gap-1.5">
               <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F4C430] text-[#111111]">
                 {data.boardName} · Gr. {data.grade}
               </span>
               <div className="w-8 h-8 rounded-lg bg-[#262626] flex items-center justify-center">
                 <Menu size={14} className="text-white" />
               </div>
             </div>
          </div>
          
          {/* Mobile Content */}
          <div className="p-4 space-y-3.5">
             <div>
               <div className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider">Good Morning</div>
               <div className="text-base font-extrabold text-[#111111] leading-tight">{data.studentName}</div>
               <div className="text-[10px] font-semibold text-[#D4A017]">{data.boardName} · Class {data.grade}th ({data.stream})</div>
             </div>
             
             <div className="bg-white rounded-2xl border border-[#E5E5E5] p-3.5 shadow-sm">
               <div className="flex items-center justify-between mb-2.5 border-b border-[#F0F0F0] pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#F4C430]">Up Next</span>
                  <span className="text-[10px] font-bold text-[#737373] flex items-center gap-1"><Clock size={10} /> {data.time}</span>
               </div>
               <div className="flex gap-2.5 items-center">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-lg shrink-0">{data.icon}</div>
                  <div className="min-w-0 flex-1">
                     <div className="text-xs font-bold text-[#111111] leading-tight truncate">{data.nextSubject}</div>
                     <div className="text-[10px] text-[#737373] mt-0.5 font-medium truncate">{data.topic}</div>
                  </div>
               </div>
               <button className="w-full mt-3 bg-[#111111] text-white text-[10.5px] font-bold py-2 rounded-xl shadow-sm hover:scale-[1.02] transition-transform interactive">
                 Join Live Session
               </button>
             </div>

             <div className="bg-white rounded-2xl border border-[#E5E5E5] p-3.5 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#111111] mb-2">Subject Note Vault</div>
                <div className="flex items-center gap-2.5 min-w-0 bg-[#FAFAFA] p-2 rounded-xl border border-[#F0F0F0]">
                   <div className="w-7 h-7 rounded-lg bg-[#FFFBF0] flex items-center justify-center shrink-0 border border-[#FDF3C8]">
                     <span className="text-xs">📔</span>
                   </div>
                   <div className="min-w-0 flex-1">
                     <div className="text-[10px] font-bold text-[#111111] truncate">{data.recentNoteTitle}</div>
                     <div className="text-[9px] text-[#737373] mt-0.5 truncate">{data.recentNoteSubject} · {data.boardName}</div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      ) : (
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
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-[#E5E5E5]" style={{ minHeight: 44 }}>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
              <div className="w-3 h-3 rounded-full bg-[#28C840]" />
            </div>
            <div className="flex-1 mx-3 flex items-center justify-center gap-2">
              <div className="bg-[#F5F5F5] rounded-md px-3 py-1 text-[10px] text-[#737373] max-w-[280px] text-center font-medium">
                app.scholario.pk/student/dashboard?board={data.boardId}&grade={data.grade}
              </div>
              <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                {data.boardName} Class {data.grade}th
              </span>
            </div>
          </div>

          {/* Dashboard layout */}
          <div className="flex h-full" style={{ height: 'calc(100% - 44px)' }}>
            
            {/* Sidebar */}
            <div className="w-[190px] shrink-0 bg-[#111111] flex flex-col py-5 px-4" style={{ minWidth: 190 }}>
              
              {/* Logo */}
              <Logo size="sm" variant="full" darkMode className="mb-6" />

              {/* Navigation Links */}
              <nav className="flex flex-col gap-1.5 flex-1">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-white font-bold bg-[#1F1F1F] text-[11px] cursor-pointer">
                  <LayoutDashboard size={14} className="text-[#F4C430]" />
                  <span>Dashboard</span>
                </div>
                
                <div className="flex items-center gap-2.5 px-3 py-2 text-[#737373] hover:text-white font-semibold text-[11px] cursor-pointer">
                  <BookOpen size={14} />
                  <span>Notes Vault</span>
                </div>

                <div className="flex items-center gap-2.5 px-3 py-2 text-[#737373] hover:text-white font-semibold text-[11px] cursor-pointer">
                  <Calendar size={14} />
                  <span>Timetable</span>
                </div>

                <div className="flex items-center gap-2.5 px-3 py-2 text-[#737373] hover:text-white font-semibold text-[11px] cursor-pointer">
                  <Bell size={14} />
                  <span>Announcements</span>
                </div>

                <div className="flex items-center gap-2.5 px-3 py-2 text-[#737373] hover:text-white font-semibold text-[11px] cursor-pointer">
                  <Sparkles size={14} />
                  <span>Sage AI</span>
                </div>

                <div className="flex items-center gap-2.5 px-3 py-2 text-[#737373] hover:text-white font-semibold text-[11px] cursor-pointer">
                  <ClipboardCheck size={14} />
                  <span>Attendance</span>
                </div>
              </nav>

              {/* Profile at Bottom */}
              <div className="flex items-center gap-2.5 pt-3 border-t border-[#1F1F1F]">
                <div className="w-7 h-7 rounded-full bg-[#F4C430] flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-[#111111]">{data.studentName.charAt(0)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10.5px] text-white font-semibold truncate leading-tight">{data.studentName}</div>
                  <div className="text-[9px] text-[#A3A3A3] truncate">{data.boardName} · Gr. {data.grade}</div>
                </div>
              </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 overflow-hidden flex flex-col bg-white">
              
              {/* Header Bar */}
              <div className="flex items-center justify-between px-6 py-2.5 bg-white border-b border-[#F5F5F5]">
                <div className="relative flex items-center bg-[#F5F5F5] rounded-xl px-3 py-1.5 w-64">
                  <Search size={12} className="text-[#737373] shrink-0 mr-2" />
                  <span className="text-[10.5px] text-[#A3A3A3]">Search {data.boardName} syllabus, notes...</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#FAFAFA] border border-[#F0F0F0] relative">
                    <Bell size={13} className="text-[#525252]" />
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                  </div>
                  <div className="h-8 px-2.5 rounded-xl bg-[#FDF3C8] text-[#D4A017] flex items-center justify-center shrink-0 border border-[#FDF3C8] font-bold text-[11px] gap-1">
                    <GraduationCap size={13} />
                    <span>{data.gradeLabel}</span>
                  </div>
                </div>
              </div>

              {/* Inner Content Grid */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                
                {/* Title Block */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[17px] font-extrabold text-[#111111] leading-tight">
                      Good afternoon, {data.studentName.split(' ')[0]} 👋
                    </h2>
                    <p className="text-[11px] text-[#737373] mt-0.5 font-medium">
                      Enrolled in <span className="font-bold text-[#111111]">{data.boardName} {data.gradeLabel}</span> ({data.stream})
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ● Enrolled & Verified
                  </span>
                </div>

                {/* First Row of Cards */}
                <div className="grid grid-cols-4 gap-3.5">
                  
                  {/* Day Streak */}
                  <div className="bg-white rounded-2xl border border-[#E5E5E5] p-3.5 flex flex-col justify-between h-[115px] relative">
                    <span className="absolute top-3.5 right-3.5 text-base">🔥</span>
                    <div>
                      <span className="text-[9px] font-bold text-[#A3A3A3] uppercase tracking-wider block">Study Streak</span>
                      <span className="text-[26px] font-extrabold text-[#111111] leading-tight block mt-0.5">{data.streak}</span>
                      <span className="text-[9.5px] text-[#737373] font-medium">days continuous</span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-[#F5F5F5]">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 7 }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-3.5 h-1.5 rounded-full ${i < data.streak % 7 + 1 ? 'bg-[#F4C430]' : 'bg-[#E5E5E5]'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-[8px] font-bold text-[#A3A3A3]">Active</span>
                    </div>
                  </div>

                  {/* Classes Left */}
                  <div className="bg-white rounded-2xl border border-[#E5E5E5] p-3.5 flex justify-between items-center h-[115px] relative">
                    <div>
                      <span className="text-[9px] font-bold text-[#A3A3A3] uppercase tracking-wider block">Attendance</span>
                      <span className="text-[26px] font-extrabold text-[#111111] leading-tight block mt-0.5">{attendancePercent}%</span>
                      <span className="text-[9px] text-[#A3A3A3] font-semibold block">{data.attendedClasses} attended</span>
                      <span className="text-[8.5px] text-[#737373] font-medium mt-0.5 block">{data.classesLeft} classes remaining</span>
                    </div>
                    
                    {/* Circular indicator */}
                    <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="22" cy="22" r="18" stroke="#F5F5F5" strokeWidth="3" fill="transparent" />
                        <circle cx="22" cy="22" r="18" stroke="#F4C430" strokeWidth="3" fill="transparent" strokeDasharray="113" strokeDashoffset={113 - (113 * attendancePercent) / 100} strokeLinecap="round" />
                      </svg>
                      <span className="absolute text-[9.5px] font-bold text-[#111111]">{data.attendedClasses}</span>
                    </div>
                  </div>

                  {/* Next Class */}
                  <div className="bg-white rounded-2xl border border-[#E5E5E5] p-3.5 flex flex-col justify-between h-[115px] relative">
                    <span className="absolute top-3.5 right-3.5 text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#FFFBF0] text-[#D4A017] border border-[#FDF3C8]">
                      Today
                    </span>
                    <div>
                      <span className="text-[9px] font-bold text-[#A3A3A3] uppercase tracking-wider block">Next Lecture</span>
                      <span className="text-[14px] font-extrabold text-[#111111] leading-tight block mt-1 truncate">{data.nextSubject}</span>
                      <span className="text-[9.5px] text-[#737373] font-medium block truncate">{data.teacher}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-[#737373] pt-1.5 border-t border-[#F5F5F5]">
                      <Clock size={10} className="text-[#A3A3A3]" />
                      <span className="font-bold text-[#111111]">{data.time}</span>
                      <span className="text-[#D4D4D4]">•</span>
                      <span className="truncate">{data.boardName} Gr. {data.grade}</span>
                    </div>
                  </div>

                  {/* Pomodoro Timer */}
                  <div className="bg-white rounded-2xl border border-[#E5E5E5] p-3 flex flex-col justify-between h-[115px] relative text-center">
                    {/* Mode toggle */}
                    <div className="flex justify-center bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg p-0.5 text-[8.5px]">
                      <span className="flex-1 py-0.5 font-bold rounded-md bg-white border border-[#E5E5E5] text-[#111111] flex items-center justify-center gap-1 shadow-sm">
                        <span>🍅</span> Focus
                      </span>
                      <span className="flex-1 py-0.5 font-semibold text-[#A3A3A3] flex items-center justify-center gap-1 cursor-pointer">
                        <span>☕</span> Break
                      </span>
                    </div>

                    <div className="my-0.5">
                      <span className="text-[19px] font-extrabold text-[#111111] tracking-tight block leading-none">25:00</span>
                      <span className="text-[7.5px] font-bold text-[#A3A3A3] uppercase tracking-widest mt-0.5 block">Deep Study</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#F5F5F5]">
                      <RotateCcw size={10} className="text-[#A3A3A3] cursor-pointer" />
                      <div className="w-4.5 h-4.5 rounded-full bg-[#F4C430] flex items-center justify-center text-[#111111] cursor-pointer">
                        <Play size={7} fill="currentColor" />
                      </div>
                      <span className="text-[8px] font-bold text-[#A3A3A3]">Session 1</span>
                    </div>
                  </div>

                </div>

                {/* Second Row Grid */}
                <div className="grid grid-cols-5 gap-3.5">
                  
                  {/* Today's Timetable */}
                  <div className="col-span-3 bg-white rounded-2xl border border-[#E5E5E5] p-3.5 h-[125px] flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#F5F5F5]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-extrabold text-[#111111]">Daily Live Class Timetable</span>
                        <span className="text-[9px] bg-[#F5F5F5] font-bold px-1.5 py-0.5 rounded text-[#525252]">
                          {data.boardName} Class {data.grade}th
                        </span>
                      </div>
                      <span className="text-[9px] text-[#A3A3A3] font-bold cursor-pointer">View full week &gt;</span>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-[#FAFAFA] border border-[#F0F0F0]">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0 border border-amber-100">
                        {data.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold text-[#111111]">{data.nextSubject}</span>
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-100/60 px-1.5 py-0.2 rounded">
                            {data.time}
                          </span>
                        </div>
                        <div className="text-[9px] text-[#737373] mt-0.5 truncate">{data.topic} · {data.teacher}</div>
                      </div>
                      <span className="text-[9.5px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Upcoming
                      </span>
                    </div>
                  </div>

                  {/* Recent Notes */}
                  <div className="col-span-2 bg-white rounded-2xl border border-[#E5E5E5] p-3.5 h-[125px] flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#F5F5F5]">
                      <span className="text-[11px] font-extrabold text-[#111111]">Recent Notes Vault</span>
                      <span className="text-[9px] text-[#A3A3A3] font-bold cursor-pointer">Library &gt;</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAFAFA] border border-[#F0F0F0] cursor-pointer hover:border-[#D4D4D4] transition-all">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#FFFBF0] flex items-center justify-center shrink-0 border border-[#FDF3C8]">
                          <span className="text-xs">📔</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-[9.5px] font-bold text-[#111111] truncate">{data.recentNoteTitle}</div>
                          <div className="text-[8.5px] text-[#737373] mt-0.5 truncate">{data.recentNoteSubtitle}</div>
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
      )}
    </div>
  );
};

export default DashboardPreview;
