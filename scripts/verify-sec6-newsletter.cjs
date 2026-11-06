const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159';

(async () => {
  console.log('🚀 Launching Puppeteer for Section 6 verification...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  // 1. DESKTOP VERIFICATION (1440px)
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page.waitForSelector('#newsletter');

  // Clear any existing localStorage live-edit overrides to test clean render
  await page.evaluate(() => {
    localStorage.removeItem('elrx_live_content');
    window.location.reload();
  });
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  await page.waitForSelector('#newsletter');

  // Scroll to Section 6
  await page.evaluate(() => {
    const el = document.querySelector('#newsletter');
    el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 600));

  const desktopMetrics = await page.evaluate(() => {
    const section = document.querySelector('#newsletter');
    const freeEl = section.querySelector('.footer-signup-free');
    const headingEl = section.querySelector('.footer-signup-heading');
    const subEl = section.querySelector('.footer-signup-text .sub');
    const formEl = section.querySelector('.footer-newsletter-form');
    const inputEl = formEl ? formEl.querySelector('input') : null;
    const buttonEl = formEl ? formEl.querySelector('button') : null;
    const taglineEl = section.querySelector('.hero-tagline');
    const underlineEl = section.querySelector('.footer-newsletter-underline');

    const getLineCount = (el) => {
      const lh = parseFloat(window.getComputedStyle(el).lineHeight);
      return Math.round(el.offsetHeight / lh);
    };

    const freeRect = freeEl.getBoundingClientRect();
    const headingRect = headingEl.getBoundingClientRect();
    const subRect = subEl.getBoundingClientRect();
    const inputRect = inputEl ? inputEl.getBoundingClientRect() : null;
    const buttonRect = buttonEl ? buttonEl.getBoundingClientRect() : null;
    const taglineRect = taglineEl ? taglineEl.getBoundingClientRect() : null;

    return {
      freeText: freeEl.innerText.trim(),
      freeColor: window.getComputedStyle(freeEl).color,
      freeFontStyle: window.getComputedStyle(freeEl).fontStyle,
      freeDisplay: window.getComputedStyle(freeEl).display,
      freeTop: freeRect.top,
      headingText: headingEl.innerText.trim(),
      headingTop: headingRect.top,
      headingLineCount: getLineCount(headingEl),
      subLineCount: getLineCount(subEl),
      subWidth: subRect.width,
      inputHeight: inputRect ? inputRect.height : null,
      buttonHeight: buttonRect ? buttonRect.height : null,
      inputRight: inputRect ? inputRect.right : null,
      buttonLeft: buttonRect ? buttonRect.left : null,
      taglineTop: taglineRect ? taglineRect.top : null,
      formBottom: formEl ? formEl.getBoundingClientRect().bottom : null,
      gapToTagline: taglineRect && formEl ? taglineRect.top - formEl.getBoundingClientRect().bottom : null,
      underlineDecorColor: underlineEl ? window.getComputedStyle(underlineEl).textDecorationColor : null,
    };
  });

  console.log('\n📊 DESKTOP METRICS (1440px):', JSON.stringify(desktopMetrics, null, 2));

  // Capture Section 6 desktop screenshot
  const secEl = await page.$('#newsletter');
  const desktopSecPath = path.join(ARTIFACTS_DIR, 'section6_refined_desktop.png');
  await secEl.screenshot({ path: desktopSecPath });
  console.log(`📸 Desktop Section 6 screenshot saved: ${desktopSecPath}`);

  // 2. TABLET VERIFICATION (768px)
  await page.setViewport({ width: 768, height: 1024 });
  await page.evaluate(() => {
    document.querySelector('#newsletter').scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 400));
  const tabletSecPath = path.join(ARTIFACTS_DIR, 'section6_refined_tablet.png');
  await secEl.screenshot({ path: tabletSecPath });
  console.log(`📸 Tablet Section 6 screenshot saved: ${tabletSecPath}`);

  // 3. MOBILE VERIFICATION (375px)
  await page.setViewport({ width: 375, height: 667 });
  await page.evaluate(() => {
    document.querySelector('#newsletter').scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 400));
  const mobileSecPath = path.join(ARTIFACTS_DIR, 'section6_refined_mobile.png');
  await secEl.screenshot({ path: mobileSecPath });
  console.log(`📸 Mobile Section 6 screenshot saved: ${mobileSecPath}`);

  // 4. TEST FORM FUNCTIONALITY
  console.log('\n🧪 Testing Section 6 newsletter submission...');
  const formHtml = await page.evaluate(() => document.querySelector('#newsletter form') ? document.querySelector('#newsletter form').outerHTML : 'NO FORM');
  console.log('FORM HTML:', formHtml);
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluate(() => {
    document.querySelector('#newsletter').scrollIntoView({ behavior: 'instant', block: 'center' });
  });

  const emailInput = await page.$('#newsletter input[type="email"]');
  await emailInput.click();
  await emailInput.type('lifter_subscriber@test.com', { delay: 30 });

  const typedVal = await page.evaluate(() => document.querySelector('#newsletter input[type="email"]').value);
  console.log(`Typed email input value: "${typedVal}"`);

  // Listen to form submit in browser
  await page.evaluate(() => {
    const form = document.querySelector('#newsletter form');
    form.addEventListener('submit', () => console.log('BROWSER FORM SUBMIT EVENT FIRED!'));
  });

  // Submit form via requestSubmit
  await page.evaluate(() => {
    const form = document.querySelector('#newsletter form');
    form.requestSubmit();
  });
  await new Promise(r => setTimeout(r, 2500));

  const successVisible = await page.evaluate(() => {
    const text = document.querySelector('#newsletter').innerText;
    return text.includes("You're signed up!");
  });
  console.log(`✅ Section 6 newsletter submission successful: ${successVisible}`);

  const successSecPath = path.join(ARTIFACTS_DIR, 'section6_refined_submitted_success.png');
  await secEl.screenshot({ path: successSecPath });
  console.log(`📸 Success state screenshot saved: ${successSecPath}`);

  await browser.close();
  console.log('\n🎉 Section 6 refinement verification completed!');
})();
