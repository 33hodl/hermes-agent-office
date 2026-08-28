// Fresh showcase capture v2: wait for cast restaff + desks before each shot
const { chromium } = require('/home/hermes/.hermes/hermes-agent/node_modules/playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 820 } });
  await p.goto('http://127.0.0.1:8741/?cap2=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2000);
  await p.evaluate(() => {
    const w = document.getElementById('welcome');
    if (w && !w.classList.contains('hidden')) w.classList.add('hidden');
    const bx = document.querySelector('.banner-x'); if (bx) bx.click();
  });

  const casts = {
    office: ['Uma', 'Xyla', 'Hazel', 'Dash', 'Pixel', 'Coco', 'Gizmo', 'Yara'],
    nous: ['Uma', 'Xyla', 'Hazel', 'Dash', 'Pixel', 'Coco', 'Gizmo', 'Yara'],
    dunder: ['Michael', 'Dwight', 'Jim', 'Pam', 'Angela', 'Kevin', 'Stanley', 'Phyllis'],
    batman: ['Batman', 'Robin', 'Catwoman', 'Joker', 'Bane', 'Nightwing', 'Batgirl', 'Alfred'],
    starwars: ['Luke', 'Leia', 'Han', 'Chewbacca', 'R2-D2', 'C-3PO', 'Obi-Wan', 'Yoda'],
  };

  // settle the office theme first (agents spawn over ~25s)
  const settleOffice = async () => {
    for (let i = 0; i < 30; i++) {
      await p.waitForTimeout(1500);
      const names = await p.evaluate(() => [...window.__eng.agents.values()].map(a => a.name));
      if (names.length >= 6) break;
    }
    // wait until all are at homes (not moving)
    for (let i = 0; i < 20; i++) {
      await p.waitForTimeout(1500);
      const moving = await p.evaluate(() => [...window.__eng.agents.values()].filter(a => a.moving || a.status === 'entering').length);
      if (moving === 0) break;
    }
  };

  const switchAndShoot = async (theme) => {
    // click theme
    await p.evaluate((th) => {
      const btn = document.querySelector(`.theme-btn[data-theme-name="${th}"]`);
      if (btn) btn.click();
    }, theme);
    // wait for cast names to match (restaff) + agents to stop moving
    let ok = false;
    for (let i = 0; i < 25; i++) {
      await p.waitForTimeout(1500);
      const st = await p.evaluate(() => {
        const eng = window.__eng;
        return {
          names: [...eng.agents.values()].map(a => a.name),
          moving: [...eng.agents.values()].filter(a => a.moving || a.status === 'entering').length,
        };
      });
      const cast = casts[theme];
      const castMatch = st.names.length >= 6 && st.names.every(n => cast.includes(n));
      if (castMatch && st.moving === 0) { ok = true; break; }
      // force-home any stragglers so the shot is clean even if demo races
      await p.evaluate(() => {
        for (const a of window.__eng.agents.values()) {
          if (a.moving || a.status === 'entering') { a.x = a.home.x; a.y = a.home.y; a.moving = false; a._seekDesk = false; }
        }
      });
    }
    console.log(`${theme}: castMatch=${ok} names=${JSON.stringify(await p.evaluate(() => [...window.__eng.agents.values()].map(a => a.name)))}`);
    await p.waitForTimeout(500);
    await p.screenshot({ path: `docs/screenshots/${theme}-v6.png` });
  };

  await settleOffice();
  await switchAndShoot('office');
  await switchAndShoot('nous');
  await switchAndShoot('dunder');
  await switchAndShoot('batman');
  await switchAndShoot('starwars');

  // GIF: office theme working
  await switchAndShoot('office');
  fs.mkdirSync('/tmp/gif-frames', { recursive: true });
  for (let i = 0; i < 96; i++) {
    await p.screenshot({ path: '/tmp/gif-frames/f' + String(i).padStart(3, '0') + '.png' });
    await p.waitForTimeout(125);
  }
  await b.close();
  console.log('capture v6 done');
})();
