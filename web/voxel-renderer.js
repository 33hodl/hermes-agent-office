/* Voxel renderer — the Star Wars theme, block-built.
 * Everything is cubes: blocky floor slabs, blocky walls with glowing panels,
 * voxel desks with monitors, and characters built from stacked cubes with
 * per-character palettes (Luke tan, Chewie tall brown, R2 short blue-dome...).
 * Pure procedural canvas — no image assets, no AI generations.
 * Engine contract: init / resize / draw(eng,ctx,dt) / map / hitTest / onAgentAdded.
 * NOTE: exported as a singleton INSTANCE (engine calls instance methods).
 */
'use strict';

const V_TILE = 64;

class VoxelRendererImpl {
  constructor() { this.name = 'voxel'; this.agentsV = new Map(); this._static = null; }

  init(eng) { /* nothing to load — all procedural */ }

  onAgentAdded(a) { this.agentsV.set(a.id, { bob: Math.random() * 10, blink: 0 }); }

  map(eng, x, y) {
    return {
      x: eng.ox + (x - y) * (V_TILE / 2) * eng.scale,
      y: eng.oy + (x + y) * (V_TILE / 4) * eng.scale,
    };
  }

  resize(eng) {
    const fit = Math.min(eng.cssW / 560, eng.cssH / 330);
    const mfit = eng.cssW < 860
      ? Math.min((eng.cssW - 40) / (8 * V_TILE), eng.cssH / 470)
      : fit;
    eng.scale = clamp(mfit, 0.45, 1.7) * (eng.zoom || 1);
    eng.ox = eng.cssW / 2;
    const midY = 10 * (V_TILE / 4) * eng.scale;
    eng.oy = eng.cssH * 0.52 - midY;
    this._buildStatic(eng);
  }

  /* one isometric cube: top face + left/right faces. lift = screen px the cube
     sits above its ground point (for stacking). */
  vox(eng, g, wx, wy, size, hPx, topC, leftC, rightC, liftPx = 0) {
    const s = eng.scale;
    const p0 = this.map(eng, wx, wy), p1 = this.map(eng, wx + size, wy),
          p2 = this.map(eng, wx + size, wy + size), p3 = this.map(eng, wx, wy + size);
    const h = hPx * s, lift = liftPx * s;
    const yT = p0.y - lift - h;
    // top face
    g.fillStyle = topC;
    g.beginPath();
    g.moveTo(p0.x, yT); g.lineTo(p1.x, p1.y - lift - h);
    g.lineTo(p2.x, yT); g.lineTo(p3.x, p3.y - lift - h);
    g.closePath(); g.fill();
    // left face
    g.fillStyle = leftC;
    g.beginPath();
    g.moveTo(p0.x, yT); g.lineTo(p3.x, p3.y - lift - h);
    g.lineTo(p3.x, p3.y - lift); g.lineTo(p0.x, p0.y - lift);
    g.closePath(); g.fill();
    // right face
    g.fillStyle = rightC;
    g.beginPath();
    g.moveTo(p1.x, p1.y - lift - h); g.lineTo(p2.x, yT);
    g.lineTo(p2.x, p2.y - lift); g.lineTo(p1.x, p1.y - lift);
    g.closePath(); g.fill();
  }

  _buildStatic(eng) {
    const w = eng.cssW, h = eng.cssH;
    const layer = document.createElement('canvas');
    layer.width = w; layer.height = h;
    const g = layer.getContext('2d');
    // FULLY-OPAQUE base — the engine doesn't clear the canvas between frames,
    // so any transparent pixel here becomes a motion-trail smear (the office
    // renderer's static is opaque for the same reason).
    g.fillStyle = '#0c0f18';
    g.fillRect(0, 0, w, h);
    // space backdrop: dark gradient + stars above the room
    const sky = g.createLinearGradient(0, 0, 0, h * 0.42);
    sky.addColorStop(0, '#0b0d18');
    sky.addColorStop(1, '#1a1e2e');
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h * 0.42);
    for (let i = 0; i < 70; i++) {
      const sx = (i * 137.5) % w, sy = (i * 89.3) % (h * 0.4);
      g.fillStyle = i % 11 === 0 ? '#ffd479' : 'rgba(255,255,255,0.6)';
      g.fillRect(sx, sy, eng.s(i % 3 === 0 ? 2 : 1), eng.s(i % 3 === 0 ? 2 : 1));
    }
    // blocky floor: thin slabs per cell (alternating shades)
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        const dark = (x + y) % 2 === 0;
        this.vox(eng, g, x, y, 1, 5,
          dark ? '#3a3d48' : '#42454f', dark ? '#2c2e36' : '#32343c', dark ? '#23252c' : '#292b32');
      }
    }
    // back wall: blocky cubes along y=0 with glowing accent panels
    for (let x = 0; x < 10; x++) {
      const isAccent = x === 2 || x === 5 || x === 8;
      this.vox(eng, g, x, 0, 1, 58, '#2a2d38', '#20222b', '#181a22');
      if (isAccent) {
        this.vox(eng, g, x + 0.22, -0.15, 0.56, 10, '#e8c04a', '#b8942e', '#8a6a1e', 34);
        this.vox(eng, g, x + 0.35, -0.05, 0.3, 6, '#ffd479', '#c9a038', '#a37f28', 40);
      }
    }
    // side wall cubes (right edge) — hangar bay frame
    for (let y = 1; y < 9; y++) {
      this.vox(eng, g, 9.4, y, 0.5, 40, '#262936', '#1d2029', '#161821');
    }
    this._static = layer;
  }

  /* voxel desk: slab + legs + monitor cube with amber screen */
  _drawDesk(eng, g, x, y) {
    const p = eng.theme.props;
    const wood = p.woodTop || '#7a6a4a', woodL = p.wood || '#6a5a3a', woodR = p.woodDark || '#4a3e28';
    this.vox(eng, g, x - 0.3, y - 0.12, 0.16, 12, woodR, '#3a3020', '#2e261a');
    this.vox(eng, g, x + 0.16, y - 0.12, 0.16, 12, woodR, '#3a3020', '#2e261a');
    this.vox(eng, g, x - 0.42, y - 0.26, 0.84, 5, wood, woodL, woodR, 12);
    this.vox(eng, g, x - 0.14, y - 0.2, 0.28, 8, '#1e2230', '#161a26', '#0e111a', 17);
    this.vox(eng, g, x - 0.08, y - 0.08, 0.16, 4, p.monitorScreen || '#e8c04a', '#b8942e', '#8a6a1e', 21);
  }

  /* character palettes per cast name */
  _pal(name) {
    const P = {
      luke:     { body: '#e8dcc0', head: '#e8c8a0', leg: '#8a6a3a', arm: '#e8dcc0', h: 22, w: 0.34, acc: 'belt' },
      leia:     { body: '#f5f5f0', head: '#c09058', leg: '#d8d2c4', arm: '#f5f5f0', h: 22, w: 0.34, acc: 'buns' },
      han:      { body: '#d8d4c8', head: '#e8c8a0', leg: '#2e2a26', arm: '#d8d4c8', h: 23, w: 0.34, acc: 'vest' },
      chewbacca:{ body: '#9c543c', head: '#7a422e', leg: '#5a3222', arm: '#9c543c', h: 28, w: 0.42, acc: 'band' },
      'r2-d2':  { body: '#e8e8f0', head: '#d8d8e4', leg: '#b8b8c8', arm: '#e8e8f0', h: 16, w: 0.36, acc: 'dome' },
      'c-3po':  { body: '#e4b43c', head: '#d8a832', leg: '#b08a24', arm: '#e4b43c', h: 24, w: 0.3, acc: 'gold' },
      'obi-wan':{ body: '#7a5a3a', head: '#e8c8a0', leg: '#4a3a28', arm: '#7a5a3a', h: 23, w: 0.34, acc: 'robe' },
      yoda:     { body: '#6a9a5a', head: '#8ac06a', leg: '#4a6a3a', arm: '#6a9a5a', h: 13, w: 0.34, acc: 'ears' },
    };
    return P[(name || '').toLowerCase()] || { body: '#8fb7e8', head: '#e8c8a0', leg: '#3a3428', arm: '#8fb7e8', h: 22, w: 0.34 };
  }

  /* voxel figure from stacked cubes */
  _drawAgent(eng, g, a) {
    const c = this.map(eng, a.x, a.y);
    const s = eng.scale;
    const pal = this._pal(a.name);
    const vs = this.agentsV.get(a.id) || { bob: 0 };
    const bob = a.moving ? Math.sin(a.walkPhase) * 1.2 * s : Math.sin(a.walkPhase * 0.5) * 0.5 * s;
    const working = a.home && Math.hypot(a.x - a.home.x, a.y - a.home.y) < 0.4 && !a.moving &&
      (a.status === 'tool' || a.status === 'thinking' || a.status === 'working');
    const scaleH = working ? 0.82 : 1;   // seated pose
    const hPx = pal.h * scaleH;
    const wPx = pal.w;
    const shade = (hex, f) => {
      const n = parseInt(hex.slice(1), 16);
      const r = Math.min(255, Math.round(((n >> 16) & 255) * f)), gg = Math.min(255, Math.round(((n >> 8) & 255) * f)), b = Math.min(255, Math.round((n & 255) * f));
      return `rgb(${r},${gg},${b})`;
    };
    // ground shadow (soft square)
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.beginPath();
    g.ellipse(c.x, c.y + 3 * s, eng.s(14) * wPx, eng.s(5), 0, 0, Math.PI * 2);
    g.fill();
    // legs
    this.vox(eng, g, a.x - 0.11, a.y, 0.14, 5 * scaleH, shade(pal.leg, 1.15), pal.leg, shade(pal.leg, 0.7), 0 + bob);
    this.vox(eng, g, a.x + 0.02, a.y, 0.14, 5 * scaleH, shade(pal.leg, 1.15), pal.leg, shade(pal.leg, 0.7), 0 + bob);
    // body
    this.vox(eng, g, a.x - wPx / 2, a.y - wPx / 4, wPx, hPx * 0.52, shade(pal.body, 1.2), pal.body, shade(pal.body, 0.72), 5 * scaleH + bob);
    // arms
    const armLift = 5 * scaleH + hPx * 0.52;
    this.vox(eng, g, a.x - wPx / 2 - 0.1, a.y - wPx / 4, 0.12, hPx * 0.4, shade(pal.arm, 1.15), pal.arm, shade(pal.arm, 0.7), armLift);
    this.vox(eng, g, a.x + wPx / 2 - 0.02, a.y - wPx / 4, 0.12, hPx * 0.4, shade(pal.arm, 1.15), pal.arm, shade(pal.arm, 0.7), armLift);
    // head
    const headLift = 5 * scaleH + hPx * 0.52;
    this.vox(eng, g, a.x - 0.13, a.y - 0.06, 0.26, hPx * 0.42, shade(pal.head, 1.2), pal.head, shade(pal.head, 0.72), headLift);
    // eyes on the right face of the head
    const hx = c.x + eng.s(13) * wPx, hy = c.y - eng.s(headLift + hPx * 0.42 * 0.6 + 2) - bob;
    g.fillStyle = '#1a1a22';
    g.fillRect(hx - eng.s(1.5), hy - eng.s(2), eng.s(1.6), eng.s(1.6));
    g.fillRect(hx + eng.s(1.5), hy - eng.s(2), eng.s(1.6), eng.s(1.6));
    // accessories
    const accLift = headLift + hPx * 0.42;
    if (pal.acc === 'buns') {
      this.vox(eng, g, a.x - 0.28, a.y - 0.02, 0.12, 4, '#c09058', '#a87848', '#8a5c34', accLift);
      this.vox(eng, g, a.x + 0.16, a.y - 0.02, 0.12, 4, '#c09058', '#a87848', '#8a5c34', accLift);
    } else if (pal.acc === 'ears') {
      this.vox(eng, g, a.x - 0.28, a.y - 0.05, 0.1, 4, '#8ac06a', '#6a9a5a', '#4a7a42', accLift);
      this.vox(eng, g, a.x + 0.18, a.y - 0.05, 0.1, 4, '#8ac06a', '#6a9a5a', '#4a7a42', accLift);
    } else if (pal.acc === 'dome') {
      this.vox(eng, g, a.x - 0.09, a.y - 0.03, 0.18, 3, '#4a7ae8', '#3a5ab8', '#2a4288', accLift);
    } else if (pal.acc === 'belt') {
      this.vox(eng, g, a.x - wPx / 2, a.y - wPx / 4, wPx, 2, '#8a6a3a', '#6a4e28', '#4a3618', 5 * scaleH + hPx * 0.3 + bob);
    } else if (pal.acc === 'vest') {
      this.vox(eng, g, a.x - wPx / 2, a.y - wPx / 4, wPx, hPx * 0.22, '#2e2a26', '#221f1c', '#161412', 5 * scaleH + hPx * 0.18 + bob);
    } else if (pal.acc === 'band') {
      this.vox(eng, g, a.x - wPx / 2, a.y - wPx / 4, wPx, 2.5, '#5a3a22', '#422a18', '#2e1c10', 5 * scaleH + hPx * 0.4 + bob);
    } else if (pal.acc === 'robe') {
      this.vox(eng, g, a.x - wPx / 2 - 0.02, a.y - wPx / 4 - 0.02, wPx + 0.04, 3, '#5a3a2a', '#42281c', '#2e1a12', headLift + 1);
    } else if (pal.acc === 'gold') {
      this.vox(eng, g, a.x - 0.05, a.y - 0.06, 0.1, 2, '#ffd479', '#d8a832', '#b08a24', accLift);
    }
    // typing dots when working at the desk
    if (working) {
      const ty = c.y - eng.s(headLift + hPx * 0.42 + 6);
      g.fillStyle = 'rgba(232,192,74,0.9)';
      for (let i = 0; i < 3; i++) {
        const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 200 + i * 1.2);
        g.globalAlpha = pulse;
        g.fillRect(c.x - eng.s(5) + i * eng.s(4.2), ty, eng.s(2.2), eng.s(2.2));
      }
      g.globalAlpha = 1;
    }
  }

  draw(eng, ctx) {
    const s = eng.scale;
    if (this._static) ctx.drawImage(this._static, 0, 0);
    // mailbox (blocky droid-box with glow)
    const mail = eng.theme.stations.find(st => st.type === 'mail');
    if (mail) {
      const c = this.map(eng, mail.x, mail.y);
      if (eng.mailGlow > 0) {
        ctx.globalAlpha = 0.4 * eng.mailGlow;
        const glow = ctx.createRadialGradient(c.x, c.y - eng.s(20), eng.s(4), c.x, c.y - eng.s(20), eng.s(44));
        glow.addColorStop(0, 'rgba(255,190,90,0.9)');
        glow.addColorStop(1, 'rgba(255,190,90,0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(c.x, c.y - eng.s(20), eng.s(44), 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      this.vox(eng, ctx, mail.x - 0.22, mail.y - 0.14, 0.44, 16, '#c0392b', '#a0281c', '#7a1c12');
      this.vox(eng, ctx, mail.x - 0.14, mail.y - 0.08, 0.28, 5, '#e8c04a', '#b8942e', '#8a6a1e', 16);
      ctx.fillStyle = '#f5f5f0';
      ctx.fillRect(c.x - eng.s(6), c.y - eng.s(26), eng.s(12), eng.s(8));
    }
    // painter's order: desks + agents, lower (x+y) first → desks occlude
    const items = [];
    for (const a of eng.agents.values()) items.push({ key: a.x + a.y, kind: 'agent', a });
    for (const [dx, dy] of eng.theme.desks || []) items.push({ key: dx + dy + 0.15, kind: 'desk', x: dx, y: dy });
    items.sort((p, q) => p.key - q.key);
    for (const it of items) {
      if (it.kind === 'desk') this._drawDesk(eng, ctx, it.x, it.y);
      else this._drawAgent(eng, ctx, it.a);
    }
    // labels: single bubble + nametag pills (botvillage style)
    this._drawLabels(eng, ctx);
  }

  _drawLabels(eng, ctx) {
    const now = performance.now() / 1000;
    const s = eng.scale;
    const mono = getComputedStyle(document.body).getPropertyValue('--mono') || 'monospace';
    const active = [...eng.agents.values()]
      .filter(a => a.bubble && a.bubble.text && now < a.bubble.until)
      .sort((x, y) => y.bubble.until - x.bubble.until)
      .slice(0, 1);
    const used = [];
    for (const a of active) {
      const c = this.map(eng, a.x, a.y);
      ctx.font = `600 ${Math.max(11 * s, 9.5)}px ${mono}`;
      const iw = a.bubble.icon ? 16 * s + 5 * s : 0;
      const wMax = Math.min(172 * s, eng.cssW * 0.55);
      const maxW = wMax - iw - 18 * s;
      const str = String(a.bubble.text || '');
      let lines = [];
      if (ctx.measureText(str).width <= maxW) lines = [str];
      else {
        const words = str.split(/\s+/); let cur = ''; let ok = true;
        for (const word of words) {
          const trial = cur ? cur + ' ' + word : word;
          if (ctx.measureText(trial).width <= maxW || !cur) cur = trial;
          else { lines.push(cur); cur = word; if (lines.length >= 2) { ok = false; break; } }
        }
        if (ok && cur) lines.push(cur);
        if (lines.length >= 2) {
          let t = lines[1] || '';
          while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
          lines[1] = t + '…';
          lines = lines.slice(0, 2);
        }
      }
      let tw = 0;
      for (const ln of lines) tw = Math.max(tw, ctx.measureText(ln).width);
      const w = Math.min(tw + iw + 18 * s, wMax);
      const h = (lines.length > 1 ? 34 : 22) * s;
      const bx = Math.max(4 * s, Math.min(c.x - w / 2, eng.cssW - w - 4 * s));
      const by = c.y - eng.s(50) - h - 6 * s;
      if (by > 8 * s) {
        used.push({ x: bx, y: by, w, h });
        ctx.fillStyle = 'rgba(255,253,246,0.95)';
        ctx.strokeStyle = 'rgba(200,185,150,0.8)';
        ctx.lineWidth = 1.2 * s;
        ctx.beginPath();
        ctx.roundRect(bx, by, w, h, 8 * s);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(c.x - 5 * s, by + h - 1 * s);
        ctx.lineTo(c.x, by + h + 6 * s);
        ctx.lineTo(c.x + 5 * s, by + h - 1 * s);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#3a3428';
        ctx.font = `600 ${Math.max(11 * s, 9.5)}px ${mono}`;
        ctx.textAlign = 'center';
        const tx = bx + w / 2 + (iw ? (16 * s + 5 * s) / 2 : 0);
        if (lines.length > 1) {
          lines.forEach((ln, i) => ctx.fillText(ln, tx, by + h / 2 + (i - 0.5) * 13 * s + 4 * s));
        } else {
          ctx.fillText(lines[0] || '', tx, by + h / 2 + 4 * s);
        }
        ctx.textAlign = 'left';
      }
    }
    // nametag pills under each agent
    ctx.font = `700 ${Math.max(8.5 * s, 8)}px ${mono}`;
    ctx.textAlign = 'center';
    const pills = [];
    for (const a of eng.agents.values()) {
      const c = this.map(eng, a.x, a.y);
      const tw = ctx.measureText(a.name).width;
      const pw = tw + eng.s(10), ph = Math.max(eng.s(12), 12);
      let px = Math.max(2 * s, Math.min(c.x - pw / 2, eng.cssW - pw - 2 * s));
      let py = c.y - eng.s(6);
      for (let tries = 0; tries < 5; tries++) {
        const clash = pills.some(p => px < p.x + p.w + 4 * s && px + pw + 4 * s > p.x && py < p.y + p.h + 3 * s && py + ph + 3 * s > p.y);
        if (!clash) break;
        py += ph + 3 * s;
      }
      pills.push({ x: px, y: py, w: pw, h: ph });
      ctx.globalAlpha = eng.hoverAgent === a.id ? 1 : 0.78;
      ctx.fillStyle = 'rgba(18,20,30,0.8)';
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, ph / 2);
      ctx.fill();
      ctx.fillStyle = '#f4efe6';
      ctx.fillText(a.name, px + pw / 2, py + ph - eng.s(3.2));
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'left';
  }

  hitTest(eng, px, py) {
    const sorted = [...eng.agents.values()].sort((a, b) => (b.y + b.x) - (a.y + a.x));
    for (const a of sorted) {
      const c = this.map(eng, a.x, a.y);
      if (Math.hypot(px - c.x, py - (c.y - eng.s(20))) < eng.s(16)) return { kind: 'agent', id: a.id };
    }
    const mail = eng.theme.stations.find(st => st.type === 'mail');
    if (mail) {
      const c = this.map(eng, mail.x, mail.y);
      if (Math.abs(px - c.x) < eng.s(24) && py > c.y - eng.s(40) && py < c.y + eng.s(10)) return { kind: 'mail' };
    }
    return null;
  }
}

if (typeof window !== 'undefined') window.VoxelRenderer = new VoxelRendererImpl();
