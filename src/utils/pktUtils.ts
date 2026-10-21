/**
 * pktUtils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for Pakistan Standard Time (PKT, UTC+5) calculations,
 * date/time formatting, stale session evaluation, and academic data normalization.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const PKT_TIMEZONE = 'Asia/Karachi';

/**
 * Returns YYYY-MM-DD in Asia/Karachi (PKT)
 */
export function getPKTDateString(input?: Date | string | number | null): string {
  const d = input ? (input instanceof Date ? input : new Date(input)) : new Date();
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: PKT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Returns Yesterday's YYYY-MM-DD in PKT
 */
export function getYesterdayPKTDateString(): string {
  const now = new Date();
  // Subtract 24 hours from current timestamp and format in PKT
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return getPKTDateString(yesterday);
}

/**
 * Formats full human-readable date in PKT
 * e.g. "Wednesday, October 22, 2026" or "Oct 22, 2026"
 */
export function formatPKTDate(
  input?: Date | string | number | null,
  format: 'full' | 'medium' | 'short' = 'medium'
): string {
  if (!input) return '—';
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return String(input);

  if (format === 'full') {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: PKT_TIMEZONE,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  }

  if (format === 'short') {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: PKT_TIMEZONE,
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
    }).format(d);
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: PKT_TIMEZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

/**
 * Formats time in PKT with standard 12-hour AM/PM
 * e.g. "09:42 AM" or "09:42:15 AM"
 */
export function formatPKTTime(
  input?: Date | string | number | null,
  includeSeconds = false
): string {
  if (!input) return '—';
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('en-US', {
    timeZone: PKT_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true,
  }).format(d);
}

/**
 * Formats duration seconds into human-readable e.g. "2h 45m" or "15m"
 */
export function formatDurationHuman(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
}

/**
 * Formats duration seconds into timer format e.g. "02:45:12"
 */
export function formatDurationTimer(seconds: number): string {
  if (!seconds || seconds < 0) return '00:00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

/**
 * Stale session detection:
 * A session is stale if it has stayed open without a clock_out_at AND:
 * 1) Duration exceeds 12 hours (43,200 seconds), OR
 * 2) It was clocked in before today's calendar date in PKT (crossed midnight PKT).
 */
export interface StaleSessionCheck {
  isStale: boolean;
  reason: 'exceeded_12h' | 'across_midnight' | null;
  durationSeconds: number;
}

export function evaluateSessionStaleness(
  clockInAt: string,
  clockOutAt?: string | null,
  currentTimestamp: number = Date.now()
): StaleSessionCheck {
  const clockInTime = new Date(clockInAt).getTime();
  if (isNaN(clockInTime)) {
    return { isStale: false, reason: null, durationSeconds: 0 };
  }

  // If already clocked out, it's completed (not stale)
  if (clockOutAt) {
    const clockOutTime = new Date(clockOutAt).getTime();
    const duration = Math.max(0, Math.floor((clockOutTime - clockInTime) / 1000));
    return { isStale: false, reason: null, durationSeconds: duration };
  }

  // Open session
  const elapsedSeconds = Math.max(0, Math.floor((currentTimestamp - clockInTime) / 1000));
  const MAX_SESSION_SECONDS = 12 * 3600; // 12 hours

  if (elapsedSeconds > MAX_SESSION_SECONDS) {
    return {
      isStale: true,
      reason: 'exceeded_12h',
      durationSeconds: elapsedSeconds,
    };
  }

  // Check if clocked in on a previous PKT calendar date
  const clockInPKTDate = getPKTDateString(clockInTime);
  const currentPKTDate = getPKTDateString(currentTimestamp);

  if (clockInPKTDate && currentPKTDate && clockInPKTDate !== currentPKTDate) {
    return {
      isStale: true,
      reason: 'across_midnight',
      durationSeconds: elapsedSeconds,
    };
  }

  return {
    isStale: false,
    reason: null,
    durationSeconds: elapsedSeconds,
  };
}

// ─── Subject Normalization ────────────────────────────────────────────────────

/**
 * Subject normalization dictionary to unify duplicate spelling variants
 * (e.g. "Islamiat" and "Islamiyat" -> "Islamiat").
 */
export const SUBJECT_NORMALIZATION_MAP: Record<string, string> = {
  'islamiyat': 'Islamiat',
  'islamiat': 'Islamiat',
  'islamic studies': 'Islamiat',
  'math': 'Mathematics',
  'maths': 'Mathematics',
  'mathematics': 'Mathematics',
  'mathematics (syllabus d)': 'Mathematics',
  'general mathematics': 'General Mathematics',
  'pak studies': 'Pakistan Studies',
  'pakistan studies': 'Pakistan Studies',
  'english language': 'English',
  'english': 'English',
  'ielts': 'IELTS Preparation',
  'ielts preparation': 'IELTS Preparation',
  'computer science': 'Computer Science',
  'cs': 'Computer Science',
};

export function normalizeSubject(raw?: string | null): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  return SUBJECT_NORMALIZATION_MAP[lower] || trimmed;
}

// ─── Academic Board Order ─────────────────────────────────────────────────────

/**
 * Board canonical ordering:
 * FBISE, Punjab, Sindh, then others (e.g. KPK, O Levels, A Levels, IELTS)
 */
export const BOARD_PRIORITY: Record<string, number> = {
  'fbise': 1,
  'punjab': 2,
  'sindh': 3,
  'kpk': 4,
  'olevel': 5,
  'o levels': 5,
  'o level': 5,
  'alevel': 6,
  'a levels': 6,
  'a level': 6,
  'ielts': 7,
};

export function sortBoards(boards: string[]): string[] {
  return [...boards].sort((a, b) => {
    const pA = BOARD_PRIORITY[a.toLowerCase()] ?? 99;
    const pB = BOARD_PRIORITY[b.toLowerCase()] ?? 99;
    if (pA !== pB) return pA - pB;
    return a.localeCompare(b);
  });
}

// ─── Grade Sorting ────────────────────────────────────────────────────────────

export function sortGrades(grades: string[]): string[] {
  return [...grades].sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10);
    const numB = parseInt(b.replace(/\D/g, ''), 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    if (!isNaN(numA)) return -1;
    if (!isNaN(numB)) return 1;
    return a.localeCompare(b);
  });
}
