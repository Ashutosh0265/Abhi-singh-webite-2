const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const path = require('path');
const fs = require('fs');
const ARTIFACT_DIR = 'C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 600 });
  
  const userImgB64 = fs.readFileSync(path.join(ARTIFACT_DIR, '.user_uploaded/media_1793891481564_f0b094f7.png')).toString('base64');
  
  const html = `
  <!DOCTYPE html>
  <html>
  <body style="margin: 0; background: #fff;">
    <div style="width: 400px; height: 100px; overflow: hidden; position: relative;">
      <!-- The image is 1024 x 513 -->
      <!-- Let's scale it 3x to see clearly -->
      <img src="data:image/png;base64,${userImgB64}" style="position: absolute; left: -115px; top: -15px; transform: scale(2.5); transform-origin: 115px 15px; image-rendering: pixelated;" />
    </div>
  </body>
  </html>
  `;
  
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'zoomed_user_title.png') });
  await browser.close();
  console.log('Saved zoomed_user_title.png');
})();

