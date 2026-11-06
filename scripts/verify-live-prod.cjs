const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('--- Testing Live Production: https://abhisingh-website.vercel.app ---');
  await page.goto('https://abhisingh-website.vercel.app', { waitUntil: 'networkidle2' });

  // 1. Header checks
  const avatarSrc = await page.$eval('.nav-avatar img', el => el.getAttribute('src')).catch(() => null);
  const brandBy = await page.$eval('.nav-by', el => el.textContent.trim()).catch(() => null);
  const brandName = await page.$eval('.nav-name', el => el.textContent.trim()).catch(() => null);
  const links = await page.$$eval('.nav-links a', els => els.map(a => a.textContent.trim()));
  const ctaBtn = await page.$eval('.nav-cta', el => el.textContent.trim()).catch(() => null);
  console.log('Header Avatar Image:', avatarSrc);
  console.log('Header Byline:', brandBy, brandName);
  console.log('Header Links:', links);
  console.log('Header CTA:', ctaBtn);

  // 2. Section 5 "What I am working on now"
  const section5Heading = await page.$eval('.working-on h2', el => el.textContent.trim()).catch(() => null);
  const itemLabels = await page.$$eval('.working-list .item-label', els => els.map(e => e.textContent.trim()));
  const itemTitles = await page.$$eval('.working-list .item-title', els => els.map(e => e.textContent.trim()));
  const itemDescs = await page.$$eval('.working-list .item-desc', els => els.map(e => e.textContent.trim()));
  const itemCtas = await page.$$eval('.working-list a, .working-list button', els => els.map(e => e.textContent.trim()));

  console.log('Section 5 Heading:', section5Heading);
  console.log('Item Labels:', itemLabels);
  console.log('Item Titles:', itemTitles);
  console.log('Item Descs:', itemDescs);
  console.log('Item CTAs:', itemCtas);

  // 3. Footer checks
  const footerText = await page.$eval('footer', el => el.textContent).catch(() => '');
  console.log('Footer contains copyright:', footerText.includes('© 2026 Abhi Singh'));
  console.log('Footer contains abhisingh.me:', footerText.includes('abhisingh.me'));
  const footerLinks = await page.$$eval('footer a', els => els.map(e => e.textContent.trim()));
  console.log('Footer links:', footerLinks);

  // Take screenshot of Section 5
  const section5Handle = await page.$('.working-on');
  if (section5Handle) {
    await section5Handle.screenshot({ path: 'C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159/verified_prod_section5.png' });
  }

  // 4. Test Store free download order & fallback button on live production
  await page.goto('https://abhisingh-website.vercel.app/#store', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  const productCount = await page.$$eval('.product-card', els => els.length);
  console.log('Store product count:', productCount);

  // Open first free product modal
  const clicked = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.product-card'));
    for (const card of cards) {
      const title = card.querySelector('.card-title')?.innerText || '';
      if (title.toLowerCase().includes('habits')) {
        const btn = card.querySelector('.btn-card') || card;
        btn.click();
        return true;
      }
    }
    return false;
  });
  console.log('Product card clicked:', clicked);

  await page.waitForSelector('.checkout-modal-box', { visible: true, timeout: 5000 });
  console.log('Checkout modal opened successfully');

  // Fill customer form
  await page.type('#checkoutName', 'Production Verifier');
  await page.type('#checkoutEmail', 'production.test@example.com');
  await new Promise(r => setTimeout(r, 500));

  // Click submit via evaluate to ensure clean synthetic click on form
  await page.evaluate(() => {
    const submitBtn = document.querySelector('.checkout-submit-btn');
    if (submitBtn) submitBtn.click();
  });

  // Wait for completed wrap
  await page.waitForFunction(() => !!document.querySelector('.checkout-completed-wrap'), { timeout: 10000 });
  console.log('Order completed successfully on live production!');

  const orderDetails = await page.evaluate(() => {
    const wrap = document.querySelector('.checkout-completed-wrap');
    const dlBtn = wrap?.querySelector('a[download]');
    return {
      text: wrap?.innerText,
      downloadHref: dlBtn?.getAttribute('href'),
      downloadText: dlBtn?.innerText
    };
  });
  console.log('Order Details:', orderDetails);

  await page.screenshot({ path: 'C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159/verified_prod_order_success.png' });

  await browser.close();
  console.log('--- ALL LIVE PRODUCTION CHECKS COMPLETED SUCCESSFULLY ---');
})();
