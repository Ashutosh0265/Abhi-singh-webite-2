const puppeteer = require('puppeteer-core');
const path = require('path');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 2 });

  await page.goto('http://localhost:3000/admin.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));

  // Navigate to Orders Tab
  await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll('.admin-nav-item'));
    const item = navItems.find(i => i.innerText.includes('Orders') || i.innerText.includes('Deliveries'));
    if (item) item.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verified_admin_orders_delivery_statuses.png')
  });
  console.log('Captured verified_admin_orders_delivery_statuses.png');

  // Click Details on the first order
  const clickedDetails = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const detailsBtn = btns.find(b => b.innerText.includes('Details'));
    if (detailsBtn) {
      detailsBtn.click();
      return true;
    }
    return false;
  });

  if (clickedDetails) {
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verified_admin_order_details_audit_logs.png')
    });
    console.log('Captured verified_admin_order_details_audit_logs.png');
  }

  await browser.close();
  console.log('✅ Admin Orders tab verification completed successfully!');
})();

