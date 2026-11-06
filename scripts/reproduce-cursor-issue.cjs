const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

async function testTyping() {
  console.log('Testing Live Edit mode typing and cursor behavior...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Open with ?edit=true
  await page.goto(`${BASE_URL}/?edit=true#home`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Find the first hero headline editable element
  const headlineSel = '.hero-headline [data-content-key="hero.line1"], [data-content-key="hero.line1"]';
  await page.waitForSelector(headlineSel);

  // Click on it
  await page.click(headlineSel);
  await new Promise(r => setTimeout(r, 200));

  // Check initial text
  const initialText = await page.evaluate((sel) => document.querySelector(sel).innerText, headlineSel);
  console.log(`Initial text: "${initialText}"`);

  // Move cursor to end, type " ABC"
  await page.keyboard.press('End');
  await page.keyboard.type('X');
  await new Promise(r => setTimeout(r, 100));

  // Check cursor position after typing 'X'
  const afterX = await page.evaluate(() => {
    const sel = window.getSelection();
    return {
      text: document.activeElement.innerText,
      anchorOffset: sel.anchorOffset,
      focusOffset: sel.focusOffset
    };
  });
  console.log('After typing X:', afterX);

  await page.keyboard.type('Y');
  await new Promise(r => setTimeout(r, 100));

  const afterY = await page.evaluate(() => {
    const sel = window.getSelection();
    return {
      text: document.activeElement.innerText,
      anchorOffset: sel.anchorOffset,
      focusOffset: sel.focusOffset
    };
  });
  console.log('After typing Y:', afterY);

  await page.keyboard.press('Backspace');
  await new Promise(r => setTimeout(r, 100));

  const afterBackspace = await page.evaluate(() => {
    const sel = window.getSelection();
    return {
      text: document.activeElement.innerText,
      anchorOffset: sel.anchorOffset,
      focusOffset: sel.focusOffset
    };
  });
  console.log('After Backspace:', afterBackspace);

  await browser.close();
}

testTyping().catch(console.error);

