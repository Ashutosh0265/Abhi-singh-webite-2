const puppeteer = require('puppeteer-core');
const path = require('path');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159';

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new' });
  const page = await browser.newPage();
  const refPath = 'file:///' + path.resolve('scripts/screenshots/homepage-desktop-1440.png').replace(/\\/g, '/');
  
  await page.setContent(`
    <html>
      <body style="margin:0; background:#fff;">
        <img src="${refPath}" style="width:1440px;" />
      </body>
    </html>
  `);
  await page.setViewport({ width: 1440, height: 900 });
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'ref_hero_viewport.png'), clip: { x: 0, y: 0, width: 1440, height: 750 } });
  console.log('Saved ref_hero_viewport.png');
  await browser.close();
})();

