/* Hermes Agent Office — engine core.
 * Shared canvas management, agent client state, particles, glow sprites,
 * easing, input. Renderers (office/nous/dunder) plug in via setRenderer().
 */
'use strict';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp(Math.round(((n >> 16) & 255) + amt), 0, 255);
  const g = clamp(Math.round(((n >> 8) & 255) + amt), 0, 255);
  const b = clamp(Math.round((n & 255) + amt), 0, 255);
  return `rgb(${r},${g},${b})`;
}
function monoFont() {
  return 'ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace';
}
function fmtNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

/* ---------- glow sprite cache: pre-rendered radial gradients ---------- */
const glowCache = new Map();
function glowSprite(color, size) {
  const key = color + '@' + size;
  let c = glowCache.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = size; c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, color);
  grad.addColorStop(0.35, color.replace(/[\d.]+\)$/, '0.35)'));
  grad.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  if (glowCache.size > 64) glowCache.clear();
  return c;
}
function glowColor(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/* ---------- particles (pooled) ---------- */
class Particles {
  constructor() { this.list = []; }
  spawn(opts) {
    if (this.list.length > 400) this.list.shift();
    this.list.push(Object.assign({
      x: 0, y: 0, vx: 0, vy: 0, life: 1, maxLife: 1, r: 3, color: '#fff',
      grav: 0, drag: 0, glow: false, sprite: null,
    }, opts));
  }
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;
      if (p.life <= 0) { this.list.splice(i, 1); continue; }
      p.vy += (p.grav || 0) * dt;
      p.vx *= (1 - (p.drag || 0) * dt);
      p.vy *= (1 - (p.drag || 0) * dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }
  draw(ctx, s) {
    for (const p of this.list) {
      const a = clamp(p.life / p.maxLife, 0, 1);
      if (p.glow) {
        const spr = glowSprite(p.color, p.r * 6 * s);
        ctx.globalAlpha = a * 0.7;
        ctx.drawImage(spr, p.x - (p.r * 3 * s), p.y - (p.r * 3 * s), p.r * 6 * s, p.r * 6 * s);
        ctx.globalAlpha = 1;
      }
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

/* ---------- engine ---------- */
class OfficeEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cssW = 0; this.cssH = 0;
    this.dpr = 1;
    this.scale = 1;
    this.ox = 0; this.oy = 0;
    this.theme = null;          // current theme config
    this.renderer = null;       // active renderer
    this.agents = new Map();    // id -> client agent
    this.particles = new Particles();
    this.hoverAgent = null;
    this.zoom = 1;            // user zoom multiplier
    this.zoomTarget = 1;
    this._deskCounter = 0;
    this.staticLayer = null;    // pre-rendered scene (renderer-built)
    this.fps = 0;
    this._fpsFrames = 0;
    this._fpsTime = 0;
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(canvas.parentElement);
    this.resize();
  }

  setTheme(theme) {
    this.theme = theme;
    this._deskCounter = 0;   // fresh desk assignment on theme switch — otherwise
                             // agents land on already-occupied desks (duplicates)
    this.resize();
  }

  setRenderer(r) {
    this.renderer = r;
    if (r) r.init && r.init(this);
    this.resize();
  }

  resize() {
    const wrap = this.canvas.parentElement;
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const w = wrap.clientWidth, h = wrap.clientHeight;
    this.canvas.width = Math.max(2, Math.round(w * this.dpr));
    this.canvas.height = Math.max(2, Math.round(h * this.dpr));
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.cssW = w; this.cssH = h;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.renderer) this.renderer.resize(this);
  }

  setZoom(delta) {
    this.zoomTarget = clamp(this.zoomTarget + delta, 0.6, 2.2);
    this.zoom = this.zoomTarget;
    if (this.renderer) this.renderer.resize(this);
  }
  zoomIn() { this.setZoom(0.2); }
  zoomOut() { this.setZoom(-0.2); }
  resetZoom() { this.zoomTarget = 1; this.zoom = 1; if (this.renderer) this.renderer.resize(this); }

  s(v) { return v * this.scale; }

  frame(dt) {
    // idle agents drift back to their home station (no clustering)
    for (const a of this.agents.values()) {
      if (a._seekDesk && a.home && !a.moving && !a.leaving) {
        const hx = a.home.x + (a.homeOffset || 0), hy = a.home.y;
        const dx = hx - a.x, dy = hy - a.y;
        if (Math.hypot(dx, dy) > 0.35) {
          a.moving = true; a.tx = hx; a.ty = hy; a.walkPhase = a.walkPhase || Math.random() * 10;
        } else { a._seekDesk = false; }
      }
      else if ((a.status === 'idle' || a.status === 'entering') && a.home && !a.moving && !a.leaving) {
        const hx = a.home.x + (a.homeOffset || 0), hy = a.home.y;
        const dx = hx - a.x, dy = hy - a.y;
        if (Math.hypot(dx, dy) > 0.6) {
          a.moving = true;
          a.tx = hx; a.ty = hy;
          a.walkPhase = a.walkPhase || Math.random() * 10;
        }
      }
      // nudge overlapping idle agents apart (cheap collision resolution)
      if (a.status === 'idle' && !a.moving) {
        for (const b of this.agents.values()) {
          if (b === a || b.moving || b.status !== 'idle') continue;
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d > 0.01 && d < 0.55) {
            const push = (0.55 - d) / 2;
            a.x += (dx / d) * push;
            a.y += (dy / d) * push;
          }
        }
      }
    }
    // fps meter
    this._fpsFrames++;
    this._fpsTime += dt;
    if (this._fpsTime >= 1) { this.fps = Math.round(this._fpsFrames / this._fpsTime); this._fpsFrames = 0; this._fpsTime = 0; }
    this.updateAgents(dt);
    this.particles.update(dt);
    if (this.renderer) {
      this.renderer.draw(this, this.ctx, dt);
    }
  }

  /* ---------- agents ---------- */

  addAgent(a) {
    const ent = this.theme.entrance || (this.theme.stations || []).find(s => s.type === 'entrance') || { x: 1, y: 6 };
    // home = nearest desk among ALL desk-ish stations (covers office + dunder layouts)
    const desks = (this.theme.desks || []).length
      ? this.theme.desks
      : (this.theme.stations || []).filter(s => s.type === 'desk').map(s => [s.x, s.y]);
    const deskIdx = this._deskCounter++ % Math.max(desks.length, 1);
    // never assign a desk already occupied by a live agent (theme-switch races)
    const behindDesk = !!(this.renderer && (this.renderer.name === 'office' || this.renderer.name === 'voxel'));
    let taken = new Set([...this.agents.values()].map(ag => ag.home ? ag.home.x + ',' + ag.home.y : null).filter(Boolean));
    let hx2, hy2;
    for (let tries = 0; tries < desks.length; tries++) {
      const [dx, dy] = desks.length ? desks[(deskIdx + tries) % desks.length] : [ent.x, ent.y];
      const hh = behindDesk ? { x: dx - 0.3, y: dy - 0.3 } : { x: dx, y: dy };
      if (!taken.has(hh.x + ',' + hh.y)) { hx2 = hh.x; hy2 = hh.y; break; }
    }
    const [hx, hy] = (hx2 !== undefined) ? [hx2, hy2] : [ent.x, ent.y];
    // office/voxel renderer: agent sits BEHIND the desk (up-left) so the desk
    // occludes the lower body — reads as "working at a workstation". dunder
    // renderer: the photo IS the furniture; stand ON the assigned spot.
    const home = { x: hx, y: hy };
    const ca = {
      ...a,
      x: ent.x + (deskIdx % 3) * 0.7, y: ent.y + (deskIdx % 2) * 0.5,
      tx: ent.x, ty: ent.y,
      home,
      slot: deskIdx % 4,
      // desks are 2 cells apart — no side-by-side overlap; keep offsets at zero
      homeOffset: 0,
      moving: false,
      walkPhase: Math.random() * 10,
      facing: 1,
      bubble: { text: null, icon: null, until: 0 },
      toss: 0,
      blinkAt: performance.now() / 1000 + 2 + Math.random() * 4,
      arrivedAt: performance.now() / 1000,
      vx: 0, vy: 0,        // smoothed velocity (for squash & stretch)
      pendingDelivery: null,
      leaving: false,
    };
    if (this.renderer && this.renderer.onAgentAdded) this.renderer.onAgentAdded(ca);
    this.agents.set(a.id, ca);
    this.goTo(ca, ent.x, ent.y + 0.5);
    // right after arriving, head to the assigned desk (spread, no door clustering)
    ca._seekDesk = true;
    this.bubble(ca, flavorFor ? (flavorFor(ca.name) || 'Arrived') : 'Arrived', null, 3);
    return ca;
  }

  removeAgent(id) {
    const a = this.agents.get(id);
    if (!a) return;
    const ent = this.theme.entrance;
    if (!ent) { this.agents.delete(id); return; }
    this.goTo(a, ent.x, ent.y + 0.5);
    a.leaving = true;
  }

  /* reassign every live agent a desk from the CURRENT theme (theme switch) */
  rehome() {
    const desks = (this.theme.desks || []).length
      ? this.theme.desks
      : (this.theme.stations || []).filter(s => s.type === 'desk').map(s => [s.x, s.y]);
    if (!desks.length) return;
    const behindDesk = !!(this.renderer && (this.renderer.name === 'office' || this.renderer.name === 'voxel'));
    let i = 0;
    for (const a of this.agents.values()) {
      const [hx, hy] = desks[i++ % desks.length];
      a.home = behindDesk ? { x: hx - 0.3, y: hy - 0.3 } : { x: hx, y: hy };
      a.homeOffset = 0;
      a._seekDesk = true;   // walk to the new desk
      a.leaving = false;
    }
  }

  goTo(a, x, y) { a.tx = x; a.ty = y; }

  bubble(a, text, icon, seconds = 4) {
    a.bubble = { text, icon: icon || null, until: performance.now() / 1000 + seconds };
  }

  stationOf(type) {
    return (this.theme.stations || []).find(st => st.type === type);
  }

  updateAgents(dt) {
    for (const a of this.agents.values()) {
      const speed = 1.9; // grid cells / sec
      const dx = a.tx - a.x, dy = a.ty - a.y;
      const dist = Math.hypot(dx, dy);
      // ease near target for natural arrival
      const step = Math.min(dist, speed * dt * (dist < 0.4 ? 1.6 : 1));
      if (dist > 0.01) {
        a.x += (dx / dist) * step;
        a.y += (dy / dist) * step;
        a.moving = true;
        a.walkPhase += dt * 7.5;
        if (Math.abs(dx) > 0.02) a.facing = dx > 0 ? 1 : -1;
      } else {
        a.moving = false;
      }
      // smoothed velocity for squash/stretch
      const vx = (dx / Math.max(dist, 0.001)) * (dist > 0.01 ? Math.min(dist, 0.2) / 0.2 : 0);
      a.vx = lerp(a.vx, a.moving ? Math.sign(dx) * Math.min(1, dist * 3) : 0, 0.2);
      a.vy = lerp(a.vy, a.moving ? Math.sign(dy) * Math.min(1, dist * 3) : 0, 0.2);
      if (a.toss > 0) a.toss -= dt;
      if (a.leaving && !a.moving) this.agents.delete(a.id);
    }
  }

  /* ---------- input ---------- */

  hitTest(px, py) {
    if (!this.renderer || !this.renderer.hitTest) return null;
    return this.renderer.hitTest(this, px, py);
  }

  /* ---------- shared draw helpers ---------- */

  ellipseIso(x, y, rx, ry, fill, dy = 0) {
    const { ctx } = this;
    const c = this.renderer ? this.renderer.map(this, x, y) : { x: this.ox, y: this.oy };
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + this.s(dy), this.s(rx * 28), this.s(ry * 14), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}
