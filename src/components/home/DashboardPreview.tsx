import React, { useState } from 'react';
import {
  LayoutDashboard, BookOpen, Calendar, Bell, Search, Clock, Play, RotateCcw, Menu, Sparkles, ClipboardCheck,
  GraduationCap, UserCheck, Check, X, Lock, ShieldCheck
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
  const [previewTeacherVote, setPreviewTeacherVote] = useState<'present' | 'absent' | null>(null);

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
          <div className="p-4 space-y-3">
             <div>
               <div className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider">Good Morning</div>
               <div className="text-base font-extrabold text-[#111111] leading-tight">{data.studentName}</div>
               <div className="text-[10px] font-semibold text-[#D4A017]">{data.boardName} · Class {data.grade}th ({data.stream})</div>
             </div>

             {/* Mobile Teacher Attendance Verification Card */}
             <div className="bg-white rounded-2xl border border-[#E5E5E5] p-3 shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#737373] flex items-center gap-1">
                    <UserCheck size={11} className="text-emerald-600" /> Verification
                  </span>
                  <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Live
                  </span>
                </div>
                <div className="text-[11px] font-bold text-[#111111]">
                  Was <span className="text-[#D4A017] font-extrabold">{data.teacher}</span> present?
                </div>
                <div className="text-[8.5px] text-[#737373] mt-0.5">
                  {data.nextSubject} · {data.boardName} Class {data.grade}th · {data.time}
                </div>
                {previewTeacherVote ? (
                  <div className="mt-2 space-y-1">
                    <button 
                      type="button"
                      onClick={() => setPreviewTeacherVote(null)}
                      className={`w-full flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[9.5px] font-bold border-2 cursor-pointer transition-colors ${
                        previewTeacherVote === 'present'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-500'
                          : 'bg-rose-50 text-rose-800 border-rose-500'
                      }`}
                    >
                      {previewTeacherVote === 'present' ? (
                        <>
                          <Check size={11} strokeWidth={3} className="text-emerald-600" />
                          <span>Marked: Present ✓</span>
                          <Lock size={9} className="text-emerald-500 ml-0.5" />
                        </>
                      ) : (
                        <>
                          <X size={11} strokeWidth={3} className="text-rose-600" />
                          <span>Marked: Absent ✕</span>
                          <Lock size={9} className="text-rose-500 ml-0.5" />
                        </>
                      )}
                    </button>
                    <div className="flex items-center justify-center gap-1 text-[7.5px] text-[#737373] font-medium">
                      <ShieldCheck size={9} className="text-emerald-600" />
                      <span>Vote locked & private</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <button 
                        type="button"
                        onClick={() => setPreviewTeacherVote('present')}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[9.5px] font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        <Check size={11} strokeWidth={3} />
                        <span>Present</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setPreviewTeacherVote('absent')}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-300 hover:border-rose-400 active:scale-95 text-[9.5px] font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        <X size={11} strokeWidth={3} />
                        <span>Absent</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-[7.5px] text-[#737373] font-medium">
                      <Lock size={8.5} />
                      <span>1-time locked vote for this session</span>
                    </div>
                  </div>
                )}
             </div>
             
             {/* Up Next Card */}
             <div className="bg-white rounded-2xl border border-[#E5E5E5] p-3.5 shadow-sm">
               <div className="flex items-center justify-between mb-2 border-b border-[#F0F0F0] pb-1.5">
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
               <button className="w-full mt-2.5 bg-[#111111] text-white text-[10.5px] font-bold py-2 rounded-xl shadow-sm hover:scale-[1.02] transition-transform interactive">
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
            maxHeight: 620,
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
            <div className="flex-1 min-w-0 overflow-hidden flex flex-col bg-white">
              
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
              <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-6 py-3.5 space-y-3">
                
                {/* Title Block */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[16px] font-extrabold text-[#111111] leading-tight">
                      Good afternoon, {data.studentName.split(' ')[0]} 👋
                    </h2>
                    <p className="text-[10.5px] text-[#737373] mt-0.5 font-medium">
                      Enrolled in <span className="font-bold text-[#111111]">{data.boardName} {data.gradeLabel}</span> ({data.stream})
                    </p>
                  </div>
                  <span className="text-[9.5px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ● Enrolled & Verified
                  </span>
                </div>

                {/* Top Row: Study Streak · Attendance · Next Lecture (with Verification) · Focus Timer */}
                <div className="grid grid-cols-4 gap-3 w-full items-stretch">
                  
                  {/* Day Streak */}
                  <div className="bg-white rounded-2xl border border-[#E5E5E5] p-3 flex flex-col justify-between relative shadow-xs">
                    <span className="absolute top-3 right-3 text-base">🔥</span>
                    <div>
                      <span className="text-[9px] font-bold text-[#A3A3A3] uppercase tracking-wider block">Study Streak</span>
                      <span className="text-[24px] font-extrabold text-[#111111] leading-tight block mt-0.5">{data.streak}</span>
                      <span className="text-[9px] text-[#737373] font-medium">days continuous</span>
                    </div>
                    <div>
                      <div className="text-[8px] font-semibold text-[#737373] mb-1">
                        2 days to 10-day streak bonus
                      </div>
                      <div className="flex items-center justify-between pt-1.5 border-t border-[#F5F5F5]">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 7 }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-3.5 h-1.5 rounded-full ${i < (data.streak % 7) + 1 ? 'bg-[#F4C430]' : 'bg-[#E5E5E5]'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">Active</span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Card with Circular Ring */}
                  <div className="bg-white rounded-2xl border border-[#E5E5E5] p-3 flex flex-col justify-between relative shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-[#A3A3A3] uppercase tracking-wider block">Attendance</span>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Verified
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-1.5 my-1">
                      {/* Left: Percentage & Attended classes */}
                      <div>
                        <span className="text-[24px] font-extrabold text-[#111111] leading-none block">
                          {attendancePercent}%
                        </span>
                        <span className="text-[9.5px] text-[#737373] font-medium block mt-1">
                          {data.attendedClasses} attended
                        </span>
                      </div>
                      
                      {/* Right: Circular Progress Ring with attended count inside and remaining classes underneath */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className="relative w-10 h-10 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
                            <circle cx="20" cy="20" r="16" stroke="#F5F5F5" strokeWidth="3.5" fill="transparent" />
                            <circle
                              cx="20"
                              cy="20"
                              r="16"
                              stroke={attendancePercent >= 75 ? '#22c55e' : '#F4C430'}
                              strokeWidth="3.5"
                              fill="transparent"
                              strokeDasharray={2 * Math.PI * 16}
                              strokeDashoffset={2 * Math.PI * 16 * (1 - attendancePercent / 100)}
                              strokeLinecap="round"
                              style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                            />
                          </svg>
                          <span className="absolute text-[10px] font-extrabold text-[#111111]">
                            {data.attendedClasses}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[8px] text-[#737373] font-medium pt-1.5 border-t border-[#F5F5F5]">
                      <span>{data.classesLeft} classes left</span>
                      <span className="font-bold text-[#111111]">{data.classesTotal} Total</span>
                    </div>
                  </div>

                  {/* Next Class & Teacher Attendance Verification (directly below Next Lecture info) */}
                  <div className="bg-white rounded-2xl border border-[#E5E5E5] p-3 flex flex-col justify-between relative shadow-xs">
                    {/* Top: Next Lecture Details */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-[#A3A3A3] uppercase tracking-wider block">Next Lecture</span>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#FFFBF0] text-[#D4A017] border border-[#FDF3C8]">
                          Today
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span className="text-[13px] font-extrabold text-[#111111] leading-tight truncate">{data.nextSubject}</span>
                        <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded shrink-0">
                          Live
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-[#737373] font-medium mt-0.5">
                        <span className="truncate">{data.teacher}</span>
                        <div className="flex items-center gap-1 font-bold text-[#111111] shrink-0">
                          <Clock size={10} className="text-[#A3A3A3]" />
                          <span>{data.time}</span>
                        </div>
                      </div>
                    </div>

                    {/* Directly Below: Teacher Attendance Verification Card Content */}
                    <div className="pt-2 border-t border-[#F5F5F5] mt-2">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <UserCheck size={11} className="text-emerald-600 shrink-0" />
                          <span className="text-[8px] font-bold uppercase tracking-wider text-[#737373] truncate">
                            Teacher Attendance
                          </span>
                        </div>
                        <span className="text-[7.5px] font-bold text-emerald-600 shrink-0">In Session</span>
                      </div>

                      <p className="text-[9.5px] font-bold text-[#111111] leading-tight mb-1.5 truncate">
                        Was <span className="text-[#D4A017] underline decoration-amber-300">{data.teacher}</span> present?
                      </p>

                      {previewTeacherVote ? (
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => setPreviewTeacherVote(null)}
                            className={`w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-xl font-bold text-[9.5px] border-2 shadow-xs cursor-pointer transition-colors ${
                              previewTeacherVote === 'present'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-500 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-800 border-rose-500 hover:bg-rose-100'
                            }`}
                            title="Click to reset vote"
                          >
                            {previewTeacherVote === 'present' ? (
                              <>
                                <Check size={12} strokeWidth={3} className="text-emerald-600" />
                                <span>Marked: Present ✓</span>
                                <Lock size={10} className="text-emerald-500 ml-0.5" />
                              </>
                            ) : (
                              <>
                                <X size={12} strokeWidth={3} className="text-rose-600" />
                                <span>Marked: Absent ✕</span>
                                <Lock size={10} className="text-rose-500 ml-0.5" />
                              </>
                            )}
                          </button>
                          <div className="flex items-center justify-center gap-1 text-[7.5px] text-[#737373] font-medium">
                            <ShieldCheck size={9} className="text-emerald-600" />
                            <span>Vote locked & private</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            {/* Left: Solid green button with checkmark icon + "Present" */}
                            <button
                              type="button"
                              onClick={() => setPreviewTeacherVote('present')}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[9.5px] rounded-xl shadow-xs transition-all cursor-pointer"
                            >
                              <Check size={12} strokeWidth={3} />
                              <span>Present</span>
                            </button>

                            {/* Right: White/outlined button with red border, X icon + "Absent" (red text) */}
                            <button
                              type="button"
                              onClick={() => setPreviewTeacherVote('absent')}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-300 hover:border-rose-400 active:scale-95 font-bold text-[9.5px] rounded-xl shadow-xs transition-all cursor-pointer"
                            >
                              <X size={12} strokeWidth={3} />
                              <span>Absent</span>
                            </button>
                          </div>

                          {/* Below both buttons: Small gray caption with lock icon: "1-time locked vote for this session" */}
                          <div className="flex items-center justify-center gap-1 text-[7.5px] text-[#737373] font-medium">
                            <Lock size={8.5} />
                            <span>1-time locked vote for this session</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pomodoro Timer */}
                  <div className="bg-white rounded-2xl border border-[#E5E5E5] p-3 flex flex-col justify-between relative text-center shadow-xs">
                    {/* Mode toggle */}
                    <div className="flex justify-center bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg p-0.5 text-[8px]">
                      <span className="flex-1 py-0.5 font-bold rounded-md bg-white border border-[#E5E5E5] text-[#111111] flex items-center justify-center gap-1 shadow-sm">
                        <span>🍅</span> Focus
                      </span>
                      <span className="flex-1 py-0.5 font-semibold text-[#A3A3A3] flex items-center justify-center gap-1 cursor-pointer">
                        <span>☕</span> Break
                      </span>
                    </div>

                    <div className="my-1">
                      <span className="text-[20px] font-extrabold text-[#111111] tracking-tight block leading-none">25:00</span>
                      <span className="text-[8px] font-bold text-[#A3A3A3] uppercase tracking-widest mt-0.5 block">Deep Study</span>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-[#F5F5F5]">
                      <RotateCcw size={11} className="text-[#A3A3A3] cursor-pointer" />
                      <div className="w-5 h-5 rounded-full bg-[#F4C430] flex items-center justify-center text-[#111111] cursor-pointer shadow-xs hover:scale-105 transition-transform">
                        <Play size={8} fill="currentColor" />
                      </div>
                      <span className="text-[8px] font-bold text-[#A3A3A3]">Session 1</span>
                    </div>
                  </div>

                </div>

                {/* Third Row Grid: Timetable & Notes */}
                <div className="grid grid-cols-5 gap-3 w-full">
                  
                  {/* Today's Timetable */}
                  <div className="col-span-3 bg-white rounded-2xl border border-[#E5E5E5] p-3 h-[115px] flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-1 border-b border-[#F5F5F5]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10.5px] font-extrabold text-[#111111]">Daily Live Class Timetable</span>
                        <span className="text-[8.5px] bg-[#F5F5F5] font-bold px-1.5 py-0.2 rounded text-[#525252]">
                          {data.boardName} Class {data.grade}th
                        </span>
                      </div>
                      <span className="text-[8.5px] text-[#A3A3A3] font-bold cursor-pointer">View full week &gt;</span>
                    </div>
                    
                    <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#FAFAFA] border border-[#F0F0F0]">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-100">
                        {data.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9.5px] font-extrabold text-[#111111]">{data.nextSubject}</span>
                          <span className="text-[8.5px] font-bold text-amber-800 bg-amber-100/60 px-1.5 py-0.2 rounded">
                            {data.time}
                          </span>
                        </div>
                        <div className="text-[8.5px] text-[#737373] mt-0.5 truncate">{data.topic} · {data.teacher}</div>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Upcoming
                      </span>
                    </div>
                  </div>

                  {/* Recent Notes */}
                  <div className="col-span-2 bg-white rounded-2xl border border-[#E5E5E5] p-3 h-[115px] flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-1 border-b border-[#F5F5F5]">
                      <span className="text-[10.5px] font-extrabold text-[#111111]">Recent Notes Vault</span>
                      <span className="text-[8.5px] text-[#A3A3A3] font-bold cursor-pointer">Library &gt;</span>
                    </div>

                    <div className="flex items-center justify-between p-1.5 rounded-xl bg-[#FAFAFA] border border-[#F0F0F0] cursor-pointer hover:border-[#D4D4D4] transition-all">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#FFFBF0] flex items-center justify-center shrink-0 border border-[#FDF3C8]">
                          <span className="text-xs">📔</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-[9px] font-bold text-[#111111] truncate">{data.recentNoteTitle}</div>
                          <div className="text-[8px] text-[#737373] mt-0.5 truncate">{data.recentNoteSubtitle}</div>
                        </div>
                      </div>
                      <span className="text-[#A3A3A3] text-[9px] shrink-0 font-bold ml-1">&gt;</span>
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
