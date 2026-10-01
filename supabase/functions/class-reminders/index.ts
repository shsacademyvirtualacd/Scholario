import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import webpush from "npm:web-push@3.6.7";

// ─── 1. CORS Configuration ──────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// ─── 2. Timezone Utilities (Asia/Karachi PKT) ───────────────────────────────
function getPKTTime() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const p: Record<string, string> = {};
  formatter.formatToParts(now).forEach(({ type, value }) => {
    p[type] = value;
  });

  const dateStr = `${p.year}-${p.month}-${p.day}`; // YYYY-MM-DD
  const timeStr = `${p.hour}:${p.minute}:${p.second}`;
  const totalMins = parseInt(p.hour, 10) * 60 + parseInt(p.minute, 10);

  // Parse day of week in PKT (0=Sun, 1=Mon ... 6=Sat)
  const pktDateObj = new Date(`${dateStr}T${timeStr}+05:00`);
  const dayOfWeek = pktDateObj.getDay();
  // App day-of-week convention: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  const appDow = (dayOfWeek + 6) % 7;

  return { now, dateStr, timeStr, totalMins, appDow };
}

// ─── 3. Message Templates (English + Urdu Script) ───────────────────────────

// Students: Class Started / Live Link Available (Rotates 1 to 8)
const STUDENT_LIVE_TEMPLATES = [
  {
    en: (t: string, s: string) => `${t} is taking ${s} class now, join!`,
    ur: (t: string, s: string) => `سر ${t} کی ${s} کلاس شروع ہو چکی ہے، ابھی شامل ہوں!`,
  },
  {
    en: (t: string, s: string) => `Your ${s} live class with ${t} is in progress. Don't miss out!`,
    ur: (t: string, s: string) => `${t} کے ساتھ آپ کی ${s} کلاس جاری ہے۔ جلدی کلاس میں آئیں!`,
  },
  {
    en: (t: string, s: string) => `${t} is waiting for you in ${s} class. Tap here to join.`,
    ur: (t: string, s: string) => `سر ${t} آپ کا ${s} کلاس میں انتظار کر رہے ہیں۔ شامل ہونے کے لیے ٹیپ کریں۔`,
  },
  {
    en: (t: string, s: string) => `Important topics are being covered in ${s} right now with ${t}!`,
    ur: (t: string, s: string) => `${s} کی کلاس میں اہم موضوعات پڑھائے جا رہے ہیں۔ فوری شامل ہوں!`,
  },
  {
    en: (t: string, s: string) => `Reminder: You have not joined ${t}'s ${s} class yet.`,
    ur: (t: string, s: string) => `یاد دہانی: آپ نے ابھی تک ${t} کی ${s} کلاس جوائن نہیں کی۔`,
  },
  {
    en: (t: string, s: string) => `${s} class is ongoing. Join ${t}'s session to mark your attendance.`,
    ur: (t: string, s: string) => `${s} کلاس جاری ہے۔ اپنی حاضری یقینی بنانے کے لیے ابھی جوائن کریں۔`,
  },
  {
    en: (t: string, s: string) => `Hurry up! ${t}'s ${s} class is halfway through.`,
    ur: (t: string, s: string) => `جلدی کریں! ${t} کی ${s} کلاس کا وقت تیزی سے گزر رہا ہے۔`,
  },
  {
    en: (t: string, s: string) => `Final reminder: ${s} class with ${t} will end soon. Join now!`,
    ur: (t: string, s: string) => `آخری یاد دہانی: سر ${t} کی ${s} کلاس جلد ختم ہو جائے گی۔ ابھی شامل ہوں!`,
  },
];

// Students: Class Time Arrived But Teacher Has NOT Added Link Yet (Rotates 1 to 8)
const STUDENT_WAIT_LINK_TEMPLATES = [
  {
    en: (t: string, s: string) => `Class time ho gaya, waiting for ${t} to add the ${s} link.`,
    ur: (t: string, s: string) => `کلاس کا وقت ہو گیا ہے، سر ${t} کے ${s} لنک شامل کرنے کا انتظار ہے۔`,
  },
  {
    en: (t: string, s: string) => `Your ${s} class is scheduled now. ${t} will post the link shortly.`,
    ur: (t: string, s: string) => `آپ کی ${s} کلاس کا وقت ہے۔ سر ${t} جلد ہی لنک لگائیں گے۔`,
  },
  {
    en: (t: string, s: string) => `Stay ready! ${t} will be starting the ${s} session in a moment.`,
    ur: (t: string, s: string) => `تیار رہیں! سر ${t} کچھ ہی دیر میں ${s} کلاس شروع کر رہے ہیں۔`,
  },
  {
    en: (t: string, s: string) => `Waiting for ${t} to upload the live link for ${s}. Please stand by.`,
    ur: (t: string, s: string) => `${s} کے لائیو لنک کا انتظار ہے۔ برائے مہربانی الرٹ رہیں۔`,
  },
  {
    en: (t: string, s: string) => `${s} class link is expected any second from ${t}. Keep Scholario open!`,
    ur: (t: string, s: string) => `${t} کی طرف سے ${s} کا لنک کسی بھی لمحے متوقع ہے۔ ایپ پر نظر رکھیں۔`,
  },
  {
    en: (t: string, s: string) => `Still waiting for ${t}'s link for ${s}. We will notify you immediately.`,
    ur: (t: string, s: string) => `${t} کے ${s} لنک کا ابھی انتظار ہے۔ لنک آتے ہی مطلع کریں گے۔`,
  },
  {
    en: (t: string, s: string) => `${s} class time is here. We are reminding ${t} to add the link.`,
    ur: (t: string, s: string) => `${s} کلاس کا وقت ہے۔ ہم سر ${t} کو لنک لگانے کی یاد دہانی بھیج رہے ہیں۔`,
  },
  {
    en: (t: string, s: string) => `Stand by for ${s} class with ${t}. Link pending.`,
    ur: (t: string, s: string) => `سر ${t} کی ${s} کلاس کے لیے تیار رہیں۔ لنک کا انتظار جاری ہے۔`,
  },
];

// Students: Exam Class (Rotates 1 to 8)
const STUDENT_EXAM_TEMPLATES = [
  {
    en: (t: string, s: string) => `ATTENTION: ${s} Exam is starting now with ${t}! Open exam room.`,
    ur: (t: string, s: string) => `توجہ فرمائیں: ${s} کا امتحان شروع ہو چکا ہے! فوری امتحانی کمرے میں جائیں۔`,
  },
  {
    en: (t: string, s: string) => `Your ${s} Exam paper is live with ${t}. Begin your exam promptly!`,
    ur: (t: string, s: string) => `سر ${t} کا ${s} امتحانی پیپر لائیو ہے۔ وقت ضائع کیے بغیر پرچہ شروع کریں۔`,
  },
  {
    en: (t: string, s: string) => `Exam in progress: ${s}. Proctored timer is running.`,
    ur: (t: string, s: string) => `${s} کا امتحان جاری ہے۔ وقت تیزی سے گزر رہا ہے۔`,
  },
  {
    en: (t: string, s: string) => `Do not be marked absent! Join your ${s} Exam session immediately.`,
    ur: (t: string, s: string) => `غیر حاضر مت ہوں! اپنے ${s} امتحان میں فوری شرکت کریں۔`,
  },
  {
    en: (t: string, s: string) => `Halfway through ${s} Exam time. Submit your answers before deadline.`,
    ur: (t: string, s: string) => `${s} امتحان کا آدھا وقت گزر چکا ہے۔ وقت پر جوابات جمع کروائیں۔`,
  },
  {
    en: (t: string, s: string) => `Urgent: You have not opened the ${s} Exam. Join now!`,
    ur: (t: string, s: string) => `ضروری: آپ نے ابھی تک ${s} کا پیپر نہیں کھولا۔ ابھی جوائن کریں!`,
  },
  {
    en: (t: string, s: string) => `Final minutes for ${s} Exam with ${t}. Complete your paper.`,
    ur: (t: string, s: string) => `${t} کے زیر نگرانی ${s} امتحان کے آخری لمحات۔ پیپر مکمل کریں۔`,
  },
  {
    en: (t: string, s: string) => `Last warning: ${s} Exam is ending. Complete submission now!`,
    ur: (t: string, s: string) => `آخری تنبیہ: ${s} امتحان ختم ہونے والا ہے۔ فوری طور پر جمع کروائیں!`,
  },
];

// Teachers: No Link Added (Rotates 1 to 10)
const TEACHER_MISSING_LINK_TEMPLATES = [
  (t: string, s: string, b: string) => `Sir, class ka time ho gaya, please add the link for ${s} (${b}).`,
  (t: string, s: string, b: string) => `Students are waiting for your ${s} class. Please paste the Google Meet link.`,
  (t: string, s: string, b: string) => `Your ${s} class is 10 minutes past start time. Students are in the waiting room.`,
  (t: string, s: string, b: string) => `Reminder: Please post the ${s} class link now so students can join.`,
  (t: string, s: string, b: string) => `Admin alert pending: ${s} class has not started yet. Please add your link.`,
  (t: string, s: string, b: string) => `Students are requesting access to ${s}. Please launch your class session.`,
  (t: string, s: string, b: string) => `25 minutes elapsed: Please update ${s} class status or post live link.`,
  (t: string, s: string, b: string) => `Urgent: ${s} class link missing. Tap here to paste link immediately.`,
  (t: string, s: string, b: string) => `Final teacher reminder: Please provide ${s} class link or reschedule in portal.`,
  (t: string, s: string, b: string) => `Last notification: ${s} class session link still pending.`,
];

serve(async (req: Request) => {
  // ─── Preflight ────────────────────────────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@scholario.app";
    const cronSecret = Deno.env.get("CRON_SECRET") || "";

    // ─── 4. Auth / Secret Check ─────────────────────────────────────────────
    // Validate CRON_SECRET if configured in Supabase secrets
    if (cronSecret) {
      const headerSecret = req.headers.get("x-cron-secret") || "";
      const authHeader = req.headers.get("Authorization") || "";
      const bearerToken = authHeader.replace(/^Bearer\s+/i, "");

      const isAuthorized =
        headerSecret === cronSecret ||
        bearerToken === cronSecret ||
        bearerToken === supabaseServiceRoleKey;

      if (!isAuthorized) {
        console.warn("[class-reminders] Unauthorized cron trigger attempt");
        return new Response(
          JSON.stringify({ success: false, status: 401, error: "Unauthorized: invalid CRON_SECRET" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ success: false, status: 500, error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Configure WebPush
    if (vapidPublicKey && vapidPrivateKey) {
      try {
        webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
      } catch (vErr: any) {
        console.warn("[class-reminders] WebPush setVapidDetails warning:", vErr.message);
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { now, dateStr, totalMins, appDow } = getPKTTime();

    // Check if invoked with direct payload (e.g. from database trigger or link-save webhook)
    let bodyJson: any = null;
    if (req.method === "POST") {
      try {
        bodyJson = await req.json();
      } catch {
        // Not a JSON payload or empty body (pg_cron cron trigger)
      }
    }

    // ─── 4b. Immediate Link-Added Event Handling (Trigger or Webhook) ──────
    if (bodyJson && (bodyJson.event === "link_added" || bodyJson.class_id)) {
      const classId = bodyJson.class_id || bodyJson.record?.id;
      const classLink = bodyJson.class_link || bodyJson.record?.class_link;
      const teacherName = bodyJson.teacher_name || "Sir / Madam";
      const subjectName = bodyJson.subject || bodyJson.record?.subject || "Class";
      const batchName = bodyJson.batch || bodyJson.record?.batch || "All Students";

      if (classId && classLink) {
        // 1. Alert Admins
        const { data: adminProfiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "admin");
        const adminIds = (adminProfiles || []).map((a: any) => a.id);

        // 2. Alert Students
        const { data: students } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "student")
          .or(`grade.eq.${batchName},class_id.eq.${batchName}`);
        const studentIds = (students || []).map((s: any) => s.id);

        const pushTitle = `${subjectName} Link Added | کلاس لنک دستیاب`;
        const pushBody = `${teacherName} added the link for ${subjectName} class, join now!\nسر ${teacherName} نے ${subjectName} کلاس کا لنک شامل کر دیا ہے، ابھی جوائن کریں!`;

        let deliveredCount = 0;
        const allTargets = Array.from(new Set([...adminIds, ...studentIds]));

        for (const uid of allTargets) {
          const { data: subs } = await supabase
            .from("push_subscriptions")
            .select("*")
            .eq("user_id", uid);

          for (const sub of subs || []) {
            try {
              await webpush.sendNotification(
                {
                  endpoint: sub.endpoint,
                  keys: {
                    p256dh: sub.p256dh || sub.subscription_json?.keys?.p256dh,
                    auth: sub.auth || sub.subscription_json?.keys?.auth,
                  },
                },
                JSON.stringify({
                  title: pushTitle,
                  body: pushBody,
                  icon: "/logo.png",
                  badge: "/logo.png",
                  tag: `scholario-link-${classId}-${Date.now()}`,
                  data: {
                    url: classLink,
                    type: "link_added",
                    class_id: classId,
                    notify_date: dateStr,
                  },
                }),
                { TTL: 60 * 60 * 2, urgency: "high" }
              );
              deliveredCount++;
            } catch (err: any) {
              const status = err?.statusCode || err?.status;
              if (status === 404 || status === 410) {
                await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
              }
            }
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            status: 200,
            event: "link_added",
            class_id: classId,
            deliveredCount,
            recipientsNotified: allTargets.length,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log(`[class-reminders] Running PKT check for date=${dateStr}, totalMins=${totalMins}, dow=${appDow}`);

    // ─── 5. Unified Class Sessions Retrieval ────────────────────────────────
    interface NormalizedClass {
      id: string; // UUID
      subject: string;
      batch: string;
      teacher_id: string | null;
      teacher_name: string;
      class_link: string | null;
      scheduled_start: Date;
      scheduled_end: Date;
      is_exam: boolean;
      status: string;
      enrolled_student_ids: string[];
    }

    const activeSessions: NormalizedClass[] = [];

    // A. Query public.classes (Direct classes with scheduled_start timestamptz)
    const { data: classesData, error: classesErr } = await supabase
      .from("classes")
      .select("id, teacher_id, subject, batch, scheduled_start, class_link, status")
      .neq("status", "ended");

    if (!classesErr && classesData) {
      for (const c of classesData) {
        if (!c.scheduled_start) continue;
        const startTime = new Date(c.scheduled_start);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

        // Check if class date matches today in PKT
        const classPKTDate = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Karachi",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(startTime);

        if (classPKTDate !== dateStr) continue;

        // Fetch teacher name
        let teacherName = "Your Teacher";
        if (c.teacher_id) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", c.teacher_id)
            .maybeSingle();
          if (prof?.full_name) teacherName = prof.full_name;
        }

        // Fetch enrolled students for this batch/grade
        const batchName = c.batch || "All Students";
        const { data: students } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "student")
          .or(`grade.eq.${batchName},class_id.eq.${batchName}`);

        const enrolled_student_ids = (students || []).map((s: any) => s.id);
        const is_exam = /exam|paper|assessment|quiz/i.test(`${c.subject} ${c.batch}`);

        activeSessions.push({
          id: c.id,
          subject: c.subject || "Class",
          batch: batchName,
          teacher_id: c.teacher_id,
          teacher_name: teacherName,
          class_link: c.class_link?.trim() || null,
          scheduled_start: startTime,
          scheduled_end: endTime,
          is_exam,
          status: c.status || "scheduled",
          enrolled_student_ids,
        });
      }
    }

    // B. Query public.class_slots (Timetable slots scheduled for today's appDow)
    const { data: slotsData, error: slotsErr } = await supabase
      .from("class_slots")
      .select("id, start_time, end_time, custom_title, offering_id, class_id, is_cancelled, offering:class_offerings(*, teacher:teachers(*), subject:subjects(*))")
      .eq("day_of_week", appDow)
      .eq("is_cancelled", false);

    if (!slotsErr && slotsData) {
      for (const slot of slotsData) {
        if (!slot.start_time) continue;

        // Compute start and end times in PKT
        const startTime = new Date(`${dateStr}T${slot.start_time}+05:00`);
        const endTime = slot.end_time
          ? new Date(`${dateStr}T${slot.end_time}+05:00`)
          : new Date(startTime.getTime() + 60 * 60 * 1000);

        // Fetch session link for today if posted
        let classLink: string | null = null;
        const { data: linkRow } = await supabase
          .from("class_session_links")
          .select("link_url")
          .eq("slot_id", slot.id)
          .eq("session_date", dateStr)
          .maybeSingle();

        if (linkRow?.link_url && linkRow.link_url.trim().length > 0) {
          classLink = linkRow.link_url.trim();
        } else {
          // Check live_sessions table
          const { data: liveRow } = await supabase
            .from("live_sessions")
            .select("class_link, status")
            .eq("slot_id", slot.id)
            .maybeSingle();
          if (liveRow?.class_link && liveRow.class_link.trim().length > 0) {
            classLink = liveRow.class_link.trim();
          }
        }

        const offering = (slot as any).offering;
        const subjectName = slot.custom_title || offering?.subject?.name || offering?.subject_name || "Class";
        const teacherName = offering?.teacher?.full_name || "Instructor";
        const teacherId = offering?.teacher_id || offering?.teacher?.id || null;
        const batchName = offering?.class?.display_name || `Grade ${slot.class_id || "9"}`;

        // Find enrolled students for this offering or class
        let enrolled_student_ids: string[] = [];
        if (slot.offering_id) {
          const { data: enrolls } = await supabase
            .from("enrollments")
            .select("student_id")
            .eq("offering_id", slot.offering_id);
          enrolled_student_ids = (enrolls || []).map((e: any) => e.student_id);
        }

        if (enrolled_student_ids.length === 0 && slot.class_id) {
          const { data: classStudents } = await supabase
            .from("profiles")
            .select("id")
            .eq("role", "student")
            .eq("class_id", slot.class_id);
          enrolled_student_ids = (classStudents || []).map((s: any) => s.id);
        }

        const is_exam = /exam|paper|assessment|quiz/i.test(`${subjectName} ${batchName}`);

        activeSessions.push({
          id: slot.id,
          subject: subjectName,
          batch: batchName,
          teacher_id: teacherId,
          teacher_name: teacherName,
          class_link: classLink,
          scheduled_start: startTime,
          scheduled_end: endTime,
          is_exam,
          status: classLink ? "live" : "scheduled",
          enrolled_student_ids,
        });
      }
    }

    // C. Fetch all admins for admin alerts
    const { data: adminProfiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");
    const adminUserIds: string[] = (adminProfiles || []).map((a: any) => a.id);

    // D. Fetch today's attended/joined students (to stop student reminders once joined)
    const { data: attendanceRows } = await supabase
      .from("attendance")
      .select("student_id, slot_id")
      .eq("session_date", dateStr);

    const attendedStudentKeys = new Set<string>();
    (attendanceRows || []).forEach((att: any) => {
      attendedStudentKeys.add(`${att.student_id}_${att.slot_id}`);
    });

    // Also check class_attendance_log if exists
    try {
      const { data: joinRows } = await supabase
        .from("class_attendance_log")
        .select("student_id, class_id")
        .eq("session_date", dateStr);
      (joinRows || []).forEach((j: any) => {
        attendedStudentKeys.add(`${j.student_id}_${j.class_id}`);
      });
    } catch {
      // optional table
    }

    // ─── 6. Notification Dispatch Helper ────────────────────────────────────
    async function sendPushToUsers(
      targetUserIds: string[],
      payload: {
        title: string;
        body: string;
        url: string;
        type: string;
        classId: string;
      }
    ) {
      if (targetUserIds.length === 0) return 0;

      // 1. Fetch push subscriptions
      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("*")
        .in("user_id", targetUserIds);

      if (!subscriptions || subscriptions.length === 0) {
        return 0;
      }

      const payloadString = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: "/logo.png",
        badge: "/logo.png",
        tag: `scholario-${payload.type}-${payload.classId}-${Date.now()}`,
        data: {
          url: payload.url,
          type: payload.type,
          class_id: payload.classId,
          notify_date: dateStr,
        },
      });

      let delivered = 0;
      const expiredEndpoints: string[] = [];

      for (const sub of subscriptions) {
        const pushSub = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh || sub.subscription_json?.keys?.p256dh,
            auth: sub.auth || sub.subscription_json?.keys?.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSub, payloadString, {
            TTL: 60 * 60 * 2,
            urgency: "high",
          });
          delivered++;
        } catch (err: any) {
          const status = err?.statusCode || err?.status;
          if (status === 404 || status === 410) {
            expiredEndpoints.push(sub.endpoint);
          }
        }
      }

      // Clean up dead subscriptions
      if (expiredEndpoints.length > 0) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .in("endpoint", expiredEndpoints);
      }

      // Record in public.notifications for in-app history
      const notifRows = targetUserIds.map((uid) => ({
        user_id: uid,
        recipient_id: uid,
        class_id: payload.classId,
        notify_date: dateStr,
        title: payload.title,
        body: payload.body,
        message: payload.body,
        type: payload.type,
        url: payload.url,
        is_read: false,
      }));

      try {
        await supabase.from("notifications").insert(notifRows);
      } catch (nErr) {
        console.warn("[class-reminders] In-app notification insert warning:", nErr);
      }

      return delivered;
    }

    // ─── 7. Main Schedule & Deduplication Loop ──────────────────────────────
    let studentRemindersSent = 0;
    let teacherRemindersSent = 0;
    let adminAlertsSent = 0;

    for (const session of activeSessions) {
      const nowMs = now.getTime();
      const startMs = session.scheduled_start.getTime();
      const endMs = session.scheduled_end.getTime();

      const diffMins = (nowMs - startMs) / (60 * 1000);
      const isClassOngoing = nowMs >= startMs && nowMs <= endMs;
      const hasLink = Boolean(session.class_link && session.class_link.trim().length > 0);

      // Class time arrived
      if (isClassOngoing) {
        // ─── RULE 2: TEACHERS (No Link Added) ───────────────────────────────
        if (!hasLink && session.teacher_id) {
          // Check notification_log for this teacher, class, date, and type
          const { data: teacherLog } = await supabase
            .from("notification_log")
            .select("count, last_sent_at")
            .eq("user_id", session.teacher_id)
            .eq("class_id", session.id)
            .eq("notify_date", dateStr)
            .eq("type", "teacher_missing_link")
            .maybeSingle();

          let shouldSendTeacher = false;
          let teacherCount = 0;

          if (!teacherLog) {
            shouldSendTeacher = true;
            teacherCount = 1;
          } else if (teacherLog.count < 10) {
            const secondsSinceLast = (nowMs - new Date(teacherLog.last_sent_at).getTime()) / 1000;
            // 5 minute gap (300 seconds minus 15 seconds clock skew leeway)
            if (secondsSinceLast >= 285) {
              shouldSendTeacher = true;
              teacherCount = teacherLog.count + 1;
            }
          }

          if (shouldSendTeacher) {
            const templateIdx = (teacherCount - 1) % TEACHER_MISSING_LINK_TEMPLATES.length;
            const teacherMsg = TEACHER_MISSING_LINK_TEMPLATES[templateIdx](
              session.teacher_name,
              session.subject,
              session.batch
            );

            await sendPushToUsers([session.teacher_id], {
              title: `Class Link Missing: ${session.subject}`,
              body: teacherMsg,
              url: `/teacher/schedule`,
              type: "teacher_missing_link",
              classId: session.id,
            });

            // Update notification_log
            if (!teacherLog) {
              await supabase.from("notification_log").insert({
                user_id: session.teacher_id,
                class_id: session.id,
                notify_date: dateStr,
                type: "teacher_missing_link",
                count: 1,
                last_sent_at: new Date().toISOString(),
              });
            } else {
              await supabase
                .from("notification_log")
                .update({ count: teacherCount, last_sent_at: new Date().toISOString() })
                .eq("user_id", session.teacher_id)
                .eq("class_id", session.id)
                .eq("notify_date", dateStr)
                .eq("type", "teacher_missing_link");
            }

            teacherRemindersSent++;
          }
        }

        // ─── RULE 3: ADMIN (Teacher Has Not Added Link After 15 Minutes) ────
        if (!hasLink && diffMins >= 15 && adminUserIds.length > 0) {
          for (const adminId of adminUserIds) {
            const { data: adminLog } = await supabase
              .from("notification_log")
              .select("count")
              .eq("user_id", adminId)
              .eq("class_id", session.id)
              .eq("notify_date", dateStr)
              .eq("type", "admin_missing_link")
              .maybeSingle();

            // Once only per class per day
            if (!adminLog) {
              const adminMsg = `${session.teacher_name} (${session.subject}, ${session.batch}) did not take the class today / did not add the link.`;

              await sendPushToUsers([adminId], {
                title: `Missing Class Link Alert: ${session.subject}`,
                body: adminMsg,
                url: `/admin/schedule`,
                type: "admin_missing_link",
                classId: session.id,
              });

              await supabase.from("notification_log").insert({
                user_id: adminId,
                class_id: session.id,
                notify_date: dateStr,
                type: "admin_missing_link",
                count: 1,
                last_sent_at: new Date().toISOString(),
              });

              adminAlertsSent++;
            }
          }
        }

        // ─── RULE 1: STUDENTS (Class Time Arrived) ──────────────────────────
        for (const studentId of session.enrolled_student_ids) {
          // Stop reminders as soon as student has joined/opened the class
          if (attendedStudentKeys.has(`${studentId}_${session.id}`)) {
            continue;
          }

          const notifType = session.is_exam
            ? "student_exam_reminder"
            : hasLink
            ? "student_class_reminder"
            : "student_wait_link";

          const { data: studentLog } = await supabase
            .from("notification_log")
            .select("count, last_sent_at")
            .eq("user_id", studentId)
            .eq("class_id", session.id)
            .eq("notify_date", dateStr)
            .eq("type", notifType)
            .maybeSingle();

          let shouldSendStudent = false;
          let studentCount = 0;

          if (!studentLog) {
            shouldSendStudent = true;
            studentCount = 1;
          } else if (studentLog.count < 8) {
            const secondsSinceLast = (nowMs - new Date(studentLog.last_sent_at).getTime()) / 1000;
            // 5 minute gap (300 seconds minus 15 seconds clock skew leeway)
            if (secondsSinceLast >= 285) {
              shouldSendStudent = true;
              studentCount = studentLog.count + 1;
            }
          }

          if (shouldSendStudent) {
            let templateList = STUDENT_LIVE_TEMPLATES;
            if (session.is_exam) {
              templateList = STUDENT_EXAM_TEMPLATES;
            } else if (!hasLink) {
              templateList = STUDENT_WAIT_LINK_TEMPLATES;
            }

            const templateIdx = (studentCount - 1) % templateList.length;
            const tObj = templateList[templateIdx];

            const enText = tObj.en(session.teacher_name, session.subject);
            const urText = tObj.ur(session.teacher_name, session.subject);

            // Combined English and Urdu in the same notification
            const combinedBody = `${enText}\n${urText}`;
            const notifTitle = session.is_exam
              ? `${session.subject} Exam Live | امتحانی پیپر شروع`
              : hasLink
              ? `${session.subject} Class Started | کلاس شروع ہو گئی`
              : `${session.subject} Class Time | کلاس کا وقت`;

            const studentUrl = hasLink && session.class_link
              ? session.class_link
              : `/student/schedule`;

            await sendPushToUsers([studentId], {
              title: notifTitle,
              body: combinedBody,
              url: studentUrl,
              type: notifType,
              classId: session.id,
            });

            // Record in notification_log
            if (!studentLog) {
              await supabase.from("notification_log").insert({
                user_id: studentId,
                class_id: session.id,
                notify_date: dateStr,
                type: notifType,
                count: 1,
                last_sent_at: new Date().toISOString(),
              });
            } else {
              await supabase
                .from("notification_log")
                .update({ count: studentCount, last_sent_at: new Date().toISOString() })
                .eq("user_id", studentId)
                .eq("class_id", session.id)
                .eq("notify_date", dateStr)
                .eq("type", notifType);
            }

            studentRemindersSent++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: 200,
        date: dateStr,
        activeSessionsFound: activeSessions.length,
        studentRemindersSent,
        teacherRemindersSent,
        adminAlertsSent,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("[class-reminders] Fatal execution error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        status: 500,
        error: err?.message || "Internal server error in class-reminders handler",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
