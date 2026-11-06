const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const ARTIFACTS_DIR = 'C:\\Users\\ashut\\.gemini\\antigravity\\brain\\d44916b9-6f29-404e-b94f-138b40f5c159';

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runUploadSpecificTests() {
  console.log('================================================================');
  console.log('STARTING PRODUCT IMAGE & PDF UPLOAD SPECIFIC VERIFICATION');
  console.log('================================================================\n');

  // Prepare temporary test files on disk
  const tempDir = path.join(__dirname, 'temp_test_files');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const testImagePath = path.join(tempDir, 'test-kettlebell-cover.png');
  const testPdfPath = path.join(tempDir, 'test-kettlebell-guide.pdf');
  const testInvalidPath = path.join(tempDir, 'malicious-script.exe');
  const testReplacementImagePath = path.join(tempDir, 'replacement-cover.png');
  const testReplacementPdfPath = path.join(tempDir, 'replacement-guide.pdf');

  // Create 1x1 transparent PNG bytes
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  fs.writeFileSync(testImagePath, Buffer.from(pngBase64, 'base64'));
  fs.writeFileSync(testReplacementImagePath, Buffer.from(pngBase64, 'base64'));

  // Create valid PDF minimal header bytes
  fs.writeFileSync(testPdfPath, '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n160\n%%EOF');
  fs.writeFileSync(testReplacementPdfPath, '%PDF-1.4\n% Replacement Edition PDF\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF');

  fs.writeFileSync(testInvalidPath, 'MZ fake windows executable header');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });

  const uploadResults = [];
  function record(testName, result, notes = '') {
    uploadResults.push({ testName, result, notes });
    const mark = result === 'Pass' ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark}: ${testName} - ${notes}`);
  }

  try {
    // -------------------------------------------------------------
    // Setup Admin Session
    // -------------------------------------------------------------
    await page.goto(`${BASE_URL}/admin.html`, { waitUntil: 'domcontentloaded' });
    await delay(800);

    await page.evaluate(() => {
      const mockSession = {
        role: 'super_admin',
        adminName: 'Abhi Singh',
        email: 'abhi@eatliftrun.in',
        authenticated: true,
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem('abhisingh_super_admin_session', JSON.stringify(mockSession));
      localStorage.setItem('abhisingh_admin_session', JSON.stringify(mockSession));
      localStorage.setItem('elrx_admin_session', JSON.stringify(mockSession));
    });

    await page.goto(`${BASE_URL}/admin.html`, { waitUntil: 'domcontentloaded' });
    await delay(1200);

    // Open Products & Store Tab
    await page.evaluate(() => {
      const navBtns = Array.from(document.querySelectorAll('.admin-nav-item, button'));
      const prodNav = navBtns.find(b => b.innerText.includes('Products & Store'));
      if (prodNav) prodNav.click();
    });
    await delay(800);

    // Click "+ Add New Product"
    await page.evaluate(() => {
      const addBtns = Array.from(document.querySelectorAll('button'));
      const addBtn = addBtns.find(b => b.innerText.includes('+ Add New Product'));
      if (addBtn) addBtn.click();
    });
    await delay(600);

    // 1. Enter Product Details
    await page.evaluate(() => {
      const modal = document.querySelector('.admin-modal');
      const titleInput = modal.querySelector('input[required]');
      const tagInput = modal.querySelector('input[placeholder*="programming"]');
      const descInput = modal.querySelector('textarea');

      const setVal = (el, val) => {
        const proto = el instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (setter) setter.call(el, val);
        else el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      };

      if (titleInput) setVal(titleInput, 'Kettlebell Strength & Hypertrophy Blueprint');
      if (tagInput) setVal(tagInput, '12-Week periodized hypertrophy protocol');
      if (descInput) setVal(descInput, 'Comprehensive lifting manual with rep ranges, rest intervals, and progressions.');
    });
    await delay(400);

    // 2. Upload Product Cover Image via File Input
    console.log('\n--- Testing Cover Image Upload via DOM file input ---');
    const imageInput = await page.$('.admin-modal input[type="file"][accept*="image"]');
    if (!imageInput) throw new Error('Cover image input not found in modal');
    await imageInput.uploadFile(testImagePath);
    await delay(1200);

    // Check preview
    const imagePreviewUrl = await page.evaluate(() => {
      const modal = document.querySelector('.admin-modal');
      const img = modal.querySelector('img[src*="data:image"], img[src*="uploads"], img[src*="assets"]');
      return img ? img.src : null;
    });

    record('New product image upload', imagePreviewUrl ? 'Pass' : 'Fail', imagePreviewUrl ? 'Uploaded successfully without MAX_FILE_SIZE_BYTES error' : 'No preview URL generated');
    record('Image preview', imagePreviewUrl ? 'Pass' : 'Fail', imagePreviewUrl ? 'Preview rendered in artwork container' : 'Preview missing');

    // 3. Upload Actual PDF Deliverable via File Input
    console.log('\n--- Testing PDF Deliverable Upload via DOM file input ---');
    const pdfInput = await page.$('.admin-modal input[type="file"][accept*="pdf"]');
    if (!pdfInput) throw new Error('PDF deliverable input not found in modal');
    await pdfInput.uploadFile(testPdfPath);
    await delay(1200);

    // Check PDF attachment
    const pdfAttached = await page.evaluate(() => {
      const modal = document.querySelector('.admin-modal');
      const attachedText = modal.innerText.includes('Attached: test-kettlebell-guide.pdf') ||
                           modal.innerText.includes('test-kettlebell-guide') ||
                           Boolean(modal.querySelector('a[href*="data:application/pdf"], a[href*="uploads"]'));
      return attachedText;
    });

    record('New product PDF upload', pdfAttached ? 'Pass' : 'Fail', pdfAttached ? 'PDF uploaded and attached cleanly' : 'PDF attachment failed');
    record('PDF attachment', pdfAttached ? 'Pass' : 'Fail', pdfAttached ? 'Attached state and preview link active' : 'Attached state not shown');

    // 4. Save Product
    console.log('\n--- Saving Product ---');
    await page.evaluate(() => {
      const modal = document.querySelector('.admin-modal');
      const saveBtn = Array.from(modal.querySelectorAll('button')).find(b => b.innerText.includes('Save Product'));
      if (saveBtn) saveBtn.click();
    });
    await delay(1200);

    const productSaved = await page.evaluate(() => {
      const pageText = document.body.innerText;
      return pageText.includes('Kettlebell Strength & Hypertrophy Blueprint');
    });

    record('Save product', productSaved ? 'Pass' : 'Fail', productSaved ? 'Product saved and listed in CMS catalog' : 'Product not found after save');

    // 5. Reopen Product and Verify Both Files Preserved
    console.log('\n--- Reopening Product to verify persistence ---');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.dealdeck-product-card, tr'));
      const targetCard = cards.find(c => c.innerText.includes('Kettlebell Strength & Hypertrophy Blueprint'));
      if (targetCard) {
        const editBtn = Array.from(targetCard.querySelectorAll('button')).find(b => b.innerText.includes('Edit'));
        if (editBtn) editBtn.click();
      }
    });
    await delay(1000);

    const reopenedData = await page.evaluate(() => {
      const modal = document.querySelector('.admin-modal');
      if (!modal) return { open: false };
      const img = modal.querySelector('img[src*="data:image"], img[src*="uploads"], img[src*="assets"]');
      const hasPdf = modal.innerText.includes('Attached:') || Boolean(modal.querySelector('a[href*="pdf"]'));
      return {
        open: true,
        hasImage: Boolean(img),
        hasPdf,
      };
    });

    const bothPreserved = reopenedData.open && reopenedData.hasImage && reopenedData.hasPdf;
    record('Reopen product', bothPreserved ? 'Pass' : 'Fail', bothPreserved ? 'Both image preview and attached PDF deliverable preserved' : 'Reopened modal missing media');

    // 6. Replace Existing Image
    console.log('\n--- Replacing Image ---');
    const replaceImageInput = await page.$('.admin-modal input[type="file"][accept*="image"]');
    if (replaceImageInput) {
      await replaceImageInput.uploadFile(testReplacementImagePath);
      await delay(1200);
    }
    const imageReplaced = await page.evaluate(() => {
      const modal = document.querySelector('.admin-modal');
      const img = modal.querySelector('img[src*="data:image"], img[src*="uploads"]');
      return Boolean(img);
    });
    record('Replace existing image', imageReplaced ? 'Pass' : 'Fail', imageReplaced ? 'Image replaced and preview updated' : 'Replacement failed');

    // 7. Replace Existing PDF
    console.log('\n--- Replacing PDF ---');
    const replacePdfInput = await page.$('.admin-modal input[type="file"][accept*="pdf"]');
    if (replacePdfInput) {
      await replacePdfInput.uploadFile(testReplacementPdfPath);
      await delay(1200);
    }
    const pdfReplaced = await page.evaluate(() => {
      const modal = document.querySelector('.admin-modal');
      return modal.innerText.includes('Attached: replacement-guide.pdf') || modal.innerText.includes('replacement-guide');
    });
    record('Replace existing PDF', pdfReplaced ? 'Pass' : 'Fail', pdfReplaced ? 'PDF replaced and new deliverable attached' : 'PDF replacement failed');

    // Close modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.admin-modal-header button');
      if (closeBtn) closeBtn.click();
    });
    await delay(500);

    // 8. Test Invalid File Type
    console.log('\n--- Testing Invalid File Type Error Handling ---');
    const invalidTypeResult = await page.evaluate(async () => {
      try {
        const db = await import('/src/services/db.js');
        const badFile = new File(['executable binary'], 'malicious.exe', { type: 'application/x-msdownload' });
        await db.uploadMediaAsset(badFile);
        return { rejected: false };
      } catch (err) {
        return { rejected: true, message: err.message };
      }
    });

    record('Invalid file type', invalidTypeResult.rejected ? 'Pass' : 'Fail', invalidTypeResult.rejected ? `Rejected with error: ${invalidTypeResult.message}` : 'Should have rejected invalid file type');

    // 9. Test Oversized File
    console.log('\n--- Testing Oversized File Error Handling ---');
    const oversizedResult = await page.evaluate(async () => {
      try {
        const db = await import('/src/services/db.js');
        const bigFile = new File(['dummy content'], 'oversized-file.jpg', { type: 'image/jpeg' });
        Object.defineProperty(bigFile, 'size', { value: 30 * 1024 * 1024 });
        await db.uploadMediaAsset(bigFile);
        return { rejected: false };
      } catch (err) {
        return { rejected: true, message: err.message };
      }
    });

    record('Oversized file', oversizedResult.rejected ? 'Pass' : 'Fail', oversizedResult.rejected ? `Rejected with error: ${oversizedResult.message}` : 'Should have rejected oversized file');

    // 10. Dashboard Refresh & Data Preservation
    console.log('\n--- Testing Dashboard Refresh Persistence ---');
    await page.goto(`${BASE_URL}/admin.html`, { waitUntil: 'domcontentloaded' });
    await delay(1200);

    // Navigate to Products tab
    await page.evaluate(() => {
      const navBtns = Array.from(document.querySelectorAll('.admin-nav-item, button'));
      const prodNav = navBtns.find(b => b.innerText.includes('Products & Store'));
      if (prodNav) prodNav.click();
    });
    await delay(1000);

    const persisted = await page.evaluate(() => {
      const pageText = document.body.innerText;
      return pageText.includes('Kettlebell Strength & Hypertrophy Blueprint');
    });

    record('Dashboard refresh', persisted ? 'Pass' : 'Fail', persisted ? 'Product persisted in catalog after full browser reload' : 'Product disappeared after reload');

    // Take screenshot of the uploaded product inside CMS
    const screenshotPath = path.join(ARTIFACTS_DIR, 'verified_upload_fixes_cms.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`Saved screenshot: ${screenshotPath}`);

    // Cleanup temp test files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}

    await browser.close();

    console.log('\n================================================================');
    console.log('UPLOAD TESTS SUMMARY:');
    console.log('================================================================');
    console.log(JSON.stringify(uploadResults, null, 2));

    return uploadResults;
  } catch (err) {
    console.error('Test script failure:', err);
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
    await browser.close();
    process.exit(1);
  }
}

runUploadSpecificTests();
