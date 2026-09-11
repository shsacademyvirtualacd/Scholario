import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, BookOpen, Calendar, Bell, Search, Clock, Play, Pause, RotateCcw, Menu, Sparkles, ClipboardCheck,
  GraduationCap, UserCheck, Check, X, Lock, ShieldCheck, Video, Download, CheckCircle2
} from 'lucide-react';
import Logo from '../ui/Logo';
import { useMobile } from '../../hooks/useMobile';

export type BoardId = 'fbise' | 'sindh' | 'kpk' | 'olevel' | 'alevel' | 'ielts';
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

const CLASS_DASHBOARD_DATA: Record<string, DashboardClassData> = {
  // ── FBISE Classes ──
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
    sageQuestion: 'Can you explain the difference between mass and weight according to FBISE SLOs?',
    sageAnswer: 'Mass is the quantity of matter contained in a body and is a scalar quantity measured in kg (constant everywhere). Weight is the gravitational force acting on a body (W = mg), which is a vector quantity measured in Newtons and varies with gravitational field strength g.',
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
    sageQuestion: 'What is dynamic equilibrium and how is Kc expression derived for reversible reactions?',
    sageAnswer: 'Dynamic equilibrium occurs when the forward and reverse reaction rates become equal while concentrations remain constant. By the Law of Mass Action, Kc = [Products]^coefficients / [Reactants]^coefficients.',
  },
  'fbise-11': {
    boardId: 'fbise',
    boardName: 'FBISE',
    grade: '11',
    gradeLabel: 'Class 11th',
    studentName: 'Hamza Sheikh',
    stream: 'Pre-Engineering (HSSC-I)',
    nextSubject: 'Mathematics',
    teacher: 'Prof. Asim Mehmood',
    time: '4:30 PM',
    topic: 'Ch 4: Quadratic Equations & Roots Theory',
    recentNoteTitle: 'Matrices & Determinants Vault',
    recentNoteSubject: 'Mathematics',
    recentNoteSubtitle: 'Higher Order Cramer\'s Rule & Inverse Proofs',
    streak: 12,
    classesLeft: 24,
    classesTotal: 48,
    attendedClasses: 24,
    icon: '📐',
    sageQuestion: 'How to find the nature of roots using the discriminant Δ = b² - 4ac?',
    sageAnswer: 'If Δ > 0 (perfect square): real, rational, unequal. If Δ > 0 (not square): real, irrational, unequal. If Δ = 0: real, rational, equal. If Δ < 0: complex conjugates.',
  },
  'fbise-12': {
    boardId: 'fbise',
    boardName: 'FBISE',
    grade: '12',
    gradeLabel: 'Class 12th',
    studentName: 'Zainab Noor',
    stream: 'Pre-Medical (HSSC-II)',
    nextSubject: 'Biology',
    teacher: 'Dr. Farah Naz',
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
    sageQuestion: 'Explain the sliding filament model of muscle contraction during nerve stimulation.',
    sageAnswer: 'Upon Ca²⁺ binding to troponin, tropomyosin uncovers myosin binding sites on actin. ATP hydrolysis activates myosin cross-bridges to pull actin filaments inward (power stroke), shortening the sarcomere.',
  },

  // ── Sindh Board Classes ──
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
    sageQuestion: 'List the biological method steps according to Sindh Board textbook.',
    sageAnswer: '1. Recognition of biological problem, 2. Observations (qualitative & quantitative), 3. Hypothesis formulation, 4. Deduction, 5. Experimentation, 6. Summarization of results, 7. Reporting.',
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
    sageQuestion: 'Difference between while loop and do-while loop in C++?',
    sageAnswer: 'A while loop evaluates the condition before executing the loop body (entry-controlled), while do-while executes the loop body at least once before evaluating condition (exit-controlled).',
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
    topic: 'Ch 3: Motion in Two Dimensions & Projectiles',
    recentNoteTitle: 'Vectors & Projectile Trajectory Formulas',
    recentNoteSubject: 'Physics',
    recentNoteSubtitle: 'Sindh Intermediate Board Short & Long Notes',
    streak: 11,
    classesLeft: 26,
    classesTotal: 48,
    attendedClasses: 22,
    icon: '🚀',
    sageQuestion: 'Derive maximum range of a projectile fired at angle θ.',
    sageAnswer: 'Horizontal range R = (v₀² sin 2θ) / g. Maximum range occurs when sin 2θ = 1, meaning 2θ = 90° or θ = 45°, giving R_max = v₀² / g.',
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
    topic: 'Ch 7: Alkyl Halides & Elimination Reactions',
    recentNoteTitle: 'Organic Reaction Mechanisms & Charts',
    recentNoteSubject: 'Chemistry',
    recentNoteSubtitle: 'Comprehensive BIEK Karachi Model Solutions',
    streak: 15,
    classesLeft: 16,
    classesTotal: 48,
    attendedClasses: 32,
    icon: '🧪',
    sageQuestion: 'Compare SN1 vs SN2 nucleophilic substitution mechanisms.',
    sageAnswer: 'SN1 is two-step, unimolecular rate = k[R-X], proceeds via carbocation intermediate with racemization (favored by 3° halides). SN2 is single-step concerted, bimolecular rate = k[R-X][Nu⁻] with Walden inversion (favored by 1° halides).',
  },

  // ── KPK Board Classes ──
  'kpk-9': {
    boardId: 'kpk',
    boardName: 'KPK Board',
    grade: '9',
    gradeLabel: 'Class 9th',
    studentName: 'Adnan Khan',
    stream: 'Science (Bio/CS)',
    nextSubject: 'Physics',
    teacher: 'Sir Farooq Khattak',
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
    sageQuestion: 'Derive 2as = vf² - vi² graphically using speed-time graph.',
    sageAnswer: 'The total area under the v-t graph represents distance s = 1/2 (vi + vf) × t. From acceleration a = (vf - vi) / t, substituting t = (vf - vi) / a gives s = (vf² - vi²) / (2a), yielding 2as = vf² - vi².',
  },
  'kpk-10': {
    boardId: 'kpk',
    boardName: 'KPK Board',
    grade: '10',
    gradeLabel: 'Class 10th',
    studentName: 'Shayan Afridi',
    stream: 'Computer Science',
    nextSubject: 'Mathematics',
    teacher: 'Prof. Zahid Bangash',
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
    sageQuestion: 'How to resolve an improper fraction into partial fractions?',
    sageAnswer: 'First perform polynomial division so the quotient is separated and the remainder fraction is proper (degree of numerator < degree of denominator). Then resolve the proper remainder fraction into partial fractions.',
  },
  'kpk-11': {
    boardId: 'kpk',
    boardName: 'KPK Board',
    grade: '11',
    gradeLabel: 'Class 11th',
    studentName: 'Zainab Shinwari',
    stream: 'Pre-Medical (Part I)',
    nextSubject: 'Biology',
    teacher: 'Dr. Saba Gul',
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
    sageQuestion: 'Explain lock-and-key vs induced-fit models of enzyme action.',
    sageAnswer: 'Fischer\'s lock-and-key model posits that the active site is rigid and pre-formed. Koshland\'s induced-fit model suggests the active site is flexible and molds slightly around substrate upon binding to lower activation energy.',
  },
  'kpk-12': {
    boardId: 'kpk',
    boardName: 'KPK Board',
    grade: '12',
    gradeLabel: 'Class 12th',
    studentName: 'Bilal Yousafzai',
    stream: 'Pre-Engineering (Part II)',
    nextSubject: 'Chemistry',
    teacher: 'Engr. Junaid Khan',
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
    sageQuestion: 'Why do transition metal complexes exhibit distinct colors?',
    sageAnswer: 'Ligand fields split degenerate d-orbitals into eg and t2g sets with an energy gap ΔE. Absorbing visible light photons promotes d-electrons (d-d transition), and the complementary transmitted wavelength appears as the color.',
  },

  // ── Cambridge O Levels ──
  'olevel-9': {
    boardId: 'olevel',
    boardName: 'Cambridge O Levels',
    grade: '9',
    gradeLabel: 'O1 (Year 9)',
    studentName: 'Rayan Siddiqui',
    stream: 'Cambridge O Levels Science',
    nextSubject: 'Chemistry (5070)',
    teacher: 'Ms. Aiman Waqar',
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
    sageQuestion: 'Why does ammonia gas diffuse faster than hydrogen chloride gas?',
    sageAnswer: 'Diffusion rate is inversely proportional to square root of relative molecular mass (Mr). Mr of NH₃ = 17, while Mr of HCl = 36.5. Lighter particles move with higher average velocity at constant temperature.',
  },
  'olevel-10': {
    boardId: 'olevel',
    boardName: 'Cambridge O Levels',
    grade: '10',
    gradeLabel: 'O2 (Year 10)',
    studentName: 'Ibrahim Qureshi',
    stream: 'Cambridge O Levels',
    nextSubject: 'Mathematics D (4024)',
    teacher: 'Sir Tariq Javaid',
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
    sageQuestion: 'How to calculate matrix inverse for 2x2 matrix [[a,b],[c,d]]?',
    sageAnswer: 'Determinant det(M) = ad - bc. If det(M) ≠ 0, inverse M⁻¹ = (1 / det) * [[d, -b], [-c, a]]. If det(M) = 0, no inverse exists (singular matrix).',
  },
  'olevel-11': {
    boardId: 'olevel',
    boardName: 'Cambridge O Levels',
    grade: '11',
    gradeLabel: 'O3 (Final Year)',
    studentName: 'Aleeza Khan',
    stream: 'Cambridge O Levels (CS & Science)',
    nextSubject: 'Computer Science (2210)',
    teacher: 'Sir Noman Hafeez',
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
    sageQuestion: 'How does linear search compare to binary search algorithm?',
    sageAnswer: 'Linear search scans element by element in O(n) time on unordered arrays. Binary search repeatedly halves search range in O(log n) time, but strictly requires the array to be pre-sorted.',
  },

  // ── Cambridge A Levels ──
  'alevel-11': {
    boardId: 'alevel',
    boardName: 'Cambridge A Levels',
    grade: '11',
    gradeLabel: 'AS / A1 Level',
    studentName: 'Daniyal Ahmed',
    stream: 'Cambridge A Levels (Pre-Engineering)',
    nextSubject: 'Mathematics (9709)',
    teacher: 'Sir Usman Ghani',
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
    sageQuestion: 'How to evaluate definite integral with substitution method in CIE Pure 1?',
    sageAnswer: 'Let u = g(x). Compute du = g\'(x) dx. Transform upper and lower limits: u_lower = g(a), u_upper = g(b). Substitute inside integrand and evaluate without having to revert back to x.',
  },
  'alevel-12': {
    boardId: 'alevel',
    boardName: 'Cambridge A Levels',
    grade: '12',
    gradeLabel: 'A2 Level',
    studentName: 'Mahnoor Tariq',
    stream: 'Cambridge A Levels (Pre-Medical)',
    nextSubject: 'Physics (9702)',
    teacher: 'Dr. Shahbaz Alam',
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
    sageQuestion: 'Why is gravitational potential defined as negative in Cambridge Physics 9702?',
    sageAnswer: 'Gravitational potential at infinity is arbitrarily defined as zero. Because gravity is an attractive force, external work must be done against gravity to move a mass to infinity, meaning potential at all finite distances is lower than zero (negative).',
  },

  // ── IELTS Preparation ──
  'ielts-10': {
    boardId: 'ielts',
    boardName: 'IELTS Academic',
    grade: '10',
    gradeLabel: 'Academic Module',
    studentName: 'Zainab Malik',
    stream: 'IELTS Academic (Band 7.5+ Target)',
    nextSubject: 'IELTS Academic Writing Task 2',
    teacher: 'Sir Farhan Siddiqui',
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
    sageQuestion: 'What are the four grading criteria for IELTS Writing Task 2?',
    sageAnswer: '1. Task Achievement / Response (25%), 2. Coherence and Cohesion (25%), 3. Lexical Resource / Vocabulary (25%), 4. Grammatical Range and Accuracy (25%).',
  },
  'ielts-12': {
    boardId: 'ielts',
    boardName: 'IELTS General Training',
    grade: '12',
    gradeLabel: 'General Training',
    studentName: 'Hamza Tariq',
    stream: 'IELTS General Training',
    nextSubject: 'IELTS Speaking Masterclass',
    teacher: 'Ms. Sarah Jenkins',
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
    sageQuestion: 'How to structure a 2-minute response for IELTS Speaking Part 2?',
    sageAnswer: 'Use the 1-minute prep time to jot down keywords for: 1. Introduction (what/who), 2. Background story (when/where), 3. Detailed action/emotion (how/why), 4. Reflection on importance. Aim to speak without pausing until examiner stops you.',
  },
};

const PREVIEW_BOARDS: { id: BoardId; label: string; shortLabel: string }[] = [
  { id: 'fbise', label: 'Federal Board (FBISE)', shortLabel: 'FBISE' },
  { id: 'sindh', label: 'Sindh Board', shortLabel: 'Sindh' },
  { id: 'kpk', label: 'KPK Board', shortLabel: 'KPK' },
  { id: 'olevel', label: 'Cambridge O Levels', shortLabel: 'O Levels' },
  { id: 'alevel', label: 'Cambridge A Levels', shortLabel: 'A Levels' },
  { id: 'ielts', label: 'IELTS Prep', shortLabel: 'IELTS' },
];

const DashboardPreview: React.FC = () => {
  const isMobile = useMobile();
  const [activeBoard, setActiveBoard] = useState<BoardId>('alevel');
  const [activeGrade, setActiveGrade] = useState<string>('11');
  const [previewTeacherVote, setPreviewTeacherVote] = useState<'present' | 'absent' | null>(null);
  const [activeTab, setActiveTab] = useState<PreviewTab>('dashboard');

  // Interactive Focus / Pomodoro Timer state
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const [timerSeconds, setTimerSeconds] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [sessionCount, setSessionCount] = useState<number>(1);

  // Interactive Live Classroom Modal
  const [showLiveModal, setShowLiveModal] = useState<boolean>(false);
  // Interactive Note Preview Modal
  const [showNoteModal, setShowNoteModal] = useState<boolean>(false);
  // Interactive Quick Search state
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pomodoro countdown effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      timer = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            if (timerMode === 'focus') {
              setSessionCount((s) => s + 1);
              setTimerMode('break');
              return 5 * 60;
            } else {
              setTimerMode('focus');
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimerRunning, timerMode]);

  const toggleTimer = () => {
    setIsTimerRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(timerMode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const switchTimerMode = (mode: 'focus' | 'break') => {
    setIsTimerRunning(false);
    setTimerMode(mode);
    setTimerSeconds(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const timerMinutes = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const timerSecs = String(timerSeconds % 60).padStart(2, '0');

  // Handle board changes with sensible default grades
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
          { id: '11', label: 'AS / A1' },
          { id: '12', label: 'A2 Level' },
        ];
      case 'olevel':
        return [
          { id: '9', label: 'O1 (Yr 9)' },
          { id: '10', label: 'O2 (Yr 10)' },
          { id: '11', label: 'O3 (Final)' },
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
  const attendancePercent = Math.round((data.attendedClasses / data.classesTotal) * 100);

  return (
    <div className="w-full space-y-4">
      {/* Board & Class Switcher Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#111111] text-white p-3 rounded-2xl border border-[#262626] shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#F4C430] flex items-center justify-center text-[#111111] font-extrabold text-xs">
            <GraduationCap size={15} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-extrabold uppercase tracking-wide text-[#E5E5E5] flex items-center gap-1.5">
              <span>Interactive Dashboard Review & Preview</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                Live Simulator
              </span>
            </span>
            <span className="text-[10px] text-[#A3A3A3]">
              Switch curriculum boards, test teacher verification, run the timer & explore views
            </span>
          </div>
        </div>

        {/* Board Selection */}
        <div className="flex items-center gap-1 bg-[#1F1F1F] p-1 rounded-xl border border-[#333333] flex-wrap justify-center">
          {PREVIEW_BOARDS.map((board) => (
            <button
              key={board.id}
              type="button"
              onClick={() => handleBoardChange(board.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeBoard === board.id
                  ? 'bg-[#F4C430] text-[#111111] shadow-xs'
                  : 'text-[#A3A3A3] hover:text-white hover:bg-white/5'
              }`}
            >
              {board.shortLabel}
            </button>
          ))}
        </div>

        {/* Grade Selection */}
        <div className="flex items-center gap-1 bg-[#1F1F1F] p-1 rounded-xl border border-[#333333] shrink-0">
          {getAvailableGrades().map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setActiveGrade(g.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeGrade === g.id
                  ? 'bg-white text-[#111111] shadow-xs'
                  : 'text-[#A3A3A3] hover:text-white hover:bg-white/5'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {isMobile ? (
        <div 
          className="relative w-full max-w-[340px] mx-auto rounded-[2.5rem] overflow-hidden shadow-2xl border-[8px] border-[#111111] bg-[#FAFAFA]" 
          style={{ aspectRatio: '9/19', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          {/* Notch area */}
          <div className="absolute top-0 inset-x-0 h-5 flex justify-center z-20 pointer-events-none">
             <div className="w-24 h-4 bg-[#111111] rounded-b-xl" />
          </div>
          
          {/* Mobile Header */}
          <div className="bg-[#111111] text-white px-5 pt-8 pb-4 flex items-center justify-between relative z-10">
             <Logo size="sm" variant="icon" darkMode />
             <div className="flex items-center gap-1.5">
               <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F4C430] text-[#111111]">
                 {data.boardName} · {data.gradeLabel}
               </span>
               <div className="w-8 h-8 rounded-lg bg-[#262626] flex items-center justify-center">
                 <Menu size={14} className="text-white" />
               </div>
             </div>
          </div>
          
          {/* Mobile Content */}
          <div className="p-4 space-y-3 overflow-y-auto max-h-[580px]">
             <div>
               <div className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider">Good Morning</div>
               <div className="text-base font-extrabold text-[#111111] leading-tight">{data.studentName}</div>
               <div className="text-[10px] font-semibold text-[#D4A017]">{data.boardName} · {data.gradeLabel} ({data.stream})</div>
             </div>

             {/* Mobile Teacher Attendance Verification Card */}
             <div className="bg-white rounded-2xl border border-[#E5E5E5] p-3 shadow-xs">
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
                  {data.nextSubject} · {data.boardName} · {data.time}
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
                      <span>Vote locked & private · Tap to reset</span>
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
             <div className="bg-white rounded-2xl border border-[#E5E5E5] p-3.5 shadow-xs">
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
               <button 
                 type="button"
                 onClick={() => setShowLiveModal(true)}
                 className="w-full mt-2.5 bg-[#111111] hover:bg-black text-white text-[10.5px] font-bold py-2 rounded-xl shadow-xs hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
               >
                 <Video size={12} className="text-[#F4C430]" />
                 <span>Join Live Session</span>
               </button>
             </div>

             {/* Focus Timer Mobile */}
             <div className="bg-white rounded-2xl border border-[#E5E5E5] p-3 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold uppercase text-[#A3A3A3] block">Focus Timer</span>
                  <span className="text-lg font-mono font-extrabold text-[#111111]">{timerMinutes}:{timerSecs}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={toggleTimer}
                    className="w-8 h-8 rounded-xl bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] flex items-center justify-center cursor-pointer shadow-xs transition-transform active:scale-95"
                  >
                    {isTimerRunning ? <Pause size={12} /> : <Play size={12} fill="currentColor" />}
                  </button>
                  <button 
                    type="button"
                    onClick={resetTimer}
                    className="p-1.5 rounded-lg text-[#737373] hover:text-[#111111] hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>
             </div>

             {/* Subject Note Vault Mobile */}
             <div 
               onClick={() => setShowNoteModal(true)}
               className="bg-white rounded-2xl border border-[#E5E5E5] p-3.5 shadow-xs cursor-pointer hover:border-[#D4D4D4] transition-all"
             >
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#111111] mb-2 flex items-center justify-between">
                  <span>Subject Note Vault</span>
                  <span className="text-[9px] text-amber-600 font-bold">Tap to read &gt;</span>
                </div>
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
            minHeight: 560,
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
              <div className="bg-[#F5F5F5] rounded-md px-3 py-1 text-[10px] text-[#737373] max-w-[340px] text-center font-mono font-medium truncate">
                app.scholario.pk/{activeTab}?board={data.boardId}&grade={data.grade}
              </div>
              <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                {data.boardName} · {data.gradeLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#737373]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] font-bold text-emerald-700">Live Active Term</span>
            </div>
          </div>

          {/* Dashboard layout */}
          <div className="flex" style={{ minHeight: 520 }}>
            
            {/* Sidebar with Interactive Navigation */}
            <div className="w-[195px] shrink-0 bg-[#111111] flex flex-col py-5 px-3" style={{ minWidth: 195 }}>
              
              {/* Logo */}
              <Logo size="sm" variant="full" darkMode className="mb-6 px-2" />

              {/* Navigation Links (Interactive Tabs) */}
              <nav className="flex flex-col gap-1.5 flex-1">
                {[
                  { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'notes' as const, label: 'Notes Vault', icon: BookOpen },
                  { id: 'timetable' as const, label: 'Timetable', icon: Calendar },
                  { id: 'announcements' as const, label: 'Announcements', icon: Bell },
                  { id: 'sage' as const, label: 'Sage AI Tutor', icon: Sparkles },
                  { id: 'attendance' as const, label: 'Attendance', icon: ClipboardCheck },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-[#1F1F1F] text-white shadow-xs border border-[#333333]'
                          : 'text-[#737373] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon size={14} className={isActive ? 'text-[#F4C430]' : 'text-[#737373]'} />
                      <span>{item.label}</span>
                      {item.id === 'sage' && (
                        <span className="ml-auto text-[8px] px-1 py-0.2 rounded bg-amber-500/20 text-[#F4C430] font-black">
                          AI
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Profile at Bottom */}
              <div className="flex items-center gap-2.5 pt-3 border-t border-[#1F1F1F] px-1">
                <div className="w-7 h-7 rounded-full bg-[#F4C430] flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-[#111111]">{data.studentName.charAt(0)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10.5px] text-white font-semibold truncate leading-tight">{data.studentName}</div>
                  <div className="text-[9px] text-[#A3A3A3] truncate">{data.boardName} · {data.gradeLabel}</div>
                </div>
              </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 min-w-0 flex flex-col bg-white">
              
              {/* Header Bar */}
              <div className="flex items-center justify-between px-6 py-2.5 bg-white border-b border-[#F5F5F5]">
                <div className="relative flex items-center bg-[#F5F5F5] rounded-xl px-3 py-1.5 w-72">
                  <Search size={12} className="text-[#737373] shrink-0 mr-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${data.boardName} topics, formulas...`}
                    className="text-[10.5px] text-[#111111] bg-transparent border-none outline-none w-full placeholder-[#A3A3A3]"
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#FAFAFA] border border-[#F0F0F0] relative cursor-pointer hover:bg-gray-100">
                    <Bell size={13} className="text-[#525252]" />
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                  </div>
                  <div className="h-8 px-2.5 rounded-xl bg-[#FDF3C8] text-[#D4A017] flex items-center justify-center shrink-0 border border-[#FDF3C8] font-bold text-[11px] gap-1">
                    <GraduationCap size={13} />
                    <span>{data.gradeLabel}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic View Switcher based on activeTab */}
              {activeTab === 'dashboard' && (
                <div className="flex-1 min-w-0 overflow-y-auto px-6 py-3.5 space-y-3">
                  {/* Title Block */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-[16px] font-extrabold text-[#111111] leading-tight flex items-center gap-1.5">
                        <span>Good afternoon, {data.studentName.split(' ')[0]}</span>
                        <span>👋</span>
                      </h2>
                      <p className="text-[10.5px] text-[#737373] mt-0.5 font-medium">
                        Enrolled in <span className="font-bold text-[#111111]">{data.boardName} {data.gradeLabel}</span> ({data.stream})
                      </p>
                    </div>
                    <span className="text-[9.5px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ● Active Term Verified
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
                          Consistency Milestone: Level 4
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
                        <div>
                          <span className="text-[24px] font-extrabold text-[#111111] leading-none block">
                            {attendancePercent}%
                          </span>
                          <span className="text-[9.5px] text-[#737373] font-medium block mt-1">
                            {data.attendedClasses} attended
                          </span>
                        </div>
                        
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

                    {/* Next Class & Teacher Attendance Verification Card */}
                    <div className="bg-white rounded-2xl border border-[#E5E5E5] p-3 flex flex-col justify-between relative shadow-xs">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-[#A3A3A3] uppercase tracking-wider block">Next Lecture</span>
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#FFFBF0] text-[#D4A017] border border-[#FDF3C8]">
                            Today
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <span className="text-[13px] font-extrabold text-[#111111] leading-tight truncate">{data.nextSubject}</span>
                          <button 
                            type="button"
                            onClick={() => setShowLiveModal(true)}
                            className="text-[8px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded shrink-0 hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-0.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Live</span>
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-[#737373] font-medium mt-0.5">
                          <span className="truncate">{data.teacher}</span>
                          <div className="flex items-center gap-1 font-bold text-[#111111] shrink-0">
                            <Clock size={10} className="text-[#A3A3A3]" />
                            <span>{data.time}</span>
                          </div>
                        </div>
                      </div>

                      {/* Directly Below: Teacher Attendance Verification Card */}
                      <div className="pt-2 border-t border-[#F5F5F5] mt-2">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <UserCheck size={11} className="text-emerald-600 shrink-0" />
                            <span className="text-[8px] font-bold uppercase tracking-wider text-[#737373] truncate">
                              Teacher Verification
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
                              <span>Vote locked & private · Tap to reset</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setPreviewTeacherVote('present')}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[9.5px] rounded-xl shadow-xs transition-all cursor-pointer"
                              >
                                <Check size={12} strokeWidth={3} />
                                <span>Present</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setPreviewTeacherVote('absent')}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-300 hover:border-rose-400 active:scale-95 font-bold text-[9.5px] rounded-xl shadow-xs transition-all cursor-pointer"
                              >
                                <X size={12} strokeWidth={3} />
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
                    </div>

                    {/* Interactive Pomodoro Timer Card */}
                    <div className="bg-white rounded-2xl border border-[#E5E5E5] p-3 flex flex-col justify-between relative text-center shadow-xs">
                      {/* Mode toggle */}
                      <div className="flex justify-center bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg p-0.5 text-[8px]">
                        <button
                          type="button"
                          onClick={() => switchTimerMode('focus')}
                          className={`flex-1 py-0.5 font-bold rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            timerMode === 'focus'
                              ? 'bg-white border border-[#E5E5E5] text-[#111111] shadow-xs'
                              : 'text-[#A3A3A3] hover:text-[#111111]'
                          }`}
                        >
                          <span>🍅</span> Focus
                        </button>
                        <button
                          type="button"
                          onClick={() => switchTimerMode('break')}
                          className={`flex-1 py-0.5 font-bold rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            timerMode === 'break'
                              ? 'bg-white border border-[#E5E5E5] text-[#111111] shadow-xs'
                              : 'text-[#A3A3A3] hover:text-[#111111]'
                          }`}
                        >
                          <span>☕</span> Break
                        </button>
                      </div>

                      <div className="my-1">
                        <span className="text-[22px] font-mono font-extrabold text-[#111111] tracking-tight block leading-none">
                          {timerMinutes}:{timerSecs}
                        </span>
                        <span className="text-[8px] font-bold text-[#A3A3A3] uppercase tracking-widest mt-1 block">
                          {timerMode === 'focus' ? 'Deep Study' : 'Rest & Refresh'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-[#F5F5F5]">
                        <button
                          type="button"
                          onClick={resetTimer}
                          title="Reset Timer"
                          className="p-1 rounded-lg text-[#A3A3A3] hover:text-[#111111] hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <RotateCcw size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={toggleTimer}
                          className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer shadow-xs hover:scale-105 transition-transform ${
                            isTimerRunning ? 'bg-[#111111] text-white' : 'bg-[#F4C430] text-[#111111]'
                          }`}
                          title={isTimerRunning ? 'Pause' : 'Start'}
                        >
                          {isTimerRunning ? <Pause size={9} /> : <Play size={9} fill="currentColor" />}
                        </button>
                        <span className="text-[8px] font-bold text-[#A3A3A3]">
                          Session {sessionCount}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Third Row Grid: Timetable & Notes */}
                  <div className="grid grid-cols-5 gap-3 w-full">
                    
                    {/* Today's Timetable */}
                    <div className="col-span-3 bg-white rounded-2xl border border-[#E5E5E5] p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between pb-1 border-b border-[#F5F5F5]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10.5px] font-extrabold text-[#111111]">Daily Live Class Timetable</span>
                          <span className="text-[8.5px] bg-[#F5F5F5] font-bold px-1.5 py-0.2 rounded text-[#525252]">
                            {data.boardName} · {data.gradeLabel}
                          </span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setActiveTab('timetable')}
                          className="text-[8.5px] text-[#D4A017] hover:underline font-bold cursor-pointer"
                        >
                          View full week &gt;
                        </button>
                      </div>
                      
                      <div 
                        onClick={() => setShowLiveModal(true)}
                        className="flex items-center gap-2 p-2 rounded-xl bg-[#FAFAFA] border border-[#F0F0F0] cursor-pointer hover:border-amber-300 transition-all mt-2"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0 border border-amber-100">
                          {data.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-extrabold text-[#111111]">{data.nextSubject}</span>
                            <span className="text-[8.5px] font-bold text-amber-800 bg-amber-100/60 px-1.5 py-0.2 rounded">
                              {data.time}
                            </span>
                          </div>
                          <div className="text-[8.5px] text-[#737373] mt-0.5 truncate">{data.topic} · {data.teacher}</div>
                        </div>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                          Join Live
                        </span>
                      </div>
                    </div>

                    {/* Recent Notes Vault */}
                    <div className="col-span-2 bg-white rounded-2xl border border-[#E5E5E5] p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between pb-1 border-b border-[#F5F5F5]">
                        <span className="text-[10.5px] font-extrabold text-[#111111]">Recent Notes Vault</span>
                        <button 
                          type="button"
                          onClick={() => setActiveTab('notes')}
                          className="text-[8.5px] text-[#D4A017] hover:underline font-bold cursor-pointer"
                        >
                          Library &gt;
                        </button>
                      </div>

                      <div 
                        onClick={() => setShowNoteModal(true)}
                        className="flex items-center justify-between p-2 rounded-xl bg-[#FAFAFA] border border-[#F0F0F0] cursor-pointer hover:border-[#D4D4D4] transition-all mt-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#FFFBF0] flex items-center justify-center shrink-0 border border-[#FDF3C8]">
                            <span className="text-xs">📔</span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-[9.5px] font-bold text-[#111111] truncate">{data.recentNoteTitle}</div>
                            <div className="text-[8.5px] text-[#737373] mt-0.5 truncate">{data.recentNoteSubtitle}</div>
                          </div>
                        </div>
                        <span className="text-[#A3A3A3] text-[9px] shrink-0 font-bold ml-1">&gt;</span>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* View: Notes Vault */}
              {activeTab === 'notes' && (
                <div className="flex-1 min-w-0 overflow-y-auto px-6 py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-[#111111]">Notes Vault · {data.boardName}</h3>
                      <p className="text-xs text-[#737373]">Curriculum verified study sheets, derivations & solved numericals</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashboard')}
                      className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors"
                    >
                      &larr; Back to Dashboard
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { title: data.recentNoteTitle, subject: data.recentNoteSubject, desc: data.recentNoteSubtitle, pages: '18 pages', tag: 'Core Theory' },
                      { title: `${data.boardName} 5-Year Past Paper Marking Schemes`, subject: data.nextSubject, desc: 'Topical questions with examiner notes & model solutions', pages: '34 pages', tag: 'Past Papers' },
                      { title: `${data.gradeLabel} Comprehensive Formula Sheet`, subject: 'All Subjects', desc: 'Standard definitions, unit vectors & physical constants', pages: '8 pages', tag: 'Cheatsheet' },
                    ].map((note, idx) => (
                      <div 
                        key={idx}
                        onClick={() => setShowNoteModal(true)}
                        className="bg-white rounded-xl border border-[#E5E5E5] p-3.5 shadow-xs hover:border-[#D4D4D4] transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                              {note.tag}
                            </span>
                            <span className="text-[9px] text-[#A3A3A3] font-medium">{note.pages}</span>
                          </div>
                          <h4 className="text-xs font-bold text-[#111111] leading-tight mb-1">{note.title}</h4>
                          <p className="text-[10px] text-[#737373] line-clamp-2">{note.desc}</p>
                        </div>
                        <div className="pt-2 mt-2 border-t border-[#F5F5F5] flex items-center justify-between">
                          <span className="text-[9px] font-semibold text-[#111111]">{note.subject}</span>
                          <span className="text-[9px] font-bold text-amber-600 flex items-center gap-1">
                            Read Note &gt;
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View: Timetable */}
              {activeTab === 'timetable' && (
                <div className="flex-1 min-w-0 overflow-y-auto px-6 py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-[#111111]">Weekly Schedule · {data.boardName} {data.gradeLabel}</h3>
                      <p className="text-xs text-[#737373]">Live interactive lectures with two-way screen share & attendance locking</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashboard')}
                      className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors"
                    >
                      &larr; Back to Dashboard
                    </button>
                  </div>

                  <div className="space-y-2">
                    {[
                      { day: 'Monday & Wednesday', subject: data.nextSubject, time: data.time, teacher: data.teacher, topic: data.topic, active: true },
                      { day: 'Tuesday & Thursday', subject: 'Second Enrolled Subject', time: '5:45 PM - 6:45 PM', teacher: 'Department Faculty', topic: 'Mid-Term Review & Past Paper Drills', active: false },
                      { day: 'Friday', subject: 'Weekly Sage AI & Doubt Clearing', time: '4:00 PM - 5:30 PM', teacher: 'Senior Mentors', topic: 'Live Question & Answer Seminar', active: false },
                    ].map((slot, idx) => (
                      <div 
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between ${
                          slot.active ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-[#E5E5E5]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            slot.active ? 'bg-[#F4C430] text-[#111111]' : 'bg-gray-100 text-gray-700'
                          }`}>
                            <Calendar size={14} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#111111]">{slot.subject}</span>
                              <span className="text-[10px] text-[#737373] font-medium">• {slot.day}</span>
                            </div>
                            <div className="text-[10px] text-[#737373] mt-0.5">{slot.topic} · {slot.teacher}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-[#111111]">{slot.time}</span>
                          <button
                            type="button"
                            onClick={() => setShowLiveModal(true)}
                            className="px-3 py-1.5 rounded-xl bg-[#111111] hover:bg-black text-white text-[10px] font-bold shadow-xs transition-transform active:scale-95 cursor-pointer"
                          >
                            Enter Room
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View: Sage AI Tutor */}
              {activeTab === 'sage' && (
                <div className="flex-1 min-w-0 overflow-y-auto px-6 py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-[#111111] flex items-center gap-1.5">
                        <Sparkles size={16} className="text-[#F4C430]" />
                        <span>Sage AI Tutor · {data.boardName} Specialist</span>
                      </h3>
                      <p className="text-xs text-[#737373]">Instant textbook-grounded explanations, step-by-step proofs and derivations</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashboard')}
                      className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors"
                    >
                      &larr; Back to Dashboard
                    </button>
                  </div>

                  {/* Simulated Sage Chat */}
                  <div className="bg-[#FAFAFA] rounded-2xl border border-[#E5E5E5] p-4 space-y-3">
                    <div className="flex items-start gap-2.5 max-w-[85%]">
                      <div className="w-7 h-7 rounded-full bg-[#111111] text-[#F4C430] flex items-center justify-center font-bold text-[10px] shrink-0">
                        S
                      </div>
                      <div className="bg-white p-3 rounded-2xl border border-[#E5E5E5] text-xs text-[#111111] shadow-xs">
                        Hi {data.studentName.split(' ')[0]}! I'm calibrated to your <strong>{data.boardName} {data.gradeLabel} ({data.nextSubject})</strong> curriculum. What concept can we solve today?
                      </div>
                    </div>

                    <div className="flex items-start justify-end gap-2.5">
                      <div className="bg-[#111111] text-white p-3 rounded-2xl text-xs max-w-[85%] shadow-xs">
                        {data.sageQuestion || 'Can you review the key concepts for this chapter?'}
                      </div>
                      <div className="w-7 h-7 rounded-full bg-[#F4C430] text-[#111111] flex items-center justify-center font-bold text-[10px] shrink-0">
                        {data.studentName.charAt(0)}
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 max-w-[90%]">
                      <div className="w-7 h-7 rounded-full bg-[#111111] text-[#F4C430] flex items-center justify-center font-bold text-[10px] shrink-0">
                        S
                      </div>
                      <div className="bg-white p-3.5 rounded-2xl border border-[#E5E5E5] text-xs text-[#111111] shadow-xs space-y-1.5">
                        <div className="font-bold text-amber-800 text-[11px] flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          <span>Grounded in official {data.boardName} Syllabus</span>
                        </div>
                        <p className="leading-relaxed text-[#333333]">
                          {data.sageAnswer || 'Here is the step-by-step breakdown according to the syllabus learning outcomes.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* View: Attendance */}
              {activeTab === 'attendance' && (
                <div className="flex-1 min-w-0 overflow-y-auto px-6 py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-[#111111]">Attendance & Transparency Ledger</h3>
                      <p className="text-xs text-[#737373]">Bi-directional student confirmation with fraud-proof verification</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashboard')}
                      className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors"
                    >
                      &larr; Back to Dashboard
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3.5 rounded-xl border border-[#E5E5E5]">
                      <span className="text-[10px] font-bold text-[#A3A3A3] uppercase">Overall Attendance</span>
                      <div className="text-2xl font-extrabold text-emerald-600 mt-0.5">{attendancePercent}%</div>
                      <span className="text-[10px] text-[#737373]">Above minimum 75% threshold</span>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-[#E5E5E5]">
                      <span className="text-[10px] font-bold text-[#A3A3A3] uppercase">Attended Classes</span>
                      <div className="text-2xl font-extrabold text-[#111111] mt-0.5">{data.attendedClasses} / {data.classesTotal}</div>
                      <span className="text-[10px] text-[#737373]">{data.classesLeft} scheduled remaining</span>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-[#E5E5E5]">
                      <span className="text-[10px] font-bold text-[#A3A3A3] uppercase">Teacher Ratings</span>
                      <div className="text-2xl font-extrabold text-amber-600 mt-0.5">100% Punctual</div>
                      <span className="text-[10px] text-[#737373]">Consistently on-time lectures</span>
                    </div>
                  </div>
                </div>
              )}

              {/* View: Announcements */}
              {activeTab === 'announcements' && (
                <div className="flex-1 min-w-0 overflow-y-auto px-6 py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-[#111111]">Board & Academy Announcements</h3>
                      <p className="text-xs text-[#737373]">Real-time exam schedule updates, past paper releases & class links</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashboard')}
                      className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors"
                    >
                      &larr; Back to Dashboard
                    </button>
                  </div>

                  <div className="space-y-2">
                    {[
                      { title: `${data.boardName} Exam Registration Window Opened`, date: 'Yesterday at 5:00 PM', desc: 'Ensure all subject selections and candidate IDs are verified before the registration deadline.' },
                      { title: `${data.nextSubject} Practice Mock Test Schedule`, date: '3 days ago', desc: 'A 60-minute proctored assessment will be conducted this coming weekend.' },
                      { title: 'New Past Paper Marking Schemes Added to Vault', date: '5 days ago', desc: 'Download watermarked solutions with step-by-step examiner marking rubrics.' },
                    ].map((ann, idx) => (
                      <div key={idx} className="bg-white p-3.5 rounded-xl border border-[#E5E5E5]">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[#111111]">{ann.title}</h4>
                          <span className="text-[9.5px] text-[#A3A3A3] font-medium">{ann.date}</span>
                        </div>
                        <p className="text-[11px] text-[#737373] mt-1">{ann.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* ── Interactive Live Classroom Modal Simulator ── */}
      {showLiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-[#111111] text-white w-full max-w-xl rounded-2xl border border-[#262626] shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#1F1F1F] border-b border-[#262626] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-sm">Scholario Live Classroom · {data.nextSubject}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowLiveModal(false)}
                className="p-1 rounded-lg text-[#A3A3A3] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="bg-black/50 rounded-xl border border-[#262626] aspect-video flex flex-col items-center justify-center relative overflow-hidden">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-full bg-[#F4C430] text-[#111111] font-extrabold text-base flex items-center justify-center mx-auto shadow-md">
                    {data.teacher.charAt(0)}
                  </div>
                  <div className="font-bold text-sm text-white">{data.teacher}</div>
                  <div className="text-xs text-[#A3A3A3]">{data.topic}</div>
                </div>
                <div className="absolute bottom-3 left-3 bg-black/70 px-2 py-1 rounded text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>HD 1080p Whiteboard Stream Active</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#A3A3A3] pt-2 border-t border-[#262626]">
                <div>
                  <span>Class: </span>
                  <span className="text-white font-bold">{data.boardName} {data.gradeLabel}</span>
                </div>
                <div>
                  <span>Time: </span>
                  <span className="text-white font-bold">{data.time}</span>
                </div>
                <div>
                  <span>Students In Room: </span>
                  <span className="text-emerald-400 font-bold">24 Active</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowLiveModal(false)}
                  className="flex-1 py-2.5 px-4 bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer text-center"
                >
                  Enter Classroom Stream
                </button>
                <button
                  type="button"
                  onClick={() => setShowLiveModal(false)}
                  className="py-2.5 px-4 bg-[#262626] hover:bg-[#333333] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Interactive Note Preview Modal Simulator ── */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white text-[#111111] w-full max-w-lg rounded-2xl border border-[#E5E5E5] shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#FAFAFA] border-b border-[#E5E5E5] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-[#D4A017]" />
                <span className="font-bold text-sm">Note Vault Reader · {data.boardName}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowNoteModal(false)}
                className="p-1 rounded-lg text-[#737373] hover:text-[#111111] hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  {data.recentNoteSubject} · {data.gradeLabel}
                </span>
                <h3 className="text-base font-extrabold text-[#111111] mt-1.5">{data.recentNoteTitle}</h3>
                <p className="text-xs text-[#737373] mt-0.5">{data.recentNoteSubtitle}</p>
              </div>

              <div className="bg-[#F9F9F9] rounded-xl border border-[#E5E5E5] p-3.5 space-y-2 text-xs text-[#333333]">
                <div className="font-bold text-[#111111] text-[11px] uppercase tracking-wider">
                  Summary & Formula Quick Highlights:
                </div>
                <p className="leading-relaxed">
                  Includes comprehensive SLO derivations, past paper short response rubrics, and high-frequency examination diagrams aligned specifically to the {data.boardName} curriculum.
                </p>
                <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between text-[11px]">
                  <span className="text-[#737373]">Watermarked for registered student:</span>
                  <span className="font-bold text-[#111111]">{data.studentName}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="flex-1 py-2.5 px-4 bg-[#111111] hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download size={13} />
                  <span>Download Watermarked PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="py-2.5 px-4 bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#111111] font-bold text-xs rounded-xl transition-colors cursor-pointer"
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
