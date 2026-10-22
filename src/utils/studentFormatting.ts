/**
 * Student formatting utilities for consistent dates, times, names and taxonomies.
 * Display-only: never modifies stored database records.
 */

/**
 * Format string to proper title/name capitalization
 * e.g., "ahmed ali khan" -> "Ahmed Ali Khan"
 */
export function formatProperName(name?: string | null): string {
  if (!name || !name.trim()) return 'Student';
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format title case for titles/headings (prevents all-caps)
 */
export function formatTitleCase(title?: string | null): string {
  if (!title || !title.trim()) return '';
  const str = title.trim();
  // If already mixed case, keep it, otherwise capitalize words
  if (str !== str.toUpperCase() && str !== str.toLowerCase()) {
    return str;
  }
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => {
      const lower = word.toLowerCase();
      if (['and', 'or', 'in', 'of', 'for', 'the', 'a', 'an', 'to', 'on', 'at'].includes(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .replace(/^[a-z]/, (c) => c.toUpperCase());
}

/**
 * Format date to standard Scholario UI format: "Oct 14, 2026"
 */
export function formatStandardDate(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      timeZone: 'Asia/Karachi',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Format date with time: "Oct 14, 2026, 6:02 PM"
 */
export function formatStandardDateTime(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      timeZone: 'Asia/Karachi',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
}

export const formatPKTDateTime = formatStandardDateTime;

/**
 * Format standard PKT 12-hour time: "6:00 PM"
 */
export function formatPKTTime(timeStr?: string | null): string {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  if (!trimmed) return '';
  
  // If already formatted like "6:00 PM", normalize spacing
  if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(trimmed)) {
    const [t, mer] = trimmed.split(/\s+/);
    return `${t} ${mer.toUpperCase()}`;
  }

  // Handle "HH:MM:SS" or "HH:MM"
  const parts = trimmed.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const mins = parts[1].padStart(2, '0');
    if (isNaN(hours)) return trimmed;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${mins} ${ampm}`;
  }
  return trimmed;
}

/**
 * Format board label compactly (never clipped):
 * e.g., "fbise" -> "FBISE", "punjab" -> "Punjab", "sindh" -> "Sindh"
 */
export function formatBoardLabel(board?: string | null): string {
  if (!board) return 'FBISE';
  const b = board.toLowerCase().trim();
  if (b.includes('fbise') || b.includes('federal')) return 'FBISE';
  if (b.includes('punjab') || b.includes('lahore')) return 'Punjab';
  if (b.includes('sindh') || b.includes('karachi')) return 'Sindh';
  if (b.includes('kpk') || b.includes('peshawar')) return 'KPK';
  if (b.includes('o level') || b.includes('cambridge_o')) return 'O Levels';
  if (b.includes('a level') || b.includes('cambridge_a')) return 'A Levels';
  if (b.includes('ielts')) return 'IELTS';
  return board.toUpperCase();
}

/**
 * Format student academic package cleanly:
 * Fixes duplicate words like "Grade Grade 10" -> "Grade 10"
 * Returns e.g. "Sindh Board · Grade 10 · All subjects" or "Sindh Board · Grade 10 (Matric) · Biology"
 */
export function formatAcademicTagline(profile?: {
  grade?: string | null;
  class?: { grade?: string | null; board_id?: string | null; stream?: string | null } | null;
  board_id?: string | null;
  board?: any;
  stream?: string | null;
  package_type?: string | null;
} | null): string {
  if (!profile) return 'Student Portal';
  const rawGrade = profile?.class?.grade || profile?.grade || '';
  const cleanGrade = rawGrade.replace(/^grade\s+/i, '').trim() || '10';
  const rawBoard = profile?.board_id || (typeof profile?.board === 'string' ? profile.board : profile?.board?.id) || profile?.class?.board_id || 'Sindh';
  const boardLabel = formatBoardLabel(rawBoard);
  const stream = profile?.class?.stream || profile?.stream || '';
  
  const parts = [`${boardLabel} Board`, `Grade ${cleanGrade}`];
  if (stream && stream.toLowerCase() !== 'all') {
    parts.push(stream.charAt(0).toUpperCase() + stream.slice(1));
  } else {
    parts.push('All subjects');
  }
  return parts.join(' · ');
}

/**
 * Consistent phone number formatter for display (+92 344 1087891)
 */
export function formatPhoneNumberDisplay(phone?: string | null): string {
  if (!phone) return '—';
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+92') && cleaned.length >= 13) {
    return `+92 ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  if (cleaned.startsWith('03') && cleaned.length === 11) {
    return `+92 ${cleaned.slice(1, 4)} ${cleaned.slice(4)}`;
  }
  return phone;
}
