const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROD_URL = 'https://abhisingh-website.vercel.app';

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  console.log('Verifying 3x3 Grid on Production:', PROD_URL);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    await page.goto(`${PROD_URL}/`, { waitUntil: 'domcontentloaded' });
    await delay(1500);

    const gridInfo = await page.evaluate(() => {
      const grid = document.querySelector('.blog-cards-grid');
      const cards = document.querySelectorAll('.blog-cards-grid .blog-card');
      const cols = grid ? window.getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length : 0;
      const pagination = Boolean(document.querySelector('.blog-pagination-wrap'));
      return {
        hasGrid: Boolean(grid),
        cardCount: cards.length,
        colCount: cols,
        hasPagination: pagination,
      };
    });

    console.log('Production Grid Status:', gridInfo);
    if (gridInfo.colCount === 3 && gridInfo.hasPagination) {
      console.log('PROD 3X3 GRID VERIFIED SUCCESSFULLY! ✅');
    } else {
      console.log('PROD 3X3 GRID VERIFICATION FAILED! ❌');
      process.exit(1);
    }
  } catch (err) {
    console.error('Prod verification error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();

