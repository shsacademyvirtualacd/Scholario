import { supabase } from './supabase';

/**
 * Format a timestamp into an iOS-style "Last seen ..." human-readable string.
 * Examples:
 * - "Last seen just now" (< 1 min)
 * - "Last seen 5m ago" (< 60 min)
 * - "Last seen today at 3:40 PM"
 * - "Last seen yesterday at 3:40 PM"
 * - "Last seen Fri at 3:40 PM"
 * - "Last seen Aug 28 at 3:40 PM"
 */
export function formatLastSeen(lastSeen: string | Date | null | undefined): string {
  if (!lastSeen) return '';
  const date = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  // Less than 1 minute ago (or clock skew)
  if (diffSec < 60) {
    return 'Last seen just now';
  }

  // Under 60 minutes
  if (diffMin < 60) {
    return `Last seen ${diffMin}m ago`;
  }

  // Time format (e.g. "3:40 PM")
  const timeStr = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Today check (same calendar date)
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return `Last seen today at ${timeStr}`;
  }

  // Yesterday check
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return `Last seen yesterday at ${timeStr}`;
  }

  // Under 7 days: show weekday name
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays < 7) {
    const weekday = date.toLocaleDateString([], { weekday: 'short' });
    return `Last seen ${weekday} at ${timeStr}`;
  }

  // Same year: Month Day
  if (date.getFullYear() === now.getFullYear()) {
    const monthDay = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `Last seen ${monthDay} at ${timeStr}`;
  }

  // Different year
  const fullDate = date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `Last seen ${fullDate} at ${timeStr}`;
}

/**
 * Mutual privacy check (like WhatsApp):
 * If either user has disabled `show_online_status` (default true),
 * then neither can see the other's status.
 */
export function isPresenceSharingAllowed(
  currentUser?: { show_online_status?: boolean } | null,
  otherUser?: { show_online_status?: boolean } | null
): boolean {
  // Default is true if undefined or null
  const currentAllowed = currentUser?.show_online_status ?? true;
  const otherAllowed = otherUser?.show_online_status ?? true;
  return currentAllowed && otherAllowed;
}

/**
 * Determine if a user is online considering:
 * 1. Active Supabase Realtime Presence channel state (real-time in-memory presence)
 * 2. Database `is_online` flag + recent `last_seen` within 40 seconds (heartbeat threshold)
 */
export function computeIsUserOnline(
  userId: string,
  presenceUserIds: Set<string>,
  profile?: { is_online?: boolean; last_seen?: string | null } | null
): boolean {
  if (!userId) return false;

  // 1. Live presence channel
  if (presenceUserIds.has(userId)) {
    return true;
  }

  // 2. Database backup with 40s heartbeat timeout
  if (profile?.is_online && profile.last_seen) {
    const lastSeenTime = new Date(profile.last_seen).getTime();
    if (!isNaN(lastSeenTime)) {
      const diffMs = Date.now() - lastSeenTime;
      if (diffMs <= 40_000) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Direct Supabase database update for the current authenticated user's presence.
 */
export async function updateMyPresence(userId: string, isOnline: boolean): Promise<void> {
  if (!userId) return;
  try {
    await (supabase as any)
      .from('profiles')
      .update({
        is_online: isOnline,
        last_seen: new Date().toISOString(),
      })
      .eq('id', userId);
  } catch (err) {
    console.warn('[Presence] Failed to update presence in DB:', err);
  }
}

/**
 * Sends a guaranteed offline signal on browser close / page unload using sendBeacon & keepalive fetch.
 */
export function sendOfflineBeacon(userId: string): void {
  if (!userId) return;

  const payload = JSON.stringify({ userId });

  // 1. Try sendBeacon
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    try {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/chat/presence/offline', blob);
      return;
    } catch {}
  }

  // 2. Fallback to keepalive fetch
  if (typeof fetch !== 'undefined') {
    try {
      fetch('/api/chat/presence/offline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }
}
