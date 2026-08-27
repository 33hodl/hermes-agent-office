/* Hermes Agent Office — Theme 1 "Office" renderer.
 * Isometric pastel diorama (the viral reference look) with rich lighting:
 * AI-painted window with god rays, dust motes, soft shadows, squash & stretch.
 */
'use strict';

const TILE = 64;
const GRID = 10;

const OfficeRenderer = {
  name: 'office',

  init(eng) {
    this.agentsV = new Map();
    this.sprites = {};   // name -> HTMLImageElement (themed character art)
    this._loadSprites();
    this.backdrop = null;
    const img = new Image();
    img.src = 'assets/office-backdrop-v3.png';
    img.onload = () => { this.backdrop = img; if (eng.renderer === this) eng.resize(); };
    this._dust = [];
    this._blurTop = null;
    this._blurBottom = null;
    this._blurTimer = 0;
    for (let i = 0; i < 46; i++) {
      this._dust.push({
        x: Math.random(), y: Math.random(), z: Math.random() * 0.6 + 0.2,
        s: Math.random() * 1.6 + 0.5, p: Math.random() * Math.PI * 2,
      });
    }
  },

  _loadSprites() {
    const names = ['batman', 'robin', 'catwoman', 'joker', 'luke', 'leia', 'han', 'chewbacca',
                   'michael', 'dwight', 'jim', 'pam', 'uma', 'xyla', 'hazel', 'dash',
                   'pixel', 'coco', 'gizmo', 'yara'];
    for (const n of names) {
      const img = new Image();
      img.src = 'assets/char-' + n + '.png';
      this.sprites[n] = img;
    }
  },

  onAgentAdded(a) {
    this.agentsV.set(a.id, { squash: 0, blink: 0, arm: Math.random() * 10 });
  },

  /* grid -> screen (isometric) */
  map(eng, x, y) {
    return {
      x: eng.ox + (x - y) * (TILE / 2) * eng.scale,
      y: eng.oy + (x + y) * (TILE / 4) * eng.scale,
    };
  },

  resize(eng) {
    const fit = Math.min(eng.cssW / 640, eng.cssH / 380);
    // mobile: much bigger scene so agents are prominent and the room fills the screen
    const mfit = eng.cssW < 860 ? Math.min(eng.cssW / 250, eng.cssH / 470) : fit;
    eng.scale = clamp(mfit, 0.45, 1.7) * (eng.zoom || 1);
    eng.ox = eng.cssW / 2;
    eng.oy = eng.cssW < 860 ? eng.cssH * 0.33 : eng.cssH / 2 + 24;
    this._buildStatic(eng);
  },

  _buildStatic(eng) {
    const { ctx } = eng;
    const w = eng.cssW, h = eng.cssH;
    const layer = document.createElement('canvas');
    layer.width = w; layer.height = h;
    const g = layer.getContext('2d');
    const p = eng.theme.props;

    /* custom theme backdrop: full-canvas painted scene (immersive) */
    const customBg = !!this.customBackdrop;
    const fullbleed = !!eng.theme.fullbleed;
    if (customBg) {
      const iw = this.customBackdrop.width, ih = this.customBackdrop.height;
      const ar = iw / ih, tar = w / h;
      let dw = w, dh = h, dx = 0, dy = 0;
      if (fullbleed) {
        // COVER: fill the entire canvas (crop excess) so no beige shows
        if (ar > tar) { dh = h; dw = h * ar; dx = -(dw - w) / 2; }
        else { dw = w; dh = w / ar; dy = -(dh - h) / 2; }
      } else {
        if (ar > tar) { dw = h * ar; dx = -(dw - w) / 2; }
        else { dh = w / ar; dy = -(dh - h) / 2; }
      }
      g.drawImage(this.customBackdrop, dx, dy, dw, dh);
      // darken slightly so the office pops (less on fullbleed)
      g.fillStyle = fullbleed ? 'rgba(8,6,16,0.0)' : 'rgba(10,8,20,0.20)';
      g.fillRect(0, 0, w, h);
      // warm light pool on the floor beneath the office (agents read clearly)
      const pool = g.createRadialGradient(eng.cssW / 2, eng.cssH * 0.72, eng.s(30),
                                          eng.cssW / 2, eng.cssH * 0.72, eng.s(330));
      pool.addColorStop(0, 'rgba(255,224,170,0.14)');
      pool.addColorStop(1, 'rgba(255,224,170,0)');
      g.fillStyle = pool;
      g.fillRect(0, 0, w, h);
    }
    if (fullbleed) {
      // full-bleed franchise themes: the painted scene IS the view
      eng.staticLayer = layer;
      this._blurTop = null; this._blurBottom = null; this._blurTimer = 0;
      return this._buildStaticFullbleed(eng, g, w, h, layer);
    }

    /* floor */
    for (let x = 0; x < GRID; x++) {
      for (let y = 0; y < GRID; y++) {
        const c = (x + y) % 2 === 0 ? eng.theme.floor.base : eng.theme.floor.alt;
        this.tile(eng, g, x, y, customBg ? c + 'b8' : c);
      }
    }
    g.strokeStyle = eng.theme.floor.grid;
    g.lineWidth = 1;
    for (let i = 0; i <= GRID; i++) {
      const a = this.map(eng, i, 0), b = this.map(eng, i, GRID);
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      const c = this.map(eng, 0, i), d = this.map(eng, GRID, i);
      g.beginPath(); g.moveTo(c.x, c.y); g.lineTo(d.x, d.y); g.stroke();
    }
    // soft ground mat under the whole office (anchors the diorama)
    const matC = this.map(eng, GRID / 2, GRID / 2);
    const mat = g.createRadialGradient(matC.x, matC.y + eng.s(40), eng.s(20), matC.x, matC.y + eng.s(40), eng.s(430));
    mat.addColorStop(0, 'rgba(120,95,60,0.10)');
    mat.addColorStop(0.7, 'rgba(120,95,60,0.05)');
    mat.addColorStop(1, 'rgba(120,95,60,0)');
    g.fillStyle = mat;
    g.beginPath();
    g.ellipse(matC.x, matC.y + eng.s(40), eng.s(430), eng.s(220), 0, 0, Math.PI * 2);
    g.fill();

    // warm center light pool
    const ctr = this.map(eng, GRID / 2, GRID / 2);
    const grad = g.createRadialGradient(ctr.x, ctr.y, 10, ctr.x, ctr.y, eng.s(330));
    grad.addColorStop(0, 'rgba(255,244,214,0.55)');
    grad.addColorStop(1, 'rgba(255,244,214,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);

    /* back walls + window with AI art */
    const back = eng.theme.wall.back, side = eng.theme.wall.side;
    g.fillStyle = customBg ? side + 'c6' : side;
    g.beginPath();
    g.moveTo(this.map(eng, 0, 0).x, this.map(eng, 0, 0).y);
    g.lineTo(this.map(eng, GRID, 0).x, this.map(eng, GRID, 0).y);
    g.lineTo(this.map(eng, GRID, 0).x, this.map(eng, GRID, 0).y - eng.s(84));
    g.lineTo(this.map(eng, 0, 0).x, this.map(eng, 0, 0).y - eng.s(84));
    g.closePath(); g.fill();
    g.fillStyle = customBg ? back + 'c6' : back;
    g.beginPath();
    g.moveTo(this.map(eng, GRID, 0).x, this.map(eng, GRID, 0).y);
    g.lineTo(this.map(eng, GRID, GRID).x, this.map(eng, GRID, GRID).y);
    g.lineTo(this.map(eng, GRID, GRID).x, this.map(eng, GRID, GRID).y - eng.s(84));
    g.lineTo(this.map(eng, GRID, 0).x, this.map(eng, GRID, 0).y - eng.s(84));
    g.closePath(); g.fill();

    // window with generated art (on the left-facing back wall)
    if (!customBg && this.backdrop) {
      const w0 = this.map(eng, 0.35, 0.55), w1 = this.map(eng, 2.75, 0.55);
      const ww = w1.x - w0.x, wh = eng.s(56);
      g.save();
      g.beginPath();
      g.rect(w0.x + eng.s(2), w0.y - wh + eng.s(2), ww - eng.s(4), wh - eng.s(4));
      g.clip();
      // cover-crop the art into the window
      const iw = this.backdrop.width, ih = this.backdrop.height;
      const ar = iw / ih, tar = ww / wh;
      let dw = ww, dh = wh, dx = 0, dy = 0;
      if (ar > tar) { dw = wh * ar; dx = -(dw - ww) / 2; }
      else { dh = ww / ar; dy = -(dh - wh) / 2; }
      g.drawImage(this.backdrop, w0.x + eng.s(2) + dx, w0.y - wh + eng.s(2) + dy, dw, dh);
      g.restore();
      g.strokeStyle = eng.theme.wall.frame; g.lineWidth = eng.s(3);
      g.strokeRect(w0.x, w0.y - wh, ww, wh);
      g.beginPath();
      g.moveTo((w0.x + w1.x) / 2, w0.y - wh); g.lineTo((w0.x + w1.x) / 2, w0.y);
      g.stroke();
      // god rays across the room (from the window)
      const rayGrad = g.createLinearGradient(w0.x, w0.y - wh, w1.x + eng.s(120), w0.y + eng.s(160));
      rayGrad.addColorStop(0, 'rgba(255,236,180,0.34)');
      rayGrad.addColorStop(0.5, 'rgba(255,236,180,0.10)');
      rayGrad.addColorStop(1, 'rgba(255,236,180,0)');
      g.fillStyle = rayGrad;
      g.beginPath();
      g.moveTo(w0.x + eng.s(6), w0.y - wh);
      g.lineTo(w0.x + eng.s(60), w0.y - wh);
      g.lineTo(w1.x + eng.s(150), w0.y + eng.s(190));
      g.lineTo(w0.x - eng.s(40), w0.y + eng.s(190));
      g.closePath(); g.fill();
    }

    // wall art frames
    const colors = p.book;
    for (let i = 0; i < 3; i++) {
      const f = this.map(eng, 6.0 + i * 1.15, 0);
      g.fillStyle = colors[(i + 1) % colors.length];
      g.fillRect(f.x - eng.s(15), f.y - eng.s(54), eng.s(30), eng.s(36));
      g.strokeStyle = eng.theme.wall.frame; g.lineWidth = eng.s(2);
      g.strokeRect(f.x - eng.s(15), f.y - eng.s(54), eng.s(30), eng.s(36));
    }
    // whiteboard
    const wb = this.map(eng, 3.4, 0);
    g.fillStyle = p.whiteboard;
    g.fillRect(wb.x - eng.s(48), wb.y - eng.s(70), eng.s(96), eng.s(46));
    g.strokeStyle = eng.theme.wall.frame; g.lineWidth = eng.s(2);
    g.strokeRect(wb.x - eng.s(48), wb.y - eng.s(70), eng.s(96), eng.s(46));
    g.fillStyle = 'rgba(100,90,70,0.85)';
    for (let i = 0; i < 3; i++) {
      g.fillRect(wb.x - eng.s(40), wb.y - eng.s(58) + i * eng.s(12), eng.s(62 - i * 14), eng.s(4));
    }
    g.fillStyle = 'rgba(110,95,70,0.7)';
    g.beginPath();
    g.arc(wb.x + eng.s(30), wb.y - eng.s(48), eng.s(7), 0, Math.PI * 2);
    g.fill();
    // bookshelf (library)
    const lib = this.map(eng, 0.8, 2.4);
    for (let r = 0; r < 4; r++) {
      const yTop = lib.y - eng.s(70) + r * eng.s(16);
      for (let i = 0; i < 7; i++) {
        g.fillStyle = colors[(i + r) % colors.length];
        g.fillRect(lib.x - eng.s(32) + i * eng.s(9.5), yTop - eng.s(13), eng.s(6.5), eng.s(14));
      }
    }
    g.fillStyle = p.woodDark;
    g.fillRect(lib.x - eng.s(38), lib.y - eng.s(73), eng.s(76), eng.s(6));

    /* furniture */
    this.drawStationSet(eng, g);

    // baseboards + corner post
    g.fillStyle = eng.theme.wall.base;
    g.beginPath();
    g.moveTo(this.map(eng, 0, 0).x, this.map(eng, 0, 0).y);
    g.lineTo(this.map(eng, 0, GRID).x, this.map(eng, 0, GRID).y);
    g.lineTo(this.map(eng, 0, GRID).x, this.map(eng, 0, GRID).y - eng.s(16));
    g.lineTo(this.map(eng, 0, 0).x, this.map(eng, 0, 0).y - eng.s(16));
    g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(this.map(eng, 0, GRID).x, this.map(eng, 0, GRID).y);
    g.lineTo(this.map(eng, GRID, GRID).x, this.map(eng, GRID, GRID).y);
    g.lineTo(this.map(eng, GRID, GRID).x, this.map(eng, GRID, GRID).y - eng.s(16));
    g.lineTo(this.map(eng, 0, GRID).x, this.map(eng, 0, GRID).y - eng.s(16));
    g.closePath(); g.fill();
    g.fillStyle = eng.theme.wall.frame;
    g.fillRect(this.map(eng, 0, 0).x - eng.s(5), this.map(eng, 0, 0).y - eng.s(84), eng.s(10), eng.s(84));

    /* ---- cinematic grade (per art-direction spec) ---- */
    // ambient occlusion at wall/floor junctions
    const ao = g.createLinearGradient(0, 0, 0, eng.s(60));
    ao.addColorStop(0, 'rgba(70,50,30,0.16)');
    ao.addColorStop(1, 'rgba(70,50,30,0)');
    g.fillStyle = ao;
    g.fillRect(0, 0, w, eng.s(60));
    // warm/cool split-tone: warm light from top, cool-green shadows
    const warm = g.createLinearGradient(0, 0, 0, h * 0.55);
    warm.addColorStop(0, 'rgba(255,244,226,0.10)');
    warm.addColorStop(1, 'rgba(255,244,226,0)');
    g.fillStyle = warm;
    g.fillRect(0, 0, w, h * 0.55);
    const cool = g.createLinearGradient(0, h * 0.55, 0, h);
    cool.addColorStop(0, 'rgba(184,200,192,0)');
    cool.addColorStop(1, 'rgba(184,200,192,0.10)');
    g.fillStyle = cool;
    g.fillRect(0, h * 0.55, w, h * 0.45);
    // lift the deepest shadows (film emulation) + tilt-shift falloff top/bottom
    const lift = g.createLinearGradient(0, 0, 0, h);
    lift.addColorStop(0, 'rgba(244,238,226,0.05)');
    lift.addColorStop(0.5, 'rgba(244,238,226,0)');
    lift.addColorStop(1, 'rgba(244,238,226,0.06)');
    g.fillStyle = lift;
    g.fillRect(0, 0, w, h);
    // soft vignette (tilt-shift feel)
    const vg = g.createRadialGradient(eng.cssW / 2, eng.cssH / 2, eng.cssH * 0.42, eng.cssW / 2, eng.cssH / 2, eng.cssH * 0.98);
    vg.addColorStop(0, 'rgba(60,40,20,0)');
    vg.addColorStop(1, 'rgba(60,40,20,0.20)');
    g.fillStyle = vg;
    g.fillRect(0, 0, w, h);

    eng.staticLayer = layer;
  },

  drawStationSet(eng, g) {
    const p = eng.theme.props;
    // plants
    for (const [px, py] of eng.theme.plants) this.drawPlant(eng, g, px, py, p.pot, p.plant);
    // desk clusters
    for (const [dx, dy] of eng.theme.desks) this.drawDesk(eng, g, dx, dy, p);
    // meeting table
    const mt = eng.theme.stations.find(s => s.type === 'meeting');
    if (mt) {
      eng.ellipseIso(mt.x, mt.y, 2.1, 1.1, p.rugPink);
      this.isoBox(eng, g, mt.x - 1.3, mt.y - 0.4, mt.x + 1.3, mt.y + 0.4, 22, p.woodTop, p.wood, p.woodDark);
      for (const [ax, ay] of [[mt.x - 1.6, mt.y - 0.8], [mt.x - 1.6, mt.y + 0.8], [mt.x + 1.6, mt.y - 0.8], [mt.x + 1.6, mt.y + 0.8]]) {
        this.drawChair(eng, g, ax, ay, p.chair);
      }
    }
    // lounge + water cooler
    const lg = eng.theme.stations.find(s => s.type === 'lounge');
    if (lg) {
      eng.ellipseIso(lg.x, lg.y, 1.4, 0.8, p.rugGreen);
      this.isoBox(eng, g, lg.x - 0.7, lg.y - 0.35, lg.x + 0.1, lg.y + 0.35, 18, p.rugGreen, p.rugGreen, shade(p.rugGreen, -30));
      this.isoBox(eng, g, lg.x + 0.55, lg.y - 0.2, lg.x + 0.95, lg.y + 0.2, 12, p.woodTop, p.wood, p.woodDark);
      // water cooler
      const wc = this.map(eng, lg.x - 1.0, lg.y + 0.5);
      g.fillStyle = '#e9edf2';
      g.beginPath(); g.arc(wc.x, wc.y - eng.s(16), eng.s(7), 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#b8c2cc'; g.lineWidth = eng.s(1.5); g.stroke();
      g.fillStyle = '#cfd8e0';
      g.fillRect(wc.x - eng.s(6), wc.y - eng.s(12), eng.s(12), eng.s(12));
      g.fillStyle = '#8fa3b5';
      g.fillRect(wc.x - eng.s(2), wc.y - eng.s(22), eng.s(4), eng.s(6));
    }
    // tools bench
    const tl = eng.theme.stations.find(s => s.type === 'tools');
    if (tl) {
      this.isoBox(eng, g, tl.x - 0.8, tl.y - 0.3, tl.x + 0.8, tl.y + 0.3, 16, p.woodTop, p.wood, p.woodDark);
      this.drawMonitor(eng, g, tl.x - 0.2, tl.y - 0.18, p, 30);
      this.drawMonitor(eng, g, tl.x + 0.45, tl.y - 0.18, p, 30);
    }
    // entrance door
    const en = eng.theme.stations.find(s => s.type === 'entrance');
    if (en) {
      const c = this.map(eng, en.x, en.y);
      g.fillStyle = p.woodDark;
      g.fillRect(c.x - eng.s(3), c.y - eng.s(60), eng.s(20), eng.s(60));
      g.fillStyle = p.wood;
      g.fillRect(c.x + eng.s(2), c.y - eng.s(60), eng.s(16), eng.s(60));
      g.fillStyle = 'rgba(120,140,110,0.5)';
      eng.roundRectPath(g, c.x - eng.s(20), c.y - eng.s(4), eng.s(40), eng.s(8), eng.s(4));
      g.fill();
    }
  },

  /* full-bleed franchise themes: painted scene shows through; draw only desks
     and stations on top, no opaque floor/walls */
  _buildStaticFullbleed(eng, g, w, h, layer) {
    const p = eng.theme.props;
    // NO grid, NO desks — the painted scene (hangar / Gotham) is the whole view
    // mailbox
    const mail = eng.theme.stations.find(s => s.type === 'mail');
    if (mail) {
      const c = this.map(eng, mail.x, mail.y);
      g.fillStyle = p.wood;
      g.beginPath();
      g.roundRect(c.x - eng.s(20), c.y - eng.s(10), eng.s(40), eng.s(16), eng.s(5));
      g.fill();
      g.fillStyle = '#f5f5f0';
      g.font = `800 ${eng.s(10)}px sans-serif`;
      g.textAlign = 'center';
      g.fillText('MAIL', c.x, c.y + eng.s(3));
    }
  },

  /* per-frame dynamic: agents, mailbox glow, dust, labels, tilt-shift DOF */
  draw(eng, ctx, dt) {
    ctx.clearRect(0, 0, eng.cssW, eng.cssH);
    this._blurTimer -= dt;
    // rebuild the blurred edge bands occasionally (and on resize)
    if ((!this._blurTop || this._blurTimer <= 0) && eng.staticLayer) {
      this._buildBlurBands(eng);
      this._blurTimer = 2.0;
    }
    // composite: sharp static center + blurred top/bottom edges
    if (eng.staticLayer) {
      ctx.drawImage(eng.staticLayer, 0, 0);
      const band = Math.round(eng.cssH * 0.07);
      if (this._blurTop) ctx.drawImage(this._blurTop, 0, 0, eng.cssW, band, 0, 0, eng.cssW, band);
      // bottom band dropped — agents walk in the foreground; keep it sharp
    }

    // mailbox (dynamic glow + flag)
    const mail = eng.theme.stations.find(s => s.type === 'mail');
    if (mail) {
      const c = this.map(eng, mail.x, mail.y);
      ctx.fillStyle = eng.theme.props.mail;
      ctx.fillRect(c.x - eng.s(16), c.y - eng.s(34), eng.s(32), eng.s(34));
      ctx.fillStyle = eng.theme.props.mailDark;
      ctx.fillRect(c.x - eng.s(16), c.y - eng.s(8), eng.s(32), eng.s(8));
      ctx.fillStyle = '#22222a';
      ctx.fillRect(c.x - eng.s(10), c.y - eng.s(24), eng.s(20), eng.s(4));
      if (eng.mailGlow > 0) {
        ctx.globalAlpha = 0.5 * eng.mailGlow;
        ctx.drawImage(glowSprite('rgba(255,190,90,0.9)', 140), c.x - eng.s(70), c.y - eng.s(60), eng.s(140), eng.s(140));
        ctx.globalAlpha = 1;
      }
      // letter peeking
      ctx.fillStyle = '#f5f5f0';
      ctx.fillRect(c.x - eng.s(8), c.y - eng.s(30), eng.s(16), eng.s(11));
      ctx.strokeStyle = '#d8d2c4'; ctx.lineWidth = eng.s(1);
      ctx.beginPath();
      ctx.moveTo(c.x - eng.s(8), c.y - eng.s(30)); ctx.lineTo(c.x, c.y - eng.s(24)); ctx.lineTo(c.x + eng.s(8), c.y - eng.s(30));
      ctx.stroke();
      // flag raised when glow active
      ctx.strokeStyle = eng.theme.props.mailDark; ctx.lineWidth = eng.s(3);
      ctx.beginPath();
      ctx.moveTo(c.x + eng.s(16), c.y - eng.s(34));
      ctx.lineTo(c.x + eng.s(16), c.y - eng.s(46) - (eng.mailGlow > 0 ? eng.s(6) : 0));
      ctx.stroke();
    }

    // agents (painter's order)
    const sorted = [...eng.agents.values()].sort((a, b) => (a.y + a.x) - (b.y + b.x));
    for (const a of sorted) this.drawAgent(eng, ctx, a);

    // dust motes in the light
    const now = performance.now() / 1000;
    for (const d of this._dust) {
      const dx = (d.x + now * 0.008 * d.z) % 1;
      const x = dx * eng.cssW, y = (d.y + Math.sin(now * 0.5 + d.p) * 0.01) * eng.cssH * 0.8;
      ctx.globalAlpha = 0.12 + 0.1 * d.z;
      ctx.fillStyle = '#fff3c8';
      ctx.beginPath();
      ctx.arc(x, y, d.s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    eng.particles.draw(ctx, eng.scale);
    this.drawLabels(eng, ctx);
  },

  drawAgent(eng, ctx, a) {
    const c = this.map(eng, a.x, a.y);
    const s = eng.scale;
    const u = s * 1.42;   // characters are the focal point — render them big
    const vs = this.agentsV.get(a.id) || { squash: 0, blink: 0, arm: Math.random() * 10 };
    const now = performance.now() / 1000;
    const look = a.look || { hue: a.color, body: 'default', topper: 'none', acc: 'none', face: 'calm' };
    const hue = look.hue || a.color;
    // THEMED SPRITE: if this agent has character art, draw it instead of the capsule
    const spriteKey = (a.name || '').toLowerCase();
    const spr = this.sprites[spriteKey];
    if (spr && spr.complete && spr.naturalWidth > 0) {
      this.drawSpriteAgent(eng, ctx, a, c, u, spr);
      return;
    }

    // body proportions per archetype
    const P = {
      default: { w: 1.0, h: 1.0 },
      tall:    { w: 0.92, h: 1.16 },
      slim:    { w: 0.8, h: 1.06 },
      round:   { w: 1.24, h: 0.9 },
      wide:    { w: 1.34, h: 1.02 },
      small:   { w: 0.78, h: 0.8 },
      lanky:   { w: 0.82, h: 1.22 },
    }[look.body] || { w: 1, h: 1 };

    const bob = a.moving ? Math.sin(a.walkPhase) * 1.9 * s : Math.sin(a.walkPhase * 0.55) * 1.1 * s;
    const spd = Math.min(1, Math.hypot(a.vx, a.vy));
    const sq = a.moving ? 0.10 * spd : 0;
    const stretchY = (1 + sq) * P.h, stretchX = (1 - sq * 0.6) * P.w;
    // torso lean into movement
    const lean = a.moving ? a.facing * 3.2 * s : 0;
    const y = c.y - s * 24 * P.h + bob;
    if (now > a.blinkAt) { vs.blink = 1; a.blinkAt = now + 2 + Math.random() * 4; }
    vs.blink = Math.max(0, vs.blink - (now - (vs._last || now)));
    vs._last = now;

    const dark = shade(hue, -62);     // deep ink for legs/outline
    const darkWarm = '#3b3630';        // palette-law "black"

    /* contact shadow: dark core at contact, fades out (PCSS feel) */
    const sh = ctx.createRadialGradient(c.x, c.y + u * 3, u * 2, c.x, c.y + u * 3, u * 16 * P.w);
    sh.addColorStop(0, 'rgba(60,45,25,0.38)');
    sh.addColorStop(0.35, 'rgba(60,45,25,0.20)');
    sh.addColorStop(1, 'rgba(60,45,25,0)');
    ctx.fillStyle = sh;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + u * 3, u * 16 * P.w, u * 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    /* warm spotlight halo behind the character — lifts it off dark floors
       and makes the cast the focal point (per the art-direction spec) */
    const darkTheme = !!(eng.theme && eng.theme.fx && eng.theme.fx.dark);
    const halo = ctx.createRadialGradient(c.x, c.y - u * 6, u * 2, c.x, c.y - u * 6, u * 26);
    halo.addColorStop(0, darkTheme ? 'rgba(255,236,190,0.45)' : 'rgba(255,236,190,0.30)');
    halo.addColorStop(0.5, darkTheme ? 'rgba(255,236,190,0.20)' : 'rgba(255,236,190,0.12)');
    halo.addColorStop(1, 'rgba(255,236,190,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y - u * 6, u * 26, u * 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // droid archetype (R2-D2 / C-3PO): cylinder body + dome
    if (look.body === 'droid' || look.body === 'gold') {
      this.drawDroid(eng, ctx, a, c, y, u, hue, look, vs, now);
      return;
    }

    const cx = c.x;
    ctx.save();
    ctx.translate(cx + lean, y);
    ctx.scale(stretchX, stretchY);

    /* stubby dark legs (shoes+trousers in one form) */
    const legSwing = a.moving ? Math.sin(a.walkPhase) * 3.4 * u : 0;
    ctx.fillStyle = darkWarm;
    ctx.beginPath();
    ctx.roundRect(-6.5 * u + legSwing, 6 * u, 5 * u, 7 * u, 2.4 * u);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(1.5 * u - legSwing, 6 * u, 5 * u, 7 * u, 2.4 * u);
    ctx.fill();

    /* body capsule — single flat hue */
    const bodyW = 10 * u, bodyH = 16 * u;
    ctx.fillStyle = hue;
    ctx.beginPath();
    ctx.roundRect(-bodyW, -4 * u, bodyW * 2, bodyH, bodyW);
    ctx.fill();
    // cool top / warm under shading (GI feel)
    const bodyGrad = ctx.createLinearGradient(0, -4 * u, 0, 12 * u);
    bodyGrad.addColorStop(0, 'rgba(255,255,255,0.12)');
    bodyGrad.addColorStop(0.55, 'rgba(255,255,255,0)');
    bodyGrad.addColorStop(1, 'rgba(120,70,30,0.10)');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-bodyW, -4 * u, bodyW * 2, bodyH, bodyW);
    ctx.fill();
    // warm rim light on the lit side (separates from dark backdrops)
    ctx.strokeStyle = 'rgba(255,236,190,0.28)';
    ctx.lineWidth = 1.4 * u;
    ctx.beginPath();
    ctx.moveTo(-bodyW + 2 * u, -2 * u);
    ctx.quadraticCurveTo(0, -5 * u, bodyW - 2 * u, -2 * u);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(40,32,24,0.28)';
    ctx.lineWidth = 1;
    ctx.stroke();

    /* arms — tapered cylinders, mitten hands, swing with follow-through lag */
    const armSwing = a.moving ? Math.sin(a.walkPhase + Math.PI) * 3.4 * u : 0;
    const armLag = a.moving ? Math.sin(a.walkPhase + Math.PI * 0.7) * 2.2 * u : 0;
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2.6 * u;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-bodyW + 2 * u, -3 * u);
    ctx.lineTo(-bodyW - 2 * u + armSwing, 3 * u + armLag);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bodyW - 2 * u, -3 * u);
    ctx.lineTo(bodyW + 2 * u - armSwing, 3 * u - armLag);
    ctx.stroke();
    // mitten hands
    ctx.fillStyle = shade(hue, 8);
    ctx.beginPath();
    ctx.arc(-bodyW - 2 * u + armSwing, 3 * u + armLag, 2.2 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bodyW + 2 * u - armSwing, 3 * u - armLag, 2.2 * u, 0, Math.PI * 2);
    ctx.fill();

    /* head — rounded capsule, sits on shoulders */
    const headY = -13 * u;
    const headW = 9.5 * u;
    ctx.fillStyle = hue;
    ctx.beginPath();
    ctx.roundRect(-headW, headY - 3 * u, headW * 2, 10 * u, headW);
    ctx.fill();
    // subtle top light on head
    const hg = ctx.createLinearGradient(0, headY - 3 * u, 0, headY + 7 * u);
    hg.addColorStop(0, 'rgba(255,255,255,0.14)');
    hg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.roundRect(-headW, headY - 3 * u, headW * 2, 10 * u, headW);
    ctx.fill();

    this.drawTopper(eng, ctx, look, c.x - cx, headY, u);
    this.drawFace(eng, ctx, look, c.x - cx, headY, u, a.facing, vs.blink);

    ctx.restore();

    // accessory drawn in world space (cape behind, props beside)
    this.drawAccessory(eng, ctx, a, look, c, y, u, now);

    // tool chip
    if (a.status === 'tool' && !(a.bubble.text && now < a.bubble.until)) {
      ctx.font = `${15 * u}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(toolIcon(a.currentTool), c.x, y - 28 * u);
      ctx.textAlign = 'left';
    }
    // working indicator: spinning gear above active agents
    if ((a.status === 'tool' || a.status === 'thinking') && !(a.bubble.text && now < a.bubble.until)) {
      const gx = c.x, gy = y - 36 * u;
      const spin = (now * 3) % (Math.PI * 2);
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(spin);
      ctx.strokeStyle = 'rgba(59,54,48,0.85)';
      ctx.lineWidth = 1.6 * u;
      ctx.lineCap = 'round';
      for (let t = 0; t < 8; t++) {
        const a0 = (t / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a0) * 3.4 * u, Math.sin(a0) * 3.4 * u);
        ctx.lineTo(Math.cos(a0) * 5.2 * u, Math.sin(a0) * 5.2 * u);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 2.4 * u, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // delivery toss
    if (a.toss > 0) {
      const t = 1 - a.toss / 0.8;
      const ex = c.x + 26 * u * t;
      const ey = y - 30 * u * Math.sin(t * Math.PI);
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(t * 1.4);
      ctx.fillStyle = '#f5f5f0';
      ctx.fillRect(-6 * s, -4 * s, 12 * s, 8 * s);
      ctx.restore();
    }
  },

  /* themed character sprite (AI-generated art) */
  drawSpriteAgent(eng, ctx, a, c, u, img) {
    const bob = a.moving ? Math.sin(a.walkPhase) * 1.5 * u : Math.sin(a.walkPhase * 0.55) * 0.8 * u;
    const w = 44 * u, hh = 44 * u;
    // grounding shadow
    const sh = ctx.createRadialGradient(c.x, c.y + u * 3, u * 2, c.x, c.y + u * 3, u * 15);
    sh.addColorStop(0, 'rgba(60,45,25,0.35)');
    sh.addColorStop(1, 'rgba(60,45,25,0)');
    ctx.fillStyle = sh;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + u * 3, u * 15, u * 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // draw sprite with slight bob + squash on walk, clipped to a soft circle
    // (kills any leftover background from the generated art)
    const sq = a.moving ? 0.06 : 0;
    ctx.save();
    ctx.translate(c.x, c.y - hh / 2 + bob + u * 6);
    ctx.scale(1 + sq, 1 - sq);
    ctx.beginPath();
    ctx.arc(0, 0, w * 0.52, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, -w / 2, -hh / 2, w, hh);
    // subtle rim so the clip reads as intentional
    ctx.beginPath();
    ctx.arc(0, 0, w * 0.52, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    // halo behind on dark themes
    if (eng.theme && eng.theme.fx && eng.theme.fx.dark) {
      const halo = ctx.createRadialGradient(c.x, c.y - u * 8, u * 2, c.x, c.y - u * 8, u * 22);
      halo.addColorStop(0, 'rgba(255,236,190,0.35)');
      halo.addColorStop(1, 'rgba(255,236,190,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y - u * 8, u * 22, u * 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  /* head toppers — the 30% silhouette channel. Each distinct at 40px. */
  drawTopper(eng, ctx, look, cx, headY, s) {
    const tc = look.tc || shade(look.hue || '#888', -30);
    ctx.fillStyle = tc;
    switch (look.topper) {
      case 'batears':  // Batman cowl: pointed ears
        ctx.beginPath();
        ctx.moveTo(cx - 8 * s, headY - 2 * s);
        ctx.lineTo(cx - 11 * s, headY - 12 * s);
        ctx.lineTo(cx - 4 * s, headY - 7 * s);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 8 * s, headY - 2 * s);
        ctx.lineTo(cx + 11 * s, headY - 12 * s);
        ctx.lineTo(cx + 4 * s, headY - 7 * s);
        ctx.closePath(); ctx.fill();
        break;
      case 'catears':
        ctx.beginPath();
        ctx.moveTo(cx - 7 * s, headY - 2 * s);
        ctx.lineTo(cx - 9 * s, headY - 9 * s);
        ctx.lineTo(cx - 2.5 * s, headY - 5 * s);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 7 * s, headY - 2 * s);
        ctx.lineTo(cx + 9 * s, headY - 9 * s);
        ctx.lineTo(cx + 2.5 * s, headY - 5 * s);
        ctx.closePath(); ctx.fill();
        break;
      case 'ears':  // long rounded ears (fox/bunny/Yoda)
        ctx.beginPath();
        ctx.ellipse(cx - 6 * s, headY - 8 * s, 2.4 * s, 6 * s, -0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 6 * s, headY - 8 * s, 2.4 * s, 6 * s, 0.15, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'bunny':
        ctx.beginPath();
        ctx.ellipse(cx - 4.5 * s, headY - 9 * s, 2 * s, 7 * s, -0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 4.5 * s, headY - 9 * s, 2 * s, 7 * s, 0.1, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'buns':  // Leia
        ctx.beginPath(); ctx.arc(cx - 9 * s, headY - 5 * s, 3 * s, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 9 * s, headY - 5 * s, 3 * s, 0, Math.PI * 2); ctx.fill();
        break;
      case 'hair':
        ctx.beginPath();
        ctx.ellipse(cx, headY - 4 * s, 8.5 * s, 4.5 * s, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        break;
      case 'bob':
        ctx.beginPath();
        ctx.ellipse(cx, headY - 3.5 * s, 8.5 * s, 5 * s, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(cx - 8.5 * s, headY - 3 * s, 3.4 * s, 5 * s);
        ctx.fillRect(cx + 5.1 * s, headY - 3 * s, 3.4 * s, 5 * s);
        break;
      case 'cap':
        ctx.beginPath();
        ctx.arc(cx, headY - 4 * s, 8 * s, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(cx - 8 * s, headY - 4 * s, 16 * s, 1.6 * s);
        ctx.beginPath(); ctx.arc(cx - 6 * s, headY - 3 * s, 1.2 * s, 0, Math.PI * 2); ctx.fill();
        break;
      case 'maskhair':  // Robin mask
        ctx.fillStyle = tc;
        ctx.beginPath(); ctx.ellipse(cx, headY - 4 * s, 8 * s, 4 * s, 0, Math.PI, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(40,36,34,0.85)';
        ctx.beginPath();
        ctx.roundRect(cx - 8 * s, headY - 1 * s, 16 * s, 3.4 * s, 2 * s);
        ctx.fill();
        break;
      case 'mask':  // full mask / cowl band
        ctx.beginPath();
        ctx.roundRect(cx - 8 * s, headY - 4 * s, 16 * s, 5.5 * s, 3 * s);
        ctx.fill();
        break;
      case 'helmet':  // Vader
        ctx.beginPath();
        ctx.ellipse(cx, headY - 4 * s, 8 * s, 6 * s, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#2e2e36';
        ctx.fillRect(cx - 8 * s, headY - 4 * s, 16 * s, 2 * s);
        break;
      case 'horns':
        ctx.beginPath();
        ctx.moveTo(cx - 6 * s, headY - 3 * s); ctx.lineTo(cx - 8 * s, headY - 11 * s); ctx.lineTo(cx - 4 * s, headY - 6 * s);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 6 * s, headY - 3 * s); ctx.lineTo(cx + 8 * s, headY - 11 * s); ctx.lineTo(cx + 4 * s, headY - 6 * s);
        ctx.closePath(); ctx.fill();
        break;
      case 'headphones':
        ctx.fillStyle = tc;
        ctx.beginPath(); ctx.arc(cx, headY - 2 * s, 8 * s, Math.PI, 0); ctx.fill();
        ctx.fillStyle = look.hue;
        ctx.fillRect(cx - 2.4 * s, headY - 2 * s, 4.8 * s, 1.6 * s);
        break;
      case 'dome':
        ctx.beginPath(); ctx.arc(cx, headY + 1 * s, 8 * s, Math.PI, 0); ctx.fill();
        break;
      case 'flame':
        ctx.beginPath();
        ctx.moveTo(cx - 4 * s, headY - 1 * s);
        ctx.quadraticCurveTo(cx - 5 * s, headY - 9 * s, cx, headY - 12 * s);
        ctx.quadraticCurveTo(cx + 5 * s, headY - 9 * s, cx + 4 * s, headY - 1 * s);
        ctx.closePath(); ctx.fill();
        break;
      case 'fur':
        ctx.beginPath();
        ctx.ellipse(cx, headY - 3 * s, 9 * s, 6 * s, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(cx - 9 * s, headY - 3 * s, 3.6 * s, 6 * s);
        ctx.fillRect(cx + 5.4 * s, headY - 3 * s, 3.6 * s, 6 * s);
        break;
      case 'hat':
        ctx.beginPath();
        ctx.ellipse(cx, headY - 5 * s, 9 * s, 2.6 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(cx - 5 * s, headY - 11 * s, 10 * s, 6 * s);
        break;
      case 'bald':
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        ctx.beginPath(); ctx.arc(cx, headY - 2 * s, 8 * s, Math.PI, 0); ctx.fill();
        break;
      case 'bun':
        ctx.beginPath(); ctx.arc(cx, headY - 8 * s, 3.4 * s, 0, Math.PI * 2); ctx.fill();
        break;
      case 'none':
      default:
        break;
    }
  },

  /* faces: restrained — dot eyes, optional brows/grin. Never expressive. */
  drawFace(eng, ctx, look, cx, headY, s, facing, blink) {
    const ex = facing * 1.4 * s;
    const dot = 1.5 * s;
    ctx.fillStyle = '#2e2a28';
    if (blink > 0.5) {
      ctx.strokeStyle = '#2e2a28';
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      ctx.moveTo(cx - 4.2 * s + ex, headY - 1 * s);
      ctx.lineTo(cx - 2.2 * s + ex, headY - 1 * s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 2.2 * s + ex, headY - 1 * s);
      ctx.lineTo(cx + 4.2 * s + ex, headY - 1 * s);
      ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(cx - 3.4 * s + ex, headY - 1 * s, dot, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 3.4 * s + ex, headY - 1 * s, dot, 0, Math.PI * 2); ctx.fill();
    }
    // brows for stern characters
    if (look.face === 'stern') {
      ctx.strokeStyle = '#2e2a28';
      ctx.lineWidth = 1.1 * s;
      ctx.beginPath(); ctx.moveTo(cx - 5.4 * s, headY - 4.4 * s); ctx.lineTo(cx - 2.2 * s, headY - 3.2 * s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 5.4 * s, headY - 4.4 * s); ctx.lineTo(cx + 2.2 * s, headY - 3.2 * s); ctx.stroke();
    }
    // grin for Joker etc.
    if (look.face === 'grin') {
      ctx.strokeStyle = look.tc || '#7cb342';
      ctx.lineWidth = 1.3 * s;
      ctx.beginPath();
      ctx.arc(cx, headY + 2.4 * s, 3.2 * s, 0.12 * Math.PI, 0.88 * Math.PI);
      ctx.stroke();
    }
  },

  /* accessories — the 8% channel. Exactly one per character. */
  drawAccessory(eng, ctx, a, look, c, y, s, now) {
    switch (look.acc) {
      case 'cape': {
        ctx.fillStyle = 'rgba(38,34,48,0.75)';
        ctx.beginPath();
        ctx.moveTo(c.x - 8 * s, y - 14 * s);
        ctx.quadraticCurveTo(c.x - 18 * s, y + 2 * s, c.x - 11 * s, y + 12 * s);
        ctx.quadraticCurveTo(c.x - 6 * s, y + 8 * s, c.x - 5 * s, y - 4 * s);
        ctx.closePath(); ctx.fill();
        break;
      }
      case 'whip': {
        ctx.strokeStyle = '#5a4a3a';
        ctx.lineWidth = 1.6 * s;
        ctx.beginPath();
        ctx.moveTo(c.x + 9 * s, y - 10 * s);
        ctx.quadraticCurveTo(c.x + 16 * s, y - 2 * s, c.x + 13 * s, y + 8 * s);
        ctx.stroke();
        break;
      }
      case 'staff': {
        ctx.strokeStyle = '#6b4a2a';
        ctx.lineWidth = 1.8 * s;
        ctx.beginPath();
        ctx.moveTo(c.x + 10 * s, y - 16 * s);
        ctx.lineTo(c.x + 10 * s, y + 6 * s);
        ctx.stroke();
        break;
      }
      case 'lightsaber': {
        ctx.fillStyle = '#4a90d9';
        ctx.beginPath();
        ctx.roundRect(c.x + 10 * s, y - 16 * s, 2.4 * s, 14 * s, 1.2 * s);
        ctx.fill();
        ctx.fillStyle = 'rgba(74,144,217,0.4)';
        ctx.beginPath();
        ctx.roundRect(c.x + 8.6 * s, y - 18 * s, 5.2 * s, 18 * s, 2.6 * s);
        ctx.fill();
        ctx.strokeStyle = '#7a5a3a';
        ctx.lineWidth = 1.8 * s;
        ctx.beginPath();
        ctx.moveTo(c.x + 11.2 * s, y - 2 * s);
        ctx.lineTo(c.x + 11.2 * s, y + 2 * s);
        ctx.stroke();
        break;
      }
      case 'coffee': {
        ctx.fillStyle = '#7a5a3a';
        ctx.fillRect(c.x + 9 * s, y - 6 * s, 4.6 * s, 5.6 * s);
        ctx.beginPath(); ctx.arc(c.x + 13.6 * s, y - 4.6 * s, 1.3 * s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5a3a22';
        ctx.fillRect(c.x + 10.2 * s, y - 5 * s, 3 * s, 1.6 * s);
        break;
      }
      case 'mug': {
        ctx.fillStyle = '#e8e0d0';
        ctx.fillRect(c.x + 9 * s, y - 6 * s, 4.4 * s, 5 * s);
        ctx.fillStyle = '#b8a683';
        ctx.fillRect(c.x + 13.4 * s, y - 5 * s, 1.4 * s, 3 * s);
        break;
      }
      case 'book': {
        ctx.fillStyle = '#c0504d';
        ctx.fillRect(c.x + 8 * s, y - 7 * s, 5 * s, 6 * s);
        ctx.fillStyle = '#fff';
        ctx.fillRect(c.x + 9.4 * s, y - 6 * s, 2.6 * s, 4 * s);
        break;
      }
      case 'card': {
        ctx.fillStyle = '#e8e0d0';
        ctx.save();
        ctx.translate(c.x + 10 * s, y - 4 * s);
        ctx.rotate(0.3);
        ctx.fillRect(-3 * s, -4 * s, 6 * s, 8 * s);
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(-2 * s, -2.4 * s, 4 * s, 1.4 * s);
        ctx.restore();
        break;
      }
      case 'beet': {
        ctx.fillStyle = '#8a1e2a';
        ctx.beginPath(); ctx.arc(c.x + 10 * s, y - 2 * s, 2.4 * s, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#4a7a2e';
        ctx.lineWidth = 1.2 * s;
        ctx.beginPath(); ctx.moveTo(c.x + 10 * s, y - 4 * s); ctx.lineTo(c.x + 9 * s, y - 7 * s); ctx.stroke();
        break;
      }
      case 'bow': {
        ctx.fillStyle = look.tc || '#e8b8c8';
        ctx.beginPath();
        ctx.moveTo(c.x + 9 * s, y - 12 * s);
        ctx.quadraticCurveTo(c.x + 13 * s, y - 15 * s, c.x + 13 * s, y - 9 * s);
        ctx.quadraticCurveTo(c.x + 13 * s, y - 15 * s, c.x + 9 * s, y - 12 * s);
        ctx.fill();
        break;
      }
      case 'mask': {
        ctx.fillStyle = look.tc || '#d64541';
        ctx.beginPath();
        ctx.roundRect(c.x - 9 * s, y - 20 * s, 18 * s, 4.4 * s, 2.2 * s);
        ctx.fill();
        ctx.beginPath(); ctx.arc(c.x - 4.6 * s, y - 17.5 * s, 1.4 * s, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(c.x + 4.6 * s, y - 17.5 * s, 1.4 * s, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'glasses': {
        ctx.strokeStyle = '#3a3428';
        ctx.lineWidth = 1.2 * s;
        ctx.beginPath(); ctx.arc(c.x - 3.4 * s, y - 14 * s, 2.6 * s, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(c.x + 3.4 * s, y - 14 * s, 2.6 * s, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(c.x - 0.8 * s, y - 14 * s); ctx.lineTo(c.x + 0.8 * s, y - 14 * s); ctx.stroke();
        break;
      }
      case 'collar': {
        ctx.fillStyle = '#f5f5f0';
        ctx.beginPath();
        ctx.moveTo(c.x - 4 * s, y - 8 * s);
        ctx.lineTo(c.x, y - 5 * s);
        ctx.lineTo(c.x + 4 * s, y - 8 * s);
        ctx.lineTo(c.x, y - 6 * s);
        ctx.closePath(); ctx.fill();
        break;
      }
      case 'chrome': {
        ctx.fillStyle = '#c8c8d0';
        ctx.fillRect(c.x - 7 * s, y - 12 * s, 14 * s, 2 * s);
        break;
      }
      case 'cane': {
        ctx.strokeStyle = '#3a2e24';
        ctx.lineWidth = 1.6 * s;
        ctx.beginPath();
        ctx.moveTo(c.x + 9 * s, y - 12 * s);
        ctx.lineTo(c.x + 12 * s, y + 8 * s);
        ctx.stroke();
        break;
      }
      case 'arms': {
        ctx.strokeStyle = '#4a5a6a';
        ctx.lineWidth = 1.8 * s;
        for (let i = 0; i < 2; i++) {
          ctx.beginPath();
          ctx.moveTo(c.x + (i ? -8 : 8) * s, y - 8 * s);
          ctx.quadraticCurveTo(c.x + (i ? -16 : 16) * s, y - 2 * s, c.x + (i ? -12 : 12) * s, y + 8 * s);
          ctx.stroke();
        }
        break;
      }
      case 'glider': {
        ctx.strokeStyle = '#4a5a2e';
        ctx.lineWidth = 1.4 * s;
        ctx.beginPath();
        ctx.moveTo(c.x - 6 * s, y - 14 * s);
        ctx.lineTo(c.x - 16 * s, y - 8 * s);
        ctx.moveTo(c.x + 6 * s, y - 14 * s);
        ctx.lineTo(c.x + 16 * s, y - 8 * s);
        ctx.stroke();
        break;
      }
      case 'leaf': {
        ctx.fillStyle = '#7a9a5a';
        ctx.beginPath(); ctx.ellipse(c.x + 10 * s, y - 8 * s, 2.6 * s, 4 * s, 0.4, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'cat': {
        ctx.fillStyle = '#e8e0d0';
        ctx.beginPath(); ctx.arc(c.x + 11 * s, y - 3 * s, 2 * s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#4a3a2e';
        ctx.beginPath(); ctx.arc(c.x + 11 * s, y - 3 * s, 1 * s, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'chili': {
        ctx.fillStyle = '#b03a2e';
        ctx.beginPath(); ctx.ellipse(c.x + 10 * s, y - 3 * s, 2 * s, 3 * s, 0.3, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'crossword': {
        ctx.fillStyle = '#e8e0d0';
        ctx.fillRect(c.x + 8 * s, y - 8 * s, 6 * s, 7 * s);
        ctx.fillStyle = '#5a4a3a';
        for (let i = 0; i < 3; i++) ctx.fillRect(c.x + 9 * s, y - 6.4 * s + i * 2 * s, 4 * s, 0.8 * s);
        break;
      }
      default:
        break;
    }
  },

  /* droids: cylinder body + dome head */
  drawDroid(eng, ctx, a, c, y, s, hue, look, vs, now) {
    ctx.save();
    ctx.translate(c.x, y);
    // legs: little wheels/feet
    ctx.fillStyle = '#3b3630';
    ctx.beginPath(); ctx.arc(-5 * s, 8 * s, 2.6 * s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5 * s, 8 * s, 2.6 * s, 0, Math.PI * 2); ctx.fill();
    // body cylinder
    ctx.fillStyle = hue;
    ctx.beginPath();
    ctx.roundRect(-8 * s, -8 * s, 16 * s, 16 * s, 4 * s);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(-8 * s, -8 * s, 16 * s, 4 * s);
    // panel details
    ctx.fillStyle = look.tc || '#d8e4f0';
    ctx.fillRect(-4 * s, -2 * s, 3 * s, 3 * s);
    ctx.fillRect(1 * s, -2 * s, 3 * s, 3 * s);
    // dome head
    ctx.fillStyle = look.tc || hue;
    ctx.beginPath();
    ctx.arc(0, -10 * s, 6.4 * s, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#3b3630';
    ctx.beginPath();
    ctx.arc(2.6 * s, -12 * s, 1.4 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  _buildBlurBands(eng) {
    const w = eng.cssW, h = eng.cssH;
    const band = Math.round(h * 0.07);
    const make = () => {
      const c = document.createElement('canvas');
      c.width = w; c.height = band;
      return c;
    };
    // top band (fade baked in: sharp at the seam, soft at the edge)
    const top = make();
    const tg = top.getContext('2d');
    tg.drawImage(eng.staticLayer, 0, 0, w, band, 0, 0, w, band);
    tg.filter = 'blur(' + Math.max(2, band * 0.12) + 'px)';
    tg.drawImage(eng.staticLayer, 0, 0, w, band, 0, 0, w, band);
    const fadeT = tg.createLinearGradient(0, band * 0.35, 0, band);
    fadeT.addColorStop(0, 'rgba(0,0,0,0)');
    fadeT.addColorStop(1, 'rgba(0,0,0,1)');
    tg.globalCompositeOperation = 'destination-in';
    tg.fillStyle = fadeT;
    tg.fillRect(0, 0, w, band);
    this._blurTop = top;
    // bottom band
    const bot = make();
    const bg = bot.getContext('2d');
    const y0 = h - band;
    bg.drawImage(eng.staticLayer, 0, y0, w, band, 0, 0, w, band);
    bg.filter = 'blur(' + Math.max(3, band * 0.16) + 'px)';
    bg.drawImage(eng.staticLayer, 0, y0, w, band, 0, 0, w, band);
    const fadeB = bg.createLinearGradient(0, 0, 0, band * 0.65);
    fadeB.addColorStop(0, 'rgba(0,0,0,1)');
    fadeB.addColorStop(1, 'rgba(0,0,0,0)');
    bg.globalCompositeOperation = 'destination-in';
    bg.fillStyle = fadeB;
    bg.fillRect(0, 0, w, band);
    this._blurBottom = bot;
  },

  drawLabels(eng, ctx) {
    const now = performance.now() / 1000;
    // speech bubbles (top-most)
    for (const a of eng.agents.values()) {
      if (a.bubble.text && now < a.bubble.until) {
        const c = this.map(eng, a.x, a.y);
        this.drawBubble(eng, ctx, a, c.x, c.y - eng.s(46));
      }
    }
    // hover name tags
    ctx.font = `700 ${eng.s(10.5)}px ${monoFont()}`;
    ctx.textAlign = 'center';
    if (eng.hoverAgent) {
      const a = eng.agents.get(eng.hoverAgent);
      if (a) {
        const c = this.map(eng, a.x, a.y);
        const tw = ctx.measureText(a.name).width;
        ctx.fillStyle = 'rgba(30,25,40,0.85)';
        eng.roundRectPath(ctx, c.x - tw / 2 - eng.s(6), c.y - eng.s(46), tw + eng.s(12), eng.s(16), eng.s(8));
        ctx.fill();
        ctx.fillStyle = '#f7f3ea';
        ctx.fillText(a.name, c.x, c.y - eng.s(34));
      }
    }
    ctx.textAlign = 'left';
  },

  drawBubble(eng, ctx, a, x, y) {
    const s = eng.scale;
    const text = a.bubble.text;
    const icon = a.bubble.icon;
    ctx.font = `600 ${11 * s}px ${monoFont()}`;
    const tw = ctx.measureText(text).width;
    const iw = icon ? 16 * s + 5 * s : 0;
    const w = Math.min(tw + iw + 18 * s, 150 * s);
    const h = 22 * s;
    const bx = clamp(x - w / 2, 4 * s, eng.cssW - w - 4 * s);
    const by = y - h - 6 * s;
    ctx.fillStyle = 'rgba(255,253,246,0.95)';
    ctx.strokeStyle = 'rgba(200,185,150,0.8)';
    ctx.lineWidth = 1.2 * s;
    ctx.beginPath();
    ctx.roundRect(bx, by, w, h, 8 * s);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 5 * s, by + h - 1 * s);
    ctx.lineTo(x, by + h + 6 * s);
    ctx.lineTo(x + 5 * s, by + h - 1 * s);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a3428';
    if (icon) {
      ctx.font = `${13 * s}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(icon, bx + 13 * s, by + h / 2 + 4.5 * s);
      ctx.textAlign = 'left';
    }
    ctx.font = `600 ${11 * s}px ${monoFont()}`;
    ctx.textAlign = 'center';
    ctx.fillText(text, bx + w / 2 + iw / 2, by + h / 2 + 4 * s);
    ctx.textAlign = 'left';
  },

  hitTest(eng, px, py) {
    const sorted = [...eng.agents.values()].sort((a, b) => (b.y + b.x) - (a.y + a.x));
    for (const a of sorted) {
      const c = this.map(eng, a.x, a.y);
      if (Math.hypot(px - c.x, py - (c.y - eng.s(24))) < eng.s(18)) return { kind: 'agent', id: a.id };
    }
    const mail = eng.theme.stations.find(st => st.type === 'mail');
    if (mail) {
      const c = this.map(eng, mail.x, mail.y);
      if (Math.abs(px - c.x) < eng.s(28) && py > c.y - eng.s(50) && py < c.y + eng.s(10)) return { kind: 'mail' };
    }
    return null;
  },

  /* geometry helpers */
  tile(eng, g, x, y, fill) {
    const p0 = this.map(eng, x, y), p1 = this.map(eng, x + 1, y),
          p2 = this.map(eng, x + 1, y + 1), p3 = this.map(eng, x, y + 1);
    g.beginPath();
    g.moveTo(p0.x, p0.y); g.lineTo(p1.x, p1.y); g.lineTo(p2.x, p2.y); g.lineTo(p3.x, p3.y);
    g.closePath(); g.fill();
  },

  isoBox(eng, g, x1, y1, x2, y2, h, top, left, right) {
    const a = this.map(eng, x1, y1), b = this.map(eng, x2, y1),
          c = this.map(eng, x2, y2), d = this.map(eng, x1, y2);
    g.fillStyle = top;
    g.beginPath();
    g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineTo(c.x, c.y); g.lineTo(d.x, d.y);
    g.closePath(); g.fill();
    g.fillStyle = left;
    g.beginPath();
    g.moveTo(a.x, a.y); g.lineTo(d.x, d.y); g.lineTo(d.x, d.y + eng.s(h)); g.lineTo(a.x, a.y + eng.s(h));
    g.closePath(); g.fill();
    g.fillStyle = right;
    g.beginPath();
    g.moveTo(b.x, b.y); g.lineTo(c.x, c.y); g.lineTo(c.x, c.y + eng.s(h)); g.lineTo(b.x, b.y + eng.s(h));
    g.closePath(); g.fill();
  },

  drawDesk(eng, g, x, y, p) {
    g.fillStyle = 'rgba(0,0,0,0.06)';
    eng.ellipseIso(x, y, 0.75, 0.42, g.fillStyle);
    this.isoBox(eng, g, x - 0.42, y - 0.26, x + 0.42, y + 0.26, 14, p.woodTop, p.wood, p.woodDark);
    this.drawMonitor(eng, g, x - 0.05, y - 0.12, p, 20);
    const ch = this.map(eng, x + 0.02, y + 0.4);
    g.fillStyle = p.chair;
    g.fillRect(ch.x - 7 * eng.scale, ch.y - 16 * eng.scale, 14 * eng.scale, 16 * eng.scale);
    g.fillRect(ch.x - 9 * eng.scale, ch.y - 20 * eng.scale, 18 * eng.scale, 5 * eng.scale);
  },

  drawMonitor(eng, g, x, y, p, h) {
    const c = this.map(eng, x, y);
    g.fillStyle = p.monitor;
    g.fillRect(c.x - 10 * eng.scale, c.y - h * eng.scale - 4 * eng.scale, 20 * eng.scale, 14 * eng.scale);
    g.fillStyle = p.screen;
    g.fillRect(c.x - 8 * eng.scale, c.y - h * eng.scale - 2 * eng.scale, 16 * eng.scale, 10 * eng.scale);
    g.fillStyle = p.monitor;
    g.fillRect(c.x - 2 * eng.scale, c.y - 4 * eng.scale, 4 * eng.scale, 4 * eng.scale);
  },

  drawChair(eng, g, x, y, color) {
    const c = this.map(eng, x, y);
    g.fillStyle = color;
    g.fillRect(c.x - 7 * eng.scale, c.y - 15 * eng.scale, 14 * eng.scale, 15 * eng.scale);
    g.fillRect(c.x - 9 * eng.scale, c.y - 19 * eng.scale, 18 * eng.scale, 5 * eng.scale);
  },

  drawPlant(eng, g, x, y, pot, leaf) {
    const c = this.map(eng, x, y);
    g.fillStyle = leaf;
    for (const [dx, dy, r] of [[-0.18, -0.12, 9], [0.18, -0.1, 9], [0, -0.2, 11]]) {
      g.beginPath();
      g.arc(c.x + dx * 20 * eng.scale, c.y - 26 * eng.scale + dy * 16 * eng.scale, r * eng.scale, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = pot;
    g.fillRect(c.x - 9 * eng.scale, c.y - 14 * eng.scale, 18 * eng.scale, 14 * eng.scale);
    g.fillStyle = shade(pot, -30);
    g.fillRect(c.x - 9 * eng.scale, c.y - 4 * eng.scale, 18 * eng.scale, 4 * eng.scale);
  },
};

let _lastNow = 0;
function dtOf(now) {
  const d = now - (_lastNow || now);
  _lastNow = now;
  return Math.min(0.1, d);
}
