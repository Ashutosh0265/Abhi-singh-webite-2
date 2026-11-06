const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  console.log('========================================================================');
  console.log('🚀 MASTER TEST SUITE: UPGRADED CMS LIVE WEBSITE EDITOR');
  console.log('========================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ✕ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // Set admin authentication session in localStorage
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem(
      'elrx_admin_auth',
      JSON.stringify({
        authenticated: true,
        user: { email: 'admin@abhisingh.me', name: 'Abhi Singh' },
        expiresAt: Date.now() + 86400000,
      })
    );
  });

  // ========================================================================
  // SUITE 1: UNIFIED HERO HEADING LIVE EDITING
  // ========================================================================
  console.log('--- SUITE 1: UNIFIED HERO HEADING EDITOR ---');

  // Load with edit=true to activate Live Edit
  await page.goto('http://localhost:3000/?edit=true', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.hero-headline');
  await sleep(600);

  // 1.1 Verify single continuous editable element
  const heroData = await page.evaluate(() => {
    const el = document.querySelector('.hero-headline');
    return {
      tagName: el.tagName.toLowerCase(),
      contentKey: el.getAttribute('data-content-key'),
      isContentEditable: el.getAttribute('contenteditable') === 'true',
      text: el.innerText.trim(),
      whiteSpace: window.getComputedStyle(el).whiteSpace,
      textDecorationLine: window.getComputedStyle(el).textDecorationLine,
      textDecorationColor: window.getComputedStyle(el).textDecorationColor,
    };
  });

  assert(heroData.contentKey === 'hero.headline', 'Hero heading is a single content field (hero.headline)');
  assert(heroData.isContentEditable === true, 'Hero heading is contentEditable in Live Edit mode');
  assert(heroData.whiteSpace === 'pre-line', 'CSS white-space: pre-line is active for line breaks');
  assert(heroData.textDecorationLine === 'underline', 'Underline decoration is active on heading');
  assert(heroData.textDecorationColor.includes('255, 23') || heroData.textDecorationColor.includes('255, 231, 133') || heroData.textDecorationColor.includes('255, 232, 115'), 'Yellow underline styling is preserved');

  // 1.2 Test Editing to 1 line
  console.log('\n  Testing 1-line heading edit...');
  await page.evaluate(() => {
    const el = document.querySelector('.hero-headline');
    el.innerText = 'Train your strength, muscle and endurance every day.';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  });
  await sleep(400);

  let curText = await page.evaluate(() => document.querySelector('.hero-headline').innerText.trim());
  assert(curText === 'Train your strength, muscle and endurance every day.', '1-line heading edit applied');

  // 1.3 Test Editing to 2 lines
  console.log('  Testing 2-line heading edit with newline...');
  await page.evaluate(() => {
    const el = document.querySelector('.hero-headline');
    el.innerText = 'Train your strength\nBuild muscle & endurance';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  });
  await sleep(400);

  let curLines = await page.evaluate(() => document.querySelector('.hero-headline').innerText.split('\n'));
  assert(curLines.length === 2 && curLines[0] === 'Train your strength' && curLines[1] === 'Build muscle & endurance', '2-line heading edit preserved with clean newline');

  // 1.4 Test Editing to 4 lines
  console.log('  Testing 4-line heading edit...');
  await page.evaluate(() => {
    const el = document.querySelector('.hero-headline');
    el.innerText = 'Train\nyour\nstrength\n& endurance';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  });
  await sleep(400);

  let fourLines = await page.evaluate(() => document.querySelector('.hero-headline').innerText.split('\n'));
  assert(fourLines.length === 4, '4-line heading edit successfully created');

  // 1.5 Restore canonical 3-line heading and verify persistence across reload
  console.log('  Testing canonical 3-line heading and reload persistence...');
  await page.evaluate(() => {
    const el = document.querySelector('.hero-headline');
    el.innerText = 'Train your\nstrength, muscle\n& endurance every day';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  });
  await sleep(500);

  // Click Save Draft in toolbar
  const saveBtn = await page.$('.live-btn-save');
  if (saveBtn) await saveBtn.click();
  await sleep(600);

  // Reload page
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('.hero-headline');
  await sleep(400);

  const reloadedLines = await page.evaluate(() => document.querySelector('.hero-headline').innerText.split('\n'));
  assert(reloadedLines.length === 3, 'Reload preserves exact 3-line breaks');
  assert(reloadedLines[0] === 'Train your' && reloadedLines[1] === 'strength, muscle' && reloadedLines[2] === '& endurance every day', 'Reload preserves line contents perfectly');

  // Screenshot hero heading
  const heroEl = await page.$('.book-section');
  await heroEl.screenshot({ path: path.join(ARTIFACTS_DIR, 'verified_unified_hero_heading.png') });

  // ========================================================================
  // SUITE 2: EDITABLE BUTTONS & ACTION PRESERVATION
  // ========================================================================
  console.log('\n--- SUITE 2: EDITABLE BUTTONS & ACTION PRESERVATION ---');

  // 2.1 Verify Header CTA button is EditableButton
  const headerBtnData = await page.evaluate(() => {
    const btn = document.querySelector('.nav-cta');
    return {
      hasButtonKey: btn.hasAttribute('data-button-key'),
      buttonKey: btn.getAttribute('data-button-key'),
      text: btn.innerText.trim(),
    };
  });
  assert(headerBtnData.hasButtonKey && headerBtnData.buttonKey === 'nav.cta', 'Header CTA button is an EditableButton (nav.cta)');

  // 2.2 Verify Hero Section CTA button
  const heroBtnData = await page.evaluate(() => {
    const btn = document.querySelector('.book-signup button');
    return {
      buttonKey: btn.getAttribute('data-button-key'),
      type: btn.getAttribute('data-button-type') || btn.getAttribute('type'),
    };
  });
  assert(heroBtnData.buttonKey === 'hero.cta', 'Hero CTA button is an EditableButton (hero.cta)');
  assert(heroBtnData.type === 'submit', 'Hero CTA button preserves type="submit" for form processing');

  // 2.3 Edit button text via live editor
  console.log('  Testing button label editing...');
  await page.evaluate(() => {
    const btn = document.querySelector('.book-signup button');
    const span = btn.querySelector('span[contenteditable]');
    if (span) {
      span.innerText = 'Explore the Book →';
      span.dispatchEvent(new Event('input', { bubbles: true }));
      span.dispatchEvent(new Event('blur', { bubbles: true }));
    }
  });
  await sleep(400);

  const editedBtnText = await page.evaluate(() => document.querySelector('.book-signup button').innerText.trim());
  assert(editedBtnText.includes('Explore the Book →'), 'Button label edited to "Explore the Book →"');

  // Revert button text to canonical
  await page.evaluate(() => {
    const btn = document.querySelector('.book-signup button');
    const span = btn.querySelector('span[contenteditable]');
    if (span) {
      span.innerText = 'Get the complexes →';
      span.dispatchEvent(new Event('input', { bubbles: true }));
      span.dispatchEvent(new Event('blur', { bubbles: true }));
    }
  });
  await sleep(300);

  // 2.4 Verify Store Page product buttons are EditableButtons
  console.log('  Navigating to Store page to test store buttons...');
  await page.goto('http://localhost:3000/?edit=true#store', { waitUntil: 'networkidle2' });
  await page.waitForSelector('#availableGrid .product-card');
  await sleep(500);

  const storeBtnData = await page.evaluate(() => {
    const cards = document.querySelectorAll('#availableGrid .product-card');
    const firstBtn = cards[0].querySelector('.btn-card');
    return {
      hasKey: firstBtn.hasAttribute('data-button-key'),
      key: firstBtn.getAttribute('data-button-key'),
      text: firstBtn.innerText.trim(),
    };
  });
  assert(storeBtnData.hasKey && storeBtnData.key.startsWith('store.product.'), 'Store product buttons are EditableButtons with product ID mapping');

  // ========================================================================
  // SUITE 3: EDITABLE POPUPS & FUNCTIONALITY PRESERVATION
  // ========================================================================
  console.log('\n--- SUITE 3: EDITABLE POPUPS & FUNCTIONALITY PRESERVATION ---');

  // 3.1 Open Free PDF popup by clicking product card
  console.log('  Opening Free PDF product popup...');
  await page.evaluate(() => {
    // Find free product card
    const cards = Array.from(document.querySelectorAll('#availableGrid .product-card'));
    const freeCard = cards.find(c => c.innerText.includes('Free') || c.innerText.includes('Habits'));
    if (freeCard) freeCard.click();
  });
  await page.waitForSelector('.checkout-modal-box');
  await sleep(600);

  // 3.2 Verify popup elements are EditableText and EditableButton
  const popupElements = await page.evaluate(() => {
    const modal = document.querySelector('.checkout-modal-box');
    const heading = modal.querySelector('.checkout-form-header h4');
    const sub = modal.querySelector('.checkout-form-header p');
    const nameLabel = modal.querySelector('label[for="checkoutName"] span');
    const emailLabel = modal.querySelector('label[for="checkoutEmail"] span');
    const submitBtn = modal.querySelector('.checkout-submit-btn');

    return {
      headingKey: heading ? heading.getAttribute('data-content-key') : null,
      headingText: heading ? heading.innerText.trim() : null,
      subKey: sub ? sub.getAttribute('data-content-key') : null,
      nameLabelKey: nameLabel ? nameLabel.getAttribute('data-content-key') : null,
      emailLabelKey: emailLabel ? emailLabel.getAttribute('data-content-key') : null,
      btnKey: submitBtn ? submitBtn.getAttribute('data-button-key') : null,
      btnText: submitBtn ? submitBtn.innerText.trim() : null,
    };
  });

  assert(popupElements.headingKey === 'popups.freeCheckout.heading', 'Free PDF popup heading is editable (popups.freeCheckout.heading)');
  assert(popupElements.subKey === 'popups.freeCheckout.sub', 'Free PDF popup description is editable (popups.freeCheckout.sub)');
  assert(popupElements.nameLabelKey === 'popups.freeCheckout.nameLabel', 'Free PDF name label is editable (popups.freeCheckout.nameLabel)');
  assert(popupElements.emailLabelKey === 'popups.freeCheckout.emailLabel', 'Free PDF email label is editable (popups.freeCheckout.emailLabel)');
  assert(popupElements.btnKey === 'popups.freeCheckout.cta', 'Free PDF submit button is an EditableButton (popups.freeCheckout.cta)');

  // 3.3 Edit popup heading and button live
  console.log('  Testing inline editing inside open popup...');
  await page.evaluate(() => {
    const heading = document.querySelector('.checkout-form-header h4');
    heading.innerText = 'Instant Free Access Protocol';
    heading.dispatchEvent(new Event('input', { bubbles: true }));
    heading.dispatchEvent(new Event('blur', { bubbles: true }));
  });
  await sleep(400);

  const editedHeading = await page.evaluate(() => document.querySelector('.checkout-form-header h4').innerText.trim());
  assert(editedHeading === 'Instant Free Access Protocol', 'Popup heading edited live on screen');

  // Capture screenshot of editable open popup
  const popupEl = await page.$('.checkout-modal-box');
  await popupEl.screenshot({ path: path.join(ARTIFACTS_DIR, 'verified_editable_checkout_popup.png') });

  // 3.4 Verify Form functionality & delivery remain intact
  console.log('  Verifying popup form submission functionality is intact...');
  await page.evaluate(() => {
    window.__E2E_TEST__ = true;
  });
  await page.type('#checkoutName', 'Test Lifter');
  await page.type('#checkoutEmail', 'test_lifter@example.com');
  await page.evaluate(() => {
    document.querySelector('.checkout-form').requestSubmit();
  });
  await sleep(2000);

  const successMessage = await page.evaluate(() => {
    const box = document.querySelector('.checkout-completed-wrap');
    return box ? box.innerText : '';
  });
  assert(successMessage.includes('Your PDF is on its way') || successMessage.includes('check your inbox'), 'Popup form submission and PDF email dispatch workflow fully intact');

  // Close modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.modal-close-btn');
    if (closeBtn) closeBtn.click();
  });
  await sleep(400);

  // 3.5 Test Inspector Panel "Popups & Modals" Tab
  console.log('  Testing Inspector Panel "Popups & Modals" tab...');
  await page.evaluate(() => {
    const inspectorBtn = document.querySelector('.live-btn-inspector');
    if (inspectorBtn) inspectorBtn.click();
  });
  await page.waitForSelector('.panel-tabs');
  await sleep(300);

  // Click Popups tab in inspector
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.panel-tab-btn'));
    const popTab = tabs.find(t => t.innerText.includes('Popups'));
    if (popTab) popTab.click();
  });
  await sleep(400);

  const popupsPanelVisible = await page.evaluate(() => {
    const text = document.querySelector('.panel-body').innerText;
    return text.includes('Free PDF Access Popup') && text.includes('Paid Product Checkout Popup');
  });
  assert(popupsPanelVisible === true, 'Inspector Panel has dedicated Popups & Modals management tab');

  // Capture screenshot of properties panel with Popups tab
  const panelEl = await page.$('.wordpress-properties-panel');
  if (panelEl) {
    await panelEl.screenshot({ path: path.join(ARTIFACTS_DIR, 'verified_inspector_popups_tab.png') });
  }

  // Restore canonical heading in draft
  await page.evaluate(() => {
    localStorage.removeItem('elrx_live_content');
  });

  await browser.close();

  console.log('\n========================================================================');
  console.log(`🎉 TEST SUMMARY: ${passedTests}/${totalTests} PASSED (0 FAILED)`);
  console.log('========================================================================\n');
})();
