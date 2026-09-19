/**
 * Scholario Page-Aware Context Utilities
 * 
 * Captures route location and lightweight state metadata to provide Sage AI Assistant
 * with immediate situational awareness of what screen/task the user is currently looking at.
 */

export interface PageContextInfo {
  path: string;
  title: string;
  summary: string;
  activeEntity?: string;
  timestamp?: number;
}

const STORAGE_KEY = 'scholario_active_page_context';

/**
 * Maps application routes to lightweight, descriptive page context summaries
 */
export function resolvePageContext(pathname: string, _search = ''): PageContextInfo {
  const cleanPath = pathname.split('?')[0].toLowerCase();

  // Student portal routes
  if (cleanPath.startsWith('/student/schedule')) {
    return {
      path: cleanPath,
      title: 'Weekly Class Schedule & Live Lectures',
      summary: 'Viewing active weekly timetable for FBISE/Board subjects, assigned teachers, and live class links.',
    };
  }
  if (cleanPath.startsWith('/student/notes')) {
    return {
      path: cleanPath,
      title: 'Subject Note Vault',
      summary: 'Browsing subject lecture notes, chapter formula summaries, and PDF download materials.',
    };
  }
  if (cleanPath.startsWith('/student/self-test')) {
    return {
      path: cleanPath,
      title: 'AI Self-Testing Quiz Hub',
      summary: 'Practicing interactive MCQ quizzes and self-assessment test sessions.',
    };
  }
  if (cleanPath.startsWith('/student/tests')) {
    return {
      path: cleanPath,
      title: 'Assessments & Written Tests',
      summary: 'Viewing assigned periodic tests, submission deadlines, and graded paper scorecards.',
    };
  }
  if (cleanPath.startsWith('/student/attendance')) {
    return {
      path: cleanPath,
      title: 'Student Attendance Register',
      summary: 'Reviewing monthly attendance records, check-in history, and 75% examination eligibility percentage.',
    };
  }
  if (cleanPath.startsWith('/student/checkout')) {
    return {
      path: cleanPath,
      title: 'Tuition Billing & Checkout',
      summary: 'Viewing tuition fee assessment, installment breakdown, and payment verification status.',
    };
  }
  if (cleanPath.startsWith('/student/announcements')) {
    return {
      path: cleanPath,
      title: 'Official Announcements',
      summary: 'Reading circulars and official broadcast notifications from academy administration.',
    };
  }
  if (cleanPath.startsWith('/student/dashboard')) {
    return {
      path: cleanPath,
      title: 'Student Overview Dashboard',
      summary: 'Viewing academic progress metrics, upcoming classes, recent test results, and attendance score.',
    };
  }

  // Teacher portal routes
  if (cleanPath.startsWith('/teacher/tests')) {
    return {
      path: cleanPath,
      title: 'Assessment & Test Grading Center',
      summary: 'Grading written test submissions, entering marks, and publishing test papers for classes.',
    };
  }
  if (cleanPath.startsWith('/teacher/notes')) {
    return {
      path: cleanPath,
      title: 'Teacher Note Vault Manager',
      summary: 'Uploading, managing, and distributing subject lecture notes and chapter study sheets to classes.',
    };
  }
  if (cleanPath.startsWith('/teacher/attendance')) {
    return {
      path: cleanPath,
      title: 'Class Attendance Tracking',
      summary: 'Marking daily student attendance (Present, Absent, Late, Excused) for assigned class offerings.',
    };
  }
  if (cleanPath.startsWith('/teacher/schedule')) {
    return {
      path: cleanPath,
      title: 'Teacher Schedule & Timetable',
      summary: 'Reviewing weekly teaching hours, classroom slots, and assigned periods.',
    };
  }
  if (cleanPath.startsWith('/teacher/announcements')) {
    return {
      path: cleanPath,
      title: 'Faculty Announcements',
      summary: 'Viewing institutional notices and posting subject-specific announcements to students.',
    };
  }
  if (cleanPath.startsWith('/teacher/dashboard')) {
    return {
      path: cleanPath,
      title: 'Teacher Overview Dashboard',
      summary: 'Viewing assigned subjects, upcoming lecture periods, and pending student submissions awaiting grading.',
    };
  }

  // Admin portal routes
  if (cleanPath.startsWith('/admin/dashboard')) {
    return {
      path: cleanPath,
      title: 'Institutional Executive Dashboard',
      summary: 'Monitoring high-level academy KPIs: total enrolled students, faculty roster, class offerings, and operations.',
    };
  }
  if (cleanPath.startsWith('/admin/roster') || cleanPath.startsWith('/admin/students')) {
    return {
      path: cleanPath,
      title: 'Student Roster & Enrollment Management',
      summary: 'Managing registered student profiles, board/grade allocations, and enrollment onboarding.',
    };
  }
  if (cleanPath.startsWith('/admin/teachers')) {
    return {
      path: cleanPath,
      title: 'Faculty & Teacher Directory',
      summary: 'Managing instructor profiles, assigned subjects, and teaching workload assignments.',
    };
  }
  if (cleanPath.startsWith('/admin/schedule')) {
    return {
      path: cleanPath,
      title: 'Master Timetable & Schedule Manager',
      summary: 'Scheduling class periods, assigning timetable slots, and preventing classroom timetable conflicts.',
    };
  }
  if (cleanPath.startsWith('/admin/fees') || cleanPath.startsWith('/admin/prices')) {
    return {
      path: cleanPath,
      title: 'Tuition Fees & Pricing Configuration',
      summary: 'Configuring tuition tiers, payment plans, scholarships, and reviewing student payment transactions.',
    };
  }
  if (cleanPath.startsWith('/admin/notes')) {
    return {
      path: cleanPath,
      title: 'All Academy Notes Vault',
      summary: 'Auditing and organizing educational materials, syllabus notes, and lecture resources across all grades.',
    };
  }
  if (cleanPath.startsWith('/admin/tests')) {
    return {
      path: cleanPath,
      title: 'Academy Assessment Control',
      summary: 'Overseeing all published test papers, exam schedules, and grading progress across all classes.',
    };
  }
  if (cleanPath.startsWith('/admin/question-bank')) {
    return {
      path: cleanPath,
      title: 'Question Bank & Exam Generator',
      summary: 'Creating and curating multi-choice, short, and long questions categorized by subject, chapter, and difficulty.',
    };
  }
  if (cleanPath.startsWith('/admin/attendance')) {
    return {
      path: cleanPath,
      title: 'Institutional Attendance Analytics',
      summary: 'Reviewing school-wide attendance rates, employee logs, QR check-in activity, and broken shift support.',
    };
  }
  if (cleanPath.startsWith('/admin/announcements')) {
    return {
      path: cleanPath,
      title: 'Academy Broadcast Center',
      summary: 'Broadcasting critical school announcements and policy circulars to students, parents, and faculty.',
    };
  }

  // Generic fallback
  return {
    path: cleanPath,
    title: 'Scholario Portal',
    summary: `Active page: ${cleanPath}`,
  };
}

/**
 * Persists the current page context to sessionStorage for Sage to read
 */
export function recordPageContext(context: PageContextInfo): void {
  try {
    // Only record non-sage pages as previous context
    if (!context.path.includes('/sage')) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...context, timestamp: Date.now() }));
    }
  } catch (err) {
    console.warn('[PageContext] Failed to save page context:', err);
  }
}

/**
 * Retrieves the most recent page context
 */
export function getLastPageContext(): PageContextInfo | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed as PageContextInfo;
  } catch {
    return null;
  }
}
