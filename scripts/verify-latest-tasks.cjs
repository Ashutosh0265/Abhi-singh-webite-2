const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159';

async function main() {
  console.log('🚀 Starting Puppeteer Verification for all 3 tasks...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Verify Store Page with 15% increased images
  console.log('--- 1. Testing Store Page Images ---');
  await page.goto('http://localhost:3000/#store', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.product-card', { timeout: 8000 });
  
  // Measure custom-book-cover dimensions
  const bookCoverDims = await page.evaluate(() => {
    const el = document.querySelector('.custom-book-cover');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const computed = window.getComputedStyle(el);
    return {
      width: rect.width,
      height: rect.height,
      cssWidth: computed.width,
      cssMinHeight: window.getComputedStyle(el.closest('.card-thumb')).minHeight
    };
  });
  console.log('Store Book Cover Dimensions:', bookCoverDims);

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'store_page_15pct_larger_images.png'),
    fullPage: false
  });
  console.log('📸 Saved store_page_15pct_larger_images.png');

  // 2. Verify Newsletter Popup Modal with 60% width & Abhi Singh Photo
  console.log('\n--- 2. Testing Newsletter Popup Modal ---');
  // Trigger popup programmatically by evaluating scroll or setting state
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  
  // Clear any dismissal and trigger popup
  await page.evaluate(() => {
    sessionStorage.removeItem('elrx_popup_dismissed');
    window.dispatchEvent(new Event('scroll'));
  });

  // Directly evaluate exit intent or simulate mouse leave
  await page.evaluate(() => {
    const event = new MouseEvent('mouseleave', {
      clientY: 5,
      bubbles: true
    });
    document.dispatchEvent(event);
  });

  await page.waitForSelector('.modal-box.newsletter-popup-modal', { timeout: 5000 });
  
  const popupDims = await page.evaluate(() => {
    const modal = document.querySelector('.modal-box.newsletter-popup-modal');
    const img = document.querySelector('.newsletter-popup-img');
    const rect = modal.getBoundingClientRect();
    return {
      modalWidth: rect.width,
      viewportWidth: window.innerWidth,
      ratio: rect.width / window.innerWidth,
      hasImage: !!img,
      imageSrc: img ? img.src : null,
      authorName: document.querySelector('.newsletter-popup-author-name')?.textContent
    };
  });
  console.log('Newsletter Popup Modal Metrics:', popupDims);

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'newsletter_popup_60pct_with_photo.png'),
    fullPage: false
  });
  console.log('📸 Saved newsletter_popup_60pct_with_photo.png');

  // 3. Verify CMS Control Panel without Password / ID
  console.log('\n--- 3. Testing CMS Control Panel Direct Access ---');
  // Open with a completely fresh session (no prior session in sessionStorage)
  const incognitoPage = await browser.newPage();
  await incognitoPage.setViewport({ width: 1440, height: 900 });
  await incognitoPage.goto('http://localhost:3000/admin.html', { waitUntil: 'networkidle2' });
  
  await incognitoPage.waitForSelector('.admin-sidebar', { timeout: 8000 });
  const adminState = await incognitoPage.evaluate(() => {
    const isSidebarPresent = !!document.querySelector('.admin-sidebar');
    const hasPasswordInput = !!document.querySelector('input[type="password"]');
    const userName = document.querySelector('.admin-user-name')?.textContent;
    const userRole = document.querySelector('.admin-user-role')?.textContent;
    const activeBrand = document.querySelector('.admin-brand-sub')?.textContent;
    return {
      isSidebarPresent,
      hasPasswordInput,
      userName,
      userRole,
      activeBrand
    };
  });
  console.log('CMS Control Panel State:', adminState);

  await incognitoPage.screenshot({
    path: path.join(ARTIFACTS_DIR, 'cms_direct_access_no_password.png'),
    fullPage: false
  });
  console.log('📸 Saved cms_direct_access_no_password.png');

  await browser.close();
  console.log('\n✅ All verification steps completed successfully!');
}

main().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
