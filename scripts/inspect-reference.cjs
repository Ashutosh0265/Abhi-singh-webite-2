const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'laptop-1280', width: 1280, height: 800 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-360', width: 360, height: 740 }
];

const TARGET_PAGES = [
  { name: 'homepage', url: 'https://noahkagan.com/' },
  { name: 'about', url: 'https://noahkagan.com/about/' },
  { name: 'blog', url: 'https://noahkagan.com/blog/' },
  { name: 'join', url: 'https://noahkagan.com/join/' }
];

function rgbToHex(rgbStr) {
  if (!rgbStr) return '';
  const match = rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return rgbStr;
  const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
  const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
  const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`.toUpperCase();
}

async function extractStylesFromPage(page) {
  return await page.evaluate(() => {
    function getElementData(el) {
      if (!el) return null;
      const cs = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const parent = el.parentElement;
      const parentCs = parent ? window.getComputedStyle(parent) : null;

      const fsNum = parseFloat(cs.fontSize) || 0;
      const lhNum = parseFloat(cs.lineHeight) || (fsNum * 1.2);
      const lhRatio = fsNum > 0 ? (lhNum / fsNum).toFixed(2) : 'normal';

      return {
        tag: el.tagName.toLowerCase(),
        classes: el.className ? String(el.className).slice(0, 80) : '',
        id: el.id || '',
        text: (el.innerText || el.textContent || '').trim().slice(0, 70),
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontSizePx: parseFloat(cs.fontSize),
        fontWeight: cs.fontWeight,
        fontStyle: cs.fontStyle,
        color: cs.color,
        lineHeight: cs.lineHeight,
        lineHeightPx: parseFloat(cs.lineHeight) || null,
        lineHeightRatio: lhRatio,
        letterSpacing: cs.letterSpacing,
        textAlign: cs.textAlign,
        textTransform: cs.textTransform,
        marginTop: cs.marginTop,
        marginBottom: cs.marginBottom,
        paddingTop: cs.paddingTop,
        paddingBottom: cs.paddingBottom,
        width: `${rect.width.toFixed(1)}px`,
        maxWidth: cs.maxWidth,
        parentWidth: parent ? `${parent.getBoundingClientRect().width.toFixed(1)}px` : 'N/A',
        parentMaxWidth: parentCs ? parentCs.maxWidth : 'N/A'
      };
    }

    const results = {
      headings: {
        h1: Array.from(document.querySelectorAll('h1')).map(getElementData),
        h2: Array.from(document.querySelectorAll('h2')).slice(0, 10).map(getElementData),
        h3: Array.from(document.querySelectorAll('h3')).slice(0, 10).map(getElementData),
        h4: Array.from(document.querySelectorAll('h4')).slice(0, 8).map(getElementData),
        h5: Array.from(document.querySelectorAll('h5')).slice(0, 5).map(getElementData),
        h6: Array.from(document.querySelectorAll('h6')).slice(0, 5).map(getElementData),
      },
      paragraphs: Array.from(document.querySelectorAll('p')).filter(p => (p.innerText || '').trim().length > 15).slice(0, 8).map(getElementData),
      leadParagraph: getElementData(document.querySelector('.lead, .intro, p.large, .hero p, header p')),
      subheadings: Array.from(document.querySelectorAll('.subheading, .subtitle, h1 + p, h2 + p, .lead')).slice(0, 5).map(getElementData),
      eyebrows: Array.from(document.querySelectorAll('.eyebrow, .badge, .tag, [class*="label"], [class*="tag"]')).slice(0, 5).map(getElementData),
      quotes: Array.from(document.querySelectorAll('blockquote, blockquote p, q')).slice(0, 3).map(getElementData),
      listItems: Array.from(document.querySelectorAll('ul li, ol li')).slice(0, 5).map(getElementData),
      buttons: Array.from(document.querySelectorAll('button, a.btn, a.button, [role="button"], input[type="submit"]')).slice(0, 6).map(getElementData),
      links: Array.from(document.querySelectorAll('a:not(.btn):not(.button)')).filter(a => (a.innerText || '').trim().length > 3).slice(0, 5).map(getElementData),
      metadata: Array.from(document.querySelectorAll('.date, .meta, time, [class*="meta"], [class*="author"], [class*="date"]')).slice(0, 5).map(getElementData),
      navItems: Array.from(document.querySelectorAll('nav a, header a')).slice(0, 5).map(getElementData),
      footerText: Array.from(document.querySelectorAll('footer p, footer a, footer span')).slice(0, 5).map(getElementData),
      mainContainer: getElementData(document.querySelector('main, article, .container, #content, .content, .entry-content'))
    };

    return results;
  });
}

async function run() {
  console.log('Launching Chrome with puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const fullReport = {};

  try {
    const page = await browser.newPage();
    // Enable stealth user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // First find an individual article from blog
    let articleUrl = null;
    try {
      console.log('Visiting blog to discover an individual article...');
      await page.goto('https://noahkagan.com/blog/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      articleUrl = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('article a, .post a, .entry-title a, main a'));
        for (const l of links) {
          const href = l.href;
          if (href && href.startsWith('https://noahkagan.com/') && !href.includes('/blog/') && !href.includes('/about/') && !href.includes('/join/') && !href.includes('#')) {
            return href;
          }
        }
        return links[0] ? links[0].href : null;
      });
      console.log('Found article URL:', articleUrl);
    } catch (e) {
      console.warn('Could not discover article URL dynamically:', e.message);
    }

    const pagesToInspect = [...TARGET_PAGES];
    if (articleUrl) {
      pagesToInspect.push({ name: 'article', url: articleUrl });
    } else {
      pagesToInspect.push({ name: 'article', url: 'https://noahkagan.com/how-to-start-a-business/' });
    }

    for (const pageTarget of pagesToInspect) {
      console.log(`\n========================================\nInspecting page: ${pageTarget.name} (${pageTarget.url})`);
      fullReport[pageTarget.name] = { url: pageTarget.url, viewports: {} };

      for (const vp of VIEWPORTS) {
        console.log(`Setting viewport: ${vp.name} (${vp.width}x${vp.height})`);
        await page.setViewport({ width: vp.width, height: vp.height });
        
        try {
          await page.goto(pageTarget.url, { waitUntil: 'domcontentloaded', timeout: 35000 });
          // Brief pause for fonts and styles to settle
          await new Promise(r => setTimeout(r, 1200));

          const styles = await extractStylesFromPage(page);
          fullReport[pageTarget.name].viewports[vp.name] = styles;

          // Capture screenshot for key viewports
          if (vp.name === 'desktop-1440' || vp.name === 'mobile-390') {
            const ssPath = path.join(SCREENSHOT_DIR, `${pageTarget.name}-${vp.name}.png`);
            await page.screenshot({ path: ssPath, fullPage: false });
            console.log(`Saved screenshot: ${ssPath}`);
          }
        } catch (err) {
          console.error(`Error on ${pageTarget.name} @ ${vp.name}:`, err.message);
          fullReport[pageTarget.name].viewports[vp.name] = { error: err.message };
        }
      }
    }

    fs.writeFileSync(path.join(__dirname, 'reference-inspection-raw.json'), JSON.stringify(fullReport, null, 2));
    console.log('\nWrote full raw data to scripts/reference-inspection-raw.json');

  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('Fatal error in inspection script:', err);
  process.exit(1);
});
