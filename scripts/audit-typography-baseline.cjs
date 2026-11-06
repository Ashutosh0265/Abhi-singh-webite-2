const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

async function auditBaseline() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const auditData = {
    h1: [],
    h2: [],
    h3: [],
    body: []
  };

  const pages = [
    { name: 'Home', url: `${BASE_URL}/#home` },
    { name: 'Store', url: `${BASE_URL}/#store` },
    { name: 'WorkWithMe', url: `${BASE_URL}/#work-with-me` },
    { name: 'Archive', url: `${BASE_URL}/#archive` }
  ];

  for (const p of pages) {
    await page.goto(p.url, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const pageHeadings = await page.evaluate((pageName) => {
      const getInfo = (el) => {
        const cs = window.getComputedStyle(el);
        return {
          page: pageName,
          tag: el.tagName,
          text: el.innerText.replace(/\s+/g, ' ').trim().slice(0, 35),
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          fontFamily: cs.fontFamily.split(',')[0].replace(/['"]/g, ''),
          lineHeight: cs.lineHeight
        };
      };

      const h1s = Array.from(document.querySelectorAll('h1')).map(getInfo);
      const h2s = Array.from(document.querySelectorAll('h2')).map(getInfo);
      const h3s = Array.from(document.querySelectorAll('h3, .card-title, .item-title')).map(getInfo);
      
      const bodyEls = Array.from(document.querySelectorAll('.book-content p, .whats-inside p, .wi-list li, .about-bio p, .blog-section .section-subtext, .blog-card-summary, .item-desc, .footer-signup-text .sub, .card-tagline, .store-page p, .work-with-me-page p, .newsletter-archive-page p')).map(getInfo);

      return { h1s, h2s, h3s, bodyEls };
    }, p.name);

    auditData.h1.push(...pageHeadings.h1s);
    auditData.h2.push(...pageHeadings.h2s);
    auditData.h3.push(...pageHeadings.h3s);
    auditData.body.push(...pageHeadings.bodyEls);
  }

  // Open Article Reader Modal to inspect modal typography
  await page.goto(`${BASE_URL}/#home`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const card = document.querySelectorAll('.blog-card')[1];
    if (card) card.click();
  });
  await page.waitForSelector('.modal-box-reader', { timeout: 3000 }).catch(() => {});
  const modalInfo = await page.evaluate(() => {
    const modalH2 = document.querySelector('.modal-reader-title');
    const modalLead = document.querySelector('.article-reader-content .modal-lead');
    const modalPillar = document.querySelector('.article-reader-content .pillar-card p');
    const modalH3 = document.querySelector('.article-reader-content .modal-subheading');

    const get = (el) => {
      if (!el) return null;
      const cs = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        text: el.innerText.slice(0, 30),
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight
      };
    };
    return {
      h2: get(modalH2),
      h3: get(modalH3),
      lead: get(modalLead),
      pillar: get(modalPillar)
    };
  });

  console.log('=== BEFORE AUDIT: H1 HEADINGS ===');
  console.table(auditData.h1);

  console.log('\n=== BEFORE AUDIT: H2 HEADINGS ===');
  console.table(auditData.h2);

  console.log('\n=== BEFORE AUDIT: H3 HEADINGS ===');
  console.table(auditData.h3.slice(0, 10));

  console.log('\n=== BEFORE AUDIT: SAMPLE BODY TEXT (Currently 15.68px) ===');
  console.table(auditData.body.slice(0, 10));

  console.log('\n=== BEFORE AUDIT: ARTICLE READER MODAL ===');
  console.log(modalInfo);

  await browser.close();
}

auditBaseline().catch(console.error);

