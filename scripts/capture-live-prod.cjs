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
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://abhisingh-website.vercel.app', { waitUntil: 'networkidle2' });
  await page.waitForSelector('#newsletter');
  await page.evaluate(() => {
    document.querySelector('#newsletter').scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 600));
  const el = await page.$('#newsletter');
  await el.screenshot({ path: path.join(ARTIFACTS_DIR, 'live_prod_section6_refined_desktop.png') });
  
  await page.setViewport({ width: 768, height: 1024 });
  await page.evaluate(() => {
    document.querySelector('#newsletter').scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 400));
  await el.screenshot({ path: path.join(ARTIFACTS_DIR, 'live_prod_section6_refined_tablet.png') });

  await page.setViewport({ width: 375, height: 667 });
  await page.evaluate(() => {
    document.querySelector('#newsletter').scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 400));
  await el.screenshot({ path: path.join(ARTIFACTS_DIR, 'live_prod_section6_refined_mobile.png') });

  await browser.close();
  console.log('LIVE PROD SCREENSHOTS CAPTURED');
})();

