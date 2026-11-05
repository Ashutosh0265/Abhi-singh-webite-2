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

async function runGridTests() {
  console.log('================================================================');
  console.log('🧪 HOMEPAGE 3×3 BLOG GRID & 9-ARTICLE PAGINATION E2E TEST SUITE');
  console.log('================================================================\n');

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

    // ─────────────────────────────────────────────────────────────
    // TEST 1: SCENARIO 0 PUBLISHED ARTICLES
    // ─────────────────────────────────────────────────────────────
    console.log('--- 1. Testing 0 Published Articles ---');
    await test('0 published articles displays empty state and 1 disabled page', async () => {
      await page.evaluate(() => {
        localStorage.setItem('elrx_db_posts_v3', JSON.stringify([]));
        window.dispatchEvent(new CustomEvent('elrx_data_changed', { detail: { key: 'elrx_db_posts_v3' } }));
      });
      await delay(800);

      const emptyInfo = await page.evaluate(() => {
        const emptyEl = document.querySelector('.blog-empty-state');
        const cards = document.querySelectorAll('.blog-cards-grid .blog-card');
        const prevBtn = document.querySelector('.blog-pagination-prev');
        const nextBtn = document.querySelector('.blog-pagination-next');
        const activeNum = document.querySelector('.blog-pagination-num-btn.active');
        return {
          emptyText: emptyEl ? emptyEl.innerText.trim() : null,
          cardCount: cards.length,
          prevDisabled: prevBtn ? prevBtn.disabled : false,
          nextDisabled: nextBtn ? nextBtn.disabled : false,
          activePage: activeNum ? activeNum.innerText.trim() : null,
        };
      });

      assert.strictEqual(emptyInfo.cardCount, 0, 'No cards should be rendered');
      assert.ok(emptyInfo.emptyText && emptyInfo.emptyText.includes('No published articles'), 'Empty state message should be visible');
      assert.strictEqual(emptyInfo.prevDisabled, true, 'Previous should be disabled');
      assert.strictEqual(emptyInfo.nextDisabled, true, 'Next should be disabled');
      assert.strictEqual(emptyInfo.activePage, '1', 'Page 1 should be active');
    });

    // ─────────────────────────────────────────────────────────────
    // TEST 2: SCENARIO 1–8 PUBLISHED ARTICLES
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 2. Testing 1–8 Published Articles (e.g. 7 articles) ---');
    await test('7 published articles renders 7 cards on 1 page with disabled Prev/Next', async () => {
      await page.evaluate(() => {
        const sevenPosts = Array.from({ length: 7 }, (_, i) => ({
          id: `post_7_${i + 1}`,
          title: `Article ${i + 1} of 7`,
          slug: `article-${i + 1}`,
          status: 'published',
          category: 'Framework',
          date: 'October 2026',
          readTime: '3 min read',
          summary: `Summary excerpt for article number ${i + 1}. Consistent and clear typography.`,
          thumbnail: 'assets/hyrox-mumbai.png',
        }));
        localStorage.setItem('elrx_db_posts_v3', JSON.stringify(sevenPosts));
        window.dispatchEvent(new CustomEvent('elrx_data_changed', { detail: { key: 'elrx_db_posts_v3' } }));
      });
      await delay(800);

      const pageInfo = await page.evaluate(() => {
        const cards = document.querySelectorAll('.blog-cards-grid .blog-card');
        const pages = Array.from(document.querySelectorAll('.blog-pagination-num-btn')).map(b => b.innerText.trim());
        const prevDisabled = document.querySelector('.blog-pagination-prev')?.disabled;
        const nextDisabled = document.querySelector('.blog-pagination-next')?.disabled;
        return {
          count: cards.length,
          pages,
          prevDisabled,
          nextDisabled,
        };
      });

      assert.strictEqual(pageInfo.count, 7, 'Must display exactly 7 cards');
      assert.deepStrictEqual(pageInfo.pages, ['1'], 'Must display only page 1');
      assert.strictEqual(pageInfo.prevDisabled, true, 'Prev must be disabled');
      assert.strictEqual(pageInfo.nextDisabled, true, 'Next must be disabled');
    });

    // ─────────────────────────────────────────────────────────────
    // TEST 3: SCENARIO EXACTLY 9 PUBLISHED ARTICLES (FULL 3×3 GRID)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 3. Testing Exactly 9 Published Articles (Full 3×3 Grid) ---');
    await test('Exactly 9 published articles renders a complete 3×3 grid on 1 page', async () => {
      await page.evaluate(() => {
        const ninePosts = Array.from({ length: 9 }, (_, i) => ({
          id: `post_9_${i + 1}`,
          title: `Article ${i + 1} of 9: Master Systematic Fitness`,
          slug: `article-${i + 1}`,
          status: 'published',
          category: i % 2 === 0 ? 'Framework' : 'Endurance',
          date: 'October 2026',
          readTime: `${2 + (i % 3)} min read`,
          summary: `This is an evidence-based summary for article ${i + 1}. It covers kettlebell mechanics, sustainable habits, and building lasting physical capacity.`,
          thumbnail: i % 3 === 0 ? 'assets/hyrox-mumbai.png' : i % 3 === 1 ? 'assets/hyrox-patch.jpg' : 'assets/yoddha-medal.jpg',
        }));
        localStorage.setItem('elrx_db_posts_v3', JSON.stringify(ninePosts));
        window.dispatchEvent(new CustomEvent('elrx_data_changed', { detail: { key: 'elrx_db_posts_v3' } }));
      });
      await delay(800);

      const gridInfo = await page.evaluate(() => {
        const cards = document.querySelectorAll('.blog-cards-grid .blog-card');
        const pages = Array.from(document.querySelectorAll('.blog-pagination-num-btn')).map(b => b.innerText.trim());
        const prevDisabled = document.querySelector('.blog-pagination-prev')?.disabled;
        const nextDisabled = document.querySelector('.blog-pagination-next')?.disabled;

        // Verify computed grid styles on desktop (1440px)
        const gridEl = document.querySelector('.blog-cards-grid');
        const gridComputed = window.getComputedStyle(gridEl);
        const colTracks = gridComputed.gridTemplateColumns.trim().split(/\s+/);

        return {
          count: cards.length,
          pages,
          prevDisabled,
          nextDisabled,
          colCount: colTracks.length,
        };
      });

      assert.strictEqual(gridInfo.count, 9, 'Must display exactly 9 cards');
      assert.strictEqual(gridInfo.colCount, 3, 'Desktop grid must have exactly 3 columns');
      assert.deepStrictEqual(gridInfo.pages, ['1'], 'Must show exactly 1 page');
      assert.strictEqual(gridInfo.prevDisabled, true);
      assert.strictEqual(gridInfo.nextDisabled, true);
    });

    // ─────────────────────────────────────────────────────────────
    // TEST 4: SCENARIO 10 PUBLISHED ARTICLES (OVERFLOW TO 2 PAGES)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 4. Testing 10 Published Articles (Page 1: 9 cards, Page 2: 1 card) ---');
    await test('10 articles generates 2 pages, with 9 articles on Page 1 and 1 on Page 2', async () => {
      await page.evaluate(() => {
        const tenPosts = Array.from({ length: 10 }, (_, i) => ({
          id: `post_10_${i + 1}`,
          title: `Article ${i + 1}: Compound Training Principles`,
          slug: `article-${i + 1}`,
          status: 'published',
          category: 'Habits',
          date: 'October 2026',
          readTime: '3 min read',
          summary: `Summary text for article ${i + 1} of 10.`,
          thumbnail: 'assets/hyrox-mumbai.png',
        }));
        localStorage.setItem('elrx_db_posts_v3', JSON.stringify(tenPosts));
        window.dispatchEvent(new CustomEvent('elrx_data_changed', { detail: { key: 'elrx_db_posts_v3' } }));
      });
      await delay(800);

      // Verify page 1
      const p1Info = await page.evaluate(() => {
        const cards = document.querySelectorAll('.blog-cards-grid .blog-card');
        const pages = Array.from(document.querySelectorAll('.blog-pagination-num-btn')).map(b => b.innerText.trim());
        const firstTitle = cards[0]?.querySelector('.blog-card-title')?.innerText.trim();
        const lastTitle = cards[cards.length - 1]?.querySelector('.blog-card-title')?.innerText.trim();
        return {
          cardCount: cards.length,
          pages,
          firstTitle,
          lastTitle,
          prevDisabled: document.querySelector('.blog-pagination-prev')?.disabled,
          nextDisabled: document.querySelector('.blog-pagination-next')?.disabled,
        };
      });

      assert.strictEqual(p1Info.cardCount, 9, 'Page 1 must display exactly 9 articles');
      assert.deepStrictEqual(p1Info.pages, ['1', '2'], 'Must have pages [1, 2]');
      assert.strictEqual(p1Info.prevDisabled, true);
      assert.strictEqual(p1Info.nextDisabled, false);
      assert.ok(p1Info.firstTitle.includes('Article 1:'));
      assert.ok(p1Info.lastTitle.includes('Article 9:'));

      // Click page 2
      await page.evaluate(() => {
        const p2Btn = Array.from(document.querySelectorAll('.blog-pagination-num-btn')).find(b => b.innerText.trim() === '2');
        if (p2Btn) p2Btn.click();
      });
      await delay(600);

      // Verify page 2
      const p2Info = await page.evaluate(() => {
        const cards = document.querySelectorAll('.blog-cards-grid .blog-card');
        const activeText = document.querySelector('.blog-pagination-num-btn.active')?.innerText.trim();
        const singleTitle = cards[0]?.querySelector('.blog-card-title')?.innerText.trim();
        return {
          cardCount: cards.length,
          activeText,
          singleTitle,
          prevDisabled: document.querySelector('.blog-pagination-prev')?.disabled,
          nextDisabled: document.querySelector('.blog-pagination-next')?.disabled,
        };
      });

      assert.strictEqual(p2Info.cardCount, 1, 'Page 2 must display exactly 1 article');
      assert.strictEqual(p2Info.activeText, '2');
      assert.ok(p2Info.singleTitle.includes('Article 10:'));
      assert.strictEqual(p2Info.prevDisabled, false);
      assert.strictEqual(p2Info.nextDisabled, true);
    });

    // ─────────────────────────────────────────────────────────────
    // TEST 5: SCENARIO 18 PUBLISHED ARTICLES (EXACTLY 2 FULL PAGES)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 5. Testing 18 Published Articles (2 Full 9-Card Pages) ---');
    await test('18 articles generates exactly 2 full 9-article pages with zero duplicates', async () => {
      await page.evaluate(() => {
        const eighteenPosts = Array.from({ length: 18 }, (_, i) => ({
          id: `post_18_${i + 1}`,
          title: `Article ${i + 1}: Systematic Progression Blueprint`,
          slug: `article-${i + 1}`,
          status: 'published',
          category: 'Endurance',
          date: 'October 2026',
          readTime: '4 min read',
          summary: `Summary of article ${i + 1}.`,
          thumbnail: 'assets/yoddha-medal.jpg',
        }));
        localStorage.setItem('elrx_db_posts_v3', JSON.stringify(eighteenPosts));
        window.dispatchEvent(new CustomEvent('elrx_data_changed', { detail: { key: 'elrx_db_posts_v3' } }));
      });
      await delay(800);

      // Navigate to page 1
      await page.evaluate(() => {
        const p1Btn = Array.from(document.querySelectorAll('.blog-pagination-num-btn')).find(b => b.innerText.trim() === '1');
        if (p1Btn) p1Btn.click();
      });
      await delay(600);

      const p1Titles = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.blog-card-title')).map(el => el.innerText.trim());
      });
      assert.strictEqual(p1Titles.length, 9, 'Page 1 must have 9 articles');

      // Navigate to page 2 via Next button
      await page.evaluate(() => {
        const nextBtn = document.querySelector('.blog-pagination-next');
        if (nextBtn) nextBtn.click();
      });
      await delay(600);

      const p2Titles = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.blog-card-title')).map(el => el.innerText.trim());
      });
      assert.strictEqual(p2Titles.length, 9, 'Page 2 must have 9 articles');

      // Verify no duplicates
      const allTitles = [...p1Titles, ...p2Titles];
      const uniqueTitles = new Set(allTitles);
      assert.strictEqual(allTitles.length, 18);
      assert.strictEqual(uniqueTitles.size, 18, 'All 18 articles must be distinct');
    });

    // ─────────────────────────────────────────────────────────────
    // TEST 6: SCENARIO 50 PUBLISHED ARTICLES (6 PAGES)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 6. Testing 50 Published Articles (6 Pages: 5 Full + 5 on Last) ---');
    await test('50 articles creates 6 pages, correctly navigates pages 1, 2, 3, and 6', async () => {
      await page.evaluate(() => {
        const fiftyPosts = Array.from({ length: 50 }, (_, i) => ({
          id: `post_50_${i + 1}`,
          title: `Article ${i + 1}: Long Game Fitness Strategy`,
          slug: `article-${i + 1}`,
          status: 'published',
          category: i % 2 === 0 ? 'Framework' : 'Habits',
          date: 'October 2026',
          readTime: '3 min read',
          summary: `Summary of article ${i + 1} of 50.`,
          thumbnail: 'assets/hyrox-mumbai.png',
        }));
        localStorage.setItem('elrx_db_posts_v3', JSON.stringify(fiftyPosts));
        window.dispatchEvent(new CustomEvent('elrx_data_changed', { detail: { key: 'elrx_db_posts_v3' } }));
      });
      await delay(800);

      // Verify Page 1
      await page.evaluate(() => {
        const p1Btn = Array.from(document.querySelectorAll('.blog-pagination-num-btn')).find(b => b.innerText.trim() === '1');
        if (p1Btn) p1Btn.click();
      });
      await delay(600);

      const p1State = await page.evaluate(() => {
        const cards = document.querySelectorAll('.blog-cards-grid .blog-card');
        const pages = Array.from(document.querySelectorAll('.blog-pagination-num-btn')).map(b => b.innerText.trim());
        const first = cards[0]?.querySelector('.blog-card-title')?.innerText.trim();
        const last = cards[cards.length - 1]?.querySelector('.blog-card-title')?.innerText.trim();
        return { count: cards.length, pages, first, last };
      });
      assert.strictEqual(p1State.count, 9);
      assert.deepStrictEqual(p1State.pages, ['1', '2', '3', '4', '5', '6']);
      assert.ok(p1State.first.includes('Article 1:'));
      assert.ok(p1State.last.includes('Article 9:'));

      // Navigate to Page 2
      await page.evaluate(() => {
        const p2Btn = Array.from(document.querySelectorAll('.blog-pagination-num-btn')).find(b => b.innerText.trim() === '2');
        if (p2Btn) p2Btn.click();
      });
      await delay(600);

      const p2State = await page.evaluate(() => {
        const cards = document.querySelectorAll('.blog-cards-grid .blog-card');
        const first = cards[0]?.querySelector('.blog-card-title')?.innerText.trim();
        const last = cards[cards.length - 1]?.querySelector('.blog-card-title')?.innerText.trim();
        return { count: cards.length, first, last };
      });
      assert.strictEqual(p2State.count, 9);
      assert.ok(p2State.first.includes('Article 10:'));
      assert.ok(p2State.last.includes('Article 18:'));

      // Navigate to Page 3
      await page.evaluate(() => {
        const p3Btn = Array.from(document.querySelectorAll('.blog-pagination-num-btn')).find(b => b.innerText.trim() === '3');
        if (p3Btn) p3Btn.click();
      });
      await delay(600);

      const p3State = await page.evaluate(() => {
        const cards = document.querySelectorAll('.blog-cards-grid .blog-card');
        const first = cards[0]?.querySelector('.blog-card-title')?.innerText.trim();
        const last = cards[cards.length - 1]?.querySelector('.blog-card-title')?.innerText.trim();
        return { count: cards.length, first, last };
      });
      assert.strictEqual(p3State.count, 9);
      assert.ok(p3State.first.includes('Article 19:'));
      assert.ok(p3State.last.includes('Article 27:'));

      // Navigate to Page 6 (final page)
      await page.evaluate(() => {
        const p6Btn = Array.from(document.querySelectorAll('.blog-pagination-num-btn')).find(b => b.innerText.trim() === '6');
        if (p6Btn) p6Btn.click();
      });
      await delay(600);

      const p6State = await page.evaluate(() => {
        const cards = document.querySelectorAll('.blog-cards-grid .blog-card');
        const first = cards[0]?.querySelector('.blog-card-title')?.innerText.trim();
        const last = cards[cards.length - 1]?.querySelector('.blog-card-title')?.innerText.trim();
        const nextDisabled = document.querySelector('.blog-pagination-next')?.disabled;
        const prevDisabled = document.querySelector('.blog-pagination-prev')?.disabled;
        return { count: cards.length, first, last, nextDisabled, prevDisabled };
      });
      assert.strictEqual(p6State.count, 5, 'Page 6 of 50 items must have exactly 5 articles');
      assert.ok(p6State.first.includes('Article 46:'));
      assert.ok(p6State.last.includes('Article 50:'));
      assert.strictEqual(p6State.nextDisabled, true, 'Next must be disabled on page 6');
      assert.strictEqual(p6State.prevDisabled, false, 'Previous must be enabled on page 6');
    });

    // ─────────────────────────────────────────────────────────────
    // TEST 7: CARD DETAILS & ALIGNMENT VERIFICATION
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 7. Card Design, Alignment & Media Cropping ---');
    await test('Cards have object-fit cover, readable metadata, and aligned action links', async () => {
      // Return to page 1 of 50 articles
      await page.evaluate(() => {
        const p1Btn = Array.from(document.querySelectorAll('.blog-pagination-num-btn')).find(b => b.innerText.trim() === '1');
        if (p1Btn) p1Btn.click();
      });
      await delay(600);

      const cardDetails = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.blog-cards-grid .blog-card'));
        return cards.map(c => {
          const img = c.querySelector('.blog-card-img');
          const badge = c.querySelector('.blog-card-category-badge');
          const meta = c.querySelector('.blog-card-meta-line');
          const title = c.querySelector('.blog-card-title');
          const summary = c.querySelector('.blog-card-summary');
          const action = c.querySelector('.blog-card-action');
          const imgStyle = window.getComputedStyle(img);
          const cRect = c.getBoundingClientRect();
          const actionRect = action.getBoundingClientRect();
          return {
            hasBadge: Boolean(badge && badge.innerText.trim()),
            hasMeta: Boolean(meta && meta.innerText.trim()),
            hasTitle: Boolean(title && title.innerText.trim()),
            hasSummary: Boolean(summary && summary.innerText.trim()),
            objectFit: imgStyle.objectFit,
            cardHeight: Math.round(cRect.height),
            actionBottomOffset: Math.round(cRect.bottom - actionRect.bottom),
          };
        });
      });

      assert.strictEqual(cardDetails.length, 9);
      for (const cd of cardDetails) {
        assert.strictEqual(cd.hasBadge, true);
        assert.strictEqual(cd.hasMeta, true);
        assert.strictEqual(cd.hasTitle, true);
        assert.strictEqual(cd.hasSummary, true);
        assert.strictEqual(cd.objectFit, 'cover', 'Card image must use object-fit: cover');
        // Check that bottom action link is flush to bottom within card padding
        assert.ok(cd.actionBottomOffset <= 24, 'Action link must be aligned to bottom of card');
      }
    });

    // ─────────────────────────────────────────────────────────────
    // TEST 8: MULTI-VIEWPORT RESPONSIVE LAYOUT VERIFICATION
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 8. Responsive Layouts: Desktop (3 col), Tablet (2 col), Mobile (1 col) ---');
    
    // 1. Desktop (1440px)
    await page.setViewport({ width: 1440, height: 900 });
    await delay(500);
    const desktopCols = await page.evaluate(() => {
      const grid = document.querySelector('.blog-cards-grid');
      return window.getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length;
    });
    assert.strictEqual(desktopCols, 3, 'Desktop (1440px) must have 3 columns');
    const desktopScreenshot = path.join(ARTIFACT_DIR, 'verified_blog_3x3_grid_desktop.png');
    await page.screenshot({ path: desktopScreenshot });
    console.log('    ✓ Desktop screenshot saved:', desktopScreenshot);

    // 2. Tablet (820px)
    await page.setViewport({ width: 820, height: 1024 });
    await delay(500);
    const tabletCols = await page.evaluate(() => {
      const grid = document.querySelector('.blog-cards-grid');
      return window.getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length;
    });
    assert.strictEqual(tabletCols, 2, 'Tablet (820px) must have 2 columns');
    const tabletScreenshot = path.join(ARTIFACT_DIR, 'verified_blog_3x3_grid_tablet.png');
    await page.screenshot({ path: tabletScreenshot });
    console.log('    ✓ Tablet screenshot saved:', tabletScreenshot);

    // 3. Mobile (375px)
    await page.setViewport({ width: 375, height: 800 });
    await delay(500);
    const mobileInfo = await page.evaluate(() => {
      const grid = document.querySelector('.blog-cards-grid');
      const cols = window.getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length;
      const docW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      return {
        cols,
        hasOverflow: scrollW > docW + 2,
      };
    });
    assert.strictEqual(mobileInfo.cols, 1, 'Mobile (375px) must have 1 column');
    assert.strictEqual(mobileInfo.hasOverflow, false, 'Mobile must have zero horizontal overflow');
    const mobileScreenshot = path.join(ARTIFACT_DIR, 'verified_blog_3x3_grid_mobile.png');
    await page.screenshot({ path: mobileScreenshot });
    console.log('    ✓ Mobile screenshot saved:', mobileScreenshot);

    // ── CLEANUP: RESTORE CMS LOCAL STORAGE ──
    await page.evaluate(() => {
      localStorage.removeItem('elrx_db_posts_v3');
      window.dispatchEvent(new CustomEvent('elrx_data_changed', { detail: { key: 'elrx_db_posts_v3' } }));
    });
    await delay(600);

  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log(`🏁 3×3 GRID E2E RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runGridTests().catch((err) => {
  console.error('Fatal 3x3 Grid E2E test error:', err);
  process.exit(1);
});

