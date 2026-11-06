const puppeteer = require('puppeteer-core');
const path = require('path');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159';

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new' });
  const page = await browser.newPage();
  
  // Render an HTML page that displays both reference and current hero side by side
  const refPath = 'file:///' + path.resolve('scripts/screenshots/homepage-desktop-1440.png').replace(/\\/g, '/');
  const currPath = 'file:///' + path.resolve(ARTIFACTS_DIR, 'current_hero_1440.png').replace(/\\/g, '/');

  await page.setContent(`
    <html>
      <body style="margin:0; background:#333; display:flex; flex-direction:column; gap:20px; padding:20px;">
        <div>
          <h2 style="color:#fff; font-family:sans-serif;">Reference Top 800px</h2>
          <div style="width:1440px; height:800px; overflow:hidden; border:2px solid red;">
            <img src="${refPath}" style="width:1440px;" />
          </div>
        </div>
        <div>
          <h2 style="color:#fff; font-family:sans-serif;">Current Hero Element</h2>
          <img src="${currPath}" style="border:2px solid green;" />
        </div>
      </body>
    </html>
  `);
  await page.setViewport({ width: 1500, height: 1600 });
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'hero_comparison_debug.png') });
  console.log('Comparison saved to hero_comparison_debug.png');
  await browser.close();
})();

