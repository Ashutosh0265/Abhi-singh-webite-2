const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new' });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  const data = await page.evaluate(() => {
    const el = document.querySelector('.book-cover');
    const wrap = document.querySelector('.book-cover-wrap');
    const img = document.querySelector('.book-cover img');
    return {
      wrapStyle: window.getComputedStyle(wrap).cssText,
      coverOuter: el ? el.outerHTML : null,
      coverRect: el ? el.getBoundingClientRect() : null,
      imgSrc: img ? img.src : null,
      customCover: window.__siteContent?.hero?.bookImage,
    };
  });
  console.log('Cover data:', JSON.stringify(data, null, 2));
  await browser.close();
})();

