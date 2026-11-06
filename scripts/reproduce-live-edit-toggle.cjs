const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const ARTIFACT_DIR = 'C:\\Users\\ashut\\.gemini\\antigravity\\brain\\d44916b9-6f29-404e-b94f-138b40f5c159';

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  console.log('--- REPRODUCING LIVE EDIT TOGGLE ISSUES ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Set super admin session
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
    });

    // 1. Open with Live Edit ON
    await page.goto(`${BASE_URL}/?edit=true`, { waitUntil: 'domcontentloaded' });
    await delay(1500);

    console.log('\n[STATE 1: LIVE EDIT ON]');
    const onScreenshot = path.join(ARTIFACT_DIR, 'debug_live_edit_ON.png');
    await page.screenshot({ path: onScreenshot });
    console.log('Captured Live Edit ON screenshot:', onScreenshot);

    const onAudit = await page.evaluate(() => {
      const getStyles = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const s = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          display: s.display,
          visibility: s.visibility,
          opacity: s.opacity,
          color: s.color,
          backgroundColor: s.backgroundColor,
          height: rect.height,
          width: rect.width,
          top: rect.top,
          outline: s.outline,
          innerText: el.innerText.trim().substring(0, 30),
        };
      };

      return {
        bodyClasses: document.body.className,
        nav: getStyles('nav:not(.blog-pagination-wrap)'),
        navLinks: getStyles('.nav-links'),
        firstNavLink: getStyles('.nav-links a'),
        navCta: getStyles('.nav-cta'),
        hero: getStyles('#book'),
        whatsInside: getStyles('#whats-inside'),
        about: getStyles('#about'),
        blog: getStyles('#blog'),
        newsletter: getStyles('#newsletter'),
        footer: getStyles('footer'),
      };
    });
    console.log('Live Edit ON styles:', JSON.stringify(onAudit, null, 2));

    // 2. Click Live Edit Toggle to turn it OFF
    console.log('\n[Action: Clicking Live Edit Toggle to turn OFF...]');
    await page.evaluate(() => {
      const toggleBtn = document.querySelector('.live-toolbar-toggle-btn');
      if (toggleBtn) toggleBtn.click();
    });
    await delay(1200);

    console.log('\n[STATE 2: LIVE EDIT OFF]');
    const offScreenshot = path.join(ARTIFACT_DIR, 'debug_live_edit_OFF.png');
    await page.screenshot({ path: offScreenshot });
    console.log('Captured Live Edit OFF screenshot:', offScreenshot);

    const offAudit = await page.evaluate(() => {
      const getStyles = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const s = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          display: s.display,
          visibility: s.visibility,
          opacity: s.opacity,
          color: s.color,
          backgroundColor: s.backgroundColor,
          height: rect.height,
          width: rect.width,
          top: rect.top,
          outline: s.outline,
          innerText: el.innerText.trim().substring(0, 30),
        };
      };

      // Check inner children of about and whatsInside to see if any are opacity: 0
      const hiddenChildren = Array.from(document.querySelectorAll('section *')).filter(el => {
        const s = window.getComputedStyle(el);
        return s.opacity === '0' || s.visibility === 'hidden' || s.display === 'none';
      }).map(el => ({
        tag: el.tagName,
        className: el.className,
        id: el.id,
        text: el.innerText ? el.innerText.substring(0, 20) : '',
      }));

      return {
        bodyClasses: document.body.className,
        nav: getStyles('nav:not(.blog-pagination-wrap)'),
        navLinks: getStyles('.nav-links'),
        firstNavLink: getStyles('.nav-links a'),
        navCta: getStyles('.nav-cta'),
        hero: getStyles('#book'),
        whatsInside: getStyles('#whats-inside'),
        about: getStyles('#about'),
        blog: getStyles('#blog'),
        newsletter: getStyles('#newsletter'),
        footer: getStyles('footer'),
        hiddenChildrenCount: hiddenChildren.length,
        sampleHiddenChildren: hiddenChildren.slice(0, 10),
      };
    });
    console.log('Live Edit OFF styles:', JSON.stringify(offAudit, null, 2));

  } catch (err) {
    console.error('Reproduction script error:', err);
  } finally {
    await browser.close();
  }
})();

