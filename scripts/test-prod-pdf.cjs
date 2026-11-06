const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'https://abhisingh-website.vercel.app';

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  const tempPdf = path.join(__dirname, 'test_sample.pdf');
  fs.writeFileSync(tempPdf, '%PDF-1.4\n%âãÏÓ\n1 0 obj\n<< /Title (Test) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGEERROR:', err.message));

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
  await delay(1200);

  await page.evaluate(() => {
    const navBtns = Array.from(document.querySelectorAll('.admin-nav-item, button'));
    const prodNav = navBtns.find(b => b.innerText.includes('Products & Store'));
    if (prodNav) prodNav.click();
  });
  await delay(800);

  await page.evaluate(() => {
    const addBtns = Array.from(document.querySelectorAll('button'));
    const addBtn = addBtns.find(b => b.innerText.includes('+ Add New Product'));
    if (addBtn) addBtn.click();
  });
  await delay(800);

  // Find PDF file input
  const pdfInput = await page.$('.admin-modal input[type="file"][accept*="pdf"]');
  console.log('pdfInput found:', Boolean(pdfInput));

  if (pdfInput) {
    await pdfInput.uploadFile(tempPdf);
    await delay(2000);
  }

  const toasts = await page.evaluate(() => {
    const toastEls = Array.from(document.querySelectorAll('.admin-toast, [class*="toast"], [style*="position: fixed"]'));
    return toastEls.map(t => ({ text: t.innerText, className: t.className, style: t.getAttribute('style') }));
  });
  console.log('PDF UPLOAD TOASTS:', JSON.stringify(toasts, null, 2));

  try { fs.unlinkSync(tempPdf); } catch {}
  await browser.close();
}
run();
