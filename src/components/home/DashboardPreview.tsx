import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Check,
  X,
  Video,
  ArrowRight,
  BookOpen,
  Download,
} from 'lucide-react';

export type BoardId = 'fbise' | 'punjab' | 'sindh' | 'kpk' | 'olevel' | 'alevel' | 'ielts';
export type PreviewTab = 'dashboard' | 'notes' | 'timetable' | 'announcements' | 'sage' | 'attendance';

interface DashboardClassData {
  boardId: BoardId;
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
  sageQuestion?: string;
  sageAnswer?: string;
}

// ── Academic Demo Profiles ──
const CLASS_DASHBOARD_DATA: Record<string, DashboardClassData> = {
  // ── FBISE Classes ──
  'fbise-9': {
    boardId: 'fbise',
    boardName: 'FBISE',
    grade: '9',
    gradeLabel: 'Class 9th',
    studentName: 'Danyal Ahmed',
    stream: 'Computer Science',
    nextSubject: 'Physics',
    teacher: 'Instructor Bilal (Physics)',
    time: '4:00 PM',
    topic: "Unit 3: Dynamics & Newton's Laws of Motion",
    recentNoteTitle: 'Unit 3 — Dynamics & Momentum Derivations',
    recentNoteSubject: 'Physics',
    recentNoteSubtitle: 'Comprehensive SLO Solutions & Solved Numericals',
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
    studentName: 'Zainab Malik',
    stream: 'Biology',
    nextSubject: 'Chemistry',
    teacher: 'Instructor Maria (Chemistry)',
    time: '5:00 PM',
    topic: 'Ch 10: Chemical Equilibrium & Reversible Systems',
    recentNoteTitle: 'Chapter 10 — Law of Mass Action Vault',
    recentNoteSubject: 'Chemistry',
    recentNoteSubtitle: 'FBISE SLOs Question Bank & Key Equilibrium Solutions',
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
    stream: 'Pre-Engineering (HSSC-I)',
    nextSubject: 'Mathematics',
    teacher: 'Instructor Asim (Mathematics)',
    time: '4:30 PM',
    topic: 'Ch 4: Quadratic Equations & Roots Theory',
    recentNoteTitle: 'Matrices & Determinants Comprehensive Vault',
    recentNoteSubject: 'Mathematics',
    recentNoteSubtitle: "Higher Order Cramer's Rule & Inverse Proofs",
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
    studentName: 'Amina Tariq',
    stream: 'Pre-Medical (HSSC-II)',
    nextSubject: 'Biology',
    teacher: 'Instructor Farah (Biology)',
    time: '6:00 PM',
    topic: 'Ch 16: Support & Movement in Humans',
    recentNoteTitle: 'Ch 16 — Skeletal Anatomy Diagram Set',
    recentNoteSubject: 'Biology',
    recentNoteSubtitle: 'High-Yield Board Exam Long Questions & Schematics',
    streak: 14,
    classesLeft: 18,
    classesTotal: 48,
    attendedClasses: 30,
    icon: '🧬',
  },

  // ── Punjab Board Classes ──
  'punjab-9': {
    boardId: 'punjab',
    boardName: 'Punjab Board',
    grade: '9',
    gradeLabel: 'Class 9th',
    studentName: 'Haris Khan',
    stream: 'Science (Biology)',
    nextSubject: 'Physics',
    teacher: 'Instructor Tariq (Physics)',
    time: '4:00 PM',
    topic: 'Unit 2: Kinematics & Equations of Motion',
    recentNoteTitle: 'Derivation of 3 Equations of Motion',
    recentNoteSubject: 'Physics',
    recentNoteSubtitle: 'Punjab Curriculum & Textbook Board (PCTB) Solved Numericals',
    streak: 7,
    classesLeft: 36,
    classesTotal: 48,
    attendedClasses: 12,
    icon: '⚡',
  },
  'punjab-10': {
    boardId: 'punjab',
    boardName: 'Punjab Board',
    grade: '10',
    gradeLabel: 'Class 10th',
    studentName: 'Noor Fatima',
    stream: 'Science (Computer)',
    nextSubject: 'Mathematics',
    teacher: 'Instructor Naeem (Mathematics)',
    time: '5:00 PM',
    topic: 'Unit 1: Quadratic Equations & Solution by Factoring',
    recentNoteTitle: 'Unit 1 — Quadratic Equations Vault',
    recentNoteSubject: 'Mathematics',
    recentNoteSubtitle: 'Punjab Board Past Paper Long Questions & Model Tests',
    streak: 10,
    classesLeft: 30,
    classesTotal: 48,
    attendedClasses: 18,
    icon: '📐',
  },
  'punjab-11': {
    boardId: 'punjab',
    boardName: 'Punjab Board',
    grade: '11',
    gradeLabel: 'Class 11th',
    studentName: 'Saad Malik',
    stream: 'Pre-Engineering (Part-I)',
    nextSubject: 'Chemistry',
    teacher: 'Instructor Maria (Chemistry)',
    time: '4:30 PM',
    topic: 'Chapter 1: Stoichiometry & Limiting Reactant',
    recentNoteTitle: 'Stoichiometry & Yield Formulas',
    recentNoteSubject: 'Chemistry',
    recentNoteSubtitle: 'PCTB Board Exam Numerical Bank & Solutions',
    streak: 11,
    classesLeft: 22,
    classesTotal: 48,
    attendedClasses: 26,
    icon: '🧪',
  },
  'punjab-12': {
    boardId: 'punjab',
    boardName: 'Punjab Board',
    grade: '12',
    gradeLabel: 'Class 12th',
    studentName: 'Iqra Bibi',
    stream: 'Pre-Medical (Part-II)',
    nextSubject: 'Biology',
    teacher: 'Instructor Farah (Biology)',
    time: '6:00 PM',
    topic: 'Chapter 15: Homeostasis & Osmoregulation',
    recentNoteTitle: 'Nephron Structure & Counter-Current Mechanism',
    recentNoteSubject: 'Biology',
    recentNoteSubtitle: 'Punjab Intermediate Board High-Yield Diagrams',
    streak: 15,
    classesLeft: 16,
    classesTotal: 48,
    attendedClasses: 32,
    icon: '🧬',
  },

  // ── Sindh Board Classes ──
  'sindh-9': {
    boardId: 'sindh',
    boardName: 'Sindh Board',
    grade: '9',
    gradeLabel: 'Class 9th',
    studentName: 'Mustafa Raza',
    stream: 'Science (Bio)',
    nextSubject: 'Biology',
    teacher: 'Instructor Tariq (Biology)',
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
    studentName: 'Aleeza Shah',
    stream: 'Science (CS)',
    nextSubject: 'Computer Science',
    teacher: 'Instructor Kamran (CS)',
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
    studentName: 'Farhan Ali',
    stream: 'Pre-Engineering (XI)',
    nextSubject: 'Physics',
    teacher: 'Instructor Rashid (Physics)',
    time: '4:30 PM',
    topic: 'Ch 3: Motion in Two Dimensions & Projectiles',
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
    studentName: 'Mariam Siddiqui',
    stream: 'Pre-Medical (XII)',
    nextSubject: 'Chemistry',
    teacher: 'Instructor Shahida (Chemistry)',
    time: '6:00 PM',
    topic: 'Ch 7: Alkyl Halides & Elimination Reactions',
    recentNoteTitle: 'Organic Reaction Mechanisms & Charts',
    recentNoteSubject: 'Chemistry',
    recentNoteSubtitle: 'Comprehensive BIEK Karachi Model Solutions',
    streak: 15,
    classesLeft: 16,
    classesTotal: 48,
    attendedClasses: 32,
    icon: '🧪',
  },

  // ── KPK Board Classes ──
  'kpk-9': {
    boardId: 'kpk',
    boardName: 'KPK Board',
    grade: '9',
    gradeLabel: 'Class 9th',
    studentName: 'Adnan Khattak',
    stream: 'Science (Bio/CS)',
    nextSubject: 'Physics',
    teacher: 'Instructor Farooq (Physics)',
    time: '4:15 PM',
    topic: 'Ch 2: Kinematics & Linear Motion Equations',
    recentNoteTitle: 'Scalar & Vector Derivations — Unit 2',
    recentNoteSubject: 'Physics',
    recentNoteSubtitle: 'BISE Peshawar SLOs Solved Numericals',
    streak: 6,
    classesLeft: 38,
    classesTotal: 48,
    attendedClasses: 10,
    icon: '⚡',
  },
  'kpk-10': {
    boardId: 'kpk',
    boardName: 'KPK Board',
    grade: '10',
    gradeLabel: 'Class 10th',
    studentName: 'Kashif Afridi',
    stream: 'Computer Science',
    nextSubject: 'Mathematics',
    teacher: 'Instructor Zahid (Mathematics)',
    time: '5:15 PM',
    topic: 'Ch 4: Partial Fractions & Factorization',
    recentNoteTitle: 'Chapter 4 — Comprehensive Problem Bank',
    recentNoteSubject: 'Mathematics',
    recentNoteSubtitle: 'KPK Textbook Board (KPTBB) Key Notes',
    streak: 10,
    classesLeft: 30,
    classesTotal: 48,
    attendedClasses: 18,
    icon: '📐',
  },
  'kpk-11': {
    boardId: 'kpk',
    boardName: 'KPK Board',
    grade: '11',
    gradeLabel: 'Class 11th',
    studentName: 'Zoya Gul',
    stream: 'Pre-Medical (Part I)',
    nextSubject: 'Biology',
    teacher: 'Instructor Saba (Biology)',
    time: '4:45 PM',
    topic: 'Ch 5: Acellular & Cellular Microbes',
    recentNoteTitle: 'Enzymes Kinetics & Biomolecules Atlas',
    recentNoteSubject: 'Biology',
    recentNoteSubtitle: 'KPK Intermediate Board Past Paper Diagrams',
    streak: 14,
    classesLeft: 20,
    classesTotal: 48,
    attendedClasses: 28,
    icon: '🧬',
  },
  'kpk-12': {
    boardId: 'kpk',
    boardName: 'KPK Board',
    grade: '12',
    gradeLabel: 'Class 12th',
    studentName: 'Bilal Yousaf',
    stream: 'Pre-Engineering (Part II)',
    nextSubject: 'Chemistry',
    teacher: 'Instructor Junaid (Chemistry)',
    time: '6:15 PM',
    topic: 'Ch 15: Transition Elements & Coordination Compounds',
    recentNoteTitle: 'Coordination Chemistry & IUPAC Nomenclature',
    recentNoteSubject: 'Chemistry',
    recentNoteSubtitle: 'BISE Mardan & Peshawar 5-Year Past Papers',
    streak: 17,
    classesLeft: 12,
    classesTotal: 48,
    attendedClasses: 36,
    icon: '🧪',
  },

  // ── Cambridge O Levels ──
  'olevel-9': {
    boardId: 'olevel',
    boardName: 'Cambridge O Levels',
    grade: '9',
    gradeLabel: 'O1',
    studentName: 'Rayan Khan',
    stream: 'Cambridge O Levels Science',
    nextSubject: 'Chemistry (5070)',
    teacher: 'Instructor Aiman (Cambridge Chemistry)',
    time: '4:00 PM',
    topic: 'States of Matter, Kinetic Theory & Diffusion Rates',
    recentNoteTitle: 'CIE Chemistry Definitions & Experimental Setups',
    recentNoteSubject: 'Chemistry (5070)',
    recentNoteSubtitle: 'Paper 1 & Paper 2 High-Yield Quick Revision',
    streak: 7,
    classesLeft: 36,
    classesTotal: 44,
    attendedClasses: 8,
    icon: '🧪',
  },
  'olevel-10': {
    boardId: 'olevel',
    boardName: 'Cambridge O Levels',
    grade: '10',
    gradeLabel: 'O2',
    studentName: 'Ibrahim Qasim',
    stream: 'Cambridge O Levels',
    nextSubject: 'Mathematics D (4024)',
    teacher: 'Instructor Javaid (Cambridge Mathematics)',
    time: '5:00 PM',
    topic: 'Vectors, Transformations & Matrices',
    recentNoteTitle: 'Paper 2 Coordinate Geometry & Trigonometry Notes',
    recentNoteSubject: 'Mathematics D (4024)',
    recentNoteSubtitle: 'Solved 10-Year Past Paper Topical Questions',
    streak: 12,
    classesLeft: 28,
    classesTotal: 44,
    attendedClasses: 16,
    icon: '📐',
  },
  'olevel-11': {
    boardId: 'olevel',
    boardName: 'Cambridge O Levels',
    grade: '11',
    gradeLabel: 'O3',
    studentName: 'Eman Tariq',
    stream: 'Cambridge O Levels (CS & Science)',
    nextSubject: 'Computer Science (2210)',
    teacher: 'Instructor Noman (Cambridge CS)',
    time: '6:00 PM',
    topic: 'Paper 2: Algorithms, Pseudocode & Logic Gates',
    recentNoteTitle: 'P2 Standard Algorithms & Trace Tables Blueprint',
    recentNoteSubject: 'Computer Science (2210)',
    recentNoteSubtitle: 'Full Syllabus Syntax Cheatsheet & Past Papers',
    streak: 16,
    classesLeft: 16,
    classesTotal: 44,
    attendedClasses: 28,
    icon: '💻',
  },

  // ── Cambridge A Levels ──
  'alevel-11': {
    boardId: 'alevel',
    boardName: 'Cambridge A Levels',
    grade: '11',
    gradeLabel: 'AS Level',
    studentName: 'Daniyal Malik',
    stream: 'Cambridge A Levels (Pre-Engineering)',
    nextSubject: 'Mathematics (9709)',
    teacher: 'Instructor Usman (Cambridge Pure Math)',
    time: '5:30 PM',
    topic: 'Paper 1: Pure Mathematics 1 — Integration & Calculus',
    recentNoteTitle: 'P1 Pure Mathematics Formula Sheet & Proofs',
    recentNoteSubject: 'Mathematics (9709)',
    recentNoteSubtitle: 'CIE Past Paper Variant 12 Worked Solutions',
    streak: 14,
    classesLeft: 22,
    classesTotal: 40,
    attendedClasses: 18,
    icon: '📐',
  },
  'alevel-12': {
    boardId: 'alevel',
    boardName: 'Cambridge A Levels',
    grade: '12',
    gradeLabel: 'A2 Level',
    studentName: 'Mahnoor Shah',
    stream: 'Cambridge A Levels (Pre-Medical)',
    nextSubject: 'Physics (9702)',
    teacher: 'Instructor Shahbaz (Cambridge Physics)',
    time: '6:30 PM',
    topic: 'Paper 4: A2 Structured Questions — Gravitational Fields',
    recentNoteTitle: 'P4 Physics Derivations & Topical Bank',
    recentNoteSubject: 'Physics (9702)',
    recentNoteSubtitle: 'May/June Past Papers Marking Schemes & SLOs',
    streak: 21,
    classesLeft: 14,
    classesTotal: 40,
    attendedClasses: 26,
    icon: '⚡',
  },

  // ── IELTS Preparation ──
  'ielts-10': {
    boardId: 'ielts',
    boardName: 'IELTS Academic',
    grade: '10',
    gradeLabel: 'Academic',
    studentName: 'Zainab Khan',
    stream: 'IELTS Academic (Band 7.5+ Target)',
    nextSubject: 'IELTS Academic Writing Task 2',
    teacher: 'Instructor Farhan (IELTS Writing Lead)',
    time: '8:00 PM',
    topic: 'Opinion & Discussion Essay Structures',
    recentNoteTitle: 'Band 9 Sample Essays & Cohesion Connectors',
    recentNoteSubject: 'IELTS Writing',
    recentNoteSubtitle: 'Comprehensive Task 1 & Task 2 Templates',
    streak: 18,
    classesLeft: 10,
    classesTotal: 36,
    attendedClasses: 26,
    icon: '🎯',
  },
  'ielts-12': {
    boardId: 'ielts',
    boardName: 'IELTS General Training',
    grade: '12',
    gradeLabel: 'General Training',
    studentName: 'Usman Farooq',
    stream: 'IELTS General Training',
    nextSubject: 'IELTS Speaking Masterclass',
    teacher: 'Instructor Sarah (IELTS Academic)',
    time: '7:30 PM',
    topic: 'Part 2 Cue Card Fluency & Idiomatic Lexicon',
    recentNoteTitle: 'Top 50 High-Frequency Speaking Cue Cards',
    recentNoteSubject: 'IELTS Speaking',
    recentNoteSubtitle: 'Pronunciation & Fluency Score Booster',
    streak: 14,
    classesLeft: 12,
    classesTotal: 36,
    attendedClasses: 24,
    icon: '🎙️',
  },
};

const PREVIEW_BOARDS: { id: BoardId; shortLabel: string }[] = [
  { id: 'fbise', shortLabel: 'FBISE' },
  { id: 'punjab', shortLabel: 'Punjab' },
  { id: 'sindh', shortLabel: 'Sindh' },
  { id: 'kpk', shortLabel: 'KPK' },
  { id: 'olevel', shortLabel: 'O Levels' },
  { id: 'alevel', shortLabel: 'A Levels' },
  { id: 'ielts', shortLabel: 'IELTS' },
];

const DashboardPreview: React.FC = () => {
  const [activeBoard, setActiveBoard] = useState<BoardId>('alevel');
  const [activeGrade, setActiveGrade] = useState<string>('11');
  const [previewTeacherVote, setPreviewTeacherVote] = useState<'present' | 'absent' | null>(null);

  // Focus Timer state
  const [timerSeconds, setTimerSeconds] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Modals
  const [showLiveModal, setShowLiveModal] = useState<boolean>(false);
  const [showNoteModal, setShowNoteModal] = useState<boolean>(false);

  // In-view state for smooth staggered entrance
  const [isInView, setIsInView] = useState<boolean>(false);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = frameRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      timer = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimerRunning]);

  const toggleTimer = () => {
    setIsTimerRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(25 * 60);
  };

  const timerMinutes = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const timerSecs = String(timerSeconds % 60).padStart(2, '0');

  const handleBoardChange = (newBoard: BoardId) => {
    setActiveBoard(newBoard);
    setPreviewTeacherVote(null);
    if (newBoard === 'alevel') {
      if (activeGrade !== '11' && activeGrade !== '12') setActiveGrade('11');
    } else if (newBoard === 'olevel') {
      if (activeGrade !== '9' && activeGrade !== '10' && activeGrade !== '11') setActiveGrade('10');
    } else if (newBoard === 'ielts') {
      if (activeGrade !== '10' && activeGrade !== '12') setActiveGrade('10');
    } else {
      if (!['9', '10', '11', '12'].includes(activeGrade)) setActiveGrade('10');
    }
  };

  // Grade options based on current board
  const getAvailableGrades = () => {
    switch (activeBoard) {
      case 'alevel':
        return [
          { id: '11', label: 'AS' },
          { id: '12', label: 'A2' },
        ];
      case 'olevel':
        return [
          { id: '9', label: 'O1' },
          { id: '10', label: 'O2' },
          { id: '11', label: 'O3' },
        ];
      case 'ielts':
        return [
          { id: '10', label: 'Academic' },
          { id: '12', label: 'General' },
        ];
      case 'fbise':
      case 'sindh':
      case 'kpk':
      default:
        return [
          { id: '9', label: '9th' },
          { id: '10', label: '10th' },
          { id: '11', label: '11th' },
          { id: '12', label: '12th' },
        ];
    }
  };

  const selectedKey = `${activeBoard}-${activeGrade}`;
  const data = CLASS_DASHBOARD_DATA[selectedKey] || CLASS_DASHBOARD_DATA['alevel-11'] || CLASS_DASHBOARD_DATA['fbise-10'];

  // Clean teacher name: drops instructor parentheses part like "(Cambridge Pure Math)"
  const cleanTeacherName = data.teacher.replace(/\s*\(.*?\)/, '').trim();

  // Shortened clean program line
  const getShortProgramLine = (d: DashboardClassData): string => {
    if (d.boardId === 'alevel') {
      const level = d.grade === '11' ? 'AS' : 'A2';
      return `Cambridge A Levels · ${level} · Pre-Engineering`;
    }
    if (d.boardId === 'olevel') {
      return `Cambridge O Levels · ${d.gradeLabel} · Science`;
    }
    if (d.boardId === 'ielts') {
      return `IELTS · ${d.gradeLabel} · Preparation`;
    }
    const cleanStream = d.stream.replace(/\(.*?\)/, '').trim();
    return `${d.boardName} · ${d.gradeLabel} · ${cleanStream}`;
  };

  return (
    <div className="w-full flex justify-center">
      {/* ─── Device-Style Frame (Radius ~32px, Soft Shadow, No Horizontal Scroll) ─── */}
      <div
        ref={frameRef}
        className="relative w-full max-w-[540px] sm:max-w-[640px] lg:max-w-[520px] rounded-[32px] border border-black/[0.08] dark:border-white/[0.12] bg-[#F8F8F6] dark:bg-[#111111] shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] overflow-hidden transition-all duration-300"
        style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
      >
        {/* ── 1. Tab Row & Segmented Grade Toggle ── */}
        <div className="p-3.5 sm:p-4 pb-2 border-b border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-[#161616]/70 backdrop-blur-md">
          {/* Horizontally Scrollable Row of Pill Chips (40px tall, scroll-snap, hidden scrollbar) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1 px-0.5 -mx-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {PREVIEW_BOARDS.map((board) => {
              const isSelected = activeBoard === board.id;
              return (
                <button
                  key={board.id}
                  type="button"
                  onClick={() => handleBoardChange(board.id)}
                  className={`h-[40px] min-h-[44px] px-4 rounded-full flex items-center justify-center shrink-0 snap-start text-xs sm:text-sm font-bold cursor-pointer transition-all active:scale-[0.98] ${
                    isSelected
                      ? 'bg-[#111111] dark:bg-white text-white dark:text-[#111111] shadow-xs'
                      : 'border border-black/[0.12] dark:border-white/[0.15] bg-transparent text-[#525252] dark:text-[#D4D4D4] hover:text-[#111111] dark:hover:text-white'
                  }`}
                >
                  {board.shortLabel}
                </button>
              );
            })}
          </div>

          {/* AS | A2 / Grade Segmented Toggle: On its own line below, aligned right, with sliding gold highlight */}
          <div className="flex justify-end pt-2 pb-0.5">
            <div className="inline-flex p-1 rounded-full bg-black/[0.05] dark:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.12]">
              {getAvailableGrades().map((g) => {
                const isSelected = activeGrade === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setActiveGrade(g.id)}
                    className={`min-h-[36px] h-[36px] px-3.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center active:scale-[0.98] ${
                      isSelected
                        ? 'bg-[#F2C230] text-[#111111] shadow-xs font-black'
                        : 'text-[#737373] dark:text-[#A3A3A3] hover:text-[#111111] dark:hover:text-white'
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Inner Content Container (16px Padding, 12px Gaps) ── */}
        <div className="p-4 sm:p-5 pt-3 space-y-3 text-left">
          {/* ── 2. Header Section ── */}
          <div className="pt-1 pb-1">
            <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#737373] dark:text-[#A3A3A3] block">
              STUDENT DASHBOARD
            </span>

            <div className="flex items-center justify-between gap-3 mt-1">
              <h3 className="text-[22px] font-bold text-[#111111] dark:text-white tracking-tight truncate leading-tight">
                {data.studentName}
              </h3>
              <div className="h-[28px] px-2.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold shrink-0 flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Enrolled</span>
              </div>
            </div>

            <p className="text-[13px] font-semibold text-[#D4A017] dark:text-[#F2C230] truncate mt-0.5 leading-normal">
              {getShortProgramLine(data)}
            </p>
          </div>

          {/* ── 3. Hero Card: "Up Next" (Main Focus, Visually Largest) ── */}
          <div
            style={{
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            }}
            className={`rounded-[24px] bg-[#111111]/95 text-white p-4 sm:p-5 border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.25)] relative overflow-hidden transition-all duration-500 ease-out ${
              isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            {/* Top row: UP NEXT label & clock chip */}
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#F2C230]">
                UP NEXT
              </span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white text-xs font-semibold border border-white/10">
                <Clock size={12} className="text-[#F2C230] shrink-0" />
                <span className="tabular-nums font-bold">{data.time}</span>
              </div>
            </div>

            {/* Subject Icon + Name (White bold, no harsh highlight) + Topic */}
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#F2C230]/15 border border-[#F2C230]/30 text-[#F2C230] flex items-center justify-center text-xl shrink-0">
                {data.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-[18px] font-bold text-white tracking-tight leading-snug">
                  {data.nextSubject}
                </h4>
                <p className="text-[13px] text-[#A3A3A3] line-clamp-2 leading-relaxed mt-1">
                  {data.topic}
                </p>
              </div>
            </div>

            {/* Full-width gold Join Live Session button (48px tall) */}
            <button
              id="preview-join-live-btn"
              type="button"
              onClick={() => setShowLiveModal(true)}
              className="w-full h-[48px] min-h-[48px] rounded-full bg-[#F2C230] hover:bg-[#E5B520] text-[#111111] font-extrabold text-[15px] shadow-[0_4px_16px_rgba(242,194,48,0.35)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <Video size={16} className="text-[#111111] stroke-[2.5]" />
              <span>Join Live Session</span>
            </button>
          </div>

          {/* ── 4. Attendance Card (Compact, Directly Below Hero) ── */}
          <div
            className={`rounded-[22px] bg-white/90 dark:bg-[#161616]/90 border border-black/[0.08] dark:border-white/[0.1] p-4 sm:p-5 shadow-xs transition-all duration-500 delay-100 ease-out ${
              isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            {/* Header row: ATTENDANCE label + pulsing Live badge */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-black uppercase tracking-[0.14em] text-[#737373] dark:text-[#A3A3A3]">
                ATTENDANCE
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Live</span>
              </span>
            </div>

            {/* Question in plain dark text & muted subline (No gold text, dropped parentheses) */}
            <div className="text-[14px] sm:text-[15px] font-bold text-[#111111] dark:text-white leading-snug">
              Was {cleanTeacherName} present?
            </div>
            <div className="text-[12px] text-[#737373] dark:text-[#A3A3A3] mt-0.5">
              {data.nextSubject} · {data.time}
            </div>

            {/* Action buttons (44px tall) */}
            {previewTeacherVote ? (
              <button
                type="button"
                onClick={() => setPreviewTeacherVote(null)}
                className="w-full h-[44px] min-h-[44px] rounded-full text-xs font-bold border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1.5 cursor-pointer mt-3 transition-all active:scale-[0.98]"
              >
                <Check size={14} className="stroke-[3]" />
                <span>Marked {previewTeacherVote === 'present' ? 'Present' : 'Absent'} · Tap to change</span>
              </button>
            ) : (
              <div className="flex items-center gap-2.5 mt-3">
                <button
                  type="button"
                  onClick={() => setPreviewTeacherVote('present')}
                  className="flex-1 h-[44px] min-h-[44px] rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-[13px] font-extrabold shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check size={14} className="stroke-[3]" />
                  <span>Present</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTeacherVote('absent')}
                  className="flex-1 h-[44px] min-h-[44px] rounded-full bg-transparent hover:bg-rose-500/10 border border-rose-500 text-rose-600 dark:text-rose-400 text-xs sm:text-[13px] font-extrabold shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <X size={14} className="stroke-[3]" />
                  <span>Absent</span>
                </button>
              </div>
            )}
          </div>

          {/* ── 5. Two-column Row of Small Tiles (Focus Timer & Note Vault) ── */}
          <div
            className={`grid grid-cols-2 gap-3 items-stretch transition-all duration-500 delay-200 ease-out ${
              isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            {/* Left Tile: Focus Timer */}
            <div className="rounded-[22px] bg-white/90 dark:bg-[#161616]/90 border border-black/[0.08] dark:border-white/[0.1] p-3.5 sm:p-4 flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#737373] dark:text-[#A3A3A3] block">
                  FOCUS TIMER
                </span>
                <span className="text-[24px] sm:text-[26px] font-extrabold tracking-tight tabular-nums text-[#111111] dark:text-white leading-none my-2.5 block">
                  {timerMinutes}:{timerSecs}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-auto pt-1">
                <button
                  type="button"
                  onClick={toggleTimer}
                  aria-label={isTimerRunning ? 'Pause timer' : 'Start timer'}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#F2C230] hover:bg-[#E5B520] text-[#111111] flex items-center justify-center shadow-xs cursor-pointer active:scale-[0.98] transition-all"
                >
                  {isTimerRunning ? (
                    <Pause size={14} className="stroke-[2.5]" />
                  ) : (
                    <Play size={14} fill="currentColor" className="ml-0.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetTimer}
                  aria-label="Reset timer"
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full text-[#737373] hover:text-[#111111] dark:hover:text-white flex items-center justify-center cursor-pointer active:scale-[0.98] transition-colors"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            {/* Right Tile: Note Vault */}
            <div
              onClick={() => setShowNoteModal(true)}
              className="rounded-[22px] bg-white/90 dark:bg-[#161616]/90 border border-black/[0.08] dark:border-white/[0.1] p-3.5 sm:p-4 flex flex-col justify-between shadow-xs cursor-pointer hover:border-[#F2C230]/50 transition-all active:scale-[0.98] group text-left"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#737373] dark:text-[#A3A3A3] block">
                  NOTE VAULT
                </span>
                <div className="text-[13px] sm:text-[14px] font-bold text-[#111111] dark:text-white line-clamp-2 leading-snug my-2.5 group-hover:text-[#D4A017] dark:group-hover:text-[#F2C230] transition-colors">
                  {data.recentNoteTitle}
                </div>
              </div>
              <div className="mt-auto pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNoteModal(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#D4A017] dark:text-[#F2C230] hover:underline cursor-pointer min-h-[44px]"
                >
                  <span>Read</span>
                  <ArrowRight size={13} className="text-[#F2C230] group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Interactive Live Classroom Simulator Modal ─── */}
      {showLiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-[#111111] text-white w-full max-w-lg rounded-2xl border border-[#262626] shadow-2xl overflow-hidden text-left">
            <div className="p-4 bg-[#1F1F1F] border-b border-[#262626] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-xs sm:text-sm">Live Class Stream · {data.nextSubject}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowLiveModal(false)}
                className="p-1.5 rounded-lg text-[#A3A3A3] hover:text-white cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="bg-black/60 rounded-xl border border-[#262626] aspect-video flex flex-col items-center justify-center p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-[#F2C230] text-[#111111] font-black text-lg flex items-center justify-center mb-2">
                  {cleanTeacherName.charAt(0)}
                </div>
                <div className="font-bold text-sm text-white">{cleanTeacherName}</div>
                <div className="text-xs text-[#A3A3A3] mt-0.5 max-w-xs">{data.topic}</div>
                <span className="text-[10px] text-emerald-400 font-mono mt-2 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  ● 1080p Live Stream Active
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-[#A3A3A3] pt-2 border-t border-[#262626]">
                <span>Class: <strong className="text-white">{data.boardName} {data.gradeLabel}</strong></span>
                <span>Time: <strong className="text-white">{data.time}</strong></span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLiveModal(false)}
                  className="flex-1 h-[44px] min-h-[44px] px-4 bg-[#F2C230] hover:bg-[#E5B520] text-[#111111] font-bold text-xs rounded-xl shadow-xs cursor-pointer active:scale-[0.98] transition-all flex items-center justify-center"
                >
                  Enter Classroom
                </button>
                <button
                  type="button"
                  onClick={() => setShowLiveModal(false)}
                  className="h-[44px] min-h-[44px] px-4 bg-[#262626] text-white font-bold text-xs rounded-xl cursor-pointer active:scale-[0.98] transition-all flex items-center justify-center"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Interactive Note Reader Modal ─── */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#141414] text-[#111111] dark:text-white w-full max-w-lg rounded-2xl border border-[#E5E5E5] dark:border-[#262626] shadow-2xl overflow-hidden text-left">
            <div className="p-4 bg-[#FAFAFA] dark:bg-[#1A1A1A] border-b border-[#E5E5E5] dark:border-[#262626] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-[#D4A017] dark:text-[#F2C230]" />
                <span className="font-bold text-xs sm:text-sm">Note Vault Reader · {data.boardName}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowNoteModal(false)}
                className="p-1.5 rounded-lg text-[#737373] hover:text-[#111111] dark:hover:text-white cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-400">
                  {data.recentNoteSubject} · {data.gradeLabel}
                </span>
                <h4 className="text-base font-black text-[#111111] dark:text-white mt-1.5">{data.recentNoteTitle}</h4>
                <p className="text-xs text-[#737373] dark:text-[#A3A3A3] mt-0.5">{data.recentNoteSubtitle}</p>
              </div>

              <div className="bg-[#F9F9F9] dark:bg-[#1A1A1A] rounded-xl border border-[#E5E5E5] dark:border-[#262626] p-3 text-xs text-[#333333] dark:text-[#CCCCCC] leading-relaxed">
                Includes verified textbook SLO derivations, past paper short response rubrics, and high-frequency examination diagrams aligned specifically to the {data.boardName} curriculum.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="flex-1 h-[44px] min-h-[44px] px-4 bg-[#111111] dark:bg-white text-white dark:text-[#111111] font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
                >
                  <Download size={14} />
                  <span>Download Sample PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="h-[44px] min-h-[44px] px-4 bg-[#F5F5F5] dark:bg-[#262626] text-[#111111] dark:text-white font-bold text-xs rounded-xl cursor-pointer active:scale-[0.98] transition-all flex items-center justify-center"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPreview;
