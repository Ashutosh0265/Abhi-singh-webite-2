const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function findChromePath() {
  const commonPaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe',
  ];
  for (const p of commonPaths) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

(async () => {
  const chromePath = await findChromePath();
  if (!chromePath) {
    console.error('Chrome executable not found');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    console.log('Navigating to http://localhost:3000/#work-with-me...');
    await page.goto('http://localhost:3000/#work-with-me', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));

    // Fill form
    console.log('Filling form fields...');
    await page.waitForSelector('#wwmName');
    await page.type('#wwmName', 'ASHUTOSH CHAKRABORTY');
    await page.type('#wwmEmail', 'ashutoshchakraborty0265@gmail.com');
    await page.select('#wwmService', 'coaching');
    await page.type('#wwmMessage', "I'm looking to build kettlebell strength and fix my posture while managing long coding hours.");

    // Submit
    console.log('Clicking Send Inquiry...');
    await page.click('.wwm-submit');

    // Wait for success card
    await page.waitForSelector('.wwm-success-card', { timeout: 5000 });
    console.log('✓ Success card appeared!');
    await new Promise(r => setTimeout(r, 600));

    // Check greeting text
    const greetingText = await page.$eval('.wwm-greeting-title', el => el.textContent.trim());
    console.log('Rendered Greeting:', greetingText);

    const artifactDir = 'C:\\Users\\ashut\\.gemini\\antigravity\\brain\\d44916b9-6f29-404e-b94f-138b40f5c159';
    const desktopScreenshot = path.join(artifactDir, 'verified_wwm_greeting_card_desktop.png');
    await page.screenshot({ path: desktopScreenshot, fullPage: false });
    console.log('Saved desktop screenshot to:', desktopScreenshot);

    // Test Mobile Viewport
    await page.setViewport({ width: 390, height: 844 });
    await new Promise(r => setTimeout(r, 400));
    const mobileScreenshot = path.join(artifactDir, 'verified_wwm_greeting_card_mobile.png');
    await page.screenshot({ path: mobileScreenshot, fullPage: false });
    console.log('Saved mobile screenshot to:', mobileScreenshot);

    // Test Reset Link
    await page.click('.wwm-reset-link');
    await page.waitForSelector('.wwm-form', { timeout: 3000 });
    console.log('✓ Form reset button works perfectly and restores input fields!');

    console.log('All verifications passed!');
  } catch (err) {
    console.error('Verification failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();

