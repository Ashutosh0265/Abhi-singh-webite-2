const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to http://localhost:3000/?edit=true...');
  // Set admin session first
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('elrx_admin_session', JSON.stringify({
      authenticated: true,
      email: 'abhi@abhisingh.me',
      fullName: 'Abhi Singh',
      role: 'superadmin',
      timestamp: Date.now()
    }));
  });

  await page.goto('http://localhost:3000/?edit=true', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Check state with Live Edit ON
  const onState = await page.evaluate(() => {
    const nav = document.querySelector('nav:not(.blog-pagination-wrap)');
    const navLinks = Array.from(document.querySelectorAll('.nav-links li a, .nav-links li button')).map(el => ({
      text: el.innerText.trim(),
      visible: window.getComputedStyle(el).display !== 'none' && window.getComputedStyle(el).visibility !== 'hidden' && parseFloat(window.getComputedStyle(el).opacity) > 0,
      opacity: window.getComputedStyle(el).opacity,
      color: window.getComputedStyle(el).color
    }));
    const toolbar = document.querySelector('.live-admin-toolbar');
    const toggleBtn = document.querySelector('.live-toolbar-toggle-btn');
    return {
      toolbarExists: !!toolbar,
      toggleBtnText: toggleBtn ? toggleBtn.innerText : null,
      navVisible: nav ? window.getComputedStyle(nav).visibility : null,
      navLinks
    };
  });
  console.log('Live Edit ON State:', JSON.stringify(onState, null, 2));

  // Now click toggle button to turn Live Edit OFF
  console.log('Clicking toggle button to turn Live Edit OFF...');
  await page.click('.live-toolbar-toggle-btn');
  await new Promise(r => setTimeout(r, 1000));

  // Check state with Live Edit OFF
  const offState = await page.evaluate(() => {
    const nav = document.querySelector('nav:not(.blog-pagination-wrap)');
    const navLinks = Array.from(document.querySelectorAll('.nav-links li a, .nav-links li button')).map(el => ({
      text: el.innerText.trim(),
      visible: window.getComputedStyle(el).display !== 'none' && window.getComputedStyle(el).visibility !== 'hidden' && parseFloat(window.getComputedStyle(el).opacity) > 0,
      opacity: window.getComputedStyle(el).opacity,
      color: window.getComputedStyle(el).color
    }));
    const toggleBtn = document.querySelector('.live-toolbar-toggle-btn');
    const workingOn = document.querySelector('.working-on');
    const footer = document.querySelector('footer');

    return {
      toggleBtnText: toggleBtn ? toggleBtn.innerText : null,
      navVisible: nav ? window.getComputedStyle(nav).visibility : null,
      navLinks,
      workingOnVisible: workingOn ? window.getComputedStyle(workingOn).visibility : null,
      workingOnOpacity: workingOn ? window.getComputedStyle(workingOn).opacity : null,
      footerVisible: footer ? window.getComputedStyle(footer).visibility : null,
      footerOpacity: footer ? window.getComputedStyle(footer).opacity : null,
    };
  });
  console.log('Live Edit OFF State:', JSON.stringify(offState, null, 2));

  await browser.close();
})();

