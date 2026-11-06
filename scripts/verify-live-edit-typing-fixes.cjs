const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const ARTIFACTS_DIR = 'C:\\Users\\ashut\\.gemini\\antigravity\\brain\\d44916b9-6f29-404e-b94f-138b40f5c159';

async function runExhaustiveLiveEditTests() {
  console.log('====================================================');
  console.log('STARTING EXHAUSTIVE LIVE EDIT EDITING VERIFICATION');
  console.log('====================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const testResults = [];

  try {
    // Navigate to live edit mode
    console.log(`Navigating to ${BASE_URL}/?edit=true#home ...`);
    await page.goto(`${BASE_URL}/?edit=true#home`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    // Ensure edit mode toolbar is present
    const toolbarPresent = await page.evaluate(() => !!document.querySelector('.live-admin-toolbar'));
    console.log(`Live admin toolbar present: ${toolbarPresent}`);
    if (!toolbarPresent) {
      throw new Error('Live editor toolbar not found!');
    }

    // -------------------------------------------------------------------------
    // TEST 1: Continuous Typing Character by Character (Hero Headline)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 1: Continuous Typing Character by Character ---');
    const heroSel = '[data-content-key="hero.line1"]';
    await page.waitForSelector(heroSel);
    await page.click(heroSel);
    await new Promise(r => setTimeout(r, 150));

    // Move to end
    await page.keyboard.press('End');
    const beforeTest1 = await page.evaluate((sel) => document.querySelector(sel).innerText, heroSel);
    console.log(`Initial text before Test 1: "${beforeTest1}"`);

    const typingString = ' PRO COACH';
    for (const char of typingString) {
      await page.keyboard.type(char);
      await new Promise(r => setTimeout(r, 30));
    }

    const afterTest1 = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      const selObj = window.getSelection();
      return {
        text: el.innerText,
        anchorOffset: selObj.anchorOffset,
        focusOffset: selObj.focusOffset,
        length: el.innerText.length
      };
    }, heroSel);

    console.log('After continuous typing:', afterTest1);
    const test1Passed = afterTest1.text.endsWith(' PRO COACH') && afterTest1.focusOffset === afterTest1.length;
    testResults.push({
      test: '1. Continuous Sequential Typing',
      expected: beforeTest1 + ' PRO COACH',
      actual: afterTest1.text,
      passed: test1Passed
    });
    console.log(`Test 1 Passed: ${test1Passed}`);

    // -------------------------------------------------------------------------
    // TEST 2: Character-by-Character Backspace Deletion
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: Character-by-Character Backspace ---');
    // Delete ' COACH' (6 chars)
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Backspace');
      await new Promise(r => setTimeout(r, 30));
    }

    const afterTest2 = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      const selObj = window.getSelection();
      return {
        text: el.innerText,
        anchorOffset: selObj.anchorOffset,
        focusOffset: selObj.focusOffset,
        length: el.innerText.length
      };
    }, heroSel);

    console.log('After 6 Backspaces:', afterTest2);
    const test2Passed = afterTest2.text.endsWith(' PRO') && afterTest2.focusOffset === afterTest2.length;
    testResults.push({
      test: '2. Backspace Deletion at Caret Point',
      expected: beforeTest1 + ' PRO',
      actual: afterTest2.text,
      passed: test2Passed
    });
    console.log(`Test 2 Passed: ${test2Passed}`);

    // -------------------------------------------------------------------------
    // TEST 3: Middle-of-String Insertion and Navigation
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Middle-of-String Insertion ---');
    // Move 4 characters back into the middle (before ' PRO')
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('ArrowLeft');
    }

    const caretInMiddle = await page.evaluate(() => {
      const selObj = window.getSelection();
      return { offset: selObj.focusOffset };
    });
    console.log('Caret in middle offset:', caretInMiddle.offset);

    // Type 'DAILY ' in the middle
    await page.keyboard.type('DAILY ');
    await new Promise(r => setTimeout(r, 100));

    const afterTest3 = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      const selObj = window.getSelection();
      return {
        text: el.innerText,
        normalized: el.innerText.replace(/\u00a0/g, ' '),
        anchorOffset: selObj.anchorOffset,
        focusOffset: selObj.focusOffset
      };
    }, heroSel);

    console.log('After middle insertion:', afterTest3);
    const test3Passed = afterTest3.normalized.includes('DAILY  PRO') || afterTest3.normalized.includes('DAILY PRO');
    testResults.push({
      test: '3. Middle-of-String Insertion',
      actual: afterTest3.normalized,
      passed: test3Passed
    });
    console.log(`Test 3 Passed: ${test3Passed}`);

    // -------------------------------------------------------------------------
    // TEST 4: Delete Key (Forward Deletion)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: Forward Delete Key ---');
    // Caret is currently right before ' PRO'. Press Delete twice
    await page.keyboard.press('Delete');
    await new Promise(r => setTimeout(r, 30));
    await page.keyboard.press('Delete');
    await new Promise(r => setTimeout(r, 30));

    const afterTest4 = await page.evaluate((sel) => document.querySelector(sel).innerText.replace(/\u00a0/g, ' '), heroSel);
    console.log('After 2 Forward Deletes:', afterTest4);
    const test4Passed = afterTest4.includes('DAILY RO') || afterTest4.includes('DAILYRO');
    testResults.push({
      test: '4. Forward Delete Key',
      actual: afterTest4,
      passed: test4Passed
    });
    console.log(`Test 4 Passed: ${test4Passed}`);

    // -------------------------------------------------------------------------
    // TEST 5: Select All (Ctrl+A) and Complete Replacement
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: Select All (Ctrl+A) and Complete Replacement ---');
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await new Promise(r => setTimeout(r, 50));

    const replacementText = 'Elite Strength Training';
    await page.keyboard.type(replacementText);
    await new Promise(r => setTimeout(r, 150));

    const afterTest5 = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      const selObj = window.getSelection();
      return {
        text: el.innerText,
        focusOffset: selObj.focusOffset,
        length: el.innerText.length
      };
    }, heroSel);

    console.log('After Ctrl+A and replacement:', afterTest5);
    const test5Passed = afterTest5.text === replacementText && afterTest5.focusOffset === replacementText.length;
    testResults.push({
      test: '5. Select All (Ctrl+A) & Replacement',
      expected: replacementText,
      actual: afterTest5.text,
      passed: test5Passed
    });
    console.log(`Test 5 Passed: ${test5Passed}`);

    // -------------------------------------------------------------------------
    // TEST 6: Multi-line Paragraph Editing in About Section
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: Multi-line Paragraph Editing in About Section ---');
    const aboutPSel = '[data-content-key="about.p1"]';
    await page.waitForSelector(aboutPSel);
    await page.click(aboutPSel);
    await new Promise(r => setTimeout(r, 150));

    // For multi-line elements, press Control+End to navigate to the exact end of the block
    await page.keyboard.down('Control');
    await page.keyboard.press('End');
    await page.keyboard.up('Control');

    await page.keyboard.type(' Tested live.');
    await new Promise(r => setTimeout(r, 100));

    const aboutAfter = await page.evaluate((sel) => document.querySelector(sel).innerText, aboutPSel);
    console.log(`About p1 after typing: "${aboutAfter.substring(0, 70)}...[ends with: ${aboutAfter.slice(-20)}]"`);
    const test6Passed = aboutAfter.endsWith('Tested live.');
    testResults.push({
      test: '6. Paragraph Editing in About Section',
      passed: test6Passed,
      actualEndsWith: aboutAfter.slice(-20)
    });
    console.log(`Test 6 Passed: ${test6Passed}`);

    // -------------------------------------------------------------------------
    // TEST 7: Button Direct Text Editing
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 7: Button Direct Text Editing ---');
    const heroBtnSpan = '[data-button-key="hero.cta"] span[contenteditable]';
    await page.waitForSelector(heroBtnSpan);
    await page.click(heroBtnSpan);
    await new Promise(r => setTimeout(r, 150));

    // Select all in button span
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.keyboard.type('Start Journey Now');
    await new Promise(r => setTimeout(r, 150));

    const btnTextAfter = await page.evaluate((sel) => document.querySelector(sel).innerText, heroBtnSpan);
    console.log('Button text after typing:', btnTextAfter);
    const test7Passed = btnTextAfter === 'Start Journey Now';
    testResults.push({
      test: '7. Button Text Direct Editing',
      expected: 'Start Journey Now',
      actual: btnTextAfter,
      passed: test7Passed
    });
    console.log(`Test 7 Passed: ${test7Passed}`);

    // -------------------------------------------------------------------------
    // TEST 8: Save Draft and Persistence on Reload
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 8: Save Draft and Persistence ---');
    const saveBtnSel = '.live-btn-save';
    await page.waitForSelector(saveBtnSel);
    await page.click(saveBtnSel);
    await new Promise(r => setTimeout(r, 1200));

    // Reload page to verify persistence
    console.log('Reloading page with ?edit=true to test persistence...');
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    const persistedHero = await page.evaluate((sel) => document.querySelector(sel).innerText, heroSel);
    const persistedAbout = await page.evaluate((sel) => document.querySelector(sel).innerText, aboutPSel);
    const persistedBtn = await page.evaluate((sel) => document.querySelector(sel).innerText, heroBtnSpan);

    console.log(`Persisted Hero: "${persistedHero}"`);
    console.log(`Persisted About: "...${persistedAbout.slice(-30)}"`);
    console.log(`Persisted Button: "${persistedBtn}"`);

    const test8Passed = persistedHero === replacementText &&
                        persistedAbout.endsWith('Tested live.') &&
                        persistedBtn === 'Start Journey Now';

    testResults.push({
      test: '8. Draft Save & Persistence Across Reload',
      passed: test8Passed
    });
    console.log(`Test 8 Passed: ${test8Passed}`);

    // -------------------------------------------------------------------------
    // Take Full Visual Evidence Screenshot
    // -------------------------------------------------------------------------
    const screenshotPath = path.join(ARTIFACTS_DIR, 'verified_live_edit_smooth_typing.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Screenshot saved to: ${screenshotPath}`);

    // Clean up test edits back to original default content so site remains clean
    console.log('\nReverting test edits back to clean default site content...');
    await page.evaluate(() => {
      localStorage.removeItem('elrx_db_content_draft');
      localStorage.removeItem('elrx_db_content');
      localStorage.removeItem('elrx_typography_overrides');
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    const finalHero = await page.evaluate((sel) => document.querySelector(sel).innerText, heroSel);
    console.log(`Cleaned up Hero text: "${finalHero}"`);

    console.log('\n====================================================');
    console.log('ALL LIVE EDIT VERIFICATION TESTS COMPLETED');
    console.log('====================================================');
    console.table(testResults);

    const allPassed = testResults.every(t => t.passed);
    console.log(`\nOVERALL VERIFICATION RESULT: ${allPassed ? 'ALL TESTS PASSED (100%)' : 'SOME TESTS FAILED'}`);

  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    await browser.close();
  }
}

runExhaustiveLiveEditTests().catch(console.error);
