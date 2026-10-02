import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

// ─── 1. CORS Headers ────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── 2. Hardcoded Recipient (Never from client) ─────────────────────────────
const SUPPORT_RECIPIENT_EMAIL = "support@scholario.me";
const FROM_EMAIL = "Scholario Contact <noreply@scholario.me>";

// ─── 3. Timezone Utility (Asia/Karachi PKT) ─────────────────────────────────
function getPKTTimestamp(): string {
  try {
    return new Intl.DateTimeFormat("en-PK", {
      timeZone: "Asia/Karachi",
      dateStyle: "full",
      timeStyle: "long",
    }).format(new Date());
  } catch {
    return new Date().toISOString() + " (PKT)";
  }
}

// ─── 4. Escape HTML to prevent injection in email body ──────────────────────
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

serve(async (req: Request) => {
  // Handle preflight OPTIONS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed. Only POST is accepted." }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!resendApiKey) {
      console.error("[send-contact-email] RESEND_API_KEY is missing from environment secrets.");
      return new Response(
        JSON.stringify({
          success: false,
          error: "RESEND_API_KEY missing. Please configure RESEND_API_KEY in Supabase secrets.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("[send-contact-email] Supabase service credentials missing.");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server database credentials missing.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse payload
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON in request body." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const {
      name,
      email,
      phone = "",
      role = "",
      message,
      honeypot = "",
    } = body;

    // ─── 5. Honeypot Spam Check ─────────────────────────────────────────────
    if (honeypot && String(honeypot).trim().length > 0) {
      console.warn("[send-contact-email] Bot caught by honeypot field:", honeypot);
      // Pretend success so bot doesn't retry
      return new Response(
        JSON.stringify({ success: true, message: "Your message has been sent successfully." }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ─── 6. Input Validations ───────────────────────────────────────────────
    const trimmedName = String(name || "").trim();
    const trimmedEmail = String(email || "").trim().toLowerCase();
    const trimmedPhone = String(phone || "").trim();
    const trimmedRole = String(role || "").trim();
    const trimmedMessage = String(message || "").trim();

    if (!trimmedName) {
      return new Response(
        JSON.stringify({ success: false, error: "Full Name is required." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (trimmedName.length > 100) {
      return new Response(
        JSON.stringify({ success: false, error: "Name must be 100 characters or less." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!trimmedEmail) {
      return new Response(
        JSON.stringify({ success: false, error: "Email address is required." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return new Response(
        JSON.stringify({ success: false, error: "Please provide a valid email address." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!trimmedMessage) {
      return new Response(
        JSON.stringify({ success: false, error: "Message is required." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (trimmedMessage.length > 2000) {
      return new Response(
        JSON.stringify({ success: false, error: "Message must be 2000 characters or less." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ─── 7. Rate Limiting (max 3 messages per hour per email or IP) ─────────
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown-ip";

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Check count for this email in the last hour
    const { count: emailCount, error: countErr } = await supabase
      .from("contact_messages")
      .select("*", { count: "exact", head: true })
      .eq("email", trimmedEmail)
      .gte("created_at", oneHourAgo);

    if (countErr) {
      console.warn("[send-contact-email] Rate limit query error:", countErr);
    } else if (typeof emailCount === "number" && emailCount >= 3) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Rate limit reached: Maximum 3 messages per hour. Please wait before sending another message.",
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Also check IP rate limit if known
    if (clientIp !== "unknown-ip") {
      const { count: ipCount } = await supabase
        .from("contact_messages")
        .select("*", { count: "exact", head: true })
        .eq("ip_address", clientIp)
        .gte("created_at", oneHourAgo);

      if (typeof ipCount === "number" && ipCount >= 3) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Too many messages sent from this network. Please wait an hour before trying again.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // ─── 8. Send Email via Resend API ───────────────────────────────────────
    const pktTime = getPKTTimestamp();
    const roleLabel = trimmedRole || "Visitor";
    const subject = `New contact message from ${trimmedName} (${roleLabel})`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #111111; margin: 0; padding: 20px; background-color: #f7f7f7; }
            .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e5e5e5; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { background: #111111; color: #ffffff; padding: 24px; text-align: left; border-bottom: 3px solid #D4A017; }
            .header h1 { margin: 0; font-size: 20px; font-weight: 700; color: #F4C430; letter-spacing: -0.5px; }
            .header p { margin: 4px 0 0 0; font-size: 13px; color: #a3a3a3; }
            .content { padding: 24px; }
            .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            .meta-table td { padding: 8px 12px; font-size: 14px; border-bottom: 1px solid #f0f0f0; }
            .meta-table td.label { font-weight: 600; color: #737373; width: 130px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
            .meta-table td.val { color: #111111; font-weight: 500; }
            .message-box { background: #fafafa; border: 1px solid #e5e5e5; border-radius: 12px; padding: 18px; margin-top: 8px; }
            .message-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #D4A017; margin-bottom: 8px; }
            .message-text { font-size: 14px; color: #111111; white-space: pre-wrap; word-break: break-word; line-height: 1.6; margin: 0; }
            .footer { padding: 16px 24px; background: #fafafa; border-top: 1px solid #e5e5e5; font-size: 12px; color: #737373; text-align: center; }
            .badge { display: inline-block; background: #fdf3c8; color: #92400e; padding: 2px 8px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1>Scholario Contact Submission</h1>
              <p>Received from the public Contact Modal</p>
            </div>
            <div class="content">
              <table class="meta-table">
                <tr>
                  <td class="label">Sender Name</td>
                  <td class="val"><strong>${escapeHtml(trimmedName)}</strong></td>
                </tr>
                <tr>
                  <td class="label">Email Address</td>
                  <td class="val"><a href="mailto:${escapeHtml(trimmedEmail)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(trimmedEmail)}</a></td>
                </tr>
                <tr>
                  <td class="label">Phone</td>
                  <td class="val">${trimmedPhone ? escapeHtml(trimmedPhone) : '<span style="color:#a3a3a3;">Not provided</span>'}</td>
                </tr>
                <tr>
                  <td class="label">Role</td>
                  <td class="val"><span class="badge">${escapeHtml(roleLabel)}</span></td>
                </tr>
                <tr>
                  <td class="label">Time (PKT)</td>
                  <td class="val">${escapeHtml(pktTime)}</td>
                </tr>
                <tr>
                  <td class="label">IP Address</td>
                  <td class="val" style="font-family: monospace; font-size: 12px; color: #737373;">${escapeHtml(clientIp)}</td>
                </tr>
              </table>

              <div class="message-box">
                <div class="message-title">Message Content</div>
                <p class="message-text">${escapeHtml(trimmedMessage)}</p>
              </div>
            </div>
            <div class="footer">
              This email was automatically dispatched to <strong>${SUPPORT_RECIPIENT_EMAIL}</strong> via the Scholario backend edge service. Hit reply to correspond with ${escapeHtml(trimmedName)}.
            </div>
          </div>
        </body>
      </html>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [SUPPORT_RECIPIENT_EMAIL],
        reply_to: trimmedEmail,
        subject: subject,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("[send-contact-email] Resend API error:", resendResponse.status, resendData);
      const resendErrorMsg =
        resendData?.message || resendData?.error?.message || "Failed to deliver email through Resend.";
      return new Response(
        JSON.stringify({
          success: false,
          error: `Email delivery failed: ${resendErrorMsg}`,
        }),
        {
          status: resendResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ─── 9. Record Message in contact_messages Table ─────────────────────────
    const { error: dbInsertErr } = await supabase.from("contact_messages").insert({
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone || null,
      role: trimmedRole || null,
      message: trimmedMessage,
      ip_address: clientIp,
      status: "sent",
    });

    if (dbInsertErr) {
      console.warn("[send-contact-email] Note: contact_messages insert notice:", dbInsertErr);
      // Non-fatal since email already succeeded through Resend
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Your message has been sent successfully to the Scholario team.",
        delivery_id: resendData?.id || null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("[send-contact-email] Fatal error in edge handler:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || "An unexpected error occurred while processing your request.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
