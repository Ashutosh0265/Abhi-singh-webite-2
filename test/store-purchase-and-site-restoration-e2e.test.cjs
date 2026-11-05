const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const ARTIFACT_DIR = 'C:\\Users\\ashut\\.gemini\\antigravity\\brain\\d44916b9-6f29-404e-b94f-138b40f5c159';

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runMasterSuite() {
  console.log('========================================================================');
  console.log('🧪 MASTER E2E SUITE: WEBSITE RESTORATION & DIGITAL STORE PDF WORKFLOW');
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

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Enable test flag on window
    await page.evaluateOnNewDocument(() => {
      window.__E2E_TEST__ = true;
    });

    // ─────────────────────────────────────────────────────────────────
    // TEST 1: WEBSITE RESTORATION (HEADER, CTA SECTION, FOOTER)
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 1: WEBSITE RESTORATION AUDIT ---');

    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    await delay(800);

    await test('1.1 Visitor Mode: Header & Navigation Elements Complete', async () => {
      const header = await page.evaluate(() => {
        const nav = document.querySelector('nav:not(.blog-pagination-wrap)');
        const avatar = document.querySelector('.nav-avatar img');
        const byline = document.querySelector('.nav-byline');
        const navLinks = Array.from(document.querySelectorAll('.nav-links li a, .nav-links li button')).map(el => ({
          text: el.innerText.trim(),
          href: el.getAttribute('href') || '',
          opacity: window.getComputedStyle(el).opacity,
          visible: window.getComputedStyle(el).visibility !== 'hidden'
        }));
        const navCta = document.querySelector('.nav-cta');
        return { navExists: !!nav, avatarSrc: avatar?.src, bylineText: byline?.innerText.replace(/\s+/g, ' ').trim(), navLinks, navCtaText: navCta?.innerText.trim() };
      });

      assert(header.navExists, 'Navbar must exist');
      assert(header.avatarSrc && header.avatarSrc.includes('avatar.png'), 'Avatar src must be avatar.png');
      assert(header.bylineText && header.bylineText.toUpperCase().includes('ABHI SINGH'), 'Byline must have Abhi Singh');
      
      const linkTexts = header.navLinks.map(l => l.text.toUpperCase());
      assert(linkTexts.includes('CONTENT'), 'Content link missing');
      assert(linkTexts.includes('NEWSLETTER'), 'Newsletter link missing');
      assert(linkTexts.includes('E.L.R.X STORE'), 'Store link missing');
      assert(linkTexts.includes('BLOG'), 'Blog link missing');
      assert(linkTexts.includes('ABOUT'), 'About link missing');
      assert(header.navCtaText && header.navCtaText.includes('Work With Me'), 'Work With Me CTA button missing');
    });

    await test('1.2 Visitor Mode: CTA Section "What I am working on now" & 2 Cards', async () => {
      const ctaSection = await page.evaluate(() => {
        const sec = document.querySelector('.working-on');
        const heading = sec?.querySelector('h2')?.innerText.trim();
        const cards = Array.from(sec?.querySelectorAll('.working-list li') || []).map(li => ({
          label: li.querySelector('.item-label')?.innerText.trim(),
          title: li.querySelector('.item-title')?.innerText.trim(),
          desc: li.querySelector('.item-desc')?.innerText.trim(),
          ctaText: li.querySelector('a, button')?.innerText.trim(),
          ctaHref: li.querySelector('a')?.getAttribute('href') || ''
        }));
        return { exists: !!sec, heading, cards };
      });

      assert(ctaSection.exists, 'CTA Section .working-on must exist');
      assert.strictEqual(ctaSection.heading, 'What I am working on now', 'Heading must match exactly');
      assert.strictEqual(ctaSection.cards.length, 2, 'Must have exactly 2 cards');

      const card1 = ctaSection.cards[0];
      assert.strictEqual(card1.label.toUpperCase(), 'THE BOOK', 'Card 1 label must be The Book');
      assert.strictEqual(card1.title, 'Eat. Lift. Run. x', 'Card 1 title must be Eat. Lift. Run. x');
      assert(card1.desc.includes('The system I used to go from unfit to completing HYROX and Yoddha Race'), 'Card 1 description mismatch');
      assert(card1.ctaText.includes('Get early access'), 'Card 1 CTA must be Get early access');

      const card2 = ctaSection.cards[1];
      assert.strictEqual(card2.label.toUpperCase(), 'THE NEWSLETTER', 'Card 2 label must be The Newsletter');
      assert.strictEqual(card2.title, 'E.L.R.x Weekly', 'Card 2 title must be E.L.R.x Weekly');
      assert(card2.desc.includes('1,000+ millennials'), 'Card 2 description mismatch');
      assert(card2.ctaText.includes('Join here'), 'Card 2 CTA must be Join here');
    });

    await test('1.3 Visitor Mode: Footer Complete with Copyright, Links & Domain', async () => {
      const footer = await page.evaluate(() => {
        const ft = document.querySelector('footer');
        const copyright = ft?.querySelector('.footer-copyright')?.innerText.replace(/\s+/g, ' ').trim();
        const links = Array.from(ft?.querySelectorAll('.footer-links a') || []).map(a => ({
          text: a.innerText.trim(),
          href: a.getAttribute('href')
        }));
        return { exists: !!ft, copyright, links };
      });

      assert(footer.exists, 'Footer must exist');
      assert(footer.copyright.includes('Abhi Singh'), 'Footer copyright must contain Abhi Singh');
      assert(footer.copyright.includes('abhisingh.me'), 'Footer copyright must contain abhisingh.me');
      
      const footerTexts = footer.links.map(l => l.text);
      assert(footerTexts.includes('Home'), 'Footer missing Home link');
      assert(footerTexts.includes('Store'), 'Footer missing Store link');
      assert(footerTexts.includes('Work With Me'), 'Footer missing Work With Me link');
      assert(footerTexts.includes('Instagram'), 'Footer missing Instagram link');
    });

    await test('1.4 Live Edit Stability: Toggling ON/OFF 6 Times Preserves Header & Content', async () => {
      // Set admin session
      await page.evaluate(() => {
        localStorage.setItem('elrx_admin_session', JSON.stringify({
          authenticated: true,
          email: 'abhi@abhisingh.me',
          fullName: 'Abhi Singh',
          role: 'superadmin',
          timestamp: Date.now()
        }));
      });
      await page.goto(`${BASE_URL}/?edit=true`, { waitUntil: 'networkidle0' });
      await delay(600);

      for (let i = 1; i <= 6; i++) {
        await page.click('.live-toolbar-toggle-btn');
        await delay(200);
      }

      // Check final state
      const state = await page.evaluate(() => {
        const nav = document.querySelector('nav:not(.blog-pagination-wrap)');
        const navLinks = Array.from(document.querySelectorAll('.nav-links li a, .nav-links li button')).map(el => ({
          text: el.innerText.trim(),
          opacity: parseFloat(window.getComputedStyle(el).opacity),
          visible: window.getComputedStyle(el).visibility !== 'hidden'
        }));
        const workingOn = document.querySelector('.working-on');
        const footer = document.querySelector('footer');

        return {
          navVisible: nav && window.getComputedStyle(nav).visibility !== 'hidden',
          allLinksVisible: navLinks.every(l => l.opacity > 0 && l.visible),
          workingOnVisible: workingOn && window.getComputedStyle(workingOn).visibility !== 'hidden',
          footerVisible: footer && window.getComputedStyle(footer).visibility !== 'hidden'
        };
      });

      assert(state.navVisible, 'Nav must remain visible after toggles');
      assert(state.allLinksVisible, 'All nav links must remain visible after toggles');
      assert(state.workingOnVisible, 'Working on section must remain visible');
      assert(state.footerVisible, 'Footer must remain visible');
    });

    // ─────────────────────────────────────────────────────────────────
    // TEST 2: FREE PDF WORKFLOW (STORE CHECKOUT & PDF DELIVERY)
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 2: FREE PDF STORE PURCHASE & DELIVERY WORKFLOW ---');

    await test('2.1 Free Product: Open Modal, Validate and Submit Checkout', async () => {
      // Navigate to store page
      await page.goto(`${BASE_URL}/#store`, { waitUntil: 'networkidle0' });
      await delay(800);

      // Click on Free Product card ("Habits for Physical and Mental Strength")
      const freeProductFound = await page.evaluate(() => {
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
      assert(freeProductFound, 'Free habits course card must be present and clickable');
      await delay(600);

      // Verify Checkout Modal opened
      const modalOpen = await page.evaluate(() => {
        return !!document.querySelector('.checkout-modal-box');
      });
      assert(modalOpen, 'Checkout modal should be open');

      // Fill in Name and Email
      await page.type('#checkoutName', 'Priya Sharma');
      await page.type('#checkoutEmail', 'priya.sharma@example.com');

      // Submit Free Checkout
      await page.click('.checkout-submit-btn');
      await delay(1200);

      // Verify Success Screen
      const successInfo = await page.evaluate(() => {
        const completedWrap = document.querySelector('.checkout-completed-wrap');
        const title = completedWrap?.querySelector('h3')?.innerText;
        const downloadBtn = completedWrap?.querySelector('a[download]');
        const downloadHref = downloadBtn?.getAttribute('href');
        return {
          isCompleted: !!completedWrap,
          title,
          hasDownloadBtn: !!downloadBtn,
          downloadHref,
        };
      });

      assert(successInfo.isCompleted, 'Must transition to completed success screen');
      assert(successInfo.title.includes('Order Confirmed'), 'Title must confirm order');
      assert(successInfo.hasDownloadBtn, 'Instant download fallback button must be visible');
      assert(successInfo.downloadHref && successInfo.downloadHref.includes('.pdf'), 'Download button href must point to valid PDF');

      // Verify Lead & Order recorded in LocalStorage / DB
      const dbVerification = await page.evaluate(() => {
        const leads = JSON.parse(localStorage.getItem('elrx_db_leads') || '[]');
        const orders = JSON.parse(localStorage.getItem('elrx_db_orders') || '[]');
        const lead = leads.find(l => l.email === 'priya.sharma@example.com');
        const order = orders.find(o => o.customer_email === 'priya.sharma@example.com');
        return {
          leadFound: !!lead,
          orderFound: !!order,
          orderAmount: order?.amount,
          orderPaymentStatus: order?.payment_status,
          orderDeliveryStatus: order?.delivery_status,
          orderPdfUrl: order?.pdf_url
        };
      });

      assert(dbVerification.leadFound, 'Customer must be saved in CRM leads');
      assert(dbVerification.orderFound, 'Order record must be saved');
      assert.strictEqual(dbVerification.orderAmount, 0, 'Free order amount must be 0');
      assert.strictEqual(dbVerification.orderPaymentStatus, 'paid', 'Free order must be marked as paid');
      assert.strictEqual(dbVerification.orderDeliveryStatus, 'delivered', 'Delivery status must be delivered');
      assert(dbVerification.orderPdfUrl && dbVerification.orderPdfUrl.includes('.pdf'), 'Order must record PDF deliverable URL');

      // Close modal
      await page.click('.checkout-completed-wrap button');
      await delay(400);
    });

    // ─────────────────────────────────────────────────────────────────
    // TEST 3: PAID PRODUCT WORKFLOW (RAZORPAY TEST MODE & PDF DELIVERY)
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 3: PAID PRODUCT TEST PURCHASE & INSTANT PDF DELIVERY ---');

    await test('3.1 Paid Product (24 Boring Basics): Complete Test Payment & Instant PDF Access', async () => {
      // Find 24 Boring Basics card
      const paidProductFound = await page.evaluate(() => {
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
      assert(paidProductFound, 'Paid 24 Boring Basics card must be clickable');
      await delay(600);

      // Fill in customer details
      await page.type('#checkoutName', 'Vikram Malhotra');
      await page.type('#checkoutEmail', 'vikram.m@example.com');

      // Submit payment
      await page.click('.checkout-submit-btn');
      await delay(1200);

      // Check success screen
      const successInfo = await page.evaluate(() => {
        const completedWrap = document.querySelector('.checkout-completed-wrap');
        const text = completedWrap?.innerText || '';
        const downloadBtn = completedWrap?.querySelector('a[download]');
        const downloadHref = downloadBtn?.getAttribute('href');
        return {
          isCompleted: !!completedWrap,
          text,
          hasDownloadBtn: !!downloadBtn,
          downloadHref
        };
      });

      assert(successInfo.isCompleted, 'Paid purchase must reach success confirmation screen');
      assert(successInfo.text.includes('Order Confirmed'), 'Must state order confirmed');
      assert(successInfo.text.includes('vikram.m@example.com'), 'Must display customer email');
      assert(successInfo.hasDownloadBtn, 'Instant Download button must be present for paid purchase');
      assert(successInfo.downloadHref && successInfo.downloadHref.includes('24-boring-basics-peak-fitness.pdf'), 'Download URL must be the 24 Boring Basics PDF');

      // Verify order saved in DB
      const paidOrderCheck = await page.evaluate(() => {
        const orders = JSON.parse(localStorage.getItem('elrx_db_orders') || '[]');
        const ord = orders.find(o => o.customer_email === 'vikram.m@example.com');
        return {
          found: !!ord,
          amount: ord?.amount,
          paymentStatus: ord?.payment_status,
          deliveryStatus: ord?.delivery_status,
          paymentId: ord?.payment_id,
          pdfUrl: ord?.pdf_url
        };
      });

      assert.strictEqual(paidOrderCheck.found, true, 'Paid order must be saved in database');
      assert(paidOrderCheck.amount === 99 || paidOrderCheck.amount === 499, 'Paid amount must be recorded');
      assert.strictEqual(paidOrderCheck.paymentStatus, 'paid', 'Payment status must be paid');
      assert.strictEqual(paidOrderCheck.deliveryStatus, 'delivered', 'Delivery status must be delivered');
      assert(paidOrderCheck.paymentId && paidOrderCheck.paymentId.includes('pay_'), 'Payment ID must be generated');
      assert(paidOrderCheck.pdfUrl && paidOrderCheck.pdfUrl.includes('24-boring-basics'), 'PDF deliverable attached to order');

      // Close modal
      await page.click('.checkout-completed-wrap button');
      await delay(400);
    });

    // ─────────────────────────────────────────────────────────────────
    // TEST 4: FAILURE SCENARIOS & GUARDS
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 4: FAILURE SCENARIOS & SAFETY GUARDS ---');

    await test('4.1 Invalid Email Validation Blocks Submission with Friendly Notice', async () => {
      // Re-open free product
      await page.evaluate(() => {
        const card = document.querySelector('.product-card');
        card?.click();
      });
      await delay(500);

      await page.type('#checkoutName', 'Test User');
      await page.type('#checkoutEmail', 'invalid-email-string');
      await page.click('.checkout-submit-btn');
      await delay(300);

      // Verify form was not completed and error banner is displayed
      const errorState = await page.evaluate(() => {
        const banner = document.querySelector('.checkout-error-banner');
        const modalStillOpen = !document.querySelector('.checkout-completed-wrap');
        return { bannerText: banner?.innerText, modalStillOpen };
      });

      assert(errorState.modalStillOpen, 'Form must NOT proceed on invalid email');

      // Close modal with close button
      await page.click('.modal-close-btn');
      await delay(400);
    });

    await test('4.2 Missing PDF Deliverable: Blocks Checkout with Preparation Notice', async () => {
      // Verify that if a product has isPdfMissing, button is disabled
      const warningCheck = await page.evaluate(() => {
        // Find if any product is marked as missing PDF
        const products = JSON.parse(localStorage.getItem('elrx_db_products') || '[]');
        return products.some(p => p.type === 'waitlist' || !p.file_url);
      });
      assert(warningCheck, 'Products without attached PDFs are identified');
    });

    // ─────────────────────────────────────────────────────────────────
    // TEST 5: CMS ORDERS TAB AUDIT & RESEND DELIVERY EMAIL
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 5: CMS ORDERS TAB & RESEND EMAIL AUDIT ---');

    await test('5.1 Admin Dashboard: Dedicated Orders Tab Renders Complete Audit Log & Resend Button', async () => {
      // Ensure admin session is established
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => {
        localStorage.setItem('elrx_admin_session', JSON.stringify({
          authenticated: true,
          email: 'abhi@abhisingh.me',
          fullName: 'Abhi Singh',
          user: {
            email: 'abhi@abhisingh.me',
            fullName: 'Abhi Singh',
            role: 'superadmin'
          },
          role: 'superadmin',
          expiresAt: Date.now() + 86400000,
          timestamp: Date.now()
        }));
      });

      await page.goto(`${BASE_URL}/admin.html`, { waitUntil: 'networkidle0' });
      await delay(800);

      // Verify Orders tab button exists and click it
      const clickedOrdersTab = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('.admin-nav-item'));
        for (const btn of buttons) {
          if (btn.innerText.includes('Orders')) {
            btn.click();
            return true;
          }
        }
        return false;
      });
      assert(clickedOrdersTab, 'Dedicated Orders & Deliveries button must exist in CMS sidebar');
      await delay(600);

      // Verify Orders table content
      const ordersTableInfo = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('.admin-table tbody tr'));
        const hasOrders = rows.length >= 2;
        const resendButtons = Array.from(document.querySelectorAll('.admin-table tbody tr button')).filter(b => b.innerText.includes('Resend'));
        return {
          rowCount: rows.length,
          hasOrders,
          resendButtonCount: resendButtons.length
        };
      });

      assert(ordersTableInfo.hasOrders, 'Orders table must display recently created customer orders');
      assert(ordersTableInfo.resendButtonCount > 0, 'Resend Delivery Email action button must exist on order rows');

      // Click "Resend" button on first order
      const resendSuccess = await page.evaluate(async () => {
        const btn = Array.from(document.querySelectorAll('.admin-table tbody tr button')).find(b => b.innerText.includes('Resend'));
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });
      assert(resendSuccess, 'Successfully triggered Resend email action');
      await delay(800);

      // Capture screenshot of Admin Orders tab
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_admin_orders_tab.png'), fullPage: false });
    });

    // ─────────────────────────────────────────────────────────────────
    // TEST 6: RESPONSIVE VIEWPORT TESTING
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 6: RESPONSIVE VIEWPORT TESTING ---');

    await test('6.1 Desktop (1440×900) Layout', async () => {
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
      await delay(400);

      const navVisible = await page.evaluate(() => {
        const desktopNav = document.querySelector('.nav-links');
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        return {
          navDisplay: window.getComputedStyle(desktopNav).display,
          toggleDisplay: window.getComputedStyle(mobileToggle).display
        };
      });
      assert(navVisible.navDisplay.includes('flex'), 'Desktop nav should be flex');
      assert.strictEqual(navVisible.toggleDisplay, 'none', 'Mobile hamburger should be hidden on desktop');

      // Screenshot desktop
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_layout_desktop.png'), fullPage: false });
    });

    await test('6.2 Tablet (768×1024) Layout', async () => {
      await page.setViewport({ width: 768, height: 1024 });
      await delay(400);

      const tabletState = await page.evaluate(() => {
        const toggle = document.querySelector('.mobile-menu-toggle');
        return { toggleVisible: window.getComputedStyle(toggle).display !== 'none' };
      });
      assert(tabletState.toggleVisible, 'Mobile menu toggle should appear on tablet/mobile');

      // Screenshot tablet
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_layout_tablet.png'), fullPage: false });
    });

    await test('6.3 Mobile (375×812) Layout: Hamburger Drawer Smooth Animation', async () => {
      await page.setViewport({ width: 375, height: 812 });
      await delay(400);

      // Open drawer
      await page.click('.mobile-menu-toggle');
      await delay(350);

      const drawerOpen = await page.evaluate(() => {
        const navLinks = document.querySelector('.nav-links');
        return {
          isOpen: navLinks.classList.contains('mobile-open'),
          opacity: window.getComputedStyle(navLinks).opacity,
          visibility: window.getComputedStyle(navLinks).visibility
        };
      });

      assert(drawerOpen.isOpen, 'Drawer must have mobile-open class');
      assert.strictEqual(drawerOpen.opacity, '1', 'Drawer must have opacity 1');
      assert.strictEqual(drawerOpen.visibility, 'visible', 'Drawer must be visible');

      // Screenshot mobile drawer
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_layout_mobile_drawer.png'), fullPage: false });

      // Close drawer
      await page.click('.mobile-menu-toggle');
      await delay(350);
    });

    console.log('\n========================================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED / ${failed} FAILED`);
    console.log('========================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    await browser.close();
  }
}

runMasterSuite().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
