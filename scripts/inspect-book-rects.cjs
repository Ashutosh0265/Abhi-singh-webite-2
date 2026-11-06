const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });

  const bookInfo = await page.evaluate(() => {
    function rect(el) {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) };
    }
    const wrap = document.querySelector('.book-cover-wrap');
    const cover = document.querySelector('.book-cover');
    const title = document.querySelector('.cover-title');
    const subtitle = document.querySelector('.cover-subtitle');
    const authorPhoto = document.querySelector('.cover-author-photo');
    const authorName = document.querySelector('.cover-author-name');
    
    return {
      wrapRect: rect(wrap),
      coverRect: rect(cover),
      titleRect: rect(title),
      subtitleRect: rect(subtitle),
      authorPhotoRect: rect(authorPhoto),
      authorNameRect: rect(authorName),
      titleInsideCover: cover ? (title.getBoundingClientRect().top >= cover.getBoundingClientRect().top && title.getBoundingClientRect().bottom <= cover.getBoundingClientRect().bottom) : null,
      authorInsideCover: cover ? (authorPhoto.getBoundingClientRect().bottom <= cover.getBoundingClientRect().bottom) : null,
    };
  });

  console.log('Book Rects:', JSON.stringify(bookInfo, null, 2));
  await browser.close();
})();
