const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });

  const info = await page.evaluate(() => {
    const pageWrap = document.querySelector('.page-wrap');
    const heroSection = document.querySelector('#book');
    const bookSec = document.querySelector('.book-section');
    const bookCol = document.querySelector('.book-col');
    const bookWrap = document.querySelector('.book-cover-wrap');
    const bookCover = document.querySelector('.book-cover');
    const coverTitle = document.querySelector('.cover-title');
    const coverTitleBlock = document.querySelector('.cover-title-block');
    const coverSubtitle = document.querySelector('.cover-subtitle');
    const authorRow = document.querySelector('.cover-author-row');
    const bookContent = document.querySelector('.book-content');
    const h1 = document.querySelector('.hero-headline');
    const p1 = bookContent.querySelectorAll('p')[0];
    const p2 = bookContent.querySelectorAll('p')[1];
    const form = document.querySelector('.book-signup');

    return {
      pageWrapWidth: pageWrap?.offsetWidth,
      heroSectionWidth: heroSection?.offsetWidth,
      bookSecComputedGrid: window.getComputedStyle(bookSec).gridTemplateColumns,
      bookSecGap: window.getComputedStyle(bookSec).gap,
      bookWrapWidth: bookWrap?.offsetWidth,
      bookWrapHeight: bookWrap?.offsetHeight,
      bookCoverWidth: bookCover?.offsetWidth,
      bookCoverHeight: bookCover?.offsetHeight,
      bookCoverAspectRatio: window.getComputedStyle(bookCover).aspectRatio,
      bookCoverOverflow: window.getComputedStyle(bookCover).overflow,
      coverTitleBlockMarginTop: window.getComputedStyle(coverTitleBlock).marginTop,
      coverTitleFontSize: window.getComputedStyle(coverTitle).fontSize,
      coverSubtitleFontSize: window.getComputedStyle(coverSubtitle).fontSize,
      h1Width: h1?.offsetWidth,
      h1FontSize: window.getComputedStyle(h1).fontSize,
      h1LineHeight: window.getComputedStyle(h1).lineHeight,
      bookContentWidth: bookContent?.offsetWidth,
      bookContentHeight: bookContent?.offsetHeight,
      authorPhotoSrc: document.querySelector('.cover-author-photo')?.src,
      authorPhotoNaturalWidth: document.querySelector('.cover-author-photo')?.naturalWidth,
    };
  });

  console.log('Hero Detailed Info:', JSON.stringify(info, null, 2));
  await browser.close();
})();

