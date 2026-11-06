const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('Starting CMS browser verification test...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 900 });

    // 1. Navigate to admin login
    await page.goto('http://localhost:3000/admin.html', { waitUntil: 'networkidle0' });
    console.log('Navigated to /admin.html');

    // 2. Perform login
    await page.type('input[type="email"]', 'abhi@abhisingh.me');
    await page.type('input[type="password"]', 'Abhi@Admin2026!Secure');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1000));

    // Verify dashboard loaded
    const title = await page.$eval('.admin-header-title', (el) => el.innerText);
    console.log('Dashboard loaded, header title:', title);

    // 3. Switch to Blog & Newsletter Archive tab
    const blogTabBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('.admin-nav-item'));
      return btns.find((b) => b.innerText.includes('Blog & Archive'));
    });
    await blogTabBtn.asElement().click();
    await new Promise((r) => setTimeout(r, 800));

    // Screenshot of Blog table with Media column
    await page.screenshot({
      path: 'C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159/cms_blog_table_view.png',
    });
    console.log('Saved cms_blog_table_view.png');

    // 4. Click "+ Write Article"
    const writeBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.innerText.includes('+ Write Article'));
    });
    await writeBtn.asElement().click();
    await new Promise((r) => setTimeout(r, 800));

    // 5. Click "+ Custom Category"
    const customCatBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('.admin-link-btn'));
      return btns.find((b) => b.innerText.includes('Custom Category'));
    });
    await customCatBtn.asElement().click();
    await new Promise((r) => setTimeout(r, 400));

    // Type new category name "Recovery & Mobility"
    await page.type('.admin-category-creator-box input', 'Recovery & Mobility');
    const saveCatBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('.admin-category-creator-box button'));
      return btns.find((b) => b.innerText.includes('Save'));
    });
    await saveCatBtn.asElement().click();
    await new Promise((r) => setTimeout(r, 600));

    // Fill in article details
    const inputs = await page.$$('.admin-modal-body input[type="text"]');
    // inputs[0] is Article Title
    await inputs[0].type('Daily Kettlebell Joint Mobility Protocol');

    // inputs[2] is Publication Date
    await inputs[2].type('November 2026');

    // inputs[3] is Read Time
    await inputs[3].type('3 min read');

    // inputs[4] is Summary
    await inputs[4].type('How 8 minutes of daily kettlebell halo and armbar work restored my thoracic spine.');

    // Set video URL
    const videoInput = await page.evaluateHandle(() => {
      const allInputs = Array.from(document.querySelectorAll('input'));
      return allInputs.find((i) => (i.placeholder || '').includes('YouTube, Vimeo, or MP4'));
    });
    await videoInput.asElement().type('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

    // Set thumbnail URL
    const thumbInput = await page.evaluateHandle(() => {
      const allInputs = Array.from(document.querySelectorAll('input'));
      return allInputs.find((i) => (i.placeholder || '').includes('enter image URL'));
    });
    await thumbInput.asElement().type('assets/hyrox-mumbai.png');

    // Wait for live preview to render
    await new Promise((r) => setTimeout(r, 1000));

    // Screenshot of modal with Thumbnail preview, Video preview, and custom category
    await page.screenshot({
      path: 'C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159/cms_write_article_modal.png',
    });
    console.log('Saved cms_write_article_modal.png');

    // Save article
    const saveArticleBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('.admin-modal-footer button'));
      return btns.find((b) => b.innerText.includes('Save Article'));
    });
    await saveArticleBtn.asElement().click();
    await new Promise((r) => setTimeout(r, 1200));

    // Screenshot of table with the newly saved article
    await page.screenshot({
      path: 'C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159/cms_after_article_saved.png',
    });
    console.log('Saved cms_after_article_saved.png');

    // 6. Test public website to verify the new article and video player render!
    await page.goto('http://localhost:3000/#blog', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));

    await page.screenshot({
      path: 'C:/Users/ashut/.gemini/antigravity/brain/d44916b9-6f29-404e-b94f-138b40f5c159/public_blog_with_video_pill.png',
    });
    console.log('Saved public_blog_with_video_pill.png');

    console.log('ALL CMS BROWSER VERIFICATIONS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('Browser test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
