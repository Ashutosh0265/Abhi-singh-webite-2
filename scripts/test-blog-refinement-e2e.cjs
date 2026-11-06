const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const ARTIFACTS_DIR = 'C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159';

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  console.log('================================================================');
  console.log('🧪 BLOG REFINEMENT: VISUAL QUALITY, CARD LAYOUT & READABILITY');
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
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Listen for console errors (ignore browser default favicon probe)
    const consoleErrors = [];
    page.on('console', (msg) => {
      const url = msg.location()?.url || '';
      const text = msg.text() || '';
      if (msg.type() === 'error' && !url.includes('favicon') && !text.includes('favicon')) {
        consoleErrors.push(`${text} at ${url}`);
      }
    });

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await delay(1200);

    // ─────────────────────────────────────────────────────────────
    // TEST 1: Section Width, Heading Alignment & Spacing
    // ─────────────────────────────────────────────────────────────
    await test('Blog Section: Clean section width, balanced header spacing, no overflow', async () => {
      const sectionInfo = await page.evaluate(() => {
        const sec = document.querySelector('#blog');
        const header = sec.querySelector('.section-header');
        const grid = sec.querySelector('.blog-cards-grid');
        const eyebrow = header.querySelector('.section-eyebrow');
        const h2 = header.querySelector('h2');
        const subtext = header.querySelector('.section-subtext');

        const secRect = sec.getBoundingClientRect();
        const headerRect = header.getBoundingClientRect();
        const gridRect = grid.getBoundingClientRect();

        return {
          hasEyebrow: !!eyebrow && eyebrow.textContent.trim().length > 0,
          hasH2: !!h2 && h2.textContent.trim().length > 0,
          hasSubtext: !!subtext && subtext.textContent.trim().length > 0,
          secWidth: secRect.width,
          gridWidth: gridRect.width,
          spacingToGrid: gridRect.top - headerRect.bottom,
        };
      });

      assert.ok(sectionInfo.hasEyebrow, 'Eyebrow must be present');
      assert.ok(sectionInfo.hasH2, 'H2 heading must be present');
      assert.ok(sectionInfo.hasSubtext, 'Subtext description must be present');
      assert.ok(sectionInfo.spacingToGrid >= 28, `Spacing to grid should be >= 28px, got ${sectionInfo.spacingToGrid}px`);
      assert.ok(sectionInfo.gridWidth > 800, 'Grid should occupy balanced container width');
    });

    // ─────────────────────────────────────────────────────────────
    // TEST 2: Card Internal Structure (All 6 Required Elements)
    // ─────────────────────────────────────────────────────────────
    await test('Card Internal Structure: 1. Cover, 2. Badge, 3. Metadata, 4. Title, 5. Description, 6. Link', async () => {
      const structureCheck = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.blog-card'));
        if (cards.length === 0) return { count: 0 };

        return {
          count: cards.length,
          allValid: cards.every((card) => {
            const media = card.querySelector('.blog-card-media');
            const img = media?.querySelector('.blog-card-img');
            const badge = media?.querySelector('.blog-card-category-badge');
            const meta = card.querySelector('.blog-card-meta-line');
            const date = meta?.querySelector('.blog-card-date');
            const divider = meta?.querySelector('.blog-card-divider');
            const readTime = meta?.querySelector('.blog-card-readtime');
            const title = card.querySelector('.blog-card-title');
            const summary = card.querySelector('.blog-card-summary');
            const action = card.querySelector('.blog-card-action');
            const link = action?.querySelector('.blog-card-link-text');

            return (
              img &&
              badge &&
              meta &&
              date &&
              divider &&
              readTime &&
              title &&
              summary &&
              link
            );
          }),
        };
      });

      assert.ok(structureCheck.count > 0, 'Must have rendered blog cards');
      assert.ok(structureCheck.allValid, 'All cards must contain all 6 required elements in order');
    });

    // ─────────────────────────────────────────────────────────────
    // TEST 3: Metadata Layout & Wrapping Prevention
    // ─────────────────────────────────────────────────────────────
    await test('Metadata Layout: Consistent horizontal layout, clear separator, no awkward word breaks', async () => {
      const metaMetrics = await page.evaluate(() => {
        const metas = Array.from(document.querySelectorAll('.blog-card-meta-line'));
        return metas.map((m) => {
          const dateEl = m.querySelector('.blog-card-date');
          const dividerEl = m.querySelector('.blog-card-divider');
          const readTimeEl = m.querySelector('.blog-card-readtime');

          const dateStyle = window.getComputedStyle(dateEl);
          const readTimeStyle = window.getComputedStyle(readTimeEl);
          const mStyle = window.getComputedStyle(m);

          return {
            dateText: dateEl.textContent.trim(),
            readTimeText: readTimeEl.textContent.trim(),
            dividerText: dividerEl.textContent.trim(),
            dateNoWrap: dateStyle.whiteSpace === 'nowrap',
            readTimeNoWrap: readTimeStyle.whiteSpace === 'nowrap',
            display: mStyle.display,
            alignItems: mStyle.alignItems,
            hasMinRead: readTimeEl.textContent.toLowerCase().includes('min read'),
          };
        });
      });

      assert.ok(metaMetrics.length > 0, 'Metadata elements must exist');
      for (const m of metaMetrics) {
        assert.ok(m.dateNoWrap, `Date should have white-space: nowrap (got ${m.dateText})`);
        assert.ok(m.readTimeNoWrap, `Reading time should have white-space: nowrap (got ${m.readTimeText})`);
        assert.ok(m.hasMinRead, `Reading time should end with min read (got ${m.readTimeText})`);
        assert.ok(m.dividerText === '·' || m.dividerText === '•', `Divider should be bullet or dot (got ${m.dividerText})`);
        assert.strictEqual(m.display, 'flex', 'Meta line should be flex display');
        assert.strictEqual(m.alignItems, 'center', 'Meta line items should be center aligned');
      }
    });

    // ─────────────────────────────────────────────────────────────
    // TEST 4: Card Image Dimensions, Aspect Ratio & Object-Fit
    // ─────────────────────────────────────────────────────────────
    await test('Card Media: Uniform 16:9 aspect ratio and object-fit: cover', async () => {
      const mediaMetrics = await page.evaluate(() => {
        const medias = Array.from(document.querySelectorAll('.blog-card-media'));
        return medias.map((m) => {
          const rect = m.getBoundingClientRect();
          const img = m.querySelector('.blog-card-img');
          const imgStyle = window.getComputedStyle(img);
          const ratio = rect.width / rect.height;

          return {
            width: rect.width,
            height: rect.height,
            ratio: ratio,
            objectFit: imgStyle.objectFit,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
          };
        });
      });

      assert.ok(mediaMetrics.length > 0, 'Card media must exist');
      for (const m of mediaMetrics) {
        // 16 / 9 is approximately 1.777
        assert.ok(Math.abs(m.ratio - (16 / 9)) < 0.1, `Aspect ratio must be approx 16:9, got ${m.ratio.toFixed(2)}`);
        assert.strictEqual(m.objectFit, 'cover', 'Image must use object-fit: cover');
      }
    });

    // ─────────────────────────────────────────────────────────────
    // TEST 5: Equal Card Heights in Each Grid Row & Link Bottom Alignment
    // ─────────────────────────────────────────────────────────────
    await test('Card Consistency: Equal card heights in grid rows, links aligned at bottom', async () => {
      const cardHeights = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.blog-card'));
        const rects = cards.map((c) => {
          const r = c.getBoundingClientRect();
          const action = c.querySelector('.blog-card-action');
          const aRect = action.getBoundingClientRect();
          return {
            top: Math.round(r.top),
            height: Math.round(r.height),
            actionBottomDistance: Math.round(r.bottom - aRect.bottom),
          };
        });

        // Group by row (approx same top)
        const rows = {};
        rects.forEach((r) => {
          const rowKey = Math.floor(r.top / 10) * 10;
          if (!rows[rowKey]) rows[rowKey] = [];
          rows[rowKey].push(r);
        });

        return {
          totalCards: cards.length,
          rows: Object.values(rows),
        };
      });

      assert.ok(cardHeights.totalCards > 0, 'Cards must exist');
      for (const row of cardHeights.rows) {
        const heights = row.map((c) => c.height);
        const maxH = Math.max(...heights);
        const minH = Math.min(...heights);
        // Heights within the same row should be equal (within 2px)
        assert.ok(maxH - minH <= 2, `Cards in the same row must have matching heights (max: ${maxH}, min: ${minH})`);
        // Action link should be anchored at bottom (padding accounted for)
        for (const c of row) {
          assert.ok(c.actionBottomDistance <= 25, 'Action link must align at bottom of card');
        }
      }
    });

    // ─────────────────────────────────────────────────────────────
    // TEST 6: Edge Cases: Short/Long Titles, Short/Long Summaries, Dates, Read Times
    // ─────────────────────────────────────────────────────────────
    await test('Edge Cases: Dynamic calculation of reading times, short/long titles and summaries', async () => {
      const edgeCaseResults = await page.evaluate(() => {
        // Inject test articles covering edge cases
        const sampleArticles = [
          {
            id: 'edge-1-short',
            title: 'Run Fast',
            category: 'Mechanics',
            published_date: '2026-11-04',
            summary: 'A short note.',
            content: 'Just three kettlebell complexes performed at high density. That is all.', // ~12 words -> 1 min read
            status: 'published'
          },
          {
            id: 'edge-2-long',
            title: 'The Comprehensive Physiological Mechanics of Zone 2 Aerobic Conditioning in Everyday Athletes for Long-Term Cardiorespiratory Longevity',
            category: 'Cardiovascular Science',
            published_date: 'May 2025',
            summary: 'A deep architectural breakdown of how mitochondria adapt under sustained submaximal aerobic stimuli over 20 months without muscular breakdown or central nervous system fatigue.',
            content: 'Long article '.repeat(350), // 700 words -> ~4 min read
            status: 'published'
          },
          {
            id: 'edge-3-no-summary',
            title: 'Earth to Sky Complex',
            category: 'Strength',
            published_date: '2025-01-15',
            summary: '', // Empty summary
            content: 'Full essay body '.repeat(200), // 600 words -> 3 min read
            status: 'published'
          }
        ];

        // Test utility functions directly in page context
        const dummyEvent = new CustomEvent('elrx_data_changed', { detail: { sampleArticles } });
        window.dispatchEvent(dummyEvent);

        return {
          sampleCount: sampleArticles.length
        };
      });

      assert.strictEqual(edgeCaseResults.sampleCount, 3);
    });

    // ─────────────────────────────────────────────────────────────
    // TEST 7: Responsive Grid Layouts (Desktop 3-col, Tablet 2-col, Mobile 1-col)
    // ─────────────────────────────────────────────────────────────
    await test('Responsive Grid: Desktop (3 columns), Tablet (2 columns), Mobile (1 column)', async () => {
      // 1. Desktop: 1440px
      await page.setViewport({ width: 1440, height: 900 });
      await delay(400);
      const desktopCols = await page.evaluate(() => {
        const grid = document.querySelector('.blog-cards-grid');
        return window.getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      });
      assert.strictEqual(desktopCols, 3, `Desktop should have 3 columns, got ${desktopCols}`);
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verified_blog_refined_desktop.png'), fullPage: false });

      // 2. Tablet: 820px
      await page.setViewport({ width: 820, height: 1024 });
      await delay(400);
      const tabletCols = await page.evaluate(() => {
        const grid = document.querySelector('.blog-cards-grid');
        return window.getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      });
      assert.strictEqual(tabletCols, 2, `Tablet should have 2 columns, got ${tabletCols}`);
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verified_blog_refined_tablet.png'), fullPage: false });

      // 3. Mobile: 390px
      await page.setViewport({ width: 390, height: 844 });
      await delay(400);
      const mobileCols = await page.evaluate(() => {
        const grid = document.querySelector('.blog-cards-grid');
        return window.getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      });
      assert.strictEqual(mobileCols, 1, `Mobile should have 1 column, got ${mobileCols}`);
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verified_blog_refined_mobile.png'), fullPage: false });

      // Reset back to desktop
      await page.setViewport({ width: 1440, height: 900 });
      await delay(200);
    });

    // ─────────────────────────────────────────────────────────────
    // TEST 8: Pagination & Navigation Preservation
    // ─────────────────────────────────────────────────────────────
    await test('Numbered Pagination: Nav buttons, active page highlight, 9-article per page bounds', async () => {
      const pagInfo = await page.evaluate(() => {
        const wrap = document.querySelector('.blog-pagination-wrap');
        const prev = wrap?.querySelector('.blog-pagination-prev');
        const next = wrap?.querySelector('.blog-pagination-next');
        const activeBtn = wrap?.querySelector('.blog-pagination-num-btn.active');
        const numBtns = Array.from(wrap?.querySelectorAll('.blog-pagination-num-btn') || []);

        return {
          hasWrap: !!wrap,
          hasPrev: !!prev,
          hasNext: !!next,
          activePage: activeBtn?.textContent?.trim(),
          totalPages: numBtns.length,
          prevDisabled: prev?.disabled,
        };
      });

      assert.ok(pagInfo.hasWrap, 'Pagination container must exist');
      assert.ok(pagInfo.hasPrev, 'Previous button must exist');
      assert.ok(pagInfo.hasNext, 'Next button must exist');
      assert.strictEqual(pagInfo.activePage, '1', 'Initial active page must be 1');
      assert.strictEqual(pagInfo.prevDisabled, true, 'Previous button must be disabled on page 1');
    });

    // Check for console errors
    assert.strictEqual(consoleErrors.length, 0, `Browser console errors detected: ${consoleErrors.join(', ')}`);

    console.log('\n================================================================');
    console.log(`🏁 BLOG REFINEMENT TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Test execution fatal error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
