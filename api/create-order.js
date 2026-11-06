import { getProductById, hasValidPdfDeliverable, inrToUsd } from './_lib/products.js';
import { createOrderRecord, updateOrderRecord, addDeliveryLog, DELIVERY_STATUSES } from './_lib/orders.js';
import { generateDownloadToken } from './_lib/tokens.js';
import { buildFreeDeliveryEmail, sendTransactionalEmail } from './_lib/email.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      productId,
      customerName,
      customerEmail,
      paymentGateway = 'razorpay',
      isTestMode = false,
      utmSource = 'direct',
      utmMedium = 'web',
      utmCampaign = 'elrx_store',
      region = 'India',
    } = req.body || {};

    // 1. Validate customer information
    const cleanName = (customerName || '').trim();
    const cleanEmail = (customerEmail || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanName) {
      return res.status(400).json({ error: 'Full Name is required.' });
    }
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'A valid email address is required (e.g. name@example.com).' });
    }

    // 2. Validate product against authoritative server catalog
    const product = getProductById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found in store catalog.' });
    }

    // 3. Prevent checkout if PDF deliverable is missing
    if (!hasValidPdfDeliverable(product)) {
      return res.status(400).json({
        error: 'This PDF deliverable is currently being prepared. Orders will open shortly.',
        code: 'PDF_DELIVERABLE_MISSING',
      });
    }

    const host = req.headers.host || 'abhisingh-website.vercel.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // ─────────────────────────────────────────────────────────────
    // FLOW 1: FREE DIGITAL PRODUCT DOWNLOAD & EMAIL DISPATCH
    // ─────────────────────────────────────────────────────────────
    if (product.is_free || product.priceAmount === 0) {
      const order = createOrderRecord({
        customer_name: cleanName,
        customer_email: cleanEmail,
        product_id: product.id,
        product_name: product.name,
        product_price: 0,
        currency: 'INR',
        product_type: 'FREE',
        payment_gateway: 'free',
        payment_status: 'FREE',
        gateway_payment_reference: 'free_instant_access',
        delivery_status: DELIVERY_STATUSES.PROCESSING,
        email_status: DELIVERY_STATUSES.PROCESSING,
        pdf_url: product.file_url,
        file_name: product.file_name,
        is_test: Boolean(isTestMode),
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        region,
      });

      // Generate secure HMAC-signed download token
      const { token } = generateDownloadToken(order.id, { productId: product.id, status: 'FREE' });
      const fileName = product.file_name || (product.file_url ? product.file_url.split('/').pop() : 'guide.pdf');
      const downloadPath = `/api/download-pdf?orderId=${encodeURIComponent(order.id)}&token=${encodeURIComponent(token)}&file=${encodeURIComponent(fileName)}`;
      const absoluteDownloadUrl = `${baseUrl}${downloadPath}`;

      // Build brand-aligned transactional email
      const { html, text } = buildFreeDeliveryEmail({
        customerName: cleanName,
        productName: product.name,
        productDescription: product.description,
        downloadUrl: absoluteDownloadUrl,
        fileName,
        hasAttachment: true,
      });

      let emailResult;
      try {
        emailResult = await sendTransactionalEmail({
          to: cleanEmail,
          subject: `Your Free E.L.R.x PDF — ${product.name}`,
          html,
          text,
          pdfFilePath: product.file_url,
          productName: product.name,
          orderId: order.id,
          allowMock: Boolean(isTestMode || process.env.ALLOW_EMAIL_MOCK_TEST === 'true'),
        });
      } catch (dispatchErr) {
        emailResult = {
          success: false,
          status: DELIVERY_STATUSES.FAILED,
          provider: 'unknown',
          error: dispatchErr.message,
        };
      }

      // Log the delivery event with full audit metadata
      addDeliveryLog(order.id, {
        productId: product.id,
        recipientEmail: cleanEmail,
        provider: emailResult.provider || 'unknown',
        subject: `Your Free E.L.R.x PDF — ${product.name}`,
        status: emailResult.status || (emailResult.success ? DELIVERY_STATUSES.PROVIDER_ACCEPTED : DELIVERY_STATUSES.FAILED),
        messageId: emailResult.messageId || null,
        attachmentFilename: fileName,
        attachmentSizeBytes: emailResult.attachmentInfo ? emailResult.attachmentInfo.size : null,
        providerResponse: emailResult.response || null,
        errorDetails: emailResult.error || null,
      });

      if (!emailResult.success) {
        updateOrderRecord(order.id, {
          delivery_status: DELIVERY_STATUSES.FAILED,
          email_status: DELIVERY_STATUSES.FAILED,
          delivery_error: emailResult.error || 'Email dispatch failed',
          delivery_provider: emailResult.provider || 'unconfigured',
          download_token: token,
        });

        return res.status(502).json({
          success: false,
          orderId: order.id,
          productName: product.name,
          paymentStatus: 'FREE',
          deliveryStatus: DELIVERY_STATUSES.FAILED,
          emailStatus: DELIVERY_STATUSES.FAILED,
          statusLabel: 'Email delivery failed',
          error: `Email delivery could not be completed: ${emailResult.error || 'Unknown email service error'}. Please try again later or contact support.`,
        });
      }

      // Provider successfully accepted the email for relay/delivery
      updateOrderRecord(order.id, {
        delivery_status: DELIVERY_STATUSES.PROVIDER_ACCEPTED,
        email_status: DELIVERY_STATUSES.PROVIDER_ACCEPTED,
        delivery_provider: emailResult.provider,
        delivery_message_id: emailResult.messageId,
        delivery_timestamp: new Date().toISOString(),
        delivery_error: null,
        download_token: token,
      });

      return res.status(200).json({
        success: true,
        orderId: order.id,
        productName: product.name,
        paymentStatus: 'FREE',
        deliveryStatus: DELIVERY_STATUSES.PROVIDER_ACCEPTED,
        emailStatus: DELIVERY_STATUSES.PROVIDER_ACCEPTED,
        statusLabel: 'Email accepted by provider',
        provider: emailResult.provider,
        messageId: emailResult.messageId,
        message: 'Your PDF has been accepted by the email service for delivery.',
        secondaryMessage: "Please check your inbox (and spam/promotions folder) shortly.",
        downloadUrl: downloadPath,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // FLOW 2: PAID DIGITAL PRODUCT PURCHASE (INITIALIZE PENDING ORDER)
    // ─────────────────────────────────────────────────────────────
    const authoritativePriceInr = product.priceAmount || product.price_inr;

    const order = createOrderRecord({
      customer_name: cleanName,
      customer_email: cleanEmail,
      product_id: product.id,
      product_name: product.name,
      product_price: authoritativePriceInr,
      currency: 'INR',
      product_type: 'PAID',
      payment_gateway: paymentGateway,
      payment_status: 'PENDING',
      delivery_status: DELIVERY_STATUSES.PENDING,
      email_status: DELIVERY_STATUSES.PENDING,
      pdf_url: product.file_url,
      file_name: product.file_name,
      is_test: Boolean(isTestMode),
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      region,
    });

    // Razorpay Checkout preparation
    if (paymentGateway === 'razorpay') {
      const rzpKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder';
      const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET || '';
      let rzpOrderId = `order_${order.id}`;

      // If official Razorpay credentials provided, generate real order via Razorpay API
      if (rzpKeyId && rzpKeySecret && rzpKeyId.startsWith('rzp_')) {
        try {
          const authHeader = 'Basic ' + Buffer.from(`${rzpKeyId}:${rzpKeySecret}`).toString('base64');
          const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: authoritativePriceInr * 100, // In Paise
              currency: 'INR',
              receipt: order.id,
              notes: {
                product_id: product.id,
                customer_email: cleanEmail,
              },
            }),
          });
          if (rzpRes.ok) {
            const rzpData = await rzpRes.json();
            rzpOrderId = rzpData.id;
          }
        } catch (rzpErr) {
          console.warn('[Razorpay API] Live order create notice:', rzpErr.message);
        }
      }

      return res.status(200).json({
        success: true,
        orderId: order.id,
        paymentGateway: 'razorpay',
        razorpayOrderId: rzpOrderId,
        amount: authoritativePriceInr * 100, // In Paise
        currency: 'INR',
        keyId: rzpKeyId,
        productName: product.name,
        customerName: cleanName,
        customerEmail: cleanEmail,
        isTestMode: Boolean(isTestMode || !rzpKeySecret),
      });
    }

    // PayPal Checkout preparation
    if (paymentGateway === 'paypal') {
      const ppClientId = process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID || 'sb';
      const ppAmountUsd = inrToUsd(authoritativePriceInr);

      return res.status(200).json({
        success: true,
        orderId: order.id,
        paymentGateway: 'paypal',
        paypalOrderId: `pp_${order.id}`,
        amount: ppAmountUsd,
        currency: 'USD',
        clientId: ppClientId,
        productName: product.name,
        customerName: cleanName,
        customerEmail: cleanEmail,
        isTestMode: true,
      });
    }

    return res.status(400).json({ error: `Unsupported payment gateway: ${paymentGateway}` });
  } catch (err) {
    console.error('[create-order] Exception:', err);
    return res.status(500).json({ error: 'Internal server error processing order request.' });
  }
}
