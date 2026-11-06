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
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.setItem('elrx_newsletter_seen', 'true');
    const el = document.getElementById('newsletter');
    if (el) el.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 600));
  const el = await page.$('#newsletter');
  if (el) {
    await el.screenshot({ path: path.join(ARTIFACT_DIR, 'clean_section6_desktop_real.png') });
    console.log('Saved clean_section6_desktop_real.png');
  }
  await browser.close();
})();

