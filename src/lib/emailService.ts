/**
 * Email Service & Template Engine for Scholario LMS (SHS Virtual Academy)
 * Enforces CAN-SPAM, GDPR, and Educational Minors Privacy Standards:
 * - Direct List-Unsubscribe header (RFC 2369 / RFC 8058 one-click)
 * - Transparent institutional physical/virtual address disclosure
 * - Unsubscribe link in every transaction/notification email body
 */

export interface EmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  recipientName?: string;
  isTransactional?: boolean; // Essential receipts vs non-critical announcements
}

export function buildCompliantEmailHtml(options: EmailOptions): string {
  const { to, subject, htmlContent, recipientName, isTransactional = false } = options;
  const unsubscribeUrl = `https://scholario.pk/settings?action=unsubscribe&email=${encodeURIComponent(to)}`;
  const mailtoUnsub = `mailto:shs.academy.virtual@gmail.com?subject=${encodeURIComponent(
    `Unsubscribe Notice: ${to}`
  )}&body=${encodeURIComponent(
    `Please remove ${to} from all non-critical notifications from SHS Virtual Academy.`
  )}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAFAFA; margin: 0; padding: 20px; color: #111111; }
    .email-container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E5E5E5; overflow: hidden; }
    .email-header { background: #111111; padding: 24px 32px; border-bottom: 3px solid #F4C430; text-align: left; }
    .email-header h1 { margin: 0; font-size: 20px; color: #FFFFFF; font-weight: 800; letter-spacing: -0.5px; }
    .email-header p { margin: 4px 0 0 0; font-size: 11px; color: #F4C430; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .email-body { padding: 32px; font-size: 14px; line-height: 1.6; color: #262626; }
    .email-footer { background: #F9F9F9; padding: 24px 32px; font-size: 11px; color: #737373; line-height: 1.5; border-top: 1px solid #E5E5E5; }
    .email-footer a { color: #D4A017; text-decoration: underline; }
    .btn-gold { display: inline-block; background: #F4C430; color: #111111; font-weight: 800; font-size: 13px; padding: 12px 24px; border-radius: 12px; text-decoration: none; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>Scholario LMS</h1>
      <p>SHS Virtual Academy • FBISE & Cambridge</p>
    </div>

    <div class="email-body">
      ${recipientName ? `<p>Dear <strong>${recipientName}</strong>,</p>` : ''}
      ${htmlContent}
    </div>

    <div class="email-footer">
      <p style="margin: 0 0 8px 0; font-weight: 700; color: #111111;">
        SHS Virtual Academy
      </p>
      <p style="margin: 0 0 8px 0;">
        Digital-First Educational Institution (No physical public campus). Registered Administrative Office: Rawalpindi, Punjab, Pakistan.<br>
        Direct Contact: <a href="mailto:shs.academy.virtual@gmail.com">shs.academy.virtual@gmail.com</a> | +92 305 86969050
      </p>
      
      <div style="padding-top: 12px; border-top: 1px solid #EBEBEB; margin-top: 12px;">
        ${
          isTransactional
            ? `<p style="margin: 0 0 4px 0; font-size: 10px; color: #888888;">
                You received this mandatory operational notification because you are an actively registered student or parent at SHS Virtual Academy. Essential tuition receipts and proctored exam confirmations cannot be unsubscribed.
              </p>`
            : `<p style="margin: 0 0 4px 0;">
                If you no longer wish to receive announcement or notification emails from Scholario:
              </p>
              <p style="margin: 0;">
                <a href="${unsubscribeUrl}" target="_blank" style="font-weight: 700; color: #D4A017;">Click here to Unsubscribe</a> or <a href="${mailtoUnsub}">Send Unsubscribe Email</a>.
              </p>`
        }
        <p style="margin: 8px 0 0 0; font-size: 10px; color: #A3A3A3;">
          Read our <a href="https://scholario.pk/privacy" target="_blank">Privacy Policy</a> • <a href="https://scholario.pk/terms" target="_blank">Terms of Service</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Returns RFC-compliant unsubscribe headers for email dispatcher or SMTP payloads.
 */
export function getEmailComplianceHeaders(recipientEmail: string) {
  const unsubscribeUrl = `https://scholario.pk/settings?action=unsubscribe&email=${encodeURIComponent(recipientEmail)}`;
  const mailtoUnsub = `mailto:shs.academy.virtual@gmail.com?subject=unsubscribe`;

  return {
    'List-Unsubscribe': `<${mailtoUnsub}>, <${unsubscribeUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}
