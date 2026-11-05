import { getOrderById, updateOrderRecord } from './_lib/orders.js';
import { getProductById } from './_lib/products.js';
import { generateDownloadToken } from './_lib/tokens.js';
import { buildPaidDeliveryEmail, sendTransactionalEmail } from './_lib/email.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const eventType = req.body?.event_type;
    const resource = req.body?.resource;

    if (eventType !== 'PAYMENT.CAPTURE.COMPLETED' || !resource) {
      return res.status(200).json({ status: 'ignored' });
    }

    const orderId = resource.custom_id || resource.invoice_id;
    const paymentId = resource.id;

    if (!orderId) {
      return res.status(200).json({ status: 'no_order_id' });
    }

    const order = getOrderById(orderId);
    if (!order) {
      return res.status(200).json({ status: 'order_not_found' });
    }

    // Idempotency: Don't deliver duplicate email if already fulfilled
    if (order.payment_status === 'PAID') {
      return res.status(200).json({ status: 'already_fulfilled' });
    }

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

    return res.status(200).json({ status: 'processed' });
  } catch (err) {
    console.error('[paypal-webhook] Error:', err);
    return res.status(500).json({ error: 'Webhook processing error' });
  }
}

