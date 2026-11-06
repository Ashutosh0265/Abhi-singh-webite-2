const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const ARTIFACT_DIR = 'C:\\Users\\ashut\\.gemini\\antigravity\\brain\\d44916b9-6f29-404e-b94f-138b40f5c159';
const SCREENSHOT_PATH = path.join(ARTIFACT_DIR, 'verified_public_article_reader.png');

(async () => {
  console.log('Verifying public website article reader modal...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });

  await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));

  // Find blog article card on homepage
  const clicked = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.blog-card, [class*="blog"] article, .newsletter-card, article'));
    if (cards.length > 0) {
      cards[0].click();
      return true;
    }
    return false;
  });

  await new Promise((r) => setTimeout(r, 1000));

  const modalRendered = await page.evaluate(() => {
    const reader = document.querySelector('.modal-box-reader, .article-reader-content');
    const title = document.querySelector('.modal-reader-title');
    const video = document.querySelector('.article-video-wrap video');
    return {
      hasReader: Boolean(reader),
      title: title ? title.textContent : null,
      hasVideo: Boolean(video && video.src),
    };
  });

  console.log('Public Reader Modal State:', modalRendered);
  await page.screenshot({ path: SCREENSHOT_PATH, fullPage: false });
  console.log('Public reader screenshot saved:', SCREENSHOT_PATH);

  await browser.close();
  process.exit(modalRendered.hasReader ? 0 : 1);
})();

