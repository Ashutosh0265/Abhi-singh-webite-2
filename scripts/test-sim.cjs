const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/');
  await new Promise(r => setTimeout(r, 1200));

  const debugInfo = await page.evaluate(() => {
    // Check localStorage
    const localContent = localStorage.getItem('elrx_db_site_content');
    const localDraft = localStorage.getItem('elrx_db_draft_content');
    return { localContent, localDraft };
  });
  console.log('Local storage:', debugInfo);

  // Let's inspect getNestedValue logic on window or simulate it:
  const sim = await page.evaluate(() => {
    const defaultSiteContent = {
      hero: {},
      whatsInside: {},
      about: {},
    };
    function getNestedValue(obj, path, defaultValue = '') {
      if (!obj || !path) return defaultValue;
      const parts = path.split('.');
      let current = obj;
      for (const part of parts) {
        if (current == null || typeof current !== 'object') return defaultValue;
        current = current[part];
      }
      return current !== undefined && current !== null ? current : defaultValue;
    }

    const hasExplicit = Boolean('nav.content' && getNestedValue(defaultSiteContent, 'nav.content', undefined) !== undefined);
    const contentVal = hasExplicit ? getNestedValue(defaultSiteContent, 'nav.content') : 'Content';
    return { hasExplicit, contentVal };
  });
  console.log('Simulation with defaultSiteContent:', sim);

  await browser.close();
})();

