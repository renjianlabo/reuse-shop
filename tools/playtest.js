/* ブラウザで最後まで自動で遊び、要所でスクリーンショットを撮る
   node tools/playtest.js [出力フォルダ] [mobile|small|short|desktop] [回数] */
const { chromium, devices } = require('playwright');
const out = process.argv[2] || 'shots';
const mode = process.argv[3] || 'mobile';
const runs = Number(process.argv[4] || 1);
const fs = require('fs');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const ctxOpts = mode === 'mobile' ? { ...devices['iPhone 13'] } : mode === 'small' ? { ...devices['iPhone SE'] } : mode === 'short' ? { viewport: { width: 390, height: 660 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 } : { viewport: { width: 1440, height: 900 } };
  const context = await browser.newContext(ctxOpts);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => {
    // 文字送りと演出を速くする
    window.matchMedia = (q) => ({ matches: q.includes('reduce'), addListener() {}, removeListener() {} });
  });
  await page.goto('http://localhost:8765/', { waitUntil: 'load' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/${mode}-00-title.png` });

  const shot = {};
  const once = async (name) => { if (!shot[name]) { shot[name] = 1; await page.screenshot({ path: `${out}/${mode}-${name}.png` }); } };
  const endings = {};

  for (let r = 0; r < runs; r++) {
    if (r === 0) await page.click('#btnNew'); else await page.click('#btnAgain');
    let steps = 0;
    while (steps++ < 2000) {
      const st = await page.evaluate(() => ({
        ending: !document.getElementById('scrEnding').hidden,
        month: !document.getElementById('ovMonth').hidden,
        memo: !document.getElementById('ovMemo').hidden,
        receipt: !document.getElementById('ovReceipt').hidden,
        choices: !document.getElementById('choices').hidden,
        chips: document.getElementById('chips').children.length,
        narr: document.getElementById('dialog').classList.contains('narration')
      }));
      if (st.ending) break;
      if (st.month) { await once('01-month'); await page.click('#ovMonth'); await page.waitForTimeout(60); continue; }
      if (st.memo) { if (!shot['04-memo']) await page.waitForTimeout(400); await once('04-memo'); await page.click('#btnMemo'); continue; }
      if (st.receipt) { await page.waitForTimeout(r === 0 ? 1200 : 10); await once('05-receipt'); await page.click('#btnReceipt'); continue; }
      if (st.choices) {
        await once('02-choices');
        const btns = await page.$$('#choices .tagbtn:not([disabled])');
        await btns[Math.floor(Math.random() * btns.length)].click();
        await page.waitForTimeout(220);
        continue;
      }
      if (st.chips) await once('03-result');
      if (st.narr) await once('06-narration');
      await page.click('#dialog');
    }
    const id = await page.evaluate(() => window.__game.state.ending);
    endings[id] = (endings[id] || 0) + 1;
    if (r === 0) {
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${out}/${mode}-07-ending.png`, fullPage: false });
      await page.click('#btnToType');
      await page.screenshot({ path: `${out}/${mode}-08-type.png` });
      await page.click('#btnTypeTerms');
      await page.screenshot({ path: `${out}/${mode}-09-terms.png` });
      await page.click('#btnReadBack');
    } else {
      await page.click('#btnToType');
    }
  }
  console.log('結末:', JSON.stringify(endings));
  console.log('エラー:', errors.length ? errors.join('\n') : 'なし');
  await browser.close();
})();
