const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const ARTIFACT_DIR = 'C:\\Users\\ashut\\.gemini\\antigravity\\brain\\d44916b9-6f29-404e-b94f-138b40f5c159';

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runE2ETests() {
  console.log('====================================================');
  console.log('🧪 HOMEPAGE BLOG PAGINATION BROWSER E2E TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✕ FAIL: ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Open homepage
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await delay(1200);

    // ── TEST 1: OLD BUTTON REMOVAL & NEW PAGINATION PRESENCE ──
    console.log('--- 1. DOM Architecture & Component Verification ---');
    await test('Old "Show More Articles" button is completely removed', async () => {
      const oldBtnExists = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.some(b => b.innerText.includes('Show More Articles') || b.classList.contains('blog-more-btn'));
      });
      assert.strictEqual(oldBtnExists, false, 'The old Show More Articles button must not exist');
    });

    await test('Numbered pagination component is rendered below the article grid', async () => {
      const paginationExists = await page.evaluate(() => {
        const nav = document.querySelector('.blog-pagination-wrap');
        const grid = document.querySelector('.blog-cards-grid');
        return Boolean(nav && grid);
      });
      assert.strictEqual(paginationExists, true, 'Pagination navigation element must exist in DOM');
    });

    // ── TEST 2: INITIAL PAGE 1 STATE & ARTICLE GRID ──
    console.log('\n--- 2. Initial Page 1 State & Desktop Grid Slicing ---');
    await test('Page 1 displays initial published articles (up to 9 articles per page)', async () => {
      const cardCount = await page.evaluate(() => {
        return document.querySelectorAll('.blog-cards-grid .blog-card').length;
      });
      assert.ok(cardCount >= 1 && cardCount <= 9, `Initial articles count (${cardCount}) must be between 1 and 9`);
    });

    await test('Page 1 button is active, Previous is disabled', async () => {
      const state = await page.evaluate(() => {
        const prevBtn = document.querySelector('.blog-pagination-prev');
        const activeNum = document.querySelector('.blog-pagination-num-btn.active');
        return {
          prevDisabled: prevBtn ? prevBtn.disabled : null,
          activeText: activeNum ? activeNum.innerText.trim() : null,
        };
      });
      assert.strictEqual(state.prevDisabled, true, 'Previous button must be disabled on page 1');
      assert.strictEqual(state.activeText, '1', 'Page 1 button must be marked active');
    });

    // ── TEST 3: MULTI-PAGE NAVIGATION & CARD REPLACEMENT ──
    console.log('\n--- 3. Page Switching & Card Replacement ---');
    await test('With 12 published articles, Page 1 displays 9 cards and Page 2 displays 3 cards', async () => {
      // Inject 12 articles
      await page.evaluate(() => {
        const twelve = Array.from({ length: 12 }, (_, i) => ({
          id: `e2e_art_${i + 1}`,
          title: `E2E Article ${i + 1}: Performance Habit`,
          status: 'published',
          category: 'Framework',
          summary: `Summary of article ${i + 1}.`,
          thumbnail: 'assets/hyrox-mumbai.png',
        }));
        localStorage.setItem('elrx_db_posts_v3', JSON.stringify(twelve));
        window.dispatchEvent(new CustomEvent('elrx_data_changed', { detail: { key: 'elrx_db_posts_v3' } }));
      });
      await delay(800);

      // Verify Page 1
      const p1Titles = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.blog-card-title')).map(el => el.innerText.trim());
      });
      assert.strictEqual(p1Titles.length, 9, 'Page 1 must display exactly 9 articles');

      // Click page 2
      await page.evaluate(() => {
        const page2Btn = Array.from(document.querySelectorAll('.blog-pagination-num-btn')).find(b => b.innerText.trim() === '2');
        if (page2Btn) page2Btn.click();
      });
      await delay(600);

      const p2Titles = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.blog-card-title')).map(el => el.innerText.trim());
      });
      assert.strictEqual(p2Titles.length, 3, 'Page 2 must display remaining 3 articles (12 - 9 = 3)');

      // Verify no overlap
      const overlap = p2Titles.some(t => p1Titles.includes(t));
      assert.strictEqual(overlap, false, 'Page 2 articles must not overlap with page 1 articles');

      const state2 = await page.evaluate(() => {
        const prevBtn = document.querySelector('.blog-pagination-prev');
        const nextBtn = document.querySelector('.blog-pagination-next');
        const activeNum = document.querySelector('.blog-pagination-num-btn.active');
        return {
          prevDisabled: prevBtn ? prevBtn.disabled : null,
          nextDisabled: nextBtn ? nextBtn.disabled : null,
          activeText: activeNum ? activeNum.innerText.trim() : null,
        };
      });
      assert.strictEqual(state2.prevDisabled, false, 'Previous button must be enabled on page 2');
      assert.strictEqual(state2.nextDisabled, true, 'Next button must be disabled on the last page');
      assert.strictEqual(state2.activeText, '2', 'Page 2 button must be marked active');

      // Return to page 1 via Previous button
      await page.evaluate(() => {
        const prevBtn = document.querySelector('.blog-pagination-prev');
        if (prevBtn) prevBtn.click();
      });
      await delay(600);

      const restoredTitles = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.blog-card-title')).map(el => el.innerText.trim());
      });
      assert.deepStrictEqual(restoredTitles, p1Titles, 'Page 1 articles must be accurately restored');

      // Forward via Next button
      await page.evaluate(() => {
        const nextBtn = document.querySelector('.blog-pagination-next');
        if (nextBtn) nextBtn.click();
      });
      await delay(600);

      const activeTextNext = await page.evaluate(() => document.querySelector('.blog-pagination-num-btn.active')?.innerText.trim());
      assert.strictEqual(activeTextNext, '2');
    });

    // ── TEST 4: CMS DYNAMIC SYNCHRONIZATION ──
    console.log('\n--- 4. Live CMS Dynamic Synchronization ---');
    await test('Dynamic page count calculation: Injecting 20 articles updates total pages to 3 without reload', async () => {
      await page.evaluate(() => {
        const twenty = Array.from({ length: 20 }, (_, i) => ({
          id: `dyn_post_${i + 1}`,
          title: `Dynamic Essay ${i + 1}`,
          status: 'published',
          category: 'Endurance',
          summary: `Summary ${i + 1}`,
          thumbnail: 'assets/hyrox-patch.jpg',
        }));
        localStorage.setItem('elrx_db_posts_v3', JSON.stringify(twenty));
        window.dispatchEvent(new CustomEvent('elrx_data_changed', { detail: { key: 'elrx_db_posts_v3' } }));
      });
      await delay(1000);

      const pageButtons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.blog-pagination-num-btn')).map(b => b.innerText.trim());
      });
      console.log('    Dynamic page buttons with 20 articles (ceil(20/9)=3):', pageButtons);
      assert.deepStrictEqual(pageButtons, ['1', '2', '3'], '20 articles must dynamically generate 3 numbered pages');
    });

    await test('Unpublishing / cleaning up articles restores original state', async () => {
      await page.evaluate(() => {
        localStorage.removeItem('elrx_db_posts_v3');
        window.dispatchEvent(new CustomEvent('elrx_data_changed', { detail: { key: 'elrx_db_posts_v3' } }));
      });
      await delay(1000);

      const cardCount = await page.evaluate(() => {
        return document.querySelectorAll('.blog-cards-grid .blog-card').length;
      });
      assert.ok(cardCount >= 1 && cardCount <= 9);
    });

    // ── TEST 5: RESPONSIVE BEHAVIOR (MOBILE VIEWPORT) ──
    console.log('\n--- 5. Responsive Behavior & No Horizontal Overflow ---');
    await test('Mobile viewport (375px) renders pagination without layout overflow', async () => {
      await page.setViewport({ width: 375, height: 700 });
      await delay(500);

      const overflowInfo = await page.evaluate(() => {
        const nav = document.querySelector('.blog-pagination-wrap');
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        return {
          navExists: Boolean(nav),
          hasOverflow: scrollWidth > docWidth + 2,
        };
      });

      assert.strictEqual(overflowInfo.navExists, true);
      assert.strictEqual(overflowInfo.hasOverflow, false, 'Mobile viewport must not produce horizontal overflow');
    });

  } finally {
    await browser.close();
  }

  console.log('\n====================================================');
  console.log(`🏁 PAGINATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runE2ETests().catch((err) => {
  console.error('Fatal E2E test error:', err);
  process.exit(1);
});
