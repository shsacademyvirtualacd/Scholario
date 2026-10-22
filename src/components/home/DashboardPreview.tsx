import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, BookOpen, Calendar, Bell, Search, Clock, Play, Pause, RotateCcw, Sparkles, ClipboardCheck,
  GraduationCap, UserCheck, Check, X, Lock, ShieldCheck, Video, Download, CheckCircle2, ChevronRight
} from 'lucide-react';
import Logo from '../ui/Logo';
import { useMobile } from '../../hooks/useMobile';

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

// ── Purely Fictional Academic Demo Profiles (Zero Real Names) ──
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
    topic: 'Unit 3: Dynamics & Newton\'s Laws of Motion',
    recentNoteTitle: 'Unit 3 — Dynamics & Momentum Derivations',
    recentNoteSubject: 'Physics',
    recentNoteSubtitle: 'Comprehensive SLO Solutions & Solved Numericals',
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
    teacher: 'Instructor Asim (Mathematics)',
    time: '4:30 PM',
    topic: 'Ch 4: Quadratic Equations & Roots Theory',
    recentNoteTitle: 'Matrices & Determinants Comprehensive Vault',
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
    sageQuestion: 'Explain the sliding filament model of muscle contraction during nerve stimulation.',
    sageAnswer: 'Upon Ca²⁺ binding to troponin, tropomyosin uncovers myosin binding sites on actin. ATP hydrolysis activates myosin cross-bridges to pull actin filaments inward (power stroke), shortening the sarcomere.',
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
    sageQuestion: 'Derive the second equation of motion S = vit + 1/2 at² using speed-time graph.',
    sageAnswer: 'Using a speed-time graph: Total distance S = Area of rectangle OACD + Area of triangle ABC. S = (OA × OD) + 1/2 (AC × BC) = (vi × t) + 1/2 (t × at) = vit + 1/2 at².',
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
    sageQuestion: 'What are the three standard methods to solve a quadratic equation in 10th Punjab Board?',
    sageAnswer: '1. Factorization, 2. Completing Square Method, 3. Using the Quadratic Formula x = (-b ± √(b² - 4ac)) / (2a).',
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
    sageQuestion: 'How to identify the limiting reactant in a chemical reaction?',
    sageAnswer: '1. Calculate number of moles of each reactant from given mass. 2. Use balanced equation to calculate moles of product formed by each reactant. 3. The reactant that gives the least amount of product is the limiting reactant.',
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
    sageQuestion: 'Explain the role of ADH in osmoregulation according to Punjab Board 12th Biology.',
    sageAnswer: 'When body fluids are concentrated, osmoreceptors in hypothalamus stimulate pituitary to release ADH (Antidiuretic Hormone). ADH increases water permeability of collecting ducts, producing concentrated urine and conserving water.',
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
    sageQuestion: 'List the biological method steps according to Sindh Board textbook.',
    sageAnswer: '1. Recognition of biological problem, 2. Observations, 3. Hypothesis formulation, 4. Deduction, 5. Experimentation, 6. Summarization of results, 7. Reporting.',
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
    sageQuestion: 'Difference between while loop and do-while loop in C++?',
    sageAnswer: 'A while loop evaluates the condition before executing the loop body (entry-controlled), while do-while executes the loop body at least once before evaluating condition (exit-controlled).',
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
    sageQuestion: 'Derive maximum range of a projectile fired at angle θ.',
    sageAnswer: 'Horizontal range R = (v₀² sin 2θ) / g. Maximum range occurs when sin 2θ = 1, meaning 2θ = 90° or θ = 45°, giving R_max = v₀² / g.',
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
    sageQuestion: 'Compare SN1 vs SN2 nucleophilic substitution mechanisms.',
    sageAnswer: 'SN1 is two-step, unimolecular rate = k[R-X], proceeds via carbocation intermediate with racemization (favored by 3° halides). SN2 is single-step concerted, bimolecular rate = k[R-X][Nu⁻] with Walden inversion (favored by 1° halides).',
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
    sageQuestion: 'Derive 2as = vf² - vi² graphically using speed-time graph.',
    sageAnswer: 'The total area under the v-t graph represents distance s = 1/2 (vi + vf) × t. From acceleration a = (vf - vi) / t, substituting t = (vf - vi) / a gives s = (vf² - vi²) / (2a), yielding 2as = vf² - vi².',
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
    sageQuestion: 'How to resolve an improper fraction into partial fractions?',
    sageAnswer: 'First perform polynomial division so the quotient is separated and the remainder fraction is proper (degree of numerator < degree of denominator). Then resolve the proper remainder fraction into partial fractions.',
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
    sageQuestion: 'Explain lock-and-key vs induced-fit models of enzyme action.',
    sageAnswer: 'Fischer\'s lock-and-key model posits that the active site is rigid and pre-formed. Koshland\'s induced-fit model suggests the active site is flexible and molds slightly around substrate upon binding to lower activation energy.',
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
    sageQuestion: 'Why do transition metal complexes exhibit distinct colors?',
    sageAnswer: 'Ligand fields split degenerate d-orbitals into eg and t2g sets with an energy gap ΔE. Absorbing visible light photons promotes d-electrons (d-d transition), and the complementary transmitted wavelength appears as the color.',
  },

  // ── Cambridge O Levels ──
  'olevel-9': {
    boardId: 'olevel',
    boardName: 'Cambridge O Levels',
    grade: '9',
    gradeLabel: 'O1 (Year 9)',
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
    sageQuestion: 'Why does ammonia gas diffuse faster than hydrogen chloride gas?',
    sageAnswer: 'Diffusion rate is inversely proportional to square root of relative molecular mass (Mr). Mr of NH₃ = 17, while Mr of HCl = 36.5. Lighter particles move with higher average velocity at constant temperature.',
  },
  'olevel-10': {
    boardId: 'olevel',
    boardName: 'Cambridge O Levels',
    grade: '10',
    gradeLabel: 'O2 (Year 10)',
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
    sageQuestion: 'How to calculate matrix inverse for 2x2 matrix [[a,b],[c,d]]?',
    sageAnswer: 'Determinant det(M) = ad - bc. If det(M) ≠ 0, inverse M⁻¹ = (1 / det) * [[d, -b], [-c, a]]. If det(M) = 0, no inverse exists (singular matrix).',
  },
  'olevel-11': {
    boardId: 'olevel',
    boardName: 'Cambridge O Levels',
    grade: '11',
    gradeLabel: 'O3 (Final Year)',
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
    sageQuestion: 'How does linear search compare to binary search algorithm?',
    sageAnswer: 'Linear search scans element by element in O(n) time on unordered arrays. Binary search repeatedly halves search range in O(log n) time, but strictly requires the array to be pre-sorted.',
  },

  // ── Cambridge A Levels ──
  'alevel-11': {
    boardId: 'alevel',
    boardName: 'Cambridge A Levels',
    grade: '11',
    gradeLabel: 'AS / A1 Level',
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
    sageQuestion: 'How to evaluate definite integral with substitution method in CIE Pure 1?',
    sageAnswer: 'Let u = g(x). Compute du = g\'(x) dx. Transform upper and lower limits: u_lower = g(a), u_upper = g(b). Substitute inside integrand and evaluate without having to revert back to x.',
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
    sageQuestion: 'Why is gravitational potential defined as negative in Cambridge Physics 9702?',
    sageAnswer: 'Gravitational potential at infinity is arbitrarily defined as zero. Because gravity is an attractive force, external work must be done against gravity to move a mass to infinity, meaning potential at all finite distances is lower than zero (negative).',
  },

  // ── IELTS Preparation ──
  'ielts-10': {
    boardId: 'ielts',
    boardName: 'IELTS Academic',
    grade: '10',
    gradeLabel: 'Academic Module',
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
    sageQuestion: 'What are the four grading criteria for IELTS Writing Task 2?',
    sageAnswer: '1. Task Achievement / Response (25%), 2. Coherence and Cohesion (25%), 3. Lexical Resource / Vocabulary (25%), 4. Grammatical Range and Accuracy (25%).',
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
    sageQuestion: 'How to structure a 2-minute response for IELTS Speaking Part 2?',
    sageAnswer: 'Use the 1-minute prep time to jot down keywords for: 1. Introduction (what/who), 2. Background story (when/where), 3. Detailed action/emotion (how/why), 4. Reflection on importance. Aim to speak without pausing until examiner stops you.',
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

  // Modals
  const [showLiveModal, setShowLiveModal] = useState<boolean>(false);
  const [showNoteModal, setShowNoteModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Grade options based on current board (including smaller AS/A2 toggle)
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
  const attendancePercent = Math.round((data.attendedClasses / data.classesTotal) * 100);

  return (
    <div className="w-full">
      {/* ─── Single Clean Device Mockup Frame ─── */}
      <div
        className="relative w-full rounded-2xl sm:rounded-3xl border border-[#D4D4D4] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#111111] shadow-2xl overflow-hidden transition-all"
        style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
      >
        {/* Top Device Bar (Chrome + Board Chips + Smaller AS/A2 Toggle) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-[#1A1A1A] border-b border-[#E5E5E5] dark:border-[#262626]">
          {/* Left: Window Dots */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
            <span className="hidden sm:inline-block text-[11px] font-bold text-[#737373] dark:text-[#A3A3A3] ml-2">
              Scholario Portal
            </span>
          </div>

          {/* Center: Board chips in ONE horizontally scrollable row (no wrapping!) */}
          <div className="flex-1 min-w-0 max-w-full overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex items-center gap-1 py-0.5 whitespace-nowrap">
              {PREVIEW_BOARDS.map((board) => (
                <button
                  key={board.id}
                  type="button"
                  onClick={() => handleBoardChange(board.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    activeBoard === board.id
                      ? 'bg-[#F4C430] text-[#111111] shadow-xs'
                      : 'bg-[#F0F0F0] dark:bg-[#262626] text-[#525252] dark:text-[#A3A3A3] hover:text-[#111111] dark:hover:text-white'
                  }`}
                >
                  {board.shortLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Smaller AS/A2 / Grade Toggle (Compact Segmented Pills) */}
          <div className="flex items-center gap-0.5 bg-[#F0F0F0] dark:bg-[#262626] p-0.5 rounded-lg shrink-0">
            {getAvailableGrades().map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setActiveGrade(g.id)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                  activeGrade === g.id
                    ? 'bg-white dark:bg-[#111111] text-[#111111] dark:text-white shadow-xs'
                    : 'text-[#737373] dark:text-[#A3A3A3] hover:text-[#111111] dark:hover:text-white'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Responsive Inner Content Area ─── */}
        {isMobile ? (
          /* Single Clean Mobile Interface (No nested phone frame!) */
          <div className="p-4 space-y-3 bg-[#FAFAFA] dark:bg-[#111111] text-left">
            {/* Student greeting header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E5] dark:border-[#262626]">
              <div>
                <span className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider block">Student Dashboard</span>
                <span className="text-base font-extrabold text-[#111111] dark:text-white leading-tight block">{data.studentName}</span>
                <span className="text-[10px] font-semibold text-[#D4A017]">{data.boardName} · {data.gradeLabel} ({data.stream})</span>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                ● Enrolled
              </span>
            </div>

            {/* Attendance verification */}
            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-[#E5E5E5] dark:border-[#262626] p-3 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#737373] dark:text-[#A3A3A3] flex items-center gap-1">
                  <UserCheck size={11} className="text-emerald-600" /> Attendance Verification
                </span>
                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                  Live
                </span>
              </div>
              <div className="text-[11px] font-bold text-[#111111] dark:text-white">
                Was <span className="text-[#D4A017]">{data.teacher}</span> present?
              </div>
              <div className="text-[9px] text-[#737373] dark:text-[#A3A3A3] mt-0.5">
                {data.nextSubject} · {data.time}
              </div>

              {previewTeacherVote ? (
                <button
                  type="button"
                  onClick={() => setPreviewTeacherVote(null)}
                  className="w-full mt-2 py-1.5 px-2 rounded-xl text-[10px] font-bold border cursor-pointer bg-emerald-50 text-emerald-800 border-emerald-500"
                >
                  Marked: {previewTeacherVote === 'present' ? 'Present ✓' : 'Absent ✕'} (Tap to reset)
                </button>
              ) : (
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setPreviewTeacherVote('present')}
                    className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl shadow-xs transition-colors"
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTeacherVote('absent')}
                    className="flex-1 py-1.5 px-2 bg-white dark:bg-[#262626] border border-rose-300 text-rose-700 text-[10px] font-bold rounded-xl shadow-xs transition-colors"
                  >
                    Absent
                  </button>
                </div>
              )}
            </div>

            {/* Up Next Lecture Card */}
            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-[#E5E5E5] dark:border-[#262626] p-3 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">Up Next</span>
                <span className="text-[10px] font-bold text-[#737373] flex items-center gap-1">
                  <Clock size={10} /> {data.time}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 flex items-center justify-center text-base shrink-0">
                  {data.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-[#111111] dark:text-white truncate">{data.nextSubject}</div>
                  <div className="text-[10px] text-[#737373] dark:text-[#A3A3A3] truncate">{data.topic}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLiveModal(true)}
                className="w-full mt-2.5 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-xs font-bold py-2 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Video size={13} className="text-[#F4C430]" />
                <span>Join Live Session</span>
              </button>
            </div>

            {/* Focus Timer */}
            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-[#E5E5E5] dark:border-[#262626] p-3 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold uppercase text-[#A3A3A3] block">Focus Timer</span>
                <span className="text-lg font-mono font-extrabold text-[#111111] dark:text-white">
                  {timerMinutes}:{timerSecs}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleTimer}
                  className="w-8 h-8 rounded-xl bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] flex items-center justify-center cursor-pointer shadow-xs"
                >
                  {isTimerRunning ? <Pause size={12} /> : <Play size={12} fill="currentColor" />}
                </button>
                <button
                  type="button"
                  onClick={resetTimer}
                  className="p-1.5 rounded-lg text-[#737373] hover:text-[#111111] dark:hover:text-white"
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>

            {/* Note Vault card */}
            <div
              onClick={() => setShowNoteModal(true)}
              className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-[#E5E5E5] dark:border-[#262626] p-3 shadow-xs cursor-pointer hover:border-[#D4A017] transition-colors"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#111111] dark:text-white mb-1.5 flex items-center justify-between">
                <span>Subject Note Vault</span>
                <span className="text-[9px] text-[#D4A017] font-bold flex items-center">
                  Read &gt;
                </span>
              </div>
              <div className="text-[11px] font-bold text-[#111111] dark:text-white truncate">{data.recentNoteTitle}</div>
              <div className="text-[9px] text-[#737373] dark:text-[#A3A3A3] mt-0.5 truncate">{data.recentNoteSubtitle}</div>
            </div>
          </div>
        ) : (
          /* Desktop & Tablet Mockup Layout */
          <div className="flex min-h-[520px] text-left">
            {/* Sidebar */}
            <div className="w-[195px] shrink-0 bg-[#111111] dark:bg-[#0A0A0A] text-white flex flex-col py-5 px-3 border-r border-[#262626]">
              <Logo size="sm" variant="full" darkMode className="mb-6 px-2" />

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

              {/* Student footer */}
              <div className="flex items-center gap-2.5 pt-3 border-t border-[#1F1F1F] px-1">
                <div className="w-7 h-7 rounded-full bg-[#F4C430] text-[#111111] flex items-center justify-center font-bold text-xs shrink-0">
                  {data.studentName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-white truncate">{data.studentName}</div>
                  <div className="text-[9px] text-[#A3A3A3] truncate">{data.boardName} · {data.gradeLabel}</div>
                </div>
              </div>
            </div>

            {/* Workspace Area */}
            <div className="flex-1 min-w-0 flex flex-col bg-white dark:bg-[#141414]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-2.5 border-b border-[#F0F0F0] dark:border-[#262626]">
                <div className="relative flex items-center bg-[#F5F5F5] dark:bg-[#1F1F1F] rounded-xl px-3 py-1.5 w-64">
                  <Search size={12} className="text-[#737373] mr-2 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${data.boardName} topics...`}
                    className="text-[11px] text-[#111111] dark:text-white bg-transparent border-none outline-none w-full"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 flex items-center gap-1">
                    <GraduationCap size={13} />
                    <span>{data.boardName} {data.gradeLabel}</span>
                  </span>
                </div>
              </div>

              {/* Tab 1: Dashboard View */}
              {activeTab === 'dashboard' && (
                <div className="p-5 space-y-4 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-[#111111] dark:text-white">
                        Welcome back, {data.studentName.split(' ')[0]} 👋
                      </h3>
                      <p className="text-xs text-[#737373] dark:text-[#A3A3A3] mt-0.5">
                        Enrolled in {data.boardName} {data.gradeLabel} · {data.stream}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      ● Active Term Verified
                    </span>
                  </div>

                  {/* 4 Cards Grid */}
                  <div className="grid grid-cols-4 gap-3">
                    {/* Streak */}
                    <div className="bg-[#FAFAFA] dark:bg-[#1A1A1A] p-3 rounded-2xl border border-[#E5E5E5] dark:border-[#262626] flex flex-col justify-between">
                      <span className="text-[9px] font-bold text-[#A3A3A3] uppercase">Study Streak</span>
                      <div className="my-1">
                        <span className="text-2xl font-extrabold text-[#111111] dark:text-white">{data.streak}</span>
                        <span className="text-[10px] text-[#737373] ml-1">days continuous</span>
                      </div>
                      <div className="text-[8px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 p-1 rounded">
                        Milestone Level 4 Active
                      </div>
                    </div>

                    {/* Attendance */}
                    <div className="bg-[#FAFAFA] dark:bg-[#1A1A1A] p-3 rounded-2xl border border-[#E5E5E5] dark:border-[#262626] flex flex-col justify-between">
                      <span className="text-[9px] font-bold text-[#A3A3A3] uppercase">Attendance</span>
                      <div className="my-1">
                        <span className="text-2xl font-extrabold text-[#111111] dark:text-white">{attendancePercent}%</span>
                        <span className="text-[10px] text-[#737373] ml-1">{data.attendedClasses}/{data.classesTotal}</span>
                      </div>
                      <div className="text-[8px] font-bold text-[#737373]">{data.classesLeft} lectures remaining</div>
                    </div>

                    {/* Next Class & Teacher Verification */}
                    <div className="bg-[#FAFAFA] dark:bg-[#1A1A1A] p-3 rounded-2xl border border-[#E5E5E5] dark:border-[#262626] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-[#A3A3A3] uppercase">Next Lecture</span>
                          <span className="text-[8px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                            {data.time}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-[#111111] dark:text-white mt-1 truncate">{data.nextSubject}</div>
                        <div className="text-[10px] text-[#737373] dark:text-[#A3A3A3] truncate">{data.teacher}</div>
                      </div>

                      <div className="pt-2 border-t border-[#EBEBEB] dark:border-[#262626]">
                        {previewTeacherVote ? (
                          <div className="text-[9px] font-bold text-emerald-600 flex items-center justify-between">
                            <span>Vote: {previewTeacherVote}</span>
                            <button
                              type="button"
                              onClick={() => setPreviewTeacherVote(null)}
                              className="text-[8px] underline text-[#737373]"
                            >
                              Reset
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setPreviewTeacherVote('present')}
                              className="flex-1 py-1 bg-emerald-600 text-white rounded text-[9px] font-bold"
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewTeacherVote('absent')}
                              className="flex-1 py-1 bg-white dark:bg-[#262626] border border-rose-300 text-rose-700 rounded text-[9px] font-bold"
                            >
                              Absent
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pomodoro Timer */}
                    <div className="bg-[#FAFAFA] dark:bg-[#1A1A1A] p-3 rounded-2xl border border-[#E5E5E5] dark:border-[#262626] flex flex-col justify-between text-center">
                      <div className="text-[8px] font-bold text-[#A3A3A3] uppercase">
                        {timerMode === 'focus' ? 'Focus Timer' : 'Break Timer'}
                      </div>
                      <div className="text-xl font-mono font-extrabold text-[#111111] dark:text-white my-0.5">
                        {timerMinutes}:{timerSecs}
                      </div>
                      <div className="flex items-center justify-center gap-1.5 pt-1 border-t border-[#EBEBEB] dark:border-[#262626]">
                        <button
                          type="button"
                          onClick={toggleTimer}
                          className="px-2 py-0.5 rounded bg-[#F4C430] text-[#111111] text-[9px] font-bold cursor-pointer"
                        >
                          {isTimerRunning ? 'Pause' : 'Start'}
                        </button>
                        <button
                          type="button"
                          onClick={resetTimer}
                          className="p-1 rounded text-[#737373] hover:text-[#111111] dark:hover:text-white cursor-pointer"
                        >
                          <RotateCcw size={10} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Strip: Timetable entry + Notes preview */}
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => setShowLiveModal(true)}
                      className="p-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#262626] hover:border-[#F4C430] transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                          {data.icon}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-[#111111] dark:text-white block truncate">{data.nextSubject} · Live Class</span>
                          <span className="text-[10px] text-[#737373] dark:text-[#A3A3A3] block truncate">{data.topic}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-[#111111] dark:bg-white text-white dark:text-[#111111] shrink-0">
                        Join Lecture
                      </span>
                    </div>

                    <div
                      onClick={() => setShowNoteModal(true)}
                      className="p-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#262626] hover:border-[#F4C430] transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#FFFBF0] dark:bg-[#262626] text-amber-700 flex items-center justify-center shrink-0">
                          📔
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-[#111111] dark:text-white block truncate">{data.recentNoteTitle}</span>
                          <span className="text-[10px] text-[#737373] dark:text-[#A3A3A3] block truncate">{data.recentNoteSubtitle}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#D4A017] shrink-0">
                        Read Vault →
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Notes View */}
              {activeTab === 'notes' && (
                <div className="p-5 space-y-3 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-[#111111] dark:text-white">
                      Notes Vault · {data.boardName} {data.gradeLabel}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashboard')}
                      className="text-xs font-bold text-[#D4A017]"
                    >
                      ← Back to Dashboard
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => setShowNoteModal(true)}
                      className="p-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#262626] cursor-pointer hover:border-[#D4A017]"
                    >
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800">Theory Vault</span>
                      <h4 className="text-xs font-bold text-[#111111] dark:text-white mt-1.5">{data.recentNoteTitle}</h4>
                      <p className="text-[10px] text-[#737373] dark:text-[#A3A3A3] mt-0.5">{data.recentNoteSubtitle}</p>
                    </div>
                    <div
                      onClick={() => setShowNoteModal(true)}
                      className="p-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#262626] cursor-pointer hover:border-[#D4A017]"
                    >
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800">Past Papers</span>
                      <h4 className="text-xs font-bold text-[#111111] dark:text-white mt-1.5">{data.boardName} 5-Year Past Papers</h4>
                      <p className="text-[10px] text-[#737373] dark:text-[#A3A3A3] mt-0.5">Examiner marking schemes and worked model answers</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Timetable View */}
              {activeTab === 'timetable' && (
                <div className="p-5 space-y-3 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-[#111111] dark:text-white">Weekly Live Class Timetable</h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashboard')}
                      className="text-xs font-bold text-[#D4A017]"
                    >
                      ← Back to Dashboard
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-[#111111] dark:text-white">{data.nextSubject} · Today</div>
                        <div className="text-[10px] text-[#737373] dark:text-[#A3A3A3]">{data.topic} · {data.teacher}</div>
                      </div>
                      <span className="text-xs font-bold font-mono text-[#111111] dark:text-white">{data.time}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#262626] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-[#111111] dark:text-white">Second Subject Lecture · Tomorrow</div>
                        <div className="text-[10px] text-[#737373] dark:text-[#A3A3A3]">Mid-Term Revision Seminar</div>
                      </div>
                      <span className="text-xs font-bold font-mono text-[#737373]">5:30 PM</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Sage AI View */}
              {activeTab === 'sage' && (
                <div className="p-5 space-y-3 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-[#111111] dark:text-white flex items-center gap-1.5">
                      <Sparkles size={14} className="text-[#F4C430]" />
                      <span>Sage AI Academic Companion</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashboard')}
                      className="text-xs font-bold text-[#D4A017]"
                    >
                      ← Back to Dashboard
                    </button>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#FAFAFA] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#262626] space-y-3">
                    <div className="text-xs text-[#111111] dark:text-white">
                      <strong>Student Question:</strong> {data.sageQuestion}
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#262626] text-xs leading-relaxed text-[#333333] dark:text-[#CCCCCC]">
                      <span className="font-bold text-[#D4A017] block mb-1">Sage AI Tutor:</span>
                      {data.sageAnswer}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Attendance View */}
              {activeTab === 'attendance' && (
                <div className="p-5 space-y-3 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-[#111111] dark:text-white">Attendance Verification Ledger</h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashboard')}
                      className="text-xs font-bold text-[#D4A017]"
                    >
                      ← Back to Dashboard
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#262626]">
                      <span className="text-[10px] text-[#A3A3A3] font-bold uppercase">Rate</span>
                      <div className="text-2xl font-black text-emerald-600 mt-1">{attendancePercent}%</div>
                      <span className="text-[10px] text-[#737373]">Above threshold</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#262626]">
                      <span className="text-[10px] text-[#A3A3A3] font-bold uppercase">Lectures</span>
                      <div className="text-2xl font-black text-[#111111] dark:text-white mt-1">{data.attendedClasses} / {data.classesTotal}</div>
                      <span className="text-[10px] text-[#737373]">Verified present</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#262626]">
                      <span className="text-[10px] text-[#A3A3A3] font-bold uppercase">Punctuality</span>
                      <div className="text-2xl font-black text-amber-600 mt-1">100%</div>
                      <span className="text-[10px] text-[#737373]">On-time token</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: Announcements View */}
              {activeTab === 'announcements' && (
                <div className="p-5 space-y-3 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-[#111111] dark:text-white">Academy Announcements</h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashboard')}
                      className="text-xs font-bold text-[#D4A017]"
                    >
                      ← Back to Dashboard
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#262626]">
                      <h4 className="text-xs font-bold text-[#111111] dark:text-white">{data.boardName} Exam Timetable Released</h4>
                      <p className="text-[10px] text-[#737373] dark:text-[#A3A3A3] mt-0.5">Please check your registered email for exam roll number slip procedures.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
                className="p-1 rounded-lg text-[#A3A3A3] hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="bg-black/60 rounded-xl border border-[#262626] aspect-video flex flex-col items-center justify-center p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-[#F4C430] text-[#111111] font-black text-lg flex items-center justify-center mb-2">
                  {data.teacher.charAt(0)}
                </div>
                <div className="font-bold text-sm text-white">{data.teacher}</div>
                <div className="text-xs text-[#A3A3A3]">{data.topic}</div>
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
                  className="flex-1 py-2.5 px-4 bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Enter Classroom
                </button>
                <button
                  type="button"
                  onClick={() => setShowLiveModal(false)}
                  className="py-2.5 px-4 bg-[#262626] text-white font-bold text-xs rounded-xl cursor-pointer"
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
                <BookOpen size={16} className="text-[#D4A017]" />
                <span className="font-bold text-xs sm:text-sm">Note Vault Reader · {data.boardName}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowNoteModal(false)}
                className="p-1 rounded-lg text-[#737373] hover:text-[#111111] dark:hover:text-white cursor-pointer"
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
                  className="flex-1 py-2.5 px-4 bg-[#111111] dark:bg-white text-white dark:text-[#111111] font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download size={14} />
                  <span>Download Sample PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="py-2.5 px-4 bg-[#F5F5F5] dark:bg-[#262626] text-[#111111] dark:text-white font-bold text-xs rounded-xl cursor-pointer"
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
