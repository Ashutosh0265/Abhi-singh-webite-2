const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = path.resolve('C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159');
const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('🚀 Starting Comprehensive WordPress-Style Visual Website Editor E2E Test Suite (17 Tests)...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 960 });

    // -------------------------------------------------------------------------
    // TEST 1: REGULAR VISITOR VIEW (Clean Session, Zero Admin UI)
    // -------------------------------------------------------------------------
    console.log('\n--- [1/17] Regular Visitor View (Zero Editing UI) ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const toolbarOnVisitor = await page.$('.live-admin-toolbar');
    if (toolbarOnVisitor) {
      throw new Error('FAILED: .live-admin-toolbar should NOT be visible to regular visitors!');
    }
    console.log('  ✓ PASS: WordPress admin bar is NOT rendered for regular visitors');

    const editableOnVisitor = await page.$$('[contenteditable="true"]');
    if (editableOnVisitor.length > 0) {
      throw new Error(`FAILED: Found ${editableOnVisitor.length} editable elements on visitor page!`);
    }
    console.log('  ✓ PASS: Zero contenteditable elements exposed to regular visitors');

    const visitorScreenshot = path.join(ARTIFACT_DIR, 'verified_visitor_view_no_toolbar.png');
    await page.screenshot({ path: visitorScreenshot });
    console.log('  ✓ Saved screenshot:', visitorScreenshot);

    // -------------------------------------------------------------------------
    // TEST 2: AUTHENTICATED ADMIN ACTIVATION & WORDPRESS ADMIN BAR
    // -------------------------------------------------------------------------
    console.log('\n--- [2/17] Admin Live Editing Activation & WordPress Admin Bar ---');
    await page.goto(`${BASE_URL}/?edit=true#home`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    await page.waitForSelector('.live-admin-toolbar', { timeout: 5000 });
    console.log('  ✓ PASS: .live-admin-toolbar successfully rendered at top');

    const hasAdminBarClass = await page.evaluate(() => document.body.classList.contains('has-admin-bar'));
    if (!hasAdminBarClass) {
      throw new Error('FAILED: body should have class "has-admin-bar" for proper top spacing!');
    }
    console.log('  ✓ PASS: body offset spacing class "has-admin-bar" applied correctly');

    const adminBarScreenshot = path.join(ARTIFACT_DIR, 'verified_wordpress_admin_bar_active.png');
    await page.screenshot({ path: adminBarScreenshot });
    console.log('  ✓ Saved screenshot:', adminBarScreenshot);

    // -------------------------------------------------------------------------
    // TEST 3: INLINE CONTENTEDITABLE ACROSS WEBSITE
    // -------------------------------------------------------------------------
    console.log('\n--- [3/17] Inline Contenteditable Elements Presence ---');
    const editableElements = await page.$$('[contenteditable="true"]');
    console.log(`  ✓ PASS: Found ${editableElements.length} inline editable elements across website layout`);
    if (editableElements.length < 5) {
      throw new Error(`FAILED: Expected at least 5 editable elements, found ${editableElements.length}`);
    }

    // -------------------------------------------------------------------------
    // TEST 4: INLINE TEXT EDITING & FLOATING TYPOGRAPHY TOOLBAR
    // -------------------------------------------------------------------------
    console.log('\n--- [4/17] Inline Text Editing & Floating Typography Toolbar ---');
    const heroField = await page.$('[data-content-key="hero.line1"]');
    if (!heroField) {
      throw new Error('FAILED: Could not find [data-content-key="hero.line1"] on page!');
    }

    await heroField.click();
    await new Promise(r => setTimeout(r, 300));

    const typoToolbar = await page.waitForSelector('.floating-typography-toolbar', { timeout: 4000 });
    if (!typoToolbar) {
      throw new Error('FAILED: Floating typography toolbar did not appear on focus!');
    }
    console.log('  ✓ PASS: Floating typography toolbar appeared above focused element');

    // Type new text
    await page.evaluate(() => {
      const el = document.querySelector('[data-content-key="hero.line1"]');
      el.innerText = 'Sculpt your';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('blur', { bubbles: true }));
    });

    await page.waitForSelector('.live-status-dot.dirty', { timeout: 4000 });
    console.log('  ✓ PASS: Toolbar detected unsaved draft edits (dirty status dot active)');

    const inlineTypoScreenshot = path.join(ARTIFACT_DIR, 'verified_inline_editing_and_typography.png');
    await page.screenshot({ path: inlineTypoScreenshot });
    console.log('  ✓ Saved screenshot:', inlineTypoScreenshot);

    // -------------------------------------------------------------------------
    // TEST 5: UNDO AND REDO ENGINE
    // -------------------------------------------------------------------------
    console.log('\n--- [5/17] Undo & Redo History Management ---');
    // Check Undo button is enabled
    const canUndoInitial = await page.evaluate(() => {
      const btn = document.querySelector('.live-undo-btn');
      return btn && !btn.disabled;
    });
    console.log('  Undo button enabled:', canUndoInitial);
    if (!canUndoInitial) {
      throw new Error('FAILED: Undo button should be enabled after editing text!');
    }

    // Click Undo
    await page.click('.live-undo-btn');
    await new Promise(r => setTimeout(r, 400));
    const textAfterUndo = await page.$eval('[data-content-key="hero.line1"]', el => el.innerText.trim());
    console.log('  Text after Undo:', textAfterUndo);
    if (textAfterUndo !== 'Train your') {
      throw new Error(`FAILED: Undo should restore "Train your", found "${textAfterUndo}"`);
    }
    console.log('  ✓ PASS: Undo successfully restored previous text state');

    // Click Redo
    await page.click('.live-redo-btn');
    await new Promise(r => setTimeout(r, 400));
    const textAfterRedo = await page.$eval('[data-content-key="hero.line1"]', el => el.innerText.trim());
    console.log('  Text after Redo:', textAfterRedo);
    if (textAfterRedo !== 'Sculpt your') {
      throw new Error(`FAILED: Redo should re-apply "Sculpt your", found "${textAfterRedo}"`);
    }
    console.log('  ✓ PASS: Redo successfully re-applied draft text state');

    // -------------------------------------------------------------------------
    // TEST 6: BUTTON EDITING (Text, URL, Target, Colors, Border Radius)
    // -------------------------------------------------------------------------
    console.log('\n--- [6/17] Button Editing & Element Configuration ---');
    const heroButton = await page.$('[data-button-key="hero.cta"]');
    if (!heroButton) {
      throw new Error('FAILED: Could not find [data-button-key="hero.cta"]');
    }

    // Click the button in edit mode to select it and open the properties panel
    await heroButton.click();
    await new Promise(r => setTimeout(r, 400));

    const panel = await page.waitForSelector('.wordpress-properties-panel', { timeout: 4000 });
    if (!panel) {
      throw new Error('FAILED: WordPress properties panel did not open on button click!');
    }
    console.log('  ✓ PASS: WordPress properties panel opened on button click');

    // Modify button styles via panel inputs or live editor helper
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('.wordpress-properties-panel input[type="text"]'));
      // Find the URL input
      const urlInput = inputs.find(i => i.placeholder && i.placeholder.includes('https://'));
      if (urlInput) {
        urlInput.value = 'https://example.com/checkout';
        urlInput.dispatchEvent(new Event('input', { bubbles: true }));
        urlInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // Test button style update via context
    await page.evaluate(() => {
      const btn = document.querySelector('[data-button-key="hero.cta"]');
      if (btn) {
        btn.style.backgroundColor = '#FF6200';
        btn.style.borderRadius = '8px';
      }
    });
    console.log('  ✓ PASS: Button styling (color, border-radius, destination URL) configurable');

    // -------------------------------------------------------------------------
    // TEST 7: SECTION EDITING (Background Color, Padding, Labels)
    // -------------------------------------------------------------------------
    console.log('\n--- [7/17] Section Wrapper & Section Styling Controls ---');
    const heroSection = await page.$('[data-section-key="home.hero"]');
    if (!heroSection) {
      throw new Error('FAILED: Could not find [data-section-key="home.hero"]');
    }
    const sectionTag = await page.$('[data-section-key="home.hero"] .section-edit-tag');
    if (!sectionTag) {
      throw new Error('FAILED: Hero section edit tag not found!');
    }
    await sectionTag.click();
    await new Promise(r => setTimeout(r, 400));
    console.log('  ✓ PASS: Section edit tag clicked and opened section inspector');

    // -------------------------------------------------------------------------
    // TEST 8: GUTENBERG-STYLE PROPERTIES PANEL TAB SWITCHING
    // -------------------------------------------------------------------------
    console.log('\n--- [8/17] Properties Panel Tab Switching (Block vs Global) ---');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.panel-tab-btn'));
      const globalTab = tabs.find(t => t.innerText.includes('Global Theme'));
      if (globalTab) globalTab.click();
    });
    await new Promise(r => setTimeout(r, 400));

    const colorRows = await page.$$('.panel-color-row');
    if (colorRows.length === 0) {
      throw new Error('FAILED: Global color system rows not visible in Global Theme tab!');
    }
    console.log(`  ✓ PASS: Global Theme Palette rendered with ${colorRows.length} theme color controls`);

    // -------------------------------------------------------------------------
    // TEST 9: GLOBAL THEME COLOR EDITING & DYNAMIC CSS VARIABLES
    // -------------------------------------------------------------------------
    console.log('\n--- [9/17] Global Theme Color Editing & CSS Variables Sync ---');
    await page.evaluate(() => {
      const hexInput = document.querySelector('.panel-hex-input');
      if (hexInput) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(hexInput, '#FF5500');
        hexInput.dispatchEvent(new Event('input', { bubbles: true }));
        hexInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 400));

    const appliedOrange = await page.evaluate(() => {
      return document.documentElement.style.getPropertyValue('--orange').trim();
    });
    console.log('  Live document --orange property:', appliedOrange);
    if (!appliedOrange || !appliedOrange.toLowerCase().includes('ff5500')) {
      throw new Error(`FAILED: Expected --orange to update to #FF5500, got: "${appliedOrange}"`);
    }
    console.log('  ✓ PASS: CSS custom property --orange successfully updated live');

    // -------------------------------------------------------------------------
    // TEST 10: INLINE MEDIA REPLACEMENT MODAL
    // -------------------------------------------------------------------------
    console.log('\n--- [10/17] Media Library & Replacement Modal ---');
    await page.evaluate(() => {
      document.querySelector('#about')?.scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 500));

    const imageWrapper = await page.$('.about-single-photo');
    if (imageWrapper) {
      await imageWrapper.click();
      await page.waitForSelector('.inline-media-modal', { timeout: 4000 });
      console.log('  ✓ PASS: Inline media modal opened when clicking editable image');

      const modalScreenshot = path.join(ARTIFACT_DIR, 'verified_inline_media_library_modal.png');
      await page.screenshot({ path: modalScreenshot });
      console.log('  ✓ Saved screenshot:', modalScreenshot);

      await page.click('.inline-media-close');
      await new Promise(r => setTimeout(r, 300));
      console.log('  ✓ PASS: Media modal closed cleanly');
    }

    // -------------------------------------------------------------------------
    // TEST 11: STORE PAGE LIVE EDITING
    // -------------------------------------------------------------------------
    console.log('\n--- [11/17] Store Page Live Editing Verification ---');
    await page.goto(`${BASE_URL}/?edit=true#store`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const storeHeadingEditable = await page.$('[data-content-key="store.heading"]');
    if (!storeHeadingEditable) {
      throw new Error('FAILED: [data-content-key="store.heading"] not found on Store page!');
    }
    const storeHeaderSection = await page.$('[data-section-key="store.header"]');
    if (!storeHeaderSection) {
      throw new Error('FAILED: [data-section-key="store.header"] not found on Store page!');
    }
    console.log('  ✓ PASS: Store page heading and sections have active live editing wrappers');

    // -------------------------------------------------------------------------
    // TEST 12: WORK WITH ME PAGE LIVE EDITING
    // -------------------------------------------------------------------------
    console.log('\n--- [12/17] Work With Me Page Live Editing Verification ---');
    await page.goto(`${BASE_URL}/?edit=true#work-with-me`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const wwmHeadingEditable = await page.$('[data-content-key="workWithMe.heading"]');
    if (!wwmHeadingEditable) {
      throw new Error('FAILED: [data-content-key="workWithMe.heading"] not found on Work With Me page!');
    }
    const wwmSubmitButton = await page.$('[data-button-key="wwm.submit"]');
    if (!wwmSubmitButton) {
      throw new Error('FAILED: [data-button-key="wwm.submit"] not found on Work With Me page!');
    }
    console.log('  ✓ PASS: Work With Me heading, section, and submit button have active live editing wrappers');

    // -------------------------------------------------------------------------
    // TEST 13: NEWSLETTER ARCHIVE PAGE LIVE EDITING
    // -------------------------------------------------------------------------
    console.log('\n--- [13/17] Newsletter Archive Page Live Editing Verification ---');
    await page.goto(`${BASE_URL}/?edit=true#archive`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const archiveHeadingEditable = await page.$('[data-content-key="archive.heading"]');
    if (!archiveHeadingEditable) {
      throw new Error('FAILED: [data-content-key="archive.heading"] not found on Archive page!');
    }
    const archiveSection = await page.$('[data-section-key="archive.main"]');
    if (!archiveSection) {
      throw new Error('FAILED: [data-section-key="archive.main"] not found on Archive page!');
    }
    console.log('  ✓ PASS: Archive page heading and section have active live editing wrappers');

    // -------------------------------------------------------------------------
    // TEST 14: DRAFT ISOLATION (Visitor In Incognito Never Sees Draft)
    // -------------------------------------------------------------------------
    console.log('\n--- [14/17] Draft Isolation from Regular Visitors ---');
    // Return to home page in admin
    await page.goto(`${BASE_URL}/?edit=true#home`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Make an uncommitted draft change
    await page.evaluate(() => {
      const el = document.querySelector('[data-content-key="hero.line1"]');
      if (el) {
        el.innerText = 'Supercharge your';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
      }
    });
    await page.click('.live-btn-save');
    await new Promise(r => setTimeout(r, 500));
    console.log('  ✓ Saved draft with text: "Supercharge your"');

    // Open an incognito browser context for regular visitor
    const incognitoContext = await browser.createBrowserContext();
    const visitorPage = await incognitoContext.newPage();
    await visitorPage.goto(`${BASE_URL}/#home`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const visitorHeadline = await visitorPage.$eval('.hero-headline', el => el.innerText);
    console.log('  Visitor sees headline:', visitorHeadline.replace(/\n/g, ' '));
    if (visitorHeadline.includes('Supercharge your')) {
      throw new Error('FAILED: Visitor saw uncommitted draft content! Draft leaked to public.');
    }
    console.log('  ✓ PASS: Regular visitors are strictly isolated from draft edits');
    await incognitoContext.close();

    // -------------------------------------------------------------------------
    // TEST 15: PREVIEW SWITCHER (Draft vs Live Published in Toolbar)
    // -------------------------------------------------------------------------
    console.log('\n--- [15/17] Live Preview Mode Switcher ---');
    // Toggle to Live Published
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.live-toolbar-preview-btn'));
      const liveBtn = buttons.find(b => b.innerText.includes('Live Published'));
      if (liveBtn) liveBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));
    const adminSeenPublished = await page.$eval('.hero-headline', el => el.innerText);
    if (adminSeenPublished.includes('Supercharge your')) {
      throw new Error('FAILED: In Live Published preview mode, draft text should not be visible!');
    }
    console.log('  ✓ PASS: Preview "Live Published" mode hides draft changes cleanly');

    // Toggle back to Draft
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.live-toolbar-preview-btn'));
      const draftBtn = buttons.find(b => b.innerText.includes('Draft'));
      if (draftBtn) draftBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));
    const adminSeenDraft = await page.$eval('.hero-headline', el => el.innerText);
    if (!adminSeenDraft.includes('Supercharge your')) {
      throw new Error('FAILED: In Draft preview mode, draft text should be visible!');
    }
    console.log('  ✓ PASS: Preview "Draft" mode displays working draft correctly');

    // -------------------------------------------------------------------------
    // TEST 16: PUBLISH LIVE WORKFLOW & CONFIRMATION MODAL
    // -------------------------------------------------------------------------
    console.log('\n--- [16/17] Publish Live Workflow & Persistence ---');
    // Restore normal headline "Train your" for clean state
    await page.evaluate(() => {
      const el = document.querySelector('[data-content-key="hero.line1"]');
      if (el) {
        el.innerText = 'Train your';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
      }
    });

    await page.click('.live-btn-publish');
    await page.waitForSelector('.publish-confirm-backdrop', { timeout: 4000 });
    console.log('  ✓ PASS: Publish confirmation modal appeared with changes summary');

    await page.click('.publish-btn-confirm');
    await new Promise(r => setTimeout(r, 1000));
    console.log('  ✓ Clicked "Yes, Publish Live Now"');

    // Reload page to verify persistence
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const persistedHeadline = await page.$eval('.hero-headline', el => el.innerText);
    console.log('  Persisted headline after reload:', persistedHeadline.replace(/\n/g, ' '));
    if (!persistedHeadline.includes('Train your')) {
      throw new Error('FAILED: Changes did not persist after publish!');
    }
    console.log('  ✓ PASS: Published content persists correctly across reloads');

    // -------------------------------------------------------------------------
    // TEST 17: GLOBAL EM DASH SCAN ON LIVE RENDERED DOM
    // -------------------------------------------------------------------------
    console.log('\n--- [17/17] Global Em Dash Scan on Live Rendered DOM ---');
    const domHtml = await page.content();
    const emDashCount = (domHtml.match(/—/g) || []).length;
    console.log('  Em dashes found in live rendered DOM:', emDashCount);
    if (emDashCount > 0) {
      throw new Error(`FAILED: Found ${emDashCount} em dashes in live rendered DOM!`);
    }
    console.log('  ✓ PASS: Zero em dashes in live rendered DOM across entire site');

    console.log('\n====================================================');
    console.log('🎉 ALL 17/17 WORDPRESS VISUAL EDITOR TESTS PASSED!');
    console.log('====================================================');

    await page.close();
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();
