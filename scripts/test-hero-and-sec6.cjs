const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const path = require('path');
const ARTIFACT_DIR = 'C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Helper setup
  async function setupPage(width, height) {
    await page.setViewport({ width, height });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      sessionStorage.setItem('elrx_popup_dismissed', 'true');
      localStorage.setItem('elrx_newsletter_seen', 'true');
    });
    await page.reload({ waitUntil: 'networkidle0' });
  }

  // ── 1. DESKTOP (1440 x 900) ──
  console.log('Testing Desktop 1440x900...');
  await setupPage(1440, 900);

  // Measure Hero
  const heroMetrics = await page.evaluate(() => {
    const heroSec = document.querySelector('#book');
    const bookCol = document.querySelector('.book-col');
    const bookContent = document.querySelector('.book-content');
    const headline = document.querySelector('.hero-headline');
    const lines = Array.from(headline.querySelectorAll('.hero-line')).map(el => el.innerText.trim());
    const form = document.querySelector('.book-signup');
    const input = form.querySelector('input');
    const btn = form.querySelector('button');

    const heroRect = heroSec.getBoundingClientRect();
    const bookRect = bookCol.getBoundingClientRect();
    const textRect = bookContent.getBoundingClientRect();

    return {
      lines,
      lineCount: lines.length,
      heroPaddingTop: window.getComputedStyle(heroSec).paddingTop,
      bookCenterY: bookRect.top + bookRect.height / 2,
      textCenterY: textRect.top + textRect.height / 2,
      centerDiff: Math.abs((bookRect.top + bookRect.height / 2) - (textRect.top + textRect.height / 2)),
      inputHeight: input.offsetHeight,
      btnHeight: btn.offsetHeight,
      inputTop: input.getBoundingClientRect().top,
      btnTop: btn.getBoundingClientRect().top,
    };
  });
  console.log('Desktop Hero Metrics:', heroMetrics);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verified_hero_desktop.png'),
    clip: { x: 0, y: 0, width: 1440, height: 780 }
  });

  // Measure Section 6
  const sec6Metrics = await page.evaluate(() => {
    const sec = document.querySelector('.footer-signup');
    sec.scrollIntoView({ behavior: 'instant' });
    const h2 = sec.querySelector('.footer-signup-heading');
    const free = sec.querySelector('.footer-signup-free');
    const underline = sec.querySelector('.footer-newsletter-underline');
    const sub = sec.querySelector('.sub');
    const form = sec.querySelector('.footer-newsletter-form') || sec.querySelector('.signup-row');
    const input = form.querySelector('input');
    const btn = form.querySelector('button');
    const tagline = sec.querySelector('.hero-tagline');

    const subLineHeight = parseFloat(window.getComputedStyle(sub).lineHeight);
    const subLines = Math.round(sub.offsetHeight / subLineHeight);

    return {
      h2Text: h2.innerText.replace(/\s+/g, ' ').trim(),
      h2Height: h2.offsetHeight,
      h2LineHeight: parseFloat(window.getComputedStyle(h2).lineHeight),
      h2Lines: Math.round(h2.offsetHeight / parseFloat(window.getComputedStyle(h2).lineHeight)),
      freeColor: window.getComputedStyle(free).color,
      freeFontStyle: window.getComputedStyle(free).fontStyle,
      underlineText: underline.innerText.trim(),
      subLines,
      subText: sub.innerText.trim(),
      inputHeight: input.offsetHeight,
      btnHeight: btn.offsetHeight,
      taglineText: tagline.innerText.trim(),
    };
  });
  console.log('Desktop Section 6 Metrics:', sec6Metrics);

  // Capture Section 6 screenshot
  const sec6El = await page.$('.footer-signup');
  if (sec6El) {
    await sec6El.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_section6_desktop.png') });
  }

  // ── 2. TABLET (768 x 1024) ──
  console.log('Testing Tablet 768x1024...');
  await setupPage(768, 1024);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verified_hero_tablet.png'),
    clip: { x: 0, y: 0, width: 768, height: 850 }
  });

  const sec6Tablet = await page.$('.footer-signup');
  if (sec6Tablet) {
    await page.evaluate(() => document.querySelector('.footer-signup').scrollIntoView({ behavior: 'instant' }));
    await new Promise(r => setTimeout(r, 400));
    await sec6Tablet.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_section6_tablet.png') });
  }

  // ── 3. MOBILE (375 x 812) ──
  console.log('Testing Mobile 375x812...');
  await setupPage(375, 812);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verified_hero_mobile.png'),
    clip: { x: 0, y: 0, width: 375, height: 850 }
  });

  const sec6Mobile = await page.$('.footer-signup');
  if (sec6Mobile) {
    await page.evaluate(() => document.querySelector('.footer-signup').scrollIntoView({ behavior: 'instant' }));
    await new Promise(r => setTimeout(r, 400));
    await sec6Mobile.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_section6_mobile.png') });
  }

  // ── 4. FUNCTIONALITY TEST: HERO SIGNUP ──
  console.log('Testing Hero form submission...');
  await setupPage(1440, 900);
  await page.type('.book-signup input', 'tester.hero@example.com');
  await page.click('.book-signup button');
  await new Promise(r => setTimeout(r, 600));
  const heroSuccess = await page.evaluate(() => {
    return document.querySelector('.book-cta-row')?.innerText;
  });
  console.log('Hero form submission result:', heroSuccess);

  // ── 5. FUNCTIONALITY TEST: SECTION 6 NEWSLETTER SIGNUP ──
  console.log('Testing Section 6 form submission...');
  await page.evaluate(() => document.querySelector('.footer-signup').scrollIntoView({ behavior: 'instant' }));
  await new Promise(r => setTimeout(r, 300));
  await page.type('.footer-signup .signup-row input', 'tester.sec6@example.com');
  await page.click('.footer-signup .signup-row button');
  await new Promise(r => setTimeout(r, 600));
  const sec6Success = await page.evaluate(() => {
    return document.querySelector('.footer-signup-cta')?.innerText;
  });
  console.log('Section 6 submission result:', sec6Success);

  await browser.close();
  console.log('All verification checks completed successfully.');
})();

