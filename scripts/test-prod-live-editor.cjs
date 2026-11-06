const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROD_URL = 'https://abhisingh-website.vercel.app';

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  console.log('Verifying Live Editor on Production:', PROD_URL);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    await page.goto(`${PROD_URL}/`, { waitUntil: 'domcontentloaded' });
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
    });

    await page.goto(`${PROD_URL}/?edit=true`, { waitUntil: 'domcontentloaded' });
    await delay(2000);

    const toolbarVisible = await page.evaluate(() => {
      return Boolean(document.querySelector('.live-admin-toolbar')) &&
        document.body.classList.contains('live-editing-active');
    });
    console.log('Production Live Editor Active:', toolbarVisible);

    const targetHeading = '[data-content-key="about.heading"]';
    await page.waitForSelector(targetHeading);
    await page.focus(targetHeading);
    await delay(300);

    const floatingToolbarVisible = await page.evaluate(() => {
      return Boolean(document.querySelector('.floating-typography-toolbar'));
    });
    console.log('Floating Typography Toolbar Visible:', floatingToolbarVisible);

    // Test typing and formatting
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      el.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, 'Prod Verification Heading');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, targetHeading);
    await delay(300);

    // Apply color change
    await page.evaluate(() => {
      const colorInput = document.querySelector('.floating-typography-toolbar input[type="color"]');
      if (colorInput) {
        colorInput.value = '#FF6200';
        colorInput.dispatchEvent(new Event('input', { bubbles: true }));
        colorInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await delay(300);

    const textAfterColor = await page.$eval(targetHeading, el => el.innerText.trim());
    console.log('Production Text after color change:', textAfterColor);

    const isBugFixed = textAfterColor === 'Prod Verification Heading';
    console.log('Bug 2.1 fixed on Production:', isBugFixed);

    // Test Bug 2.2 on Prod: select all and delete
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      el.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('delete', false, null);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, targetHeading);
    await delay(300);

    await page.evaluate(() => {
      if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }
    });
    await delay(400);

    const textAfterDelete = await page.$eval(targetHeading, el => el.innerText.trim());
    const dataEmpty = await page.$eval(targetHeading, el => el.getAttribute('data-empty'));
    console.log('Production Text after delete & blur:', JSON.stringify(textAfterDelete));
    console.log('Production data-empty attribute:', dataEmpty);

    const isDeleteFixed = textAfterDelete === '' && dataEmpty === 'true';
    console.log('Bug 2.2 fixed on Production:', isDeleteFixed);

    if (isBugFixed && isDeleteFixed) {
      console.log('PROD VERIFICATION SUCCEEDED! ✅');
    } else {
      console.log('PROD VERIFICATION FAILED! ❌');
    }
  } catch (err) {
    console.error('Prod verification error:', err);
  } finally {
    await browser.close();
  }
})();

