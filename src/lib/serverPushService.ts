import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface PushSubscriptionRecord {
  id?: string;
  user_id: string;
  role: 'student' | 'teacher' | 'admin' | string;
  endpoint: string;
  p256dh: string;
  auth: string;
  subscription_json: any;
  grade?: string | null;
  board?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag: string;
  data?: Record<string, any>;
}

// ── VAPID Configuration ──────────────────────────────────────────────────────
const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  process.env.VITE_VAPID_PUBLIC_KEY ||
  'BAt10hJjc1FsLa_xXoJNWEYKvR1LALcHu2JLJWPbrOksAQ4rw0M-78JS5xNvr6wkDajphLwdbs-yMBvyrHCE484';

const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  'd6kTEcasUpoTVpYCOMTvrCsV-Dwdk_wnX6O_1aFwcf4';

const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT ||
  'mailto:admin@scholario.app';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('[ServerPush] WebPush VAPID configured successfully');
} catch (err) {
  console.warn('[ServerPush] Warning configuring VAPID details:', err);
}

// ── Persistent Subscription Store (File + Memory Fallback) ───────────────────
const SUBSCRIPTIONS_FILE = path.resolve('src/data/pushSubscriptions.json');
let subscriptionsMemory: Map<string, PushSubscriptionRecord> = new Map();

function loadSubscriptionsFromDisk(): void {
  try {
    if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
      const raw = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8');
      const list: PushSubscriptionRecord[] = JSON.parse(raw);
      if (Array.isArray(list)) {
        subscriptionsMemory.clear();
        for (const item of list) {
          if (item.endpoint) {
            subscriptionsMemory.set(item.endpoint, item);
          }
        }
        console.log(`[ServerPush] Loaded ${subscriptionsMemory.size} push subscriptions from disk`);
      }
    }
  } catch (err) {
    console.warn('[ServerPush] Error loading subscriptions file:', err);
  }
}

function saveSubscriptionsToDisk(): void {
  try {
    const dir = path.dirname(SUBSCRIPTIONS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const list = Array.from(subscriptionsMemory.values());
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[ServerPush] Error saving subscriptions to disk:', err);
  }
}

// Load on initialization
loadSubscriptionsFromDisk();

// ── Subscription Management Methods ──────────────────────────────────────────

export async function savePushSubscription(
  record: PushSubscriptionRecord,
  supabase?: SupabaseClient
): Promise<void> {
  if (!record.endpoint || !record.user_id) return;

  const now = new Date().toISOString();
  const existing = subscriptionsMemory.get(record.endpoint);

  const fullRecord: PushSubscriptionRecord = {
    ...record,
    id: existing?.id || record.id || `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    created_at: existing?.created_at || now,
    updated_at: now,
  };

  subscriptionsMemory.set(record.endpoint, fullRecord);
  saveSubscriptionsToDisk();

  if (supabase) {
    try {
      await (supabase as any)
        .from('push_subscriptions')
        .upsert(
          {
            user_id: fullRecord.user_id,
            role: fullRecord.role,
            endpoint: fullRecord.endpoint,
            p256dh: fullRecord.p256dh,
            auth: fullRecord.auth,
            subscription_json: fullRecord.subscription_json,
            updated_at: now,
          },
          { onConflict: 'endpoint' }
        );
    } catch (err) {
      console.warn('[ServerPush] DB upsert warning:', err);
    }
  }
}

export async function removePushSubscription(
  endpoint: string,
  supabase?: SupabaseClient
): Promise<void> {
  if (!endpoint) return;

  if (subscriptionsMemory.has(endpoint)) {
    subscriptionsMemory.delete(endpoint);
    saveSubscriptionsToDisk();
  }

  if (supabase) {
    try {
      await (supabase as any)
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint);
    } catch (err) {
      console.warn('[ServerPush] DB delete warning:', err);
    }
  }
}

export function getAllPushSubscriptions(): PushSubscriptionRecord[] {
  return Array.from(subscriptionsMemory.values());
}

export function getSubscriptionsForRole(role: string): PushSubscriptionRecord[] {
  return Array.from(subscriptionsMemory.values()).filter((s) => s.role === role);
}

export function getSubscriptionsForUsers(userIds: string[]): PushSubscriptionRecord[] {
  const set = new Set(userIds);
  return Array.from(subscriptionsMemory.values()).filter((s) => set.has(s.user_id));
}

// ── Web Push Dispatcher ──────────────────────────────────────────────────────

export async function sendWebPush(
  subscription: PushSubscriptionRecord,
  payload: PushPayload,
  supabase?: SupabaseClient
): Promise<boolean> {
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh || subscription.subscription_json?.keys?.p256dh,
      auth: subscription.auth || subscription.subscription_json?.keys?.auth,
    },
  };

  const payloadString = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/logo.png',
    badge: payload.badge || '/logo.png',
    tag: payload.tag,
    data: payload.data || {},
  });

  try {
    await webpush.sendNotification(pushSubscription, payloadString, {
      TTL: 60 * 60 * 4, // 4 hours TTL
      urgency: 'high',
    });
    return true;
  } catch (err: any) {
    const statusCode = err?.statusCode || err?.status;
    console.warn(`[ServerPush] Push delivery failed for ${subscription.endpoint.slice(0, 35)}... status=${statusCode}`);

    // If subscription is expired, unregistered, or invalid (404 / 410), delete it
    if (statusCode === 404 || statusCode === 410 || statusCode === 400) {
      console.log(`[ServerPush] Removing stale/invalid subscription (${statusCode}): ${subscription.endpoint.slice(0, 35)}...`);
      await removePushSubscription(subscription.endpoint, supabase);
    }
    return false;
  }
}

// ── Event-Based Push Triggers ────────────────────────────────────────────────

/**
 * Sends real Web Push notifications when a live class session starts/transitions to 'live':
 * 1. To enrolled students in that subject/grade
 * 2. To all administrators across the institution
 */
export async function sendLiveSessionPushAlerts(
  session: {
    id: string;
    subject_id?: string;
    grade_id?: string;
    offering_id?: string;
    teacher_id?: string;
    teacher_name?: string;
    subject_name?: string;
    class_link?: string;
  },
  supabase: SupabaseClient
): Promise<{ studentsSent: number; adminsSent: number }> {
  if (!session?.id || !session.class_link) {
    return { studentsSent: 0, adminsSent: 0 };
  }

  const rawSubject = (session.subject_name || 'Class').trim();
  const subjectName = rawSubject.charAt(0).toUpperCase() + rawSubject.slice(1);
  const teacherName = (session.teacher_name || 'Your teacher').trim();

  const formatGrade = (raw?: string | null) => {
    if (!raw) return 'All Grades';
    const trimmed = raw.trim();
    if (/^\d+$/.test(trimmed)) return `Grade ${trimmed}`;
    return trimmed;
  };
  const gradeName = formatGrade(session.grade_id);

  // ── 1. Students Payload & Scoping ────────────────────────
  // Title: "{Subject} class is live"
  // Body: "{Teacher name} started the class — tap to join"
  // Tag: "live-session-{sessionId}"
  const studentPayload: PushPayload = {
    title: `${subjectName} class is live`,
    body: `${teacherName} started the class — tap to join`,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: `live-session-${session.id}`,
    data: {
      url: session.class_link.trim(),
      class_link: session.class_link.trim(),
      sessionId: session.id,
      role: 'student',
    },
  };

  // Find enrolled students for this offering / grade / subject
  let studentUserIds: string[] = [];
  try {
    if (session.offering_id) {
      const { data: enrollments } = await (supabase as any)
        .from('enrollments')
        .select('student_id')
        .eq('offering_id', session.offering_id);

      if (enrollments && enrollments.length > 0) {
        studentUserIds = enrollments.map((e: any) => e.student_id);
      }
    }

    if (studentUserIds.length === 0 && session.grade_id) {
      // Fallback: match by grade
      const normGrade = session.grade_id.replace(/^grade\s*/i, '').trim();
      const { data: profiles } = await (supabase as any)
        .from('profiles')
        .select('id, grade, class_id')
        .eq('role', 'student');

      if (profiles && profiles.length > 0) {
        studentUserIds = profiles
          .filter((p: any) => {
            const pGrade = String(p.grade || p.class_id || '').replace(/^grade\s*/i, '').trim();
            return !normGrade || pGrade === normGrade || pGrade.includes(normGrade);
          })
          .map((p: any) => p.id);
      }
    }
  } catch (err) {
    console.warn('[ServerPush] Error querying enrolled students:', err);
  }

  // Get matching student subscriptions
  const studentSubs = studentUserIds.length > 0
    ? getSubscriptionsForUsers(studentUserIds).filter((s) => s.role === 'student')
    : getSubscriptionsForRole('student');

  let studentsSent = 0;
  for (const sub of studentSubs) {
    const success = await sendWebPush(sub, studentPayload, supabase);
    if (success) studentsSent++;
  }

  // ── 2. Admin Payload & Scoping ───────────────────────────
  // Title: "{Teacher name} posted a class link"
  // Body: "{Subject} — {Grade} is now live"
  // Tag: "admin-link-posted-{sessionId}"
  const adminPayload: PushPayload = {
    title: `${teacherName} posted a class link`,
    body: `${subjectName} — ${gradeName} is now live`,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: `admin-link-posted-${session.id}`,
    data: {
      url: '/admin/schedule',
      sessionId: session.id,
      role: 'admin',
    },
  };

  const adminSubs = getSubscriptionsForRole('admin');
  let adminsSent = 0;
  for (const sub of adminSubs) {
    const success = await sendWebPush(sub, adminPayload, supabase);
    if (success) adminsSent++;
  }

  console.log(`[ServerPush] Live session push alert sent: ${studentsSent} students, ${adminsSent} admins`);
  return { studentsSent, adminsSent };
}

// ── Teacher Scheduled Reminders Background Task ──────────────────────────────
// In-memory record of when the last push notification was sent for each scheduleId
const lastTeacherPushSentAt = new Map<string, number>();

/**
 * Calculates current Pakistan Standard Time (PKT, UTC+5)
 */
function getPKTDateTime(): { dateString: string; dayIndex: number; totalMins: number } {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const pktDate = new Date(utc + 5 * 3600000);

  const year = pktDate.getFullYear();
  const month = String(pktDate.getMonth() + 1).padStart(2, '0');
  const day = String(pktDate.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;

  const dayIndex = pktDate.getDay(); // 0 = Sunday, 1 = Monday, ...
  const totalMins = pktDate.getHours() * 60 + pktDate.getMinutes();

  return { dateString, dayIndex, totalMins };
}

function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/**
 * Runs a background scheduled check (called every ~1-2 minutes)
 * to verify which teacher classes are within the 30m reminder window and still unposted.
 * Sends Web Push reminders directly to teachers whose tabs are closed.
 */
export async function checkAndSendTeacherPushReminders(
  supabase: SupabaseClient
): Promise<number> {
  const { dateString, dayIndex, totalMins } = getPKTDateTime();

  try {
    // 1. Query today's class slots
    const { data: slots, error: slotsErr } = await (supabase as any)
      .from('class_slots')
      .select('id, day_of_week, start_time, end_time, custom_title, offering_id, is_cancelled, class_id, offering:class_offerings(*, teacher:teachers(*))')
      .eq('day_of_week', dayIndex)
      .eq('is_cancelled', false);

    if (slotsErr || !slots || slots.length === 0) {
      return 0;
    }

    const slotIds = slots.map((s: any) => s.id);
    const sessionIds = slots.map((s: any) => `${s.id}_${dateString}`);

    // 2. Fetch existing session links for today
    const { data: sessionLinks } = await (supabase as any)
      .from('class_session_links')
      .select('slot_id, link_url')
      .in('slot_id', slotIds)
      .eq('session_date', dateString);

    const postedSlotSet = new Set<string>();
    (sessionLinks || []).forEach((sl: any) => {
      if (sl.link_url && sl.link_url.trim().length > 0) {
        postedSlotSet.add(sl.slot_id);
      }
    });

    // 3. Fetch live_sessions for today
    const { data: liveSessions } = await (supabase as any)
      .from('live_sessions')
      .select('id, slot_id, status, class_link')
      .in('id', sessionIds);

    (liveSessions || []).forEach((ls: any) => {
      if (ls.status === 'live' || (ls.class_link && ls.class_link.trim().length > 0)) {
        if (ls.slot_id) postedSlotSet.add(ls.slot_id);
      }
    });

    let remindersSent = 0;
    const now = Date.now();

    for (const slot of slots) {
      const scheduleId = `${slot.id}_${dateString}`;

      // Skip if link is already posted or session is live
      if (postedSlotSet.has(slot.id)) {
        continue;
      }

      const startMins = timeStringToMinutes(slot.start_time || '09:00:00');
      const endMins = timeStringToMinutes(slot.end_time || '10:00:00');
      const minsUntilStart = startMins - totalMins;
      const minsPastEnd = totalMins - endMins;

      // Only remind if class ended less than 60 mins ago
      if (minsPastEnd > 60) {
        continue;
      }

      // Check if slot is within the 30-minute reminder window
      // (from 30 mins before start until class end)
      if (minsUntilStart <= 30) {
        // Enforce 2-minute (110 seconds) throttle between pushes for the same scheduleId
        const lastSent = lastTeacherPushSentAt.get(scheduleId) || 0;
        if (now - lastSent < 110 * 1000) {
          continue;
        }

        const teacherId =
          slot.offering?.teacher_id ||
          slot.offering?.teacher?.id ||
          (slot as any).teacher_id;

        if (!teacherId) {
          continue;
        }

        const teacherSubs = getSubscriptionsForUsers([teacherId]).filter(
          (s) => s.role === 'teacher'
        );

        if (teacherSubs.length === 0) {
          continue;
        }

        const rawSubj =
          slot.custom_title ||
          slot.offering?.subject_name ||
          (slot.offering?.subject as any)?.name ||
          'Class';
        const subject = typeof rawSubj === 'string' ? rawSubj : 'Class';

        const isFirstReminder = minsUntilStart >= 28 && minsUntilStart <= 32;

        const title = isFirstReminder
          ? `${subject} starts in 30 minutes`
          : `${subject} class link not posted yet`;

        const body = isFirstReminder
          ? "Post your class link when you're ready."
          : "Tap to post your class link now.";

        const payload: PushPayload = {
          title,
          body,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: `teacher-reminder-${scheduleId}`, // Matches tab-open tag for deduplication
          data: {
            url: `/teacher#live-link-editor-${slot.id}`,
            scheduleId,
            slotId: slot.id,
            role: 'teacher',
          },
        };

        let slotSentCount = 0;
        for (const sub of teacherSubs) {
          const success = await sendWebPush(sub, payload, supabase);
          if (success) slotSentCount++;
        }

        if (slotSentCount > 0) {
          lastTeacherPushSentAt.set(scheduleId, now);
          remindersSent += slotSentCount;
          console.log(`[ServerPush] Sent teacher reminder push for ${scheduleId} (${title})`);
        }
      }
    }

    return remindersSent;
  } catch (err) {
    console.warn('[ServerPush] Error during teacher push reminder check:', err);
    return 0;
  }
}
