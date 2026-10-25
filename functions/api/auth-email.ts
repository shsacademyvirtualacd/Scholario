import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../env';

/**
 * Supabase Send Email Auth Hook Handler (Cloudflare Pages Function)
 * ─────────────────────────────────────────────────────────────────────────────
 * Receives webhook POST when Supabase needs to dispatch an auth email.
 * Verifies standard-webhooks HMAC-SHA256 signature using the Web Crypto API.
 * Constructs the Supabase verify link and dispatches branded email via Resend API.
 */

// Helper: Timing-safe string comparison
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Helper: Decode base64 / base64url to Uint8Array (pure Web standards)
function base64ToUint8Array(base64: string): Uint8Array {
  // Normalize base64url characters and restore missing padding
  let normalized = base64.trim().replace(/-/g, '+').replace(/_/g, '/');
  const padMod = normalized.length % 4;
  if (padMod === 2) normalized += '==';
  else if (padMod === 3) normalized += '=';

  const binaryString = atob(normalized);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper: Convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Verifies standard-webhooks signature using Web Crypto API
async function verifyWebhookSignature(
  rawBody: string,
  headers: Headers,
  secretKey: string
): Promise<{ valid: boolean; reason?: string }> {
  const webhookId = headers.get('webhook-id') || headers.get('svix-id');
  const webhookTimestamp = headers.get('webhook-timestamp') || headers.get('svix-timestamp');
  const webhookSignature = headers.get('webhook-signature') || headers.get('svix-signature');

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return {
      valid: false,
      reason: `Missing standard webhook verification headers (id=${Boolean(webhookId)}, ts=${Boolean(webhookTimestamp)}, sig=${Boolean(webhookSignature)})`,
    };
  }

  // Reject requests older than 5 minutes (300 seconds) to prevent replay attacks
  const timestampNum = parseInt(webhookTimestamp, 10);
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (isNaN(timestampNum) || Math.abs(nowSeconds - timestampNum) > 300) {
    return {
      valid: false,
      reason: `Webhook timestamp is expired or invalid (received=${webhookTimestamp}, now=${nowSeconds})`,
    };
  }

  // Standard-webhooks secret starts with "v1,whsec_", "whsec_", or raw base64
  let cleanSecret = secretKey.trim();
  if (cleanSecret.startsWith('v1,whsec_')) {
    cleanSecret = cleanSecret.slice(9);
  } else if (cleanSecret.startsWith('whsec_')) {
    cleanSecret = cleanSecret.slice(6);
  }

  try {
    const keyBytes = base64ToUint8Array(cleanSecret);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signedPayload = `${webhookId}.${webhookTimestamp}.${rawBody}`;
    const encoder = new TextEncoder();
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(signedPayload));
    const computedSignatureBase64 = arrayBufferToBase64(signatureBuffer);

    // webhook-signature can contain multiple space-delimited signatures, e.g. "v1,signature1 v1,signature2"
    const signatures = webhookSignature.trim().split(/\s+/);
    let matched = false;
    for (const sig of signatures) {
      const commaIdx = sig.indexOf(',');
      const signatureToCompare = commaIdx !== -1 ? sig.slice(commaIdx + 1) : sig;
      if (timingSafeEqual(computedSignatureBase64, signatureToCompare)) {
        matched = true;
        break;
      }
    }

    if (!matched) {
      return { valid: false, reason: 'HMAC-SHA256 signature mismatch against SEND_EMAIL_HOOK_SECRET' };
    }

    return { valid: true };
  } catch (err: any) {
    return { valid: false, reason: `Signature verification error: ${err.message}` };
  }
}

// Generate branded HTML email templates
function buildEmailTemplate(params: {
  actionType: string;
  recipientEmail: string;
  recipientName: string;
  confirmLink: string;
  token?: string;
}): { subject: string; html: string; text: string } {
  const { actionType, recipientName, confirmLink, token } = params;

  let subject = 'Security notification from Scholario';
  let heading = 'Scholario LMS';
  let message = 'You requested an authentication action.';
  let buttonText = 'Continue';
  let showButton = true;
  let codeDisplay = '';

  switch (actionType) {
    case 'signup':
      subject = 'Verify your email for Scholario LMS';
      heading = 'Verify Your Email';
      message = `Hello ${recipientName || 'Student'}, thank you for signing up for Scholario LMS at SHS Virtual Academy. Please confirm your email address to activate your account.`;
      buttonText = 'Verify Email Address';
      break;

    case 'recovery':
      subject = 'Reset your Scholario password';
      heading = 'Reset Your Password';
      message = `Hello ${recipientName || 'Student'}, we received a request to reset the password for your Scholario LMS account. Click the button below to choose a new password.`;
      buttonText = 'Reset Password';
      break;

    case 'magiclink':
      subject = 'Your magic sign-in link for Scholario';
      heading = 'Sign In to Scholario';
      message = `Hello ${recipientName || 'Student'}, click the button below to instantly sign in to your Scholario account.`;
      buttonText = 'Sign In to Scholario';
      break;

    case 'email_change':
      subject = 'Confirm your new email address for Scholario';
      heading = 'Confirm Email Change';
      message = `Hello, please click below to confirm your new email address for your Scholario LMS account.`;
      buttonText = 'Confirm New Email';
      break;

    case 'invite':
      subject = 'You have been invited to Scholario LMS';
      heading = 'Welcome to Scholario';
      message = `Hello ${recipientName || 'Student'}, you have been invited to join Scholario LMS at SHS Virtual Academy. Click below to accept the invitation and set up your account.`;
      buttonText = 'Accept Invitation';
      break;

    case 'reauthentication':
      subject = `Your verification code: ${token || ''}`;
      heading = 'Verification Code';
      message = `Your 6-digit verification code is shown below. This code will expire in 10 minutes.`;
      showButton = false;
      codeDisplay = token || '';
      break;

    default:
      subject = 'Scholario LMS notification';
      heading = 'Authentication Notification';
      message = `Please click the button below to proceed with your authentication request.`;
      buttonText = 'Confirm Request';
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0d0d0d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e5e5e5; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0d0d0d; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #141416; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);">
          
          <!-- Header Banner with Brand Gold Accent -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background-color: rgba(244, 196, 48, 0.15); border: 1px solid rgba(244, 196, 48, 0.3); border-radius: 10px; padding: 6px 14px; margin-bottom: 16px;">
                      <span style="color: #F4C430; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">SCHOLARIO LMS</span>
                    </div>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">${heading}</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 32px 28px 32px;">
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #cccccc;">
                ${message}
              </p>

              ${
                showButton
                  ? `
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${confirmLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #F4C430 0%, #D4A017 100%); color: #111111; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(244, 196, 48, 0.35); text-align: center; letter-spacing: 0.2px;">
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Plain Link Fallback -->
              <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 10px; padding: 12px; margin-top: 24px; word-break: break-all;">
                <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: bold; color: #888888; text-transform: uppercase; letter-spacing: 0.5px;">Button not working? Copy and paste this link:</p>
                <a href="${confirmLink}" style="font-size: 11px; color: #F4C430; text-decoration: underline; line-height: 1.4;">${confirmLink}</a>
              </div>
              `
                  : ''
              }

              ${
                codeDisplay
                  ? `
              <!-- 6-digit Code Display -->
              <div style="background-color: rgba(244, 196, 48, 0.08); border: 1px solid rgba(244, 196, 48, 0.25); border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #F4C430; font-family: monospace;">${codeDisplay}</span>
              </div>
              `
                  : ''
              }

              <!-- Security Notice -->
              <p style="margin: 28px 0 0 0; font-size: 12px; line-height: 1.5; color: #777777; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 20px;">
                ⏱ <strong>Security Notice:</strong> This link is single-use and will expire in 24 hours. If you did not make this request, you can safely ignore this email; your account remains secure.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0f0f11; border-top: 1px solid rgba(255, 255, 255, 0.04); text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: bold; color: #888888;">
                SHS Virtual Academy · Scholario LMS
              </p>
              <p style="margin: 0; font-size: 11px; color: #555555; line-height: 1.4;">
                Rawalpindi, Pakistan · A private learning hub for serious academic success.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
${heading}
========================================

${message}

${showButton ? `Link: ${confirmLink}\n\n` : ''}${codeDisplay ? `Verification Code: ${codeDisplay}\n\n` : ''}
This link expires in 24 hours. If you did not request this email, you can safely ignore it.

--
Scholario LMS · SHS Virtual Academy
Rawalpindi, Pakistan
  `.trim();

  return { subject, html, text };
}

export async function onRequestPost(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env } = context;

  // 1. Read raw body text for signature verification
  let rawBody = '';
  try {
    rawBody = await request.text();
  } catch (err: any) {
    console.error('[Supabase Send Email Hook] Failed to read raw request body:', err?.message || err);
    return new Response(
      JSON.stringify({ error: { http_code: 400, message: 'Invalid request body' } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 2. Verify signature if SEND_EMAIL_HOOK_SECRET is configured
  const hookSecret = env.SEND_EMAIL_HOOK_SECRET;
  if (hookSecret) {
    const verification = await verifyWebhookSignature(rawBody, request.headers, hookSecret);
    if (!verification.valid) {
      console.error('[Supabase Send Email Hook] Signature verification failed:', verification.reason);
      return new Response(
        JSON.stringify({
          error: { http_code: 401, message: `Unauthorized: Invalid webhook signature (${verification.reason})` },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } else {
    console.warn('[Supabase Send Email Hook] SEND_EMAIL_HOOK_SECRET is not set; skipping signature check.');
  }

  // 3. Parse JSON payload
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch (err: any) {
    console.error('[Supabase Send Email Hook] Failed to parse JSON payload:', err?.message || err);
    return new Response(
      JSON.stringify({ error: { http_code: 400, message: 'Invalid JSON payload' } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { user, email_data } = payload || {};
  if (!user || !user.email || !email_data) {
    console.error('[Supabase Send Email Hook] Missing user or email_data in hook payload:', {
      hasUser: Boolean(user),
      hasEmail: Boolean(user?.email),
      hasEmailData: Boolean(email_data),
    });
    return new Response(
      JSON.stringify({ error: { http_code: 400, message: 'Missing user or email_data in hook payload' } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 4. Extract parameters and build verification link
  const recipientEmail = (user.email as string).trim().toLowerCase();
  const recipientName = user.user_metadata?.full_name || '';
  const actionType = (email_data.email_action_type || 'signup').trim();
  const tokenHash = email_data.token_hash || '';
  const token = email_data.token || '';

  const siteOrigin = (email_data.site_url || env.PUBLIC_DOMAIN || 'https://shsvirtualacademy.pro').replace(/\/+$/, '');
  let redirectTo = (email_data.redirect_to || '').trim();

  // For password recovery, ensure redirect_to lands on /reset-password
  if (actionType === 'recovery') {
    if (!redirectTo || redirectTo.replace(/\/+$/, '') === siteOrigin) {
      redirectTo = `${siteOrigin}/reset-password`;
    }
  } else if (!redirectTo) {
    redirectTo = siteOrigin;
  }

  // Resolve Supabase project URL for the /auth/v1/verify link
  const supabaseUrl = (
    env.SUPABASE_URL ||
    env.VITE_SUPABASE_URL ||
    (env as any).VITE_DATABASE_URL ||
    (env as any).DATABASE_URL ||
    ''
  ).replace(/\/+$/, '');

  if (!supabaseUrl && actionType !== 'reauthentication') {
    console.error(
      '[Supabase Send Email Hook] Missing SUPABASE_URL / VITE_SUPABASE_URL environment variable on Cloudflare; cannot construct /auth/v1/verify URL.'
    );
    return new Response(
      JSON.stringify({
        error: {
          http_code: 500,
          message: 'SUPABASE_URL or VITE_SUPABASE_URL is not configured in Cloudflare environment variables.',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const confirmLink = `${supabaseUrl}/auth/v1/verify?token=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(actionType)}&redirect_to=${encodeURIComponent(redirectTo)}`;

  // 5. Generate template
  const { subject, html, text } = buildEmailTemplate({
    actionType,
    recipientEmail,
    recipientName,
    confirmLink,
    token,
  });

  // 6. Send via Resend REST API
  const resendApiKey = env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error('[Supabase Send Email Hook] RESEND_API_KEY environment variable is not configured.');
    return new Response(
      JSON.stringify({ error: { http_code: 500, message: 'Resend API service is not configured on Cloudflare.' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const resendFrom = env.RESEND_FROM || 'Scholario <no-reply@shsvirtualacademy.pro>';

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [recipientEmail],
        subject,
        html,
        text,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error(
        `[Supabase Send Email Hook] Resend API failure (action=${actionType}, to=${recipientEmail}, from=${resendFrom}, status=${resendRes.status}):`,
        errBody
      );
      return new Response(
        JSON.stringify({
          error: {
            http_code: resendRes.status,
            message: `Failed to deliver email through Resend (${resendRes.status}): ${errBody}`,
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Supabase Send Email Hook] Dispatched '${actionType}' email to ${recipientEmail} via Resend.`);

    // Success response: Supabase Auth Hook expects HTTP 200 with an empty JSON object `{}`
    return new Response('{}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[Supabase Send Email Hook] Exception sending email via Resend:', err?.message || err);
    return new Response(
      JSON.stringify({ error: { http_code: 500, message: 'Internal error delivering auth email' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
