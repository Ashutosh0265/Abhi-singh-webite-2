/**
 * Transactional Email Delivery Service for Digital Products (E.L.R.x Store)
 * Handles instant delivery of PDF download links and receipts via Resend or Serverless API
 */
import { getApiSettings } from './settings.js';

const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

/**
 * Generate clean, responsive HTML email template for product deliverable
 */
export function buildProductDeliveryEmailHtml({
  customerName,
  productName,
  orderId,
  paymentId,
  amount,
  currency = 'INR',
  downloadUrl,
}) {
  const formattedPrice = amount === 0 ? 'Free Download' : `₹${amount} ${currency}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Free E.L.R.x PDF — ${productName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F6F6F4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #212121; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F6F6F4; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #FFFFFF; border: 2px solid #212121; border-radius: 6px; box-shadow: 4px 4px 0 #FFE36E; overflow: hidden;">
          
          <!-- Header Banner -->
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
                Hi ${customerName || 'Friend'},
              </p>
              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 12px 0; color: #374151;">
                Welcome to the E.L.R.x community!
              </p>
              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px 0; color: #374151;">
                Your free digital guide is ready.
              </p>

              <!-- Order Summary Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFDF0; border: 1.5px solid #212121; border-radius: 4px; padding: 18px 20px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <div style="font-family: Georgia, serif; font-size: 18px; font-weight: 700; color: #212121; margin-bottom: 4px;">
                      ${productName}
                    </div>
                    <div style="font-size: 13px; color: #4B5563; margin-bottom: 4px;">
                      Price: <strong>${formattedPrice}</strong>
                    </div>
                    ${paymentId ? `
                    <div style="font-size: 13px; color: #4B5563;">
                      Payment Reference: <code style="font-size: 12px; background: #E5E7EB; padding: 2px 5px; border-radius: 2px;">${paymentId}</code>
                    </div>` : ''}
                  </td>
                </tr>
              </table>

              <p style="font-size: 15px; line-height: 1.6; color: #374151; margin: 0 0 24px 0;">
                We've attached your PDF to this email so you can download it and keep it for future reference.
              </p>

              <!-- Call to Action Button -->
              <div style="text-align: center; margin: 28px 0 26px 0;">
                <a href="${downloadUrl}" target="_blank" rel="noopener noreferrer" style="background-color: #FF6500; color: #FFFFFF; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 34px; border-radius: 4px; border: 1.5px solid #212121; box-shadow: 2.5px 2.5px 0 #212121; display: inline-block; letter-spacing: 0.02em;">
                  Download Your PDF &rarr;
                </a>
              </div>

              <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 28px 0 24px 0;" />

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

          <!-- Footer -->
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
}

/**
 * Dispatch digital product delivery email to customer
 */
export async function sendProductDeliveryEmail({
  orderId,
  customerName,
  customerEmail,
  product,
  paymentId,
  amount,
  currency = 'INR',
}) {
  const cleanEmail = (customerEmail || '').trim();
  const cleanName = (customerName || '').trim() || cleanEmail.split('@')[0];
  const productName = product.name || product.title || 'Digital Training Program';

  // Determine absolute download link
  let downloadUrl = product.fileUrl || product.file_url || product.downloadUrl || '';
  if (downloadUrl.startsWith('/')) {
    if (typeof window !== 'undefined') {
      downloadUrl = `${window.location.origin}${downloadUrl}`;
    } else {
      downloadUrl = `https://abhisingh-website.vercel.app${downloadUrl}`;
    }
  }

  const htmlBody = buildProductDeliveryEmailHtml({
    customerName: cleanName,
    productName,
    orderId,
    paymentId,
    amount,
    currency,
    downloadUrl,
  });

  const settings = getApiSettings(false);
  const resendApiKey = settings?.resendApiKey || metaEnv.VITE_RESEND_API_KEY || '';

  // 1. If valid Resend API key is present, attempt live dispatch
  if (resendApiKey && resendApiKey.startsWith('re_')) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Abhi Singh – E.L.R.x <onboarding@resend.dev>',
          to: [cleanEmail],
          subject: `Your Free E.L.R.x PDF — ${productName}`,
          html: htmlBody,
        }),
      });

      if (response.ok) {
        const resData = await response.json();
        return {
          success: true,
          messageId: resData.id || `msg_${Date.now()}`,
          provider: 'resend',
          deliveryStatus: 'PROVIDER_ACCEPTED',
          statusLabel: 'Email accepted by provider',
          timestamp: new Date().toISOString(),
          downloadUrl,
        };
      } else {
        const errJson = await response.json().catch(() => ({}));
        console.warn('[EmailDelivery] Resend API rejected dispatch:', errJson);
        return {
          success: false,
          deliveryStatus: 'FAILED',
          statusLabel: 'Email delivery failed',
          error: errJson.message || `Resend rejected with status ${response.status}`,
          timestamp: new Date().toISOString(),
          downloadUrl,
        };
      }
    } catch (netErr) {
      console.warn('[EmailDelivery] Network exception connecting to Resend:', netErr);
      return {
        success: false,
        deliveryStatus: 'FAILED',
        statusLabel: 'Email delivery failed',
        error: netErr.message,
        timestamp: new Date().toISOString(),
        downloadUrl,
      };
    }
  }

  // 2. Unconfigured credentials: DO NOT fabricate success
  console.warn('[EmailDelivery] Outgoing delivery not attempted: No live email API key configured.');
  return {
    success: false,
    deliveryStatus: 'FAILED',
    statusLabel: 'Email delivery unconfigured',
    error: 'Email service credentials not configured. Please configure SMTP or Resend API key.',
    timestamp: new Date().toISOString(),
    downloadUrl,
  };
}
