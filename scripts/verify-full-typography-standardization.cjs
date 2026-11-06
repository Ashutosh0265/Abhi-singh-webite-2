const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const ARTIFACTS_DIR = 'C:\\Users\\ashut\\.gemini\\antigravity\\brain\\d44916b9-6f29-404e-b94f-138b40f5c159';

async function verifyFullTypography() {
  console.log('================================================================');
  console.log('🚀 RUNNING COMPREHENSIVE TYPOGRAPHY STANDARDIZATION VERIFICATION');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  // ─────────────────────────────────────────────────────────────
  // 1. DESKTOP VERIFICATION (1440x900)
  // ─────────────────────────────────────────────────────────────
  await page.setViewport({ width: 1440, height: 900 });

  console.log('--- [1/6] AUDITING UNIFIED H1 HEADINGS (Desktop 1440px) ---');
  const h1Pages = [
    { page: 'Home Hero H1', url: `${BASE_URL}/#home`, sel: '.hero-headline, h1' },
    { page: 'Store Page H1', url: `${BASE_URL}/#store`, sel: '.store-page h1' },
    { page: 'Archive Page H1', url: `${BASE_URL}/#archive`, sel: '.newsletter-archive-page h1' }
  ];

  const h1Results = [];
  for (const item of h1Pages) {
    await page.goto(item.url, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 400));
    const data = await page.evaluate((sel, name) => {
      const el = document.querySelector(sel);
      if (!el) return { name, found: false };
      const cs = window.getComputedStyle(el);
      return {
        name,
        tag: el.tagName,
        text: el.innerText.replace(/\s+/g, ' ').slice(0, 30),
        fontSize: cs.fontSize,
        exactPx: parseFloat(cs.fontSize),
        fontWeight: cs.fontWeight,
        fontFamily: cs.fontFamily.split(',')[0].replace(/['"]/g, ''),
        lineHeight: cs.lineHeight
      };
    }, item.sel, item.page);
    h1Results.push(data);
  }
  console.table(h1Results);

  const h1AllSame = h1Results.every(r => Math.abs(r.exactPx - h1Results[0].exactPx) < 0.5 && r.fontWeight === '700' && r.fontFamily === 'Lora');
  console.log(`✓ H1 Hierarchy Unified: ${h1AllSame ? 'PASSED (All exact ' + h1Results[0].fontSize + ')' : 'FAILED'}\n`);

  console.log('--- [2/6] AUDITING UNIFIED H2 HEADINGS (Desktop 1440px) ---');
  await page.goto(`${BASE_URL}/#home`, { waitUntil: 'networkidle0' });
  const h2Results = await page.evaluate(() => {
    const targets = [
      { name: "Home: What's inside", sel: '.whats-inside h2' },
      { name: "Home: Who Is Abhi Singh?", sel: '.about-bio h2' },
      { name: "Home: From The Blog", sel: '.blog-section h2' },
      { name: "Home: Working on now", sel: '.working-on h2' },
      { name: "Home: Footer Newsletter", sel: '.footer-signup-text h2' }
    ];
    return targets.map(t => {
      const el = document.querySelector(t.sel);
      if (!el) return { name: t.name, found: false };
      const cs = window.getComputedStyle(el);
      return {
        name: t.name,
        tag: el.tagName,
        fontSize: cs.fontSize,
        exactPx: parseFloat(cs.fontSize),
        fontWeight: cs.fontWeight,
        fontFamily: cs.fontFamily.split(',')[0].replace(/['"]/g, ''),
        lineHeight: cs.lineHeight
      };
    });
  });

  // Check Work With Me H2
  await page.goto(`${BASE_URL}/#work-with-me`, { waitUntil: 'networkidle0' });
  const wwmH2 = await page.evaluate(() => {
    const el = document.querySelector('.work-with-me-page h2');
    if (!el) return null;
    const cs = window.getComputedStyle(el);
    return {
      name: "Work With Me H2",
      tag: el.tagName,
      fontSize: cs.fontSize,
      exactPx: parseFloat(cs.fontSize),
      fontWeight: cs.fontWeight,
      fontFamily: cs.fontFamily.split(',')[0].replace(/['"]/g, ''),
      lineHeight: cs.lineHeight
    };
  });
  if (wwmH2) h2Results.push(wwmH2);

  // Check Article Reader Modal Title
  await page.goto(`${BASE_URL}/#home`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const c = document.querySelectorAll('.blog-card')[1];
    if (c) c.click();
  });
  await page.waitForSelector('.modal-box-reader', { timeout: 3000 }).catch(() => {});
  const modalH2 = await page.evaluate(() => {
    const el = document.querySelector('.modal-reader-title');
    if (!el) return null;
    const cs = window.getComputedStyle(el);
    return {
      name: "Article Reader Modal Title",
      tag: el.tagName,
      fontSize: cs.fontSize,
      exactPx: parseFloat(cs.fontSize),
      fontWeight: cs.fontWeight,
      fontFamily: cs.fontFamily.split(',')[0].replace(/['"]/g, ''),
      lineHeight: cs.lineHeight
    };
  });
  if (modalH2) h2Results.push(modalH2);

  console.table(h2Results);
  const h2AllSame = h2Results.every(r => Math.abs(r.exactPx - h2Results[0].exactPx) < 0.5 && r.fontWeight === '700' && r.fontFamily === 'Lora');
  console.log(`✓ H2 Hierarchy Unified: ${h2AllSame ? 'PASSED (All exact ' + h2Results[0].fontSize + ')' : 'FAILED'}\n`);

  console.log('--- [3/6] AUDITING UNIFIED H3 HEADINGS (Desktop 1440px) ---');
  await page.goto(`${BASE_URL}/#home`, { waitUntil: 'networkidle0' });
  const h3Results = await page.evaluate(() => {
    const targets = [
      { name: "Blog Card Title 1", sel: '.blog-card:nth-child(1) .blog-card-title' },
      { name: "Blog Card Title 2", sel: '.blog-card:nth-child(2) .blog-card-title' },
      { name: "Working On Title 1", sel: '.working-list li:nth-child(1) .item-title' }
    ];
    return targets.map(t => {
      const el = document.querySelector(t.sel);
      if (!el) return { name: t.name, found: false };
      const cs = window.getComputedStyle(el);
      return {
        name: t.name,
        fontSize: cs.fontSize,
        exactPx: parseFloat(cs.fontSize),
        fontWeight: cs.fontWeight,
        fontFamily: cs.fontFamily.split(',')[0].replace(/['"]/g, '')
      };
    });
  });

  // Store Product Card Title
  await page.goto(`${BASE_URL}/#store`, { waitUntil: 'networkidle0' });
  const storeH3 = await page.evaluate(() => {
    const el = document.querySelector('.product-card .card-title');
    if (!el) return null;
    const cs = window.getComputedStyle(el);
    return {
      name: "Store Product Card Title",
      fontSize: cs.fontSize,
      exactPx: parseFloat(cs.fontSize),
      fontWeight: cs.fontWeight,
      fontFamily: cs.fontFamily.split(',')[0].replace(/['"]/g, '')
    };
  });
  if (storeH3) h3Results.push(storeH3);

  // Archive Edition Title
  await page.goto(`${BASE_URL}/#archive`, { waitUntil: 'networkidle0' });
  const archiveH3 = await page.evaluate(() => {
    const el = document.querySelector('.product-card h3');
    if (!el) return null;
    const cs = window.getComputedStyle(el);
    return {
      name: "Archive Edition Title",
      fontSize: cs.fontSize,
      exactPx: parseFloat(cs.fontSize),
      fontWeight: cs.fontWeight,
      fontFamily: cs.fontFamily.split(',')[0].replace(/['"]/g, '')
    };
  });
  if (archiveH3) h3Results.push(archiveH3);

  console.table(h3Results);
  const h3AllSame = h3Results.every(r => Math.abs(r.exactPx - h3Results[0].exactPx) < 0.5 && r.fontWeight === '600' && r.fontFamily === 'Lora');
  console.log(`✓ H3 Hierarchy Unified: ${h3AllSame ? 'PASSED (All exact ' + h3Results[0].fontSize + ')' : 'FAILED'}\n`);

  console.log('--- [4/6] AUDITING UNIFIED 18px BODY TEXT (Desktop 1440px) ---');
  await page.goto(`${BASE_URL}/#home`, { waitUntil: 'networkidle0' });
  const bodyResults = await page.evaluate(() => {
    const targets = [
      { name: "Hero Subheadline 1", sel: '.book-content p:nth-of-type(1)' },
      { name: "Hero Subheadline 2", sel: '.book-content p:nth-of-type(2)' },
      { name: "Whats Inside list item", sel: '.wi-list li:nth-child(1)' },
      { name: "About bio paragraph", sel: '.about-bio p:nth-of-type(1)' },
      { name: "Blog section subtext", sel: '.blog-section .section-subtext' },
      { name: "Blog card summary", sel: '.blog-card-summary' },
      { name: "Working On item desc", sel: '.item-desc' },
      { name: "Footer newsletter sub", sel: '.footer-signup-text .sub' },
      { name: "Footer tagline", sel: '.hero-tagline' }
    ];
    return targets.map(t => {
      const el = document.querySelector(t.sel);
      if (!el) return { name: t.name, found: false };
      const cs = window.getComputedStyle(el);
      return {
        name: t.name,
        fontSize: cs.fontSize,
        exactPx: parseFloat(cs.fontSize),
        lineHeight: cs.lineHeight,
        fontFamily: cs.fontFamily.split(',')[0].replace(/['"]/g, '')
      };
    });
  });

  // Store Page & Product Card
  await page.goto(`${BASE_URL}/#store`, { waitUntil: 'networkidle0' });
  const storeBody = await page.evaluate(() => {
    const subtitleEl = document.querySelector('.store-page p');
    const taglineEl = document.querySelector('.card-tagline');
    const res = [];
    if (subtitleEl) {
      const cs = window.getComputedStyle(subtitleEl);
      res.push({ name: "Store Subtitle", fontSize: cs.fontSize, exactPx: parseFloat(cs.fontSize), lineHeight: cs.lineHeight });
    }
    if (taglineEl) {
      const cs = window.getComputedStyle(taglineEl);
      res.push({ name: "Product Card Tagline", fontSize: cs.fontSize, exactPx: parseFloat(cs.fontSize), lineHeight: cs.lineHeight });
    }
    return res;
  });
  bodyResults.push(...storeBody);

  // Work With Me Subtitle
  await page.goto(`${BASE_URL}/#work-with-me`, { waitUntil: 'networkidle0' });
  const wwmBody = await page.evaluate(() => {
    const el = document.querySelector('.work-with-me-page p');
    if (!el) return null;
    const cs = window.getComputedStyle(el);
    return { name: "Work With Me Subtitle", fontSize: cs.fontSize, exactPx: parseFloat(cs.fontSize), lineHeight: cs.lineHeight };
  });
  if (wwmBody) bodyResults.push(wwmBody);

  // Archive Page Subtitle & Summary
  await page.goto(`${BASE_URL}/#archive`, { waitUntil: 'networkidle0' });
  const archiveBody = await page.evaluate(() => {
    const sub = document.querySelector('.newsletter-archive-page p');
    const cardP = document.querySelector('.product-card p');
    const res = [];
    if (sub) {
      const cs = window.getComputedStyle(sub);
      res.push({ name: "Archive Subtitle", fontSize: cs.fontSize, exactPx: parseFloat(cs.fontSize), lineHeight: cs.lineHeight });
    }
    if (cardP) {
      const cs = window.getComputedStyle(cardP);
      res.push({ name: "Archive Card Summary", fontSize: cs.fontSize, exactPx: parseFloat(cs.fontSize), lineHeight: cs.lineHeight });
    }
    return res;
  });
  bodyResults.push(...archiveBody);

  // Article Reader Modal Paragraphs
  await page.goto(`${BASE_URL}/#home`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const c = document.querySelectorAll('.blog-card')[1];
    if (c) c.click();
  });
  await page.waitForSelector('.modal-box-reader', { timeout: 3000 }).catch(() => {});
  const modalBody = await page.evaluate(() => {
    const lead = document.querySelector('.article-reader-content .modal-lead');
    const pillar = document.querySelector('.article-reader-content .pillar-card p');
    const conclusion = document.querySelector('.article-reader-content .modal-conclusion');
    const res = [];
    if (lead) {
      const cs = window.getComputedStyle(lead);
      res.push({ name: "Modal Lead Paragraph", fontSize: cs.fontSize, exactPx: parseFloat(cs.fontSize), lineHeight: cs.lineHeight });
    }
    if (pillar) {
      const cs = window.getComputedStyle(pillar);
      res.push({ name: "Modal Pillar Paragraph", fontSize: cs.fontSize, exactPx: parseFloat(cs.fontSize), lineHeight: cs.lineHeight });
    }
    if (conclusion) {
      const cs = window.getComputedStyle(conclusion);
      res.push({ name: "Modal Conclusion", fontSize: cs.fontSize, exactPx: parseFloat(cs.fontSize), lineHeight: cs.lineHeight });
    }
    return res;
  });
  bodyResults.push(...modalBody);

  console.table(bodyResults);
  const bodyAll18px = bodyResults.every(r => Math.abs(r.exactPx - 18) < 0.2);
  console.log(`✓ 18px Body Standard Verified: ${bodyAll18px ? 'PASSED (All exact 18px)' : 'FAILED'}\n`);

  console.log('--- [5/6] AUDITING PROTECTED NON-BODY ELEMENTS (NOT 18px) ---');
  await page.goto(`${BASE_URL}/#home`, { waitUntil: 'networkidle0' });
  const nonBodyResults = await page.evaluate(() => {
    const targets = [
      { name: "Section Eyebrow", sel: '.section-eyebrow' },
      { name: "Navbar Link", sel: '.nav-links a' },
      { name: "Hero Button Text", sel: '.btn-primary-yellow' },
      { name: "Blog Card Read Time", sel: '.blog-card-readtime' }
    ];
    return targets.map(t => {
      const el = document.querySelector(t.sel);
      if (!el) return { name: t.name, found: false };
      const cs = window.getComputedStyle(el);
      return {
        name: t.name,
        fontSize: cs.fontSize,
        isSmallerThan18px: parseFloat(cs.fontSize) < 17
      };
    });
  });
  console.table(nonBodyResults);

  console.log('\n--- [6/6] AUDITING RESPONSIVE VIEWPORTS (Laptop, Tablet, Mobile) ---');
  const responsiveBreakpoints = [
    { name: 'Laptop', width: 1024, height: 768, expectedBodyPx: 18 },
    { name: 'Tablet', width: 768, height: 1024, expectedBodyPx: 17 },
    { name: 'Mobile', width: 375, height: 667, expectedBodyPx: 16.5 }
  ];

  for (const bp of responsiveBreakpoints) {
    await page.setViewport({ width: bp.width, height: bp.height });
    await page.goto(`${BASE_URL}/#home`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 400));

    const check = await page.evaluate((expectedPx) => {
      const heroH1 = document.querySelector('.hero-headline');
      const heroP = document.querySelector('.book-content p');
      const whatsH2 = document.querySelector('.whats-inside h2');
      const blogH3 = document.querySelector('.blog-card-title');
      const overflow = document.documentElement.scrollWidth > window.innerWidth;

      return {
        h1Size: heroH1 ? window.getComputedStyle(heroH1).fontSize : null,
        h2Size: whatsH2 ? window.getComputedStyle(whatsH2).fontSize : null,
        h3Size: blogH3 ? window.getComputedStyle(blogH3).fontSize : null,
        bodySize: heroP ? window.getComputedStyle(heroP).fontSize : null,
        bodyPx: heroP ? parseFloat(window.getComputedStyle(heroP).fontSize) : null,
        horizontalOverflow: overflow
      };
    }, bp.expectedBodyPx);

    console.log(`Breakpoint [${bp.name}] (${bp.width}x${bp.height}):`);
    console.log(`  H1: ${check.h1Size} | H2: ${check.h2Size} | H3: ${check.h3Size} | Body: ${check.bodySize} | Overflow: ${check.horizontalOverflow}`);
  }

  // Save verification screenshot
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/#home`, { waitUntil: 'networkidle0' });
  const screenshotPath = path.join(ARTIFACTS_DIR, 'verified_18px_typography_standardization.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`\nScreenshot saved: ${screenshotPath}`);

  await browser.close();
  console.log('\n================================================================');
  console.log('🎉 TYPOGRAPHY STANDARDIZATION & VERIFICATION COMPLETED');
  console.log('================================================================');
}

verifyFullTypography().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});

