import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESEND_API_URL = 'https://api.resend.com/emails';

/**
 * Escape HTML special characters to prevent HTML injection in customer emails
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 1. Free Product Delivery Email (HTML & Plaintext)
 * Conforms strictly to E.L.R.x brand identity and requested structure:
 * - Brand orange #FF6500, yellow accent #FFE36E, dark typography #212121
 * - Exact greeting, intro, attachment statement, CTA, and Abhi Singh signature
 */
export function buildFreeDeliveryEmail({
  customerName,
  productName,
  productDescription = '',
  downloadUrl,
  fileName = 'guide.pdf',
  hasAttachment = true,
}) {
  const safeName = escapeHtml(customerName || 'Friend');
  const safeProduct = escapeHtml(productName || 'Habits for Physical and Mental Strength');
  const safeDescription = escapeHtml(
    productDescription ||
      'A practical primer on physical discipline, habit architecture, and mental resilience designed specifically for corporate professionals.'
  );

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Free E.L.R.x PDF — ${safeProduct}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F6F6F4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #212121; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F6F6F4; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #FFFFFF; border: 2px solid #212121; border-radius: 6px; box-shadow: 4px 4px 0 #FFE36E; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #121417; padding: 26px 32px; border-bottom: 2px solid #212121;">
              <span style="background-color: #FF6500; color: #FFFFFF; font-size: 11px; font-weight: 800; letter-spacing: 0.1em; padding: 4px 8px; border-radius: 3px; text-transform: uppercase;">
                E.L.R.x
              </span>
              <h1 style="color: #FFFFFF; font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 700; margin: 12px 0 0 0; letter-spacing: 0.02em;">
                Eat. Lift. Run. x
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; font-weight: 600; color: #212121;">
                Hi ${safeName},
              </p>

              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 12px 0; color: #374151;">
                Welcome to the E.L.R.x community!
              </p>

              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px 0; color: #374151;">
                Your free digital guide is ready.
              </p>

              <!-- Product Details Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFDF0; border: 1.5px solid #212121; border-radius: 4px; padding: 20px; margin: 18px 0 24px 0;">
                <tr>
                  <td>
                    <div style="font-family: Georgia, serif; font-size: 18px; font-weight: 700; color: #212121; margin-bottom: 6px;">
                      ${safeProduct}
                    </div>
                    <div style="font-size: 14px; line-height: 1.5; color: #4B5563;">
                      ${safeDescription}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Delivery Statement -->
              <p style="font-size: 15px; line-height: 1.6; color: #374151; margin: 0 0 24px 0;">
                We've attached your PDF to this email so you can download it and keep it for future reference.
              </p>

              <!-- Download CTA Button -->
              <div style="text-align: center; margin: 28px 0 26px 0;">
                <a href="${downloadUrl}" target="_blank" rel="noopener noreferrer" style="background-color: #FF6500; color: #FFFFFF; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 34px; border-radius: 4px; border: 1.5px solid #212121; box-shadow: 2.5px 2.5px 0 #212121; display: inline-block; letter-spacing: 0.02em;">
                  Download Your PDF &rarr;
                </a>
              </div>

              ${hasAttachment ? `
              <p style="font-size: 13px; color: #6B7280; text-align: center; margin: 0 0 28px 0;">
                📎 <em>Attachment included: <strong>${escapeHtml(fileName)}</strong></em>
              </p>` : ''}

              <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 28px 0 24px 0;" />

              <!-- Sign-off & Footer -->
              <p style="font-size: 14px; line-height: 1.5; color: #6B7280; margin: 0 0 2px 0;">
                Eat. Lift. Run. x
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #121417; margin: 0 0 16px 0; font-weight: 700;">
                Abhi Singh
              </p>
              <p style="font-size: 13px; line-height: 1.6; color: #6B7280; margin: 0;">
                Thank you for being part of the E.L.R.x community.<br />
                Website: <a href="https://abhisingh.me" style="color: #FF6500; text-decoration: none; font-weight: 600;">https://abhisingh.me</a>
              </p>
            </td>
          </tr>

          <!-- Subtle Copyright Strip -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 16px 32px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #9CA3AF; text-align: center;">
              &copy; ${new Date().getFullYear()} Abhi Singh &middot; E.L.R.x &middot; Bangalore, India
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
Hi ${customerName || 'Friend'},

Welcome to the E.L.R.x community!

Your free digital guide is ready.

${productName}
${productDescription || ''}

We've attached your PDF to this email so you can download it and keep it for future reference.

Download Your PDF:
${downloadUrl}

${hasAttachment ? `[Attachment: ${fileName}]` : ''}

Eat. Lift. Run. x

Abhi Singh

Thank you for being part of the E.L.R.x community.
Website: https://abhisingh.me
  `.trim();

  return { html, text };
}

/**
 * 2. Paid Product Delivery Email (HTML & Plaintext)
 * Conforms strictly to E.L.R.x brand identity and requested structure.
 */
export function buildPaidDeliveryEmail({
  customerName,
  productName,
  productDescription = '',
  orderId,
  paymentId,
  amount,
  currency = 'INR',
  downloadUrl,
  fileName = 'guide.pdf',
  hasAttachment = true,
}) {
  const safeName = escapeHtml(customerName || 'Friend');
  const safeProduct = escapeHtml(productName);
  const safeDescription = escapeHtml(
    productDescription ||
      '24 tactical, evidence-based basics covering exercise science, sleep optimization, protein synthesis, and joint durability.'
  );
  const formattedPrice = `₹${amount} ${currency}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmed — Your E.L.R.x PDF Is Ready</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F6F6F4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #212121; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F6F6F4; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #FFFFFF; border: 2px solid #212121; border-radius: 6px; box-shadow: 4px 4px 0 #FFE36E; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #121417; padding: 26px 32px; border-bottom: 2px solid #212121;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="background-color: #FF6500; color: #FFFFFF; font-size: 11px; font-weight: 800; letter-spacing: 0.1em; padding: 4px 8px; border-radius: 3px; text-transform: uppercase;">
                      E.L.R.x
                    </span>
                    <h1 style="color: #FFFFFF; font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 700; margin: 12px 0 0 0; letter-spacing: 0.02em;">
                      Eat. Lift. Run. x
                    </h1>
                  </td>
                  <td align="right" style="color: #9CA3AF; font-size: 12px; vertical-align: bottom;">
                    Order #${escapeHtml(orderId)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <div style="font-size: 12px; font-weight: 800; color: #10B981; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">
                ✓ Payment Confirmed
              </div>

              <h2 style="font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: 700; margin: 0 0 18px 0; color: #121417; line-height: 1.25;">
                Thank you for your purchase!
              </h2>

              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; font-weight: 600; color: #212121;">
                Hi ${safeName},
              </p>

              <!-- Product Details Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFDF0; border: 1.5px solid #212121; border-radius: 4px; padding: 20px; margin: 20px 0 24px 0;">
                <tr>
                  <td>
                    <div style="font-family: Georgia, serif; font-size: 18px; font-weight: 700; color: #212121; margin-bottom: 4px;">
                      ${safeProduct}
                    </div>
                    <div style="font-size: 14px; line-height: 1.5; color: #4B5563; margin-bottom: 12px;">
                      ${safeDescription}
                    </div>
                    <div style="font-size: 13px; color: #374151;">
                      <strong>Amount Paid:</strong> ${formattedPrice} &middot; <strong>Transaction Ref:</strong> <code style="font-size: 12px; background: #E5E7EB; padding: 2px 6px; border-radius: 3px;">${escapeHtml(paymentId)}</code>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Delivery Section -->
              <p style="font-size: 15px; line-height: 1.6; color: #374151; margin: 0 0 24px 0;">
                We've attached your PDF to this email so you can download it and keep it for future reference.
              </p>

              <!-- Download CTA Button (Tokenized Secure Access Link) -->
              <div style="text-align: center; margin: 30px 0 26px 0;">
                <a href="${downloadUrl}" target="_blank" rel="noopener noreferrer" style="background-color: #FF6500; color: #FFFFFF; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 34px; border-radius: 4px; border: 1.5px solid #212121; box-shadow: 2.5px 2.5px 0 #212121; display: inline-block; letter-spacing: 0.02em;">
                  Download Your PDF &rarr;
                </a>
              </div>

              ${hasAttachment ? `
              <p style="font-size: 13px; color: #6B7280; text-align: center; margin: 0 0 28px 0;">
                📎 <em>Attachment included: <strong>${escapeHtml(fileName)}</strong></em>
              </p>` : ''}

              <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 28px 0 24px 0;" />

              <!-- Footer -->
              <p style="font-size: 14px; line-height: 1.5; color: #6B7280; margin: 0 0 2px 0;">
                Eat. Lift. Run. x
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #121417; margin: 0 0 16px 0; font-weight: 700;">
                Abhi Singh
              </p>
              <p style="font-size: 13px; line-height: 1.6; color: #6B7280; margin: 0;">
                Thank you for being part of the E.L.R.x community.<br />
                Website: <a href="https://abhisingh.me" style="color: #FF6500; text-decoration: none; font-weight: 600;">https://abhisingh.me</a>
              </p>
            </td>
          </tr>

          <!-- Subtle Copyright Strip -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 16px 32px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #9CA3AF; text-align: center;">
              &copy; ${new Date().getFullYear()} Abhi Singh &middot; E.L.R.x &middot; Bangalore, India
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
Hi ${customerName || 'Friend'},

Thank you for your purchase!

${productName}
${productDescription || ''}

Amount Paid: ${formattedPrice}
Payment Reference: ${paymentId}
Order ID: ${orderId}

We've attached your PDF to this email so you can download it and keep it for future reference.

Download Your PDF:
${downloadUrl}

${hasAttachment ? `[Attachment: ${fileName}]` : ''}

Eat. Lift. Run. x

Abhi Singh

Thank you for being part of the E.L.R.x community.
Website: https://abhisingh.me
  `.trim();

  return { html, text };
}

/**
 * 3. Administrative Delivery Failure Alert Email
 */
export function buildAdminFailureAlertEmail({ orderId, customerEmail, productName, errorMessage }) {
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
  <h2 style="color: #DC2626;">⚠️ E.L.R.x Delivery Alert: PDF Dispatch Failed</h2>
  <p>An automated PDF delivery failed to reach a customer.</p>
  <ul>
    <li><strong>Order ID:</strong> ${escapeHtml(orderId)}</li>
    <li><strong>Customer Email:</strong> ${escapeHtml(customerEmail)}</li>
    <li><strong>Product:</strong> ${escapeHtml(productName)}</li>
    <li><strong>Error Message:</strong> ${escapeHtml(errorMessage)}</li>
    <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
  </ul>
  <p>Please log in to the E.L.R.x Admin Dashboard and trigger a manual resend after verifying email credentials.</p>
</body>
</html>
  `.trim();

  const text = `ALERT: Delivery failed for Order #${orderId} (${customerEmail}, Product: ${productName}). Error: ${errorMessage}`;
  return { html, text };
}

/**
 * High-Reliability Dispatcher supporting SMTP (Zoho / Generic) and Resend API
 * Returns distinct delivery states:
 * - PROVIDER_ACCEPTED: Provider accepted message for queueing/relay
 * - FAILED: Provider rejected, missing credentials, or socket error
 * 
 * NEVER returns fake success when credentials are missing!
 */
export async function sendTransactionalEmail({
  to,
  subject,
  html,
  text,
  pdfFilePath,
  productName,
  orderId,
  allowMock = false,
}) {
  const smtpHost = process.env.SMTP_HOST || '';
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpUser = process.env.SMTP_USER || '';
  const smtpPass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '';
  const fromName = process.env.EMAIL_FROM_NAME || 'Abhi Singh | E.L.R.x';
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || smtpUser || 'abhi@abhisingh.me';
  const fromHeader = `"${fromName}" <${fromAddress}>`;

  const resendApiKey = process.env.RESEND_API_KEY || '';

  // 1. Prepare attachments if physical PDF exists on disk and is under 10MB
  let attachmentInfo = null;
  if (pdfFilePath) {
    try {
      const cleanRelPath = pdfFilePath.replace(/^[/\\]+/, '');
      const candidates = [
        path.resolve(process.cwd(), 'public', cleanRelPath),
        path.resolve(process.cwd(), cleanRelPath),
        path.resolve(__dirname, '../../public', cleanRelPath),
        pdfFilePath,
      ];
      const fullPath = candidates.find((p) => fs.existsSync(p));

      if (fullPath) {
        const stats = fs.statSync(fullPath);
        if (stats.size <= 10 * 1024 * 1024) {
          const fileBuffer = fs.readFileSync(fullPath);
          attachmentInfo = {
            filename: path.basename(fullPath),
            path: fullPath,
            buffer: fileBuffer,
            size: stats.size,
          };
        } else {
          console.warn(`[Email] Attachment skipped: file size ${stats.size} exceeds 10MB limit`);
        }
      } else {
        console.warn(`[Email] PDF file not found at any candidate path for ${pdfFilePath}`);
      }
    } catch (attErr) {
      console.warn('[Email] Attachment inspection warning:', attErr.message);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // OPTION A: SMTP DISPATCH (Zoho Mail / Generic SMTP)
  // ─────────────────────────────────────────────────────────────
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const isSecure = smtpPort === 465 || process.env.SMTP_SECURE === 'true';
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: isSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        },
      });

      const mailOptions = {
        from: fromHeader,
        to,
        subject,
        html,
        text,
      };

      if (attachmentInfo) {
        mailOptions.attachments = [
          {
            filename: attachmentInfo.filename,
            path: attachmentInfo.path,
            contentType: 'application/pdf',
          },
        ];
      }

      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email:SMTP] Accepted by provider for ${to} (MessageID: ${info.messageId})`);
      return {
        success: true,
        status: 'PROVIDER_ACCEPTED',
        messageId: info.messageId,
        provider: 'smtp',
        hasAttachment: Boolean(attachmentInfo),
        attachmentInfo: attachmentInfo ? { filename: attachmentInfo.filename, size: attachmentInfo.size } : null,
        response: info.response || '250 OK',
      };
    } catch (smtpErr) {
      console.error('[Email:SMTP] Delivery failure:', smtpErr.message);
      return {
        success: false,
        status: 'FAILED',
        provider: 'smtp',
        error: smtpErr.message,
        hasAttachment: Boolean(attachmentInfo),
        attachmentInfo: attachmentInfo ? { filename: attachmentInfo.filename, size: attachmentInfo.size } : null,
      };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // OPTION B: RESEND API DISPATCH
  // ─────────────────────────────────────────────────────────────
  if (resendApiKey && resendApiKey.startsWith('re_')) {
    try {
      const payload = {
        from: process.env.FROM_EMAIL || `Abhi Singh | E.L.R.x <${fromAddress}>`,
        to: [to],
        subject,
        html,
        text,
      };

      if (attachmentInfo) {
        payload.attachments = [
          {
            filename: attachmentInfo.filename,
            content: attachmentInfo.buffer.toString('base64'),
          },
        ];
      }

      const res = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[Email:Resend] Accepted by provider for ${to} (ID: ${data.id})`);
        return {
          success: true,
          status: 'PROVIDER_ACCEPTED',
          messageId: data.id || `resend_${Date.now()}`,
          provider: 'resend',
          hasAttachment: Boolean(attachmentInfo),
          attachmentInfo: attachmentInfo ? { filename: attachmentInfo.filename, size: attachmentInfo.size } : null,
          response: data,
        };
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.error('[Email:Resend] API rejected dispatch:', errJson);
        return {
          success: false,
          status: 'FAILED',
          provider: 'resend',
          error: errJson.message || `Resend error status ${res.status}`,
          hasAttachment: Boolean(attachmentInfo),
          attachmentInfo: attachmentInfo ? { filename: attachmentInfo.filename, size: attachmentInfo.size } : null,
        };
      }
    } catch (resendErr) {
      console.error('[Email:Resend] Network error connecting to Resend:', resendErr.message);
      return {
        success: false,
        status: 'FAILED',
        provider: 'resend',
        error: resendErr.message,
        hasAttachment: Boolean(attachmentInfo),
        attachmentInfo: attachmentInfo ? { filename: attachmentInfo.filename, size: attachmentInfo.size } : null,
      };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // OPTION C: EXPLICIT MOCK TESTING ONLY (for isolated CI tests)
  // Activated ONLY when allowMock is true or ALLOW_EMAIL_MOCK_TEST is enabled.
  // In standard runtime without credentials, it ALWAYS fails honestly.
  // ─────────────────────────────────────────────────────────────
  if (allowMock || process.env.ALLOW_EMAIL_MOCK_TEST === 'true') {
    const mockId = `mock_dispatch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    console.log(`[Email:Mock] Test mock accepted for ${to} | ID: ${mockId}`);
    return {
      success: true,
      status: 'PROVIDER_ACCEPTED',
      messageId: mockId,
      provider: 'test_mock_provider',
      hasAttachment: Boolean(attachmentInfo),
      attachmentInfo: attachmentInfo ? { filename: attachmentInfo.filename, size: attachmentInfo.size } : null,
      response: 'Mock Test Delivery Accepted',
    };
  }

  // ─────────────────────────────────────────────────────────────
  // OPTION D: UNCONFIGURED CREDENTIALS (CRITICAL BUG ROOT CAUSE FIX)
  // DO NOT fabricate success. Honestly report that credentials are missing.
  // ─────────────────────────────────────────────────────────────
  const missingError = 'Email delivery credentials are not configured on the server. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD (or RESEND_API_KEY) in environment variables.';
  console.warn(`[Email:Unconfigured] Outgoing dispatch to ${to} blocked: ${missingError}`);
  return {
    success: false,
    status: 'FAILED',
    provider: 'unconfigured',
    error: missingError,
    hasAttachment: Boolean(attachmentInfo),
    attachmentInfo: attachmentInfo ? { filename: attachmentInfo.filename, size: attachmentInfo.size } : null,
  };
}
