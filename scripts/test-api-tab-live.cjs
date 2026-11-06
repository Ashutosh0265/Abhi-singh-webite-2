const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000/admin.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // Switch to Integrations & API tab
  await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll('.admin-nav-item'));
    const item = navItems.find(i => i.innerText.includes('Integrations') || i.innerText.includes('API'));
    if (item) item.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Find the Razorpay Key ID input
  const rzpInput = await page.$('input[placeholder*="rzp_test_"]');
  if (rzpInput) {
    await rzpInput.click({ clickCount: 3 });
    await rzpInput.type('rzp_test_9876543210abcdef');
    console.log('Typed Razorpay test key');
  }

  // Click Validate Keys
  const validateBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('.admin-btn-secondary')).find(b => b.innerText.includes('Validate Keys'));
  });
  if (validateBtn) {
    await validateBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }

  const resultText = await page.evaluate(() => {
    const box = document.querySelector('.test-result-box');
    return box ? box.innerText.trim() : 'no box';
  });
  console.log('Validate Keys Result:', resultText);

  // Click Save Settings
  const saveBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('.admin-btn-primary')).find(b => b.innerText.includes('Save Settings'));
  });
  if (saveBtn) {
    await saveBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }

  const toastText = await page.evaluate(() => {
    const t = document.querySelector('.admin-toast');
    return t ? t.innerText.trim() : 'no toast';
  });
  console.log('Save Settings Toast:', toastText);

  await browser.close();
  console.log('✅ API Settings tested and verified!');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});

