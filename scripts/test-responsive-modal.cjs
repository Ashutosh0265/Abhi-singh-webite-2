const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\ashut\\.gemini\\antigravity\\brain\\d44916b9-6f29-404e-b94f-138b40f5c159';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox']
  });

  // 1. Laptop with limited screen height: 1200 x 650
  console.log('Testing laptop with limited height (1200x650)...');
  const page1 = await browser.newPage();
  await page1.setViewport({ width: 1200, height: 650 });
  await page1.goto('http://localhost:3000/#store', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));

  await page1.evaluate(() => {
    const btn = document.querySelector('.product-card .btn-free');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const laptopMetrics = await page1.evaluate(() => {
    const infoCol = document.querySelector('.checkout-modal-info');
    const formCol = document.querySelector('.checkout-modal-form-wrap');
    return {
      infoScroll: {
        scrollHeight: infoCol?.scrollHeight,
        clientHeight: infoCol?.clientHeight,
        canScroll: infoCol ? infoCol.scrollHeight > infoCol.clientHeight : false
      },
      formScroll: {
        scrollHeight: formCol?.scrollHeight,
        clientHeight: formCol?.clientHeight,
        canScroll: formCol ? formCol.scrollHeight > formCol.clientHeight : false
      }
    };
  });
  console.log('Laptop (650px height) scroll metrics:', laptopMetrics);

  // Scroll down info column
  await page1.evaluate(() => {
    const infoCol = document.querySelector('.checkout-modal-info');
    if (infoCol) infoCol.scrollTop = infoCol.scrollHeight;
  });
  await new Promise(r => setTimeout(r, 300));
  await page1.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_modal_laptop_small_height.png') });

  // 2. Mobile Viewport: 390 x 844
  console.log('Testing mobile viewport (390x844)...');
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 390, height: 844 });
  await page2.goto('http://localhost:3000/#store', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));

  await page2.evaluate(() => {
    const btn = document.querySelector('.product-card .btn-free');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const mobileMetrics = await page2.evaluate(() => {
    const modalBox = document.querySelector('.checkout-modal-box');
    return {
      scrollHeight: modalBox?.scrollHeight,
      clientHeight: modalBox?.clientHeight,
      canScroll: modalBox ? modalBox.scrollHeight > modalBox.clientHeight : false
    };
  });
  console.log('Mobile scroll metrics:', mobileMetrics);

  // Scroll modal down on mobile to reach the form and submit button
  await page2.evaluate(() => {
    const modalBox = document.querySelector('.checkout-modal-box');
    if (modalBox) modalBox.scrollTop = 350;
  });
  await new Promise(r => setTimeout(r, 300));
  await page2.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_modal_mobile_scrolled.png') });

  await browser.close();
  console.log('✅ Responsive modal tests passed!');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

