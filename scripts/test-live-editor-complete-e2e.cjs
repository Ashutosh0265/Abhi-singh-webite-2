const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const ARTIFACT_DIR = 'C:\\Users\\ashut\\.gemini\\antigravity\\brain\\d44916b9-6f29-404e-b94f-138b40f5c159';

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  console.log('===============================================================');
  console.log('  LIVE EDITOR & VISUAL BUILDER COMPREHENSIVE E2E VERIFICATION  ');
  console.log('===============================================================');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });

  let allPassed = true;
  const results = {};

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Step 0: Set Super Admin Session
    console.log('\n[Setup] Authenticating as Super Admin...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
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

    // Enter Live Editing Mode
    await page.goto(`${BASE_URL}/?edit=true`, { waitUntil: 'domcontentloaded' });
    await delay(1500);

    const isEditActive = await page.evaluate(() => {
      return document.body.classList.contains('live-editing-active') &&
        Boolean(document.querySelector('.live-admin-toolbar'));
    });
    console.log('[Setup] Live Editing Mode Active:', isEditActive);
    if (!isEditActive) {
      throw new Error('Live editing toolbar failed to load.');
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 1: BUG 2.1 — Text Reverting on Format Change
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- [TEST 1] Bug 2.1: Changing Color/Typography Does NOT Revert Text ---');
    const targetHeadingSel = '[data-content-key="about.heading"]';
    await page.waitForSelector(targetHeadingSel);

    // Focus and type custom text
    const customTestText = 'Mastering Health & Strength Daily';
    await page.focus(targetHeadingSel);
    await delay(200);

    await page.evaluate((sel, text) => {
      const el = document.querySelector(sel);
      el.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, text);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, targetHeadingSel, customTestText);
    await delay(400);

    const textBeforeStyle = await page.$eval(targetHeadingSel, el => el.innerText.trim());
    console.log('Text after typing:', textBeforeStyle);

    // Now change color and font size using Floating Toolbar
    await page.evaluate(() => {
      const setNativeValue = (element, value) => {
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
        if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
          prototypeValueSetter.call(element, value);
        } else if (valueSetter) {
          valueSetter.call(element, value);
        } else {
          element.value = value;
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      };

      const colorInput = document.querySelector('.floating-typography-toolbar input[type="color"]');
      if (colorInput) {
        setNativeValue(colorInput, '#FF6200');
      }
      const sizeSelect = document.querySelector('.typography-select-size');
      if (sizeSelect) {
        setNativeValue(sizeSelect, '40px');
      }
    });
    await delay(500);

    const textAfterStyle = await page.$eval(targetHeadingSel, el => el.innerText.trim());
    const colorAfterStyle = await page.$eval(targetHeadingSel, el => window.getComputedStyle(el).color);
    const sizeAfterStyle = await page.$eval(targetHeadingSel, el => window.getComputedStyle(el).fontSize);

    console.log('Text after style changes:', textAfterStyle);
    console.log('Computed Color:', colorAfterStyle);
    console.log('Computed Font Size:', sizeAfterStyle);

    const test1Passed = textAfterStyle === customTestText && sizeAfterStyle === '40px';
    results.bug_2_1_revert = test1Passed;
    console.log('TEST 1 RESULT:', test1Passed ? 'PASSED' : 'FAILED');
    if (!test1Passed) allPassed = false;

    // ─────────────────────────────────────────────────────────────
    // TEST 2: BUG 2.2 — Select All + Delete Does NOT Resurrect Old Text
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- [TEST 2] Bug 2.2: Select All + Delete Leaves Field Empty On Blur ---');
    await page.focus(targetHeadingSel);
    await delay(200);

    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      el.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('delete', false, null);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, targetHeadingSel);
    await delay(300);

    // Click outside to blur
    await page.evaluate(() => {
      const body = document.body;
      body.click();
      if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }
    });
    await delay(500);

    const textAfterBlur = await page.$eval(targetHeadingSel, el => el.innerText.trim());
    const dataEmptyAttr = await page.$eval(targetHeadingSel, el => el.getAttribute('data-empty'));
    console.log('Text after blur (should be empty):', JSON.stringify(textAfterBlur));
    console.log('data-empty attribute:', dataEmptyAttr);

    const test2Passed = textAfterBlur === '' && dataEmptyAttr === 'true';
    results.bug_2_2_empty_state = test2Passed;
    console.log('TEST 2 RESULT:', test2Passed ? 'PASSED' : 'FAILED');
    if (!test2Passed) allPassed = false;

    // Restore text for subsequent tests
    await page.focus(targetHeadingSel);
    await page.evaluate((sel, text) => {
      const el = document.querySelector(sel);
      el.focus();
      document.execCommand('insertText', false, text);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, targetHeadingSel, 'High Performance Training');
    await delay(400);

    // ─────────────────────────────────────────────────────────────
    // TEST 3: Dynamic Heading Tag Switch (P -> H1 / H2 -> H3)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- [TEST 3] Dynamic Tag / Heading Level Switch ---');
    await page.focus(targetHeadingSel);
    await delay(200);

    // Switch tag to h1
    await page.evaluate(() => {
      const tagSelect = document.querySelector('.floating-typography-toolbar .typography-select');
      if (tagSelect) {
        tagSelect.value = 'h1';
        tagSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await delay(500);

    const currentTagName = await page.$eval(targetHeadingSel, el => el.tagName.toLowerCase());
    console.log('DOM Tag name after selecting H1:', currentTagName);
    const test3Passed = currentTagName === 'h1';
    results.heading_tag_switch = test3Passed;
    console.log('TEST 3 RESULT:', test3Passed ? 'PASSED' : 'FAILED');
    if (!test3Passed) allPassed = false;

    // ─────────────────────────────────────────────────────────────
    // TEST 4: Copy-Paste Formatting Normalization & Plain Text
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- [TEST 4] Copy-Paste Clean Inheritance ---');
    await page.focus(targetHeadingSel);
    await delay(200);

    // Dispatch a paste event with dirty HTML
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      const dt = new DataTransfer();
      dt.setData('text/plain', 'Clean Inherited Headline');
      dt.setData('text/html', '<span style="color: purple; font-size: 8px; font-family: Courier;">Clean Inherited Headline</span>');
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: dt,
      });
      el.dispatchEvent(pasteEvent);
    }, targetHeadingSel);
    await delay(400);

    const pastedHtml = await page.$eval(targetHeadingSel, el => el.innerHTML);
    const pastedText = await page.$eval(targetHeadingSel, el => el.innerText.trim());
    console.log('Pasted Inner HTML:', pastedHtml);
    console.log('Pasted Text:', pastedText);

    // Check that purple or 8px was NOT injected into innerHTML
    const hasDirtyStyle = pastedHtml.includes('color: purple') || pastedHtml.includes('font-size: 8px');
    const test4Passed = !hasDirtyStyle && pastedText.includes('Clean Inherited Headline');
    results.copy_paste_inheritance = test4Passed;
    console.log('TEST 4 RESULT:', test4Passed ? 'PASSED' : 'FAILED');
    if (!test4Passed) allPassed = false;

    // ─────────────────────────────────────────────────────────────
    // TEST 5: Section Layout & Visual Editing (Inspector Panel)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- [TEST 5] Section Level Visual Styling & Inspector ---');
    const sectionSel = '[data-section-key="home.about"]';
    await page.waitForSelector(sectionSel);

    // Click section tag to open inspector
    await page.evaluate((sel) => {
      const section = document.querySelector(sel);
      const tag = section.querySelector('.section-edit-tag');
      if (tag) {
        tag.click();
      }
    }, sectionSel);
    await delay(500);

    const isPanelOpen = await page.evaluate(() => Boolean(document.querySelector('.wordpress-properties-panel')));
    console.log('Inspector Panel Open:', isPanelOpen);

    // Apply Section styles: Background #1A1A1A, Text #FFFFFF, Padding 7rem, Max-Width 1200px, Border Radius 16px, Shadow
    await page.evaluate(() => {
      // Find the swatch for dark charcoal or type hex
      const hexInputs = document.querySelectorAll('.panel-hex-input');
      // Set background color
      const bgInput = document.querySelector('.panel-color-row input[type="color"]');
      if (bgInput) {
        bgInput.value = '#1a1a1a';
        bgInput.dispatchEvent(new Event('input', { bubbles: true }));
        bgInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      // Click Spacious 7rem
      const buttons = Array.from(document.querySelectorAll('.wordpress-properties-panel button'));
      const spaciousBtn = buttons.find(b => b.innerText.includes('Spacious'));
      if (spaciousBtn) spaciousBtn.click();

      // Click 1200px
      const width1200Btn = buttons.find(b => b.innerText.includes('1200px'));
      if (width1200Btn) width1200Btn.click();

      // Click 16px radius
      const rad16Btn = buttons.find(b => b.innerText.includes('16px'));
      if (rad16Btn) rad16Btn.click();

      // Click Elevated shadow
      const shadowElevatedBtn = buttons.find(b => b.innerText.includes('Elevated'));
      if (shadowElevatedBtn) shadowElevatedBtn.click();
    });
    await delay(600);

    const sectionStyles = await page.$eval(sectionSel, el => {
      const s = window.getComputedStyle(el);
      return {
        paddingTop: s.paddingTop,
        borderRadius: s.borderRadius,
        maxWidth: s.maxWidth,
        boxShadow: s.boxShadow,
      };
    });
    console.log('Applied Section Computed Styles:', sectionStyles);

    const test5Passed = sectionStyles.borderRadius === '16px' && sectionStyles.maxWidth === '1200px';
    results.section_visual_editing = test5Passed;
    console.log('TEST 5 RESULT:', test5Passed ? 'PASSED' : 'FAILED');
    if (!test5Passed) allPassed = false;

    // ─────────────────────────────────────────────────────────────
    // TEST 6: Autosave & Page Reload Persistence
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- [TEST 6] Persistence Verification Across Page Reload ---');
    // Reload page in live edit mode
    await page.reload({ waitUntil: 'domcontentloaded' });
    await delay(1500);

    const reloadedHeadingText = await page.$eval(targetHeadingSel, el => el.innerText.trim());
    const reloadedTagName = await page.$eval(targetHeadingSel, el => el.tagName.toLowerCase());
    const reloadedSectionBorderRadius = await page.$eval(sectionSel, el => window.getComputedStyle(el).borderRadius);
    const reloadedSectionMaxWidth = await page.$eval(sectionSel, el => window.getComputedStyle(el).maxWidth);

    console.log('Reloaded Heading Text:', reloadedHeadingText);
    console.log('Reloaded Tag Name:', reloadedTagName);
    console.log('Reloaded Section Border Radius:', reloadedSectionBorderRadius);
    console.log('Reloaded Section Max Width:', reloadedSectionMaxWidth);

    const test6Passed = reloadedHeadingText.includes('Clean Inherited Headline') &&
      reloadedTagName === 'h1' &&
      reloadedSectionBorderRadius === '16px' &&
      reloadedSectionMaxWidth === '1200px';

    results.reload_persistence = test6Passed;
    console.log('TEST 6 RESULT:', test6Passed ? 'PASSED' : 'FAILED');
    if (!test6Passed) allPassed = false;

    // ─────────────────────────────────────────────────────────────
    // TEST 7: Responsive Verification (Desktop, Tablet, Mobile)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- [TEST 7] Multi-Device Responsive Verification ---');

    // Desktop Screenshot (1440x900)
    await page.setViewport({ width: 1440, height: 900 });
    await delay(400);
    const desktopShotPath = path.join(ARTIFACT_DIR, 'verified_live_editor_desktop.png');
    await page.screenshot({ path: desktopShotPath });
    console.log('Desktop Screenshot Captured:', desktopShotPath);

    // Tablet Screenshot (768x1024)
    await page.setViewport({ width: 768, height: 1024 });
    await delay(400);
    const tabletShotPath = path.join(ARTIFACT_DIR, 'verified_live_editor_tablet.png');
    await page.screenshot({ path: tabletShotPath });
    console.log('Tablet Screenshot Captured:', tabletShotPath);

    // Mobile Screenshot (390x844)
    await page.setViewport({ width: 390, height: 844 });
    await delay(400);
    const mobileShotPath = path.join(ARTIFACT_DIR, 'verified_live_editor_mobile.png');
    await page.screenshot({ path: mobileShotPath });
    console.log('Mobile Screenshot Captured:', mobileShotPath);

    results.responsive_screenshots = true;

  } catch (err) {
    console.error('E2E Test Execution Error:', err);
    allPassed = false;
  } finally {
    await browser.close();
  }

  console.log('\n===============================================================');
  console.log('                      FINAL TEST SUMMARY                       ');
  console.log('===============================================================');
  console.log(JSON.stringify(results, null, 2));
  console.log('OVERALL STATUS:', allPassed ? 'ALL TESTS PASSED ✅' : 'FAILURES DETECTED ❌');

  if (!allPassed) {
    process.exit(1);
  }
})();
