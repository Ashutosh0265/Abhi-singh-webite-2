const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROD_URL = 'https://abhisingh-website.vercel.app';
const ARTIFACTS_DIR = 'C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159';

(async () => {
  console.log('🚀 Verifying Live Production Website at https://abhisingh-website.vercel.app ...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 1. Visit live production website
    await page.goto(PROD_URL, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // Check navbar items
    const navTexts = await page.evaluate(() => {
      const by = document.querySelector('.nav-by')?.textContent?.trim() || '';
      const name = document.querySelector('.nav-name')?.textContent?.trim() || '';
      const content = document.querySelector('.nav-links a[href="#content"]')?.textContent?.trim() || '';
      const newsletter = document.querySelector('.nav-links a[href="#newsletter"]')?.textContent?.trim() || '';
      const store = document.querySelector('.nav-links a[href="#store"]')?.textContent?.trim() || '';
      const blog = document.querySelector('.nav-links a[href="#blog"]')?.textContent?.trim() || '';
      const about = document.querySelector('.nav-links a[href="#about"]')?.textContent?.trim() || '';
      const cta = document.querySelector('.nav-cta')?.textContent?.trim() || '';
      return { by, name, content, newsletter, store, blog, about, cta };
    });

    console.log('[PROD Visitor] Navbar items:', JSON.stringify(navTexts));
    if (!navTexts.content || !navTexts.newsletter || !navTexts.store || !navTexts.blog || !navTexts.about || !navTexts.cta) {
      throw new Error(`[PROD] Navigation item missing: ${JSON.stringify(navTexts)}`);
    }

    // Check sections
    const sectionVis = await page.evaluate(() => {
      const ids = ['#book', '#whats-inside', '#about', '#blog', '#newsletter', 'footer'];
      return ids.map((sel) => {
        const el = document.querySelector(sel);
        return {
          selector: sel,
          exists: !!el,
          height: el ? el.getBoundingClientRect().height : 0,
          opacity: el ? window.getComputedStyle(el).opacity : '0',
        };
      });
    });

    console.log('[PROD Visitor] Sections:');
    for (const s of sectionVis) {
      console.log(`  - ${s.selector}: height=${s.height}px, opacity=${s.opacity}`);
      if (!s.exists || s.height === 0 || s.opacity === '0') {
        throw new Error(`[PROD] Section invisible: ${JSON.stringify(s)}`);
      }
    }

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verified_prod_live_edit_fixed.png'), fullPage: false });
    console.log('✅ PROD VERIFICATION SUCCESS: All navbar links and sections are fully visible on production!');

  } catch (err) {
    console.error('❌ PROD VERIFICATION FAILED:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();

