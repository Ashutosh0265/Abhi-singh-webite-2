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
  // SUITE 1: UNIT / INTEGRATION VERIFICATION OF BRANDED EMAIL TEMPLATES
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
    assert(email.html.includes('Your free PDF is ready!'), 'Main heading mismatch');
    assert(email.html.includes('Habits for Physical and Mental Strength'), 'Product title missing');
    assert(email.html.includes('Your digital resource is ready. We&#039;ve attached your PDF to this email') || email.html.includes("We've attached your PDF to this email"), 'Delivery text missing');
    assert(email.html.includes('Download Your PDF &rarr;'), 'CTA button text missing');
    assert(email.html.includes('Thank you for being part of the E.L.R.x community.'), 'Community footer text missing');
    assert(email.html.includes('https://abhisingh.me'), 'Website link missing');
    assert(email.html.includes('habits-for-physical-and-mental-strength.pdf'), 'Attachment filename missing');
    assert(email.text.includes('Your free PDF is ready!'), 'Plaintext missing free heading');
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

  await test('1.4 Dispatcher: Supports Attachment & Safe Sandbox Fallback', async () => {
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
    assert.strictEqual(result.hasAttachment, true, 'Physical PDF must be detected and attached');
    assert(result.provider, 'Must record email provider identity');
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

  // Expose e2e test flag
  await page.evaluateOnNewDocument(() => {
    window.__E2E_TEST__ = true;
  });

  // Intercept downloads to ensure NO direct downloads trigger
  let downloadTriggered = false;
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: path.resolve(__dirname, '../.tmp_downloads'),
  });

  await test('2.1 Free Flow: Button "Send My Free PDF →", Correct Messages, NO Direct Download', async () => {
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
    const buttonText = await page.$eval('.checkout-submit-btn', el => el.innerText.trim());
    assert.strictEqual(buttonText, 'Send My Free PDF →', `Button text must be 'Send My Free PDF →', got '${buttonText}'`);

    // Fill form
    await page.type('#checkoutName', 'Rohan Mehta');
    await page.type('#checkoutEmail', 'rohan.mehta@example.com');

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
    assert.strictEqual(
      screenData.h3,
      'Your PDF is on its way! Please check your inbox.',
      `Heading must be exact required string, got: '${screenData.h3}'`
    );
    assert(
      screenData.text.includes("If you don't see the email, please check your spam or promotions folder."),
      'Secondary instruction must be present'
    );
    assert.strictEqual(
      screenData.hasDirectDownload,
      false,
      'CRITICAL: Direct browser download button/link must NOT exist on success screen'
    );

    // Close modal
    await page.click('.checkout-completed-wrap button');
    await delay(400);
  });

  await test('2.2 Paid Flow (₹499 Boring Basics): Button "Pay & Get My PDF →", Success Message, NO Direct Download', async () => {
    // Click 24 Boring Basics card
    const clicked = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.product-card'));
      for (const card of cards) {
        const title = card.querySelector('.card-title')?.innerText || '';
        if (title.toLowerCase().includes('boring basics')) {
          const btn = card.querySelector('.btn-card') || card;
          btn.click();
          return true;
        }
      }
      return false;
    });
    assert(clicked, 'Paid Boring Basics card must be found and clicked');
    await delay(500);

    // Verify Paid button text
    const buttonText = await page.$eval('.checkout-submit-btn', el => el.innerText.trim());
    assert.strictEqual(buttonText, 'Pay & Get My PDF →', `Button text must be 'Pay & Get My PDF →', got '${buttonText}'`);

    // Fill form
    await page.type('#checkoutName', 'Sameer Kapoor');
    await page.type('#checkoutEmail', 'sameer.k@example.com');

    // Submit payment
    await page.click('.checkout-submit-btn');
    await delay(1400);

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
    assert.strictEqual(
      screenData.h3,
      'Payment successful! Your PDF has been sent to your email address.',
      `Heading must be exact required string, got: '${screenData.h3}'`
    );
    assert(
      screenData.text.includes("If you don't see the email, please check your spam or promotions folder."),
      'Secondary instruction must be present'
    );
    assert.strictEqual(
      screenData.hasDirectDownload,
      false,
      'CRITICAL: Direct browser download button/link must NOT exist on success screen'
    );

    // Close modal
    await page.click('.checkout-completed-wrap button');
    await delay(400);
  });

  await browser.close();

  console.log('\n========================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED / ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runEmailAutomationVerification().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
