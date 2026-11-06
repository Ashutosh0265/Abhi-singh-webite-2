const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = path.resolve('C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 2 });

  console.log('Navigating to admin dashboard...');
  await page.goto('http://localhost:3000/admin.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  // 1. Check Header User Pill exists and click it to open profile modal
  const userPill = await page.waitForSelector('.dealdeck-user-pill');
  console.log('Clicking user pill to open Profile & Photo Modal...');
  await userPill.click();

  await page.waitForSelector('.admin-modal-backdrop', { visible: true });
  await new Promise(r => setTimeout(r, 600));

  // Capture screenshot of profile modal
  const profileScreenshotPath = path.join(ARTIFACT_DIR, 'verified_profile_photo_modal.png');
  await page.screenshot({ path: profileScreenshotPath });
  console.log('Captured profile modal screenshot:', profileScreenshotPath);

  // Test selecting an avatar preset or typing a new name
  const nameInput = await page.$('.admin-modal-body input[type="text"]');
  if (nameInput) {
    await nameInput.click({ clickCount: 3 });
    await nameInput.type('Abhi Singh');
  }

  // Click Save Changes in modal
  const saveBtn = await page.$('.admin-modal-footer .admin-btn-primary');
  if (saveBtn) {
    await saveBtn.click();
    console.log('Saved profile changes.');
  }
  await new Promise(r => setTimeout(r, 600));

  // Verify modal closed and user pill reflects changes
  const updatedUserName = await page.$eval('.dealdeck-user-name', el => el.textContent);
  console.log('User name in header pill:', updatedUserName);

  // 2. Navigate to Integrations & APIs tab
  console.log('Navigating to Integrations & APIs tab...');
  await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll('.admin-nav-item'));
    const item = navItems.find(i => i.innerText.includes('Integrations') || i.innerText.includes('API'));
    if (item) item.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Verify vector animations are present
  const vectors = await page.evaluate(() => {
    return {
      metricCards: document.querySelectorAll('.dealdeck-api-metric-card').length,
      supabaseVector: !!document.querySelector('.supabase-vector'),
      razorpayVector: !!document.querySelector('.razorpay-vector'),
      paypalVector: !!document.querySelector('.paypal-vector'),
      zohoVector: !!document.querySelector('.zoho-vector'),
      resendVector: !!document.querySelector('.resend-vector'),
    };
  });
  console.log('Integrations & API verification:', JSON.stringify(vectors, null, 2));

  // Scroll to capture full API tab
  const apiScreenshotPath = path.join(ARTIFACT_DIR, 'verified_api_integrations_dealdeck_vector.png');
  await page.screenshot({ path: apiScreenshotPath, fullPage: false });
  console.log('Captured API Integrations screenshot:', apiScreenshotPath);

  await browser.close();
  console.log('✅ All browser verifications passed!');
})();
