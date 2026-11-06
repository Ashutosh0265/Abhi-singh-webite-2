const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new' });
  const p1 = await browser.newPage();
  await p1.goto('http://localhost:5173/?edit=true#home', { waitUntil: 'networkidle0' });
  await p1.waitForSelector('[data-content-key="hero.line1"]');
  await p1.evaluate(() => {
    const el = document.querySelector('[data-content-key="hero.line1"]');
    el.innerText = 'Sculpt your';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  });
  await p1.click('.live-btn-save');
  await new Promise(r => setTimeout(r, 600));

  const p2 = await browser.newPage();
  await p2.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  const data = await p2.evaluate(() => {
    return {
      adminSessionSessionStorage: !!sessionStorage.getItem('elrx_admin_session'),
      adminSessionLocalStorage: !!localStorage.getItem('elrx_admin_session'),
      draftContent: localStorage.getItem('elrx_db_content_draft'),
      liveContent: localStorage.getItem('elrx_db_content'),
      heroText: document.querySelector('.hero-headline')?.innerText,
      hasToolbar: !!document.querySelector('.live-admin-toolbar')
    };
  });
  console.log('P2 DATA:', JSON.stringify(data, null, 2));
  await browser.close();
})();

