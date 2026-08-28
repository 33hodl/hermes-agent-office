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
    // themed character sprites (same registry as the office renderer)
    this.sprites = {};
    const names = ['michael', 'dwight', 'jim', 'pam', 'angela', 'kevin',
                   'stanley', 'phyllis',
                   'uma', 'xyla', 'hazel', 'dash', 'pixel', 'coco', 'gizmo', 'yara',
                   'batman', 'robin', 'catwoman', 'joker', 'bane', 'nightwing',
                   'batgirl', 'alfred',
                   'luke', 'leia', 'han', 'chewbacca', 'r2-d2', 'c-3po',
                   'obi-wan', 'yoda', 'worker', 'worker2'];
    for (const n of names) {
      const img = new Image();
      img.src = 'assets/char-' + n + '.png';
      this.sprites[n] = img;
    }
    const img = new Image();
    img.src = 'assets/dunder-backdrop-painted.png';
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
    // The real set photo: the floor occupies the bottom 44% of the image (the
    // back wall meets the carpet at ~56% height). Grid y=0 sits at that junction,
    // y=10 at the bottom edge — agents stand ON the carpet, not on the walls.
    const depth = 0.72 + 0.28 * (y / 10);
    const s = eng.scale || 1;
    const mobile = eng.cssW < 860;
    const sx = mobile
      ? eng.cssW * 0.06 + (x / 10) * (eng.cssW * 0.88)
      : eng.cssW * (0.12 + 0.82 * (x / 10));
    const sy = eng.cssH * (0.56 + 0.42 * (y / 10));
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

    // backdrop: COVER, height-limited (the floor + desks live in the bottom 44%
    // of the photo — the full photo height must stay visible; crop width only)
    if (this.backdrop) {
      const iw = this.backdrop.width, ih = this.backdrop.height;
      const ar = iw / ih, tar = w / h;
      let dw = w, dh = h, dx = 0, dy = 0;
      if (ar > tar) { dw = h * ar; dx = -(dw - w) / 2; }
      else { dh = w / ar; dy = -(dh - h) / 2; }
      g.drawImage(this.backdrop, dx, dy, dw, dh);
      // remember the drawn photo scale so sprites size to the SET, not the canvas
      this._photoDH = dh;
    } else {
      g.fillStyle = '#d9c9a8';
      g.fillRect(0, 0, w, h);
      this._photoDH = h;
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

    // speech bubbles (2D style) — collision-resolved, newer bubbles win.
    // Rects are computed FIRST so sticky-note labels never collide with them.
    const s = eng.scale;
    const active = [...eng.agents.values()]
      .filter(a => a.bubble.text && now < a.bubble.until)
      .sort((x, y) => y.bubble.until - x.bubble.until)
      .slice(0, 3);   // cap simultaneous bubbles — the roster carries full status
    const used = [];
    const bubbleRects = [];
    for (const a of active) {
      const c = this.map(eng, a.x, a.y);
      const hh = this.spriteH(eng, c.d);
      ctx.font = `700 ${11 * s}px ${monoFont()}`;
      const text = this.fitText(ctx, a.bubble.text, 160 * s - 20 * s);
      const tw = ctx.measureText(text).width;
      const w = Math.min(tw + 20 * s, 160 * s);
      const h = 24 * s;
      let bx = clamp(c.x - w / 2, 4 * s, eng.cssW - w - 4 * s);
      let by = c.y - hh - 14 * s - h;
      for (let tries = 0; tries < 6; tries++) {
        const clash = used.some(r =>
          bx < r.x + r.w + 6 * s && bx + w + 6 * s > r.x &&
          by < r.y + r.h + 6 * s && by + h + 6 * s > r.y);
        if (!clash) break;
        by -= h + 8 * s;              // stack upward
      }
      if (by < 8 * s) continue;        // clipped — newer bubble wins
      used.push({ x: bx, y: by, w, h });
      bubbleRects.push({ x: bx, y: by, w, h, a, text });
    }

    // labels: hand-written sticky notes (production polish)
    const mobile = eng.cssW < 860;
    // on mobile, only show the most important labels (declutter)
    const labelFilter = mobile
      ? (st) => ['bullpen', 'conference', 'michael', 'reception'].includes(st.id)
      : (st) => true;
    ctx.textAlign = 'center';
    ctx.font = `800 ${eng.s(mobile ? 9 : 11)}px ${monoFont()}`;
    // per-station deterministic lift so back-row labels never collide with the
    // characters standing there (labels sit above the sprite's head)
    const lift = { michael: 52, conference: 34, breakroom: 20, annex: 18, warehouse: 14, mail: 12 };
    const labelRects = [];   // for nametag-pill collision below
    for (const st of eng.theme.stations) {
      if (!labelFilter(st)) continue;
      const c = this.map(eng, st.x, st.y);
      const spriteH = this.spriteH(eng, c.d); // standing sprite at this depth
      const back = st.y < 3.5;
      const front = st.type === 'reception' || st.type === 'mail';
      const extra = lift[st.id] || 0;
      const ly = back ? c.y - eng.s((mobile ? 30 : 44) + extra) - spriteH
                 : front ? c.y - eng.s((mobile ? 26 : 40) + extra) - spriteH
                 : c.y - eng.s((mobile ? 16 : 26) + extra) - spriteH;
      const tw = ctx.measureText(st.label.toUpperCase()).width;
      // skip if a speech bubble occupies this label's spot
      const lh = eng.s(mobile ? 10 : 17);
      if (bubbleRects.some(r =>
        c.x - tw / 2 < r.x + r.w + 4 * s && c.x + tw / 2 + 4 * s > r.x &&
        ly - lh < r.y + r.h && ly > r.y)) continue;
      labelRects.push({ x: c.x - tw / 2 - eng.s(6), y: ly - lh, w: tw + eng.s(12), h: lh + eng.s(6) });
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
    // nametag pills — botvillage style: tiny bold monospace pill under each
    // character, collision-resolved against each other + bubbles; hover = full
    ctx.textAlign = 'center';
    ctx.font = `700 ${eng.s(8.5)}px ${monoFont()}`;
    const pills = [];
    for (const a of eng.agents.values()) {
      const c0 = this.map(eng, a.x, a.y);
      const tw = ctx.measureText(a.name).width;
      const pw = tw + eng.s(10), ph = eng.s(12);
      let px = clamp(c0.x - pw / 2, 2 * s, eng.cssW - pw - 2 * s);
      let py = c0.y - this.spriteH(eng, c0.d) - ph - eng.s(4);
      // when lifting, alternate side-offset so stacked pills fan out instead
      // of one swallowing the other
      for (let tries = 0; tries < 6; tries++) {
        const clash = pills.some(p =>
          px < p.x + p.w + 5 * s && px + pw + 5 * s > p.x &&
          py < p.y + p.h + 4 * s && py + ph + 4 * s > p.y);
        const bubbleClash = bubbleRects.some(r =>
          px < r.x + r.w + 4 * s && px + pw + 4 * s > r.x &&
          py < r.y + r.h + 3 * s && py + ph + 3 * s > r.y);
        const labelClash = labelRects.some(r =>
          px < r.x + r.w + 2 * s && px + pw + 2 * s > r.x &&
          py < r.y + r.h + 2 * s && py + ph + 2 * s > r.y);
        if (!clash && !bubbleClash && !labelClash) break;
        if (tries % 2 === 0) {
          py -= ph + 3 * s;                 // lift above
        } else {
          const dir = (tries / 2) % 2 === 0 ? 1 : -1;
          px = clamp(px + dir * (pw * 0.9 + 4 * s), 2 * s, eng.cssW - pw - 2 * s);
        }
      }
      pills.push({ x: px, y: py, w: pw, h: ph });
      const dim = eng.hoverAgent === a.id ? 1 : 0.72;
      ctx.globalAlpha = dim;
      ctx.fillStyle = 'rgba(36,28,18,0.78)';
      eng.roundRectPath(ctx, px, py, pw, ph, ph / 2);
      ctx.fill();
      ctx.fillStyle = '#fdfaf0';
      ctx.fillText(a.name, px + pw / 2, py + ph - eng.s(3.2));
      ctx.globalAlpha = 1;
    }
    // draw the speech bubbles on top
    for (const r of bubbleRects) this.drawBubble(eng, ctx, r.a, r.x, r.y, r.w, r.h, r.text);
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

  /* truncate bubble text so it never spills out of the bubble rect */
  fitText(ctx, text, maxW) {
    let t = String(text || '');
    if (ctx.measureText(t).width <= maxW) return t;
    while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
    return t + '…';
  },

  /* standing character height at a given depth — sized to the DRAWN PHOTO.
     Small chibi villagers on the big set (the poteto/viral look): ~0.6 of a
     cubicle partition, so they read as people, never as monsters. */
  spriteH(eng, d) {
    return (this._photoDH || eng.cssH) * 0.22 * d * (eng.zoom || 1);
  },

  /* content aspect (width/height) of each char sprite — the art is chibi-wide
     relative to its height, so drawing square boxes makes characters overlap */
  _aspect(name) {
    const A = {
      uma: 0.59, xyla: 1.28, hazel: 0.86, dash: 0.89, pixel: 0.75, coco: 0.71,
      gizmo: 0.82, yara: 0.59, batman: 0.62, robin: 0.82, catwoman: 0.61,
      joker: 0.64, bane: 0.8, nightwing: 0.7, batgirl: 0.61, alfred: 0.55,
      luke: 0.71, leia: 0.73, han: 0.61, chewbacca: 0.91, 'r2-d2': 1.3, 'c-3po': 1.3,
      'obi-wan': 0.73, yoda: 1.3,
      michael: 0.59, dwight: 0.71, jim: 1.3, pam: 0.59, angela: 0.45, kevin: 0.57,
      stanley: 1.3, phyllis: 0.68, worker: 0.89, worker2: 0.54,
    };
    return A[(name || '').toLowerCase()] || 0.62;
  },

  /* every cast member has real art now — no aliasing needed */

  drawAgent(eng, ctx, a, now) {
    const c = this.map(eng, a.x, a.y);
    const s = eng.scale * c.d;
    // themed character sprite when available (recognizable cast, human scale:
    // a standing adult ≈ 38% of canvas height at full depth, scaled by depth)
    const sprName = (a.name || '').toLowerCase();
    const spr = this.sprites[sprName];
    if (spr && spr.complete && spr.naturalWidth > 0) {
      const hh = this.spriteH(eng, c.d);
      const w = hh * this._aspect(a.name);
      const bob = a.moving ? Math.sin(a.walkPhase) * 1.5 * s : Math.sin(a.walkPhase * 0.55) * 0.8 * s;
      // two-layer contact shadow: wide soft penumbra + tight dark core — the
      // standard trick for anchoring a character on a photo
      ctx.fillStyle = 'rgba(50,40,25,0.16)';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y + 3 * s, w * 0.55, Math.max(5 * s, w * 0.14), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(40,30,18,0.30)';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y + 3 * s, w * 0.28, Math.max(3 * s, w * 0.07), 0, 0, Math.PI * 2);
      ctx.fill();
      // warm the sprite to the set's tungsten light so it reads less "sticker"
      ctx.save();
      ctx.filter = 'sepia(0.12) saturate(0.92) brightness(1.03)';
      ctx.drawImage(spr, c.x - w / 2, c.y - hh + bob + 6 * s, w, hh);
      ctx.restore();
      // feet AO: soft dark gradient hugging the sprite's lower third, so the
      // character "sits in" the carpet light instead of floating on it
      const ao = ctx.createLinearGradient(0, c.y - hh * 0.34, 0, c.y + 4 * s);
      ao.addColorStop(0, 'rgba(30,22,12,0)');
      ao.addColorStop(1, 'rgba(30,22,12,0.22)');
      ctx.fillStyle = ao;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y + 3 * s, w * 0.34, hh * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    const vs = this.agentsV.get(a.id) || { walk: 0, blink: 0, tilt: 0 };
    const bob = a.moving ? Math.abs(Math.sin(a.walkPhase)) * -3 * s : Math.sin(a.walkPhase * 0.5) * 1.2 * s;
    if (now > a.blinkAt) { vs.blink = 1; a.blinkAt = now + 2 + Math.random() * 4; }
    vs.blink = Math.max(0, vs.blink - (now - (vs._last || now)));
    vs._last = now;

    // Capsule fallback (cast without art): draw at the SAME human scale as the
    // sprites so no character ever reads as a tiny bug next to a big one.
    const capF = (this.spriteH(eng, c.d)) / (46 * s);
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(capF, capF);
    ctx.translate(-c.x, -c.y);
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
      ctx.font = `${14 * s / capF}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(toolIcon(a.currentTool), c.x, hy - 24 * s);
      ctx.textAlign = 'left';
    }
    // toss (paper slip to inbox)
    if (a.toss > 0) {
      const t = 1 - a.toss / 0.8;
      const ex = c.x + 26 * s * t / capF;
      const ey = hy - 34 * s * Math.sin(t * Math.PI);
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(t * 1.2);
      ctx.fillStyle = '#fdfaf0';
      ctx.strokeStyle = '#b8a683';
      ctx.lineWidth = 1 * s / capF;
      ctx.fillRect(-8 * s / capF, -6 * s / capF, 16 * s / capF, 12 * s / capF);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();   // end capsule scale
  },

  drawBubble(eng, ctx, a, bx, by, w, h, text) {
    const s = eng.scale;
    if (!text) text = a.bubble.text;
    if (!w || !h) {
      ctx.font = `700 ${11 * s}px ${monoFont()}`;
      text = this.fitText(ctx, text, 160 * s - 20 * s);
      const tw = ctx.measureText(text).width;
      w = Math.min(tw + 20 * s, 160 * s);
      h = 24 * s;
      bx = clamp(bx - w / 2, 4 * s, eng.cssW - w - 4 * s);
      by = by - h;
    }
    const x = bx + w / 2, y = by + h + 6 * s;
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
