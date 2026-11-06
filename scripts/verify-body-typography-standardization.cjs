const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const ARTIFACTS_DIR = 'C:\\Users\\ashut\\.gemini\\antigravity\\brain\\d44916b9-6f29-404e-b94f-138b40f5c159';

async function runVerification() {
  console.log('=== VERIFYING BODY TEXT TYPOGRAPHY STANDARDIZATION ===\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. Desktop Reference & Audit (1440x900)
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/#home`, { waitUntil: 'networkidle0' });

  // Open newsletter popup to inspect reference paragraph
  await page.evaluate(() => sessionStorage.removeItem('elrx_popup_dismissed'));
  await new Promise(r => setTimeout(r, 6500));
  await page.evaluate(() => document.dispatchEvent(new MouseEvent('mouseleave', { clientY: 5 })));
  await page.waitForSelector('.newsletter-popup-desc', { timeout: 5000 });

  const refValues = await page.evaluate(() => {
    const el = document.querySelector('.newsletter-popup-desc');
    const cs = window.getComputedStyle(el);
    return {
      fontSize: cs.fontSize,
      exactPx: parseFloat(cs.fontSize),
      lineHeight: cs.lineHeight,
      fontWeight: cs.fontWeight,
      fontFamily: cs.fontFamily,
      text: el.innerText.trim()
    };
  });

  console.log('REFERENCE PARAGRAPH (Popup):');
  console.log(refValues);

  // Close popup
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.modal-close-btn');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Collect Homepage Body Elements
  const homeElements = await page.evaluate(() => {
    const list = [
      { name: 'Hero Subheadline 1', sel: '.book-content p:nth-of-type(1)' },
      { name: 'Hero Subheadline 2', sel: '.book-content p:nth-of-type(2)' },
      { name: 'Whats Inside list item 1', sel: '.wi-list li:nth-child(1)' },
      { name: 'Whats Inside list item 2', sel: '.wi-list li:nth-child(2)' },
      { name: 'About bio p1', sel: '.about-bio p:nth-of-type(1)' },
      { name: 'About bio p2', sel: '.about-bio p:nth-of-type(2)' },
      { name: 'About bio p3', sel: '.about-bio p:nth-of-type(3)' },
      { name: 'Blog section subtext', sel: '.blog-section .section-subtext' },
      { name: 'Blog card summary', sel: '.blog-card-summary' },
      { name: 'Working On item desc', sel: '.item-desc' },
      { name: 'Footer newsletter sub', sel: '.footer-signup-text .sub' },
      { name: 'Footer tagline', sel: '.hero-tagline' }
    ];
    return list.map(item => {
      const el = document.querySelector(item.sel);
      if (!el) return { name: item.name, found: false };
      const cs = window.getComputedStyle(el);
      return {
        name: item.name,
        found: true,
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        snippet: el.innerText.replace(/\s+/g, ' ').slice(0, 35)
      };
    });
  });

  console.log('\n--- HOMEPAGE BODY TEXT AUDIT (Desktop 1440px) ---');
  console.table(homeElements);

  // Store Page Audit
  await page.goto(`${BASE_URL}/#store`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  const storeElements = await page.evaluate(() => {
    const list = [
      { name: 'Store Subtitle', sel: '.store-page .page-wrap p, [data-content-key="store.subtitle"]' },
      { name: 'Product Card 1 Tagline', sel: '.upcoming-grid .product-card:nth-child(1) .card-tagline' },
      { name: 'Product Card 2 Tagline', sel: '.upcoming-grid .product-card:nth-child(2) .card-tagline' }
    ];
    return list.map(item => {
      const el = document.querySelector(item.sel);
      if (!el) return { name: item.name, found: false };
      const cs = window.getComputedStyle(el);
      return {
        name: item.name,
        found: true,
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        snippet: el.innerText.replace(/\s+/g, ' ').slice(0, 35)
      };
    });
  });

  console.log('\n--- STORE PAGE BODY TEXT AUDIT (Desktop 1440px) ---');
  console.table(storeElements);

  // Work With Me Audit
  await page.goto(`${BASE_URL}/#work-with-me`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  const wwmElements = await page.evaluate(() => {
    const list = [
      { name: 'Work With Me Subtitle', sel: '.work-with-me-page .page-wrap p, [data-content-key="workWithMe.subtitle"]' }
    ];
    return list.map(item => {
      const el = document.querySelector(item.sel);
      if (!el) return { name: item.name, found: false };
      const cs = window.getComputedStyle(el);
      return {
        name: item.name,
        found: true,
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        snippet: el.innerText.replace(/\s+/g, ' ').slice(0, 35)
      };
    });
  });
  console.log('\n--- WORK WITH ME BODY TEXT AUDIT (Desktop 1440px) ---');
  console.table(wwmElements);

  // Archive Page Audit
  await page.goto(`${BASE_URL}/#archive`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));
  const archiveElements = await page.evaluate(() => {
    const list = [
      { name: 'Archive Subtitle', sel: '.newsletter-archive-page .page-wrap p, [data-content-key="archive.subtitle"]' },
      { name: 'Archive Edition Summary', sel: '.product-card p' }
    ];
    return list.map(item => {
      const el = document.querySelector(item.sel);
      if (!el) return { name: item.name, found: false };
      const cs = window.getComputedStyle(el);
      return {
        name: item.name,
        found: true,
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        snippet: el.innerText.replace(/\s+/g, ' ').slice(0, 35)
      };
    });
  });
  console.log('\n--- ARCHIVE PAGE BODY TEXT AUDIT (Desktop 1440px) ---');
  console.table(archiveElements);

  // 2. Responsive Audit: Tablet (768px) and Mobile (375px)
  const viewports = [
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 }
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto(`${BASE_URL}/#home`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    const vpAudit = await page.evaluate(() => {
      const targets = [
        { name: 'Hero Subheadline 1', sel: '.book-content p:nth-of-type(1)' },
        { name: 'Whats Inside item', sel: '.wi-list li:nth-child(1)' },
        { name: 'About bio p1', sel: '.about-bio p:nth-of-type(1)' },
        { name: 'Blog section subtext', sel: '.blog-section .section-subtext' },
        { name: 'Footer subheadline', sel: '.footer-signup-text .sub' }
      ];
      return targets.map(t => {
        const el = document.querySelector(t.sel);
        if (!el) return { name: t.name, found: false };
        const cs = window.getComputedStyle(el);
        return {
          name: t.name,
          fontSize: cs.fontSize,
          lineHeight: cs.lineHeight
        };
      });
    });

    console.log(`\n--- RESPONSIVE AUDIT: ${vp.name} (${vp.width}x${vp.height}) ---`);
    console.table(vpAudit);
  }

  // 3. Headings Verification (Verify H1-H3 sizes & weights are protected)
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/#home`, { waitUntil: 'networkidle0' });
  const headingsAudit = await page.evaluate(() => {
    const list = [
      { name: 'Hero H1', sel: '.hero-headline, .book-content h1' },
      { name: 'Whats Inside H2', sel: '.whats-inside h2' },
      { name: 'About H2', sel: '.about-bio h2' },
      { name: 'Blog H2', sel: '.blog-section h2' },
      { name: 'Blog Card H3', sel: '.blog-card-title' }
    ];
    return list.map(item => {
      const el = document.querySelector(item.sel);
      if (!el) return { name: item.name, found: false };
      const cs = window.getComputedStyle(el);
      return {
        name: item.name,
        tag: el.tagName,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        fontFamily: cs.fontFamily.split(',')[0].replace(/['"]/g, '')
      };
    });
  });

  console.log('\n--- HEADINGS INTEGRITY AUDIT (Strict Rules Verification) ---');
  console.table(headingsAudit);

  // 4. Capture Verification Screenshot
  const screenshotPath = path.join(ARTIFACTS_DIR, 'verified_standardized_body_typography.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`\nScreenshot saved: ${screenshotPath}`);

  await browser.close();
  console.log('\n=== VERIFICATION COMPLETE ===');
}

runVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
