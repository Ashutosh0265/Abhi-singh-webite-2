const puppeteer = require('puppeteer-core');
const path = require('path');
const assert = require('assert');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const ARTIFACT_DIR = 'C:\\Users\\ashut\\.gemini\\antigravity\\brain\\d44916b9-6f29-404e-b94f-138b40f5c159';

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runMobileMenuTest() {
  console.log('====================================================');
  console.log('📱 MOBILE HAMBURGER SMOOTH ANIMATION E2E TEST');
  console.log('====================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=390,844'],
  });

  try {
    const page = await browser.newPage();
    // Test on standard mobile viewport (iPhone 12/13/14: 390x844)
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await delay(1200);

    // ── 1. INITIAL CLOSED STATE ON MOBILE ──
    console.log('--- 1. Testing Initial Closed State on Mobile (390px) ---');
    const closedState = await page.evaluate(() => {
      const toggle = document.querySelector('.mobile-menu-toggle');
      const navLinks = document.querySelector('.nav-links');
      const backdrop = document.querySelector('.mobile-nav-backdrop');
      const topBar = document.querySelector('.hamburger-bar-top');
      const midBar = document.querySelector('.hamburger-bar-mid');
      const botBar = document.querySelector('.hamburger-bar-bot');

      const toggleStyle = window.getComputedStyle(toggle);
      const navStyle = window.getComputedStyle(navLinks);
      const backdropStyle = window.getComputedStyle(backdrop);

      return {
        toggleVisible: toggleStyle.display !== 'none',
        hasIsActive: toggle.classList.contains('is-active'),
        hasMobileOpen: navLinks.classList.contains('mobile-open'),
        navOpacity: parseFloat(navStyle.opacity),
        navVisibility: navStyle.visibility,
        backdropOpacity: parseFloat(backdropStyle.opacity),
        backdropVisibility: backdropStyle.visibility,
        barsPresent: Boolean(topBar && midBar && botBar),
      };
    });

    console.log('    Closed state metrics:', closedState);
    assert.strictEqual(closedState.toggleVisible, true, 'Hamburger toggle button must be visible on mobile');
    assert.strictEqual(closedState.hasIsActive, false, 'Toggle button must not be active initially');
    assert.strictEqual(closedState.hasMobileOpen, false, 'Menu drawer must not have mobile-open class initially');
    assert.strictEqual(closedState.navOpacity, 0, 'Menu drawer opacity must be 0 when closed');
    assert.strictEqual(closedState.navVisibility, 'hidden', 'Menu drawer must be hidden when closed');
    assert.strictEqual(closedState.barsPresent, true, '3 animated hamburger bars must be rendered');
    console.log('  ✓ PASS: Initial closed state is correctly hidden and prepared for animation');

    // ── 2. CLICK HAMBURGER TO TRIGGER OPEN ANIMATION ──
    console.log('\n--- 2. Triggering Hamburger Click & Measuring Smooth Animation ---');
    await page.click('.mobile-menu-toggle');

    // Wait 550ms for the full staggered cascade (0.24s delay + 0.24s transition = 0.48s) to complete
    await delay(550);

    const openState = await page.evaluate(() => {
      const toggle = document.querySelector('.mobile-menu-toggle');
      const navLinks = document.querySelector('.nav-links');
      const backdrop = document.querySelector('.mobile-nav-backdrop');
      const items = Array.from(document.querySelectorAll('.nav-links li'));
      const links = Array.from(document.querySelectorAll('.nav-links a, .nav-links button'));

      const toggleStyle = window.getComputedStyle(toggle);
      const navStyle = window.getComputedStyle(navLinks);
      const backdropStyle = window.getComputedStyle(backdrop);
      const rect = navLinks.getBoundingClientRect();

      return {
        hasIsActive: toggle.classList.contains('is-active'),
        hasMobileOpen: navLinks.classList.contains('mobile-open'),
        navOpacity: parseFloat(navStyle.opacity),
        navVisibility: navStyle.visibility,
        navTop: rect.top,
        navHeight: rect.height,
        backdropOpacity: parseFloat(backdropStyle.opacity),
        backdropVisibility: backdropStyle.visibility,
        bodyOverflow: document.body.style.overflow,
        itemCount: items.length,
        itemsOpacity: items.map(i => parseFloat(window.getComputedStyle(i).opacity)),
        linkLabels: links.map(l => l.innerText.trim()).filter(Boolean),
      };
    });

    console.log('    Open state metrics:', openState);
    assert.strictEqual(openState.hasIsActive, true, 'Toggle button must have is-active class');
    assert.strictEqual(openState.hasMobileOpen, true, 'Menu drawer must have mobile-open class');
    assert.strictEqual(openState.navOpacity, 1, 'Menu drawer opacity must be 1 when animated open');
    assert.strictEqual(openState.navVisibility, 'visible', 'Menu drawer must be visible');
    assert.strictEqual(openState.backdropOpacity, 1, 'Backdrop opacity must be 1 when animated open');
    assert.strictEqual(openState.bodyOverflow, 'hidden', 'Body scroll must be locked when open');
    assert.strictEqual(openState.itemCount, 6, 'Must display all 6 options in drawer');
    assert.strictEqual(openState.itemsOpacity.every(o => o >= 0.99), true, 'All options must have completed animation to full opacity');
    console.log('    Option links rendered:', openState.linkLabels);
    console.log('  ✓ PASS: Smooth open transition successfully completed for all 6 options');

    // Capture visual proof of the open animated mobile drawer
    const screenshotPath = path.join(ARTIFACT_DIR, 'verified_mobile_hamburger_smooth_open.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`  ✓ Screenshot saved: ${screenshotPath}`);

    // ── 3. CLICK OPTION / BACKDROP TO TEST CLOSE ANIMATION ──
    console.log('\n--- 3. Testing Smooth Close Animation ---');
    await page.click('.mobile-nav-backdrop');

    // Wait 350ms for close transition
    await delay(350);

    const reClosedState = await page.evaluate(() => {
      const toggle = document.querySelector('.mobile-menu-toggle');
      const navLinks = document.querySelector('.nav-links');
      const backdrop = document.querySelector('.mobile-nav-backdrop');

      const navStyle = window.getComputedStyle(navLinks);
      const backdropStyle = window.getComputedStyle(backdrop);

      return {
        hasIsActive: toggle.classList.contains('is-active'),
        hasMobileOpen: navLinks.classList.contains('mobile-open'),
        navOpacity: parseFloat(navStyle.opacity),
        navVisibility: navStyle.visibility,
        backdropOpacity: parseFloat(backdropStyle.opacity),
        bodyOverflow: document.body.style.overflow,
      };
    });

    console.log('    Re-closed state metrics:', reClosedState);
    assert.strictEqual(reClosedState.hasIsActive, false, 'Toggle is-active class removed');
    assert.strictEqual(reClosedState.hasMobileOpen, false, 'Menu mobile-open class removed');
    assert.strictEqual(reClosedState.navOpacity, 0, 'Menu drawer opacity transitioned back to 0');
    assert.strictEqual(reClosedState.navVisibility, 'hidden', 'Menu drawer visibility transitioned back to hidden');
    assert.strictEqual(reClosedState.backdropOpacity, 0, 'Backdrop opacity transitioned back to 0');
    assert.strictEqual(reClosedState.bodyOverflow, '', 'Body scroll lock removed cleanly');
    console.log('  ✓ PASS: Smooth close transition successfully restored clean baseline');

    // ── 4. DESKTOP SAFETY VERIFICATION ──
    console.log('\n--- 4. Desktop Safety Verification (1440px) ---');
    await page.setViewport({ width: 1440, height: 900, isMobile: false });
    await delay(500);

    const desktopState = await page.evaluate(() => {
      const toggle = document.querySelector('.mobile-menu-toggle');
      const navLinks = document.querySelector('.nav-links');
      const backdrop = document.querySelector('.mobile-nav-backdrop');

      const toggleStyle = window.getComputedStyle(toggle);
      const navStyle = window.getComputedStyle(navLinks);
      const backdropStyle = window.getComputedStyle(backdrop);

      return {
        toggleDisplay: toggleStyle.display,
        navDisplay: navStyle.display,
        navPosition: navStyle.position,
        backdropDisplay: backdropStyle.display,
      };
    });

    console.log('    Desktop metrics:', desktopState);
    assert.strictEqual(desktopState.toggleDisplay, 'none', 'Mobile toggle must be completely hidden on desktop');
    assert.strictEqual(desktopState.navDisplay, 'flex', 'Navbar links must be visible flex row on desktop');
    assert.notStrictEqual(desktopState.navPosition, 'absolute', 'Navbar links must not be absolute drawer on desktop');
    assert.strictEqual(desktopState.backdropDisplay, 'none', 'Backdrop must be completely hidden on desktop');
    console.log('  ✓ PASS: Desktop layout completely unaffected');

    console.log('\n====================================================');
    console.log('🏁 ALL MOBILE ANIMATION TESTS PASSED PERFECTLY!');
    console.log('====================================================\n');
  } finally {
    await browser.close();
  }
}

runMobileMenuTest().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
