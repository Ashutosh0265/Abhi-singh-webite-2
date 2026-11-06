const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

async function auditHeadings() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();

  const viewports = [
    { name: 'Desktop', width: 1440, height: 900 },
    { name: 'Mobile', width: 375, height: 667 }
  ];

  const pages = [
    { name: 'Home Page', url: `${BASE_URL}/#home` },
    { name: 'Store Page', url: `${BASE_URL}/#store` },
    { name: 'Work With Me Page', url: `${BASE_URL}/#work-with-me` },
    { name: 'Archive Page', url: `${BASE_URL}/#archive` }
  ];

  for (const vp of viewports) {
    console.log(`\n=================== VIEWPORT: ${vp.name} (${vp.width}x${vp.height}) ===================`);
    await page.setViewport({ width: vp.width, height: vp.height });

    for (const p of pages) {
      await page.goto(p.url, { waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 600));

      const headings = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, .card-title, .item-title, .newsletter-popup-heading'));
        return els.map(h => {
          const cs = window.getComputedStyle(h);
          return {
            tag: h.tagName,
            text: h.innerText.replace(/\s+/g, ' ').trim().slice(0, 36),
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
            fontFamily: cs.fontFamily.split(',')[0].replace(/['"]/g, ''),
            lineHeight: cs.lineHeight
          };
        });
      });

      console.log(`\n--- ${p.name} Headings (${vp.name}) ---`);
      console.table(headings);
    }
  }

  // Also check Modal headings on Desktop
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/#home`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => sessionStorage.removeItem('elrx_popup_dismissed'));
  await new Promise(r => setTimeout(r, 6500));
  await page.evaluate(() => document.dispatchEvent(new MouseEvent('mouseleave', { clientY: 5 })));
  await page.waitForSelector('.newsletter-popup-heading', { timeout: 4000 }).catch(() => {});

  const popupHeading = await page.evaluate(() => {
    const el = document.querySelector('.newsletter-popup-heading');
    if (!el) return null;
    const cs = window.getComputedStyle(el);
    return {
      tag: el.tagName,
      text: el.innerText.trim(),
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      fontFamily: cs.fontFamily.split(',')[0].replace(/['"]/g, ''),
      lineHeight: cs.lineHeight
    };
  });

  console.log('\n--- Newsletter Popup Heading ---');
  console.log(popupHeading);

  await browser.close();
}

auditHeadings().catch(console.error);

