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
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://abhisingh-website.vercel.app', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    sessionStorage.setItem('elrx_popup_dismissed', 'true');
    localStorage.setItem('elrx_newsletter_seen', 'true');
  });
  await page.reload({ waitUntil: 'networkidle0' });

  // 1. Capture live Hero
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'live_production_hero_desktop.png'),
    clip: { x: 0, y: 0, width: 1440, height: 780 }
  });

  // 2. Capture live Section 6
  await page.evaluate(() => document.querySelector('.footer-signup').scrollIntoView({ behavior: 'instant' }));
  await new Promise(r => setTimeout(r, 400));
  const sec6 = await page.$('.footer-signup');
  if (sec6) {
    await sec6.screenshot({ path: path.join(ARTIFACT_DIR, 'live_production_section6_desktop.png') });
  }

  await browser.close();
  console.log('Live production verification complete.');
})();

