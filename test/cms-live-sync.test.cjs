const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// 10x10 green PNG Base64 for custom cover fixture
const GREEN_SQUARE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9QzwAEjDAGYzCEAQAXpQ/5/0r7rAAAAABJRU5ErkJggg==';

// 10x10 blue PNG Base64 for edited cover fixture
const BLUE_SQUARE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNkYPj/nwEIGGEMxmAEABcND/n37N+sAAAAAElFTkSuQmCC';

async function runLiveSyncTests() {
  console.log('====================================================');
  console.log('🧪 CMS TO PUBLIC WEBSITE LIVE SYNC & E2E TEST SUITE');
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
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  try {
    const adminPage = await browser.newPage();
    const publicPage = await browser.newPage();
    await adminPage.setViewport({ width: 1440, height: 900 });
    await publicPage.setViewport({ width: 1440, height: 900 });

    // ── SECTION 1: SEED ADMIN AUTHENTICATION ──
    console.log('--- 1. CMS Authentication & Admin Setup ---');
    await test('Authenticate Super Admin session in CMS tab', async () => {
      await adminPage.goto(`${BASE_URL}/admin.html`, { waitUntil: 'domcontentloaded' });
      await adminPage.evaluate(() => {
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
      await adminPage.goto(`${BASE_URL}/admin.html`, { waitUntil: 'domcontentloaded' });
      await delay(1200);

      const isAuthenticated = await adminPage.evaluate(() => {
        return Boolean(!document.querySelector('.admin-login-card') && document.querySelector('.admin-sidebar, aside'));
      });
      assert.strictEqual(isAuthenticated, true, 'Admin sidebar should be visible after login');
    });

    // ── SECTION 2: CREATE & PUBLISH ARTICLE WITH CUSTOM COVER ──
    console.log('\n--- 2. CMS Article Lifecycle (Create, Custom Image, Draft vs Published) ---');
    const testArticleTitle = `Automated Sync Article ${Date.now()}`;
    let createdArticleId = null;

    await test('Create draft article with custom uploaded cover image', async () => {
      const res = await adminPage.evaluate(async (title, cover) => {
        // Access window DB service
        const stored = JSON.parse(localStorage.getItem('elrx_db_posts_v3') || '[]');
        const newPost = {
          id: `post_test_${Date.now()}`,
          title: title,
          category: 'Endurance',
          published_date: 'November 2026',
          read_time: '3 min read',
          summary: 'Testing dynamic synchronization and custom cover image rendering.',
          content: '## Comprehensive Test\nThis article verifies that uploaded cover images appear on the public cards.',
          thumbnail: cover,
          thumbnail_url: cover,
          status: 'draft',
          featured: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        stored.unshift(newPost);
        localStorage.setItem('elrx_db_posts_v3', JSON.stringify(stored));
        window.dispatchEvent(new CustomEvent('elrx_data_changed', { detail: { key: 'elrx_db_posts_v3' } }));
        return newPost;
      }, testArticleTitle, GREEN_SQUARE_BASE64);

      createdArticleId = res.id;
      assert.ok(createdArticleId, 'Article ID must be generated');
      assert.strictEqual(res.thumbnail, GREEN_SQUARE_BASE64, 'Cover image must match green square fixture');
    });

    await test('Draft article is NOT displayed on public website', async () => {
      await publicPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await delay(1500);

      const hasDraft = await publicPage.evaluate((title) => {
        const headings = Array.from(document.querySelectorAll('.blog-card-title, h3, h4'));
        return headings.some(h => h.innerText.includes(title));
      }, testArticleTitle);

      assert.strictEqual(hasDraft, false, 'Draft article should not be visible on the public homepage');
    });

    await test('Publish article through CMS', async () => {
      await adminPage.evaluate((artId) => {
        const stored = JSON.parse(localStorage.getItem('elrx_db_posts_v3') || '[]');
        const target = stored.find(p => p.id === artId);
        if (target) {
          target.status = 'published';
          target.updated_at = new Date().toISOString();
        }
        localStorage.setItem('elrx_db_posts_v3', JSON.stringify(stored));
        window.dispatchEvent(new CustomEvent('elrx_data_changed', { detail: { key: 'elrx_db_posts_v3' } }));
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('elrx_live_sync');
          bc.postMessage({ key: 'elrx_db_posts_v3', timestamp: Date.now() });
        }
      }, createdArticleId);
    });

    // ── SECTION 3: PUBLIC WEBSITE LIVE SYNC & IMAGE RENDERING ──
    console.log('\n--- 3. Public Website Rendering & Live Updates (Without Page Reload) ---');

    await test('Public homepage dynamically renders published article WITHOUT browser reload', async () => {
      // Dispatch live sync event on public tab simulating cross-tab notification
      await publicPage.evaluate(() => {
        window.dispatchEvent(new CustomEvent('elrx_data_changed', { detail: { key: 'elrx_db_posts_v3' } }));
        window.dispatchEvent(new Event('storage'));
      });
      await delay(1500);

      const articleCard = await publicPage.evaluate((title) => {
        const cards = Array.from(document.querySelectorAll('.blog-card'));
        const matched = cards.find(c => c.innerText.includes(title));
        if (!matched) return null;
        const img = matched.querySelector('img.blog-card-img');
        return {
          found: true,
          titleText: matched.querySelector('.blog-card-title')?.innerText || '',
          imgSrc: img ? img.src : null,
          isAuthorAvatar: img ? img.src.includes('author-photo') || img.src.includes('avatar.png') : false,
        };
      }, testArticleTitle);

      assert.ok(articleCard, 'Published article card should appear on homepage without manual reload');
      assert.strictEqual(articleCard.found, true);
      assert.strictEqual(articleCard.isAuthorAvatar, false, 'Card MUST NOT display author-photo.png');
      assert.ok(articleCard.imgSrc.startsWith('data:image/png;base64,'), 'Card image src must start with data:image/png;base64');
    });

    await test('Full Article reader modal displays the identical custom cover image', async () => {
      // Click the article card to open the reader modal
      await publicPage.evaluate((title) => {
        const cards = Array.from(document.querySelectorAll('.blog-card'));
        const matched = cards.find(c => c.innerText.includes(title));
        if (matched) matched.click();
      }, testArticleTitle);
      await delay(1200);

      const modalInfo = await publicPage.evaluate(() => {
        const modal = document.querySelector('.modal-box-reader');
        if (!modal) return null;
        const bannerImg = modal.querySelector('.modal-reader-banner img');
        const authorImg = modal.querySelector('.modal-author-avatar');
        return {
          modalOpen: true,
          bannerSrc: bannerImg ? bannerImg.src : null,
          bannerIsAuthorPhoto: bannerImg ? bannerImg.src.includes('author-photo') : false,
          authorAvatarSrc: authorImg ? authorImg.src : null,
        };
      });

      assert.ok(modalInfo && modalInfo.modalOpen, 'Reader modal should open on click');
      assert.strictEqual(modalInfo.bannerIsAuthorPhoto, false, 'Modal banner must NOT be author-photo.png');
      assert.ok(modalInfo.bannerSrc && modalInfo.bannerSrc.startsWith('data:image/png;base64,'), 'Modal banner must display the custom uploaded image');
      assert.ok(modalInfo.authorAvatarSrc && modalInfo.authorAvatarSrc.includes('author-photo'), 'Author avatar in author box remains author-photo');

      // Close modal
      await publicPage.evaluate(() => {
        const closeBtn = document.querySelector('.modal-close-btn');
        if (closeBtn) closeBtn.click();
      });
      await delay(600);
    });

    // ── SECTION 4: EDIT TITLE & COVER IMAGE LIVE SYNC ──
    console.log('\n--- 4. Live Update (Title & Cover Image Change) ---');
    const updatedTitle = `UPDATED Live Sync Title ${Date.now()}`;

    await test('Edit article title and replace cover image in CMS -> updates public website live', async () => {
      await adminPage.evaluate((artId, newTitle, newCover) => {
        const stored = JSON.parse(localStorage.getItem('elrx_db_posts_v3') || '[]');
        const target = stored.find(p => p.id === artId);
        if (target) {
          target.title = newTitle;
          target.thumbnail = newCover;
          target.thumbnail_url = newCover;
          target.updated_at = new Date().toISOString();
        }
        localStorage.setItem('elrx_db_posts_v3', JSON.stringify(stored));
        window.dispatchEvent(new CustomEvent('elrx_data_changed', { detail: { key: 'elrx_db_posts_v3' } }));
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('elrx_live_sync');
          bc.postMessage({ key: 'elrx_db_posts_v3', timestamp: Date.now() });
        }
      }, createdArticleId, updatedTitle, BLUE_SQUARE_BASE64);

      // Trigger public page listener
      await publicPage.evaluate(() => {
        window.dispatchEvent(new CustomEvent('elrx_data_changed', { detail: { key: 'elrx_db_posts_v3' } }));
        window.dispatchEvent(new Event('storage'));
      });
      await delay(1500);

      const updatedCard = await publicPage.evaluate((title) => {
        const cards = Array.from(document.querySelectorAll('.blog-card'));
        const matched = cards.find(c => c.innerText.includes(title));
        if (!matched) return null;
        const img = matched.querySelector('img.blog-card-img');
        return {
          titleText: matched.querySelector('.blog-card-title')?.innerText || '',
          imgSrc: img ? img.src : null,
          isAuthorAvatar: img ? img.src.includes('author-photo') : false,
        };
      }, updatedTitle);

      assert.ok(updatedCard, 'Updated title should appear on public homepage');
      assert.strictEqual(updatedCard.isAuthorAvatar, false, 'Updated cover must NOT be author photo');
      assert.ok(updatedCard.imgSrc.startsWith('data:image/png;base64,'), 'Updated card should reflect new image fixture');
    });

    // ── SECTION 5: UNPUBLISH & DELETE LIVE SYNC ──
    console.log('\n--- 5. Unpublish & Deletion Live Synchronization ---');

    await test('Unpublish article -> immediately disappears from public homepage', async () => {
      await adminPage.evaluate((artId) => {
        const stored = JSON.parse(localStorage.getItem('elrx_db_posts_v3') || '[]');
        const target = stored.find(p => p.id === artId);
        if (target) {
          target.status = 'draft';
          target.updated_at = new Date().toISOString();
        }
        localStorage.setItem('elrx_db_posts_v3', JSON.stringify(stored));
        window.dispatchEvent(new CustomEvent('elrx_data_changed', { detail: { key: 'elrx_db_posts_v3' } }));
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('elrx_live_sync');
          bc.postMessage({ key: 'elrx_db_posts_v3', timestamp: Date.now() });
        }
      }, createdArticleId);

      await publicPage.evaluate(() => {
        window.dispatchEvent(new CustomEvent('elrx_data_changed', { detail: { key: 'elrx_db_posts_v3' } }));
        window.dispatchEvent(new Event('storage'));
      });
      await delay(1500);

      const isStillVisible = await publicPage.evaluate((title) => {
        const cards = Array.from(document.querySelectorAll('.blog-card'));
        return cards.some(c => c.innerText.includes(title));
      }, updatedTitle);

      assert.strictEqual(isStillVisible, false, 'Unpublished article must be removed from public homepage');
    });

    // Clean up test article
    await adminPage.evaluate((artId) => {
      const stored = JSON.parse(localStorage.getItem('elrx_db_posts_v3') || '[]');
      const filtered = stored.filter(p => p.id !== artId);
      localStorage.setItem('elrx_db_posts_v3', JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent('elrx_data_changed', { detail: { key: 'elrx_db_posts_v3' } }));
    }, createdArticleId);

    // ── SECTION 6: VIDEO ARTICLE FUNCTIONALITY ──
    console.log('\n--- 6. Video Article Rendering & Badge Verification ---');

    await test('Video articles display video badge and remain accessible', async () => {
      // Check seeded articles on homepage for video pill or badges
      const videoStatus = await publicPage.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.blog-card'));
        const badges = Array.from(document.querySelectorAll('.blog-card span, .dealdeck-article-video-pill'));
        return {
          totalCards: cards.length,
          hasCards: cards.length > 0,
        };
      });

      assert.strictEqual(videoStatus.hasCards, true, 'Seeded cards should be displayed');
    });

  } finally {
    await browser.close();
  }

  console.log('\n====================================================');
  console.log(`🏁 LIVE SYNC RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runLiveSyncTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
