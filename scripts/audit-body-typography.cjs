const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

async function auditTypography() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Check Popup paragraph
  await page.goto(`${BASE_URL}/#home`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => sessionStorage.removeItem('elrx_popup_dismissed'));
  await new Promise(r => setTimeout(r, 6500));
  await page.evaluate(() => document.dispatchEvent(new MouseEvent('mouseleave', { clientY: 5 })));
  await page.waitForSelector('.newsletter-popup-desc', { timeout: 4000 });

  const popupRef = await page.evaluate(() => {
    const el = document.querySelector('.newsletter-popup-desc');
    const cs = window.getComputedStyle(el);
    return {
      cssDecl: '0.98rem',
      fontSize: cs.fontSize,
      exactPx: parseFloat(cs.fontSize),
      lineHeight: cs.lineHeight,
      fontWeight: cs.fontWeight,
      fontFamily: cs.fontFamily
    };
  });
  console.log('--- REFERENCE PARAGRAPH (Popup Desc) ---');
  console.log(popupRef);

  // 2. Audit all body text on HomePage
  const homeAudit = await page.evaluate(() => {
    // Select all paragraphs, descriptions, list text, cards, etc.
    const selectors = [
      { name: 'Hero subheadline 1', sel: '.book-content p:nth-of-type(1)' },
      { name: 'Hero subheadline 2', sel: '.book-content p:nth-of-type(2)' },
      { name: 'Whats inside list items', sel: '.wi-list li span' },
      { name: 'About paragraph 1', sel: '.about-bio p:nth-of-type(1)' },
      { name: 'About paragraph 2', sel: '.about-bio p:nth-of-type(2)' },
      { name: 'About paragraph 3', sel: '.about-bio p:nth-of-type(3)' },
      { name: 'Blog section subtitle', sel: '.blog-section .section-subtitle' },
      { name: 'Blog card excerpt', sel: '.blog-card-excerpt' },
      { name: 'Blog card metadata', sel: '.blog-card-meta' },
      { name: 'Working on book desc', sel: '.working-on-card p' },
      { name: 'Working on list desc', sel: '.working-on-items p' },
      { name: 'Footer signup subheadline', sel: '.footer-signup-text p' },
      { name: 'Footer guarantee/tagline', sel: '.footer-tagline' }
    ];

    return selectors.map(item => {
      const el = document.querySelector(item.sel);
      if (!el) return { name: item.name, found: false };
      const cs = window.getComputedStyle(el);
      return {
        name: item.name,
        found: true,
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        textSnippet: el.innerText.slice(0, 35)
      };
    });
  });

  console.log('\n--- HOMEPAGE BODY TEXT AUDIT ---');
  console.table(homeAudit);

  // 3. Audit StorePage
  await page.goto(`${BASE_URL}/#store`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  const storeAudit = await page.evaluate(() => {
    const selectors = [
      { name: 'Store subtitle', sel: '.store-header p, [data-content-key="store.subtitle"]' },
      { name: 'Product card description', sel: '.product-card-desc, .product-description, .product-card p' },
      { name: 'Upcoming product desc', sel: '.upcoming-card p, .coming-soon-desc' }
    ];
    return selectors.map(item => {
      const el = document.querySelector(item.sel);
      if (!el) return { name: item.name, found: false };
      const cs = window.getComputedStyle(el);
      return {
        name: item.name,
        found: true,
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        textSnippet: el.innerText.slice(0, 35)
      };
    });
  });
  console.log('\n--- STOREPAGE BODY TEXT AUDIT ---');
  console.table(storeAudit);

  // 4. Audit WorkWithMePage
  await page.goto(`${BASE_URL}/#work-with-me`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  const wwmAudit = await page.evaluate(() => {
    const selectors = [
      { name: 'Work with me subtitle', sel: '[data-content-key="workWithMe.subtitle"], .wwm-header-anim' },
      { name: 'Work with me form labels / text', sel: '.form-group label, .wwm-form p' }
    ];
    return selectors.map(item => {
      const el = document.querySelector(item.sel);
      if (!el) return { name: item.name, found: false };
      const cs = window.getComputedStyle(el);
      return {
        name: item.name,
        found: true,
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        textSnippet: el.innerText.slice(0, 35)
      };
    });
  });
  console.log('\n--- WORK WITH ME BODY TEXT AUDIT ---');
  console.table(wwmAudit);

  // 5. Audit NewsletterArchivePage
  await page.goto(`${BASE_URL}/#archive`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  const archiveAudit = await page.evaluate(() => {
    const selectors = [
      { name: 'Archive header subtitle', sel: '.archive-header p' },
      { name: 'Archive card excerpt', sel: '.newsletter-card-excerpt, .archive-item p' }
    ];
    return selectors.map(item => {
      const el = document.querySelector(item.sel);
      if (!el) return { name: item.name, found: false };
      const cs = window.getComputedStyle(el);
      return {
        name: item.name,
        found: true,
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        textSnippet: el.innerText.slice(0, 35)
      };
    });
  });
  console.log('\n--- ARCHIVE PAGE BODY TEXT AUDIT ---');
  console.table(archiveAudit);

  await browser.close();
}

auditTypography().catch(console.error);

