const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

async function measureModalElements() {
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

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto(`${BASE_URL}/#home`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Click on the second article card: "How I went from zero to HYROX in 20 months"
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.blog-card'));
      const targetCard = cards.find(c => c.innerText.includes('zero to HYROX')) || cards[1];
      if (targetCard) targetCard.click();
    });

    await page.waitForSelector('.modal-box-reader', { timeout: 4000 });

    const measurements = await page.evaluate(() => {
      const getStyles = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          selector,
          tag: el.tagName,
          text: el.innerText.replace(/\s+/g, ' ').trim().slice(0, 50),
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          fontFamily: cs.fontFamily,
          lineHeight: cs.lineHeight,
          letterSpacing: cs.letterSpacing,
          color: cs.color,
          margin: cs.margin,
          fontStyle: cs.fontStyle
        };
      };

      return {
        heading: getStyles('.modal-reader-title'),
        categoryBadge: getStyles('.modal-reader-category'),
        metaTime: getStyles('.modal-reader-time'),
        leadParagraph: getStyles('.article-reader-content .modal-lead'),
        takeawayBadge: getStyles('.article-reader-content .takeaway-badge'),
        takeawayQuote: getStyles('.article-reader-content .modal-takeaway-card blockquote'),
        subheading: getStyles('.article-reader-content .modal-subheading'),
        pillarLabel: getStyles('.article-reader-content .pillar-label'),
        pillarParagraph: getStyles('.article-reader-content .pillar-card p'),
        conclusion: getStyles('.article-reader-content .modal-conclusion')
      };
    });

    console.log(`\n=================== ${vp.name.toUpperCase()} MEASUREMENTS (${vp.width}x${vp.height}) ===================`);
    console.log(JSON.stringify(measurements, null, 2));

    // Close modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.modal-close-btn');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
  }

  await browser.close();
}

measureModalElements().catch(console.error);

