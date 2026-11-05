import { getProductById, hasValidPdfDeliverable, inrToUsd } from './_lib/products.js';
import { createOrderRecord, updateOrderRecord } from './_lib/orders.js';
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

    // 2. Validate product against authoritative server database
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
    // FLOW 1: FREE DIGITAL PRODUCT DOWNLOAD
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
        delivery_status: 'QUEUED',
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

      // Build & trigger brand-aligned transactional email
      const { html, text } = buildFreeDeliveryEmail({
        customerName: cleanName,
        productName: product.name,
        productDescription: product.description,
        downloadUrl: absoluteDownloadUrl,
        fileName,
        hasAttachment: true,
      });

      let deliveryStatus = 'SENT';
      let emailStatus = 'EMAIL_SENT';
      let deliveryError = null;

      try {
        const emailResult = await sendTransactionalEmail({
          to: cleanEmail,
          subject: `Your Free E.L.R.x PDF — ${product.name}`,
          html,
          text,
          pdfFilePath: product.file_url,
          productName: product.name,
          orderId: order.id,
        });

        if (!emailResult.success) {
          deliveryStatus = 'FAILED';
          emailStatus = 'EMAIL_FAILED';
          deliveryError = emailResult.error || 'Email provider rejected delivery';
        }
      } catch (eErr) {
        deliveryStatus = 'FAILED';
        emailStatus = 'EMAIL_FAILED';
        deliveryError = eErr.message;
      }

      updateOrderRecord(order.id, {
        delivery_status: deliveryStatus,
        email_status: emailStatus,
        delivery_timestamp: new Date().toISOString(),
        delivery_error: deliveryError,
        download_token: token,
      });

      if (deliveryStatus === 'FAILED') {
        return res.status(502).json({
          success: false,
          error: 'We were unable to deliver your PDF to this email. Please check your email address and try again.',
          orderId: order.id,
          deliveryStatus: 'FAILED',
          emailStatus: 'EMAIL_FAILED',
        });
      }

      return res.status(200).json({
        success: true,
        orderId: order.id,
        productName: product.name,
        paymentStatus: 'FREE',
        deliveryStatus: 'SENT',
        emailStatus: 'EMAIL_SENT',
        message: 'Your PDF is on its way! Please check your inbox.',
        secondaryMessage: "If you don't see the email, please check your spam or promotions folder.",
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
      delivery_status: 'NOT_STARTED',
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
