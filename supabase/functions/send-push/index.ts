import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import webpush from "npm:web-push@3.6.7";

// ─── 1. CORS Headers Configuration ──────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // ─── 2. Immediate Preflight Handler ───────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  // ─── 3. Global Boot Safety & Handler ──────────────────────────────────────
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@scholario.app";

    // Validate Supabase environment
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({
          success: false,
          status: 500,
          error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from environment secrets.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate VAPID credentials
    if (!vapidPublicKey || !vapidPrivateKey) {
      const missingKeys = [];
      if (!vapidPublicKey) missingKeys.push("VAPID_PUBLIC_KEY");
      if (!vapidPrivateKey) missingKeys.push("VAPID_PRIVATE_KEY");
      return new Response(
        JSON.stringify({
          success: false,
          status: 500,
          error: `VAPID keys not configured in Supabase secrets: missing [${missingKeys.join(", ")}]. Set them via Supabase Dashboard -> Project Settings -> Edge Functions -> Secrets.`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Configure WebPush VAPID
    try {
      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    } catch (vErr: any) {
      console.error("[send-push] VAPID configuration error:", vErr);
      return new Response(
        JSON.stringify({
          success: false,
          status: 500,
          error: `VAPID configuration error: ${vErr?.message || vErr}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // ─── 4. Safe JSON Body Extraction ───────────────────────────────────────
    let bodyJson: any = {};
    try {
      bodyJson = await req.json();
    } catch (jsonErr: any) {
      return new Response(
        JSON.stringify({
          success: false,
          status: 400,
          error: `Invalid JSON payload: ${jsonErr?.message || "Body must be valid JSON"}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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

    // ─── 5. JWT / Caller Verification ───────────────────────────────────────
    const authHeader = req.headers.get("Authorization") || "";
    let callerUser = null;

    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, "");
      // Allow internal service-role calls (e.g. from database triggers or pg_cron)
      if (token !== supabaseServiceRoleKey) {
        const { data: userData, error: authError } = await supabase.auth.getUser(token);
        if (authError || !userData?.user) {
          console.warn("[send-push] Invalid authorization session:", authError?.message);
          return new Response(
            JSON.stringify({
              success: false,
              status: 401,
              error: "Invalid or expired authorization token. Please log in again.",
            }),
            {
              status: 401,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        callerUser = userData.user;
      }
    } else if (!isTestNotification) {
      // Require auth for non-test notification requests
      return new Response(
        JSON.stringify({
          success: false,
          status: 401,
          error: "Missing Authorization header.",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ─── 6. Validate user_ids ───────────────────────────────────────────────
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          status: 400,
          error: "user_ids must be a non-empty array of user UUIDs",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ─── 7. Fetch push subscriptions from the push_subscriptions table ─────
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", user_ids);

    if (subError) {
      console.error("[send-push] Error querying push_subscriptions:", subError);
      return new Response(
        JSON.stringify({
          success: false,
          status: 500,
          error: `Database error querying push_subscriptions: ${subError.message}`,
          code: subError.code,
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
          status: 404,
          error: "No active push subscription found for this user in push_subscriptions. Please toggle notifications off and on in Settings to register your device.",
          attempted: 0,
          delivered: 0,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ─── 8. Construct Notification Payload ──────────────────────────────────
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

    // ─── 9. Dispatch Push Notifications via WebPush ─────────────────────────
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

    // ─── 10. Clean up dead/expired endpoints (HTTP 404 / 410 Gone) ──────────
    if (expiredEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", expiredEndpoints);
      console.log(`[send-push] Purged ${expiredEndpoints.length} expired push subscriptions`);
    }

    // ─── 11. Record in notifications table (In-App History & Bell) ──────────
    // Deduplication rules:
    // - Test notifications skip dedupe completely (always insert fresh row with class_id=null, notify_date=null)
    // - Regular class/reminder notifications use clean separate columns: class_id, notify_date, type, user_id
    //   and upsert on (user_id, class_id, notify_date, type) without modifying uuid id
    let notificationsSaved = 0;
    let dbWarningMsg = "";

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
          console.warn("[send-push] Warning inserting test notification record:", notifErr);
          dbWarningMsg = notifErr.message;
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

        if (class_id) {
          const { error: notifErr } = await supabase
            .from("notifications")
            .upsert(notificationRows, { onConflict: "user_id,class_id,notify_date,type" });

          if (notifErr) {
            console.warn("[send-push] Warning upserting notification records:", notifErr);
            dbWarningMsg = notifErr.message;
          } else {
            notificationsSaved = notificationRows.length;
          }
        } else {
          const { error: notifErr } = await supabase
            .from("notifications")
            .insert(notificationRows);

          if (notifErr) {
            console.warn("[send-push] Warning inserting notification records:", notifErr);
            dbWarningMsg = notifErr.message;
          } else {
            notificationsSaved = notificationRows.length;
          }
        }
      }
    }

    // ─── 12. Return Responses with Accurate Statuses ────────────────────────
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
          warning: dbWarningMsg || undefined,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
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
          status: 410,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
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
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("[send-push] Fatal handler exception:", err);
    return new Response(
      JSON.stringify({
        success: false,
        status: 500,
        error: err?.message || "Internal server error in send-push handler",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
