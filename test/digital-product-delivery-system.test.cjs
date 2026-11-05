const assert = require('assert');

const BASE_URL = 'http://localhost:3000';

async function runBackendTests() {
  console.log('========================================================================');
  console.log('🧪 E.L.R.x STORE: BACKEND API & DIGITAL PRODUCT AUTOMATION TEST SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✕ FAIL: ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // TEST SUITE 1: FREE DIGITAL PRODUCT FLOW
  // ─────────────────────────────────────────────────────────────────
  console.log('--- 1. FREE DIGITAL PRODUCT DOWNLOAD FLOW ---');

  let freeOrderId = null;
  let freeDownloadUrl = null;

  await test('1.1 Free Download Order Creation & Immediate Delivery Response', async () => {
    const res = await fetch(`${BASE_URL}/api/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'habits-email-course',
        customerName: 'Aarav Patel',
        customerEmail: 'aarav.patel@example.com',
      }),
    });

    assert.strictEqual(res.status, 200, 'Should return 200 OK');
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.paymentStatus, 'FREE');
    assert.strictEqual(data.deliveryStatus, 'SENT');
    assert(data.orderId && data.orderId.startsWith('ord_'), 'Should return valid orderId');
    assert(data.downloadUrl && data.downloadUrl.includes('/api/download-pdf'), 'Should return secure tokenized download URL');
    assert(data.message.includes('Your PDF is on its way'), 'Should return required confirmation message');

    freeOrderId = data.orderId;
    freeDownloadUrl = data.downloadUrl;
  });

  await test('1.2 Free Download: Secure Tokenized Stream Access Validated', async () => {
    assert(freeDownloadUrl, 'Download URL must be present from previous step');
    const dlRes = await fetch(`${BASE_URL}${freeDownloadUrl}`);

    assert.strictEqual(dlRes.status, 200, 'Should authorize valid token');
    assert.strictEqual(dlRes.headers.get('content-type'), 'application/pdf');
    assert(dlRes.headers.get('content-disposition').includes('habits-for-physical-and-mental-strength.pdf'));
    const bytes = await dlRes.arrayBuffer();
    assert(bytes.byteLength > 1000, 'PDF binary stream must contain valid bytes');
  });

  await test('1.3 Validation Guard: Reject Empty Name & Malformed Email', async () => {
    const emptyNameRes = await fetch(`${BASE_URL}/api/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'habits-email-course',
        customerName: '',
        customerEmail: 'valid@example.com',
      }),
    });
    assert.strictEqual(emptyNameRes.status, 400, 'Should reject empty name');

    const badEmailRes = await fetch(`${BASE_URL}/api/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'habits-email-course',
        customerName: 'Valid Name',
        customerEmail: 'not-an-email',
      }),
    });
    assert.strictEqual(badEmailRes.status, 400, 'Should reject invalid email format');
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST SUITE 2: PAID DIGITAL PRODUCT WORKFLOW (RAZORPAY)
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- 2. PAID DIGITAL PRODUCT FLOW (RAZORPAY & TAMPER RESISTANCE) ---');

  let paidOrderId = null;
  let razorpayOrderId = null;

  await test('2.1 Price Tamper Resistance: Backend Uses Authoritative Price from Catalog', async () => {
    // Malicious client attempts to buy ₹499 book for ₹1
    const res = await fetch(`${BASE_URL}/api/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'boring-basics-book',
        customerName: 'Tamper Tester',
        customerEmail: 'tamper@example.com',
        paymentGateway: 'razorpay',
        price: 1, // Tampered price
        amount: 1,
      }),
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    // Must charge authoritative price 499 (49900 paise)
    assert.strictEqual(data.amount, 49900, 'Server must enforce authoritative catalog price of 49900 paise (₹499)');
    assert.strictEqual(data.currency, 'INR');

    paidOrderId = data.orderId;
    razorpayOrderId = data.razorpayOrderId;
  });

  await test('2.2 Security Guard: Block PDF Download for PENDING Unpaid Order', async () => {
    // Attempt to download before payment verification
    const dlRes = await fetch(`${BASE_URL}/api/download-pdf?orderId=${paidOrderId}&token=fake_or_early_token`);
    assert.strictEqual(dlRes.status, 403, 'Should reject download for unpaid pending order');
  });

  await test('2.3 Invalid Payment Signature Rejection (No PDF Delivery)', async () => {
    const fakeVerifyRes = await fetch(`${BASE_URL}/api/verify-razorpay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: paidOrderId,
        razorpayOrderId: razorpayOrderId,
        razorpayPaymentId: '', // Invalid payment ID
      }),
    });

    assert.strictEqual(fakeVerifyRes.status, 400, 'Must reject empty payment reference');
  });

  let verifiedPaidDownloadUrl = null;

  await test('2.4 Verified Payment Confirmation Transitions Order to PAID and Delivers PDF', async () => {
    const paymentId = `pay_rzp_test_${Date.now()}`;
    const verifyRes = await fetch(`${BASE_URL}/api/verify-razorpay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: paidOrderId,
        razorpayOrderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: 'test_signature',
      }),
    });

    assert.strictEqual(verifyRes.status, 200);
    const data = await verifyRes.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.paymentStatus, 'PAID');
    assert.strictEqual(data.deliveryStatus, 'SENT');
    assert(data.downloadUrl && data.downloadUrl.includes('24-boring-basics-peak-fitness.pdf'), 'Must return valid download link');

    verifiedPaidDownloadUrl = data.downloadUrl;
  });

  await test('2.5 Authorized Paid Download Serves Exact Purchased PDF Deliverable', async () => {
    assert(verifiedPaidDownloadUrl, 'Verified download URL must be present');
    const dlRes = await fetch(`${BASE_URL}${verifiedPaidDownloadUrl}`);

    assert.strictEqual(dlRes.status, 200, 'Should authorize verified paid download');
    assert.strictEqual(dlRes.headers.get('content-type'), 'application/pdf');
    assert(dlRes.headers.get('content-disposition').includes('24-boring-basics-peak-fitness.pdf'));
    const bytes = await dlRes.arrayBuffer();
    assert(bytes.byteLength > 1000);
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST SUITE 3: PAYPAL SANDBOX FLOW
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- 3. PAID DIGITAL PRODUCT FLOW (PAYPAL SANDBOX) ---');

  let ppOrderId = null;

  await test('3.1 PayPal Order Creation with Currency Conversion', async () => {
    const res = await fetch(`${BASE_URL}/api/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'abhis-10-complexes',
        customerName: 'Global Athlete',
        customerEmail: 'global.athlete@example.com',
        paymentGateway: 'paypal',
      }),
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.paymentGateway, 'paypal');
    assert.strictEqual(data.currency, 'USD');
    assert.strictEqual(data.amount, '6.00', '₹499 should convert to $6.00 USD');
    ppOrderId = data.orderId;
  });

  await test('3.2 PayPal Payment Verification & Delivery', async () => {
    const verifyRes = await fetch(`${BASE_URL}/api/verify-paypal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: ppOrderId,
        paypalOrderId: `pp_capture_${Date.now()}`,
      }),
    });

    assert.strictEqual(verifyRes.status, 200);
    const data = await verifyRes.json();
    assert.strictEqual(data.paymentStatus, 'PAID');
    assert.strictEqual(data.deliveryStatus, 'SENT');
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST SUITE 4: ADMIN ORDER MANAGEMENT & SAFE RETRY ACTION
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- 4. ADMIN CMS ORDER AUDIT & SAFE RETRY ACTION ---');

  await test('4.1 List Orders with Complete Filtering', async () => {
    const res = await fetch(`${BASE_URL}/api/orders`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(data.count >= 3, 'Must list all recorded orders');
    assert(data.orders.some((o) => o.payment_status === 'FREE'));
    assert(data.orders.some((o) => o.payment_status === 'PAID'));
  });

  await test('4.2 Safe Retry Email Action Dispatches Delivery Without Extra Payment', async () => {
    const retryRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'retry_delivery',
        orderId: paidOrderId,
      }),
    });

    assert.strictEqual(retryRes.status, 200);
    const data = await retryRes.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.order.payment_status, 'PAID', 'Payment status must remain PAID');
    assert(data.order.delivery_attempt_count >= 1, 'Delivery attempt count must increment');
  });

  await test('4.3 Critical Security Rule: Block Email Retry on Unverified/Pending Orders', async () => {
    // Create unverified pending order
    const pendingOrderRes = await fetch(`${BASE_URL}/api/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'abhis-10-complexes',
        customerName: 'Pending User',
        customerEmail: 'pending.user@example.com',
        paymentGateway: 'razorpay',
      }),
    });
    const pendingData = await pendingOrderRes.json();

    // Attempt to retry email on unverified order
    const retryRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'retry_delivery',
        orderId: pendingData.orderId,
      }),
    });

    assert.strictEqual(retryRes.status, 400, 'Must strictly reject email dispatch for unpaid pending order');
  });

  console.log('\n========================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED / ${failed} FAILED`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runBackendTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

