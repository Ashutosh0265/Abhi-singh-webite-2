const puppeteer = require('puppeteer-core');
const path = require('path');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159';

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new' });
  const page = await browser.newPage();
  
  // Crop book from ref and book from current
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  const currBook = await page.$('.book-col') || await page.$('.book-cover-wrap');
  if (currBook) {
    await currBook.screenshot({ path: path.join(ARTIFACTS_DIR, 'curr_book_isolated.png') });
  }

  // Also check if there was any image in ref_hero_viewport.png
  // Let's inspect the DOM in commit a912320 or 0e72333
  await browser.close();
  console.log('Isolated book screenshot saved.');
})();

