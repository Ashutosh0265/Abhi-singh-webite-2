const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = path.resolve('C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159');

async function verifyNewsletterPopupLayout() {
  console.log('--- VERIFYING NEWSLETTER POPUP LAYOUT AND OVERFLOW FIX ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const viewports = [
    { name: 'Desktop (1440x900)', width: 1440, height: 900 },
    { name: 'Laptop (1024x768)', width: 1024, height: 768 },
    { name: 'Tablet (768x900)', width: 768, height: 900 },
    { name: 'Mobile (414x896)', width: 414, height: 896 }
  ];

  for (const vp of viewports) {
    console.log(`\nTesting ${vp.name}...`);
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    // Trigger popup
    await page.evaluate(() => {
      sessionStorage.clear();
      window.scrollTo(0, document.documentElement.scrollHeight * 0.85);
      window.dispatchEvent(new Event('scroll'));
    });
    await new Promise(r => setTimeout(r, 600));

    let popup = await page.$('.newsletter-popup-modal');
    if (!popup) {
      await new Promise(r => setTimeout(r, 6500));
      await page.evaluate(() => {
        document.dispatchEvent(new MouseEvent('mouseleave', { clientY: 5 }));
      });
      await new Promise(r => setTimeout(r, 600));
    }

    await page.waitForSelector('.newsletter-popup-modal', { timeout: 8000 });

    const checks = await page.evaluate(() => {
      const modal = document.querySelector('.newsletter-popup-modal');
      const content = document.querySelector('.newsletter-popup-content');
      const heading = document.querySelector('.newsletter-popup-heading');
      const desc = document.querySelector('.newsletter-popup-desc');
      const formRow = document.querySelector('.newsletter-popup-form-row');
      const input = document.querySelector('.newsletter-popup-input');
      const btn = document.querySelector('.newsletter-popup-btn');

      const modalRect = modal.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      const headingRect = heading.getBoundingClientRect();
      const descRect = desc.getBoundingClientRect();
      const formRowRect = formRow.getBoundingClientRect();
      const inputRect = input.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();

      return {
        modalWidth: Math.round(modalRect.width),
        modalRight: Math.round(modalRect.right),
        contentRight: Math.round(contentRect.right),
        headingRight: Math.round(headingRect.right),
        descRight: Math.round(descRect.right),
        formRowRight: Math.round(formRowRect.right),
        btnRight: Math.round(btnRect.right),
        isContentInside: contentRect.right <= modalRect.right + 1,
        isHeadingInside: headingRect.right <= modalRect.right + 1,
        isDescInside: descRect.right <= modalRect.right + 1,
        isFormRowInside: formRowRect.right <= modalRect.right + 1,
        isBtnInside: btnRect.right <= modalRect.right + 1,
        btnMarginRight: Math.round(modalRect.right - btnRect.right),
        descMarginRight: Math.round(modalRect.right - descRect.right)
      };
    });

    console.log(`  Modal width: ${checks.modalWidth}px`);
    console.log(`  Content inside modal: ${checks.isContentInside} (modal right: ${checks.modalRight}, content right: ${checks.contentRight})`);
    console.log(`  Heading inside modal: ${checks.isHeadingInside}`);
    console.log(`  Paragraph inside modal: ${checks.isDescInside} (margin to right border: ${checks.descMarginRight}px)`);
    console.log(`  Form row inside modal: ${checks.isFormRowInside}`);
    console.log(`  Button inside modal: ${checks.isBtnInside} (margin to right border: ${checks.btnMarginRight}px)`);

    if (!checks.isContentInside || !checks.isDescInside || !checks.isFormRowInside || !checks.isBtnInside) {
      throw new Error(`FAILURE in ${vp.name}: Elements are overflowing or clipped outside modal!`);
    }

    if (vp.width === 1024) {
      // Capture the primary verified screenshot for artifact
      const screenshotPath = path.join(ARTIFACT_DIR, 'verified_fixed_newsletter_popup.png');
      await page.screenshot({ path: screenshotPath });
      console.log(`  ✓ Saved primary screenshot: ${screenshotPath}`);
    }

    await page.close();
  }

  await browser.close();
  console.log('\n🎉 ALL NEWSLETTER POPUP LAYOUT & BOUNDARY VERIFICATIONS PASSED 100%!');
}

verifyNewsletterPopupLayout().catch(err => {
  console.error(err);
  process.exit(1);
});

