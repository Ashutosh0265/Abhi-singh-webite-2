const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const path = require('path');
const ARTIFACT_DIR = 'C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/admin.html', { waitUntil: 'networkidle0' });

  // 1. Click "+ Add New Product"
  console.log('Testing Add New Product modal...');
  const addProdBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Add New Product'));
  });
  await addProdBtn.click();
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'modal_add_product.png') });
  
  // Close modal
  const cancelBtn1 = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('.admin-modal button')).find(b => b.innerText.includes('Cancel') || b.innerText.includes('✕'));
  });
  await cancelBtn1.click();
  await new Promise(r => setTimeout(r, 400));

  // 2. Click "+ Write Article / Newsletter"
  console.log('Testing Write Article modal...');
  const addPostBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Write Article'));
  });
  await addPostBtn.click();
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'modal_write_article.png') });
  
  // Close modal
  const cancelBtn2 = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('.admin-modal button')).find(b => b.innerText.includes('Cancel') || b.innerText.includes('✕'));
  });
  await cancelBtn2.click();
  await new Promise(r => setTimeout(r, 400));

  // 3. Test Products tab and Edit Product modal
  console.log('Testing Products tab & Edit modal...');
  await page.click('.admin-nav-item:nth-child(2)');
  await new Promise(r => setTimeout(r, 600));
  // Click first Edit button in table
  const editBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('.admin-table button')).find(b => b.innerText.trim() === 'Edit');
  });
  if (editBtn) {
    await editBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'modal_edit_product.png') });
    const cancelBtn3 = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('.admin-modal button')).find(b => b.innerText.includes('Cancel') || b.innerText.includes('✕'));
    });
    if (cancelBtn3) await cancelBtn3.click();
  }

  // 4. Test Lead Dossier modal on CRM Leads tab
  console.log('Testing CRM Leads tab...');
  await page.click('.admin-nav-item:nth-child(6)');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'tab_crm_leads.png') });

  // 5. Test Integration Settings inputs
  console.log('Testing Integrations tab...');
  await page.click('.admin-nav-item:nth-child(8)');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'tab_integrations_clean.png') });

  await browser.close();
  console.log('Finished testing all modals and tabs successfully.');
})();
