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
    this.agentsV = new Map();   // per-agent visual state
    this.backdrop = null;
    const img = new Image();
    img.src = '/assets/office-window.png';
    img.onload = () => { this.backdrop = img; if (eng.renderer === this) eng.resize(); };
    this._dust = [];
    for (let i = 0; i < 46; i++) {
      this._dust.push({
        x: Math.random(), y: Math.random(), z: Math.random() * 0.6 + 0.2,
        s: Math.random() * 1.6 + 0.5, p: Math.random() * Math.PI * 2,
      });
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
    const fit = Math.min(eng.cssW / 720, eng.cssH / 400);
    eng.scale = clamp(fit, 0.42, 1.5);
    eng.ox = eng.cssW / 2;
    eng.oy = eng.cssH / 2 + 24;
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
    if (customBg) {
      const iw = this.customBackdrop.width, ih = this.customBackdrop.height;
      const ar = iw / ih, tar = w / h;
      let dw = w, dh = h, dx = 0, dy = 0;
      if (ar > tar) { dw = h * ar; dx = -(dw - w) / 2; }
      else { dh = w / ar; dy = -(dh - h) / 2; }
      g.drawImage(this.customBackdrop, dx, dy, dw, dh);
      // darken slightly so the office pops
      g.fillStyle = 'rgba(10,8,20,0.25)';
      g.fillRect(0, 0, w, h);
    }

    /* floor */
    for (let x = 0; x < GRID; x++) {
      for (let y = 0; y < GRID; y++) {
        const c = (x + y) % 2 === 0 ? eng.theme.floor.base : eng.theme.floor.alt;
        this.tile(eng, g, x, y, customBg ? c + 'e0' : c);
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
    // warm center light pool
    const ctr = this.map(eng, GRID / 2, GRID / 2);
    const grad = g.createRadialGradient(ctr.x, ctr.y, 10, ctr.x, ctr.y, eng.s(330));
    grad.addColorStop(0, 'rgba(255,244,214,0.55)');
    grad.addColorStop(1, 'rgba(255,244,214,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);

    /* back walls + window with AI art */
    const back = eng.theme.wall.back, side = eng.theme.wall.side;
    g.fillStyle = customBg ? side + 'e6' : side;
    g.beginPath();
    g.moveTo(this.map(eng, 0, 0).x, this.map(eng, 0, 0).y);
    g.lineTo(this.map(eng, GRID, 0).x, this.map(eng, GRID, 0).y);
    g.lineTo(this.map(eng, GRID, 0).x, this.map(eng, GRID, 0).y - eng.s(84));
    g.lineTo(this.map(eng, 0, 0).x, this.map(eng, 0, 0).y - eng.s(84));
    g.closePath(); g.fill();
    g.fillStyle = customBg ? back + 'e6' : back;
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

    // soft vignette
    const vg = g.createRadialGradient(eng.cssW / 2, eng.cssH / 2, eng.cssH * 0.45, eng.cssW / 2, eng.cssH / 2, eng.cssH * 0.95);
    vg.addColorStop(0, 'rgba(60,40,20,0)');
    vg.addColorStop(1, 'rgba(60,40,20,0.16)');
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
    // lounge
    const lg = eng.theme.stations.find(s => s.type === 'lounge');
    if (lg) {
      eng.ellipseIso(lg.x, lg.y, 1.4, 0.8, p.rugGreen);
      this.isoBox(eng, g, lg.x - 0.7, lg.y - 0.35, lg.x + 0.1, lg.y + 0.35, 18, p.rugGreen, p.rugGreen, shade(p.rugGreen, -30));
      this.isoBox(eng, g, lg.x + 0.55, lg.y - 0.2, lg.x + 0.95, lg.y + 0.2, 12, p.woodTop, p.wood, p.woodDark);
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

  /* per-frame dynamic: agents, mailbox glow, dust, labels */
  draw(eng, ctx, dt) {
    ctx.clearRect(0, 0, eng.cssW, eng.cssH);
    if (eng.staticLayer) ctx.drawImage(eng.staticLayer, 0, 0);

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
    const vs = this.agentsV.get(a.id) || { squash: 0, blink: 0, arm: 0 };
    const now = performance.now() / 1000;
    const bob = a.moving ? Math.sin(a.walkPhase) * 1.8 * s : Math.sin(a.walkPhase * 0.55) * 1.1 * s;
    // squash & stretch along motion
    const spd = Math.min(1, Math.hypot(a.vx, a.vy));
    const sq = a.moving ? 0.10 * spd : 0;
    const stretchY = 1 + sq, stretchX = 1 - sq * 0.6;
    const y = c.y - s * 24 + bob;
    // blink
    if (now > a.blinkAt) { vs.blink = 1; a.blinkAt = now + 2 + Math.random() * 4; }
    vs.blink = Math.max(0, vs.blink - dtOf(now));

    // shadow
    ctx.fillStyle = 'rgba(60,45,30,0.20)';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + s * 2, s * 14 * stretchX, s * 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const cx = c.x, scale = s;
    ctx.save();
    ctx.translate(cx, y);
    ctx.scale(stretchX, stretchY);

    // legs
    const legSwing = a.moving ? Math.sin(a.walkPhase) * 3.6 * scale : 0;
    ctx.fillStyle = shade(a.color, -55);
    ctx.beginPath();
    ctx.roundRect(-7 * scale + legSwing, 6 * scale, 5.5 * scale, 7 * scale, 2.5 * scale);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(1.5 * scale - legSwing, 6 * scale, 5.5 * scale, 7 * scale, 2.5 * scale);
    ctx.fill();

    // body capsule
    ctx.fillStyle = a.color;
    ctx.beginPath();
    ctx.roundRect(-10 * scale, -4 * scale, 20 * scale, 16 * scale, 8 * scale);
    ctx.fill();
    ctx.strokeStyle = shade(a.color, -30);
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();

    // head
    const headY = -11 * scale;
    ctx.fillStyle = a.color;
    ctx.beginPath();
    ctx.arc(0, headY, 9.5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // ears for some
    if (hashCode(a.name) % 3 === 0) {
      ctx.beginPath();
      ctx.moveTo(-9 * scale, headY - 3 * scale);
      ctx.lineTo(-12 * scale, headY - 12 * scale);
      ctx.lineTo(-3.5 * scale, headY - 8.5 * scale);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(9 * scale, headY - 3 * scale);
      ctx.lineTo(12 * scale, headY - 12 * scale);
      ctx.lineTo(3.5 * scale, headY - 8.5 * scale);
      ctx.closePath(); ctx.fill();
      ctx.stroke(); ctx.stroke();
    }

    // eyes
    const look = a.facing * 1.6 * scale;
    const eyeH = vs.blink > 0.5 ? 1.2 : 4.2;
    for (const ex of [-3.4, 3.4]) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(ex * scale + look * 0.3, headY - 1 * scale, 3.4 * scale, eyeH * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      if (vs.blink <= 0.5) {
        ctx.fillStyle = '#22242a';
        ctx.beginPath();
        ctx.arc(ex * scale + look * 0.3 + 1 * scale, headY - 0.4 * scale, 1.7 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // nose
    ctx.fillStyle = shade(a.color, -45);
    ctx.beginPath();
    ctx.arc(0, headY + 2.5 * scale, 1.6 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // tool chip
    if (a.status === 'tool' && !(a.bubble.text && now < a.bubble.until)) {
      ctx.font = `${15 * scale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(toolIcon(a.currentTool), c.x, y - 22 * scale);
      ctx.textAlign = 'left';
    }
    // delivery toss
    if (a.toss > 0) {
      const t = 1 - a.toss / 0.8;
      const ex = c.x + 26 * scale * t;
      const ey = y - 30 * scale * Math.sin(t * Math.PI);
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(t * 1.4);
      ctx.fillStyle = '#f5f5f0';
      ctx.fillRect(-6 * scale, -4 * scale, 12 * scale, 8 * scale);
      ctx.restore();
    }
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
