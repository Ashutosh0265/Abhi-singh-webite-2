const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('🚀 Starting Comprehensive Live Edit Zero-Disappearance Verification...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // -------------------------------------------------------------------------
  // 1. VISITOR CHECK (Default public website)
  // -------------------------------------------------------------------------
  console.log('\n--- 1. Testing Visitor View (Live Edit OFF, Unauthenticated) ---');
  await page.goto(`${BASE_URL}/#home`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const visitorState = await page.evaluate(() => {
    const book = document.querySelector('#book');
    const bookCol = document.querySelector('.book-col');
    const bookContent = document.querySelector('.book-content');
    const headline = document.querySelector('.hero-headline');
    const csBook = window.getComputedStyle(book);
    const csCol = window.getComputedStyle(bookCol);
    const csContent = window.getComputedStyle(bookContent);

    return {
      bookOpacity: csBook.opacity,
      bookColOpacity: csCol.opacity,
      bookContentOpacity: csContent.opacity,
      headlineText: headline?.innerText?.replace(/\n/g, ' '),
      hasAdminBar: document.body.classList.contains('has-admin-bar'),
      isLiveEditing: document.body.classList.contains('live-editing-active'),
      adminToolbar: Boolean(document.querySelector('.live-admin-toolbar'))
    };
  });

  console.log('  Visitor State:', visitorState);
  if (visitorState.bookOpacity !== '1') throw new Error('Visitor hero section is not visible!');
  if (visitorState.adminToolbar) throw new Error('Admin toolbar visible to regular visitor!');
  console.log('  ✓ PASS: Visitor view is 100% visible and unpolluted');

  // -------------------------------------------------------------------------
  // 2. LIVE EDIT MODE (Admin logged in, Live Edit: ON)
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Testing Live Edit Mode (?edit=true) ---');
  await page.evaluate(() => {
    localStorage.setItem('elrx_admin_auth', JSON.stringify({
      authenticated: true,
      user: 'admin',
      role: 'super_admin',
      expiresAt: Date.now() + 86400000
    }));
  });

  await page.goto(`${BASE_URL}/?edit=true#home`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  const editState = await page.evaluate(() => {
    const book = document.querySelector('#book');
    const bookCol = document.querySelector('.book-col');
    const bookContent = document.querySelector('.book-content');
    const headline = document.querySelector('.hero-headline');
    const line1 = document.querySelector('[data-content-key="hero.line1"]');
    const line2 = document.querySelector('[data-content-key="hero.line2"]');
    const line3 = document.querySelector('[data-content-key="hero.line3"]');

    const sections = Array.from(document.querySelectorAll('section')).map(s => {
      const cs = window.getComputedStyle(s);
      return {
        id: s.id || '(no-id)',
        classes: s.className,
        opacity: cs.opacity,
        transform: cs.transform,
        visible: cs.opacity === '1' && cs.visibility !== 'hidden' && cs.display !== 'none'
      };
    });

    return {
      bookOpacity: window.getComputedStyle(book).opacity,
      bookColOpacity: window.getComputedStyle(bookCol).opacity,
      bookContentOpacity: window.getComputedStyle(bookContent).opacity,
      line1Text: line1?.innerText,
      line2Text: line2?.innerText,
      line3Text: line3?.innerText,
      headlineFull: headline?.innerText?.replace(/\n/g, ' '),
      hasAdminBar: document.body.classList.contains('has-admin-bar'),
      isLiveEditing: document.body.classList.contains('live-editing-active'),
      sections
    };
  });

  console.log('  Edit Mode Body Classes: has-admin-bar =', editState.hasAdminBar, ', live-editing-active =', editState.isLiveEditing);
  console.log('  Hero Book Section Opacity:', editState.bookOpacity);
  console.log('  Book Cover Col Opacity:', editState.bookColOpacity);
  console.log('  Book Content Col Opacity:', editState.bookContentOpacity);
  console.log('  Headline Rendered:', editState.headlineFull);
  console.log('  All Sections Opacity:');
  editState.sections.forEach(s => {
    console.log(`    - Section [${s.id}]: opacity=${s.opacity}, transform=${s.transform}, visible=${s.visible}`);
    if (!s.visible) {
      throw new Error(`Section ${s.id} disappeared! Opacity is ${s.opacity}`);
    }
  });

  const screenshotPath = path.resolve('C:\\Users\\ashut\\.gemini\\antigravity\\brain\\d44916b9-6f29-404e-b94f-138b40f5c159', 'verified_live_edit_no_disappearance.png');
  await page.screenshot({ path: screenshotPath });
  console.log('  ✓ Saved screenshot:', screenshotPath);
  console.log('  ✓ PASS: Zero disappearance when Live Edit is ON!');

  // -------------------------------------------------------------------------
  // 3. TOGGLE EDIT MODE (ON -> OFF -> ON)
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Testing Live Edit Toggle Button (ON -> OFF -> ON) ---');
  await page.click('.live-toolbar-toggle-btn');
  await new Promise(r => setTimeout(r, 400));

  const afterOff = await page.evaluate(() => {
    const book = document.querySelector('#book');
    return {
      bookOpacity: window.getComputedStyle(book).opacity,
      isEditingClass: document.body.classList.contains('live-editing-active'),
      toggleText: document.querySelector('.live-toolbar-toggle-btn')?.innerText
    };
  });
  console.log('  After Toggling OFF:', afterOff);
  if (afterOff.bookOpacity !== '1') throw new Error('Hero section disappeared after toggling edit OFF!');

  await page.click('.live-toolbar-toggle-btn');
  await new Promise(r => setTimeout(r, 400));

  const afterOn = await page.evaluate(() => {
    const book = document.querySelector('#book');
    return {
      bookOpacity: window.getComputedStyle(book).opacity,
      isEditingClass: document.body.classList.contains('live-editing-active'),
      toggleText: document.querySelector('.live-toolbar-toggle-btn')?.innerText
    };
  });
  console.log('  After Toggling ON Again:', afterOn);
  if (afterOn.bookOpacity !== '1') throw new Error('Hero section disappeared after toggling edit ON again!');
  console.log('  ✓ PASS: Live Edit toggle works smoothly with zero disappearing!');

  // -------------------------------------------------------------------------
  // 4. LIVE INLINE EDITING & TYPOGRAPHY TOOLBAR
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Testing Direct In-Place Text Editing ---');
  const line1Selector = '[data-content-key="hero.line1"]';
  await page.click(line1Selector);
  await new Promise(r => setTimeout(r, 300));

  const toolbarStatus = await page.evaluate(() => {
    const tb = document.querySelector('.floating-typography-toolbar');
    return {
      present: Boolean(tb),
      display: tb ? window.getComputedStyle(tb).display : 'none'
    };
  });
  console.log('  Floating Typography Toolbar status:', toolbarStatus);
  if (!toolbarStatus.present || toolbarStatus.display === 'none') {
    throw new Error('Floating typography toolbar did not appear on focus!');
  }

  // Focus and select all
  await page.focus(line1Selector);
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.type('Sculpt your');
  await new Promise(r => setTimeout(r, 400));

  // Blur by focusing body
  await page.evaluate((sel) => {
    document.querySelector(sel).blur();
  }, line1Selector);
  await new Promise(r => setTimeout(r, 400));

  const elText = await page.evaluate(sel => document.querySelector(sel).innerText, line1Selector);
  const saveDisabled = await page.evaluate(() => document.querySelector('.live-btn-save')?.disabled);
  console.log('  Debug after typing: elText =', elText, ', saveDisabled =', saveDisabled);

  // Click Save Draft button on admin toolbar
  await page.click('.live-btn-save');
  await new Promise(r => setTimeout(r, 500));

  const draftText = await page.evaluate(() => {
    const draft = JSON.parse(localStorage.getItem('elrx_db_content_draft') || '{}');
    return draft?.hero?.line1;
  });
  console.log('  Draft text in localStorage after clicking Save Draft:', draftText);
  if (!draftText) {
    throw new Error('Draft text was not saved in localStorage elrx_db_content_draft');
  }

  // Clean up draft
  await page.evaluate(() => {
    localStorage.removeItem('elrx_db_content_draft');
  });
  console.log('  ✓ PASS: Live editing and floating toolbar work seamlessly');

  // -------------------------------------------------------------------------
  // 5. TEST STORE AND WORK WITH ME IN LIVE EDIT MODE
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Testing Store & Work With Me in Live Edit Mode ---');
  await page.goto(`${BASE_URL}/?edit=true#store`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  const storeCheck = await page.evaluate(() => {
    const secs = Array.from(document.querySelectorAll('section')).map(s => ({
      label: s.querySelector('.section-edit-tag')?.innerText || s.className,
      opacity: window.getComputedStyle(s).opacity
    }));
    return secs;
  });
  console.log('  Store Sections:', storeCheck);
  storeCheck.forEach(s => {
    if (s.opacity !== '1') throw new Error(`Store section [${s.label}] has opacity ${s.opacity}!`);
  });

  await page.goto(`${BASE_URL}/?edit=true#work-with-me`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  const wwmCheck = await page.evaluate(() => {
    const secs = Array.from(document.querySelectorAll('section')).map(s => ({
      label: s.querySelector('.section-edit-tag')?.innerText || s.className,
      opacity: window.getComputedStyle(s).opacity
    }));
    return secs;
  });
  console.log('  Work With Me Sections:', wwmCheck);
  wwmCheck.forEach(s => {
    if (s.opacity !== '1') throw new Error(`Work With Me section [${s.label}] has opacity ${s.opacity}!`);
  });
  console.log('  ✓ PASS: All pages have 100% visible content in Live Edit mode!');

  console.log('\n======================================================');
  console.log('🎉 ALL LIVE EDIT ZERO-DISAPPEARANCE TESTS PASSED (5/5)');
  console.log('======================================================');

  await browser.close();
}

run().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
