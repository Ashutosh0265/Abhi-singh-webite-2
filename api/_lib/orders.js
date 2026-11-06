import fs from 'node:fs';
import path from 'node:path';

// Memory store for fast serverless execution
const memoryOrders = new Map();
const ORDER_FILE = path.resolve(process.cwd(), 'public/assets/downloads/.orders_cache.json');
const TMP_ORDER_FILE = path.resolve('/tmp', '.orders_cache.json');

// Initialize orders from disk if available
try {
  const candidateFiles = [ORDER_FILE, TMP_ORDER_FILE];
  for (const f of candidateFiles) {
    if (fs.existsSync(f)) {
      const raw = fs.readFileSync(f, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((o) => memoryOrders.set(o.id, o));
      }
    }
  }
} catch (e) {
  // Ignore
}

function persistToDisk() {
  const list = Array.from(memoryOrders.values());
  const serialized = JSON.stringify(list, null, 2);
  try {
    fs.mkdirSync(path.dirname(ORDER_FILE), { recursive: true });
    fs.writeFileSync(ORDER_FILE, serialized, 'utf8');
  } catch (err) {
    // Non-fatal in read-only serverless environments
  }
  try {
    fs.mkdirSync('/tmp', { recursive: true });
    fs.writeFileSync(TMP_ORDER_FILE, serialized, 'utf8');
  } catch (err) {
    // Non-fatal if /tmp is not available
  }
}

/**
 * Valid delivery states
 */
export const DELIVERY_STATUSES = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PROVIDER_ACCEPTED: 'PROVIDER_ACCEPTED',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  BOUNCED: 'BOUNCED',
};

/**
 * Create a new order record with full schema
 */
export function createOrderRecord(orderData) {
  const now = new Date().toISOString();
  const id = orderData.id || `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Idempotency check: avoid double-creation if duplicate request within 15 seconds
  if (orderData.customer_email && orderData.product_id) {
    const recent = Array.from(memoryOrders.values()).find(
      (o) =>
        o.customer_email === orderData.customer_email &&
        o.product_id === orderData.product_id &&
        Date.now() - new Date(o.created_at).getTime() < 15000 &&
        o.payment_status === orderData.payment_status
    );
    if (recent) {
      return recent;
    }
  }

  const initialDeliveryStatus = orderData.delivery_status || DELIVERY_STATUSES.PENDING;

  const record = {
    id,
    customer_name: orderData.customer_name || 'Customer',
    customer_email: orderData.customer_email,
    product_id: orderData.product_id,
    product_name: orderData.product_name,
    product_price: orderData.product_price ?? 0,
    currency: orderData.currency || 'INR',
    product_type: orderData.product_type || (orderData.product_price === 0 ? 'FREE' : 'PAID'),
    payment_gateway: orderData.payment_gateway || 'free',
    payment_status: orderData.payment_status || (orderData.product_price === 0 ? 'FREE' : 'PENDING'),
    gateway_payment_reference: orderData.gateway_payment_reference || null,
    delivery_status: initialDeliveryStatus,
    email_status: orderData.email_status || initialDeliveryStatus,
    delivery_attempt_count: orderData.delivery_attempt_count ?? 0,
    delivery_timestamp: orderData.delivery_timestamp || null,
    delivery_error: orderData.delivery_error || null,
    delivery_provider: orderData.delivery_provider || null,
    delivery_message_id: orderData.delivery_message_id || null,
    delivery_logs: Array.isArray(orderData.delivery_logs) ? orderData.delivery_logs : [],
    download_token: orderData.download_token || null,
    pdf_url: orderData.pdf_url || null,
    file_name: orderData.file_name || null,
    is_test: Boolean(orderData.is_test),
    utm_source: orderData.utm_source || 'direct',
    utm_medium: orderData.utm_medium || 'web',
    utm_campaign: orderData.utm_campaign || 'elrx_store',
    region: orderData.region || 'India',
    created_at: orderData.created_at || now,
    updated_at: now,
  };

  memoryOrders.set(id, record);
  persistToDisk();
  return record;
}

/**
 * Retrieve an order by its ID
 */
export function getOrderById(orderId) {
  if (!orderId) return null;
  return memoryOrders.get(orderId) || null;
}

/**
 * Update an existing order
 */
export function updateOrderRecord(orderId, updates) {
  const existing = memoryOrders.get(orderId);
  if (!existing) return null;

  const updated = {
    ...existing,
    ...updates,
    delivery_logs: Array.isArray(updates.delivery_logs)
      ? updates.delivery_logs
      : existing.delivery_logs || [],
    updated_at: new Date().toISOString(),
  };

  memoryOrders.set(orderId, updated);
  persistToDisk();
  return updated;
}

/**
 * Append a detailed delivery audit log entry to an order
 */
export function addDeliveryLog(orderId, logEntry) {
  const existing = memoryOrders.get(orderId);
  if (!existing) return null;

  const currentLogs = Array.isArray(existing.delivery_logs) ? existing.delivery_logs : [];
  const entry = {
    timestamp: new Date().toISOString(),
    order_id: orderId,
    product_id: logEntry.productId || existing.product_id,
    recipient_email: logEntry.recipientEmail || existing.customer_email,
    provider: logEntry.provider || 'unknown',
    subject: logEntry.subject || '',
    status: logEntry.status || DELIVERY_STATUSES.PROCESSING,
    message_id: logEntry.messageId || null,
    attachment_filename: logEntry.attachmentFilename || existing.file_name || null,
    attachment_size_bytes: logEntry.attachmentSizeBytes || null,
    provider_response: logEntry.providerResponse || null,
    error_details: logEntry.errorDetails || null,
  };

  const updatedLogs = [entry, ...currentLogs];
  return updateOrderRecord(orderId, { delivery_logs: updatedLogs });
}

/**
 * List orders with optional filters
 */
export function listOrders(filters = {}) {
  let list = Array.from(memoryOrders.values());

  if (filters.payment_status) {
    list = list.filter((o) => o.payment_status === filters.payment_status);
  }
  if (filters.delivery_status) {
    list = list.filter((o) => o.delivery_status === filters.delivery_status);
  }
  if (filters.product_type) {
    list = list.filter((o) => o.product_type === filters.product_type);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (o) =>
        (o.id || '').toLowerCase().includes(q) ||
        (o.customer_name || '').toLowerCase().includes(q) ||
        (o.customer_email || '').toLowerCase().includes(q) ||
        (o.product_name || '').toLowerCase().includes(q)
    );
  }

  // Sort descending by created_at
  return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

/**
 * List all delivery audit logs across all orders
 */
export function listDeliveryLogs() {
  const allLogs = [];
  for (const order of memoryOrders.values()) {
    if (Array.isArray(order.delivery_logs)) {
      allLogs.push(...order.delivery_logs);
    }
  }
  return allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}
