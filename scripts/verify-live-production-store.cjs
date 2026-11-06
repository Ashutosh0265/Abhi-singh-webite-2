const puppeteer = require('puppeteer-core');
const assert = require('assert');

async function testLiveProd() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('https://abhisingh-website.vercel.app/#store', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  console.log('Testing Free Card on Live Production...');
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.product-card'));
    for (const card of cards) {
      if ((card.querySelector('.card-title')?.innerText || '').toLowerCase().includes('habits')) {
        const btn = card.querySelector('.btn-card') || card;
        btn.click();
        break;
      }
    }
  });
  await new Promise(r => setTimeout(r, 600));

  const freeBtn = await page.$eval('.checkout-submit-btn', el => el.innerText.trim());
  console.log('Free button on live:', freeBtn);
  assert.strictEqual(freeBtn, 'Send My Free PDF →');

  // Close modal
  await page.click('.modal-close-btn');
  await new Promise(r => setTimeout(r, 400));

  console.log('Testing Paid Card on Live Production...');
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.product-card'));
    for (const card of cards) {
      if ((card.querySelector('.card-title')?.innerText || '').toLowerCase().includes('boring basics')) {
        const btn = card.querySelector('.btn-card') || card;
        btn.click();
        break;
      }
    }
  });
  await new Promise(r => setTimeout(r, 600));

  const paidBtn = await page.$eval('.checkout-submit-btn', el => el.innerText.trim());
  console.log('Paid button on live:', paidBtn);
  assert.strictEqual(paidBtn, 'Pay & Get My PDF →');

  await browser.close();
  console.log('Live production UI verification PASSED!');
}

testLiveProd().catch(err => {
  console.error('Live prod test error:', err);
  process.exit(1);
});

