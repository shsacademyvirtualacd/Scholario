/**
 * Schedule Card Theme & Contrast Tokens
 * ─────────────────────────────────────────────────────────────────────────────
 * Ensures WCAG AA compliance (contrast ratio ≥ 4.5:1) in both Light & Dark themes:
 * - Light theme: Authentic academic pastel surface with crisp dark labels.
 * - Dark theme: Dark tinted surface (12-18% subject color alpha over dark surface),
 *   slate-100 for titles, slate-300 for teacher names, and subject shade 300/400
 *   for left borders, accents, and badges.
 */

export interface SubjectThemeClasses {
  card: string;
  title: string;
  badge: string;
  teacher: string;
  leftBorderColor: string;
}

export function getSubjectCardClasses(subjectRaw?: string): SubjectThemeClasses {
  const sub = (subjectRaw || 'class').toLowerCase().trim();

  if (sub.includes('bio')) {
    return {
      card: 'bg-pink-50/90 dark:bg-pink-500/[0.15] border-pink-200/80 dark:border-pink-500/25 border-l-pink-600 dark:border-l-pink-400',
      title: 'text-pink-950 dark:text-pink-300',
      badge: 'bg-pink-100 text-pink-900 border-pink-200 dark:bg-pink-950/70 dark:text-pink-300 dark:border-pink-500/40',
      teacher: 'text-slate-700 dark:text-slate-300',
      leftBorderColor: '#db2777',
    };
  }

  if (sub.includes('physic')) {
    return {
      card: 'bg-blue-50/90 dark:bg-blue-500/[0.15] border-blue-200/80 dark:border-blue-500/25 border-l-blue-600 dark:border-l-blue-400',
      title: 'text-blue-950 dark:text-blue-300',
      badge: 'bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-500/40',
      teacher: 'text-slate-700 dark:text-slate-300',
      leftBorderColor: '#2563eb',
    };
  }

  if (sub.includes('chem')) {
    return {
      card: 'bg-emerald-50/90 dark:bg-emerald-500/[0.15] border-emerald-200/80 dark:border-emerald-500/25 border-l-emerald-600 dark:border-l-emerald-400',
      title: 'text-emerald-950 dark:text-emerald-300',
      badge: 'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-500/40',
      teacher: 'text-slate-700 dark:text-slate-300',
      leftBorderColor: '#059669',
    };
  }

  if (sub.includes('math')) {
    return {
      card: 'bg-amber-50/90 dark:bg-amber-500/[0.15] border-amber-200/80 dark:border-amber-500/25 border-l-amber-500 dark:border-l-amber-400',
      title: 'text-amber-950 dark:text-amber-300',
      badge: 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-500/40',
      teacher: 'text-slate-700 dark:text-slate-300',
      leftBorderColor: '#d97706',
    };
  }

  if (sub.includes('eng')) {
    return {
      card: 'bg-cyan-50/90 dark:bg-cyan-500/[0.15] border-cyan-200/80 dark:border-cyan-500/25 border-l-cyan-600 dark:border-l-cyan-400',
      title: 'text-cyan-950 dark:text-cyan-300',
      badge: 'bg-cyan-100 text-cyan-900 border-cyan-200 dark:bg-cyan-950/70 dark:text-cyan-300 dark:border-cyan-500/40',
      teacher: 'text-slate-700 dark:text-slate-300',
      leftBorderColor: '#0891b2',
    };
  }

  if (sub.includes('islam')) {
    return {
      card: 'bg-indigo-50/90 dark:bg-indigo-500/[0.15] border-indigo-200/80 dark:border-indigo-500/25 border-l-indigo-600 dark:border-l-indigo-400',
      title: 'text-indigo-950 dark:text-indigo-300',
      badge: 'bg-indigo-100 text-indigo-900 border-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-500/40',
      teacher: 'text-slate-700 dark:text-slate-300',
      leftBorderColor: '#4f46e5',
    };
  }

  if (sub.includes('comp') || sub.includes('cs')) {
    return {
      card: 'bg-purple-50/90 dark:bg-purple-500/[0.15] border-purple-200/80 dark:border-purple-500/25 border-l-purple-600 dark:border-l-purple-400',
      title: 'text-purple-950 dark:text-purple-300',
      badge: 'bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-500/40',
      teacher: 'text-slate-700 dark:text-slate-300',
      leftBorderColor: '#7c3aed',
    };
  }

  if (sub.includes('urdu')) {
    return {
      card: 'bg-orange-50/90 dark:bg-orange-500/[0.15] border-orange-200/80 dark:border-orange-500/25 border-l-orange-600 dark:border-l-orange-400',
      title: 'text-orange-950 dark:text-orange-300',
      badge: 'bg-orange-100 text-orange-900 border-orange-200 dark:bg-orange-950/70 dark:text-orange-300 dark:border-orange-500/40',
      teacher: 'text-slate-700 dark:text-slate-300',
      leftBorderColor: '#ea580c',
    };
  }

  // Default / General Academic
  return {
    card: 'bg-slate-50/90 dark:bg-slate-500/[0.15] border-slate-200/80 dark:border-slate-500/25 border-l-slate-500 dark:border-l-slate-400',
    title: 'text-slate-900 dark:text-slate-100',
    badge: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
    teacher: 'text-slate-700 dark:text-slate-300',
    leftBorderColor: '#64748b',
  };
}

/**
 * Standardized Accessible Classes for Schedule Card UI Elements
 */
export const SCHEDULE_CARD_CLASSES = {
  // CORE badge: meets ≥ 7:1 contrast in both themes
  coreBadge:
    'bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 font-bold',
  electiveBadge:
    'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-700 font-bold',
  // Link Ready pill: green text on green tint with ≥ 4.5:1 contrast
  linkReadyPill:
    'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700 dark:hover:bg-emerald-900/80 font-bold',
  adminLinkPill:
    'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-900/80 font-bold',
  // + Add Link button
  addLinkButton:
    'bg-white text-slate-700 hover:text-amber-800 hover:bg-amber-50 border border-dashed border-slate-300 hover:border-amber-400 dark:bg-neutral-800 dark:text-slate-200 dark:hover:text-amber-300 dark:hover:bg-amber-950/40 dark:border-neutral-600 dark:hover:border-amber-500 font-bold',
  // Period time labels
  periodLabel:
    'bg-slate-100 text-slate-800 dark:bg-neutral-800 dark:text-slate-200 border border-slate-200 dark:border-neutral-700 font-bold',
  // Teacher name
  teacherName:
    'text-slate-700 dark:text-slate-300 font-semibold',
  // Action buttons bar (video, edit, delete, close)
  actionControls:
    'bg-white/95 text-slate-700 border border-slate-200 dark:bg-neutral-900/95 dark:text-slate-200 dark:border-neutral-700',
  // Action icons specific colors
  actionVideo:
    'text-amber-800 hover:text-amber-950 hover:bg-amber-100 dark:text-amber-300 dark:hover:text-amber-100 dark:hover:bg-amber-950/60',
  actionEdit:
    'text-blue-700 hover:text-blue-900 hover:bg-blue-100 dark:text-blue-300 dark:hover:text-blue-100 dark:hover:bg-blue-950/60',
  actionDelete:
    'text-red-700 hover:text-red-900 hover:bg-red-100 dark:text-red-300 dark:hover:text-red-100 dark:hover:bg-red-950/60',
  actionClose:
    'text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-neutral-700',
};
