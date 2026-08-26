/* Hermes Agent Office — Theme 2 "Nous" renderer.
 * A dark holographic data plane: AI-painted data center backdrop, one-point
 * perspective neon grid, fog, glowing energy agents with light trails.
 */
'use strict';

const NousRenderer = {
  name: 'nous',

  init(eng) {
    this.agentsV = new Map();
    this.backdrop = null;
    const img = new Image();
    img.src = '/assets/nous-backdrop.png';
    img.onload = () => { this.backdrop = img; if (eng.renderer === this) eng.resize(); };
    this.trails = new Map();   // agent id -> [{x,y,t}...]
    this._motes = [];
    for (let i = 0; i < 60; i++) {
      this._motes.push({ x: Math.random(), y: Math.random(), z: Math.random() * 0.5 + 0.2, p: Math.random() * 6.28, c: Math.random() < 0.5 ? '#6ee7f7' : '#4d7cf6' });
    }
    this.arc = { t: 0 };
  },

  onAgentAdded(a) {
    this.agentsV.set(a.id, { pulse: Math.random() * 6.28, trail: [] });
  },

  /* grid -> screen: one-point perspective (y=0 far, y=GRID near) */
  map(eng, x, y) {
    const depth = 0.16 + 0.84 * (y / GRID);
    const cx = eng.cssW / 2;
    const sx = cx + (x - GRID / 2) * eng.s(46) * depth;
    const baseY = eng.cssH * 0.44;
    const sy = baseY + (GRID - y) * eng.s(30) * depth + (depth - 0.16) * eng.s(90);
    return { x: sx, y: sy };
  },

  resize(eng) {
    eng.scale = clamp(Math.min(eng.cssW / 900, eng.cssH / 640), 0.55, 1.4);
    eng.ox = eng.cssW / 2;
    eng.oy = eng.cssH * 0.44;
    this._buildStatic(eng);
  },

  _buildStatic(eng) {
    const w = eng.cssW, h = eng.cssH;
    const layer = document.createElement('canvas');
    layer.width = w; layer.height = h;
    const g = layer.getContext('2d');
    const p = eng.theme.props;

    // backdrop image (cover)
    if (this.backdrop) {
      const iw = this.backdrop.width, ih = this.backdrop.height;
      const ar = iw / ih, tar = w / h;
      let dw = w, dh = h, dx = 0, dy = 0;
      if (ar > tar) { dw = h * ar; dx = -(dw - w) / 2; }
      else { dh = w / ar; dy = -(dh - h) / 2; }
      g.drawImage(this.backdrop, dx, dy, dw, dh);
    } else {
      g.fillStyle = '#07070d';
      g.fillRect(0, 0, w, h);
    }
    // darken the upper area for HUD legibility
    const dg = g.createLinearGradient(0, 0, 0, h);
    dg.addColorStop(0, 'rgba(4,4,10,0.55)');
    dg.addColorStop(0.4, 'rgba(4,4,10,0.15)');
    dg.addColorStop(1, 'rgba(4,4,10,0.75)');
    g.fillStyle = dg;
    g.fillRect(0, 0, w, h);

    // perspective floor grid over the lower half
    const horizon = h * 0.44;
    g.save();
    g.beginPath();
    g.rect(0, horizon, w, h - horizon);
    g.clip();
    // horizontal lines (depth rings)
    for (let i = 0; i <= 14; i++) {
      const y = horizon + (h - horizon) * Math.pow(i / 14, 1.7);
      const a = 0.05 + 0.22 * (i / 14);
      g.strokeStyle = `rgba(77,124,246,${a})`;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(0, y); g.lineTo(w, y);
      g.stroke();
    }
    // converging vertical lines
    const cx = w / 2;
    for (let i = -16; i <= 16; i++) {
      const x = cx + i * eng.s(26);
      const a = 0.05 + 0.18 * (Math.abs(i) / 16);
      g.strokeStyle = `rgba(110,231,247,${a})`;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(x, horizon);
      g.lineTo(cx + i * 60, h);
      g.stroke();
    }
    // glowing horizon line
    g.strokeStyle = 'rgba(110,231,247,0.5)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, horizon); g.lineTo(w, horizon);
    g.stroke();
    const hg = g.createLinearGradient(0, horizon - 24, 0, horizon + 24);
    hg.addColorStop(0, 'rgba(110,231,247,0)');
    hg.addColorStop(0.5, 'rgba(110,231,247,0.18)');
    hg.addColorStop(1, 'rgba(110,231,247,0)');
    g.fillStyle = hg;
    g.fillRect(0, horizon - 24, w, 48);
    g.restore();

    /* station props (drawn into static layer) */
    const stations = eng.theme.stations;
    // server racks along both edges
    for (let i = 0; i < 4; i++) {
      this.drawRack(eng, g, 0.6 + i * 1.15, 2.2, 1);
      this.drawRack(eng, g, 9.4 - i * 1.15, 2.2, -1);
    }
    // workstations = glowing terminal desks
    for (const [dx, dy] of eng.theme.desks) this.drawTerminal(eng, g, dx, dy);
    // tool gateway bench
    const tl = stations.find(s => s.type === 'tools');
    if (tl) this.drawToolBench(eng, g, tl.x, tl.y);
    // sync grid (meeting) = light table
    const mt = stations.find(s => s.type === 'meeting');
    if (mt) {
      const c = this.map(eng, mt.x, mt.y);
      g.fillStyle = 'rgba(77,124,246,0.16)';
      g.beginPath();
      g.ellipse(c.x, c.y, eng.s(96), eng.s(40), 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = 'rgba(110,231,247,0.5)';
      g.lineWidth = 1.5;
      g.stroke();
      // table slab
      g.fillStyle = '#0d0d16';
      g.beginPath();
      g.moveTo(this.map(eng, mt.x - 1.3, mt.y - 0.4).x, this.map(eng, mt.x - 1.3, mt.y - 0.4).y);
      g.lineTo(this.map(eng, mt.x + 1.3, mt.y - 0.4).x, this.map(eng, mt.x + 1.3, mt.y - 0.4).y);
      g.lineTo(this.map(eng, mt.x + 1.3, mt.y + 0.4).x, this.map(eng, mt.x + 1.3, mt.y + 0.4).y);
      g.lineTo(this.map(eng, mt.x - 1.3, mt.y + 0.4).x, this.map(eng, mt.x - 1.3, mt.y + 0.4).y);
      g.closePath(); g.fill();
      g.strokeStyle = 'rgba(110,231,247,0.35)';
      g.stroke();
      // floating data lines
      g.strokeStyle = 'rgba(110,231,247,0.4)';
      g.lineWidth = 1;
      for (let i = -2; i <= 2; i++) {
        g.beginPath();
        g.moveTo(c.x + i * eng.s(30), c.y - eng.s(16));
        g.lineTo(c.x + i * eng.s(30) + eng.s(10), c.y - eng.s(30));
        g.stroke();
      }
    }
    // idle pod (lounge) = soft pad
    const lg = stations.find(s => s.type === 'lounge');
    if (lg) {
      const c = this.map(eng, lg.x, lg.y);
      g.fillStyle = 'rgba(110,231,247,0.10)';
      g.beginPath();
      g.ellipse(c.x, c.y, eng.s(60), eng.s(26), 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = 'rgba(110,231,247,0.3)';
      g.lineWidth = 1;
      g.stroke();
    }
    // ingress (entrance) = portal arch
    const en = stations.find(s => s.type === 'entrance');
    if (en) {
      const c = this.map(eng, en.x, en.y);
      g.strokeStyle = 'rgba(110,231,247,0.8)';
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(c.x, c.y - eng.s(30), eng.s(18), eng.s(34), 0, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = 'rgba(110,231,247,0.15)';
      g.fill();
      g.fillStyle = 'rgba(110,231,247,0.7)';
      g.beginPath();
      g.ellipse(c.x, c.y - eng.s(30), eng.s(6), eng.s(12), 0, 0, Math.PI * 2);
      g.fill();
    }
    // scanlines
    g.fillStyle = 'rgba(0,0,0,0.14)';
    for (let y = 0; y < h; y += 5) g.fillRect(0, y, w, 1);
    // vignette
    const vg = g.createRadialGradient(w / 2, h / 2, h * 0.4, w / 2, h / 2, h * 0.95);
    vg.addColorStop(0, 'rgba(0,0,10,0)');
    vg.addColorStop(1, 'rgba(0,0,10,0.55)');
    g.fillStyle = vg;
    g.fillRect(0, 0, w, h);

    eng.staticLayer = layer;
  },

  drawRack(eng, g, x, y, dir) {
    const c = this.map(eng, x, y);
    const h = eng.s(86);
    g.fillStyle = '#0a0a12';
    g.fillRect(c.x - eng.s(12), c.y - h, eng.s(24), h);
    g.strokeStyle = 'rgba(77,124,246,0.4)';
    g.lineWidth = 1;
    g.strokeRect(c.x - eng.s(12), c.y - h, eng.s(24), h);
    // LEDs
    for (let r = 0; r < 7; r++) {
      for (let i = 0; i < 2; i++) {
        const on = (hashCode(Math.round(x * 100) + r * 7 + i) % 3) !== 0;
        if (on) {
          g.fillStyle = r % 2 === 0 ? '#6ee7f7' : '#4d7cf6';
          g.fillRect(c.x - eng.s(7) + i * eng.s(10), c.y - h + eng.s(8) + r * eng.s(10.5), eng.s(3), eng.s(3));
        }
      }
    }
  },

  drawTerminal(eng, g, x, y) {
    const c = this.map(eng, x, y);
    const s = eng.scale;
    // glowing desk line
    g.strokeStyle = 'rgba(110,231,247,0.45)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(c.x - 22 * s, c.y);
    g.lineTo(c.x + 22 * s, c.y);
    g.stroke();
    // holographic screen
    g.fillStyle = 'rgba(77,124,246,0.22)';
    g.beginPath();
    g.roundRect(c.x - 10 * s, c.y - 26 * s, 20 * s, 14 * s, 3 * s);
    g.fill();
    g.strokeStyle = 'rgba(110,231,247,0.6)';
    g.lineWidth = 1;
    g.stroke();
    g.fillStyle = 'rgba(110,231,247,0.7)';
    g.fillRect(c.x - 7 * s, c.y - 23 * s, 4 * s, 8 * s);
    g.fillRect(c.x - 1 * s, c.y - 23 * s, 4 * s, 8 * s);
    g.fillRect(c.x + 5 * s, c.y - 23 * s, 2 * s, 8 * s);
    // base
    g.fillStyle = '#0d0d16';
    g.fillRect(c.x - 12 * s, c.y - 4 * s, 24 * s, 4 * s);
  },

  drawToolBench(eng, g, x, y) {
    const c = this.map(eng, x, y);
    g.fillStyle = '#0a0a12';
    g.beginPath();
    g.moveTo(this.map(eng, x - 0.8, y - 0.3).x, this.map(eng, x - 0.8, y - 0.3).y);
    g.lineTo(this.map(eng, x + 0.8, y - 0.3).x, this.map(eng, x + 0.8, y - 0.3).y);
    g.lineTo(this.map(eng, x + 0.8, y + 0.3).x, this.map(eng, x + 0.8, y + 0.3).y);
    g.lineTo(this.map(eng, x - 0.8, y + 0.3).x, this.map(eng, x - 0.8, y + 0.3).y);
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(77,124,246,0.5)';
    g.stroke();
    this.drawTerminal(eng, g, x - 0.25, y - 0.15);
    this.drawTerminal(eng, g, x + 0.4, y - 0.15);
    // gear glyph
    g.font = `${20 * eng.scale}px sans-serif`;
    g.textAlign = 'center';
    g.fillText('⚙️', c.x, c.y - 30 * eng.scale);
    g.textAlign = 'left';
  },

  /* per-frame: agents as glowing orbs with trails */
  draw(eng, ctx, dt) {
    ctx.clearRect(0, 0, eng.cssW, eng.cssH);
    if (eng.staticLayer) ctx.drawImage(eng.staticLayer, 0, 0);

    const now = performance.now() / 1000;

    // ambient data motes
    for (const m of this._motes) {
      const x = ((m.x + now * 0.01 * m.z) % 1) * eng.cssW;
      const y = (m.y + Math.sin(now * 0.4 + m.p) * 0.02) * eng.cssH;
      ctx.globalAlpha = 0.25 * m.z + 0.1;
      ctx.fillStyle = m.c;
      ctx.beginPath();
      ctx.arc(x, y, 1.2 * m.z + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // trails + orbs
    const sorted = [...eng.agents.values()].sort((a, b) => (a.y + a.x) - (b.y + b.x));
    for (const a of sorted) {
      const vs = this.agentsV.get(a.id) || { pulse: 0, trail: [] };
      vs.pulse += dt * 3;
      const c = this.map(eng, a.x, a.y);
      const moving = a.moving;
      if (moving) {
        vs.trail.push({ x: c.x, y: c.y, t: now });
        if (vs.trail.length > 26) vs.trail.shift();
      } else if (vs.trail.length) {
        vs.trail.shift();
      }
      // draw trail
      for (let i = 0; i < vs.trail.length; i++) {
        const tr = vs.trail[i];
        const age = (now - tr.t) / 2.2;
        const alpha = 0.5 * (1 - age) * (i / vs.trail.length);
        if (alpha <= 0) continue;
        ctx.globalAlpha = alpha;
        ctx.drawImage(glowSprite(a.color, 64), tr.x - 20 * eng.scale, tr.y - 20 * eng.scale, 40 * eng.scale, 40 * eng.scale);
      }
      ctx.globalAlpha = 1;
      this.drawOrb(eng, ctx, a, c, vs, now);
    }

    // mail terminal glow
    const mail = eng.theme.stations.find(s => s.type === 'mail');
    if (mail) {
      const c = this.map(eng, mail.x, mail.y);
      const glowA = 0.35 + (eng.mailGlow > 0 ? 0.4 * eng.mailGlow : 0) + 0.12 * Math.sin(now * 2);
      ctx.globalAlpha = glowA;
      ctx.drawImage(glowSprite('rgba(110,231,247,0.9)', 160), c.x - 80 * eng.scale, c.y - 70 * eng.scale, 160 * eng.scale, 160 * eng.scale);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(110,231,247,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(c.x - 16 * eng.scale, c.y - 24 * eng.scale, 32 * eng.scale, 26 * eng.scale, 4 * eng.scale);
      ctx.stroke();
      ctx.fillStyle = 'rgba(110,231,247,0.25)';
      ctx.fill();
      // envelope glyph
      ctx.strokeStyle = 'rgba(110,231,247,0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(c.x - 9 * eng.scale, c.y - 16 * eng.scale);
      ctx.lineTo(c.x + 9 * eng.scale, c.y - 16 * eng.scale);
      ctx.lineTo(c.x + 9 * eng.scale, c.y - 4 * eng.scale);
      ctx.lineTo(c.x - 9 * eng.scale, c.y - 4 * eng.scale);
      ctx.closePath(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(c.x - 9 * eng.scale, c.y - 16 * eng.scale);
      ctx.lineTo(c.x, c.y - 9 * eng.scale);
      ctx.lineTo(c.x + 9 * eng.scale, c.y - 16 * eng.scale);
      ctx.stroke();
    }

    eng.particles.draw(ctx, eng.scale);

    // labels: mono HUD style
    ctx.textAlign = 'center';
    ctx.font = `600 ${eng.s(10)}px ${monoFont()}`;
    const usedLabels = [];
    for (const st of eng.theme.stations) {
      const c = this.map(eng, st.x, st.y);
      const back = st.y < 3;
      let ly = back ? c.y - eng.s(10) : c.y + eng.s(8);
      const tw = ctx.measureText(st.label.toUpperCase()).width;
      // collision-resolve against already-placed labels
      for (let tries = 0; tries < 6; tries++) {
        const clash = usedLabels.some(u =>
          Math.abs(c.x - u.x) < (u.w + tw) / 2 + eng.s(8) &&
          Math.abs(ly - u.y) < eng.s(20));
        if (!clash) break;
        ly += eng.s(18);
      }
      usedLabels.push({ x: c.x, y: ly, w: tw });
      ctx.fillStyle = 'rgba(6,8,16,0.75)';
      eng.roundRectPath(ctx, c.x - tw / 2 - eng.s(7), ly, tw + eng.s(14), eng.s(15), eng.s(7));
      ctx.fill();
      ctx.strokeStyle = 'rgba(110,231,247,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(190,220,255,0.85)';
      ctx.fillText(st.label.toUpperCase(), c.x, ly + eng.s(11));
    }
    // hover name tags
    if (eng.hoverAgent) {
      const a = eng.agents.get(eng.hoverAgent);
      if (a) {
        const c = this.map(eng, a.x, a.y);
        const tw = ctx.measureText(a.name).width;
        ctx.fillStyle = 'rgba(6,8,16,0.85)';
        eng.roundRectPath(ctx, c.x - tw / 2 - eng.s(6), c.y - eng.s(58), tw + eng.s(12), eng.s(16), eng.s(8));
        ctx.fill();
        ctx.strokeStyle = 'rgba(110,231,247,0.5)';
        ctx.stroke();
        ctx.fillStyle = '#dbe4ff';
        ctx.fillText(a.name, c.x, c.y - eng.s(46));
      }
    }
    // speech bubbles (collision-resolved so they never overlap)
    const used = [];
    for (const a of eng.agents.values()) {
      if (a.bubble.text && now < a.bubble.until) {
        const c = this.map(eng, a.x, a.y);
        let bx = c.x, by = c.y - eng.s(70);
        // push down if colliding with an earlier bubble
        for (let tries = 0; tries < 5; tries++) {
          const clash = used.some(r => Math.abs(bx - r.x) < (r.w + eng.s(90)) / 2 && Math.abs(by - r.y) < r.h + eng.s(6));
          if (!clash) break;
          by += eng.s(26);
        }
        const w = this.measureBubble(eng, a);
        used.push({ x: bx, y: by, w, h: eng.s(22) });
        this.drawBubble(eng, ctx, a, bx, by, w);
      }
    }
    ctx.textAlign = 'left';
  },

  drawOrb(eng, ctx, a, c, vs, now) {
    const s = eng.scale;
    const coreR = 9 * s + Math.sin(vs.pulse) * 1.6 * s;
    const color = a.color;
    // halo
    ctx.globalAlpha = 0.5;
    ctx.drawImage(glowSprite(color, 128), c.x - 64 * s, c.y - 70 * s, 128 * s, 128 * s);
    ctx.globalAlpha = 1;
    // core
    const grad = ctx.createRadialGradient(c.x, c.y - 6 * s, 0, c.x, c.y - 6 * s, coreR);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, color);
    grad.addColorStop(1, glowColor(color.slice(0, 7), 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c.x, c.y - 6 * s, coreR, 0, Math.PI * 2);
    ctx.fill();
    // inner ring
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.arc(c.x, c.y - 6 * s, coreR * 0.55, now * 2 + vs.pulse, now * 2 + vs.pulse + Math.PI * 1.4);
    ctx.stroke();
    // status ring color
    const statusColor = a.status === 'tool' ? '#f59e0b' : a.status === 'thinking' ? '#6ee7f7' : a.status === 'delivering' ? '#f472b6' : 'rgba(110,231,247,0.5)';
    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.arc(c.x, c.y - 6 * s, coreR * 1.9, 0, Math.PI * 2);
    ctx.stroke();
    // tool glyph
    if (a.status === 'tool' && !(a.bubble.text && now < a.bubble.until)) {
      ctx.font = `${13 * s}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(toolIcon(a.currentTool), c.x, c.y - 34 * s);
      ctx.textAlign = 'left';
    }
    // toss
    if (a.toss > 0) {
      const t = 1 - a.toss / 0.8;
      const ex = c.x + 26 * s * t;
      const ey = c.y - 6 * s - 30 * s * Math.sin(t * Math.PI);
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(t * 1.4);
      ctx.fillStyle = '#6ee7f7';
      ctx.fillRect(-6 * s, -4 * s, 12 * s, 8 * s);
      ctx.strokeStyle = '#dbe4ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(-6 * s, -4 * s, 12 * s, 8 * s);
      ctx.restore();
    }
  },

  measureBubble(eng, a) {
    const s = eng.scale;
    const text = a.bubble.text;
    const c = eng.renderer.ctx || document.createElement('canvas').getContext('2d');
    c.font = `600 ${11 * s}px ${monoFont()}`;
    const tw = c.measureText(text).width;
    return Math.min(tw + 18 * s, 150 * s);
  },

  drawBubble(eng, ctx, a, x, y, w) {
    const s = eng.scale;
    const text = a.bubble.text;
    if (!w) {
      ctx.font = `600 ${11 * s}px ${monoFont()}`;
      const tw = ctx.measureText(text).width;
      w = Math.min(tw + 18 * s, 150 * s);
    }
    const h = 22 * s;
    const bx = clamp(x - w / 2, 4 * s, eng.cssW - w - 4 * s);
    const by = y - h - 6 * s;
    ctx.fillStyle = 'rgba(10,12,22,0.92)';
    ctx.strokeStyle = 'rgba(110,231,247,0.55)';
    ctx.lineWidth = 1.2 * s;
    ctx.beginPath();
    ctx.roundRect(bx, by, w, h, 8 * s);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 5 * s, by + h - 1 * s);
    ctx.lineTo(x, by + h + 6 * s);
    ctx.lineTo(x + 5 * s, by + h - 1 * s);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#dbe4ff';
    ctx.font = `600 ${11 * s}px ${monoFont()}`;
    ctx.textAlign = 'center';
    ctx.fillText(text, bx + w / 2, by + h / 2 + 4 * s);
    ctx.textAlign = 'left';
  },

  hitTest(eng, px, py) {
    const sorted = [...eng.agents.values()].sort((a, b) => (b.y + b.x) - (a.y + a.x));
    for (const a of sorted) {
      const c = this.map(eng, a.x, a.y);
      if (Math.hypot(px - c.x, py - (c.y - eng.s(6))) < eng.s(22)) return { kind: 'agent', id: a.id };
    }
    const mail = eng.theme.stations.find(st => st.type === 'mail');
    if (mail) {
      const c = this.map(eng, mail.x, mail.y);
      if (Math.abs(px - c.x) < eng.s(30) && py > c.y - eng.s(40) && py < c.y + eng.s(10)) return { kind: 'mail' };
    }
    return null;
  },
};
