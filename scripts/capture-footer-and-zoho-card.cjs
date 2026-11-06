const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = path.resolve('C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 2 });

  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('elrx_popup_dismissed', 'true');
  });

  await page.goto('http://localhost:3000/#home', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    const popup = document.querySelector('.newsletter-modal-backdrop');
    if (popup) popup.remove();
    window.scrollTo(0, document.body.scrollHeight);
  });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verified_footer_social_clean.png')
  });
  console.log('Clean Footer screenshot captured.');

  // Capture About Section Social Buttons
  await page.evaluate(() => {
    const el = document.querySelector('#about');
    if (el) el.scrollIntoView({ behavior: 'auto', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verified_about_social_buttons.png')
  });
  console.log('About section social buttons screenshot captured.');

  await browser.close();
})();
