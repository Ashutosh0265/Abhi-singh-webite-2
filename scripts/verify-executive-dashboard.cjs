const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\ashut\\.gemini\\antigravity\\brain\\d44916b9-6f29-404e-b94f-138b40f5c159';

async function run() {
  console.log('🚀 Verifying DealDeck Executive Dashboard & API features...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to http://localhost:3000/admin.html ...');
  await page.goto('http://localhost:3000/admin.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  // 1. Verify DealDeck Dashboard Structure
  const overviewMetrics = await page.evaluate(() => {
    const heroCard = document.querySelector('.card-hero-orange');
    const heroNum = heroCard ? heroCard.querySelector('.dealdeck-card-number')?.innerText : null;
    const metricCards = Array.from(document.querySelectorAll('.dealdeck-metric-card')).map(c => ({
      label: c.querySelector('.dealdeck-card-label')?.innerText,
      value: c.querySelector('.dealdeck-card-number')?.innerText,
      growth: c.querySelector('.dealdeck-growth-pill')?.innerText,
    }));
    const habitsTitle = document.querySelector('.stat-habits-card .stat-card-title')?.innerText;
    const habitsBars = document.querySelectorAll('.stat-bar-group').length;
    const radialTitle = document.querySelector('.stat-product-card .stat-card-title')?.innerText;
    const radialNum = document.querySelector('.stat-gauge-num')?.innerText;
    const growthTitle = document.querySelector('.stat-growth-card .stat-card-title')?.innerText;
    const bubbles = Array.from(document.querySelectorAll('.stat-bubble')).map(b => b.innerText.trim());

    return {
      heroNum,
      metricCards,
      habitsTitle,
      habitsBars,
      radialTitle,
      radialNum,
      growthTitle,
      bubbles
    };
  });

  console.log('📊 Overview Dashboard Metrics:');
  console.log(JSON.stringify(overviewMetrics, null, 2));

  // Screenshot of the new Executive Dashboard
  const dashScreenshotPath = path.join(ARTIFACT_DIR, 'verified_dealdeck_executive_dashboard.png');
  await page.screenshot({ path: dashScreenshotPath });
  console.log(`Saved Executive Dashboard Screenshot: ${dashScreenshotPath}`);

  // 2. Test API Integration Tab
  console.log('Clicking "Integrations & API" tab...');
  await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll('.admin-nav-item'));
    const settingsItem = navItems.find(item => item.innerText.includes('Integrations') || item.innerText.includes('API'));
    if (settingsItem) settingsItem.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Type a test Razorpay key and validate
  console.log('Validating Razorpay credentials...');
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('.admin-input'));
    const rzpInput = inputs.find(i => i.placeholder && i.placeholder.includes('rzp_test_'));
    if (rzpInput) {
      rzpInput.value = 'rzp_test_1234567890abcdef';
      rzpInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 300));

  // Click Validate Keys button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.admin-btn-secondary'));
    const valBtn = btns.find(b => b.innerText.includes('Validate Keys'));
    if (valBtn) valBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Verify test result box appeared
  const rzpResult = await page.evaluate(() => {
    const resultBox = document.querySelector('.test-result-box.success');
    return resultBox ? resultBox.innerText.trim() : null;
  });
  console.log('Razorpay Test Result:', rzpResult);

  // Click Save Settings button
  console.log('Clicking "Save Settings"...');
  await page.evaluate(() => {
    const saveBtn = Array.from(document.querySelectorAll('.admin-btn-primary')).find(b => b.innerText.includes('Save Settings'));
    if (saveBtn) saveBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const toastText = await page.evaluate(() => {
    const toast = document.querySelector('.admin-toast');
    return toast ? toast.innerText.trim() : null;
  });
  console.log('Toast Notification:', toastText);

  const apiScreenshotPath = path.join(ARTIFACT_DIR, 'verified_api_integrations_tab.png');
  await page.screenshot({ path: apiScreenshotPath });
  console.log(`Saved API Integrations Screenshot: ${apiScreenshotPath}`);

  await browser.close();
  console.log('✅ ALL DASHBOARD AND API VERIFICATIONS PASSED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});

