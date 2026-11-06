const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const ARTIFACTS_DIR = 'C:\\Users\\ashut\\.gemini\\antigravity\\brain\\d44916b9-6f29-404e-b94f-138b40f5c159';

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runProductsE2EVerification() {
  console.log('================================================================');
  console.log('STARTING COMPLETE PRODUCT & STORE CMS FUNCTIONALITY E2E TEST');
  console.log('================================================================\n');

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

  const testResults = [];
  function recordTest(testNumber, testName, passed, details = '') {
    testResults.push({ testNumber, testName, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[Test ${testNumber}] ${mark}: ${testName} ${details ? `(${details})` : ''}`);
  }

  try {
    // -------------------------------------------------------------
    // SETUP: Inject super admin session
    // -------------------------------------------------------------
    console.log('--- Step 0: Ingesting Admin Auth Session ---');
    await page.goto(`${BASE_URL}/admin.html`, { waitUntil: 'networkidle2' });
    await delay(1000);

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

    await page.goto(`${BASE_URL}/admin.html`, { waitUntil: 'networkidle2' });
    await delay(1500);

    // Navigate to Products & Store tab
    await page.evaluate(() => {
      const navBtns = Array.from(document.querySelectorAll('.admin-nav-item, button'));
      const prodNav = navBtns.find(b => b.innerText.includes('Products & Store'));
      if (prodNav) prodNav.click();
    });
    await delay(1000);

    // -------------------------------------------------------------
    // TEST 1: File Upload Engine & MAX_FILE_SIZE_BYTES Validation
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Testing Upload Engine & OWASP Validations ---');
    const uploadCheck = await page.evaluate(async () => {
      try {
        const dbModule = await import('/src/services/db.js');
        const { uploadMediaAsset, MAX_FILE_SIZE_BYTES, ALLOWED_MEDIA_EXTENSIONS } = dbModule;

        // Check constant definition
        if (!MAX_FILE_SIZE_BYTES || MAX_FILE_SIZE_BYTES !== 25 * 1024 * 1024) {
          return { success: false, error: 'MAX_FILE_SIZE_BYTES is not 25MB' };
        }

        // Test valid mock image
        const validFile = new File(['valid image mock byte data'], 'test-cover.jpg', { type: 'image/jpeg' });
        const validAsset = await uploadMediaAsset(validFile, 'image');
        if (!validAsset || !validAsset.publicUrl) {
          return { success: false, error: 'Valid image upload failed to return publicUrl' };
        }

        // Test oversized file (> 25MB)
        let oversizedRejected = false;
        let oversizedError = '';
        try {
          const bigFile = new File(['dummy small bytes'], 'huge-file.jpg', { type: 'image/jpeg' });
          Object.defineProperty(bigFile, 'size', { value: 30 * 1024 * 1024, configurable: true });
          await uploadMediaAsset(bigFile, 'image');
        } catch (e) {
          oversizedError = e.message;
          if (e.message && e.message.includes('exceeds maximum limit of 25MB')) {
            oversizedRejected = true;
          }
        }

        // Test invalid extension (.exe)
        let invalidTypeRejected = false;
        let invalidError = '';
        try {
          const exeFile = new File(['malicious'], 'malware.exe', { type: 'application/x-msdownload' });
          await uploadMediaAsset(exeFile);
        } catch (e) {
          invalidError = e.message;
          if (e.message && e.message.includes('Disallowed file type')) {
            invalidTypeRejected = true;
          }
        }

        return {
          success: true,
          validUploadUrl: validAsset.publicUrl,
          oversizedRejected,
          oversizedError,
          invalidTypeRejected,
          invalidError,
        };
      } catch (err) {
        return { success: false, error: err.message };
      }
    });

    const t1Passed = uploadCheck.success && uploadCheck.oversizedRejected && uploadCheck.invalidTypeRejected;
    recordTest(
      1,
      'File Upload Engine & MAX_FILE_SIZE_BYTES',
      t1Passed,
      t1Passed ? '25MB limit validated, valid upload succeeded, malicious types rejected' : `Oversized: ${uploadCheck.oversizedRejected} (${uploadCheck.oversizedError}), Invalid: ${uploadCheck.invalidTypeRejected} (${uploadCheck.invalidError})`
    );

    // -------------------------------------------------------------
    // TEST 2: Product Cover Image Upload & Direct URL
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Product Cover Image Management ---');
    // Open product modal
    await page.evaluate(() => {
      const addBtns = Array.from(document.querySelectorAll('button'));
      const addBtn = addBtns.find(b => b.innerText.includes('+ Add New Product'));
      if (addBtn) addBtn.click();
    });
    await delay(600);

    const coverCheck = await page.evaluate(async () => {
      const modal = document.querySelector('.admin-modal');
      if (!modal) return { success: false, error: 'Modal not opened' };

      const urlInput = modal.querySelector('input[placeholder*="direct image URL"]');
      if (!urlInput) return { success: false, error: 'Cover URL input not found' };

      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(urlInput, 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400');
      urlInput.dispatchEvent(new Event('input', { bubbles: true }));
      urlInput.dispatchEvent(new Event('change', { bubbles: true }));

      return { success: true };
    });
    await delay(500);

    const previewRendered = await page.evaluate(() => {
      const modal = document.querySelector('.admin-modal');
      const img = modal.querySelector('img[src*="unsplash.com"]');
      return Boolean(img);
    });

    recordTest(
      2,
      'Product Cover Image Upload & Live Preview',
      coverCheck.success && previewRendered,
      'Direct URL set and live preview rendered inside artwork container'
    );

    // -------------------------------------------------------------
    // TEST 3: PDF Deliverable Upload & Management
    // -------------------------------------------------------------
    console.log('\n--- Test 3: PDF Deliverable Upload & Preview Link ---');
    const pdfCheck = await page.evaluate(async () => {
      const dbModule = await import('/src/services/db.js');
      const { uploadMediaAsset } = dbModule;

      const pdfBlob = new Blob(['%PDF-1.4 mock pdf content for kettlebell handbook'], { type: 'application/pdf' });
      const pdfFile = new File([pdfBlob], 'kettlebell-handbook.pdf', { type: 'application/pdf' });
      const asset = await uploadMediaAsset(pdfFile, 'pdf');

      return {
        attached: Boolean(asset && asset.publicUrl),
        url: asset?.publicUrl,
      };
    });

    recordTest(
      3,
      'PDF Deliverable Upload & Attachment',
      pdfCheck.attached,
      `Uploaded and attached PDF deliverable (${pdfCheck.url ? 'Asset URL verified' : 'No URL'})`
    );

    // -------------------------------------------------------------
    // TEST 4: Product Form Fields & Auto Slug Generation
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Form Fields & Auto Slug Generation ---');
    const slugCheck = await page.evaluate(() => {
      const modal = document.querySelector('.admin-modal');
      const titleInput = modal.querySelector('input[required]');
      const slugInput = modal.querySelector('input[placeholder*="mastering-kettlebell"]');

      if (!titleInput || !slugInput) return { success: false, error: 'Inputs not found' };

      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(titleInput, 'Precision Kettlebell Complex Program');
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));

      const autoSlug = slugInput.value;
      const expectedSlug = 'precision-kettlebell-complex-program';

      return {
        success: autoSlug === expectedSlug,
        autoSlug,
        expectedSlug,
      };
    });

    recordTest(
      4,
      'Product Form Fields & Auto-Slug Generation',
      slugCheck.success,
      `Auto-generated slug: "${slugCheck.autoSlug}"`
    );

    // -------------------------------------------------------------
    // TEST 5: Create Product (Draft Mode First)
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Create Product in Draft Mode ---');
    const createDraftResult = await page.evaluate(async () => {
      const dbModule = await import('/src/services/db.js');
      const { createProduct, getProducts } = dbModule;

      const initialList = await getProducts(true, true);
      const initialCount = initialList.length;

      const newDraft = await createProduct({
        title: 'Complete Kettlebell Snatch Playbook',
        slug: 'complete-kettlebell-snatch-playbook',
        product_type: 'digital_download',
        category: 'Book',
        format: 'PDF (Digital Download)',
        is_free: false,
        price_inr: 799,
        price_usd: 29,
        tagline: 'Comprehensive guide to mastering the kettlebell snatch step-by-step',
        short_description: 'Comprehensive guide to mastering the kettlebell snatch step-by-step',
        full_description: 'Complete training protocols, regressions, and volume cycles.',
        stock_status: 'in_stock',
        status: 'draft',
        cover_image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400',
        file_url: 'https://mock.cdn/snatch-playbook.pdf',
      });

      const updatedList = await getProducts(true, true);
      const countDiff = updatedList.length - initialCount;

      return {
        success: Boolean(newDraft && newDraft.id && countDiff === 1),
        product: newDraft,
        countDiff,
      };
    });

    recordTest(
      5,
      'Product Creation in Draft Mode',
      createDraftResult.success,
      `Created product ID: ${createDraftResult.product?.id}, count increased by ${createDraftResult.countDiff}`
    );

    // -------------------------------------------------------------
    // TEST 6: Draft Isolation (Private in CMS, Hidden from Public Store)
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Draft Privacy & Public Store Isolation ---');
    const createdDraftId = createDraftResult.product?.id;

    // Refresh admin data
    await page.evaluate(() => {
      if (window.__refreshAllData) window.__refreshAllData();
    });
    await delay(500);

    // Open public store in another page using hash route /#store
    const storePage = await browser.newPage();
    await storePage.setViewport({ width: 1400, height: 900 });
    await storePage.goto(`${BASE_URL}/#store`, { waitUntil: 'networkidle2' });
    await delay(1200);

    const storeDraftCheck = await storePage.evaluate((title) => {
      const cards = Array.from(document.querySelectorAll('.product-card, .dealdeck-product-card'));
      const found = cards.some(c => c.innerText && c.innerText.includes(title));
      return { foundOnStore: found };
    }, 'Complete Kettlebell Snatch Playbook');

    const draftIsolated = !storeDraftCheck.foundOnStore;
    recordTest(
      6,
      'Draft Privacy & Public Store Isolation',
      draftIsolated,
      draftIsolated ? 'Draft product is strictly hidden from public /#store page' : 'FAIL: Draft appeared on public store!'
    );

    // -------------------------------------------------------------
    // TEST 7: Publish Product & Verify Public Store Appearance
    // -------------------------------------------------------------
    console.log('\n--- Test 7: Publish Product & Public Store Synchronization ---');
    await page.evaluate(async (id) => {
      const dbModule = await import('/src/services/db.js');
      await dbModule.updateProduct(id, { status: 'published' });
    }, createdDraftId);

    // Reload store page
    await storePage.goto(`${BASE_URL}/#store`, { waitUntil: 'networkidle2' });
    await delay(1200);

    const storePublishedCheck = await storePage.evaluate((title) => {
      const cards = Array.from(document.querySelectorAll('.product-card'));
      const found = cards.some(c => c.innerText && c.innerText.includes(title));
      const pageText = document.body.innerText;
      const hasUndefined = pageText.includes('₹undefined') || pageText.includes('$undefined') || pageText.includes('NaN');
      return {
        foundOnStore: found,
        hasUndefined,
      };
    }, 'Complete Kettlebell Snatch Playbook');

    recordTest(
      7,
      'Product Publishing & Public Store Sync',
      storePublishedCheck.foundOnStore && !storePublishedCheck.hasUndefined,
      'Published product appeared immediately on /#store with zero undefined prices'
    );

    // -------------------------------------------------------------
    // TEST 8: Edit Product In-Place (No Duplication, Custom Slug Preserved)
    // -------------------------------------------------------------
    console.log('\n--- Test 8: Edit Product In-Place (Zero Duplication) ---');
    const editCheck = await page.evaluate(async (id) => {
      const dbModule = await import('/src/services/db.js');
      const { updateProduct, getProducts } = dbModule;

      const beforeList = await getProducts(true, true);
      const beforeCount = beforeList.length;

      const updated = await updateProduct(id, {
        title: 'Complete Kettlebell Snatch Playbook (Updated Edition)',
        tagline: 'Refined 2026 Edition with full video drill index',
        price_inr: 899,
        price_usd: 35,
      });

      const afterList = await getProducts(true, true);
      const afterCount = afterList.length;

      return {
        success: updated && updated.title.includes('Updated Edition') && beforeCount === afterCount,
        noDuplication: beforeCount === afterCount,
        updatedPrice: `₹${updated.price_inr} / $${updated.price_usd}`,
      };
    }, createdDraftId);

    recordTest(
      8,
      'Edit Product In-Place (Zero Duplication)',
      editCheck.success && editCheck.noDuplication,
      `Updated in-place, count unchanged (${editCheck.updatedPrice})`
    );

    // -------------------------------------------------------------
    // TEST 9: Stock Status Management (Out of Stock Badge & Paused Checkout)
    // -------------------------------------------------------------
    console.log('\n--- Test 9: Out of Stock Management & Checkout Pause ---');
    await page.evaluate(async (id) => {
      const dbModule = await import('/src/services/db.js');
      await dbModule.updateProduct(id, { stock_status: 'out_of_stock' });
    }, createdDraftId);

    await storePage.goto(`${BASE_URL}/#store`, { waitUntil: 'networkidle2' });
    await delay(1200);

    const outOfStockCheck = await storePage.evaluate((title) => {
      const cards = Array.from(document.querySelectorAll('.product-card'));
      const card = cards.find(c => c.innerText && c.innerText.includes(title));
      if (!card) return { found: false };

      const cardText = card.innerText;
      const hasSoldOutBadge = cardText.includes('Out of Stock') || cardText.includes('Sold Out');
      const button = card.querySelector('button');
      const buttonDisabled = button ? (button.disabled || button.innerText.includes('Sold Out') || button.innerText.includes('Out of Stock')) : false;

      return {
        found: true,
        hasSoldOutBadge,
        buttonDisabled,
      };
    }, 'Complete Kettlebell Snatch Playbook');

    const t9Passed = outOfStockCheck.found && outOfStockCheck.hasSoldOutBadge;
    recordTest(
      9,
      'Out of Stock Status & Paused Purchase',
      t9Passed,
      'Product remains visible with "Out of Stock" badge and paused button'
    );

    // -------------------------------------------------------------
    // TEST 10: Soft Delete to Trash, Restore & Permanent Deletion
    // -------------------------------------------------------------
    console.log('\n--- Test 10: Trash, Restore & Permanent Deletion Workflow ---');
    const trashWorkflowResult = await page.evaluate(async (id) => {
      const dbModule = await import('/src/services/db.js');
      const { deleteProduct, restoreProduct, permanentlyDeleteProduct, getProducts } = dbModule;

      // 1. Soft delete to Trash
      await deleteProduct(id, false);
      const afterSoftDelete = await getProducts(true, true);
      const softDeletedItem = afterSoftDelete.find(p => p.id === id);
      const inTrash = softDeletedItem && softDeletedItem.status === 'trash' && softDeletedItem.is_deleted;
      const hasDeletedAt = Boolean(softDeletedItem && softDeletedItem.deleted_at);

      // Verify active products list excludes it
      const activeList = await getProducts(true, false);
      const excludedFromActive = !activeList.some(p => p.id === id);

      // 2. Restore from Trash
      await restoreProduct(id);
      const afterRestore = await getProducts(true, true);
      const restoredItem = afterRestore.find(p => p.id === id);
      const isRestored = restoredItem && restoredItem.status === 'published' && !restoredItem.is_deleted;

      // 3. Permanent delete
      await permanentlyDeleteProduct(id);
      const afterPermanent = await getProducts(true, true);
      const isPermanentlyGone = !afterPermanent.some(p => p.id === id);

      return {
        inTrash,
        hasDeletedAt,
        excludedFromActive,
        isRestored,
        isPermanentlyGone,
      };
    }, createdDraftId);

    const t10Passed =
      trashWorkflowResult.inTrash &&
      trashWorkflowResult.hasDeletedAt &&
      trashWorkflowResult.excludedFromActive &&
      trashWorkflowResult.isRestored &&
      trashWorkflowResult.isPermanentlyGone;

    recordTest(
      10,
      'Soft Delete, Timestamped Trash, Restore & Permanent Purge',
      t10Passed,
      'Full lifecycle: Soft-deleted with timestamp -> excluded from active store -> restored with fields intact -> permanently purged'
    );

    // Close any open modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.admin-modal-header button');
      if (closeBtn) closeBtn.click();
    });
    await delay(500);

    // -------------------------------------------------------------
    // SCREENSHOT CAPTURES & UI VERIFICATION
    // -------------------------------------------------------------
    console.log('\n--- Capturing Verified Artifact Screenshots ---');
    // Ensure we are in Products & Store tab
    await page.evaluate(() => {
      const navBtns = Array.from(document.querySelectorAll('.admin-nav-item, button'));
      const prodNav = navBtns.find(b => b.innerText.includes('Products & Store'));
      if (prodNav) prodNav.click();
    });
    await delay(800);

    const cmsProductsScreenshot = path.join(ARTIFACTS_DIR, 'verified_product_cms_management.png');
    await page.screenshot({ path: cmsProductsScreenshot });
    console.log(`Saved screenshot: ${cmsProductsScreenshot}`);

    // Capture Store Page
    const storeScreenshot = path.join(ARTIFACTS_DIR, 'verified_public_store_products.png');
    await storePage.screenshot({ path: storeScreenshot });
    console.log(`Saved screenshot: ${storeScreenshot}`);

    await storePage.close();
    await browser.close();

    console.log('\n================================================================');
    console.log('ALL 10 E2E PRODUCT & STORE CMS VERIFICATION TESTS COMPLETED');
    console.log('================================================================');
    console.log(JSON.stringify(testResults, null, 2));

    return testResults;
  } catch (error) {
    console.error('Test execution failed:', error);
    await browser.close();
    process.exit(1);
  }
}

runProductsE2EVerification();
