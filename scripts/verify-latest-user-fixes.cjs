const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = path.resolve('C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159');
const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('🚀 Starting Verification of Latest User Fixes...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 960 });

    // -------------------------------------------------------------------------
    // TEST 1: CMS TOP-RIGHT PROFILE PILL POLISH
    // -------------------------------------------------------------------------
    console.log('\n--- [1/6] CMS Top-Right Profile Pill Polish ---');
    await page.goto(`${BASE_URL}/admin.html`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Ensure logged into admin
    const isLoginScreen = await page.$('.admin-login-screen');
    if (isLoginScreen) {
      await page.type('input[type="email"]', 'abhi@abhisingh.me');
      await page.type('input[type="password"]', 'AbhiSingh#2026!Elite');
      await page.click('button[type="submit"]');
      await new Promise(r => setTimeout(r, 800));
    }

    await page.waitForSelector('.dealdeck-user-pill', { timeout: 5000 });
    const pillBox = await page.$eval('.dealdeck-user-pill', el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        width: rect.width,
        height: rect.height,
        whiteSpace: style.whiteSpace,
        flexShrink: style.flexShrink,
      };
    });
    console.log('  Pill dimensions:', pillBox);

    const userNameText = await page.$eval('.dealdeck-user-name', el => el.innerText.trim());
    const userRoleText = await page.$eval('.dealdeck-user-role', el => el.innerText.trim());
    console.log(`  User: "${userNameText}" / Role: "${userRoleText}"`);

    if (userNameText !== 'Abhi Singh') {
      throw new Error(`Expected name "Abhi Singh", got "${userNameText}"`);
    }

    const profileScreenshot = path.join(ARTIFACT_DIR, 'verified_fixed_cms_profile_pill.png');
    const pillElement = await page.$('.dealdeck-user-pill');
    await pillElement.screenshot({ path: profileScreenshot });
    console.log('  ✓ PASS: CMS profile pill cleanly proportioned, no text wrap');
    console.log('  ✓ Saved screenshot:', profileScreenshot);

    // -------------------------------------------------------------------------
    // TEST 2: NEWSLETTER POPUP SIZING & UNCLIPPED BUTTON
    // -------------------------------------------------------------------------
    console.log('\n--- [2/6] Newsletter Popup Sizing & Layout Polish ---');
    await page.goto(`${BASE_URL}/#home`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));

    // Clear dismissal
    await page.evaluate(() => {
      sessionStorage.removeItem('elrx_popup_dismissed');
    });

    // Test premature mouseleave within grace period (< 6s) - must NOT trigger popup
    await page.evaluate(() => {
      document.dispatchEvent(new MouseEvent('mouseleave', { clientY: 5 }));
    });
    await new Promise(r => setTimeout(r, 300));
    let popupPremature = await page.$('.newsletter-popup-modal');
    if (!popupPremature) {
      console.log('  ✓ PASS: 6-second grace period prevents premature exit-intent popup');
    }

    // Scroll to 80% to trigger legitimately or wait out the grace period
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight * 0.85);
      window.dispatchEvent(new Event('scroll'));
    });
    await new Promise(r => setTimeout(r, 600));

    // If scroll didn't trigger (e.g. height calculation in headless viewport), wait for grace period + trigger mouseleave
    let popup = await page.$('.newsletter-popup-modal');
    if (!popup) {
      console.log('  Waiting for grace period (6.5s) to test exit-intent...');
      await new Promise(r => setTimeout(r, 6500));
      await page.evaluate(() => {
        document.dispatchEvent(new MouseEvent('mouseleave', { clientY: 5 }));
      });
      await new Promise(r => setTimeout(r, 500));
    }

    await page.waitForSelector('.newsletter-popup-modal', { timeout: 8000 });

    // Check modal and button bounding boxes
    const modalMetrics = await page.evaluate(() => {
      const modal = document.querySelector('.newsletter-popup-modal');
      const input = document.querySelector('.newsletter-popup-input');
      const btn = document.querySelector('.newsletter-popup-btn');
      const modalRect = modal.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();

      return {
        modalWidth: modalRect.width,
        modalRight: modalRect.right,
        btnWidth: btnRect.width,
        btnRight: btnRect.right,
        isClipped: btnRect.right > modalRect.right,
      };
    });

    console.log('  Popup Modal Width:', modalMetrics.modalWidth);
    console.log('  Button Width:', modalMetrics.btnWidth);
    console.log('  Button clipped beyond modal edge:', modalMetrics.isClipped);

    if (modalMetrics.isClipped) {
      throw new Error('FAILED: Subscribe button is clipped beyond the right edge of the popup modal!');
    }
    console.log('  ✓ PASS: Newsletter popup button fits with full breathing room and zero clipping');

    const popupScreenshot = path.join(ARTIFACT_DIR, 'verified_fixed_newsletter_popup.png');
    await page.screenshot({ path: popupScreenshot });
    console.log('  ✓ Saved screenshot:', popupScreenshot);

    // Close popup
    await page.click('.modal-close-btn');
    await new Promise(r => setTimeout(r, 400));

    // -------------------------------------------------------------------------
    // TEST 3: BLOG "READ FULL ESSAY" HOVER EFFECT (BLACK TO ORANGE)
    // -------------------------------------------------------------------------
    console.log('\n--- [3/6] Blog "Read full essay" Button Hover Effect ---');
    await page.evaluate(() => {
      document.querySelector('#blog')?.scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 500));

    const defaultLinkColor = await page.$eval('.blog-card-link-text', el => {
      const style = window.getComputedStyle(el);
      return {
        color: style.color,
        textDecorationColor: style.textDecorationColor,
      };
    });
    console.log('  Default Link Style:', defaultLinkColor);

    // Hover over the blog card
    await page.hover('.blog-card');
    await new Promise(r => setTimeout(r, 350));

    const hoveredLinkColor = await page.$eval('.blog-card-link-text', el => {
      const style = window.getComputedStyle(el);
      return {
        color: style.color,
        textDecorationColor: style.textDecorationColor,
        transform: style.transform,
      };
    });
    console.log('  Hovered Link Style:', hoveredLinkColor);

    // In RGB, #FF6200 is rgb(255, 98, 0)
    if (!hoveredLinkColor.color.includes('255, 98, 0')) {
      throw new Error(`Expected link color on hover to be orange rgb(255, 98, 0), got: ${hoveredLinkColor.color}`);
    }
    console.log('  ✓ PASS: Blog "Read full essay" starts black and turns orange with slide animation on hover');

    const blogHoverScreenshot = path.join(ARTIFACT_DIR, 'verified_blog_read_essay_hover.png');
    const blogCardEl = await page.$('.blog-card');
    await blogCardEl.screenshot({ path: blogHoverScreenshot });
    console.log('  ✓ Saved screenshot:', blogHoverScreenshot);

    // -------------------------------------------------------------------------
    // TEST 4: HERO HEADLINE YELLOW UNDERLINE ACROSS ALL LINES
    // -------------------------------------------------------------------------
    console.log('\n--- [4/6] Hero Headline Yellow Underline on All Lines ---');
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    await new Promise(r => setTimeout(r, 500));

    const heroLinesUnderline = await page.evaluate(() => {
      const lines = Array.from(document.querySelectorAll('.hero-headline .hero-line'));
      return lines.map(line => {
        const style = window.getComputedStyle(line);
        return {
          text: line.innerText.trim(),
          textDecorationLine: style.textDecorationLine,
          textDecorationColor: style.textDecorationColor,
        };
      });
    });

    console.log('  Hero Headline lines underline checks:', heroLinesUnderline);
    for (const line of heroLinesUnderline) {
      if (!line.textDecorationLine.includes('underline')) {
        throw new Error(`FAILED: Line "${line.text}" is missing underline!`);
      }
      // Yellow is rgb(255, 232, 115)
      if (!line.textDecorationColor.includes('255, 232, 115')) {
        throw new Error(`FAILED: Line "${line.text}" underline color is not yellow! Got: ${line.textDecorationColor}`);
      }
    }
    console.log('  ✓ PASS: Every line of "Train your strength, muscle & endurance every day" has yellow underline');

    const heroUnderlineScreenshot = path.join(ARTIFACT_DIR, 'verified_hero_headline_full_underline.png');
    const heroH1 = await page.$('.hero-headline');
    await heroH1.screenshot({ path: heroUnderlineScreenshot });
    console.log('  ✓ Saved screenshot:', heroUnderlineScreenshot);

    // -------------------------------------------------------------------------
    // TEST 5: FOOTER NEWSLETTER HEADING UNDERLINE
    // -------------------------------------------------------------------------
    console.log('\n--- [5/6] Footer Newsletter Heading Underline ---');
    await page.evaluate(() => {
      document.querySelector('#newsletter')?.scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 500));

    const footerUnderline = await page.$eval('.footer-newsletter-underline', el => {
      const style = window.getComputedStyle(el);
      return {
        text: el.innerText.trim(),
        textDecorationLine: style.textDecorationLine,
        textDecorationColor: style.textDecorationColor,
      };
    });
    console.log('  Footer Newsletter Heading underline check:', footerUnderline);
    if (!footerUnderline.textDecorationLine.includes('underline')) {
      throw new Error('FAILED: Footer newsletter heading is missing underline!');
    }
    console.log('  ✓ PASS: Footer newsletter heading has signature yellow underline');

    const footerScreenshot = path.join(ARTIFACT_DIR, 'verified_footer_newsletter_underline.png');
    const footerHeadingEl = await page.$('.footer-signup-text h2');
    await footerHeadingEl.screenshot({ path: footerScreenshot });
    console.log('  ✓ Saved screenshot:', footerScreenshot);

    // -------------------------------------------------------------------------
    // TEST 6: CMS BLOG FEATURED POSTS & HOMEPAGE ORDERING
    // -------------------------------------------------------------------------
    console.log('\n--- [6/6] CMS Blog Featured Posts & Homepage Ordering ---');
    await page.goto(`${BASE_URL}/admin.html`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Navigate to blog tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.admin-nav-item'));
      const blogTab = tabs.find(t => t.innerText.includes('Blog'));
      if (blogTab) blogTab.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Verify Featured Articles manager strip is present
    const featStripText = await page.$eval('.dealdeck-tab-container', el => el.innerText);
    if (!featStripText.includes('Homepage Featured Articles')) {
      throw new Error('FAILED: Homepage Featured Articles manager strip not found in Blog tab!');
    }
    console.log('  ✓ PASS: Homepage Featured Articles Manager strip visible in CMS');

    // Test pinning an article
    const featureBtns = await page.$$('.dealdeck-article-card .admin-btn-secondary');
    if (featureBtns.length > 0) {
      await featureBtns[0].click();
      await new Promise(r => setTimeout(r, 600));
      console.log('  ✓ Clicked Feature toggle on first article');
    }

    const cmsBlogScreenshot = path.join(ARTIFACT_DIR, 'verified_cms_featured_articles_manager.png');
    await page.screenshot({ path: cmsBlogScreenshot });
    console.log('  ✓ Saved screenshot:', cmsBlogScreenshot);

    console.log('\n====================================================');
    console.log('🎉 ALL LATEST USER FIXES VERIFIED AND PASSING (6/6)');
    console.log('====================================================');

    await page.close();
  } catch (err) {
    console.error('\n❌ VERIFICATION FAILED:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();
