const puppeteer = require('puppeteer-core');
const path = require('path');
const assert = require('assert');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  console.log('========================================================================');
  console.log('🧪 VERIFICATION SUITE: HOMEPAGE HERO SECTION & BOOK COVER PERFECTION');
  console.log('========================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Test 1: Desktop 1440px
  console.log('--- 1. Testing Desktop 1440px Layout & Proportions ---');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await sleep(800);

  const desktopMetrics = await page.evaluate(() => {
    function rect(el) {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) };
    }
    const sec = document.querySelector('.book-section');
    const bookCol = document.querySelector('.book-col');
    const bookWrap = document.querySelector('.book-cover-wrap');
    const bookCover = document.querySelector('.book-cover');
    const bookContent = document.querySelector('.book-content');
    const h1 = document.querySelector('.hero-headline');
    const authorPhoto = document.querySelector('.cover-author-photo');
    const bodyWidth = document.body.clientWidth;
    const bodyScrollWidth = document.body.scrollWidth;

    return {
      secRect: rect(sec),
      bookColRect: rect(bookCol),
      bookWrapRect: rect(bookWrap),
      bookCoverRect: rect(bookCover),
      bookContentRect: rect(bookContent),
      h1Rect: rect(h1),
      authorPhotoLoaded: authorPhoto && authorPhoto.complete && authorPhoto.naturalWidth > 0,
      authorPhotoSrc: authorPhoto?.src,
      bodyOverflow: bodyScrollWidth > bodyWidth,
      bookWidthPercent: sec ? (bookCover.offsetWidth / sec.offsetWidth) * 100 : 0,
    };
  });

  console.log('  Desktop Metrics:');
  console.log(`    Hero Width: ${desktopMetrics.secRect.width}px, Height: ${desktopMetrics.secRect.height}px`);
  console.log(`    Book Cover Width: ${desktopMetrics.bookCoverRect.width}px, Height: ${desktopMetrics.bookCoverRect.height}px`);
  console.log(`    Book Width Proportion: ${desktopMetrics.bookWidthPercent.toFixed(1)}% of hero content (target: 30-35%)`);
  console.log(`    Content Column Width: ${desktopMetrics.bookContentRect.width}px`);
  console.log(`    Heading Width: ${desktopMetrics.h1Rect.width}px, Height: ${desktopMetrics.h1Rect.height}px`);
  console.log(`    Author Photo Loaded: ${desktopMetrics.authorPhotoLoaded} (${desktopMetrics.authorPhotoSrc})`);
  console.log(`    Body Horizontal Overflow: ${desktopMetrics.bodyOverflow}`);

  assert(desktopMetrics.bookCoverRect.width >= 300, 'Book cover must be prominent (>= 300px on desktop)');
  assert(desktopMetrics.bookWidthPercent >= 30 && desktopMetrics.bookWidthPercent <= 36, 'Book cover must occupy ~30-35% of hero content');
  assert(!desktopMetrics.bodyOverflow, 'Must have zero horizontal overflow');
  assert(desktopMetrics.authorPhotoLoaded, 'Author photo must load successfully');

  // Check vertical alignment: book should be centered relative to content
  const bookCenterY = (desktopMetrics.bookCoverRect.top + desktopMetrics.bookCoverRect.bottom) / 2;
  const contentCenterY = (desktopMetrics.bookContentRect.top + desktopMetrics.bookContentRect.bottom) / 2;
  const diffCenter = Math.abs(bookCenterY - contentCenterY);
  console.log(`    Vertical center offset between book and content: ${diffCenter.toFixed(1)}px`);
  assert(diffCenter < 60, 'Book should be vertically aligned/centered with right-side content');

  const heroElem1440 = await page.$('#book') || await page.$('.book-section');
  await heroElem1440.screenshot({ path: path.join(ARTIFACTS_DIR, 'perfect_hero_1440.png') });
  console.log('  ✓ Screenshot captured: perfect_hero_1440.png');
  console.log('  ✓ PASS: Desktop 1440px layout verified\n');

  // Test 2: Tablet 1024px
  console.log('--- 2. Testing Tablet 1024px Layout ---');
  await page.setViewport({ width: 1024, height: 800 });
  await sleep(600);
  const tabletMetrics = await page.evaluate(() => {
    const bookCover = document.querySelector('.book-cover');
    const bookContent = document.querySelector('.book-content');
    const sec = document.querySelector('.book-section');
    return {
      bookWidth: bookCover.offsetWidth,
      contentWidth: bookContent.offsetWidth,
      isSideBySide: bookCover.getBoundingClientRect().right < bookContent.getBoundingClientRect().left,
      overflow: document.body.scrollWidth > document.body.clientWidth,
    };
  });
  console.log(`    Book Width: ${tabletMetrics.bookWidth}px, Content Width: ${tabletMetrics.contentWidth}px`);
  console.log(`    Is Side by Side: ${tabletMetrics.isSideBySide}`);
  assert(tabletMetrics.isSideBySide, 'Tablet 1024px must maintain side-by-side columns');
  assert(tabletMetrics.bookWidth >= 280, 'Book must remain prominent on tablet');
  assert(!tabletMetrics.overflow, 'No overflow on 1024px tablet');

  const heroElem1024 = await page.$('#book') || await page.$('.book-section');
  await heroElem1024.screenshot({ path: path.join(ARTIFACTS_DIR, 'perfect_hero_1024.png') });
  console.log('  ✓ Screenshot captured: perfect_hero_1024.png');
  console.log('  ✓ PASS: Tablet 1024px layout verified\n');

  // Test 3: Tablet 768px
  console.log('--- 3. Testing Tablet 768px Layout ---');
  await page.setViewport({ width: 768, height: 1024 });
  await sleep(600);
  const tablet768Metrics = await page.evaluate(() => {
    const bookCover = document.querySelector('.book-cover');
    const bookWrap = document.querySelector('.book-cover-wrap');
    const isVisible = window.getComputedStyle(bookCover).display !== 'none' && window.getComputedStyle(bookCover).visibility !== 'hidden';
    return {
      bookWidth: bookCover.offsetWidth,
      bookWrapWidth: bookWrap.offsetWidth,
      isVisible,
      overflow: document.body.scrollWidth > document.body.clientWidth,
    };
  });
  console.log(`    Book Width: ${tablet768Metrics.bookWidth}px, Visible: ${tablet768Metrics.isVisible}`);
  assert(tablet768Metrics.isVisible, 'Book must be visible on 768px');
  assert(tablet768Metrics.bookWidth >= 260, 'Book must remain prominent (>= 260px) on 768px');
  assert(!tablet768Metrics.overflow, 'No overflow on 768px tablet');

  const heroElem768 = await page.$('#book') || await page.$('.book-section');
  await heroElem768.screenshot({ path: path.join(ARTIFACTS_DIR, 'perfect_hero_768.png') });
  console.log('  ✓ Screenshot captured: perfect_hero_768.png');
  console.log('  ✓ PASS: Tablet 768px layout verified\n');

  // Test 4: Mobile 390px
  console.log('--- 4. Testing Mobile 390px Layout ---');
  await page.setViewport({ width: 390, height: 844 });
  await sleep(600);
  const mobileMetrics = await page.evaluate(() => {
    const bookCover = document.querySelector('.book-cover');
    const isVisible = window.getComputedStyle(bookCover).display !== 'none' && window.getComputedStyle(bookCover).visibility !== 'hidden';
    const bodyW = document.body.clientWidth;
    const scrollW = document.body.scrollWidth;
    const authorPhoto = document.querySelector('.cover-author-photo');
    return {
      bookWidth: bookCover.offsetWidth,
      bookHeight: bookCover.offsetHeight,
      isVisible,
      overflow: scrollW > bodyW,
      authorPhotoLoaded: authorPhoto && authorPhoto.complete && authorPhoto.naturalWidth > 0,
    };
  });
  console.log(`    Book Width: ${mobileMetrics.bookWidth}px, Height: ${mobileMetrics.bookHeight}px`);
  console.log(`    Book Visible: ${mobileMetrics.isVisible}`);
  console.log(`    Mobile Horizontal Overflow: ${mobileMetrics.overflow}`);
  assert(mobileMetrics.isVisible, 'Book must remain visible on mobile');
  assert(mobileMetrics.bookWidth >= 260, 'Book must remain prominent (>= 260px) on mobile');
  assert(!mobileMetrics.overflow, 'No horizontal overflow on mobile');

  const heroElem390 = await page.$('#book') || await page.$('.book-section');
  await heroElem390.screenshot({ path: path.join(ARTIFACTS_DIR, 'perfect_hero_390.png') });
  console.log('  ✓ Screenshot captured: perfect_hero_390.png');
  console.log('  ✓ PASS: Mobile 390px layout verified\n');

  // Test 5: Email Subscription Form Functionality
  console.log('--- 5. Testing Email Subscription Form Functionality ---');
  await page.setViewport({ width: 1440, height: 900 });
  await sleep(400);
  await page.type('.book-signup input[type="email"]', 'tester@example.com');
  const submitBtn = await page.$('.book-signup button[type="submit"]');
  assert(submitBtn, 'Submit button must exist in book-signup form');
  await submitBtn.click();
  await sleep(800);

  const successMessage = await page.evaluate(() => {
    const el = document.querySelector('.book-cta-row');
    return el ? el.innerText : '';
  });
  console.log(`    Hero Form Response: "${successMessage.trim()}"`);
  assert(successMessage.includes('Complexes sent') || successMessage.includes('✓'), 'Form submission should trigger confirmation state');
  console.log('  ✓ PASS: Hero email subscription form works as expected\n');

  // Test 6: Verify Other Sections Untouched
  console.log('--- 6. Verifying Integrity of Other Homepage Sections ---');
  const sectionsIntegrity = await page.evaluate(() => {
    return {
      whatsInside: Boolean(document.getElementById('whats-inside')),
      about: Boolean(document.getElementById('about')),
      blog: Boolean(document.getElementById('blog')),
      workingOn: Boolean(document.querySelector('.working-on')),
      newsletter: Boolean(document.getElementById('newsletter')),
      footer: Boolean(document.querySelector('footer')),
    };
  });
  console.log('    Sections integrity:', JSON.stringify(sectionsIntegrity));
  assert(sectionsIntegrity.whatsInside && sectionsIntegrity.about && sectionsIntegrity.blog && sectionsIntegrity.workingOn && sectionsIntegrity.newsletter && sectionsIntegrity.footer, 'All other homepage sections must remain completely intact');
  console.log('  ✓ PASS: All other sections remain completely intact\n');

  await browser.close();
  console.log('========================================================================');
  console.log('🎉 ALL HERO SECTION & BOOK COVER TESTS PASSED WITH 100% SUCCESS!');
  console.log('========================================================================');
})();

