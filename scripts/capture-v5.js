// Fresh showcase capture: all 5 themes + GIF frames (new visuals)
const { chromium } = require('/home/hermes/.hermes/hermes-agent/node_modules/playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 820 } });
  await p.goto('http://127.0.0.1:8741/?capture=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2000);
  await p.evaluate(() => {
    const w = document.getElementById('welcome');
    if (w && !w.classList.contains('hidden')) w.classList.add('hidden');
    const bx = document.querySelector('.banner-x'); if (bx) bx.click();
  });
  // 5 themes via the theme switcher
  for (const t of ['office', 'nous', 'dunder', 'batman', 'starwars']) {
    await p.evaluate((th) => {
      const btn = document.querySelector(`.theme-btn[data-theme-name="${th}"]`);
      if (btn) btn.click();
    }, t);
    await p.waitForTimeout(6000); // agents spawn + reach desks
    await p.screenshot({ path: `docs/screenshots/${t}-v5.png` });
  }
  // GIF: office theme, agents working (12s @ ~8fps)
  await p.evaluate(() => {
    const btn = document.querySelector('.theme-btn[data-theme-name="office"]');
    if (btn) btn.click();
  });
  await p.waitForTimeout(5000);
  fs.mkdirSync('/tmp/gif-frames', { recursive: true });
  for (let i = 0; i < 96; i++) {
    await p.screenshot({ path: '/tmp/gif-frames/f' + String(i).padStart(3, '0') + '.png' });
    await p.waitForTimeout(125);
  }
  await b.close();
  console.log('capture done');
})();
