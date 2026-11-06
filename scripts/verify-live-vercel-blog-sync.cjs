const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'https://abhisingh-website.vercel.app';
const ARTIFACT_DIR = 'C:\\Users\\ashut\\.gemini\\antigravity\\brain\\d44916b9-6f29-404e-b94f-138b40f5c159';

function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

// Distinct colored test cover fixture (solid emerald gradient PNG)
const EMERALD_COVER_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAGFUlEQVR4Ae3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC4GQ2YAAE1v8w+AAAAAElFTkSuQmCC';

async function verifyLiveVercelBlogSync() {
  console.log('Testing live blog cover image rendering on Vercel:', BASE_URL);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Step 1: Seed Super Admin Session
    await page.goto(`${BASE_URL}/admin.html`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const session = {
        role: 'super_admin',
        adminName: 'Abhi Singh',
        email: 'abhi@eatliftrun.in',
        authenticated: true,
        loginTime: new Date().toISOString()
      };
      localStorage.setItem('abhisingh_super_admin_session', JSON.stringify(session));
      localStorage.setItem('abhisingh_admin_session', JSON.stringify(session));
      localStorage.setItem('elrx_admin_session', JSON.stringify(session));
    });

    const testTitle = `Hello world (Live Verified ${Date.now().toString().slice(-4)})`;
    const testArticleId = `post_live_${Date.now()}`;

    // Step 2: Create Published Article with Custom Cover Image in Database/LocalStorage
    await page.evaluate((artId, title, cover) => {
      const stored = JSON.parse(localStorage.getItem('elrx_db_posts_v3') || '[]');
      const newPost = {
        id: artId,
        title: title,
        category: 'Framework',
        published_date: 'November 2026',
        read_time: '2 min read',
        summary: 'Verifying that custom uploaded cover images render accurately across both homepage cards and modal reader views.',
        content: `
          <p class="modal-lead">This article proves that custom cover images uploaded in the CMS appear directly on public blog cards.</p>
          <div class="modal-takeaway-card">
            <span class="takeaway-badge">Core Verification</span>
            <blockquote>"CMS Cover Image = Public Blog Card Cover Image = Full Article Cover Image."</blockquote>
          </div>
          <p>The image is loaded dynamically and synchronization functions without manual page reloads.</p>
        `,
        thumbnail: cover,
        thumbnail_url: cover,
        status: 'published',
        featured: true,
        featured_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      stored.unshift(newPost);
      localStorage.setItem('elrx_db_posts_v3', JSON.stringify(stored));
      window.dispatchEvent(new CustomEvent('elrx_data_changed', { detail: { key: 'elrx_db_posts_v3' } }));
    }, testArticleId, testTitle, EMERALD_COVER_BASE64);

    console.log('Created test article in persistent store:', testTitle);

    // Step 3: Open Public Website Homepage
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await delay(1500);

    // Step 4: Verify Blog Card Image on Homepage
    const cardData = await page.evaluate((title) => {
      const cards = Array.from(document.querySelectorAll('.blog-card'));
      const matched = cards.find(c => c.innerText.includes(title));
      if (!matched) return null;
      const img = matched.querySelector('img.blog-card-img');
      return {
        found: true,
        title: matched.querySelector('.blog-card-title')?.innerText || '',
        category: matched.querySelector('.blog-card-category-badge')?.innerText || '',
        imgSrc: img ? img.src : null,
        isAuthorPhoto: img ? img.src.includes('author-photo') || img.src.includes('avatar.png') : false,
      };
    }, testTitle);

    console.log('HOMEPAGE BLOG CARD VERIFICATION:', cardData);
    assert.ok(cardData, 'Test article card must exist on homepage');
    assert.strictEqual(cardData.isAuthorPhoto, false, 'Card MUST NOT display author-photo.png');
    assert.ok(cardData.imgSrc && cardData.imgSrc.startsWith('data:image/png;base64,'), 'Card must display custom base64 image');

    // Step 5: Capture Homepage Blog Section Screenshot
    const cardScreenshot = path.join(ARTIFACT_DIR, 'verified_live_blog_card_custom_cover.png');
    await page.screenshot({ path: cardScreenshot });
    console.log('Captured homepage card screenshot to:', cardScreenshot);

    // Step 6: Click Card to Open Reader Modal
    await page.evaluate((title) => {
      const cards = Array.from(document.querySelectorAll('.blog-card'));
      const matched = cards.find(c => c.innerText.includes(title));
      if (matched) matched.click();
    }, testTitle);
    await delay(1200);

    // Step 7: Verify Reader Modal Image
    const modalData = await page.evaluate(() => {
      const modal = document.querySelector('.modal-box-reader');
      if (!modal) return null;
      const bannerImg = modal.querySelector('.modal-reader-banner img');
      const authorImg = modal.querySelector('.modal-author-avatar');
      return {
        open: true,
        bannerSrc: bannerImg ? bannerImg.src : null,
        bannerIsAuthorPhoto: bannerImg ? bannerImg.src.includes('author-photo') : false,
        authorSrc: authorImg ? authorImg.src : null,
        authorIsAuthorPhoto: authorImg ? authorImg.src.includes('author-photo') : false,
      };
    });

    console.log('READER MODAL VERIFICATION:', modalData);
    assert.ok(modalData && modalData.open, 'Reader modal must open');
    assert.strictEqual(modalData.bannerIsAuthorPhoto, false, 'Modal banner must NOT be author photo');
    assert.ok(modalData.bannerSrc && modalData.bannerSrc.startsWith('data:image/png;base64,'), 'Modal banner must match custom image');
    assert.strictEqual(modalData.authorIsAuthorPhoto, true, 'Author avatar in bio section remains author photo');

    // Step 8: Capture Reader Modal Screenshot
    const modalScreenshot = path.join(ARTIFACT_DIR, 'verified_live_reader_modal_custom_cover.png');
    await page.screenshot({ path: modalScreenshot });
    console.log('Captured reader modal screenshot to:', modalScreenshot);

    // Clean up test article
    await page.evaluate((artId) => {
      const stored = JSON.parse(localStorage.getItem('elrx_db_posts_v3') || '[]');
      const filtered = stored.filter(p => p.id !== artId);
      localStorage.setItem('elrx_db_posts_v3', JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent('elrx_data_changed', { detail: { key: 'elrx_db_posts_v3' } }));
    }, testArticleId);

    console.log('Cleaned up test record successfully.');
    console.log('ALL LIVE VERIFICATIONS PASSED 100%!');

  } finally {
    await browser.close();
  }
}

verifyLiveVercelBlogSync().catch(console.error);

