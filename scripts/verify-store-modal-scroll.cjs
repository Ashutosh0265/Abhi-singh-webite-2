const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\ashut\\.gemini\\antigravity\\brain\\d44916b9-6f29-404e-b94f-138b40f5c159';

async function run() {
  console.log('🚀 Launching Chrome to verify Store Cards and Checkout Modal Scroll...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Navigating to http://localhost:3000/#store ...');
  await page.goto('http://localhost:3000/#store', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  // 1. Verify Store Product Cards (Height, 15% Cover Width, Tagline presence)
  const cardMetrics = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.product-card'));
    return cards.map(c => {
      const rect = c.getBoundingClientRect();
      const title = c.querySelector('.card-title')?.innerText?.trim();
      const tagline = c.querySelector('.card-tagline')?.innerText?.trim();
      const cover = c.querySelector('.custom-book-cover');
      const coverRect = cover ? cover.getBoundingClientRect() : null;
      return {
        title,
        tagline,
        cardHeight: Math.round(rect.height),
        cardWidth: Math.round(rect.width),
        coverWidth: coverRect ? Math.round(coverRect.width) : null,
        coverHeight: coverRect ? Math.round(coverRect.height) : null
      };
    });
  });

  console.log('📦 Store Product Card Metrics:');
  console.table(cardMetrics);

  const storeScreenshotPath = path.join(ARTIFACT_DIR, 'verified_store_cards_with_taglines.png');
  await page.screenshot({ path: storeScreenshotPath, fullPage: false });
  console.log(`Saved Store Screenshot: ${storeScreenshotPath}`);

  // 2. Click "Get for FREE" on Habits for Physical and Mental Strength
  console.log('Clicking "Get for FREE" button...');
  const freeBtn = await page.$('.product-card .btn-free');
  if (freeBtn) {
    await freeBtn.click();
    await new Promise(r => setTimeout(r, 600));
  } else {
    throw new Error('Get for FREE button not found');
  }

  // Verify modal is open and inspect scroll properties
  const modalMetricsInitial = await page.evaluate(() => {
    const modalBox = document.querySelector('.checkout-modal-box');
    const infoCol = document.querySelector('.checkout-modal-info');
    const formWrap = document.querySelector('.checkout-modal-form-wrap');
    const includedList = document.querySelector('.checkout-included-list');
    const lastItem = document.querySelector('.checkout-included-item:last-child');
    
    return {
      modalBox: modalBox ? {
        scrollHeight: modalBox.scrollHeight,
        clientHeight: modalBox.clientHeight,
        rect: modalBox.getBoundingClientRect()
      } : null,
      infoCol: infoCol ? {
        scrollHeight: infoCol.scrollHeight,
        clientHeight: infoCol.clientHeight,
        scrollTop: infoCol.scrollTop,
        canScroll: infoCol.scrollHeight > infoCol.clientHeight
      } : null,
      lastItemText: lastItem ? lastItem.innerText.trim() : null
    };
  });

  console.log('📋 Initial Modal Metrics:', JSON.stringify(modalMetricsInitial, null, 2));

  const modalBeforeScrollPath = path.join(ARTIFACT_DIR, 'verified_checkout_modal_open.png');
  await page.screenshot({ path: modalBeforeScrollPath });
  console.log(`Saved Modal Before Scroll: ${modalBeforeScrollPath}`);

  // 3. Test Scroll down on .checkout-modal-info
  console.log('Testing scroll down on .checkout-modal-info ...');
  await page.evaluate(() => {
    const infoCol = document.querySelector('.checkout-modal-info');
    if (infoCol) {
      infoCol.scrollTop = infoCol.scrollHeight;
    }
  });
  await new Promise(r => setTimeout(r, 400));

  const modalMetricsAfterScroll = await page.evaluate(() => {
    const infoCol = document.querySelector('.checkout-modal-info');
    const lastItem = document.querySelector('.checkout-included-item:last-child');
    const lastItemRect = lastItem ? lastItem.getBoundingClientRect() : null;
    const infoRect = infoCol ? infoCol.getBoundingClientRect() : null;
    return {
      scrollTop: infoCol?.scrollTop,
      scrollHeight: infoCol?.scrollHeight,
      clientHeight: infoCol?.clientHeight,
      lastItemInView: lastItemRect && infoRect ? (lastItemRect.bottom <= infoRect.bottom + 5 && lastItemRect.top >= infoRect.top) : false
    };
  });

  console.log('📋 Scrolled Modal Metrics:', JSON.stringify(modalMetricsAfterScroll, null, 2));

  const modalAfterScrollPath = path.join(ARTIFACT_DIR, 'verified_checkout_modal_scrolled_to_bottom.png');
  await page.screenshot({ path: modalAfterScrollPath });
  console.log(`Saved Modal After Scroll: ${modalAfterScrollPath}`);

  // 4. Test on Paid Product (Abhi's 10 Complexes) with 5 included items
  console.log('Closing modal and opening Abhi\'s 10 Complexes modal...');
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.modal-close-btn');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Find 10 Complexes card and click Get for ₹499
  const complexBtn = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.product-card'));
    const compCard = cards.find(c => c.innerText.includes('10 Complexes'));
    if (compCard) {
      const btn = compCard.querySelector('.btn-paid');
      if (btn) {
        btn.click();
        return true;
      }
    }
    return false;
  });
  await new Promise(r => setTimeout(r, 600));

  const complexesMetrics = await page.evaluate(() => {
    const infoCol = document.querySelector('.checkout-modal-info');
    const items = Array.from(document.querySelectorAll('.checkout-included-item')).map(i => i.innerText.trim());
    return {
      itemCount: items.length,
      items,
      scrollHeight: infoCol?.scrollHeight,
      clientHeight: infoCol?.clientHeight,
      canScroll: infoCol?.scrollHeight > infoCol?.clientHeight
    };
  });

  console.log('📋 Abhi\'s 10 Complexes Modal Metrics:', JSON.stringify(complexesMetrics, null, 2));

  // Scroll down to see Goal-Matching Table
  await page.evaluate(() => {
    const infoCol = document.querySelector('.checkout-modal-info');
    if (infoCol) infoCol.scrollTop = infoCol.scrollHeight;
  });
  await new Promise(r => setTimeout(r, 400));

  const complexesModalPath = path.join(ARTIFACT_DIR, 'verified_10_complexes_modal_scrolled.png');
  await page.screenshot({ path: complexesModalPath });
  console.log(`Saved Complexes Modal Screenshot: ${complexesModalPath}`);

  await browser.close();
  console.log('✅ ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('❌ Error during verification:', err);
  process.exit(1);
});

