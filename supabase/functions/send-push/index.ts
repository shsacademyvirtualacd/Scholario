import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@scholario.app";

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "VAPID keys not configured in Supabase secrets. Please set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in Supabase secrets.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    try {
      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    } catch (vErr: any) {
      console.warn("[send-push] VAPID details warning:", vErr.message);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // ── Caller Authentication Verification ────────────────────────────────
    const authHeader = req.headers.get("Authorization") || "";
    let callerUser = null;
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, "");
      // Allow internal service-role calls (e.g. from pg_net or cron triggers)
      if (token !== supabaseServiceRoleKey) {
        const { data: userData, error: authError } = await supabase.auth.getUser(token);
        if (authError || !userData?.user) {
          return new Response(
            JSON.stringify({ success: false, error: "Invalid or expired authorization session. Please log in again." }),
            {
              status: 401,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        callerUser = userData.user;
      }
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Missing Authorization header." }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const bodyJson = await req.json();
    const {
      user_ids,
      title,
      body,
      url,
      type = "general",
      class_id,
      notify_date,
      dedupe_key,
      skip_db_insert,
      is_test = false,
    } = bodyJson;

    const isTestNotification = is_test || type === "test_notification";

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "user_ids must be a non-empty array of user UUIDs", status: 400 }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 1. Fetch push subscriptions from the push_subscriptions table
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", user_ids);

    if (subError) {
      console.error("[send-push] Error querying push_subscriptions:", subError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Database error querying push_subscriptions: ${subError.message}`,
          code: subError.code,
          status: 500,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No active push subscription found for this user in push_subscriptions. Please toggle notifications off and on in Settings to register your device.",
          status: 404,
          attempted: 0,
          delivered: 0,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payloadString = JSON.stringify({
      title: title || "Scholario Notification",
      body: body || "",
      icon: "/logo.png",
      badge: "/logo.png",
      tag: isTestNotification
        ? `scholario-test-${Date.now()}`
        : `scholario-${type}-${class_id || Date.now()}`,
      data: {
        url: url || "/",
        type,
        class_id: class_id || null,
        notify_date: notify_date || null,
      },
    });

    let attempted = 0;
    let delivered = 0;
    let failed = 0;
    let vapidMismatch = false;
    let lastPushErrorMsg = "";
    const expiredEndpoints: string[] = [];

    for (const sub of subscriptions) {
      attempted++;
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh || sub.subscription_json?.keys?.p256dh,
          auth: sub.auth || sub.subscription_json?.keys?.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSub, payloadString, {
          TTL: 60 * 60 * 4,
          urgency: "high",
        });
        delivered++;
      } catch (err: any) {
        failed++;
        const statusCode = err?.statusCode || err?.status;
        lastPushErrorMsg = err?.body || err?.message || `HTTP ${statusCode}`;
        console.warn(`[send-push] Delivery failed for endpoint ${sub.endpoint.slice(0, 30)}... status=${statusCode}, msg=${lastPushErrorMsg}`);
        if (statusCode === 404 || statusCode === 410) {
          expiredEndpoints.push(sub.endpoint);
        } else if (statusCode === 401 || statusCode === 403) {
          vapidMismatch = true;
        }
      }
    }

    // 2. Clean up dead/expired endpoints (HTTP 404 / 410 Gone)
    if (expiredEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", expiredEndpoints);
      console.log(`[send-push] Purged ${expiredEndpoints.length} expired push subscriptions`);
    }

    // 3. Record in notifications table for in-app history and bell counter
    // DEDUPE RULE:
    // - Test notifications skip dedupe completely (always insert a fresh row with class_id=null, notify_date=null)
    // - Regular class/reminder notifications use clean separate columns: class_id, notify_date, type, user_id
    //   and upsert on (user_id, class_id, notify_date, type) without touching uuid id
    let notificationsSaved = 0;
    let dbErrorMsg = "";

    if (!skip_db_insert) {
      const todayDateStr = new Date().toISOString().slice(0, 10);

      if (isTestNotification) {
        // Pure insert for test notifications: NO deduplication check, always persists
        const notificationInserts = user_ids.map((uid: string) => ({
          user_id: uid,
          recipient_id: uid,
          title: title || "Scholario Test Notification",
          body: body || "",
          message: body || "",
          type: "test_notification",
          url: url || null,
          is_read: false,
          class_id: null,
          notify_date: null,
          dedupe_key: null,
        }));

        const { error: notifErr } = await supabase
          .from("notifications")
          .insert(notificationInserts);

        if (notifErr) {
          console.warn("[send-push] notifications insert error for test:", notifErr);
          dbErrorMsg = notifErr.message;
        } else {
          notificationsSaved = notificationInserts.length;
        }
      } else {
        // Upsert for scheduled / class reminders using separate dedupe columns
        const notificationRows = user_ids.map((uid: string) => ({
          user_id: uid,
          recipient_id: uid,
          title: title || "Scholario Notification",
          body: body || "",
          message: body || "",
          type,
          url: url || null,
          is_read: false,
          class_id: class_id || null,
          notify_date: notify_date || (class_id ? todayDateStr : null),
          dedupe_key: dedupe_key || (class_id ? `${uid}_${class_id}_${notify_date || todayDateStr}_${type}` : null),
        }));

        // If class_id and notify_date are present, upsert with clean onConflict
        if (class_id) {
          const { error: notifErr } = await supabase
            .from("notifications")
            .upsert(notificationRows, { onConflict: "user_id,class_id,notify_date,type" });

          if (notifErr) {
            console.warn("[send-push] notifications upsert error:", notifErr);
            dbErrorMsg = notifErr.message;
          } else {
            notificationsSaved = notificationRows.length;
          }
        } else {
          const { error: notifErr } = await supabase
            .from("notifications")
            .insert(notificationRows);

          if (notifErr) {
            console.warn("[send-push] notifications insert error:", notifErr);
            dbErrorMsg = notifErr.message;
          } else {
            notificationsSaved = notificationRows.length;
          }
        }
      }
    }

    // 4. Return appropriate response with exact statuses
    if (delivered > 0) {
      return new Response(
        JSON.stringify({
          success: true,
          status: 200,
          attempted,
          delivered,
          failed,
          expiredCleaned: expiredEndpoints.length,
          notificationsSaved,
          warning: dbErrorMsg || undefined,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // If delivery failed for all attempted endpoints
    if (expiredEndpoints.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          status: 410,
          error: "Push subscription expired or invalidated by push service (HTTP 410). Stale subscription has been removed from database. Please toggle notifications off and on in Settings to register a fresh token.",
          expiredCleaned: expiredEndpoints.length,
          attempted,
          delivered: 0,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 410,
        }
      );
    }

    if (vapidMismatch) {
      return new Response(
        JSON.stringify({
          success: false,
          status: 401,
          error: "VAPID Key Mismatch: The subscription was registered with a different VAPID key than the server's private key. Please toggle notifications off and on in Settings.",
          attempted,
          delivered: 0,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        status: 502,
        error: lastPushErrorMsg
          ? `Push service delivery error: ${lastPushErrorMsg}`
          : "Failed to deliver push notification to device. Please check browser permissions and network connection.",
        attempted,
        delivered: 0,
        failed,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 502,
      }
    );
  } catch (err: any) {
    console.error("[send-push] Function fatal error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
