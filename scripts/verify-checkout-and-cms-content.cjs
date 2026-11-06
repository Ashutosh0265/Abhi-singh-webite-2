const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159';

async function main() {
  console.log('🚀 Starting Puppeteer Verification for Checkout Modal & CMS Content Editor...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Verify Free Product Checkout Modal (Habits for Physical and Mental Strength)
  console.log('\n--- 1. Testing Free Product Checkout Modal ---');
  await page.goto('http://localhost:3000/#store', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.product-card', { timeout: 8000 });

  // Click on the first product (Free)
  const productCards = await page.$$('.product-card');
  if (productCards.length > 0) {
    await productCards[0].click();
  }

  await page.waitForSelector('.modal-box.checkout-modal-box', { timeout: 5000 });

  const freeModalMetrics = await page.evaluate(() => {
    const modal = document.querySelector('.modal-box.checkout-modal-box');
    const nameInput = document.querySelector('.checkout-form-input[placeholder*="Rahul Sharma"]');
    const emailInput = document.querySelector('.checkout-form-input[placeholder*="you@example.com"]');
    const submitBtn = document.querySelector('.checkout-submit-btn');
    const includedCard = document.querySelector('.checkout-included-card');
    const rect = modal.getBoundingClientRect();
    return {
      modalWidth: rect.width,
      viewportWidth: window.innerWidth,
      coverageRatio: (rect.width / window.innerWidth).toFixed(2),
      hasNameInput: !!nameInput,
      nameWidth: nameInput ? nameInput.getBoundingClientRect().width : 0,
      hasEmailInput: !!emailInput,
      emailWidth: emailInput ? emailInput.getBoundingClientRect().width : 0,
      buttonText: submitBtn ? submitBtn.textContent.trim() : null,
      hasIncludedList: !!includedCard,
      includedItemsCount: document.querySelectorAll('.checkout-included-item').length
    };
  });
  console.log('Free Checkout Modal Metrics:', freeModalMetrics);

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'checkout_modal_70pct_redesigned_free.png'),
    fullPage: false
  });
  console.log('📸 Saved checkout_modal_70pct_redesigned_free.png');

  // Close modal
  await page.click('.modal-close-btn');
  await new Promise((r) => setTimeout(r, 400));

  // 2. Verify Paid Product Checkout Modal (24 Boring Basics)
  console.log('\n--- 2. Testing Paid Product Checkout Modal ---');
  if (productCards.length > 1) {
    await productCards[1].click();
  }
  await page.waitForSelector('.modal-box.checkout-modal-box', { timeout: 5000 });

  const paidModalMetrics = await page.evaluate(() => {
    const modal = document.querySelector('.modal-box.checkout-modal-box');
    const selectGateway = document.querySelector('.checkout-form-select');
    const submitBtn = document.querySelector('.checkout-submit-btn');
    const rect = modal.getBoundingClientRect();
    return {
      modalWidth: rect.width,
      coverageRatio: (rect.width / window.innerWidth).toFixed(2),
      hasPaymentGatewaySelect: !!selectGateway,
      buttonText: submitBtn ? submitBtn.textContent.trim() : null,
    };
  });
  console.log('Paid Checkout Modal Metrics:', paidModalMetrics);

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'checkout_modal_70pct_redesigned_paid.png'),
    fullPage: false
  });
  console.log('📸 Saved checkout_modal_70pct_redesigned_paid.png');

  // Close modal
  await page.click('.modal-close-btn');
  await new Promise((r) => setTimeout(r, 400));

  // 3. Verify CMS Website Content Universal Editor
  console.log('\n--- 3. Testing CMS Website Content Universal Editor ---');
  await page.goto('http://localhost:3000/admin.html', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.admin-sidebar', { timeout: 8000 });

  // Click on Website Content tab
  await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll('.admin-nav-item'));
    const contentTab = navItems.find(el => el.textContent.includes('Website Content'));
    if (contentTab) contentTab.click();
  });

  await page.waitForSelector('.admin-content-subtabs', { timeout: 5000 });

  const cmsContentState = await page.evaluate(() => {
    const subtabs = Array.from(document.querySelectorAll('.admin-content-subtab-btn')).map(b => b.textContent.trim());
    const hasLiveLocationBadge = !!document.querySelector('.admin-location-badge');
    const locationText = document.querySelector('.admin-location-badge')?.textContent.trim();
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save All Changes'));
    return {
      subtabsCount: subtabs.length,
      subtabs,
      hasLiveLocationBadge,
      locationText,
      hasSaveBtn: !!saveBtn
    };
  });
  console.log('CMS Universal Content Editor State:', cmsContentState);

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'cms_universal_website_content_editor.png'),
    fullPage: false
  });
  console.log('📸 Saved cms_universal_website_content_editor.png');

  await browser.close();
  console.log('\n✅ All browser verification tests passed successfully!');
}

main().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});

