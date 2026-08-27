/* Hermes Agent Office — Theme 3 "Dunder Mifflin" renderer.
 * Flat 2D cartoon sitcom style (The Office opening credits vibe): the
 * AI-painted office as a backdrop, outline-styled cartoon characters walking
 * the floor, paper-slip deliveries, sitcom warmth.
 */
'use strict';

const DunderRenderer = {
  name: 'dunder',

  init(eng) {
    this.agentsV = new Map();
    this._blurTop = null;
    this._blurBottom = null;
    this._blurTimer = 0;
    this.backdrop = null;
    const img = new Image();
    img.src = '/assets/dunder-backdrop.png';
    img.onload = () => { this.backdrop = img; if (eng.renderer === this) eng.resize(); };
    this._flakes = [];
    for (let i = 0; i < 24; i++) {
      this._flakes.push({ x: Math.random(), y: Math.random(), s: Math.random() * 1.2 + 0.4, p: Math.random() * 6.28 });
    }
  },

  onAgentAdded(a) {
    this.agentsV.set(a.id, { walk: 0, blink: 0, tilt: 0 });
  },

  /* grid -> screen: x maps to horizontal position, y scales (back = smaller) */
  map(eng, x, y) {
    // scale-aware: the grid fits the viewport instead of using fixed fractions
    const depth = 0.72 + 0.28 * (y / 10);
    const s = eng.scale || 1;
    const mobile = eng.cssW < 860;
    // desktop: full-bleed backdrop with the grid anchored mid-low
    // mobile: grid fills the width and sits in the visible lower 2/3
    const sx = mobile
      ? eng.cssW * 0.06 + (x / 10) * (eng.cssW * 0.88)
      : eng.cssW * (0.055 + 0.89 * (x / 10));
    const sy = mobile
      ? eng.cssH * 0.42 + (y / 10) * (eng.cssH * 0.42) * (1.15 - depth * 0.4)
      : eng.cssH * (0.66 + (1 - depth) * 0.12);
    return { x: sx, y: sy, d: depth };
  },

  resize(eng) {
    const mfit = eng.cssW < 860 ? Math.min(eng.cssW / 340, eng.cssH / 520) : Math.min(eng.cssW / 1100, eng.cssH / 700);
    eng.scale = clamp(mfit * (eng.zoom || 1), 0.55, 1.3);
    eng.ox = 0; eng.oy = 0;
    this._buildStatic(eng);
  },

  _buildStatic(eng) {
    const w = eng.cssW, h = eng.cssH;
    const layer = document.createElement('canvas');
    layer.width = w; layer.height = h;
    const g = layer.getContext('2d');
    const p = eng.theme.props;

    // backdrop cover
    if (this.backdrop) {
      const iw = this.backdrop.width, ih = this.backdrop.height;
      const ar = iw / ih, tar = w / h;
      let dw = w, dh = h, dx = 0, dy = 0;
      if (ar > tar) { dw = h * ar; dx = -(dw - w) / 2; }
      else { dh = w / ar; dy = -(dh - h) / 2; }
      g.drawImage(this.backdrop, dx, dy, dw, dh);
    } else {
      g.fillStyle = '#d9c9a8';
      g.fillRect(0, 0, w, h);
    }

    // ground shadow strip at the very bottom (the backdrop already has a floor)
    const floorY = h * 0.945;
    const fg = g.createLinearGradient(0, floorY, 0, h);
    fg.addColorStop(0, 'rgba(90,80,60,0)');
    fg.addColorStop(1, 'rgba(90,80,60,0.25)');
    g.fillStyle = fg;
    g.fillRect(0, floorY, w, h - floorY);

    // INBOX tray (mail) near reception, drawn on the floor
    const mail = eng.theme.stations.find(s => s.type === 'mail');
    if (mail) {
      const c = this.map(eng, mail.x, mail.y);
      const s = eng.scale;
      // tray
      g.fillStyle = p.mail;
      g.beginPath();
      g.roundRect(c.x - 34 * s, c.y - 14 * s, 68 * s, 22 * s, 6 * s);
      g.fill();
      g.fillStyle = p.mailDark;
      g.beginPath();
      g.roundRect(c.x - 34 * s, c.y - 14 * s, 68 * s, 6 * s, 3 * s);
      g.fill();
      g.fillStyle = '#fff';
      g.font = `800 ${12 * s}px ${monoFont()}`;
      g.textAlign = 'center';
      g.fillText('INBOX', c.x, c.y + 1 * s);
      g.textAlign = 'left';
      // paper slips
      for (let i = 0; i < 3; i++) {
        g.fillStyle = i === 0 ? '#fdfaf0' : '#f2edda';
        g.save();
        g.translate(c.x - 20 * s + i * 13 * s, c.y - 22 * s - i * 2 * s);
        g.rotate(-0.08 + i * 0.06);
        g.fillRect(-10 * s, -7 * s, 20 * s, 14 * s);
        g.restore();
      }
    }

    // paper texture overlay (very subtle)
    g.fillStyle = 'rgba(120,100,60,0.028)';
    for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
    // warm vignette
    const vg = g.createRadialGradient(w / 2, h / 2, h * 0.5, w / 2, h / 2, h * 1.05);
    vg.addColorStop(0, 'rgba(60,40,10,0)');
    vg.addColorStop(1, 'rgba(60,40,10,0.20)');
    g.fillStyle = vg;
    g.fillRect(0, 0, w, h);

    eng.staticLayer = layer;
  },

  draw(eng, ctx, dt) {
    ctx.clearRect(0, 0, eng.cssW, eng.cssH);
    this._blurTimer -= dt;
    if ((!this._blurTop || this._blurTimer <= 0) && eng.staticLayer) {
      this._buildBlurBands(eng);
      this._blurTimer = 2.0;
    }
    if (eng.staticLayer) ctx.drawImage(eng.staticLayer, 0, 0);

    const now = performance.now() / 1000;

    // drifting paper flecks (subtle sitcom texture)
    for (const f of this._flakes) {
      const x = ((f.x + now * 0.004) % 1) * eng.cssW;
      const y = (f.y + Math.sin(now * 0.3 + f.p) * 0.004) * eng.cssH;
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = '#fff';
      ctx.fillRect(x, y, 1.5 * f.s, 1.5 * f.s);
    }
    ctx.globalAlpha = 1;

    // agents (painter's order by depth)
    const sorted = [...eng.agents.values()].sort((a, b) => a.y - b.y);
    for (const a of sorted) this.drawAgent(eng, ctx, a, now);

    // mailbox glow + toss burst handled by particles
    eng.particles.draw(ctx, eng.scale);

    // labels: hand-written sticky notes (production polish)
    const mobile = eng.cssW < 860;
    // on mobile, only show the most important labels (declutter)
    const labelFilter = mobile
      ? (st) => ['bullpen', 'conference', 'michael', 'reception'].includes(st.id)
      : (st) => true;
    ctx.textAlign = 'center';
    ctx.font = `800 ${eng.s(mobile ? 9 : 11)}px ${monoFont()}`;
    for (const st of eng.theme.stations) {
      if (!labelFilter(st)) continue;
      const c = this.map(eng, st.x, st.y);
      const back = st.y < 3.5;
      const front = st.type === 'reception' || st.type === 'mail';
      const ly = back ? c.y - eng.s(mobile ? 30 : 44) : (front ? c.y - eng.s(mobile ? 26 : 40) : c.y - eng.s(mobile ? 16 : 26));
      const tw = ctx.measureText(st.label.toUpperCase()).width;
      const rot = (st.id.length % 5 - 2) * 0.02; // tiny per-label rotation, hand-placed feel
      ctx.save();
      ctx.translate(c.x, ly - eng.s(5));
      ctx.rotate(rot);
      // sticky note: cream paper with folded top shadow
      ctx.fillStyle = 'rgba(250,244,214,0.95)';
      eng.roundRectPath(ctx, -tw / 2 - eng.s(6), -eng.s(10), tw + eng.s(12), eng.s(17), eng.s(4));
      ctx.fill();
      ctx.fillStyle = 'rgba(200,180,120,0.5)';
      eng.roundRectPath(ctx, -tw / 2 - eng.s(6), -eng.s(10), tw + eng.s(12), eng.s(4), eng.s(4));
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,95,55,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#4a3b26';
      ctx.fillText(st.label.toUpperCase(), 0, 0);
      ctx.restore();
    }
    // name tags (always on for the cast, plus hover for the rest) — hidden on mobile
    const tags = [...eng.agents.values()];
    if (mobile) { /* name tags off on small screens; bubbles carry identity */ }
    for (const a of tags) {
      // grounding shadow so characters sit ON the painted floor
      const c0 = this.map(eng, a.x, a.y);
      const sh = ctx.createRadialGradient(c0.x, c0.y + eng.s(4), eng.s(1), c0.x, c0.y + eng.s(4), eng.s(12));
      sh.addColorStop(0, 'rgba(60,45,25,0.30)');
      sh.addColorStop(1, 'rgba(60,45,25,0)');
      ctx.fillStyle = sh;
      ctx.beginPath();
      ctx.ellipse(c0.x, c0.y + eng.s(4), eng.s(12), eng.s(3.5), 0, 0, Math.PI * 2);
      ctx.fill();
      if (eng.hoverAgent === a.id || tags.length <= 8) {
        const c = this.map(eng, a.x, a.y);
        const tw = ctx.measureText(a.name).width;
        ctx.fillStyle = 'rgba(40,30,20,0.9)';
        eng.roundRectPath(ctx, c.x - tw / 2 - eng.s(6), c.y - eng.s(74), tw + eng.s(12), eng.s(16), eng.s(8));
        ctx.fill();
        ctx.fillStyle = '#fdfaf0';
        ctx.fillText(a.name, c.x, c.y - eng.s(62));
      }
    }
    // speech bubbles (2D style)
    for (const a of eng.agents.values()) {
      if (a.bubble.text && now < a.bubble.until) {
        const c = this.map(eng, a.x, a.y);
        this.drawBubble(eng, ctx, a, c.x, c.y - eng.s(96));
      }
    }
    ctx.textAlign = 'left';

    // tilt-shift DOF bands (soften top/bottom edges)
    const band = Math.round(eng.cssH * 0.06);
    if (this._blurTop) ctx.drawImage(this._blurTop, 0, 0, eng.cssW, band, 0, 0, eng.cssW, band);
    // bottom band dropped — keep the foreground sharp
  },

  _buildBlurBands(eng) {
    const w = eng.cssW, h = eng.cssH;
    const band = Math.round(h * 0.11);
    const mk = () => { const c = document.createElement('canvas'); c.width = w; c.height = band; return c; };
    const top = mk();
    const tg = top.getContext('2d');
    tg.drawImage(eng.staticLayer, 0, 0, w, band, 0, 0, w, band);
    tg.filter = 'blur(' + Math.max(3, band * 0.14) + 'px)';
    tg.drawImage(eng.staticLayer, 0, 0, w, band, 0, 0, w, band);
    this._blurTop = top;
    const bot = mk();
    const bg = bot.getContext('2d');
    const y0 = h - band;
    bg.drawImage(eng.staticLayer, 0, y0, w, band, 0, 0, w, band);
    bg.filter = 'blur(' + Math.max(3, band * 0.14) + 'px)';
    bg.drawImage(eng.staticLayer, 0, y0, w, band, 0, 0, w, band);
    this._blurBottom = bot;
  },

  drawAgent(eng, ctx, a, now) {
    const c = this.map(eng, a.x, a.y);
    const s = eng.scale * c.d;
    const vs = this.agentsV.get(a.id) || { walk: 0, blink: 0, tilt: 0 };
    const bob = a.moving ? Math.abs(Math.sin(a.walkPhase)) * -3 * s : Math.sin(a.walkPhase * 0.5) * 1.2 * s;
    if (now > a.blinkAt) { vs.blink = 1; a.blinkAt = now + 2 + Math.random() * 4; }
    vs.blink = Math.max(0, vs.blink - (now - (vs._last || now)));
    vs._last = now;

    const y = c.y - 4 * s + bob;
    const color = a.color;
    const dark = shade(color, -60); // deep ink tone

    // shadow
    ctx.fillStyle = 'rgba(50,40,25,0.22)';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + 2 * s, 15 * s, 4.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // legs (cartoon, with walk swing)
    const swing = a.moving ? Math.sin(a.walkPhase) * 4 * s : 0;
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(3.6 * s, 2);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(c.x - 6 * s, y + 2 * s);
    ctx.lineTo(c.x - 6 * s + swing, y + 12 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(c.x + 6 * s, y + 2 * s);
    ctx.lineTo(c.x + 6 * s - swing, y + 12 * s);
    ctx.stroke();

    const ink = Math.max(2.6 * s, 2.0);   // bold cartoon ink outline
    // body (rounded, outlined)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(c.x - 11 * s, y - 12 * s, 22 * s, 17 * s, 8 * s);
    ctx.fill();
    ctx.strokeStyle = dark;
    ctx.lineWidth = ink;
    ctx.stroke();
    // flat two-tone shading band (bottom of body)
    ctx.fillStyle = shade(color, -18);
    ctx.beginPath();
    ctx.roundRect(c.x - 11 * s, y + 1 * s, 22 * s, 4 * s, 6 * s);
    ctx.fill();
    // belly
    ctx.fillStyle = shade(color, 28);
    ctx.beginPath();
    ctx.ellipse(c.x, y - 4 * s, 7 * s, 6 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = dark;
    ctx.lineWidth = ink * 0.7;
    ctx.stroke();

    // arms (swing while walking)
    const armSwing = a.moving ? Math.sin(a.walkPhase + Math.PI) * 3.5 * s : 0;
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(3 * s, 1.6);
    ctx.beginPath();
    ctx.moveTo(c.x - 10 * s, y - 8 * s);
    ctx.lineTo(c.x - 13 * s, y - 3 * s + armSwing);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(c.x + 10 * s, y - 8 * s);
    ctx.lineTo(c.x + 13 * s, y - 3 * s - armSwing);
    ctx.stroke();

    // head
    const hy = y - 24 * s;
    ctx.fillStyle = shade(color, 16);
    ctx.beginPath();
    ctx.arc(c.x, hy, 10.5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = dark;
    ctx.lineWidth = ink;
    ctx.stroke();
    // hair swoosh (some)
    if (hashCode(a.name) % 2 === 0) {
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.ellipse(c.x, hy - 6 * s, 10 * s, 5.5 * s, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    }
    // eyes
    const look = a.facing * 1.4 * s;
    for (const ex of [-3.6, 3.6]) {
      if (vs.blink > 0.5) {
        ctx.strokeStyle = dark;
        ctx.lineWidth = 1.6 * s;
        ctx.beginPath();
        ctx.moveTo(c.x + ex * s - 2 * s, hy - 1 * s);
        ctx.lineTo(c.x + ex * s + 2 * s, hy - 1 * s);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(c.x + ex * s + look * 0.3, hy - 1 * s, 3.2 * s, 4 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = dark;
        ctx.lineWidth = 1 * s;
        ctx.stroke();
        ctx.fillStyle = '#2a2320';
        ctx.beginPath();
        ctx.arc(c.x + ex * s + look * 0.3 + 0.8 * s, hy - 0.5 * s, 1.6 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // smile
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.4 * s;
    ctx.beginPath();
    ctx.arc(c.x, hy + 4 * s, 4 * s, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    // tool glyph
    if (a.status === 'tool' && !(a.bubble.text && now < a.bubble.until)) {
      ctx.font = `${14 * s}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(toolIcon(a.currentTool), c.x, hy - 24 * s);
      ctx.textAlign = 'left';
    }
    // toss (paper slip to inbox)
    if (a.toss > 0) {
      const t = 1 - a.toss / 0.8;
      const ex = c.x + 26 * s * t;
      const ey = hy - 34 * s * Math.sin(t * Math.PI);
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(t * 1.2);
      ctx.fillStyle = '#fdfaf0';
      ctx.strokeStyle = '#b8a683';
      ctx.lineWidth = 1 * s;
      ctx.fillRect(-8 * s, -6 * s, 16 * s, 12 * s);
      ctx.stroke();
      ctx.restore();
    }
  },

  drawBubble(eng, ctx, a, x, y) {
    const s = eng.scale;
    const text = a.bubble.text;
    ctx.font = `700 ${11 * s}px ${monoFont()}`;
    const tw = ctx.measureText(text).width;
    const w = Math.min(tw + 20 * s, 160 * s);
    const h = 24 * s;
    const bx = clamp(x - w / 2, 4 * s, eng.cssW - w - 4 * s);
    const by = y - h - 6 * s;
    ctx.fillStyle = '#fdfaf0';
    ctx.strokeStyle = '#8a7350';
    ctx.lineWidth = 1.6 * s;
    ctx.beginPath();
    ctx.roundRect(bx, by, w, h, 10 * s);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 6 * s, by + h - 2 * s);
    ctx.lineTo(x, by + h + 7 * s);
    ctx.lineTo(x + 6 * s, by + h - 2 * s);
    ctx.closePath(); ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#3d3526';
    ctx.font = `700 ${11 * s}px ${monoFont()}`;
    ctx.textAlign = 'center';
    ctx.fillText(text, bx + w / 2, by + h / 2 + 4 * s);
    ctx.textAlign = 'left';
  },

  hitTest(eng, px, py) {
    const sorted = [...eng.agents.values()].sort((a, b) => b.y - a.y);
    for (const a of sorted) {
      const c = this.map(eng, a.x, a.y);
      const r = 18 * eng.scale * c.d;
      if (Math.hypot(px - c.x, py - (c.y - eng.s(22) * c.d)) < r) return { kind: 'agent', id: a.id };
    }
    const mail = eng.theme.stations.find(st => st.type === 'mail');
    if (mail) {
      const c = this.map(eng, mail.x, mail.y);
      if (Math.abs(px - c.x) < 44 * eng.scale && py > c.y - 30 * eng.scale && py < c.y + 14 * eng.scale) return { kind: 'mail' };
    }
    return null;
  },
};
