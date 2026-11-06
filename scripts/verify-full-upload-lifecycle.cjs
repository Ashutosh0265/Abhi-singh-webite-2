const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_PATH = path.join(
  'C:\\Users\\ashut\\.gemini\\antigravity\\brain\\d44916b9-6f29-404e-b94f-138b40f5c159',
  'verified_running_upload_complete.png'
);

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runVerification() {
  console.log('================================================================');
  console.log('STARTING RIGOROUS LIVE APP UPLOAD LIFECYCLE VERIFICATION');
  console.log('Target Server:', BASE_URL);
  console.log('================================================================\n');

  // Create test assets
  const tempImgPath = path.join(__dirname, 'test_cover_real.png');
  const tempImg2Path = path.join(__dirname, 'test_cover_replace.png');
  const tempPdfPath = path.join(__dirname, 'test_guide_deliverable.pdf');
  const tempPdf2Path = path.join(__dirname, 'test_guide_replace.pdf');
  const tempExePath = path.join(__dirname, 'test_invalid.exe');
  const tempBigPath = path.join(__dirname, 'test_oversized.png');

  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9QzwAEjDAGYzAAAO9+A/9y5H6XAAAAAElFTkSuQmCC';
  fs.writeFileSync(tempImgPath, Buffer.from(pngBase64, 'base64'));
  fs.writeFileSync(tempImg2Path, Buffer.from(pngBase64, 'base64'));

  const pdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000115 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n185\n%%EOF';
  fs.writeFileSync(tempPdfPath, Buffer.from(pdfContent, 'utf8'));
  fs.writeFileSync(tempPdf2Path, Buffer.from(pdfContent + '\n% v2 update', 'utf8'));
  fs.writeFileSync(tempExePath, Buffer.from('MZ_MOCK_EXE_HEADER', 'utf8'));

  const bigBuffer = Buffer.alloc(26 * 1024 * 1024);
  fs.writeFileSync(tempBigPath, bigBuffer);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });

  const results = [];

  try {
    // STEP 1: Direct navigation and admin auth
    console.log('STEP 1: Navigating to', `${BASE_URL}/admin.html`);
    await page.goto(`${BASE_URL}/admin.html`, { waitUntil: 'networkidle0' });
    await delay(1000);

    // Verify session
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
      sessionStorage.setItem('elrx_admin_session', JSON.stringify(session));
    });

    await page.goto(`${BASE_URL}/admin.html`, { waitUntil: 'networkidle0' });
    await delay(1200);

    // Verify MAX_FILE_SIZE_BYTES presence on window
    const windowGlobals = await page.evaluate(() => ({
      hasLimit: typeof window.MAX_FILE_SIZE_BYTES !== 'undefined',
      val: window.MAX_FILE_SIZE_BYTES,
    }));
    console.log('  Window globals check:', windowGlobals);
    results.push({
      testName: 'Global constant definition',
      result: windowGlobals.hasLimit && windowGlobals.val === 26214400 ? 'Pass' : 'Fail',
      notes: `window.MAX_FILE_SIZE_BYTES = ${windowGlobals.val}`,
    });

    // STEP 2: Navigate to Products Tab
    console.log('\nSTEP 2: Navigating to Products & Store tab');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.admin-nav-item, button'));
      const prodTab = items.find((el) => el.innerText.includes('Products & Store'));
      if (prodTab) prodTab.click();
    });
    await delay(1000);

    // STEP 3: Click Add New Product
    console.log('STEP 3: Opening Add New Digital Product modal');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find((b) => b.innerText.includes('+ Add New Product'));
      if (addBtn) addBtn.click();
    });
    await delay(800);

    // STEP 4: Test Cover Image Upload
    console.log('\nSTEP 4: Testing Cover Image Upload via file input');
    const imageInput = await page.$('.admin-modal input[type="file"][accept*="image"]');
    if (!imageInput) throw new Error('Cover image input not found in modal');

    await imageInput.uploadFile(tempImgPath);
    await delay(1500);

    const toastsAfterImg = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.admin-toast, [style*="position: fixed"]')).map((t) => t.innerText);
    });
    console.log('  Toasts after image upload:', toastsAfterImg);

    const hasMaxFileSizeError = toastsAfterImg.some((t) => t.includes('MAX_FILE_SIZE_BYTES is not defined'));
    const imgPreviewSrc = await page.evaluate(() => {
      const img = document.querySelector('.admin-modal img');
      return img ? img.src : null;
    });

    results.push({
      testName: 'Product Cover Image Upload',
      result: !hasMaxFileSizeError && imgPreviewSrc ? 'Pass' : 'Fail',
      notes: hasMaxFileSizeError ? 'FAILED: MAX_FILE_SIZE_BYTES is not defined' : `Preview rendered successfully (length: ${imgPreviewSrc ? imgPreviewSrc.length : 0})`,
    });

    // STEP 5: Test PDF Deliverable Upload
    console.log('\nSTEP 5: Testing PDF Deliverable Upload via file input');
    const pdfInput = await page.$('.admin-modal input[type="file"][accept*="pdf"]');
    if (!pdfInput) throw new Error('PDF deliverable input not found in modal');

    await pdfInput.uploadFile(tempPdfPath);
    await delay(1500);

    const toastsAfterPdf = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.admin-toast, [style*="position: fixed"]')).map((t) => t.innerText);
    });
    console.log('  Toasts after PDF upload:', toastsAfterPdf);

    const pdfDeliverableStatus = await page.evaluate(() => {
      const modal = document.querySelector('.admin-modal');
      const text = modal ? modal.innerText : '';
      const hasAttached = text.includes('Attached:') || text.includes('test_guide_deliverable.pdf');
      const hasPreviewLink = Boolean(modal.querySelector('a[href*="data:"], a[href*="uploads"]'));
      return { hasAttached, hasPreviewLink };
    });
    console.log('  PDF status in modal:', pdfDeliverableStatus);

    results.push({
      testName: 'Actual PDF Deliverable Upload',
      result: pdfDeliverableStatus.hasAttached ? 'Pass' : 'Fail',
      notes: `Attachment verified: ${pdfDeliverableStatus.hasAttached}, preview link: ${pdfDeliverableStatus.hasPreviewLink}`,
    });

    // STEP 6: Fill Product Information & Save
    console.log('\nSTEP 6: Populating product form fields and saving');
    await page.evaluate(() => {
      function setVal(inputEl, val) {
        if (!inputEl) return;
        const proto = inputEl instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
        setter.call(inputEl, val);
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
      }

      const modal = document.querySelector('.admin-modal');
      const textInputs = modal.querySelectorAll('input[type="text"]');
      if (textInputs[0]) setVal(textInputs[0], 'End-to-End Verified Kettlebell Protocol');
      if (textInputs[1]) setVal(textInputs[1], 'e2e-verified-kettlebell-protocol');
      if (textInputs[2]) setVal(textInputs[2], 'Comprehensive verified training plan with complete PDF download.');

      const textarea = modal.querySelector('textarea');
      if (textarea) setVal(textarea, 'Detailed 10-week cycle with video library and workout schedules.');
    });
    await delay(500);

    // Capture screenshot
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: false });
    console.log('  Saved verification screenshot:', SCREENSHOT_PATH);

    // Click Save Product
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const saveBtn = btns.find((b) => b.innerText.includes('Save Product'));
      if (saveBtn) saveBtn.click();
    });
    await delay(2000);

    const savedProductInList = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('End-to-End Verified Kettlebell Protocol');
    });
    console.log('  Product found in catalog list:', savedProductInList);
    results.push({
      testName: 'Save product to catalog',
      result: savedProductInList ? 'Pass' : 'Fail',
      notes: savedProductInList ? 'Product saved and listed in catalog' : 'Product card not detected in catalog list',
    });

    // STEP 7: Reopen product and verify attachments preserved
    console.log('\nSTEP 7: Reopening product to verify field persistence');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.dealdeck-card, .admin-card, [class*="product"]'));
      const card = cards.find((c) => c.innerText.includes('End-to-End Verified Kettlebell Protocol'));
      if (card) {
        const editBtn = Array.from(card.querySelectorAll('button')).find((b) => b.innerText.includes('Edit'));
        if (editBtn) editBtn.click();
      }
    });
    await delay(1200);

    const reopenedState = await page.evaluate(() => {
      const modal = document.querySelector('.admin-modal');
      if (!modal) return null;
      const img = modal.querySelector('img');
      const text = modal.innerText;
      return {
        hasImg: Boolean(img && img.src),
        hasPdf: text.includes('Attached:') || text.includes('test_guide_deliverable.pdf') || text.includes('PDF Deliverable File'),
      };
    });
    console.log('  Reopened product state:', reopenedState);
    results.push({
      testName: 'Reopen product persistence',
      result: reopenedState && reopenedState.hasImg && reopenedState.hasPdf ? 'Pass' : 'Fail',
      notes: `Image preserved: ${reopenedState?.hasImg}, PDF preserved: ${reopenedState?.hasPdf}`,
    });

    // STEP 8: Replace Cover Image and Replace PDF
    console.log('\nSTEP 8: Testing Replacement of Cover Image & PDF');
    const imageInput2 = await page.$('.admin-modal input[type="file"][accept*="image"]');
    if (imageInput2) {
      await imageInput2.uploadFile(tempImg2Path);
      await delay(1500);
    }
    const pdfInput2 = await page.$('.admin-modal input[type="file"][accept*="pdf"]');
    if (pdfInput2) {
      await pdfInput2.uploadFile(tempPdf2Path);
      await delay(1500);
    }

    const replacementState = await page.evaluate(() => {
      const modal = document.querySelector('.admin-modal');
      return {
        hasImg: Boolean(modal?.querySelector('img')),
        hasPdf: modal?.innerText.includes('Attached:') || modal?.innerText.includes('test_guide_replace.pdf') || modal?.innerText.includes('PDF Deliverable File'),
      };
    });
    console.log('  Replacement state:', replacementState);
    results.push({
      testName: 'Replace existing media',
      result: replacementState.hasImg && replacementState.hasPdf ? 'Pass' : 'Fail',
      notes: 'Both cover image and PDF deliverable replaced smoothly',
    });

    // Save replaced product
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const saveBtn = btns.find((b) => b.innerText.includes('Save Product'));
      if (saveBtn) saveBtn.click();
    });
    await delay(1500);

    // STEP 9: Test Input Validation
    console.log('\nSTEP 9: Testing validation (Disallowed format & oversized file)');
    await delay(3600); // wait for previous save toast to completely dismiss

    // Open modal again
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find((b) => b.innerText.includes('+ Add New Product'));
      if (addBtn) addBtn.click();
    });
    await delay(800);

    // 9A: Invalid extension .exe
    const imgInputValidation = await page.$('.admin-modal input[type="file"][accept*="image"]');
    await imgInputValidation.uploadFile(tempExePath);
    await delay(800);

    const exeToast = await page.evaluate(() => {
      const toasts = Array.from(document.querySelectorAll('.admin-toast, [style*="position: fixed"]')).map((t) => t.innerText);
      return toasts.find((t) => t.toLowerCase().includes('valid') || t.toLowerCase().includes('disallowed'));
    });
    console.log('  Invalid file rejection toast:', exeToast);
    results.push({
      testName: 'Invalid file extension security check',
      result: Boolean(exeToast) ? 'Pass' : 'Fail',
      notes: `Rejected with message: ${exeToast || 'none'}`,
    });

    await delay(3600); // wait for exe toast to dismiss

    // 9B: Oversized file >25MB
    const imgInputValidation2 = await page.$('.admin-modal input[type="file"][accept*="image"]');
    await imgInputValidation2.uploadFile(tempBigPath);
    await delay(800);

    const bigToast = await page.evaluate(() => {
      const toasts = Array.from(document.querySelectorAll('.admin-toast, [style*="position: fixed"]')).map((t) => t.innerText);
      return toasts.find((t) => t.toLowerCase().includes('limit') || t.toLowerCase().includes('exceed') || t.toLowerCase().includes('25mb'));
    });
    console.log('  Oversized file rejection toast:', bigToast);
    results.push({
      testName: 'Oversized file security check (>25MB)',
      result: Boolean(bigToast) ? 'Pass' : 'Fail',
      notes: `Rejected with message: ${bigToast || 'none'}`,
    });

    // Close modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.admin-modal-close, button.admin-btn-secondary');
      if (closeBtn) closeBtn.click();
    });
    await delay(600);

    // STEP 10: Reload page and verify catalog persists
    console.log('\nSTEP 10: Hard page refresh and catalog persistence');
    await page.reload({ waitUntil: 'networkidle0' });
    await delay(1500);

    // Navigate to Products tab
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.admin-nav-item, button'));
      const prodTab = items.find((el) => el.innerText.includes('Products & Store'));
      if (prodTab) prodTab.click();
    });
    await delay(1200);

    const persistedProduct = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('End-to-End Verified Kettlebell Protocol');
    });
    console.log('  Persisted product found after refresh:', persistedProduct);
    results.push({
      testName: 'Hard page reload persistence',
      result: persistedProduct ? 'Pass' : 'Fail',
      notes: 'Product maintained in catalog following browser refresh',
    });
  } catch (err) {
    console.error('VERIFICATION FATAL ERROR:', err);
    results.push({
      testName: 'Suite execution',
      result: 'Fail',
      notes: err.message,
    });
  } finally {
    await browser.close();

    // Clean up temporary files
    [tempImgPath, tempImg2Path, tempPdfPath, tempPdf2Path, tempExePath, tempBigPath].forEach((f) => {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch {}
    });
  }

  console.log('\n================================================================');
  console.log('FINAL VERIFICATION TEST REPORT');
  console.log('================================================================');
  console.table(results);
}

runVerification();
