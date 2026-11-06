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
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.setItem('elrx_newsletter_seen', 'true');
  });
  await page.reload({ waitUntil: 'networkidle0' });

  // Hero inspection
  const heroData = await page.evaluate(() => {
    const heroSec = document.querySelector('#book');
    const bookSec = document.querySelector('.book-section');
    const bookCover = document.querySelector('.book-col');
    const bookContent = document.querySelector('.book-content');
    const headline = document.querySelector('.hero-headline');
    const form = document.querySelector('.book-signup');
    const nav = document.querySelector('nav');

    return {
      navHeight: nav?.offsetHeight,
      heroPaddingTop: window.getComputedStyle(heroSec).paddingTop,
      heroPaddingBottom: window.getComputedStyle(heroSec).paddingBottom,
      bookSecAlign: window.getComputedStyle(bookSec).alignItems,
      bookSecGap: window.getComputedStyle(bookSec).gap,
      bookCoverHeight: bookCover?.offsetHeight,
      bookContentHeight: bookContent?.offsetHeight,
      headlineLines: Array.from(headline?.querySelectorAll('.hero-line') || []).map(el => el.innerText.trim()),
      headlineFontSize: window.getComputedStyle(headline).fontSize,
      headlineLineHeight: window.getComputedStyle(headline).lineHeight,
      formHeight: form?.offsetHeight,
      inputHeight: form?.querySelector('input')?.offsetHeight,
      btnHeight: form?.querySelector('button')?.offsetHeight,
    };
  });
  console.log('Hero Data:', JSON.stringify(heroData, null, 2));

  // Section 6 inspection
  const sec6Data = await page.evaluate(() => {
    const sec = document.querySelector('.footer-signup');
    const wrap = sec?.querySelector('.page-wrap');
    const h2 = sec?.querySelector('h2');
    const sub = sec?.querySelector('.sub');
    const form = sec?.querySelector('.signup-row');
    const tagline = sec?.querySelector('.hero-tagline');

    return {
      secPadding: window.getComputedStyle(sec).padding,
      wrapGrid: window.getComputedStyle(wrap).gridTemplateColumns,
      wrapGap: window.getComputedStyle(wrap).gap,
      h2Html: h2?.innerHTML,
      h2Text: h2?.innerText,
      subText: sub?.innerText,
      subWidth: sub?.offsetWidth,
      subLinesEstimate: sub ? Math.round(sub.offsetHeight / parseFloat(window.getComputedStyle(sub).lineHeight)) : null,
      formHeight: form?.offsetHeight,
      taglineText: tagline?.innerText,
    };
  });
  console.log('Section 6 Data:', JSON.stringify(sec6Data, null, 2));

  // Capture clean screenshots
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'clean_hero_and_nav_desktop.png'), clip: { x: 0, y: 0, width: 1440, height: 750 } });

  const sec6Box = await page.evaluate(() => {
    const el = document.querySelector('.footer-signup');
    const r = el.getBoundingClientRect();
    return { x: 0, y: window.scrollY + r.top - 20, width: 1440, height: r.height + 40 };
  });
  await page.evaluate((y) => window.scrollTo(0, y), sec6Box.y);
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'clean_section6_desktop.png'), clip: { x: 0, y: 0, width: 1440, height: sec6Box.height } });

  await browser.close();
})();

