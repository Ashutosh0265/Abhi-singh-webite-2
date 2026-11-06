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
  await page.setViewport({ width: 1440, height: 900 });

  console.log('--- 1. Navigating to live production store ---');
  await page.goto('https://abhisingh-website.vercel.app/#store', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // Click on Habits card
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.product-card'));
    const c = cards.find(x => x.innerText.toLowerCase().includes('habits'));
    if (c) (c.querySelector('.btn-card') || c).click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Check button text
  const btnText = await page.$eval('.checkout-submit-btn', el => el.innerText.trim());
  console.log('Button text:', btnText);

  // Fill in customer details
  await page.type('#checkoutName', 'Live Production User');
  await page.type('#checkoutEmail', 'customer.audit.live@example.com');

  // Click Send My Free PDF
  console.log('Clicking Send My Free PDF...');
  await page.click('.checkout-submit-btn');
  await new Promise(r => setTimeout(r, 2500));

  // Check what is displayed
  const modalState = await page.evaluate(() => {
    const errBox = document.querySelector('.checkout-error-banner');
    const compWrap = document.querySelector('.checkout-completed-wrap');
    return {
      hasErrorBanner: !!errBox,
      errorText: errBox ? errBox.innerText.trim() : null,
      hasCompletedWrap: !!compWrap,
      completedText: compWrap ? compWrap.innerText.trim() : null
    };
  });
  console.log('Live Modal State:', JSON.stringify(modalState, null, 2));

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verified_live_production_honest_error.png')
  });
  console.log('Captured screenshot verified_live_production_honest_error.png');

  await browser.close();
  console.log('✅ Live production audit script finished successfully!');
})();

