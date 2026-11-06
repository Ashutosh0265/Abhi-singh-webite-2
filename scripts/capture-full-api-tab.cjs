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
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/admin.html', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll('.admin-nav-item'));
    const item = navItems.find(i => i.innerText.includes('Integrations') || i.innerText.includes('API'));
    if (item) item.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verified_api_integrations_dealdeck_full.png'),
    fullPage: true
  });
  await browser.close();
  console.log('Full page captured successfully!');
})();

