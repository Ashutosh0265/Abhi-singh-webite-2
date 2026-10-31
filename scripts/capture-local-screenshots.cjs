const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const LOCAL_SS_DIR = path.join(__dirname, 'screenshots-local');
if (!fs.existsSync(LOCAL_SS_DIR)) {
  fs.mkdirSync(LOCAL_SS_DIR, { recursive: true });
}

async function run() {
  console.log('Starting preview server...');
  const server = spawn('cmd.exe', ['/c', 'npm.cmd run preview -- --port 4199'], {
    cwd: path.join(__dirname, '..')
  });

  // Wait 3 seconds for server to start
  await new Promise(r => setTimeout(r, 3000));

  try {
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    const targets = [
      { name: 'homepage', url: 'http://localhost:4199/' },
      { name: 'admin-login', url: 'http://localhost:4199/admin.html' }
    ];

    for (const vp of [{ name: 'desktop-1440', w: 1440, h: 900 }, { name: 'mobile-390', w: 390, h: 844 }]) {
      await page.setViewport({ width: vp.w, height: vp.h });
      for (const target of targets) {
        try {
          await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
          await new Promise(r => setTimeout(r, 1000));
          const outPath = path.join(LOCAL_SS_DIR, `${target.name}-${vp.name}.png`);
          await page.screenshot({ path: outPath, fullPage: false });
          console.log(`Saved screenshot: ${outPath}`);
        } catch (e) {
          console.error(`Failed ${target.name} @ ${vp.name}:`, e.message);
        }
      }
    }

    await browser.close();
  } finally {
    server.kill();
    // Kill any remaining on port 4199 if needed
  }
}

run().catch(console.error);
