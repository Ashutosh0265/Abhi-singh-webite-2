const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = path.resolve('C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159');

async function testInteractions() {
  console.log('Testing Newsletter Popup Interactions...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Trigger popup
  await page.evaluate(() => {
    sessionStorage.clear();
    window.scrollTo(0, document.documentElement.scrollHeight * 0.85);
    window.dispatchEvent(new Event('scroll'));
  });
  await new Promise(r => setTimeout(r, 600));

  let popup = await page.$('.newsletter-popup-modal');
  if (!popup) {
    await new Promise(r => setTimeout(r, 6500));
    await page.evaluate(() => {
      document.dispatchEvent(new MouseEvent('mouseleave', { clientY: 5 }));
    });
    await new Promise(r => setTimeout(r, 600));
  }

  await page.waitForSelector('.newsletter-popup-modal', { timeout: 8000 });
  console.log('✓ Popup opened successfully');

  // Verify elements exist and visible
  const input = await page.$('.newsletter-popup-input');
  const btn = await page.$('.newsletter-popup-btn');
  const closeBtn = await page.$('.modal-close-btn');

  if (!input || !btn || !closeBtn) {
    throw new Error('Missing key popup elements!');
  }
  console.log('✓ Input, button, close button are all present');

  // Enter email and test form submission
  await page.type('.newsletter-popup-input', 'test.subscriber@example.com');
  await page.click('.newsletter-popup-btn');

  await page.waitForSelector('.newsletter-popup-success', { timeout: 5000 });
  const successText = await page.$eval('.newsletter-popup-success', el => el.innerText);
  console.log('✓ Submission success screen displayed:', successText.replace(/\n/g, ' '));

  // Capture success screenshot
  const successScreenshot = path.join(ARTIFACT_DIR, 'verified_newsletter_popup_success.png');
  await page.screenshot({ path: successScreenshot });
  console.log('✓ Saved success screenshot:', successScreenshot);

  await browser.close();
  console.log('ALL POPUP INTERACTION TESTS PASSED!');
}

testInteractions().catch(err => {
  console.error(err);
  process.exit(1);
});

