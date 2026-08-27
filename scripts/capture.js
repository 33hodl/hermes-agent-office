// Regenerate showcase screenshots + GIF frames (run by refresh-screenshots.sh)
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 820 } });
  await p.goto('http://127.0.0.1:8741/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2000);
  await p.evaluate(() => { const w = document.getElementById('welcome'); if (w && !w.classList.contains('hidden')) w.classList.add('hidden'); });
  for (const t of ['office', 'nous', 'dunder']) {
    await p.evaluate(th => applyTheme(th), t);
    await p.waitForTimeout(2500);
    await p.screenshot({ path: 'docs/screenshots/' + t + '.png' });
  }
  await p.evaluate(() => applyTheme('office'));
  await p.waitForTimeout(1500);
  fs.mkdirSync('/tmp/gif-frames', { recursive: true });
  for (let i = 0; i < 60; i++) {
    await p.screenshot({ path: '/tmp/gif-frames/f' + String(i).padStart(3, '0') + '.png' });
    await p.waitForTimeout(125);
  }
  for (const f of ['batman', 'starwars']) {
    await p.click('#creator-btn');
    await p.waitForTimeout(400);
    await p.selectOption('#creator-franchise', f === 'batman' ? 'batman' : 'starwars');
    await p.click('#creator-build');
    await p.waitForFunction(() => {
      const r = window.__eng.renderer;
      return !!(r.customBackdrop && r.customBackdrop.complete && r.customBackdrop.naturalWidth > 0);
    }, { timeout: 60000 });
    await p.waitForTimeout(5000);
    await p.screenshot({ path: 'docs/screenshots/custom-' + f + '.png' });
  }
  await b.close();
  console.log('capture done');
})();
