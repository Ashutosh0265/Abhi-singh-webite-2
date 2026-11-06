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
  await page.setViewport({ width: 1200, height: 800 });
  
  const userImgB64 = fs.readFileSync(path.join(ARTIFACT_DIR, '.user_uploaded/media_1793891481564_f0b094f7.png')).toString('base64');
  
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { margin: 20px; background: #fff; font-family: sans-serif; }
      .zoom-container {
        display: flex;
        flex-direction: column;
        gap: 30px;
      }
      .crop-section {
        border: 2px solid red;
        overflow: hidden;
        position: relative;
      }
      /* In media_1793891481564_f0b094f7.png the image is 1920x945 or similar */
    </style>
  </head>
  <body>
    <h1>User Image Zoom Analysis</h1>
    <img id="srcImg" src="data:image/png;base64,${userImgB64}" style="max-width: 100%; border: 1px solid #ccc;" />
  </body>
  </html>
  `;
  
  await page.setContent(html, { waitUntil: 'load' });
  const dimensions = await page.evaluate(() => {
    const img = document.getElementById('srcImg');
    return { naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight };
  });
  console.log('Image dimensions:', dimensions);
  await browser.close();
})();

