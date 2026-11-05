import { getOrderById, updateOrderRecord } from './_lib/orders.js';
import { getProductById } from './_lib/products.js';
import { verifyRazorpayWebhookSignature, generateDownloadToken } from './_lib/tokens.js';
import { buildPaidDeliveryEmail, sendTransactionalEmail } from './_lib/email.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

    // Verify webhook signature if secret configured
    if (webhookSecret && signature) {
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const isValid = verifyRazorpayWebhookSignature({ rawBody, signature, webhookSecret });
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = req.body?.event;
    const payload = req.body?.payload?.payment?.entity || req.body?.payload?.order?.entity;

    if (!payload) {
      return res.status(200).json({ status: 'ignored' });
    }

    const orderId = payload.receipt || payload.notes?.order_id;
    const paymentId = payload.id;

    if (!orderId) {
      return res.status(200).json({ status: 'no_receipt_matched' });
    }

    const order = getOrderById(orderId);
    if (!order) {
      return res.status(200).json({ status: 'order_not_found' });
    }

    // Idempotency: If already marked PAID, acknowledge without re-delivering duplicate email
    if (order.payment_status === 'PAID') {
      return res.status(200).json({ status: 'already_fulfilled' });
    }

    if (event === 'payment.captured' || event === 'order.paid') {
      const host = req.headers.host || 'abhisingh-website.vercel.app';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const baseUrl = `${protocol}://${host}`;

      const { token } = generateDownloadToken(order.id, { productId: order.product_id, status: 'PAID' });
      const fileName = order.file_name || (order.pdf_url ? order.pdf_url.split('/').pop() : 'guide.pdf');
      const downloadPath = `/api/download-pdf?orderId=${encodeURIComponent(order.id)}&token=${encodeURIComponent(token)}&file=${encodeURIComponent(fileName)}`;
      const absoluteDownloadUrl = `${baseUrl}${downloadPath}`;

      updateOrderRecord(orderId, {
        payment_status: 'PAID',
        gateway_payment_reference: paymentId,
        delivery_status: 'QUEUED',
        download_token: token,
      });

      const product = getProductById(order.product_id) || { name: order.product_name, file_url: order.pdf_url };
      const { html, text } = buildPaidDeliveryEmail({
        customerName: order.customer_name,
        productName: order.product_name,
        productDescription: product.description,
        orderId: order.id,
        paymentId,
        amount: order.product_price,
        currency: order.currency || 'INR',
        downloadUrl: absoluteDownloadUrl,
        fileName,
        hasAttachment: true,
      });

      const emailResult = await sendTransactionalEmail({
        to: order.customer_email,
        subject: 'Payment Confirmed — Your E.L.R.x PDF Is Ready',
        html,
        text,
        pdfFilePath: order.pdf_url || product.file_url,
        productName: order.product_name,
        orderId: order.id,
      });

      updateOrderRecord(orderId, {
        delivery_status: emailResult.success ? 'SENT' : 'FAILED',
        email_status: emailResult.success ? 'EMAIL_SENT' : 'EMAIL_FAILED',
        delivery_timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({ status: 'processed' });
  } catch (err) {
    console.error('[razorpay-webhook] Error:', err);
    return res.status(500).json({ error: 'Webhook processing exception' });
  }
}

