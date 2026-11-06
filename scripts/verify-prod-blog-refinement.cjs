const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROD_URL = 'https://abhisingh-website.vercel.app';
const ARTIFACTS_DIR = 'C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159';

(async () => {
  console.log('🚀 Running Live Production Blog Refinement Verification on Vercel...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    await page.goto(PROD_URL, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1200));

    // Check blog section cards on production
    const prodCards = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.blog-card'));
      return cards.map((c) => {
        const title = c.querySelector('.blog-card-title')?.textContent?.trim();
        const date = c.querySelector('.blog-card-date')?.textContent?.trim();
        const readTime = c.querySelector('.blog-card-readtime')?.textContent?.trim();
        const badge = c.querySelector('.blog-card-category-badge')?.textContent?.trim();
        const link = c.querySelector('.blog-card-link-text')?.textContent?.trim();
        const dateWrap = window.getComputedStyle(c.querySelector('.blog-card-date')).whiteSpace;
        const readTimeWrap = window.getComputedStyle(c.querySelector('.blog-card-readtime')).whiteSpace;

        return {
          title,
          date,
          readTime,
          badge,
          link,
          dateWrap,
          readTimeWrap,
        };
      });
    });

    console.log(`[PROD] Found ${prodCards.length} rendered blog cards:`);
    prodCards.forEach((c, i) => {
      console.log(`  ${i + 1}. [${c.badge}] "${c.title}" | ${c.date} · ${c.readTime} | whiteSpace: ${c.dateWrap}`);
      assert.strictEqual(c.dateWrap, 'nowrap', 'Date should be nowrap');
      assert.strictEqual(c.readTimeWrap, 'nowrap', 'Read time should be nowrap');
      assert.ok(c.readTime.includes('min read'), 'Read time should contain "min read"');
    });

    // Capture screenshot on production
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verified_prod_blog_refined.png'), fullPage: false });
    console.log('✅ LIVE PROD VERIFICATION SUCCESS: All blog cards refined, aligned, and verified on production!');
  } catch (err) {
    console.error('❌ PROD VERIFICATION FAILED:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();

