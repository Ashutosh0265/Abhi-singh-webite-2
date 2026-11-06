const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'https://abhisingh-website.vercel.app';
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

    // ── TEST 2: INITIAL PAGE 1 STATE & ARTICLE GRID (4 ARTICLES) ──
    console.log('\n--- 2. Initial Page 1 State & Desktop Grid Slicing ---');
    await test('Page 1 displays exactly 4 articles on desktop', async () => {
      const cardCount = await page.evaluate(() => {
        return document.querySelectorAll('.blog-cards-grid .blog-card').length;
      });
      assert.strictEqual(cardCount, 4, 'Desktop Page 1 must display exactly 4 articles');
    });

    await test('Page 1 button is active, Previous is disabled, Next is enabled', async () => {
      const state = await page.evaluate(() => {
        const prevBtn = document.querySelector('.blog-pagination-prev');
        const nextBtn = document.querySelector('.blog-pagination-next');
        const activeNum = document.querySelector('.blog-pagination-num-btn.active');
        return {
          prevDisabled: prevBtn ? prevBtn.disabled : null,
          nextDisabled: nextBtn ? nextBtn.disabled : null,
          activeText: activeNum ? activeNum.innerText.trim() : null,
        };
      });
      assert.strictEqual(state.prevDisabled, true, 'Previous button must be disabled on page 1');
      assert.strictEqual(state.nextDisabled, false, 'Next button must be enabled when page 2 exists');
      assert.strictEqual(state.activeText, '1', 'Page 1 button must be marked active');
    });

    // Save page 1 titles for comparison
    const page1Titles = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.blog-card-title')).map(el => el.innerText.trim());
    });
    console.log('    Page 1 articles displayed:', page1Titles);

    // ── TEST 3: PAGE NAVIGATION & CARD REPLACEMENT (NO RELOAD) ──
    console.log('\n--- 3. Page Switching & Card Replacement ---');
    await test('Clicking page 2 button replaces displayed articles with page 2 content', async () => {
      // Click page 2
      await page.evaluate(() => {
        const page2Btn = Array.from(document.querySelectorAll('.blog-pagination-num-btn')).find(b => b.innerText.trim() === '2');
        if (page2Btn) page2Btn.click();
      });
      await delay(600);

      const page2Titles = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.blog-card-title')).map(el => el.innerText.trim());
      });
      console.log('    Page 2 articles displayed:', page2Titles);

      assert.ok(page2Titles.length >= 1 && page2Titles.length <= 4, 'Page 2 should display 1-4 articles');
      // Verify no articles from page 1 overlap
      const overlap = page2Titles.some(t => page1Titles.includes(t));
      assert.strictEqual(overlap, false, 'Page 2 articles must not duplicate or overlap with page 1 articles');

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
    });

    await test('Clicking Previous button returns to page 1 and restores page 1 articles', async () => {
      await page.evaluate(() => {
        const prevBtn = document.querySelector('.blog-pagination-prev');
        if (prevBtn) prevBtn.click();
      });
      await delay(600);

      const restoredTitles = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.blog-card-title')).map(el => el.innerText.trim());
      });

      assert.deepStrictEqual(restoredTitles, page1Titles, 'Page 1 articles must be accurately restored');
      const activeText = await page.evaluate(() => document.querySelector('.blog-pagination-num-btn.active')?.innerText.trim());
      assert.strictEqual(activeText, '1');
    });

    await test('Clicking Next button navigates forward to page 2', async () => {
      await page.evaluate(() => {
        const nextBtn = document.querySelector('.blog-pagination-next');
        if (nextBtn) nextBtn.click();
      });
      await delay(600);

      const activeText = await page.evaluate(() => document.querySelector('.blog-pagination-num-btn.active')?.innerText.trim());
      assert.strictEqual(activeText, '2');

      // Return to page 1
      await page.evaluate(() => {
        const page1Btn = Array.from(document.querySelectorAll('.blog-pagination-num-btn')).find(b => b.innerText.trim() === '1');
        if (page1Btn) page1Btn.click();
      });
      await delay(400);
    });

    // ── TEST 4: CMS DYNAMIC SYNCHRONIZATION ──
    console.log('\n--- 4. Live CMS Dynamic Synchronization ---');
    await test('Dynamic page count calculation: Injecting articles updates total pages to 3 without reload', async () => {
      await page.evaluate(() => {
        const current = JSON.parse(localStorage.getItem('elrx_db_posts_v3') || '[]');
        // Add 4 more articles to push total to 9 (requires 3 pages: 4 + 4 + 1)
        const extras = [
          { id: 'post_extra_1', title: 'Extra Essay 1', status: 'published', category: 'Framework', summary: 'Summary 1', thumbnail: 'assets/hyrox-mumbai.png' },
          { id: 'post_extra_2', title: 'Extra Essay 2', status: 'published', category: 'Nutrition', summary: 'Summary 2', thumbnail: 'assets/hyrox-patch.jpg' },
          { id: 'post_extra_3', title: 'Extra Essay 3', status: 'published', category: 'Kettlebells', summary: 'Summary 3', thumbnail: 'assets/yoddha-medal.jpg' },
          { id: 'post_extra_4', title: 'Extra Essay 4', status: 'published', category: 'Endurance', summary: 'Summary 4', thumbnail: 'assets/ace-certificate.jpg' },
        ];
        // Combine with existing initial articles
        const base = current.length > 0 ? current : [
          { id: 'ed-5', title: 'Essay 5', status: 'published', category: 'Framework', summary: 'S5', thumbnail: 'assets/hyrox-mumbai.png' },
          { id: 'ed-4', title: 'Essay 4', status: 'published', category: 'Framework', summary: 'S4', thumbnail: 'assets/hyrox-mumbai.png' },
          { id: 'ed-3', title: 'Essay 3', status: 'published', category: 'Framework', summary: 'S3', thumbnail: 'assets/hyrox-mumbai.png' },
          { id: 'ed-2', title: 'Essay 2', status: 'published', category: 'Framework', summary: 'S2', thumbnail: 'assets/hyrox-mumbai.png' },
          { id: 'ed-1', title: 'Essay 1', status: 'published', category: 'Framework', summary: 'S1', thumbnail: 'assets/hyrox-mumbai.png' },
        ];
        localStorage.setItem('elrx_db_posts_v3', JSON.stringify([...base, ...extras]));
        window.dispatchEvent(new CustomEvent('elrx_data_changed', { detail: { key: 'elrx_db_posts_v3' } }));
      });
      await delay(1200);

      const pageButtons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.blog-pagination-num-btn')).map(b => b.innerText.trim());
      });
      console.log('    Dynamic page buttons with 9 articles:', pageButtons);
      assert.deepStrictEqual(pageButtons, ['1', '2', '3'], '9 articles must dynamically generate 3 numbered pages');
    });

    await test('Navigate to page 3 and verify content', async () => {
      await page.evaluate(() => {
        const page3Btn = Array.from(document.querySelectorAll('.blog-pagination-num-btn')).find(b => b.innerText.trim() === '3');
        if (page3Btn) page3Btn.click();
      });
      await delay(600);

      const activeText = await page.evaluate(() => document.querySelector('.blog-pagination-num-btn.active')?.innerText.trim());
      assert.strictEqual(activeText, '3');

      const nextDisabled = await page.evaluate(() => document.querySelector('.blog-pagination-next')?.disabled);
      assert.strictEqual(nextDisabled, true, 'Next must be disabled on page 3');
    });

    await test('Unpublishing / cleaning up articles recalculates pages dynamically', async () => {
      await page.evaluate(() => {
        localStorage.removeItem('elrx_db_posts_v3');
        window.dispatchEvent(new CustomEvent('elrx_data_changed', { detail: { key: 'elrx_db_posts_v3' } }));
      });
      await delay(1200);

      const pageButtons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.blog-pagination-num-btn')).map(b => b.innerText.trim());
      });
      console.log('    Restored initial page buttons:', pageButtons);
      assert.deepStrictEqual(pageButtons, ['1', '2']);
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

    // ── TEST 6: VISUAL VERIFICATION SCREENSHOT ──
    console.log('\n--- 6. Visual Evidence Screenshot ---');
    await page.setViewport({ width: 1440, height: 900 });
    await delay(600);

    const screenshotPath = path.join(ARTIFACT_DIR, 'verified_homepage_numbered_pagination.png');
    // Scroll to blog section to capture
    await page.evaluate(() => {
      const blog = document.getElementById('blog');
      if (blog) blog.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await delay(800);
    await page.screenshot({ path: screenshotPath });
    console.log('  ✓ Screenshot saved:', screenshotPath);

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
