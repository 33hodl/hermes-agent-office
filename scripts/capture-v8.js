// Fresh showcase capture v8: unified chibi sprites, single-bubble, per-theme probe
const { chromium } = require('/home/hermes/.hermes/hermes-agent/node_modules/playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 820 } });
  await p.goto('http://127.0.0.1:8741/?cap7=' + Date.now(), { waitUntil: 'domcontentloaded' });
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

  const state = async () => p.evaluate(() => {
    const eng = window.__eng;
    const r = eng.renderer;
    return {
      names: [...eng.agents.values()].map(a => a.name),
      moving: [...eng.agents.values()].filter(a => a.moving || a.status === 'entering').length,
      atDesk: [...eng.agents.values()].filter(a => a.home && Math.hypot(a.x - a.home.x, a.y - a.home.y) < 0.4 && !a.moving).length,
      spriteKeys: [...eng.agents.values()].map(a => {
        const key = (a.name || '').toLowerCase();
        const spr = r.sprites[key];
        return key + ':' + (spr && spr.complete && spr.naturalWidth > 0 ? 'img' : 'MISSING');
      }),
      scale: eng.scale,
    };
  });

  const settleOffice = async () => {
    for (let i = 0; i < 30; i++) {
      await p.waitForTimeout(1500);
      const st = await state();
      if (st.names.length >= 6) break;
    }
    for (let i = 0; i < 20; i++) {
      await p.waitForTimeout(1500);
      const st = await state();
      if (st.moving === 0) break;
    }
  };

  const switchAndShoot = async (theme) => {
    await p.evaluate((th) => {
      const btn = document.querySelector(`.theme-btn[data-theme-name="${th}"]`);
      if (btn) btn.click();
    }, theme);
    let ok = false;
    for (let i = 0; i < 25; i++) {
      await p.waitForTimeout(1500);
      const st = await state();
      const cast = casts[theme];
      const castMatch = st.names.length >= 6 && st.names.every(n => cast.includes(n));
      if (castMatch && st.moving === 0) { ok = true; break; }
      await p.evaluate(() => {
        for (const a of window.__eng.agents.values()) {
          if (a.moving || a.status === 'entering') { a.x = a.home.x; a.y = a.home.y; a.moving = false; a._seekDesk = false; }
        }
      });
    }
    const st = await state();
    console.log(`${theme}: castMatch=${ok} agents=${st.names.length} atDesk=${st.atDesk} moving=${st.moving} scale=${st.scale}`);
    console.log(`  sprites: ${st.spriteKeys.join(', ')}`);
    await p.waitForTimeout(500);
    await p.screenshot({ path: `docs/screenshots/${theme}-v8.png` });
  };

  await settleOffice();
  for (const th of ['office', 'nous', 'dunder', 'batman', 'starwars']) {
    await switchAndShoot(th);
  }
  await switchAndShoot('office');

  // GIF frames (office theme, working)
  fs.mkdirSync('/tmp/gif-frames-v7', { recursive: true });
  for (let i = 0; i < 96; i++) {
    await p.screenshot({ path: '/tmp/gif-frames-v7/f' + String(i).padStart(3, '0') + '.png' });
    await p.waitForTimeout(125);
  }
  await b.close();
  console.log('capture v8 done');
})();
