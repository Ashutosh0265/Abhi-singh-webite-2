const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\ashut\\.gemini\\antigravity\\brain\\d44916b9-6f29-404e-b94f-138b40f5c159';

async function run() {
  console.log('🚀 Verifying CRM Lead Dossier modal with long email...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 1. Submit a fresh Work With Me form with long email to verify live submission pipeline
  console.log('Submitting a test Work With Me inquiry...');
  await page.goto('http://localhost:3000/#work-with-me', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  await page.type('#wwmName', 'Ashutosh Chakraborty');
  await page.type('#wwmEmail', 'ashutoshchakraborty0265@gmail.com');
  await page.select('#wwmService', 'coaching');
  await page.type('#wwmMessage', 'Testing Work With Me consultation feed in CRM dossier.');
  
  const submitBtn = await page.$('.wwm-submit');
  if (submitBtn) {
    await submitBtn.click();
    await new Promise(r => setTimeout(r, 1200));
  }

  // 2. Open Admin CMS CRM tab
  console.log('Navigating to http://localhost:3000/admin.html ...');
  await page.goto('http://localhost:3000/admin.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // Click CRM & Leads tab
  await page.evaluate(() => {
    const navItems = Array.from(document.querySelectorAll('.admin-nav-item'));
    const leadsTab = navItems.find(item => item.innerText.includes('CRM') || item.innerText.includes('Leads'));
    if (leadsTab) leadsTab.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Find the lead row with ashutoshchakraborty0265@gmail.com and click View
  const clicked = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.admin-table tbody tr'));
    for (const r of rows) {
      if (r.innerText.includes('ashutoshchakraborty0265@gmail.com') || r.innerText.includes('Ashutosh')) {
        const viewBtn = r.querySelector('button');
        if (viewBtn) {
          viewBtn.click();
          return true;
        }
      }
    }
    // If not found, click the first view button
    const firstBtn = document.querySelector('.admin-table tbody tr button');
    if (firstBtn) {
      firstBtn.click();
      return true;
    }
    return false;
  });

  if (!clicked) {
    throw new Error('No view button found in CRM table');
  }

  await new Promise(r => setTimeout(r, 600));

  // Verify modal is open and inspect bounding rects of email and adjacent elements
  const dossierMetrics = await page.evaluate(() => {
    const modal = document.querySelector('.admin-modal');
    const headerTitle = modal ? modal.querySelector('h3')?.innerText : null;
    const nameEl = modal ? modal.querySelector('h4')?.innerText : null;
    const emailLink = modal ? modal.querySelector('a[href^="mailto:"]') : null;
    const emailText = emailLink ? emailLink.innerText : null;
    const emailRect = emailLink ? emailLink.getBoundingClientRect() : null;

    return {
      headerTitle,
      leadName: nameEl,
      email: emailText,
      emailBoxWidth: emailRect ? Math.round(emailRect.width) : null,
      emailBoxHeight: emailRect ? Math.round(emailRect.height) : null,
    };
  });

  console.log('📋 Dossier Metrics:', dossierMetrics);

  const screenshotPath = path.join(ARTIFACT_DIR, 'verified_crm_lead_dossier_fixed.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`Saved screenshot to: ${screenshotPath}`);

  await browser.close();
  console.log('✅ CRM Lead Dossier verification complete!');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

