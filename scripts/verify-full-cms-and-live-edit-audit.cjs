const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const ARTIFACTS_DIR = 'C:\\Users\\ashut\\.gemini\\antigravity\\brain\\d44916b9-6f29-404e-b94f-138b40f5c159';

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runFullAuditVerification() {
  console.log('================================================================');
  console.log('STARTING COMPLETE CMS, ADMIN DASHBOARD & LIVE EDIT AUDIT TEST');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // Handle any alert / confirm dialogs automatically
  page.on('dialog', async (dialog) => {
    // Accept confirm / alert dialogs
    await dialog.accept();
  });

  const results = [];
  function recordResult(testName, passed, details = '') {
    results.push({ testName, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark}: ${testName} ${details ? `(${details})` : ''}`);
  }

  try {
    // -------------------------------------------------------------
    // PART 0: AUTHENTICATION INJECTION & SETUP
    // -------------------------------------------------------------
    console.log('--- Step 0: Navigating to website and injecting admin session ---');
    await page.goto(`${BASE_URL}/?edit=true#home`, { waitUntil: 'networkidle2' });
    await delay(1000);

    await page.evaluate(() => {
      const mockSession = {
        role: 'super_admin',
        email: 'abhifit19@gmail.com',
        user: { email: 'abhifit19@gmail.com' },
        authenticated: true,
        expiresAt: Date.now() + 86400000,
        token: 'open_admin_session_unrestricted',
      };
      localStorage.setItem('elrx_admin_session', JSON.stringify(mockSession));
      sessionStorage.setItem('elrx_admin_session', JSON.stringify(mockSession));
      sessionStorage.removeItem('elrx_admin_logged_out');
    });

    await page.reload({ waitUntil: 'networkidle2' });
    await delay(1200);

    const hasToolbar = await page.$('.live-admin-toolbar');
    recordResult('Admin Session Injection & Toolbar Display', Boolean(hasToolbar), 'Toolbar rendered');

    // -------------------------------------------------------------
    // PART 1: LIVE EDIT MODE — CARET, TYPING & BACKSPACE
    // -------------------------------------------------------------
    console.log('\n--- Part 1: Live Edit Mode Typing & Caret Position ---');

    // Turn Live Edit ON if not already
    const editBtn = await page.$('.live-toolbar-toggle-btn');
    if (editBtn) {
      const text = await page.evaluate((el) => el.textContent, editBtn);
      if (text.includes('OFF')) {
        await editBtn.click();
        await delay(500);
      }
    }

    // Test 1: Caret stability while typing
    const line1Selector = '[data-content-key="hero.line1"]';
    await page.waitForSelector(line1Selector);
    await page.click(line1Selector);
    await delay(300);

    // Append text at the end
    await page.keyboard.press('End');
    await page.keyboard.type(' DAILY');
    await delay(300);

    const line1Value = await page.$eval(line1Selector, (el) => el.innerText.trim());
    const passTyping = line1Value.endsWith('DAILY');
    recordResult('Live Edit Character Typing & Caret Stability', passTyping, `Value: "${line1Value}"`);

    // Test 2: Select All & Replace
    await page.click(line1Selector);
    await delay(200);
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await delay(200);
    await page.keyboard.type('Forge your');
    await delay(300);

    const replacedVal = await page.$eval(line1Selector, (el) => el.innerText.trim());
    recordResult('Select All & Replace in Editable Element', replacedVal === 'Forge your', `Value: "${replacedVal}"`);

    // -------------------------------------------------------------
    // PART 2: LIVE EDIT MODE — DESIGN, HERO CONTAINER & BOOK COVER
    // -------------------------------------------------------------
    console.log('\n--- Part 2: Hero Container Background, Book Cover & Reset ---');

    // Click Hero Section Tag to select it
    const heroTag = await page.$('[data-section-key="home.hero"] .section-edit-tag');
    if (heroTag) {
      await heroTag.click();
      await delay(500);
    }

    // Verify Inspector Panel opened
    const isPanelOpen = await page.$('.wordpress-properties-panel');
    recordResult('Inspector Panel Opens on Section Selection', Boolean(isPanelOpen));

    // Test Hero Background Color Change to Dark Charcoal (#1A1A1A)
    const charcoalBtn = await page.$('button[title*="#1A1A1A"]');
    if (charcoalBtn) {
      await charcoalBtn.click();
      await delay(400);
    } else {
      // Type in hex input
      const hexInput = await page.$('.panel-hex-input');
      if (hexInput) {
        await hexInput.click({ clickCount: 3 });
        await hexInput.type('#1A1A1A');
        await delay(400);
      }
    }

    // Verify Hero background updated immediately in DOM
    const heroBg = await page.$eval('#book', (el) => el.style.backgroundColor);
    const passHeroBg = heroBg.includes('rgb(26, 26, 26)') || heroBg.includes('#1a1a1a') || heroBg.includes('#1A1A1A');
    recordResult('Hero Container Background Color Customization', passHeroBg, `Style: ${heroBg}`);

    // Click Save Draft button on admin toolbar
    const saveDraftBtn = await page.$('.live-btn-save:not([disabled])');
    if (saveDraftBtn) {
      await saveDraftBtn.click();
      await delay(600);
    }

    // Reset Hero Section Styling to Default
    const resetSectionBtn = await page.$('button.panel-reset-btn');
    if (resetSectionBtn) {
      await resetSectionBtn.click();
      await delay(600);
    }

    const resetHeroBg = await page.$eval('#book', (el) => el.style.backgroundColor);
    const passResetBg = !resetHeroBg || resetHeroBg === '';
    recordResult('Hero Section Restore Default Styling', passResetBg, `After reset: "${resetHeroBg}"`);

    // Test Book Cover Custom Image Replacement
    console.log('\n--- Testing Book Cover Image Replacement ---');
    await page.evaluate(() => {
      // Set custom book cover through active content
      window.dispatchEvent(new CustomEvent('elrx_set_draft_field', {
        detail: { key: 'hero.bookImage', value: 'assets/hyrox-patch.jpg' }
      }));
    });
    // Direct store set to test BookCover rendering
    await page.evaluate(() => {
      const draft = JSON.parse(localStorage.getItem('elrx_db_content_draft') || '{}');
      if (!draft.hero) draft.hero = {};
      draft.hero.bookImage = 'assets/hyrox-patch.jpg';
      localStorage.setItem('elrx_db_content_draft', JSON.stringify(draft));
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await delay(1000);

    const customBookImg = await page.$('.book-cover img[src="assets/hyrox-patch.jpg"]');
    recordResult('Custom Book Cover Image Rendering', Boolean(customBookImg), 'Custom image visible in 3D frame');

    // Restore Original Book Cover Design
    await page.evaluate(() => {
      const draft = JSON.parse(localStorage.getItem('elrx_db_content_draft') || '{}');
      if (draft.hero) draft.hero.bookImage = null;
      localStorage.setItem('elrx_db_content_draft', JSON.stringify(draft));
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await delay(1000);

    const classicCover = await page.$('.book-cover .cover-title');
    recordResult('Restore Original Classic Book Cover', Boolean(classicCover), 'Classic SVG/CSS cover restored');

    // -------------------------------------------------------------
    // PART 3: BLOG & ARCHIVE MANAGEMENT (CMS)
    // -------------------------------------------------------------
    console.log('\n--- Part 3: Blog & Archive CMS Audit ---');
    await page.goto(`${BASE_URL}/admin.html`, { waitUntil: 'networkidle2' });
    await delay(1000);

    // Switch to Blog & Archive tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.admin-nav-item'));
      const blog = tabs.find((t) => t.textContent.includes('Blog'));
      if (blog) blog.click();
    });
    await delay(700);

    // Verify Blog Status Filters exist
    const statusFilters = await page.$$('.dealdeck-filter-pills button');
    const statusFilterLabels = await page.$$eval('.dealdeck-filter-pills button', (btns) => btns.map((b) => b.textContent.trim()));
    const hasDraftFilter = statusFilterLabels.some((l) => l.includes('Draft'));
    recordResult('Blog CMS Status Filter Tabs', hasDraftFilter, `Filters: ${statusFilterLabels.slice(0, 4).join(', ')}`);

    // Click "+ Write Article / Newsletter" button
    const writeArticleBtn = await page.$('.admin-btn-yellow');
    if (writeArticleBtn) {
      await writeArticleBtn.click();
      await delay(600);
    }

    const isPostModalOpen = await page.$('.admin-modal');
    recordResult('Blog Creation Modal Opens', Boolean(isPostModalOpen));

    // Fill Article Form Fields
    await page.type('.admin-modal input[type="text"]:nth-of-type(1)', 'Test Tactical Protocol 2026');
    await delay(200);

    // Check Summary & Excerpt fields are distinct
    const textareas = await page.$$('.admin-modal textarea');
    recordResult('Distinct Summary and Excerpt Inputs', textareas.length >= 2, `Textareas found: ${textareas.length}`);

    // Test Markdown Editor Write and Preview Tabs
    const previewTabBtn = await page.$('button[data-tab="preview"]');
    if (previewTabBtn) {
      // Type markdown content in article-content-textarea
      const contentTextarea = await page.$('#article-content-textarea');
      if (contentTextarea) {
        await contentTextarea.type('### Rule 1: Consistency\n\n**Always** lift *smart*.\n\n- Rep 1\n- Rep 2\n\n> Rest properly.');
        await delay(300);
      }
      await previewTabBtn.click();
      await delay(500);

      // Check rendered preview HTML
      const previewHtml = await page.evaluate(() => {
        const previewEl = document.querySelector('.admin-modal div[style*="overflow-y"]');
        return previewEl ? previewEl.innerHTML : '';
      });
      const hasHeading = previewHtml.includes('<h3>Rule 1: Consistency</h3>');
      const hasBold = previewHtml.includes('<strong>Always</strong>');
      const hasList = previewHtml.includes('<li>Rep 1</li>');
      recordResult('Markdown Content Write/Preview Tab Rendering', hasHeading && hasBold && hasList, 'Markdown parsed to semantic HTML');
    }

    // Close Post Modal
    const cancelPostBtn = await page.$('.admin-modal-footer .admin-btn-secondary');
    if (cancelPostBtn) {
      await cancelPostBtn.click();
      await delay(400);
    }

    // -------------------------------------------------------------
    // PART 4: PRODUCT & STORE MANAGEMENT (CMS & PUBLIC STORE)
    // -------------------------------------------------------------
    console.log('\n--- Part 4: Product Management & Store Persistence ---');

    // Switch to Products tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.admin-nav-item'));
      const prod = tabs.find((t) => t.textContent.includes('Product'));
      if (prod) prod.click();
    });
    await delay(700);

    // Verify Trash filter pill exists
    const prodFilterLabels = await page.$$eval('.dealdeck-filter-pills button', (btns) => btns.map((b) => b.textContent.trim()));
    const hasTrashFilter = prodFilterLabels.some((l) => l.includes('Trash'));
    recordResult('Product CMS Trash Filter Tab', hasTrashFilter, `Product filters: ${prodFilterLabels.join(', ')}`);

    // Verify Add New Product opens modal with clean cover state (NOT author photo)
    const addProdBtn = await page.$('.dealdeck-action-bar-right .admin-btn-primary');
    if (addProdBtn) {
      await addProdBtn.click();
      await delay(600);
    }

    const prodModalCoverImg = await page.$eval('.admin-modal', (modal) => {
      const img = modal.querySelector('img[src*="author-photo"]');
      return Boolean(img);
    });
    recordResult('Product Modal Clean Artwork State (No Author Avatar Default)', !prodModalCoverImg, 'Author photo default removed');

    // Close product modal
    const cancelProdBtn = await page.$('.admin-modal-footer .admin-btn-secondary');
    if (cancelProdBtn) {
      await cancelProdBtn.click();
      await delay(400);
    }

    // Test Soft Deletion -> Trash -> Disappearance on Public Store
    console.log('\n--- Testing Product Soft Deletion & Store Sync ---');
    // Count active products on public store
    await page.goto(`${BASE_URL}/#store`, { waitUntil: 'networkidle2' });
    await delay(1000);

    const initialStoreCards = await page.$$eval('.product-card', (cards) => cards.length);
    console.log(`Initial public store cards count: ${initialStoreCards}`);

    // Return to CMS and delete the first product to Trash
    await page.goto(`${BASE_URL}/admin.html`, { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.admin-nav-item'));
      const prod = tabs.find((t) => t.textContent.includes('Product'));
      if (prod) prod.click();
    });
    await delay(700);

    const firstProductTitle = await page.$eval('.dealdeck-product-title', (el) => el.textContent.trim());
    console.log(`Targeting product for deletion: "${firstProductTitle}"`);

    const delBtn = await page.$('.dealdeck-product-btn-del');
    if (delBtn) {
      await delBtn.click();
      await delay(400);

      // Confirm deletion modal
      const confirmBtn = await page.$('.admin-modal-footer .admin-btn-primary');
      if (confirmBtn) {
        await confirmBtn.click();
        await delay(800);
      }
    }

    // Verify the product moved to Trash tab in CMS
    await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('.dealdeck-filter-pills button'));
      const trash = pills.find((b) => b.textContent.includes('Trash'));
      if (trash) trash.click();
    });
    await delay(700);

    const trashedProductFound = await page.evaluate((title) => {
      const titles = Array.from(document.querySelectorAll('.dealdeck-product-title')).map((el) => el.textContent.trim());
      return titles.includes(title);
    }, firstProductTitle);
    recordResult('Product Moved to Trash Tab in CMS', trashedProductFound, `Found "${firstProductTitle}" in Trash`);

    // Verify product is HIDDEN on the public store page
    await page.goto(`${BASE_URL}/#store`, { waitUntil: 'networkidle2' });
    await delay(1000);

    const storeProductTitles = await page.$$eval('.card-title', (els) => els.map((el) => el.textContent.trim()));
    const isProductVisibleOnPublicStore = storeProductTitles.includes(firstProductTitle);
    recordResult('Deleted/Trashed Product Hidden on Public Store', !isProductVisibleOnPublicStore, `Store titles: ${storeProductTitles.slice(0, 3).join(', ')}`);

    // Now Restore the product from Trash in CMS
    await page.goto(`${BASE_URL}/admin.html`, { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.admin-nav-item'));
      const prod = tabs.find((t) => t.textContent.includes('Product'));
      if (prod) prod.click();
    });
    await delay(700);

    // Switch to Trash filter
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.dealdeck-filter-pills button'));
      const trash = btns.find((b) => b.textContent.includes('Trash'));
      if (trash) trash.click();
    });
    await delay(700);

    // Click Restore button on the trashed card
    await page.evaluate((title) => {
      const cards = Array.from(document.querySelectorAll('.dealdeck-product-card'));
      const card = cards.find((c) => c.textContent.includes(title));
      if (card) {
        const restore = Array.from(card.querySelectorAll('button')).find((b) => b.textContent.includes('Restore'));
        if (restore) restore.click();
      }
    }, firstProductTitle);
    await delay(1000);

    // Verify product restored back on public store page
    await page.goto(`${BASE_URL}/#store`, { waitUntil: 'networkidle2' });
    await delay(1000);

    const restoredTitles = await page.$$eval('.card-title', (els) => els.map((el) => el.textContent.trim()));
    const isRestoredVisible = restoredTitles.includes(firstProductTitle);
    recordResult('Restored Product Reappears on Public Store Immediately', isRestoredVisible, `Store titles: ${restoredTitles.slice(0, 3).join(', ')}`);

    // Verify product cover does NOT display author photo on public store
    const storeAvatarUsed = await page.evaluate(() => {
      const cardThumbs = Array.from(document.querySelectorAll('.card-thumb img'));
      return cardThumbs.some((img) => img.src.includes('author-photo'));
    });
    recordResult('Public Store Product Covers Never Use Author Photo', !storeAvatarUsed, 'Authentic book covers or clean custom artwork only');

    // Take screenshot of verified store page
    const screenshotPath = path.join(ARTIFACTS_DIR, 'verified_cms_store_and_blog_audit.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Saved audit verification screenshot: ${screenshotPath}`);

  } catch (err) {
    console.error('Error during audit verification execution:', err);
    recordResult('Test Execution', false, err.message);
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log('AUDIT VERIFICATION SUMMARY');
  console.log('================================================================');
  const allPassed = results.every((r) => r.passed);
  console.log(`Total Tests: ${results.length} | Passed: ${results.filter((r) => r.passed).length} | Failed: ${results.filter((r) => !r.passed).length}`);
  console.log(`Overall Status: ${allPassed ? '✅ 100% SUCCESS' : '❌ SOME TESTS FAILED'}\n`);
  return allPassed;
}

runFullAuditVerification().then((ok) => {
  process.exit(ok ? 0 : 1);
});
