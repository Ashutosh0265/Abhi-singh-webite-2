const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROD_URL = 'https://abhisingh-website.vercel.app';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await page.goto(PROD_URL, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));

  // Click toggle
  await page.click('.mobile-menu-toggle');
  await new Promise(r => setTimeout(r, 550));

  const state = await page.evaluate(() => {
    const drawer = document.querySelector('.nav-links');
    const toggle = document.querySelector('.mobile-menu-toggle');
    const style = window.getComputedStyle(drawer);
    return {
      isActive: toggle.classList.contains('is-active'),
      isMobileOpen: drawer.classList.contains('mobile-open'),
      opacity: style.opacity,
      visibility: style.visibility,
      linksCount: drawer.querySelectorAll('li').length
    };
  });

  console.log('PROD MOBILE MENU OPEN STATE:', state);
  await page.screenshot({ path: 'C:\\Users\\ashut\\.gemini\\antigravity\\brain\\d44916b9-6f29-404e-b94f-138b40f5c159\\verified_prod_mobile_hamburger_open.png' });
  await browser.close();
})();

