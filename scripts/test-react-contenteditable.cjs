// Test to verify React contentEditable behavior with children vs without children
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

async function testFix() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.goto(`${BASE_URL}/?edit=true#home`, { waitUntil: 'networkidle0' });

  // Let's inspect how the DOM changes
  const initial = await page.evaluate(() => {
    const el = document.querySelector('[data-content-key="hero.line1"]');
    return {
      text: el.innerText,
      childNodesCount: el.childNodes.length,
      nodeType: el.childNodes[0] ? el.childNodes[0].nodeType : null
    };
  });
  console.log('Initial hero.line1:', initial);

  await browser.close();
}

testFix().catch(console.error);

