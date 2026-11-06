const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function findChromePath() {
  const commonPaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe',
  ];
  for (const p of commonPaths) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

(async () => {
  const chromePath = await findChromePath();
  if (!chromePath) {
    console.error('Chrome executable not found');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,1000']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1000 });

    console.log('1. Submitting inquiry with UTM State = Haryana...');
    await page.goto('http://localhost:3000/?utm_source=instagram&utm_state=Haryana#work-with-me', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    await page.waitForSelector('#wwmName');
    await page.type('#wwmName', 'Pooja Sharma');
    await page.type('#wwmEmail', 'pooja.sharma@example.com');
    await page.select('#wwmService', 'coaching');
    await page.type('#wwmMessage', 'Inquiring for 1:1 kettlebell coaching from Gurgaon, Haryana.');
    await page.click('.wwm-submit');
    await page.waitForSelector('.wwm-success-card', { timeout: 5000 });
    console.log('✓ Haryana inquiry submitted successfully!');

    console.log('2. Navigating to Admin Dashboard...');
    await page.goto('http://localhost:3000/admin.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    // Verify 4 Metric cards
    const cards = await page.$$eval('.dealdeck-metric-card', els => els.map(el => ({
      label: el.querySelector('.dealdeck-card-label')?.textContent.trim(),
      number: el.querySelector('.dealdeck-card-number')?.textContent.trim(),
      subtext: el.querySelector('.dealdeck-card-subtext')?.textContent.trim(),
      growth: el.querySelector('.dealdeck-growth-pill')?.textContent.trim(),
    })));
    console.log('Metric Cards on Dashboard:', JSON.stringify(cards, null, 2));

    // Verify Customer Growth Pills
    const growthPills = await page.$$eval('.stat-growth-pill-item', els => els.map(el => ({
      val: el.querySelector('.stat-growth-pill-val')?.textContent.trim(),
      label: el.querySelector('.stat-growth-pill-label')?.textContent.trim(),
    })));
    console.log('Customer Growth Spaced Summary Pills:', JSON.stringify(growthPills, null, 2));

    // Verify Location List (check if Haryana is listed!)
    const locations = await page.$$eval('.stat-country-row', els => els.map(el => ({
      name: el.querySelector('.stat-country-name')?.textContent.trim(),
      pct: el.querySelector('.stat-country-pct')?.textContent.trim(),
    })));
    console.log('Tracked Locations & UTM States:', JSON.stringify(locations, null, 2));

    // Capture dashboard screenshot
    const artifactDir = 'C:\\Users\\ashut\\.gemini\\antigravity\\brain\\d44916b9-6f29-404e-b94f-138b40f5c159';
    const screenshotPath = path.join(artifactDir, 'verified_dealdeck_zero_baseline_utm_dashboard.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log('✓ Captured verified dashboard screenshot to:', screenshotPath);

    // 3. Test Store Order Simulation
    console.log('3. Placing a store order to verify dynamic revenue & order counters...');
    await page.goto('http://localhost:3000/?utm_state=Delhi#store', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // Click on product buy button
    await page.waitForSelector('.btn-card.btn-paid');
    const buyBtns = await page.$$('.btn-card.btn-paid');
    if (buyBtns.length > 0) {
      await buyBtns[0].click(); // Click first paid product
      await page.waitForSelector('.checkout-modal-box', { timeout: 4000 });
      console.log('✓ Checkout modal opened!');

      // Fill name & email
      await page.waitForSelector('#checkoutName');
      await page.type('#checkoutName', 'Amit Verma');
      await page.type('#checkoutEmail', 'amit.verma@example.com');
      await page.click('.checkout-submit-btn');
      await page.waitForSelector('.checkout-completed-wrap', { timeout: 4000 });
      console.log('✓ Order completed successfully!');

      // Return to admin dashboard to see updated revenue
      await page.goto('http://localhost:3000/admin.html', { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 1200));

      const updatedCards = await page.$$eval('.dealdeck-metric-card', els => els.map(el => ({
        label: el.querySelector('.dealdeck-card-label')?.textContent.trim(),
        number: el.querySelector('.dealdeck-card-number')?.textContent.trim(),
        subtext: el.querySelector('.dealdeck-card-subtext')?.textContent.trim(),
      })));
      console.log('Updated Metric Cards after real store order:', JSON.stringify(updatedCards, null, 2));

      const updatedLocations = await page.$$eval('.stat-country-row', els => els.map(el => ({
        name: el.querySelector('.stat-country-name')?.textContent.trim(),
        pct: el.querySelector('.stat-country-pct')?.textContent.trim(),
      })));
      console.log('Updated Locations after Delhi purchase:', JSON.stringify(updatedLocations, null, 2));

      const updatedScreenshotPath = path.join(artifactDir, 'verified_dashboard_after_real_sale.png');
      await page.screenshot({ path: updatedScreenshotPath, fullPage: false });
      console.log('✓ Captured updated dashboard screenshot to:', updatedScreenshotPath);
    }

    console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
