const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'https://abhisingh-website.vercel.app';
const ARTIFACT_DIR = 'C:\\Users\\ashut\\.gemini\\antigravity\\brain\\d44916b9-6f29-404e-b94f-138b40f5c159';

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function verifyLiveUpload() {
  console.log('Testing live upload verification on Vercel...');

  const tempImg = path.join(__dirname, 'verified_test_cover.png');
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAANElEQVR42u3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC4GQ2YAAE1v8w+AAAAAElFTkSuQmCC';
  fs.writeFileSync(tempImg, Buffer.from(pngBase64, 'base64'));

  const tempPdf = path.join(__dirname, 'verified_deliverable.pdf');
  fs.writeFileSync(tempPdf, '%PDF-1.4\n%âãÏÓ\n1 0 obj\n<< /Title (Verified Deliverable) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto(`${BASE_URL}/admin.html`, { waitUntil: 'domcontentloaded' });
  await delay(1000);

  // Authenticate
  await page.evaluate(() => {
    const session = {
      role: 'super_admin',
      adminName: 'Abhi Singh',
      email: 'abhi@eatliftrun.in',
      authenticated: true,
      loginTime: new Date().toISOString()
    };
    localStorage.setItem('abhisingh_super_admin_session', JSON.stringify(session));
    localStorage.setItem('abhisingh_admin_session', JSON.stringify(session));
    localStorage.setItem('elrx_admin_session', JSON.stringify(session));
  });

  await page.goto(`${BASE_URL}/admin.html`, { waitUntil: 'domcontentloaded' });
  await delay(1500);

  // Navigate to Products & Store
  await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll('.admin-nav-item, button'));
    const prodTab = navItems.find(el => el.innerText.includes('Products & Store'));
    if (prodTab) prodTab.click();
  });
  await delay(1000);

  // Click Add New Product
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.innerText.includes('+ Add New Product'));
    if (addBtn) addBtn.click();
  });
  await delay(1000);

  // Upload Product Cover Image
  const imgInput = await page.$('.admin-modal input[type="file"][accept*="image"]');
  if (imgInput) {
    console.log('Uploading cover image...');
    await imgInput.uploadFile(tempImg);
    await delay(1500);
  }

  // Upload PDF Deliverable
  const pdfInput = await page.$('.admin-modal input[type="file"][accept*="pdf"]');
  if (pdfInput) {
    console.log('Uploading PDF deliverable...');
    await pdfInput.uploadFile(tempPdf);
    await delay(1500);
  }

  // Capture modal screenshot
  const screenshotPath = path.join(ARTIFACT_DIR, 'verified_live_product_upload_fixed.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log('Saved screenshot to:', screenshotPath);

  // Gather status
  const result = await page.evaluate(() => {
    const modal = document.querySelector('.admin-modal');
    const toast = document.querySelector('.admin-toast');
    const imgPreview = modal ? modal.querySelector('img') : null;
    const fileLabel = modal ? modal.querySelector('span[style*="font-size: 0.8rem"]') : null;
    return {
      toastText: toast ? toast.innerText : null,
      hasCoverImg: Boolean(imgPreview),
      coverImgSrc: imgPreview ? imgPreview.src.slice(0, 80) : null,
      pdfText: fileLabel ? fileLabel.innerText : null
    };
  });

  console.log('LIVE VERIFICATION RESULT:', result);

  try { fs.unlinkSync(tempImg); fs.unlinkSync(tempPdf); } catch {}
  await browser.close();
}

verifyLiveUpload().catch(console.error);

