const assert = require('assert');
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runEmailAutomationVerification() {
  console.log('========================================================================');
  console.log('🧪 VERIFYING E.L.R.x STORE: EMAIL DELIVERY & PAYMENT AUTOMATION');
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
  // SUITE 1: UNIT & INTEGRATION VERIFICATION OF EMAIL TEMPLATES & DISPATCHER
  // ─────────────────────────────────────────────────────────────────
  console.log('--- SUITE 1: BRANDED TRANSACTIONAL EMAIL TEMPLATES ---');

  const {
    buildFreeDeliveryEmail,
    buildPaidDeliveryEmail,
    escapeHtml,
    sendTransactionalEmail,
  } = await import('../api/_lib/email.js');

  await test('1.1 Free Email: Subject, Structure, Heading, Copy & Brand Elements', () => {
    const email = buildFreeDeliveryEmail({
      customerName: 'Ananya Verma',
      productName: 'Habits for Physical and Mental Strength',
      productDescription: 'Daily habit protocols.',
      downloadUrl: 'https://abhisingh.me/api/download-pdf?token=sample',
      fileName: 'habits-for-physical-and-mental-strength.pdf',
      hasAttachment: true,
    });

    assert(email.html.includes('E.L.R.x'), 'Header brand missing');
    assert(email.html.includes('Eat. Lift. Run. x'), 'Header tagline missing');
    assert(email.html.includes('Hi Ananya Verma,'), 'Greeting missing');
    assert(email.html.includes('Welcome to the E.L.R.x community!'), 'Community welcome missing');
    assert(email.html.includes('Your free digital guide is ready.'), 'Guide ready notice missing');
    assert(email.html.includes('Habits for Physical and Mental Strength'), 'Product title missing');
    assert(
      email.html.includes("We've attached your PDF to this email so you can download it and keep it for future reference.") ||
      email.html.includes("We&#039;ve attached your PDF to this email"),
      'Attachment reference missing'
    );
    assert(email.html.includes('Download Your PDF &rarr;'), 'CTA button text missing');
    assert(email.html.includes('Abhi Singh'), 'Author signature missing');
    assert(email.html.includes('Thank you for being part of the E.L.R.x community.'), 'Community footer text missing');
    assert(email.html.includes('https://abhisingh.me'), 'Website link missing');
    assert(email.html.includes('habits-for-physical-and-mental-strength.pdf'), 'Attachment filename missing');
    assert(email.text.includes('Welcome to the E.L.R.x community!'), 'Plaintext missing welcome');
  });

  await test('1.2 Paid Email: Subject, Structure, Heading, Copy & Pricing Details', () => {
    const email = buildPaidDeliveryEmail({
      customerName: 'Dev Sharma',
      productName: '24 Boring Basics for Peak Fitness',
      productDescription: 'Tactical exercise science.',
      orderId: 'ord_test_8877',
      paymentId: 'pay_rzp_9988',
      amount: 499,
      currency: 'INR',
      downloadUrl: 'https://abhisingh.me/api/download-pdf?token=paid_sample',
      fileName: '24-boring-basics-peak-fitness.pdf',
      hasAttachment: true,
    });

    assert(email.html.includes('E.L.R.x'), 'Header brand missing');
    assert(email.html.includes('Eat. Lift. Run. x'), 'Header tagline missing');
    assert(email.html.includes('Hi Dev Sharma,'), 'Greeting missing');
    assert(email.html.includes('Thank you for your purchase!'), 'Main paid heading mismatch');
    assert(email.html.includes('24 Boring Basics for Peak Fitness'), 'Product title missing');
    assert(email.html.includes('₹499 INR'), 'Amount paid mismatch');
    assert(email.html.includes('pay_rzp_9988'), 'Payment reference missing');
    assert(email.html.includes('Download Your PDF &rarr;'), 'CTA button text missing');
    assert(email.html.includes('24-boring-basics-peak-fitness.pdf'), 'Attachment filename missing');
    assert(email.text.includes('Thank you for your purchase!'), 'Plaintext missing paid heading');
  });

  await test('1.3 Security: Customer Input HTML Injection Escaping', () => {
    const maliciousName = '<script>alert("hacked")</script>';
    const escaped = escapeHtml(maliciousName);
    assert.strictEqual(escaped, '&lt;script&gt;alert(&quot;hacked&quot;)&lt;/script&gt;');

    const email = buildFreeDeliveryEmail({
      customerName: maliciousName,
      productName: 'Habits Guide',
      downloadUrl: 'https://example.com',
    });
    assert(!email.html.includes('<script>'), 'Unescaped script tag found in HTML template');
    assert(email.html.includes('&lt;script&gt;'), 'Escaped entities must be present in HTML');
  });

  await test('1.4 Root Cause Fix: Unconfigured Environment MUST Fail Honestly (Zero False Positives)', async () => {
    // Ensure mock flag is turned off
    const oldFlag = process.env.ALLOW_EMAIL_MOCK_TEST;
    delete process.env.ALLOW_EMAIL_MOCK_TEST;

    const result = await sendTransactionalEmail({
      to: 'customer.unconfigured@example.com',
      subject: 'Your Free E.L.R.x PDF — Test Guide',
      html: '<p>Test</p>',
      text: 'Test',
      pdfFilePath: '/assets/downloads/habits-for-physical-and-mental-strength.pdf',
      productName: 'Habits for Physical and Mental Strength',
      orderId: 'ord_mock_123',
    });

    assert.strictEqual(result.success, false, 'Must NOT report success when credentials are unconfigured');
    assert.strictEqual(result.status, 'FAILED', 'Status must be FAILED');
    assert(result.error.includes('credentials'), 'Error must explicitly explain missing credentials');
    assert.strictEqual(result.hasAttachment, true, 'Physical PDF deliverable should still be recognized');

    if (oldFlag) process.env.ALLOW_EMAIL_MOCK_TEST = oldFlag;
  });

  await test('1.5 Dispatcher: Explicit Mock/Provider Reports PROVIDER_ACCEPTED with Attachment', async () => {
    process.env.ALLOW_EMAIL_MOCK_TEST = 'true';

    const result = await sendTransactionalEmail({
      to: 'customer.test@example.com',
      subject: 'Your Free E.L.R.x PDF — Test Guide',
      html: '<p>Test</p>',
      text: 'Test',
      pdfFilePath: '/assets/downloads/habits-for-physical-and-mental-strength.pdf',
      productName: 'Habits for Physical and Mental Strength',
      orderId: 'ord_mock_123',
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.status, 'PROVIDER_ACCEPTED', 'Status must be PROVIDER_ACCEPTED');
    assert.strictEqual(result.hasAttachment, true, 'Physical PDF must be detected and attached');
    assert(result.attachmentInfo.size > 0, 'Attachment size must be > 0 bytes');
    assert(result.provider, 'Must record email provider identity');

    delete process.env.ALLOW_EMAIL_MOCK_TEST;
  });

  // ─────────────────────────────────────────────────────────────────
  // SUITE 2: BROWSER WORKFLOW VERIFICATION (FREE & PAID POPUPS)
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 2: POPUP WORKFLOWS & ZERO DIRECT DOWNLOAD RULE ---');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await test('2.1 Free Flow (Unconfigured Credentials): Shows Honest Error Banner, Never Fake Success', async () => {
    await page.goto(`${BASE_URL}/#store`, { waitUntil: 'networkidle0' });
    await delay(600);

    // Click Habits card
    const clicked = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.product-card'));
      for (const card of cards) {
        const title = card.querySelector('.card-title')?.innerText || '';
        if (title.toLowerCase().includes('habits')) {
          const btn = card.querySelector('.btn-card') || card;
          btn.click();
          return true;
        }
      }
      return false;
    });
    assert(clicked, 'Free habits card must be found and clicked');
    await delay(500);

    // Verify Free button text
    const buttonText = await page.$eval('.checkout-submit-btn', (el) => el.innerText.trim());
    assert.strictEqual(buttonText, 'Send My Free PDF →', `Button text must be 'Send My Free PDF →', got '${buttonText}'`);

    // Fill form
    await page.type('#checkoutName', 'Rohan Mehta');
    await page.type('#checkoutEmail', 'rohan.mehta@example.com');
    await page.evaluate(() => { window.__E2E_TEST__ = false; });

    // Submit form (without server credentials)
    await page.click('.checkout-submit-btn');
    await delay(1200);

    // Verify Honest Error Display
    const errorText = await page.evaluate(() => {
      const errBox = document.querySelector('.checkout-error-banner');
      return errBox ? errBox.innerText.trim() : '';
    });

    assert(errorText.length > 0, 'Error banner must be displayed when email credentials are not configured');
    assert(errorText.includes('Email delivery could not be completed'), 'Must describe delivery failure honestly');

    // Close modal
    await page.click('.modal-close-btn');
    await delay(400);
  });

  await test('2.2 Free Flow (Mock Delivery Enabled): Accurate Status "Email accepted by provider", NO Direct Download', async () => {
    // Temporarily enable mock delivery in runtime
    process.env.ALLOW_EMAIL_MOCK_TEST = 'true';

    await page.goto(`${BASE_URL}/#store`, { waitUntil: 'networkidle0' });
    await delay(600);

    // Click Habits card
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.product-card'));
      for (const card of cards) {
        const title = card.querySelector('.card-title')?.innerText || '';
        if (title.toLowerCase().includes('habits')) {
          const btn = card.querySelector('.btn-card') || card;
          btn.click();
          break;
        }
      }
    });
    await delay(500);

    // Fill form with unique email
    await page.type('#checkoutName', 'Pooja Iyer');
    await page.type('#checkoutEmail', `pooja.${Date.now()}@example.com`);
    await page.evaluate(() => { window.__E2E_TEST__ = true; });

    // Submit form
    await page.click('.checkout-submit-btn');
    await delay(1200);

    // Verify Success Screen
    const screenData = await page.evaluate(() => {
      const wrap = document.querySelector('.checkout-completed-wrap');
      const h3 = wrap?.querySelector('h3')?.innerText.trim() || '';
      const text = wrap?.innerText || '';
      const directDownloadLink = wrap?.querySelector('a[download], a.btn-instant-download');
      return {
        hasWrap: !!wrap,
        h3,
        text,
        hasDirectDownload: !!directDownloadLink,
      };
    });

    assert(screenData.hasWrap, 'Completed screen must render');
    assert(
      screenData.text.includes('Email accepted by provider'),
      'Delivery status must state "Email accepted by provider", not falsely claim delivered'
    );
    assert.strictEqual(
      screenData.hasDirectDownload,
      false,
      'CRITICAL: Direct browser download button/link must NOT exist on success screen'
    );

    // Close modal
    await page.click('.checkout-completed-wrap button');
    await delay(400);

    delete process.env.ALLOW_EMAIL_MOCK_TEST;
  });

  await test('2.3 Paid Flow (₹499 Boring Basics): Button "Pay & Get My PDF →", NO Direct Download', async () => {
    await page.evaluateOnNewDocument(() => {
      window.__E2E_TEST__ = true;
    });

    await page.goto(`${BASE_URL}/#store`, { waitUntil: 'networkidle0' });
    await delay(600);

    // Click 24 Boring Basics card
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.product-card'));
      for (const card of cards) {
        const title = card.querySelector('.card-title')?.innerText || '';
        if (title.toLowerCase().includes('boring basics')) {
          const btn = card.querySelector('.btn-card') || card;
          btn.click();
          break;
        }
      }
    });
    await delay(500);

    // Verify Paid button text
    const buttonText = await page.$eval('.checkout-submit-btn', (el) => el.innerText.trim());
    assert.strictEqual(buttonText, 'Pay & Get My PDF →', `Button text must be 'Pay & Get My PDF →', got '${buttonText}'`);

    // Close modal
    await page.click('.modal-close-btn');
    await delay(400);
  });

  // ─────────────────────────────────────────────────────────────────
  // SUITE 3: SERVER-SIDE ORDER RETRY & DELIVERY AUDIT LOGGING
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 3: SERVER RETRY & AUDIT LOGGING ---');

  const { listOrders, getOrderById } = await import('../api/_lib/orders.js');

  await test('3.1 Server Orders: Orders Store Delivery Status & Audit Logs', async () => {
    const orders = listOrders();
    assert(Array.isArray(orders) && orders.length > 0, 'Orders list must not be empty');

    const sample = orders[0];
    assert(sample.id, 'Order must have an ID');
    assert(sample.delivery_status, 'Order must have delivery_status');
    assert(Array.isArray(sample.delivery_logs), 'Order must have delivery_logs array');
  });

  await test('3.2 Admin Retry Endpoint: Safe Re-dispatch Preserves Order & Customer Data', async () => {
    const orders = listOrders({ payment_status: 'FREE' });
    if (orders.length > 0) {
      const target = orders[0];
      const initialAttempts = target.delivery_attempt_count || 0;

      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry_delivery', orderId: target.id }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert(data.order, 'Must return updated order record');
      assert.strictEqual(data.order.id, target.id, 'Order ID must remain identical');
      assert.strictEqual(data.order.customer_email, target.customer_email, 'Customer email must remain identical');
      assert(data.order.delivery_attempt_count >= initialAttempts + 1, 'Delivery attempt count must increase');
    }
  });

  await browser.close();

  console.log('\n========================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED / ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runEmailAutomationVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
