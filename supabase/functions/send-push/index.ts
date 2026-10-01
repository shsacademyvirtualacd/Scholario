import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
          error: "VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in Supabase secrets.",
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

    const bodyJson = await req.json();
    const { user_ids, title, body, url, type = "general" } = bodyJson;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "user_ids must be a non-empty array of user IDs" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 1. Fetch subscriptions for targeted users
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", user_ids);

    if (subError) {
      console.error("[send-push] Error querying push_subscriptions:", subError);
    }

    const payloadString = JSON.stringify({
      title: title || "Scholario Notification",
      body: body || "",
      icon: "/logo.png",
      badge: "/logo.png",
      tag: `scholario-${type}-${Date.now()}`,
      data: {
        url: url || "/",
        type,
      },
    });

    let attempted = 0;
    let delivered = 0;
    let failed = 0;
    const expiredEndpoints: string[] = [];

    if (subscriptions && subscriptions.length > 0) {
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
          console.warn(`[send-push] Delivery failed for ${sub.endpoint.slice(0, 30)}... status=${statusCode}`);
          if (statusCode === 404 || statusCode === 410) {
            expiredEndpoints.push(sub.endpoint);
          }
        }
      }
    }

    // 2. Clean up dead/unsubscribed endpoints (HTTP 404 / 410 Gone)
    if (expiredEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", expiredEndpoints);
      console.log(`[send-push] Purged ${expiredEndpoints.length} dead push subscriptions`);
    }

    // 3. Record in notifications table for in-app history and bell counter (unless skip_db_insert is true)
    let notificationsSaved = 0;
    if (!bodyJson.skip_db_insert) {
      const notificationInserts = user_ids.map((uid: string) => ({
        user_id: uid,
        recipient_id: uid,
        title: title || "Scholario Notification",
        body: body || "",
        message: body || "",
        type,
        url: url || null,
        is_read: false,
      }));

      const { error: notifErr } = await supabase
        .from("notifications")
        .insert(notificationInserts);

      if (notifErr) {
        console.warn("[send-push] Warning inserting notifications records:", notifErr);
      } else {
        notificationsSaved = notificationInserts.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        attempted,
        delivered,
        failed,
        expiredCleaned: expiredEndpoints.length,
        notificationsSaved,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err: any) {
    console.error("[send-push] Function fatal error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
