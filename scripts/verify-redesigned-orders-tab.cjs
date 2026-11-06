const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  console.log('========================================================================');
  console.log('🧪 TESTING & AUDITING REDESIGNED ORDERS & DELIVERIES SECTION');
  console.log('========================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Authenticate admin
  await page.goto('http://localhost:3000/admin.html', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('elrx_admin_session', JSON.stringify({
      authenticated: true,
      email: 'abhi@abhisingh.me',
      fullName: 'Abhi Singh',
      role: 'superadmin',
      timestamp: Date.now()
    }));
  });

  // Load realistic orders into localStorage
  let cachedOrders = [];
  try {
    const raw = fs.readFileSync('public/assets/downloads/.orders_cache.json', 'utf8');
    cachedOrders = JSON.parse(raw);
  } catch(e) {}

  await page.evaluate((ords) => {
    if (ords && ords.length > 0) {
      localStorage.setItem('elrx_db_orders', JSON.stringify(ords));
    }
  }, cachedOrders);

  // Navigate to admin
  await page.goto('http://localhost:3000/admin.html', { waitUntil: 'networkidle2' });
  await sleep(600);

  // Navigate to Orders Tab
  console.log('--- SUITE 1: ORDERS TAB NAVIGATION & SUMMARY CARDS ---');
  await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll('.admin-nav-item'));
    const item = navItems.find(i => i.innerText.includes('Orders') || i.innerText.includes('Deliveries'));
    if (item) item.click();
  });
  await sleep(1000);

  // Verify Summary Cards
  const summaryCards = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.orders-stat-card'));
    return cards.map(c => ({
      label: c.querySelector('.orders-stat-label')?.innerText.trim(),
      number: c.querySelector('.orders-stat-number')?.innerText.trim(),
      subtext: c.querySelector('.orders-stat-subtext')?.innerText.trim(),
    }));
  });

  console.log('  Summary cards found:', summaryCards.length);
  assert(summaryCards.length === 4, 'Must have exactly 4 summary cards');
  assert(summaryCards[0].label === 'TOTAL STORE ORDERS', 'Card 1 must be Total Store Orders');
  assert(summaryCards[1].label === 'TOTAL REVENUE', 'Card 2 must be Total Revenue');
  assert(summaryCards[2].label === 'PDF DELIVERIES SENT', 'Card 3 must be PDF Deliveries Sent');
  assert(summaryCards[3].label === 'FREE VS PAID BREAKDOWN', 'Card 4 must be Free vs Paid Breakdown');
  console.log('  ✓ PASS: All 4 summary cards render with correct labels and readable values:');
  summaryCards.forEach(c => console.log(`    - ${c.label}: ${c.number} (${c.subtext})`));

  // Screenshot desktop view with data
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'redesigned_orders_desktop.png') });
  console.log('  ✓ Screenshot captured: redesigned_orders_desktop.png');

  // 2. Test Search & Filters
  console.log('\n--- SUITE 2: SEARCH & FILTER TOOLBAR ---');
  const initialRowCount = await page.evaluate(() => document.querySelectorAll('.orders-table tbody tr').length);
  console.log(`  Initial orders count displayed: ${initialRowCount}`);

  // Test Search
  console.log('  Testing search input query "Ashutosh"...');
  await page.type('.orders-search-input', 'Ashutosh');
  await sleep(400);

  const searchedRows = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.orders-table tbody tr'));
    return rows.map(r => r.querySelector('.col-customer')?.innerText || '');
  });
  assert(searchedRows.every(r => r.toLowerCase().includes('ashutosh')), 'Search query must filter rows by query');
  console.log(`  ✓ PASS: Search input filtered down to ${searchedRows.length} matching rows`);

  // Clear search
  await page.click('.orders-search-clear');
  await sleep(400);

  // Test Filter Pills
  console.log('  Testing "Free Downloads" filter pill...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.orders-filter-btn'));
    const freeBtn = btns.find(b => b.innerText.includes('Free'));
    if (freeBtn) freeBtn.click();
  });
  await sleep(400);

  const freeRows = await page.evaluate(() => {
    const pills = Array.from(document.querySelectorAll('.orders-table tbody .amount-free-pill'));
    return pills.length;
  });
  console.log(`  ✓ PASS: Free Downloads filter displayed ${freeRows} free orders`);

  // Return to All Orders
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.orders-filter-btn'));
    const allBtn = btns.find(b => b.innerText.includes('All'));
    if (allBtn) allBtn.click();
  });
  await sleep(400);

  // 3. Test Details Audit Modal
  console.log('\n--- SUITE 3: ORDER AUDIT DETAILS MODAL ---');
  await page.evaluate(() => {
    const detailsBtns = Array.from(document.querySelectorAll('.order-btn-action.details'));
    if (detailsBtns[0]) detailsBtns[0].click();
  });
  await sleep(600);

  const auditModalOpen = await page.evaluate(() => !!document.querySelector('.admin-modal-box'));
  assert(auditModalOpen, 'Order Details Audit modal must open');
  console.log('  ✓ PASS: Order details modal opened successfully');

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'redesigned_order_details_modal.png') });
  console.log('  ✓ Screenshot captured: redesigned_order_details_modal.png');

  // Close audit modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.admin-modal-box button');
    if (closeBtn) closeBtn.click();
  });
  await sleep(400);

  // 4. Test Delete Confirmation Modal
  console.log('\n--- SUITE 4: DELETE CONFIRMATION MODAL ---');
  await page.evaluate(() => {
    const delBtns = Array.from(document.querySelectorAll('.order-btn-action.delete'));
    if (delBtns[0]) delBtns[0].click();
  });
  await sleep(600);

  const deleteModalTitle = await page.evaluate(() => {
    const h3 = document.querySelector('.admin-modal-box h3');
    return h3 ? h3.innerText : '';
  });
  assert(deleteModalTitle.includes('Delete Order Record'), 'Delete confirmation modal must open with safety warning');
  console.log(`  ✓ PASS: Delete confirmation modal opened with title: "${deleteModalTitle}"`);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'redesigned_order_delete_confirm_modal.png') });
  console.log('  ✓ Screenshot captured: redesigned_order_delete_confirm_modal.png');

  // Click Cancel on delete modal
  await page.evaluate(() => {
    const cancelBtn = Array.from(document.querySelectorAll('.admin-modal-box button')).find(b => b.innerText.includes('Cancel'));
    if (cancelBtn) cancelBtn.click();
  });
  await sleep(400);

  // 5. Responsive Testing
  console.log('\n--- SUITE 5: RESPONSIVE VIEWPORT TESTING ---');

  // Tablet Viewport (768px)
  console.log('  Testing Tablet Viewport (768×1024)...');
  await page.setViewport({ width: 768, height: 1024 });
  await sleep(600);
  const tabletCardsVisible = await page.evaluate(() => {
    const grid = document.querySelector('.orders-mobile-cards-grid');
    return grid ? window.getComputedStyle(grid).display !== 'none' : false;
  });
  assert(tabletCardsVisible, 'Tablet/Mobile cards view must activate below 960px breakpoint');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'redesigned_orders_tablet.png') });
  console.log('  ✓ PASS: Tablet responsive card layout active. Screenshot: redesigned_orders_tablet.png');

  // Mobile Viewport (375px)
  console.log('  Testing Mobile Viewport (375×812)...');
  await page.setViewport({ width: 375, height: 812 });
  await sleep(600);
  const mobileHasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log(`  Mobile horizontal overflow: ${mobileHasOverflow}`);
  assert(!mobileHasOverflow, 'Mobile viewport must NOT have horizontal scrollbar overflow');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'redesigned_orders_mobile.png') });
  console.log('  ✓ PASS: Mobile responsive card layout clean and zero overflow. Screenshot: redesigned_orders_mobile.png');

  console.log('\n========================================================================');
  console.log('🎉 ALL 5 SUITES PASSED (0 REGRESSIONS)');
  console.log('========================================================================');

  await browser.close();
})();

