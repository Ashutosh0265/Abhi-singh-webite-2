const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROD_URL = 'https://abhisingh-website.vercel.app';

async function verifyProdTyping() {
  console.log('Verifying Live Edit typing on production URL...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto(`${PROD_URL}/?edit=true#home`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  const heroSel = '[data-content-key="hero.line1"]';
  await page.waitForSelector(heroSel);
  await page.click(heroSel);
  await page.keyboard.press('End');

  const before = await page.evaluate(sel => document.querySelector(sel).innerText, heroSel);
  console.log('Production Initial Text:', before);

  // Type sequential characters
  await page.keyboard.type(' PRO');
  await new Promise(r => setTimeout(r, 100));

  const afterType = await page.evaluate(() => {
    const sel = window.getSelection();
    return {
      text: document.activeElement.innerText,
      focusOffset: sel.focusOffset
    };
  });
  console.log('Production After Typing:', afterType);

  // Backspace
  await page.keyboard.press('Backspace');
  await new Promise(r => setTimeout(r, 100));

  const afterBs = await page.evaluate(() => {
    const sel = window.getSelection();
    return {
      text: document.activeElement.innerText,
      focusOffset: sel.focusOffset
    };
  });
  console.log('Production After Backspace:', afterBs);

  const passed = afterType.text.endsWith(' PRO') && afterBs.text.endsWith(' PR');
  console.log('Production Typing Verification Passed:', passed);

  await browser.close();
}

verifyProdTyping().catch(console.error);

