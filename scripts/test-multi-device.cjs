const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const devices = [
  { name: 'iPhone SE (375px)', width: 375, height: 667 },
  { name: 'Pixel 7 (412px)', width: 412, height: 915 },
  { name: 'iPad Mini (768px)', width: 768, height: 1024 }
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const dev of devices) {
    const page = await browser.newPage();
    await page.setViewport({ width: dev.width, height: dev.height, isMobile: true });
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 800));

    // Click toggle
    await page.click('.mobile-menu-toggle');
    await new Promise(r => setTimeout(r, 500));

    const state = await page.evaluate(() => {
      const drawer = document.querySelector('.nav-links');
      const style = window.getComputedStyle(drawer);
      return {
        display: style.display,
        opacity: style.opacity,
        visibility: style.visibility,
        linksCount: drawer.querySelectorAll('li').length
      };
    });

    console.log(`Device: ${dev.name} => open state:`, state);
    if (state.opacity !== '1' || state.visibility !== 'visible' || state.linksCount !== 6) {
      console.error(`FAILED for ${dev.name}`);
      process.exit(1);
    }
    await page.close();
  }

  await browser.close();
  console.log('Multi-device mobile responsiveness passed 100%!');
})();

