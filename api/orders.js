import { listOrders, getOrderById, updateOrderRecord, addDeliveryLog, listDeliveryLogs, DELIVERY_STATUSES } from './_lib/orders.js';
import { getProductById } from './_lib/products.js';
import { generateDownloadToken } from './_lib/tokens.js';
import { buildFreeDeliveryEmail, buildPaidDeliveryEmail, sendTransactionalEmail } from './_lib/email.js';

export default async function handler(req, res) {
  // ── GET: List orders or delivery logs ──
  if (req.method === 'GET') {
    if (req.query.view === 'logs' || req.query.view === 'delivery_logs') {
      const logs = listDeliveryLogs();
      return res.status(200).json({ success: true, count: logs.length, logs });
    }

    const filters = {
      payment_status: req.query.payment_status || undefined,
      delivery_status: req.query.delivery_status || undefined,
      product_type: req.query.product_type || undefined,
      search: req.query.search || undefined,
    };
    const orders = listOrders(filters);
    return res.status(200).json({ success: true, count: orders.length, orders });
  }

  // ── POST: Safe Administrator Actions (Retry Email Delivery) ──
  if (req.method === 'POST') {
    const { action, orderId } = req.body || {};

    if (action === 'retry_delivery') {
      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required.' });
      }

      const order = getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found.' });
      }

      // CRITICAL SECURITY RULE: Never deliver PDF for unverified/pending/failed orders
      if (order.payment_status !== 'PAID' && order.payment_status !== 'FREE') {
        return res.status(400).json({
          error: `Cannot dispatch PDF: Order payment status is ${order.payment_status}. Only confirmed PAID or FREE orders are eligible for delivery.`,
        });
      }

      const host = req.headers.host || 'abhisingh-website.vercel.app';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const baseUrl = `${protocol}://${host}`;

      const { token } = generateDownloadToken(order.id, { productId: order.product_id, status: order.payment_status });
      const fileName = order.file_name || (order.pdf_url ? order.pdf_url.split('/').pop() : 'guide.pdf');
      const downloadPath = `/api/download-pdf?orderId=${encodeURIComponent(order.id)}&token=${encodeURIComponent(token)}&file=${encodeURIComponent(fileName)}`;
      const absoluteDownloadUrl = `${baseUrl}${downloadPath}`;

      const product = getProductById(order.product_id) || { name: order.product_name, file_url: order.pdf_url };

      const emailPayload =
        order.payment_status === 'FREE'
          ? buildFreeDeliveryEmail({
              customerName: order.customer_name,
              productName: order.product_name,
              productDescription: product.description,
              downloadUrl: absoluteDownloadUrl,
              fileName,
              hasAttachment: true,
            })
          : buildPaidDeliveryEmail({
              customerName: order.customer_name,
              productName: order.product_name,
              productDescription: product.description,
              orderId: order.id,
              paymentId: order.gateway_payment_reference || 'admin_retry',
              amount: order.product_price,
              currency: order.currency || 'INR',
              downloadUrl: absoluteDownloadUrl,
              fileName,
              hasAttachment: true,
            });

      updateOrderRecord(orderId, {
        delivery_status: DELIVERY_STATUSES.PROCESSING,
        email_status: DELIVERY_STATUSES.PROCESSING,
      });

      let emailResult;
      try {
        emailResult = await sendTransactionalEmail({
          to: order.customer_email,
          subject:
            order.payment_status === 'FREE'
              ? `Your Free E.L.R.x PDF — ${order.product_name}`
              : 'Payment Confirmed — Your E.L.R.x PDF Is Ready',
          html: emailPayload.html,
          text: emailPayload.text,
          pdfFilePath: order.pdf_url || product.file_url,
          productName: order.product_name,
          orderId: order.id,
          allowMock: Boolean(order.is_test || process.env.ALLOW_EMAIL_MOCK_TEST === 'true'),
        });
      } catch (err) {
        emailResult = {
          success: false,
          status: DELIVERY_STATUSES.FAILED,
          provider: 'unknown',
          error: err.message,
        };
      }

      addDeliveryLog(orderId, {
        productId: order.product_id,
        recipientEmail: order.customer_email,
        provider: emailResult.provider || 'unknown',
        subject: order.payment_status === 'FREE' ? `Your Free E.L.R.x PDF — ${order.product_name}` : 'Payment Confirmed — Your E.L.R.x PDF Is Ready',
        status: emailResult.status || (emailResult.success ? DELIVERY_STATUSES.PROVIDER_ACCEPTED : DELIVERY_STATUSES.FAILED),
        messageId: emailResult.messageId || null,
        attachmentFilename: fileName,
        attachmentSizeBytes: emailResult.attachmentInfo ? emailResult.attachmentInfo.size : null,
        providerResponse: emailResult.response || null,
        errorDetails: emailResult.error || null,
      });

      if (!emailResult.success) {
        const updated = updateOrderRecord(orderId, {
          delivery_status: DELIVERY_STATUSES.FAILED,
          email_status: DELIVERY_STATUSES.FAILED,
          delivery_attempt_count: (order.delivery_attempt_count || 0) + 1,
          delivery_timestamp: new Date().toISOString(),
          delivery_error: emailResult.error || 'Provider rejected email',
          delivery_provider: emailResult.provider || 'unconfigured',
        });

        return res.status(200).json({
          success: false,
          deliveryStatus: DELIVERY_STATUSES.FAILED,
          emailStatus: DELIVERY_STATUSES.FAILED,
          statusLabel: 'Email delivery failed',
          error: emailResult.error,
          order: updated,
        });
      }

      const updated = updateOrderRecord(orderId, {
        delivery_status: DELIVERY_STATUSES.PROVIDER_ACCEPTED,
        email_status: DELIVERY_STATUSES.PROVIDER_ACCEPTED,
        delivery_provider: emailResult.provider,
        delivery_message_id: emailResult.messageId,
        delivery_attempt_count: (order.delivery_attempt_count || 0) + 1,
        delivery_timestamp: new Date().toISOString(),
        delivery_error: null,
        download_token: token,
      });

      return res.status(200).json({
        success: true,
        deliveryStatus: DELIVERY_STATUSES.PROVIDER_ACCEPTED,
        emailStatus: DELIVERY_STATUSES.PROVIDER_ACCEPTED,
        statusLabel: 'Email accepted by provider',
        provider: emailResult.provider,
        messageId: emailResult.messageId,
        order: updated,
        message: 'Deliverable email accepted by provider for transmission.',
      });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method Not Allowed' });
}
