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
  await page.setViewport({ width: 1600, height: 1000 });
  
  const userImgB64 = fs.readFileSync(path.join(ARTIFACT_DIR, '.user_uploaded/media_1793891481564_f0b094f7.png')).toString('base64');
  const currImgB64 = fs.readFileSync(path.join(ARTIFACT_DIR, 'current_admin_dashboard_state.png')).toString('base64');
  
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { margin: 0; background: #222; color: #fff; font-family: sans-serif; padding: 20px; }
      .container { display: flex; gap: 20px; }
      .box { flex: 1; }
      h2 { margin-top: 0; }
      .crop-header {
        width: 100%;
        height: 200px;
        overflow: hidden;
        border: 2px solid #555;
        margin-bottom: 20px;
        position: relative;
      }
      .crop-header img {
        width: 1440px;
        position: absolute;
        top: 0px;
        left: -150px;
      }
      .crop-table {
        width: 100%;
        height: 300px;
        overflow: hidden;
        border: 2px solid #555;
        margin-bottom: 20px;
        position: relative;
      }
      .crop-table img {
        width: 1440px;
        position: absolute;
        top: -300px;
        left: -200px;
      }
      .full-img {
        width: 100%;
        border: 1px solid #444;
      }
    </style>
  </head>
  <body>
    <h1>Visual Comparison: Target Previous Theme (Left) vs Current State (Right)</h1>
    <div class="container">
      <div class="box">
        <h2>Target (User Uploaded) - Header Area</h2>
        <div class="crop-header">
          <img src="data:image/png;base64,${userImgB64}" />
        </div>
        <h2>Target - Activity Table Area</h2>
        <div class="crop-table">
          <img src="data:image/png;base64,${userImgB64}" />
        </div>
      </div>
      <div class="box">
        <h2>Current (Running App) - Header Area</h2>
        <div class="crop-header">
          <img src="data:image/png;base64,${currImgB64}" />
        </div>
        <h2>Current - Activity Table Area</h2>
        <div class="crop-table">
          <img src="data:image/png;base64,${currImgB64}" />
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
  
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'theme_comparison_side_by_side.png'), fullPage: true });
  await browser.close();
  console.log('Saved theme_comparison_side_by_side.png');
})();

