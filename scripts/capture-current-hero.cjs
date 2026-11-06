const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const breakpoints = [
    { name: '1440', w: 1440, h: 900 },
    { name: '1024', w: 1024, h: 800 },
    { name: '768', w: 768, h: 1024 },
    { name: '390', w: 390, h: 844 },
  ];

  for (const bp of breakpoints) {
    await page.setViewport({ width: bp.w, height: bp.h });
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 600));

    // Get bounding box of #book or .book-section
    const bookElem = await page.$('#book') || await page.$('.book-section');
    if (bookElem) {
      await bookElem.screenshot({ path: path.join(ARTIFACTS_DIR, `current_hero_${bp.name}.png`) });
      console.log(`Captured current_hero_${bp.name}.png`);
    }

    // Also get dimensions and layout metrics
    const metrics = await page.evaluate(() => {
      const sec = document.querySelector('.book-section');
      const bookCol = document.querySelector('.book-col');
      const bookWrap = document.querySelector('.book-cover-wrap');
      const bookCover = document.querySelector('.book-cover');
      const content = document.querySelector('.book-content');
      const h1 = document.querySelector('.book-content h1');
      return {
        sec: sec ? { w: sec.offsetWidth, h: sec.offsetHeight } : null,
        bookCol: bookCol ? { w: bookCol.offsetWidth, h: bookCol.offsetHeight } : null,
        bookWrap: bookWrap ? { w: bookWrap.offsetWidth, h: bookWrap.offsetHeight } : null,
        bookCover: bookCover ? { w: bookCover.offsetWidth, h: bookCover.offsetHeight } : null,
        content: content ? { w: content.offsetWidth, h: content.offsetHeight } : null,
        h1: h1 ? { w: h1.offsetWidth, h: h1.offsetHeight, fontSize: window.getComputedStyle(h1).fontSize, lineHeight: window.getComputedStyle(h1).lineHeight } : null,
      };
    });
    console.log(`[${bp.name}px] metrics:`, JSON.stringify(metrics, null, 2));
  }

  await browser.close();
})();

