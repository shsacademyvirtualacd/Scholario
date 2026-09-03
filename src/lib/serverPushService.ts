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

export async function getUserSubscriptions(
  userIds: string[],
  supabase?: SupabaseClient
): Promise<PushSubscriptionRecord[]> {
  if (!userIds || userIds.length === 0) return [];
  const set = new Set(userIds);

  // 1. Fetch from Supabase DB push_subscriptions table
  if (supabase) {
    try {
      const { data: dbSubs, error } = await (supabase as any)
        .from('push_subscriptions')
        .select('*')
        .in('user_id', userIds);

      if (!error && dbSubs && dbSubs.length > 0) {
        for (const sub of dbSubs) {
          if (sub.endpoint) {
            subscriptionsMemory.set(sub.endpoint, sub);
          }
        }
      }
    } catch (err) {
      console.warn('[ServerPush] Error querying DB push_subscriptions:', err);
    }
  }

  // 2. Return all matching from unified in-memory + DB map
  return Array.from(subscriptionsMemory.values()).filter((s) => set.has(s.user_id));
}

export async function getSubscriptionsForRole(
  role: string,
  supabase?: SupabaseClient
): Promise<PushSubscriptionRecord[]> {
  if (supabase) {
    try {
      const { data: dbSubs, error } = await (supabase as any)
        .from('push_subscriptions')
        .select('*')
        .eq('role', role);

      if (!error && dbSubs && dbSubs.length > 0) {
        for (const sub of dbSubs) {
          if (sub.endpoint) {
            subscriptionsMemory.set(sub.endpoint, sub);
          }
        }
      }
    } catch (err) {
      console.warn('[ServerPush] Error querying DB push_subscriptions by role:', err);
    }
  }
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

    // If subscription is expired, unregistered, or invalid (404 / 410 / 400), delete it
    if (statusCode === 404 || statusCode === 410 || statusCode === 400) {
      console.log(`[ServerPush] Removing stale/invalid subscription (${statusCode}): ${subscription.endpoint.slice(0, 35)}...`);
      await removePushSubscription(subscription.endpoint, supabase);
    }
    return false;
  }
}

/**
 * Sends a notification payload to one or more user IDs via Web Push.
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload,
  supabase?: SupabaseClient
): Promise<{ attemptedCount: number; deliveredCount: number; failedCount: number }> {
  if (!userIds || userIds.length === 0) {
    return { attemptedCount: 0, deliveredCount: 0, failedCount: 0 };
  }

  const subs = await getUserSubscriptions(userIds, supabase);
  let attemptedCount = 0;
  let deliveredCount = 0;
  let failedCount = 0;

  for (const sub of subs) {
    attemptedCount++;
    const success = await sendWebPush(sub, payload, supabase);
    if (success) {
      deliveredCount++;
    } else {
      failedCount++;
    }
  }

  return { attemptedCount, deliveredCount, failedCount };
}

// ── Event-Based Push Triggers ────────────────────────────────────────────────

/**
 * Triggered when a teacher posts/shares a class link (e.g. Zoom / Meet / Teams).
 * 1. Notifies all Admins: title "New class link posted", body "{Teacher name} posted a link for {Class/Subject}"
 * 2. Notifies Enrolled Students: title "{Subject} class link posted", body "{Teacher name} just shared the link for {Subject} — tap to join."
 */
export async function sendClassLinkPostedPush(
  params: {
    slotId?: string;
    sessionDate?: string;
    linkUrl: string;
    offeringId?: string | null;
    teacherId?: string | null;
    teacherName?: string | null;
    subjectName?: string | null;
    className?: string | null;
    gradeId?: string | null;
  },
  supabase: SupabaseClient
): Promise<{ adminsSent: number; studentsSent: number }> {
  const { slotId, sessionDate, linkUrl } = params;
  if (!linkUrl) return { adminsSent: 0, studentsSent: 0 };

  let teacherName = params.teacherName || 'Teacher';
  let subjectName = params.subjectName || 'Class';
  let className = params.className || '';
  let offeringId = params.offeringId;

  // Enrich with slot details if slotId is provided
  if (slotId) {
    try {
      const { data: slot } = await (supabase as any)
        .from('class_slots')
        .select('*, offering:class_offerings(*, teacher:teachers(*), class:classes(*), subject:subjects(*))')
        .eq('id', slotId)
        .maybeSingle();

      if (slot) {
        offeringId = offeringId || slot.offering_id || slot.offering?.id;
        const teacherObj = slot.offering?.teacher;
        if (teacherObj?.full_name) {
          teacherName = teacherObj.full_name;
        }
        const subjObj = slot.offering?.subject;
        if (subjObj?.name) {
          subjectName = subjObj.name;
        } else if (slot.custom_title) {
          subjectName = slot.custom_title;
        }
        const classObj = slot.offering?.class;
        if (classObj?.display_name) {
          className = classObj.display_name;
        } else if (classObj?.grade) {
          className = `Grade ${classObj.grade}`;
        }
      }
    } catch (e) {
      console.warn('[ServerPush] Error enriching class link slot details:', e);
    }
  }

  const displayTarget = className ? `${teacherName} posted a link for ${className} ${subjectName}` : `${teacherName} posted a link for ${subjectName}`;

  // 1. Notify All Admins
  const adminPayload: PushPayload = {
    title: 'New class link posted',
    body: displayTarget,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: `admin-class-link-${slotId || 'general'}-${sessionDate || 'today'}`,
    data: {
      url: '/admin/schedule',
      class_link: linkUrl,
      slot_id: slotId,
      role: 'admin',
      type: 'class_link',
    },
  };

  let adminUserIds: string[] = [];
  try {
    const { data: adminProfiles } = await (supabase as any)
      .from('profiles')
      .select('id')
      .eq('role', 'admin');
    if (adminProfiles && adminProfiles.length > 0) {
      adminUserIds = adminProfiles.map((p: any) => p.id);
    }
  } catch (err) {
    console.warn('[ServerPush] Error fetching admin profiles for class link push:', err);
  }

  const adminResult = await sendPushToUsers(adminUserIds, adminPayload, supabase);

  // 2. Notify Enrolled Students (Personalized)
  const studentPayload: PushPayload = {
    title: `${subjectName} class link posted`,
    body: `${teacherName} just shared the link for ${subjectName} — tap to join.`,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: `student-class-link-${slotId || 'general'}-${sessionDate || 'today'}`,
    data: {
      url: linkUrl,
      class_link: linkUrl,
      slot_id: slotId,
      role: 'student',
      type: 'class_link',
    },
  };

  let studentUserIds: string[] = [];
  try {
    if (offeringId) {
      const { data: enrollments } = await (supabase as any)
        .from('enrollments')
        .select('student_id')
        .eq('offering_id', offeringId);
      if (enrollments && enrollments.length > 0) {
        studentUserIds = enrollments.map((e: any) => e.student_id);
      }
    }

    if (studentUserIds.length === 0 && (params.gradeId || className)) {
      const g = (params.gradeId || className).replace(/^grade\s*/i, '').trim();
      const { data: gradeProfiles } = await (supabase as any)
        .from('profiles')
        .select('id, grade, class_id')
        .eq('role', 'student');
      if (gradeProfiles) {
        studentUserIds = gradeProfiles
          .filter((p: any) => {
            const pGrade = String(p.grade || p.class_id || '').replace(/^grade\s*/i, '').trim();
            return !g || pGrade === g || pGrade.includes(g);
          })
          .map((p: any) => p.id);
      }
    }
  } catch (err) {
    console.warn('[ServerPush] Error fetching enrolled students for class link push:', err);
  }

  const studentResult = await sendPushToUsers(studentUserIds, studentPayload, supabase);

  console.log(`[ServerPush] Class link push dispatched: ${adminResult.deliveredCount} admins, ${studentResult.deliveredCount} students`);
  return { adminsSent: adminResult.deliveredCount, studentsSent: studentResult.deliveredCount };
}

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
    slot_id?: string;
    teacher_id?: string;
    teacher_name?: string;
    subject_name?: string;
    class_link?: string;
  },
  supabase: SupabaseClient
): Promise<{ studentsSent: number; adminsSent: number }> {
  return sendClassLinkPostedPush(
    {
      slotId: session.slot_id,
      sessionDate: session.id ? session.id.split('_')[1] : undefined,
      linkUrl: session.class_link || '',
      offeringId: session.offering_id,
      teacherId: session.teacher_id,
      teacherName: session.teacher_name,
      subjectName: session.subject_name,
      gradeId: session.grade_id,
    },
    supabase
  );
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
 * Runs a background scheduled check (called every 1-2 minutes).
 * For each upcoming class starting within the next 10 minutes, sends a reminder push
 * to that teacher recurring every 2 minutes until the class start time, then stops.
 * Also stops if the teacher has already posted their link.
 * Tracks last_reminder_sent_at per class/slot in Supabase class_slots and in-memory.
 */
export async function checkAndSendTeacherPushReminders(
  supabase: SupabaseClient
): Promise<number> {
  const { dateString, dayIndex, totalMins } = getPKTDateTime();

  try {
    // 1. Query today's class slots
    const { data: slots, error: slotsErr } = await (supabase as any)
      .from('class_slots')
      .select('id, day_of_week, start_time, end_time, custom_title, offering_id, is_cancelled, class_id, last_reminder_sent_at, offering:class_offerings(*, teacher:teachers(*), subject:subjects(*))')
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
      const minsUntilStart = startMins - totalMins;

      // Only remind if class has NOT started yet AND is within the 10-minute window
      // (stops once class starts: minsUntilStart <= 0)
      if (minsUntilStart > 0 && minsUntilStart <= 10) {
        // Enforce 2-minute (110 seconds) throttle between pushes for the same scheduleId / slot
        const lastSentDb = slot.last_reminder_sent_at ? new Date(slot.last_reminder_sent_at).getTime() : 0;
        const lastSentMem = lastTeacherPushSentAt.get(scheduleId) || 0;
        const lastSent = Math.max(lastSentDb, lastSentMem);

        if (now - lastSent < 110 * 1000) {
          continue; // less than 2 minutes since last reminder
        }

        const teacherId =
          slot.offering?.teacher_id ||
          slot.offering?.teacher?.id ||
          (slot as any).teacher_id;

        if (!teacherId) {
          continue;
        }

        const teacherSubs = (await getUserSubscriptions([teacherId], supabase)).filter(
          (s) => s.role === 'teacher'
        );

        if (teacherSubs.length === 0) {
          continue;
        }

        const rawSubj =
          slot.custom_title ||
          slot.offering?.subject?.name ||
          slot.offering?.subject_name ||
          'Class';
        const subject = typeof rawSubj === 'string' ? rawSubj : 'Class';

        const minsLeft = Math.ceil(minsUntilStart);
        const title = `${subject} starts in ${minsLeft} minute${minsLeft > 1 ? 's' : ''}`;
        const body = 'Please post your class link now — students are waiting.';

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

          // Update last_reminder_sent_at in Supabase class_slots table
          try {
            await (supabase as any)
              .from('class_slots')
              .update({ last_reminder_sent_at: new Date().toISOString() })
              .eq('id', slot.id);
          } catch (dbErr) {
            console.warn('[ServerPush] Error updating slot last_reminder_sent_at:', dbErr);
          }
        }
      }
    }

    return remindersSent;
  } catch (err) {
    console.warn('[ServerPush] Error during teacher push reminder check:', err);
    return 0;
  }
}

// ── Chat Messages Immediate Push Notification ────────────────────────────────

/**
 * Handles incoming chat messages inserted into `chat_messages` or `messages`.
 * Sends an immediate Web Push notification to the recipient ONLY if the recipient
 * is not currently active in that chat thread.
 */
export async function handleNewChatMessage(
  newMsg: {
    thread_id: string;
    sender_id: string;
    content?: string;
    message_type?: string;
    attachment_name?: string;
    attachment_key?: string;
    mime_type?: string;
  },
  supabase: SupabaseClient,
  isRecipientActiveFn: (userId: string, threadId: string) => boolean
): Promise<boolean> {
  if (!newMsg?.thread_id || !newMsg.sender_id) return false;

  try {
    // 1. Fetch thread to identify recipient
    const { data: thread, error: threadErr } = await (supabase as any)
      .from('chat_threads')
      .select('*')
      .eq('id', newMsg.thread_id)
      .maybeSingle();

    if (threadErr || !thread) {
      console.warn('[ChatPush] Could not find thread for message:', newMsg.thread_id);
      return false;
    }

    // 2. Identify the recipient (participant who is NOT the sender)
    let recipientId: string | null = null;
    if (thread.participant_one_id && thread.participant_one_id !== newMsg.sender_id) {
      recipientId = thread.participant_one_id;
    } else if (thread.participant_two_id && thread.participant_two_id !== newMsg.sender_id) {
      recipientId = thread.participant_two_id;
    } else if (thread.student_id && thread.student_id !== newMsg.sender_id) {
      recipientId = thread.student_id;
    } else if (thread.staff_id && thread.staff_id !== newMsg.sender_id) {
      recipientId = thread.staff_id;
    }

    if (!recipientId) {
      console.warn('[ChatPush] Could not determine recipient for thread:', newMsg.thread_id);
      return false;
    }

    // 3. Check if recipient is active in this specific thread right now
    if (isRecipientActiveFn(recipientId, newMsg.thread_id)) {
      console.log(`[ChatPush] Recipient ${recipientId} is currently active in thread ${newMsg.thread_id}, skipping push`);
      return false;
    }

    // 4. Fetch sender's profile for display name
    let senderName = 'Scholario Message';
    try {
      const { data: senderProfile } = await (supabase as any)
        .from('profiles')
        .select('full_name, role')
        .eq('id', newMsg.sender_id)
        .maybeSingle();

      if (senderProfile?.full_name) {
        senderName = senderProfile.full_name;
      }
    } catch (profErr) {
      console.warn('[ChatPush] Error fetching sender profile:', profErr);
    }

    // 5. iOS-style message preview formatting
    let bodyText = 'Sent a message';
    if (newMsg.message_type === 'voice') {
      bodyText = '🎤 Voice message';
    } else if (newMsg.message_type === 'image' || newMsg.mime_type?.startsWith('image/')) {
      bodyText = '📷 Sent an image';
    } else if (newMsg.attachment_name) {
      bodyText = `📎 Sent ${newMsg.attachment_name}`;
    } else if (newMsg.attachment_key) {
      bodyText = '📎 Sent an attachment';
    } else if (newMsg.content) {
      bodyText = newMsg.content.trim().slice(0, 100);
    }

    const payload: PushPayload = {
      title: senderName,
      body: bodyText,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: `chat-thread-${newMsg.thread_id}`,
      data: {
        url: `/chat?threadId=${newMsg.thread_id}`,
        thread_id: newMsg.thread_id,
        sender_id: newMsg.sender_id,
        type: 'chat_message',
      },
    };

    const result = await sendPushToUsers([recipientId], payload, supabase);
    console.log(`[ChatPush] Sent chat push to recipient ${recipientId} (${result.deliveredCount} devices notified)`);
    return result.deliveredCount > 0;
  } catch (err) {
    console.error('[ChatPush] Error handling new chat message push:', err);
    return false;
  }
}

/**
 * Explicit test trigger for teacher reminders:
 * Simulates a class starting in N minutes (default 3 minutes) and delivers an OS lockscreen push.
 */
export async function testTeacherPushReminder(
  params: {
    teacherId?: string;
    subject?: string;
    minsUntilStart?: number;
  },
  supabase: SupabaseClient
): Promise<{ success: boolean; deliveredCount: number; message: string }> {
  let targetTeacherId = params.teacherId;
  const minsLeft = params.minsUntilStart || 3;
  const subject = params.subject || 'Mathematics';

  if (!targetTeacherId) {
    const teacherSubs = getAllPushSubscriptions().filter((s) => s.role === 'teacher');
    if (teacherSubs.length > 0) {
      targetTeacherId = teacherSubs[0].user_id;
    } else {
      const { data: teacherProfile } = await (supabase as any)
        .from('profiles')
        .select('id')
        .eq('role', 'teacher')
        .limit(1)
        .maybeSingle();
      if (teacherProfile) {
        targetTeacherId = teacherProfile.id;
      }
    }
  }

  if (!targetTeacherId) {
    return { success: false, deliveredCount: 0, message: 'No teacher profile or subscription found to test' };
  }

  const title = `${subject} starts in ${minsLeft} minute${minsLeft > 1 ? 's' : ''}`;
  const body = 'Please post your class link now — students are waiting.';

  const payload: PushPayload = {
    title,
    body,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: `teacher-reminder-test-${Date.now()}`,
    data: {
      url: '/teacher#live-link-editor-test',
      role: 'teacher',
      type: 'teacher_reminder',
      minsLeft,
    },
  };

  const result = await sendPushToUsers([targetTeacherId], payload, supabase);
  return {
    success: true,
    deliveredCount: result.deliveredCount,
    message: `Dispatched test reminder push for ${subject} (${minsLeft}m) to teacher ${targetTeacherId} (${result.deliveredCount} devices reached)`,
  };
}
