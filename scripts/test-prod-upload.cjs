const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'https://abhisingh-website.vercel.app';

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  const tempFile = path.join(__dirname, 'test_img.png');
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  fs.writeFileSync(tempFile, Buffer.from(pngBase64, 'base64'));

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  page.on('console', msg => console.log('PROD CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PROD PAGEERROR:', err.message));

  await page.goto(BASE_URL + '/admin.html', { waitUntil: 'domcontentloaded' });
  await delay(1000);

  await page.evaluate(() => {
    const session = {
      role: 'super_admin',
      adminName: 'Abhi Singh',
      email: 'abhi@eatliftrun.in',
      authenticated: true,
      loginTime: new Date().toISOString(),
    };
    localStorage.setItem('abhisingh_super_admin_session', JSON.stringify(session));
    localStorage.setItem('abhisingh_admin_session', JSON.stringify(session));
    localStorage.setItem('elrx_admin_session', JSON.stringify(session));
  });

  await page.goto(BASE_URL + '/admin.html', { waitUntil: 'domcontentloaded' });
  await delay(1500);

  await page.evaluate(() => {
    const navBtns = Array.from(document.querySelectorAll('.admin-nav-item, button'));
    const prodNav = navBtns.find(b => b.innerText.includes('Products & Store'));
    if (prodNav) prodNav.click();
  });
  await delay(1000);

  await page.evaluate(() => {
    const addBtns = Array.from(document.querySelectorAll('button'));
    const addBtn = addBtns.find(b => b.innerText.includes('+ Add New Product'));
    if (addBtn) addBtn.click();
  });
  await delay(1000);

  const imageInput = await page.$('.admin-modal input[type="file"][accept*="image"]');
  console.log('Prod imageInput found:', Boolean(imageInput));

  if (imageInput) {
    await imageInput.uploadFile(tempFile);
    await delay(2000);
  }

  const toasts = await page.evaluate(() => {
    const toastEls = Array.from(document.querySelectorAll('.admin-toast, [class*="toast"], [style*="position: fixed"]'));
    return toastEls.map(t => ({ text: t.innerText, className: t.className, style: t.getAttribute('style') }));
  });
  console.log('PROD TOASTS:', JSON.stringify(toasts, null, 2));

  await page.screenshot({ path: path.join(__dirname, 'prod_upload_test.png') });

  try { fs.unlinkSync(tempFile); } catch {}
  await browser.close();
}
run();

