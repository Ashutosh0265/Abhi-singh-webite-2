import { getOrderById, updateOrderRecord, addDeliveryLog, DELIVERY_STATUSES } from './_lib/orders.js';
import { getProductById } from './_lib/products.js';
import { verifyRazorpaySignature, generateDownloadToken } from './_lib/tokens.js';
import { buildPaidDeliveryEmail, sendTransactionalEmail } from './_lib/email.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body || {};

    if (!orderId || !razorpayPaymentId) {
      return res.status(400).json({ error: 'Order ID and Razorpay Payment ID are required.' });
    }

    const order = getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order record not found.' });
    }

    // Verify payment signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    const isValid = verifyRazorpaySignature({
      razorpayOrderId: razorpayOrderId || `order_${orderId}`,
      razorpayPaymentId,
      razorpaySignature: razorpaySignature || 'test_sig',
      keySecret,
    });

    if (!isValid) {
      updateOrderRecord(orderId, {
        payment_status: 'FAILED',
        gateway_payment_reference: razorpayPaymentId,
      });
      return res.status(400).json({
        error: 'Invalid payment signature. Payment could not be verified.',
        paymentStatus: 'FAILED',
      });
    }

    // Mark order as PAID
    const host = req.headers.host || 'abhisingh-website.vercel.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const { token } = generateDownloadToken(order.id, { productId: order.product_id, status: 'PAID' });
    const fileName = order.file_name || (order.pdf_url ? order.pdf_url.split('/').pop() : 'guide.pdf');
    const downloadPath = `/api/download-pdf?orderId=${encodeURIComponent(order.id)}&token=${encodeURIComponent(token)}&file=${encodeURIComponent(fileName)}`;
    const absoluteDownloadUrl = `${baseUrl}${downloadPath}`;

    updateOrderRecord(orderId, {
      payment_status: 'PAID',
      gateway_payment_reference: razorpayPaymentId,
      delivery_status: DELIVERY_STATUSES.PROCESSING,
      email_status: DELIVERY_STATUSES.PROCESSING,
      download_token: token,
    });

    // Send transactional paid download email
    const product = getProductById(order.product_id) || { name: order.product_name, file_url: order.pdf_url };
    const { html, text } = buildPaidDeliveryEmail({
      customerName: order.customer_name,
      productName: order.product_name,
      productDescription: product.description,
      orderId: order.id,
      paymentId: razorpayPaymentId,
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

    // Add delivery audit log
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
    console.error('[verify-razorpay] Exception:', err);
    return res.status(500).json({ error: 'Server error verifying Razorpay payment.' });
  }
}
