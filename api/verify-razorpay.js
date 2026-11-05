import { getOrderById, updateOrderRecord } from './_lib/orders.js';
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
      delivery_status: 'QUEUED',
      download_token: token,
    });

    // Send transactional paid download email
    const product = getProductById(order.product_id) || { name: order.product_name, file_url: order.pdf_url };
    const { html, text } = buildPaidDeliveryEmail({
      customerName: order.customer_name,
      productName: order.product_name,
      orderId: order.id,
      paymentId: razorpayPaymentId,
      amount: order.product_price,
      currency: order.currency || 'INR',
      downloadUrl: absoluteDownloadUrl,
      hasAttachment: true,
    });

    let deliveryStatus = 'SENT';
    let deliveryError = null;

    try {
      const emailResult = await sendTransactionalEmail({
        to: order.customer_email,
        subject: `Your E.L.R.x Purchase Is Ready — ${order.product_name}`,
        html,
        text,
        pdfFilePath: order.pdf_url || product.file_url,
        productName: order.product_name,
      });

      if (!emailResult.success) {
        deliveryStatus = 'FAILED';
        deliveryError = emailResult.warning || 'Email delivery failed';
      }
    } catch (eErr) {
      deliveryStatus = 'FAILED';
      deliveryError = eErr.message;
    }

    updateOrderRecord(orderId, {
      delivery_status: deliveryStatus,
      delivery_timestamp: new Date().toISOString(),
      delivery_error: deliveryError,
    });

    return res.status(200).json({
      success: true,
      orderId: order.id,
      paymentStatus: 'PAID',
      deliveryStatus,
      downloadUrl: downloadPath,
      directPdfUrl: order.pdf_url,
      message: 'Payment verified successfully and PDF deliverable sent.',
    });
  } catch (err) {
    console.error('[verify-razorpay] Exception:', err);
    return res.status(500).json({ error: 'Server error verifying Razorpay payment.' });
  }
}
