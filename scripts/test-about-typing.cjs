const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testAbout() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000/?edit=true#home', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  const aboutPSel = '[data-content-key="about.p1"]';
  await page.click(aboutPSel);

  // Use Ctrl+End to move to the very end of multi-line paragraph
  await page.keyboard.down('Control');
  await page.keyboard.press('End');
  await page.keyboard.up('Control');

  await page.keyboard.type(' Tested live.');
  await new Promise(r => setTimeout(r, 100));

  const text = await page.evaluate((sel) => document.querySelector(sel).innerText, aboutPSel);
  console.log('Full about text:\n', text);
  console.log('Ends with "Tested live.":', text.endsWith('Tested live.'));

  await browser.close();
}

testAbout().catch(console.error);

