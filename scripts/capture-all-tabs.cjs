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
  await page.goto('http://localhost:3000/admin.html', { waitUntil: 'networkidle0' });
  
  const tabs = [
    { name: 'overview', selector: '.admin-nav-item:nth-child(1)' },
    { name: 'products', selector: '.admin-nav-item:nth-child(2)' },
    { name: 'blog', selector: '.admin-nav-item:nth-child(3)' },
    { name: 'media', selector: '.admin-nav-item:nth-child(4)' },
    { name: 'content', selector: '.admin-nav-item:nth-child(5)' },
    { name: 'leads', selector: '.admin-nav-item:nth-child(6)' },
    { name: 'orders', selector: '.admin-nav-item:nth-child(7)' },
    { name: 'settings', selector: '.admin-nav-item:nth-child(8)' }
  ];

  for (const t of tabs) {
    console.log(`Navigating to tab: ${t.name}`);
    await page.click(t.selector);
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `tab_current_${t.name}.png`), fullPage: false });
  }

  await browser.close();
  console.log('Finished capturing all tabs.');
})();

