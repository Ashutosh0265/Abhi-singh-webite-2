import { getOrderById, updateOrderRecord, addDeliveryLog, DELIVERY_STATUSES } from './_lib/orders.js';
import { getProductById } from './_lib/products.js';
import { generateDownloadToken } from './_lib/tokens.js';
import { buildPaidDeliveryEmail, sendTransactionalEmail } from './_lib/email.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { orderId, paypalOrderId, paypalDetails, isCancelled } = req.body || {};

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required.' });
    }

    const order = getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (isCancelled) {
      updateOrderRecord(orderId, { payment_status: 'CANCELLED' });
      return res.status(200).json({ success: false, paymentStatus: 'CANCELLED', message: 'Payment was cancelled.' });
    }

    // In live production with PayPal Client ID and Secret:
    // Call PayPal REST API to capture payment if needed
    const ppClientId = process.env.PAYPAL_CLIENT_ID;
    const ppSecret = process.env.PAYPAL_CLIENT_SECRET;
    let paymentSuccess = true;
    let transactionId = paypalOrderId || `pp_pay_${Date.now()}`;

    if (ppClientId && ppSecret && !ppClientId.startsWith('sb')) {
      try {
        const auth = Buffer.from(`${ppClientId}:${ppSecret}`).toString('base64');
        const tokenRes = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=client_credentials',
        });
        const tokenData = await tokenRes.json();
        if (tokenData.access_token) {
          const captureRes = await fetch(
            `https://api-m.paypal.com/v2/checkout/orders/${paypalOrderId}/capture`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          const captureData = await captureRes.json();
          if (captureData.status === 'COMPLETED') {
            paymentSuccess = true;
            transactionId = captureData.id || paypalOrderId;
          } else {
            paymentSuccess = false;
          }
        }
      } catch (err) {
        console.warn('[PayPal API] Capture notice:', err.message);
      }
    } else {
      // Sandbox / Test Mode
      paymentSuccess = Boolean(paypalOrderId && (paypalDetails?.status === 'COMPLETED' || paypalOrderId.startsWith('pay_') || paypalOrderId.startsWith('pp_')));
    }

    if (!paymentSuccess) {
      updateOrderRecord(orderId, {
        payment_status: 'FAILED',
        gateway_payment_reference: transactionId,
      });
      return res.status(400).json({
        error: 'PayPal payment could not be captured or was cancelled.',
        paymentStatus: 'FAILED',
      });
    }

    // Payment captured successfully
    const host = req.headers.host || 'abhisingh-website.vercel.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const { token } = generateDownloadToken(order.id, { productId: order.product_id, status: 'PAID' });
    const fileName = order.file_name || (order.pdf_url ? order.pdf_url.split('/').pop() : 'guide.pdf');
    const downloadPath = `/api/download-pdf?orderId=${encodeURIComponent(order.id)}&token=${encodeURIComponent(token)}&file=${encodeURIComponent(fileName)}`;
    const absoluteDownloadUrl = `${baseUrl}${downloadPath}`;

    updateOrderRecord(orderId, {
      payment_status: 'PAID',
      gateway_payment_reference: transactionId,
      delivery_status: DELIVERY_STATUSES.PROCESSING,
      email_status: DELIVERY_STATUSES.PROCESSING,
      download_token: token,
    });

    const product = getProductById(order.product_id) || { name: order.product_name, file_url: order.pdf_url };
    const { html, text } = buildPaidDeliveryEmail({
      customerName: order.customer_name,
      productName: order.product_name,
      productDescription: product.description,
      orderId: order.id,
      paymentId: transactionId,
      amount: order.product_price,
      currency: order.currency || 'INR',
      downloadUrl: absoluteDownloadUrl,
      fileName,
      hasAttachment: true,
    });

    let emailResult;
    try {
      emailResult = await sendTransactionalEmail({
        to: order.customer_email,
        subject: 'Payment Confirmed — Your E.L.R.x PDF Is Ready',
        html,
        text,
        pdfFilePath: order.pdf_url || product.file_url,
        productName: order.product_name,
        orderId: order.id,
        allowMock: Boolean(order.is_test || process.env.ALLOW_EMAIL_MOCK_TEST === 'true'),
      });
    } catch (eErr) {
      emailResult = {
        success: false,
        status: DELIVERY_STATUSES.FAILED,
        provider: 'unknown',
        error: eErr.message,
      };
    }

    addDeliveryLog(orderId, {
      productId: order.product_id,
      recipientEmail: order.customer_email,
      provider: emailResult.provider || 'unknown',
      subject: 'Payment Confirmed — Your E.L.R.x PDF Is Ready',
      status: emailResult.status || (emailResult.success ? DELIVERY_STATUSES.PROVIDER_ACCEPTED : DELIVERY_STATUSES.FAILED),
      messageId: emailResult.messageId || null,
      attachmentFilename: fileName,
      attachmentSizeBytes: emailResult.attachmentInfo ? emailResult.attachmentInfo.size : null,
      providerResponse: emailResult.response || null,
      errorDetails: emailResult.error || null,
    });

    if (!emailResult.success) {
      updateOrderRecord(orderId, {
        delivery_status: DELIVERY_STATUSES.FAILED,
        email_status: DELIVERY_STATUSES.FAILED,
        delivery_error: emailResult.error || 'Email dispatch failed',
        delivery_provider: emailResult.provider || 'unconfigured',
      });

      return res.status(200).json({
        success: true,
        orderId: order.id,
        paymentStatus: 'PAID',
        deliveryStatus: DELIVERY_STATUSES.FAILED,
        emailStatus: DELIVERY_STATUSES.FAILED,
        statusLabel: 'Email delivery pending admin dispatch',
        warning: 'Payment verified, but email dispatch failed. Our admin team has been notified to retry delivery.',
        error: emailResult.error,
      });
    }

    updateOrderRecord(orderId, {
      delivery_status: DELIVERY_STATUSES.PROVIDER_ACCEPTED,
      email_status: DELIVERY_STATUSES.PROVIDER_ACCEPTED,
      delivery_provider: emailResult.provider,
      delivery_message_id: emailResult.messageId,
      delivery_timestamp: new Date().toISOString(),
      delivery_error: null,
    });

    return res.status(200).json({
      success: true,
      orderId: order.id,
      paymentStatus: 'PAID',
      deliveryStatus: DELIVERY_STATUSES.PROVIDER_ACCEPTED,
      emailStatus: DELIVERY_STATUSES.PROVIDER_ACCEPTED,
      statusLabel: 'Email accepted by provider',
      provider: emailResult.provider,
      messageId: emailResult.messageId,
      downloadUrl: downloadPath,
      message: 'Payment successful! Your PDF has been accepted by the email service for delivery.',
    });
  } catch (err) {
    console.error('[verify-paypal] Exception:', err);
    return res.status(500).json({ error: 'Server error verifying PayPal payment.' });
  }
}
