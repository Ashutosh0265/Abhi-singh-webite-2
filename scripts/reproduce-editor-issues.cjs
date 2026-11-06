const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  console.log('Testing Live Editor bugs under headless Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    // First authenticate as admin
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const session = {
        role: 'super_admin',
        adminName: 'Abhi Singh',
        email: 'abhi@eatliftrun.in',
        authenticated: true,
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem('abhisingh_super_admin_session', JSON.stringify(session));
      localStorage.setItem('abhisingh_admin_session', JSON.stringify(session));
      localStorage.setItem('elrx_admin_session', JSON.stringify(session));
      sessionStorage.setItem('abhisingh_super_admin_session', JSON.stringify(session));
      sessionStorage.setItem('abhisingh_admin_session', JSON.stringify(session));
      sessionStorage.setItem('elrx_admin_session', JSON.stringify(session));
    });

    // Enter live edit mode
    await page.goto(`${BASE_URL}/?edit=true`, { waitUntil: 'domcontentloaded' });
    await delay(1500);

    // Check if live editing toolbar is visible
    const isEditActive = await page.evaluate(() => {
      return document.body.classList.contains('live-editing-active') &&
        Boolean(document.querySelector('.live-admin-toolbar'));
    });
    console.log('Live Edit Active:', isEditActive);

    // Find the first editable heading (e.g. hero.line1 or whatsInside.heading or about.heading)
    const targetSelector = '[data-content-key="about.heading"], [data-content-key="whatsInside.heading"], [data-content-key="hero.line1"]';
    await page.waitForSelector(targetSelector);

    const initialText = await page.$eval(targetSelector, el => el.innerText);
    console.log('Initial text before edit:', initialText);

    // ── TEST 1: Change text and then click color or formatting ──
    console.log('\n--- Test 1: Change text, then apply color/formatting ---');
    await page.focus(targetSelector);
    await delay(300);

    // Clear and type new text
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      el.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, 'Brand New Custom Heading 123');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, targetSelector);
    await delay(400);

    const textAfterTyping = await page.$eval(targetSelector, el => el.innerText);
    console.log('Text after typing:', textAfterTyping);

    // Now change color using toolbar
    console.log('Attempting to change color via color picker or toolbar button...');
    const toolbarExists = await page.evaluate(() => Boolean(document.querySelector('.floating-typography-toolbar')));
    console.log('Floating typography toolbar exists:', toolbarExists);

    if (toolbarExists) {
      // Click a formatting button, e.g. Bold or change color
      await page.evaluate(() => {
        const colorInput = document.querySelector('.floating-typography-toolbar input[type="color"]');
        if (colorInput) {
          colorInput.value = '#FF5500';
          colorInput.dispatchEvent(new Event('input', { bubbles: true }));
          colorInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      await delay(500);
    }

    const textAfterColor = await page.$eval(targetSelector, el => el.innerText);
    console.log('Text after color change:', textAfterColor);

    if (textAfterColor !== 'Brand New Custom Heading 123') {
      console.log('🚨 BUG CONFIRMED: Text reverted back to:', textAfterColor);
    } else {
      console.log('✓ Text preserved after color change');
    }

    // ── TEST 2: Select All + Backspace (Empty content) ──
    console.log('\n--- Test 2: Select All + Backspace ---');
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      el.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('delete', false, null);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, targetSelector);
    await delay(500);

    const textAfterDelete = await page.$eval(targetSelector, el => el.innerText);
    console.log('Text after Select All + Delete (should be empty):', JSON.stringify(textAfterDelete));

    if (textAfterDelete.trim() !== '') {
      console.log('🚨 BUG CONFIRMED: Empty text was restored to:', JSON.stringify(textAfterDelete));
    } else {
      console.log('✓ Text correctly remained empty');
    }

    // Blur to see if blur restores it
    await page.evaluate((sel) => {
      document.querySelector(sel).blur();
    }, targetSelector);
    await delay(500);

    const textAfterBlur = await page.$eval(targetSelector, el => el.innerText);
    console.log('Text after blur (should still be empty):', JSON.stringify(textAfterBlur));

    if (textAfterBlur.trim() !== '') {
      console.log('🚨 BUG CONFIRMED: Blur restored previous text to:', JSON.stringify(textAfterBlur));
    } else {
      console.log('✓ Text correctly stayed empty on blur');
    }

  } finally {
    await browser.close();
  }
})();

