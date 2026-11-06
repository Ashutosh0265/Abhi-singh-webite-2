const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const path = require('path');
const ARTIFACT_DIR = 'C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Desktop
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  const heroEl = await page.$('.book-section');
  if (heroEl) {
    await heroEl.screenshot({ path: path.join(ARTIFACT_DIR, 'current_hero_desktop.png') });
  }
  
  const sec6El = await page.$('.footer-signup');
  if (sec6El) {
    await sec6El.screenshot({ path: path.join(ARTIFACT_DIR, 'current_section6_desktop.png') });
  }

  // Also full page top
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'current_top_with_header_hero.png'), clip: { x: 0, y: 0, width: 1440, height: 850 } });

  await browser.close();
  console.log('Finished capturing current hero & section 6');
})();

