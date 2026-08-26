/* Hermes Agent Office — canvas isometric office + live Hermes activity.
   Vanilla JS, zero dependencies, local-first. */

'use strict';

/* ============================== theme configs ============================== */

const THEMES = {
  office: {
    name: 'Office',
    brand: '🏢',
    ui: { accent: '#d96f4a' },
    floor: { base: '#e8dcc3', alt: '#e1d3b6', grid: 'rgba(120,100,60,0.10)' },
    wall: { back: '#a9b8a0', side: '#9db29a', base: '#8fa08a', frame: '#7c8a76' },
    carpet: '#f7eeda',
    props: {
      wood: '#b98a5e', woodDark: '#8a6642', woodTop: '#c99a6d',
      monitor: '#3d4a5c', screen: '#a8cce8', chair: '#3a3a3a',
      pot: '#c96f4a', plant: '#6f9d5e', rugPink: '#eec9d8', rugGreen: '#b8d8b0',
      mail: '#d96f4a', mailDark: '#b3553a', book: ['#c0504d', '#4c7a9c', '#7a9c4c', '#d9a441', '#9c6bb0'],
      whiteboard: '#f5f5f0',
    },
    entrance: { x: 9, y: 1 },
    stations: [
      { id: 'entrance', label: 'Entrance', type: 'entrance', x: 9, y: 1 },
      { id: 'desk-a', label: 'Desk Row A', type: 'desks', x: 2.5, y: 2.5 },
      { id: 'desk-b', label: 'Desk Row B', type: 'desks', x: 6.5, y: 2.5 },
      { id: 'meeting', label: 'Meeting Room', type: 'meeting', x: 4.5, y: 5.5 },
      { id: 'lounge', label: 'Lounge', type: 'lounge', x: 1.5, y: 7.5 },
      { id: 'tools', label: 'Tool Room', type: 'tools', x: 8.5, y: 5.5 },
      { id: 'mail', label: 'Mailbox', type: 'mail', x: 9, y: 8.5 },
      { id: 'library', label: 'Library', type: 'library', x: 0.8, y: 2.5 },
    ],
    desks: [ [2,2],[3,2],[4,2],[2,3],[3,3],[4,3], [6,2],[7,2],[6,3],[7,3] ],
    plants: [[0.8,5.5],[5.5,0.8],[7.8,8.5],[0.8,8.5]],
    extras: { bookshelf: true, whiteboard: true, frames: true, window: true },
  },

  nous: {
    name: 'Nous',
    brand: '◈',
    ui: { accent: '#4d7cf6' },
    floor: { base: '#0d0d15', alt: '#10101a', grid: 'rgba(77,124,246,0.28)' },
    wall: { back: '#13131e', side: '#101019', base: '#1a1a28', frame: '#2a2a42' },
    carpet: '#0b0b12',
    props: {
      wood: '#15151f', woodDark: '#0e0e16', woodTop: '#1c1c2a',
      monitor: '#05050a', screen: '#4d7cf6', chair: '#1a1a26',
      pot: '#16203a', plant: '#3b6ef5', rugPink: 'rgba(77,124,246,0.16)', rugGreen: 'rgba(110,231,247,0.14)',
      mail: '#4d7cf6', mailDark: '#2e4fb8', book: ['#4d7cf6', '#6ee7f7', '#8b5cf6', '#f59e0b', '#22c55e'],
      whiteboard: '#10101a',
    },
    entrance: { x: 9, y: 1 },
    stations: [
      { id: 'entrance', label: 'Ingress', type: 'entrance', x: 9, y: 1 },
      { id: 'desk-a', label: 'Workstation T1–T6', type: 'desks', x: 2.5, y: 2.5 },
      { id: 'desk-b', label: 'Workstation T7–T10', type: 'desks', x: 6.5, y: 2.5 },
      { id: 'meeting', label: 'Sync Grid', type: 'meeting', x: 4.5, y: 5.5 },
      { id: 'lounge', label: 'Idle Pod', type: 'lounge', x: 1.5, y: 7.5 },
      { id: 'tools', label: 'Tool Gateway', type: 'tools', x: 8.5, y: 5.5 },
      { id: 'mail', label: 'Mail Terminal', type: 'mail', x: 9, y: 8.5 },
      { id: 'library', label: 'Context Vault', type: 'library', x: 0.8, y: 2.5 },
    ],
    desks: [ [2,2],[3,2],[4,2],[2,3],[3,3],[4,3], [6,2],[7,2],[6,3],[7,3] ],
    plants: [[0.8,5.5],[5.5,0.8],[7.8,8.5],[0.8,8.5]],
    extras: { bookshelf: true, whiteboard: true, frames: false, window: false, scanlines: true },
  },

  dunder: {
    name: 'Dunder Mifflin',
    brand: '📎',
    ui: { accent: '#c07c2b' },
    floor: { base: '#8b93a8', alt: '#878fa4', grid: 'rgba(60,60,80,0.14)' },
    wall: { back: '#d9c9a8', side: '#d3c2a0', base: '#b8a683', frame: '#a59370' },
    carpet: '#8b93a8',
    props: {
      wood: '#a3764a', woodDark: '#7c5a36', woodTop: '#b98a55',
      monitor: '#4a5568', screen: '#9db8d8', chair: '#2f2f33',
      pot: '#c96f4a', plant: '#6f9d5e', rugPink: '#d8c4a8', rugGreen: '#b8c4a0',
      mail: '#3b5d8c', mailDark: '#2b4a73', book: ['#c0504d', '#4c7a9c', '#7a9c4c', '#d9a441', '#9c6bb0'],
      whiteboard: '#f5f5f0',
    },
    entrance: { x: 0.5, y: 7.2 },
    stations: [
      { id: 'entrance', label: 'Front Door', type: 'entrance', x: 0.5, y: 7.2 },
      { id: 'reception', label: 'Reception', type: 'reception', x: 1.4, y: 8.4 },
      { id: 'bullpen', label: 'Bullpen', type: 'desks', x: 4.5, y: 4.2 },
      { id: 'michael', label: "Michael's Office", type: 'office', x: 8.4, y: 1.6 },
      { id: 'conference', label: 'Conference Room', type: 'conference', x: 8.4, y: 5.4 },
      { id: 'breakroom', label: 'Break Room', type: 'breakroom', x: 2.2, y: 1.6 },
      { id: 'annex', label: 'The Annex', type: 'desks', x: 6.6, y: 7.9 },
      { id: 'mail', label: 'Inbox', type: 'mail', x: 0.5, y: 5.4 },
      { id: 'warehouse', label: 'Warehouse', type: 'warehouse', x: 8.9, y: 8.6 },
    ],
    desks: [
      [3,3],[4,3],[5,3],[3,4],[4,4],[5,4],   // bullpen cubicles
      [6.4,7.6],[7.2,7.6],[6.4,8.6],[7.2,8.6], // annex
    ],
    plants: [[2.4,6.6],[6.2,0.8],[0.8,2.6],[7.6,8.8]],
    extras: { bookshelf: false, whiteboard: true, frames: true, window: true, beets: true, mug: true },
  },
};

const TOOL_ICONS = {
  web_search: '🌐', web_extract: '🌐', browser: '🧭', terminal: '⌨️',
  read_file: '📄', write_file: '✍️', patch: '🔧', search_files: '🔍',
  execute_code: '⚙️', delegate_task: '👥', vision_analyze: '👁️',
  text_to_speech: '🗣️', memory: '🧠', skill_view: '📚', cronjob: '⏰',
  session_search: '🕘', x_search: '🐦', xurl: '🐦',
};
const TOOL_DEFAULT = '🛠️';
const toolIcon = (t) => TOOL_ICONS[t] || TOOL_DEFAULT;

const STATUS_DOT = { entering: 'idle', thinking: 'thinking', working: 'working',
                     tool: 'tool', delivering: 'delivering', idle: 'idle' };

/* ============================== helpers ============================== */

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

function fmtNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}
function timeAgo(ts) {
  const s = Math.max(0, (Date.now() / 1000) - ts);
  if (s < 10) return 'just now';
  if (s < 60) return Math.floor(s) + 's';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  return Math.floor(s / 86400) + 'd';
}
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

/* ============================== engine ============================== */

const TILE = 64; // iso tile width (screen px at scale 1); height = TILE/2
const GRID = 10;

class Office {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.theme = THEMES.office;
    this.scale = 1;
    this.ox = 0; this.oy = 0;
    this.cssW = 0; this.cssH = 0;
    this.agents = new Map();   // id -> client agent
    this.hoverAgent = null;
    this.mailGlow = 0;
    this.particles = [];
    this.labels = [];
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas.parentElement);
    this.resize();
  }

  setTheme(name) {
    this.theme = THEMES[name];
    this.resize();
  }

  resize() {
    const wrap = this.canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const w = wrap.clientWidth, h = wrap.clientHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.cssW = w; this.cssH = h;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const fit = Math.min(w / 720, h / 400);
    this.scale = clamp(fit, 0.45, 1.5);
    this.ox = w / 2;
    this.oy = h / 2 + 20;
  }

  iso(x, y) {
    return {
      x: this.ox + (x - y) * (TILE / 2) * this.scale,
      y: this.oy + (x + y) * (TILE / 4) * this.scale,
    };
  }

  s(v) { return v * this.scale; } // scale a pixel value

  /* ---------- frame ---------- */

  frame(dt) {
    this.mailGlow = Math.max(0, this.mailGlow - dt * 1.4);
    this.updateAgents(dt);
    this.draw();
  }

  /* ---------- drawing ---------- */

  draw() {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.labels = [];
    this.drawFloor();
    this.drawFrame();
    this.drawExtras();
    this.drawStations();

    // painter's order for agents
    const sorted = [...this.agents.values()].sort((a, b) => (a.y + a.x) - (b.y + b.x));
    for (const a of sorted) this.drawAgent(a);
    for (const p of this.particles) this.drawParticle(p);
    this.drawLabels();
  }

  drawFloor() {
    const { ctx, theme } = this;
    for (let x = 0; x < GRID; x++) {
      for (let y = 0; y < GRID; y++) {
        const c = (x + y) % 2 === 0 ? theme.floor.base : theme.floor.alt;
        ctx.fillStyle = c;
        this.tile(x, y);
      }
    }
    // grid lines
    ctx.strokeStyle = theme.floor.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID; i++) {
      const a = this.iso(i, 0), b = this.iso(i, GRID);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      const c = this.iso(0, i), d = this.iso(GRID, i);
      ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke();
    }
    // scanline overlay for nous
    if (theme.extras.scanlines) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let y = 0; y < this.canvas.height; y += 6 * this.scale) {
        ctx.fillRect(0, y, this.canvas.width, Math.max(1, this.scale));
      }
    }
  }

  tile(x, y) {
    const { ctx } = this;
    const p0 = this.iso(x, y), p1 = this.iso(x + 1, y), p2 = this.iso(x + 1, y + 1), p3 = this.iso(x, y + 1);
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y);
    ctx.closePath(); ctx.fill();
  }

  drawFrame() {
    const { ctx, theme } = this;
    const back = theme.wall.back, side = theme.wall.side, frame = theme.wall.frame;
    // back-left wall
    ctx.fillStyle = side;
    ctx.beginPath();
    ctx.moveTo(this.iso(0, 0).x, this.iso(0, 0).y);
    ctx.lineTo(this.iso(GRID, 0).x, this.iso(GRID, 0).y);
    ctx.lineTo(this.iso(GRID, 0).x, this.iso(GRID, 0).y - this.s(70));
    ctx.lineTo(this.iso(0, 0).x, this.iso(0, 0).y - this.s(70));
    ctx.closePath(); ctx.fill();
    // back-right wall
    ctx.fillStyle = back;
    ctx.beginPath();
    ctx.moveTo(this.iso(GRID, 0).x, this.iso(GRID, 0).y);
    ctx.lineTo(this.iso(GRID, GRID).x, this.iso(GRID, GRID).y);
    ctx.lineTo(this.iso(GRID, GRID).x, this.iso(GRID, GRID).y - this.s(70));
    ctx.lineTo(this.iso(GRID, 0).x, this.iso(GRID, 0).y - this.s(70));
    ctx.closePath(); ctx.fill();
    // baseboard on front edges
    ctx.fillStyle = theme.wall.base;
    ctx.beginPath();
    ctx.moveTo(this.iso(0, 0).x, this.iso(0, 0).y);
    ctx.lineTo(this.iso(0, GRID).x, this.iso(0, GRID).y);
    ctx.lineTo(this.iso(0, GRID).x, this.iso(0, GRID).y - this.s(14));
    ctx.lineTo(this.iso(0, 0).x, this.iso(0, 0).y - this.s(14));
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = theme.wall.base;
    ctx.beginPath();
    ctx.moveTo(this.iso(0, GRID).x, this.iso(0, GRID).y);
    ctx.lineTo(this.iso(GRID, GRID).x, this.iso(GRID, GRID).y);
    ctx.lineTo(this.iso(GRID, GRID).x, this.iso(GRID, GRID).y - this.s(14));
    ctx.lineTo(this.iso(0, GRID).x, this.iso(0, GRID).y - this.s(14));
    ctx.closePath(); ctx.fill();
    // corner post
    ctx.fillStyle = frame;
    ctx.fillRect(this.iso(0, 0).x - this.s(5), this.iso(0, 0).y - this.s(70), this.s(10), this.s(70));
    // room label (drawn in the labels pass so nothing covers it)
    const lbl = this.iso(GRID / 2, 0.1);
    this.labels.push({ text: theme.name.toUpperCase() + (theme.name === 'Dunder Mifflin' ? ' · SCRANTON' : ''),
                       x: lbl.x, y: lbl.y - this.s(40), big: true });
  }

  drawExtras() {
    const { ctx, theme } = this;
    const p = theme.props;
    // plants
    for (const [px, py] of theme.plants) this.drawPlant(px, py, p.pot, p.plant);
    // whiteboard on back wall
    if (theme.extras.whiteboard) {
      const wb = this.iso(3.2, 0);
      ctx.fillStyle = p.whiteboard;
      ctx.fillRect(wb.x - this.s(46), wb.y - this.s(62), this.s(92), this.s(44));
      ctx.strokeStyle = theme.wall.frame; ctx.lineWidth = this.s(2);
      ctx.strokeRect(wb.x - this.s(46), wb.y - this.s(62), this.s(92), this.s(44));
      ctx.fillStyle = 'rgba(120,110,90,0.5)';
      ctx.font = `${this.s(10)}px ${monoFont()}`;
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(wb.x - this.s(38), wb.y - this.s(52) + i * this.s(12), this.s(60 - i * 12), this.s(4));
      }
    }
    // framed art on wall
    if (theme.extras.frames) {
      const colors = [p.book[1], p.book[2], p.book[4]];
      for (let i = 0; i < 3; i++) {
        const f = this.iso(6.2 + i * 1.1, 0);
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(f.x - this.s(14), f.y - this.s(46), this.s(28), this.s(32));
        ctx.strokeStyle = theme.wall.frame; ctx.lineWidth = this.s(2);
        ctx.strokeRect(f.x - this.s(14), f.y - this.s(46), this.s(28), this.s(32));
      }
    }
    // window on back wall
    if (theme.extras.window) {
      const w0 = this.iso(0.4, 0.5), w1 = this.iso(2.4, 0.5);
      ctx.fillStyle = theme.name === 'nous' ? 'rgba(77,124,246,0.25)' : 'rgba(190,220,240,0.85)';
      ctx.fillRect(w0.x, w0.y - this.s(56), w1.x - w0.x, this.s(44));
      ctx.strokeStyle = theme.wall.frame; ctx.lineWidth = this.s(3);
      ctx.strokeRect(w0.x, w0.y - this.s(56), w1.x - w0.x, this.s(44));
      ctx.beginPath();
      ctx.moveTo((w0.x + w1.x) / 2, w0.y - this.s(56)); ctx.lineTo((w0.x + w1.x) / 2, w0.y - this.s(12));
      ctx.stroke();
    }
  }

  drawStations() {
    for (const st of this.theme.stations) {
      this.drawStation(st);
    }
  }

  drawStation(st) {
    const { ctx, theme } = this;
    const p = theme.props;
    const t = theme.name;
    switch (st.type) {
      case 'entrance': {
        const c = this.iso(st.x, st.y);
        // mat
        ctx.fillStyle = t === 'nous' ? 'rgba(77,124,246,0.3)' : '#a8bf9a';
        this.ellipseIso(st.x, st.y, 0.62, 0.34, ctx.fillStyle);
        // door on back wall corner
        if (t === 'nous') {
          ctx.fillStyle = 'rgba(77,124,246,0.5)';
          ctx.beginPath();
          ctx.ellipse(c.x, c.y - this.s(30), this.s(16), this.s(6), 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = p.woodDark;
          ctx.fillRect(c.x - this.s(3), c.y - this.s(58), this.s(20), this.s(58));
          ctx.fillStyle = p.wood;
          ctx.fillRect(c.x + this.s(2), c.y - this.s(58), this.s(16), this.s(58));
        }
        this.label(st, c.x, c.y + this.s(16));
        break;
      }
      case 'desks': {
        const cells = theme.desks.filter(([x, y]) =>
          Math.abs(x - st.x) <= 2.2 && Math.abs(y - st.y) <= 2.2);
        for (const [dx, dy] of cells) this.drawDesk(dx, dy, p);
        this.label(st, this.iso(st.x, st.y).x, this.iso(st.x, st.y).y + this.s(30));
        break;
      }
      case 'meeting': {
        const c = this.iso(st.x, st.y);
        this.ellipseIso(st.x, st.y, 2.1, 1.1, t === 'nous' ? p.rugPink : p.rugPink);
        // long table
        this.isoBox(st.x - 1.3, st.y - 0.4, st.x + 1.3, st.y + 0.4, 22,
                    p.woodTop, p.wood, p.woodDark);
        for (const [ax, ay] of [[st.x - 1.6, st.y - 0.8], [st.x - 1.6, st.y + 0.8],
                                [st.x + 1.6, st.y - 0.8], [st.x + 1.6, st.y + 0.8]]) {
          this.drawChair(ax, ay, p.chair, 0);
        }
        this.label(st, c.x, c.y + this.s(34));
        break;
      }
      case 'lounge': {
        const c = this.iso(st.x, st.y);
        this.ellipseIso(st.x, st.y, 1.4, 0.8, p.rugGreen);
        // sofa
        this.isoBox(st.x - 0.7, st.y - 0.35, st.x + 0.1, st.y + 0.35, 18,
                    p.rugGreen, p.rugGreen, shade(p.rugGreen, -25));
        // coffee table
        this.isoBox(st.x + 0.55, st.y - 0.2, st.x + 0.95, st.y + 0.2, 12,
                    p.woodTop, p.wood, p.woodDark);
        this.label(st, c.x, c.y + this.s(26));
        break;
      }
      case 'tools': {
        const c = this.iso(st.x, st.y);
        // bench with terminal
        this.isoBox(st.x - 0.8, st.y - 0.3, st.x + 0.8, st.y + 0.3, 16,
                    p.woodTop, p.wood, p.woodDark);
        this.drawMonitor(st.x - 0.2, st.y - 0.18, p, 30);
        this.drawMonitor(st.x + 0.45, st.y - 0.18, p, 30);
        ctx.fillStyle = p.mail;
        ctx.font = `${this.s(20)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('⚙️', c.x, c.y - this.s(30));
        ctx.textAlign = 'left';
        this.label(st, c.x, c.y + this.s(26));
        break;
      }
      case 'mail': {
        const c = this.iso(st.x, st.y);
        this.drawMailbox(st.x, st.y, p);
        if (this.mailGlow > 0) {
          ctx.fillStyle = `rgba(255,190,90,${0.35 * this.mailGlow})`;
          ctx.beginPath();
          ctx.ellipse(c.x, c.y - this.s(6), this.s(44 * this.mailGlow), this.s(20 * this.mailGlow), 0, 0, Math.PI * 2);
          ctx.fill();
        }
        this.label(st, c.x, c.y + this.s(22));
        break;
      }
      case 'library': {
        const c = this.iso(st.x, st.y);
        const cols = p.book;
        for (let r = 0; r < 4; r++) {
          const yTop = c.y - this.s(64) + r * this.s(15);
          for (let i = 0; i < 6; i++) {
            ctx.fillStyle = cols[(i + r) % cols.length];
            ctx.fillRect(c.x - this.s(30) + i * this.s(10), yTop - this.s(12), this.s(7), this.s(13));
          }
        }
        ctx.fillStyle = p.woodDark;
        ctx.fillRect(c.x - this.s(36), c.y - this.s(66), this.s(72), this.s(6));
        this.label(st, c.x, c.y + this.s(16));
        break;
      }
      case 'reception': {
        const c = this.iso(st.x, st.y);
        this.ellipseIso(st.x, st.y, 1.2, 0.7, p.rugPink);
        this.isoBox(st.x - 0.9, st.y - 0.35, st.x + 0.35, st.y + 0.35, 20,
                    p.woodTop, p.wood, p.woodDark);
        this.drawMonitor(st.x - 0.15, st.y - 0.12, p, 22);
        this.drawChair(st.x + 0.6, st.y + 0.1, p.chair, 1);
        ctx.fillStyle = 'rgba(60,60,70,0.65)';
        ctx.font = `700 ${this.s(9)}px ${monoFont()}`;
        ctx.textAlign = 'center';
        ctx.fillText('DUNDER MIFFLIN', c.x, c.y - this.s(26));
        ctx.textAlign = 'left';
        this.label(st, c.x, c.y + this.s(24));
        break;
      }
      case 'office': {
        // Michael's office: walled corner room
        this.drawRoom(st.x - 1.6, st.y - 1.1, st.x + 1.6, st.y + 1.1, {
          wallColor: theme.wall.side, floor: '#cbb98f',
        });
        const c = this.iso(st.x - 0.2, st.y);
        this.isoBox(st.x - 0.9, st.y - 0.3, st.x + 0.1, st.y + 0.3, 18,
                    p.woodTop, p.wood, p.woodDark);
        this.drawMonitor(st.x - 0.25, st.y - 0.1, p, 20);
        // globe
        ctx.fillStyle = '#7fb0c9';
        ctx.beginPath(); ctx.arc(c.x + this.s(24), c.y - this.s(26), this.s(9), 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#6b8fa5';
        ctx.beginPath(); ctx.ellipse(c.x + this.s(24), c.y - this.s(26), this.s(9), this.s(3.5), 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = p.woodDark; ctx.lineWidth = this.s(2);
        ctx.beginPath(); ctx.moveTo(c.x + this.s(24), c.y - this.s(17)); ctx.lineTo(c.x + this.s(24), c.y - this.s(8)); ctx.stroke();
        // world's best boss mug (easter egg)
        if (theme.extras.mug) {
          ctx.fillStyle = '#b8a683';
          ctx.fillRect(c.x + this.s(34), c.y - this.s(30), this.s(7), this.s(8));
          ctx.fillStyle = '#8a6f4d';
          ctx.fillRect(c.x + this.s(41), c.y - this.s(27), this.s(3), this.s(5));
        }
        this.label(st, this.iso(st.x, st.y).x, this.iso(st.x, st.y).y + this.s(30));
        break;
      }
      case 'conference': {
        this.drawRoom(st.x - 1.5, st.y - 1.0, st.x + 1.5, st.y + 1.0, {
          wallColor: theme.wall.side, floor: '#c9b78e',
        });
        const c = this.iso(st.x, st.y);
        this.isoBox(st.x - 1.1, st.y - 0.3, st.x + 1.1, st.y + 0.3, 18,
                    p.woodTop, p.wood, p.woodDark);
        for (const [ax, ay] of [[st.x - 1.4, st.y - 0.6], [st.x - 1.4, st.y + 0.6],
                                [st.x + 1.4, st.y - 0.6], [st.x + 1.4, st.y + 0.6]]) {
          this.drawChair(ax, ay, p.chair, 0);
        }
        // whiteboard easel
        ctx.fillStyle = p.whiteboard;
        ctx.fillRect(c.x + this.s(28), c.y - this.s(34), this.s(26), this.s(20));
        ctx.strokeStyle = p.woodDark; ctx.lineWidth = this.s(2);
        ctx.strokeRect(c.x + this.s(28), c.y - this.s(34), this.s(26), this.s(20));
        this.label(st, c.x, c.y + this.s(30));
        break;
      }
      case 'breakroom': {
        this.drawRoom(st.x - 1.4, st.y - 1.0, st.x + 1.4, st.y + 1.0, {
          wallColor: theme.wall.side, floor: '#c9b78e',
        });
        const c = this.iso(st.x, st.y);
        // round table
        this.ellipseIso(st.x - 0.3, st.y, 0.9, 0.5, p.woodTop);
        this.ellipseIso(st.x - 0.3, st.y, 0.9, 0.5, 'rgba(0,0,0,0.08)', -this.s(5));
        // vending machine
        const v = this.iso(st.x + 1.0, st.y + 0.1);
        ctx.fillStyle = '#b03a2e';
        ctx.fillRect(v.x - this.s(14), v.y - this.s(52), this.s(28), this.s(52));
        ctx.fillStyle = '#e8f0f8';
        ctx.fillRect(v.x - this.s(11), v.y - this.s(48), this.s(22), this.s(30));
        for (let r = 0; r < 3; r++) {
          for (let i = 0; i < 2; i++) {
            ctx.fillStyle = ['#e8b84b', '#7ab85c', '#c0504d', '#7a9cc0'][(r + i) % 4];
            ctx.fillRect(v.x - this.s(8) + i * this.s(10), v.y - this.s(44) + r * this.s(9), this.s(6), this.s(6));
          }
        }
        ctx.fillStyle = '#8a2c22';
        ctx.fillRect(v.x - this.s(14), v.y - this.s(6), this.s(28), this.s(6));
        this.label(st, c.x, c.y + this.s(28));
        break;
      }
      case 'warehouse': {
        const c = this.iso(st.x, st.y);
        // door to the warehouse on the back wall (dunder detail)
        const door = this.iso(8.6, 0.06);
        ctx.fillStyle = '#5b4a38';
        ctx.fillRect(door.x - this.s(6), door.y - this.s(50), this.s(26), this.s(50));
        ctx.fillStyle = '#8a7350';
        ctx.fillRect(door.x + this.s(4), door.y - this.s(50), this.s(18), this.s(50));
        ctx.fillStyle = 'rgba(255,250,235,0.9)';
        ctx.font = `700 ${this.s(8.5)}px ${monoFont()}`;
        ctx.textAlign = 'center';
        ctx.fillText('TO WAREHOUSE', door.x + this.s(6), door.y - this.s(56));
        ctx.textAlign = 'left';
        // shelves with boxes
        for (let i = 0; i < 3; i++) {
          const bx = st.x - 0.9 + i * 0.6;
          this.isoBox(bx, st.y - 0.25, bx + 0.45, st.y + 0.25, 26, p.woodTop, p.wood, p.woodDark);
        }
        for (let i = 0; i < 2; i++) {
          const bx = st.x - 0.75 + i * 1.5;
          this.isoBox(bx, st.y + 0.6, bx + 0.7, st.y + 0.95, 14, '#c9a06a', '#a3764a', '#7c5a36');
        }
        this.label(st, c.x, c.y + this.s(34));
        break;
      }
    }
  }

  drawRoom(x1, y1, x2, y2, opts) {
    const { ctx } = this;
    // floor
    ctx.fillStyle = opts.floor || '#cbb98f';
    ctx.beginPath();
    ctx.moveTo(this.iso(x1, y1).x, this.iso(x1, y1).y);
    ctx.lineTo(this.iso(x2, y1).x, this.iso(x2, y1).y);
    ctx.lineTo(this.iso(x2, y2).x, this.iso(x2, y2).y);
    ctx.lineTo(this.iso(x1, y2).x, this.iso(x1, y2).y);
    ctx.closePath(); ctx.fill();
    // walls (two visible faces)
    ctx.fillStyle = opts.wallColor || '#d3c2a0';
    ctx.beginPath();
    ctx.moveTo(this.iso(x1, y1).x, this.iso(x1, y1).y);
    ctx.lineTo(this.iso(x2, y1).x, this.iso(x2, y1).y);
    ctx.lineTo(this.iso(x2, y1).x, this.iso(x2, y1).y - this.s(52));
    ctx.lineTo(this.iso(x1, y1).x, this.iso(x1, y1).y - this.s(52));
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(this.iso(x2, y1).x, this.iso(x2, y1).y);
    ctx.lineTo(this.iso(x2, y2).x, this.iso(x2, y2).y);
    ctx.lineTo(this.iso(x2, y2).x, this.iso(x2, y2).y - this.s(52));
    ctx.lineTo(this.iso(x2, y1).x, this.iso(x2, y1).y - this.s(52));
    ctx.closePath(); ctx.fill();
    // wall frame lines
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = this.s(1.5);
    ctx.beginPath();
    ctx.moveTo(this.iso(x1, y1).x, this.iso(x1, y1).y - this.s(52));
    ctx.lineTo(this.iso(x2, y1).x, this.iso(x2, y1).y - this.s(52));
    ctx.lineTo(this.iso(x2, y2).x, this.iso(x2, y2).y - this.s(52));
    ctx.stroke();
    // door gap in the front wall (conference/office open side)
    const c = this.iso((x1 + x2) / 2, y2);
    ctx.fillStyle = this.theme.floor.base;
    ctx.beginPath();
    ctx.moveTo(c.x - this.s(14), c.y);
    ctx.lineTo(c.x + this.s(14), c.y);
    ctx.lineTo(c.x + this.s(14), c.y - this.s(34));
    ctx.lineTo(c.x - this.s(14), c.y - this.s(34));
    ctx.closePath(); ctx.fill();
  }

  drawDesk(x, y, p) {
    const { ctx } = this;
        const c = this.iso(x, y);
    // rug under desk
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    this.ellipseIso(x, y, 0.75, 0.42, ctx.fillStyle);
    this.isoBox(x - 0.42, y - 0.26, x + 0.42, y + 0.26, 14, p.woodTop, p.wood, p.woodDark);
    this.drawMonitor(x - 0.05, y - 0.12, p, 20);
    // chair
    const ch = this.iso(x + 0.02, y + 0.4);
    ctx.fillStyle = p.chair;
    ctx.fillRect(ch.x - this.s(7), ch.y - this.s(16), this.s(14), this.s(16));
    ctx.fillRect(ch.x - this.s(9), ch.y - this.s(20), this.s(18), this.s(5));
  }

  drawMonitor(x, y, p, h) {
    const { ctx } = this;
        const c = this.iso(x, y);
    ctx.fillStyle = p.monitor;
    ctx.fillRect(c.x - this.s(10), c.y - h - this.s(4), this.s(20), this.s(14));
    ctx.fillStyle = p.screen;
    ctx.fillRect(c.x - this.s(8), c.y - h - this.s(2), this.s(16), this.s(10));
    ctx.fillStyle = p.monitor;
    ctx.fillRect(c.x - this.s(2), c.y - this.s(4), this.s(4), this.s(4));
  }

  drawChair(x, y, color, rot) {
    const { ctx } = this;
        const c = this.iso(x, y);
    ctx.fillStyle = color;
    ctx.fillRect(c.x - this.s(7), c.y - this.s(15), this.s(14), this.s(15));
    ctx.fillRect(c.x - this.s(9), c.y - this.s(19), this.s(18), this.s(5));
  }

  drawPlant(x, y, pot, leaf) {
    const { ctx } = this;
        const c = this.iso(x, y);
    ctx.fillStyle = leaf;
    for (const [dx, dy, r] of [[-0.18, -0.12, 9], [0.18, -0.1, 9], [0, -0.2, 11]]) {
      ctx.beginPath();
      ctx.arc(c.x + dx * this.s(20), c.y - this.s(26) + dy * this.s(16), this.s(r), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = pot;
    ctx.fillRect(c.x - this.s(9), c.y - this.s(14), this.s(18), this.s(14));
    ctx.fillStyle = shade(pot, -30);
    ctx.fillRect(c.x - this.s(9), c.y - this.s(4), this.s(18), this.s(4));
  }

  drawMailbox(x, y, p) {
    const { ctx } = this;
        const c = this.iso(x, y);
    ctx.fillStyle = p.mail;
    ctx.fillRect(c.x - this.s(16), c.y - this.s(34), this.s(32), this.s(34));
    ctx.fillStyle = p.mailDark;
    ctx.fillRect(c.x - this.s(16), c.y - this.s(8), this.s(32), this.s(8));
    // slot
    ctx.fillStyle = '#1e1e22';
    ctx.fillRect(c.x - this.s(10), c.y - this.s(24), this.s(20), this.s(4));
    // flag
    ctx.strokeStyle = p.mailDark; ctx.lineWidth = this.s(3);
    ctx.beginPath();
    ctx.moveTo(c.x + this.s(16), c.y - this.s(34));
    ctx.lineTo(c.x + this.s(16), c.y - this.s(46));
    ctx.stroke();
    ctx.fillStyle = p.mailDark;
    ctx.fillRect(c.x + this.s(11), c.y - this.s(46), this.s(10), this.s(6));
    // letter poking out
    ctx.fillStyle = '#f5f5f0';
    ctx.fillRect(c.x - this.s(8), c.y - this.s(30), this.s(16), this.s(11));
    ctx.strokeStyle = '#d8d2c4'; ctx.lineWidth = this.s(1);
    ctx.beginPath();
    ctx.moveTo(c.x - this.s(8), c.y - this.s(30)); ctx.lineTo(c.x, c.y - this.s(24)); ctx.lineTo(c.x + this.s(8), c.y - this.s(30));
    ctx.stroke();
  }

  isoBox(x1, y1, x2, y2, h, top, left, right) {
    const { ctx } = this;
    const a = this.iso(x1, y1), b = this.iso(x2, y1), c = this.iso(x2, y2), d = this.iso(x1, y2);
    // top
    ctx.fillStyle = top;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y);
    ctx.closePath(); ctx.fill();
    // left face
    ctx.fillStyle = left;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y); ctx.lineTo(d.x, d.y); ctx.lineTo(d.x, d.y + this.s(h)); ctx.lineTo(a.x, a.y + this.s(h));
    ctx.closePath(); ctx.fill();
    // right face
    ctx.fillStyle = right;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(c.x, c.y + this.s(h)); ctx.lineTo(b.x, b.y + this.s(h));
    ctx.closePath(); ctx.fill();
  }

  ellipseIso(x, y, rx, ry, fill, dy = 0) {
    const { ctx } = this;
    const c = this.iso(x, y);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + this.s(dy), this.s(rx * TILE / 2), this.s(ry * TILE / 4), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  label(st, x, y) {
    this.labels.push({ text: st.label, x, y });
  }

  drawLabels() {
    const { ctx } = this;
    const dark = this.theme.name === 'nous';
    ctx.textAlign = 'center';
    for (const l of this.labels) {
      const big = l.big;
      ctx.font = `600 ${this.s(big ? 14 : 10.5)}px ${monoFont()}`;
      const tw = ctx.measureText(l.text).width;
      ctx.fillStyle = dark ? 'rgba(10,10,18,0.78)' : 'rgba(255,253,246,0.82)';
      ctx.beginPath();
      ctx.roundRect(l.x - tw / 2 - this.s(8), l.y - this.s(big ? 15 : 11), tw + this.s(16), this.s(big ? 19 : 15), this.s(8));
      ctx.fill();
      ctx.fillStyle = dark ? 'rgba(220,228,255,0.9)' : 'rgba(70,60,40,0.8)';
      ctx.fillText(l.text, l.x, l.y);
    }
    // name tags above heads (last pass = always readable), staggered by id
    ctx.font = `700 ${this.s(10.5)}px ${monoFont()}`;
    for (const a of this.agents.values()) {
      if (this.hoverAgent === a.id) {
        const c = this.iso(a.x, a.y);
        const tw = ctx.measureText(a.name).width;
        const stagger = (hashCode(a.id) % 3) * this.s(12);
        ctx.fillStyle = 'rgba(25,22,30,0.82)';
        ctx.beginPath();
        ctx.roundRect(c.x - tw / 2 - this.s(6), c.y - this.s(46) - stagger, tw + this.s(12), this.s(16), this.s(8));
        ctx.fill();
        ctx.fillStyle = '#f5f2ea';
        ctx.fillText(a.name, c.x, c.y - this.s(34) - stagger);
      }
    }
    ctx.textAlign = 'left';
  }

  /* ---------- agents ---------- */

  addAgent(a) {
    const ent = this.theme.entrance;
    const desks = this.theme.desks;
    if (this._deskCounter === undefined) this._deskCounter = 0;
    const deskIdx = this._deskCounter++ % desks.length;
    const [hx, hy] = desks[deskIdx];
    const ca = {
      ...a,
      x: ent.x, y: ent.y,
      tx: ent.x, ty: ent.y,
      home: { x: hx, y: hy + 0.55 },
      slot: deskIdx % 4,
      moving: false,
      walkPhase: Math.random() * 10,
      facing: 1,
      bubble: { text: null, icon: null, until: 0 },
      toss: 0,
      arrivedAt: performance.now() / 1000,
    };
    this.agents.set(a.id, ca);
    this.goTo(ca, ent.x, ent.y + 0.4);
    this.bubble(ca, 'Arrived', null, 3);
    this.queueWalk(ca, hx, hy);
    return ca;
  }

  removeAgent(id) {
    const a = this.agents.get(id);
    if (!a) return;
    const ent = this.theme.entrance;
    this.goTo(a, ent.x, ent.y + 0.5);
    a.leaving = true;
  }

  queueWalk(a, x, y) {
    a.tx = x; a.ty = y;
  }

  goTo(a, x, y) {
    a.tx = x; a.ty = y;
  }

  bubble(a, text, icon, seconds = 4) {
    a.bubble = { text, icon: icon || null, until: performance.now() / 1000 + seconds };
  }

  updateAgents(dt) {
    for (const a of this.agents.values()) {
      const speed = 1.7; // cells/sec
      const dx = a.tx - a.x, dy = a.ty - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.02) {
        const step = Math.min(dist, speed * dt);
        a.x += (dx / dist) * step;
        a.y += (dy / dist) * step;
        a.moving = true;
        a.walkPhase += dt * 7;
        if (Math.abs(dx) > 0.01) a.facing = dx > 0 ? 1 : -1;
      } else {
        a.moving = false;
      }
      if (a.toss > 0) a.toss -= dt;
      if (a.leaving && !a.moving) {
        this.agents.delete(a.id);
      }
    }
    this.particles = this.particles.filter(p => (p.life -= dt) > 0);
    for (const p of this.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 40 * dt; }
  }

  drawAgent(a) {
    const { ctx, theme } = this;
    const c = this.iso(a.x, a.y);
    const s = this.scale;
    const bob = a.moving ? Math.sin(a.walkPhase) * 1.6 * s : Math.sin(a.walkPhase * 0.6) * 1.2 * s;
    const y = c.y - s * 22 + bob;

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + s * 2, s * 13, s * 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // legs
    const legSwing = a.moving ? Math.sin(a.walkPhase) * 3.5 * s : 0;
    ctx.fillStyle = shade(a.color, -55);
    ctx.beginPath();
    ctx.roundRect(c.x - s * 7 + legSwing, y + s * 6, s * 5.5, s * 7, s * 2.5);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(c.x + s * 1.5 - legSwing, y + s * 6, s * 5.5, s * 7, s * 2.5);
    ctx.fill();

    // body (rounded capsule)
    ctx.fillStyle = a.color;
    ctx.beginPath();
    ctx.roundRect(c.x - s * 10, y - s * 4, s * 20, s * 15, s * 8);
    ctx.fill();
    ctx.strokeStyle = shade(a.color, -35);
    ctx.lineWidth = s * 1.2;
    ctx.stroke();

    // head
    const headY = y - s * 10;
    ctx.fillStyle = a.color;
    ctx.beginPath();
    ctx.arc(c.x, headY, s * 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = shade(a.color, -35);
    ctx.stroke();

    // cat ears (some agents)
    if (hashCode(a.name) % 3 === 0) {
      ctx.fillStyle = a.color;
      ctx.beginPath();
      ctx.moveTo(c.x - s * 9, headY - s * 3);
      ctx.lineTo(c.x - s * 12, headY - s * 11);
      ctx.lineTo(c.x - s * 3.5, headY - s * 8.5);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(c.x + s * 9, headY - s * 3);
      ctx.lineTo(c.x + s * 12, headY - s * 11);
      ctx.lineTo(c.x + s * 3.5, headY - s * 8.5);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = shade(a.color, -35);
      ctx.lineWidth = s * 1.2;
      ctx.stroke();
      ctx.stroke();
    }

    // eyes (look toward movement)
    const look = a.facing * s * 1.6;
    for (const ex of [-3.4, 3.4]) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(c.x + ex * s + look * 0.3, headY - s * 1, s * 3.4, s * 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22242a';
      ctx.beginPath();
      ctx.arc(c.x + ex * s + look * 0.3 + s * 1, headY - s * 0.6, s * 1.7, 0, Math.PI * 2);
      ctx.fill();
    }

    // nose
    ctx.fillStyle = shade(a.color, -45);
    ctx.beginPath();
    ctx.arc(c.x, headY + s * 2.5, s * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // status glyph for tools (speech bubble drawn in the labels pass)
    if (a.status === 'tool' && !(a.bubble.text && performance.now() / 1000 < a.bubble.until)) {
      const icon = toolIcon(a.currentTool);
      ctx.font = `${s * 15}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(icon, c.x, headY - s * 20);
      ctx.textAlign = 'left';
    }

    // mail toss animation
    if (a.toss > 0) {
      const t = 1 - a.toss / 0.8;
      const ex = c.x + s * 26 * t;
      const ey = headY - s * 30 * Math.sin(t * Math.PI);
      ctx.fillStyle = '#f5f5f0';
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(t * 1.4);
      ctx.fillRect(-s * 6, -s * 4, s * 12, s * 8);
      ctx.restore();
    }
  }

  drawBubble(a, x, y) {
    const { ctx } = this;
    const s = this.scale;
    const text = a.bubble.text;
    const icon = a.bubble.icon;
    ctx.font = `600 ${s * 11}px ${monoFont()}`;
    const tw = ctx.measureText(text).width;
    const iw = icon ? s * 16 + s * 5 : 0;
    const w = Math.min(tw + iw + s * 18, s * 150);
    const h = s * 22;
    const bx = clamp(x - w / 2, s * 4, this.cssW - w - s * 4);
    const by = y - h - s * 6;
    ctx.fillStyle = this.theme.name === 'nous' ? 'rgba(16,18,28,0.92)' : 'rgba(255,253,246,0.94)';
    ctx.strokeStyle = this.theme.name === 'nous' ? 'rgba(77,124,246,0.5)' : 'rgba(200,185,150,0.8)';
    ctx.lineWidth = s * 1.2;
    ctx.beginPath();
    ctx.roundRect(bx, by, w, h, s * 8);
    ctx.fill(); ctx.stroke();
    // tail
    ctx.beginPath();
    ctx.moveTo(x - s * 5, by + h - s * 1);
    ctx.lineTo(x, by + h + s * 6);
    ctx.lineTo(x + s * 5, by + h - s * 1);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = this.theme.name === 'nous' ? '#dbe4ff' : '#3a3428';
    if (icon) {
      ctx.font = `${s * 13}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(icon, bx + s * 13, by + h / 2 + s * 4.5);
      ctx.textAlign = 'left';
    }
    ctx.font = `600 ${s * 11}px ${monoFont()}`;
    ctx.textAlign = 'center';
    ctx.fillText(text, bx + w / 2 + iw / 2, by + h / 2 + s * 4);
    // speech bubbles above everything (they may overlap name tags)
    const now = performance.now() / 1000;
    for (const a of this.agents.values()) {
      if (a.bubble.text && now < a.bubble.until) {
        const c = this.iso(a.x, a.y);
        this.drawBubble(a, c.x, c.y - this.s(40));
      }
    }
    ctx.textAlign = 'left';
  }

  drawParticle(p) {
    const { ctx } = this;
    ctx.globalAlpha = clamp(p.life, 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, this.s(p.r), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  burst(x, y, colors, n = 12) {
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 120;
      this.particles.push({
        x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 60,
        life: 0.7 + Math.random() * 0.5, r: 2.5 + Math.random() * 3,
        color: colors[i % colors.length],
      });
    }
  }

  /* ---------- hit testing ---------- */

  hitTest(px, py) {
    // agents first (topmost)
    const sorted = [...this.agents.values()].sort((a, b) => (b.y + b.x) - (a.y + a.x));
    for (const a of sorted) {
      const c = this.iso(a.x, a.y);
      const r = this.s(16);
      if (Math.hypot(px - c.x, py - (c.y - this.s(20))) < r) return { kind: 'agent', id: a.id };
    }
    // mail station
    const mail = this.theme.stations.find(st => st.type === 'mail');
    if (mail) {
      const c = this.iso(mail.x, mail.y);
      if (Math.abs(px - c.x) < this.s(26) && py > c.y - this.s(50) && py < c.y + this.s(8)) {
        return { kind: 'mail' };
      }
    }
    return null;
  }
}

function monoFont() {
  return 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
}

/* ============================== app state ============================== */

const store = {
  agents: new Map(),       // server agent state (id -> agent)
  deliveries: [],
  stats: { input_tokens: 0, output_tokens: 0, deliveries: 0 },
  lastEventId: 0,
  unread: 0,
  source: 'demo',
};

let office = null;
let es = null;

/* ============================== events -> office ============================== */

function handleEvent(ev) {
  store.lastEventId = Math.max(store.lastEventId, ev.id);
  const a = office.agents.get(ev.agent_id) || (ev.type === 'agent_enter' ? office.addAgent(agentFromStore(ev)) : null);
  if (!a) return;

  switch (ev.type) {
    case 'agent_enter':
      office.bubble(a, 'Arrived', '👋', 4);
      break;
    case 'agent_leave':
      office.bubble(a, 'Heading out', '👋', 3);
      setTimeout(() => office.removeAgent(a.id), 1200);
      break;
    case 'thinking': {
      a.status = 'thinking';
      a.activity = ev.text || 'Thinking…';
      a.currentTool = null;
      office.goTo(a, a.home.x, a.home.y);
      office.bubble(a, short(ev.text || 'Thinking…'), '💭', 4);
      break;
    }
    case 'tool_call': {
      a.status = 'tool';
      a.activity = ev.text || `using ${ev.tool}`;
      a.currentTool = ev.tool;
      const tools = stationOf('tools');
      if (tools) office.goTo(a, tools.x - 0.5 + (a.slot % 3) * 0.45, tools.y + 0.25 + (a.slot % 3) * 0.35);
      office.bubble(a, toolLabel(a.currentTool), toolIcon(a.currentTool), 4);
      break;
    }
    case 'status': {
      a.status = 'working';
      a.activity = ev.text || 'Working…';
      a.currentTool = null;
      office.goTo(a, a.home.x, a.home.y);
      office.bubble(a, short(ev.text || 'Working…'), null, 4);
      break;
    }
    case 'delivery': {
      a.status = 'delivering';
      a.activity = 'Delivering work to the mailbox';
      a.currentTool = null;
      const mail = stationOf('mail');
      if (mail) {
        office.goTo(a, mail.x - 0.45 + (a.slot % 2) * 0.9, mail.y - 0.5);
        a.pendingDelivery = ev;
      }
      break;
    }
    case 'idle': {
      a.status = 'idle';
      a.activity = ev.text || 'Waiting at desk';
      a.currentTool = null;
      office.goTo(a, a.home.x, a.home.y);
      office.bubble(a, short(ev.text || 'Waiting at desk'), null, 5);
      break;
    }
  }

  // tokens
  const toks = ev.tokens || {};
  if (toks.input) store.stats.input_tokens += toks.input;
  if (toks.output) store.stats.output_tokens += toks.output;

  if (ev.type === 'delivery') {
    // arrival at mailbox handled in the frame loop via pendingDelivery
  }
  renderAll();
}

function agentFromStore(ev) {
  const id = ev.agent_id || ev.session;
  return {
    id, name: ev.agent, color: colorFor(ev.agent), role: ev.role || 'agent',
    model: ev.model || '', status: 'entering', activity: 'Arriving', task: '',
    tokens: { input: 0, output: 0 }, tools: [], steps: [],
  };
}

function colorFor(name) {
  const palettes = {
    office: ['#f2a38f', '#7ec8c0', '#a8c89a', '#f2cf78', '#c39ad8', '#8fb7e8', '#e8a0b8', '#e8d5a0'],
    nous: ['#4d7cf6', '#6ee7f7', '#8b5cf6', '#22c55e', '#f59e0b', '#ec4899', '#38bdf8', '#a3e635'],
    dunder: ['#b8c4d8', '#d8c4a8', '#a8c89a', '#d9a441', '#c98a9c', '#9cb8d8', '#c4b8a0', '#8fa8b8'],
  };
  const pal = palettes[office.theme.name] || palettes.office;
  return pal[hashCode(name) % pal.length];
}

function short(t) {
  if (!t) return '';
  return t.length > 60 ? t.slice(0, 58) + '…' : t;
}

function toolLabel(t) {
  const map = {
    web_search: 'searching the web', web_extract: 'reading a web page',
    browser: 'driving a browser', terminal: 'running terminal commands',
    read_file: 'reading files', write_file: 'writing files', patch: 'editing files',
    search_files: 'searching files', execute_code: 'running code',
    delegate_task: 'delegating to a subagent', vision_analyze: 'analyzing an image',
    text_to_speech: 'speaking', memory: 'remembering', skill_view: 'consulting a skill',
    cronjob: 'scheduling', session_search: 'recalling a session',
    x_search: 'searching X', xurl: 'using X API',
  };
  return map[t] || `using ${t}`;
}

function stationOf(type) {
  return office.theme.stations.find(st => st.type === type);
}

/* ============================== SSE / API ============================== */

function connect() {
  es = new EventSource(`/api/events?since=${store.lastEventId}`);
  es.onmessage = (msg) => {
    try { handleEvent(JSON.parse(msg.data)); } catch (e) { /* skip bad frame */ }
    finishPendingDeliveries();
  };
  es.onopen = () => setLive(true);
  es.onerror = () => setLive(false); // EventSource auto-reconnects
}

async function fetchState() {
  try {
    const res = await fetch('/api/state');
    const st = await res.json();
    store.stats = st.stats;
    store.deliveries = st.deliveries;
    store.unread = st.deliveries.filter(d => !d.read).length;
    for (const ag of st.agents) {
      store.agents.set(ag.id, ag);
      if (!office.agents.has(ag.id)) {
        office.addAgent(agentFromStore({ agent_id: ag.id, agent: ag.name, role: ag.role, model: ag.model }));
        const ca = office.agents.get(ag.id);
        ca.status = ag.status; ca.activity = ag.activity; ca.task = ag.task;
        ca.tokens = ag.tokens; ca.tools = ag.tools; ca.steps = ag.steps;
      }
    }
    // heal client state from server
    for (const ag of st.agents) {
      const ca = office.agents.get(ag.id);
      if (ca) { ca.status = ag.status; ca.activity = ag.activity; }
    }
    renderAll();
    const health = await (await fetch('/api/health')).json();
    store.source = health.source && health.source.name ? health.source.name : 'demo';
    $('source-badge').textContent = store.source;
    $('mode-note').textContent = store.source === 'demo'
      ? 'Demo feed — run with --db for live agents.'
      : `Live feed from ${health.source.db}`;
  } catch (e) { /* server still warming up */ }
}

/* ============================== rendering ============================== */

function renderAll() {
  renderRoster();
  renderMetrics();
  renderMailboxBadge();
}

function renderRoster() {
  const list = $('roster-list');
  const agents = [...office.agents.values()];
  $('roster-count').textContent = agents.length;
  $('roster-empty').classList.toggle('hidden', agents.length > 0);
  list.innerHTML = '';
  for (const a of agents) {
    const li = document.createElement('li');
    li.className = 'roster-item';
    li.dataset.aid = a.id;
    li.innerHTML = `
      <span class="dot" style="background:${a.color}"></span>
      <span class="r-info">
        <span class="r-name">${esc(a.name)}</span>
        <span class="r-status">${esc(a.activity || '')}</span>
      </span>
      <span class="r-state ${a.status}">${a.status}</span>`;
    li.addEventListener('click', () => openAgentModal(a.id));
    list.appendChild(li);
  }
}

function renderMetrics() {
  const working = [...office.agents.values()].filter(a => a.status !== 'idle' && a.status !== 'entering').length;
  $('m-working').textContent = working;
  $('m-input').textContent = fmtNum(store.stats.input_tokens || 0);
  $('m-output').textContent = fmtNum(store.stats.output_tokens || 0);
  $('m-deliveries').textContent = store.stats.deliveries || 0;
}

function renderMailboxBadge() {
  const n = store.unread;
  const badge = $('mailbox-count');
  badge.hidden = n === 0;
  badge.textContent = n > 99 ? '99+' : String(n);
}

function renderMailList() {
  const list = $('mail-list');
  $('mail-empty').classList.toggle('hidden', store.deliveries.length > 0);
  list.innerHTML = '';
  for (const d of store.deliveries) {
    const li = document.createElement('li');
    li.className = 'mail-item' + (d.read ? '' : ' unread');
    li.innerHTML = `
      <div class="m-head">
        <span class="m-avatar" style="background:${esc(d.color)}">${esc(d.agent[0] || '?')}</span>
        <span class="m-agent">${esc(d.agent)}</span>
        <span class="m-when">${timeAgo(d.ts)}</span>
      </div>
      <div class="m-title">${esc(d.title)}</div>
      <div class="m-content">${esc(d.content)}</div>`;
    li.addEventListener('click', () => {
      li.classList.toggle('open');
      if (!d.read) markRead([d.id]);
    });
    list.appendChild(li);
  }
}

function openAgentModal(id) {
  const ca = office.agents.get(id);
  if (!ca) return;
  const ag = { ...ca, tokens: ca.tokens || { input: 0, output: 0 } };
  $('am-avatar').style.background = ag.color;
  $('am-avatar').textContent = (ag.name || '?')[0];
  $('am-name').textContent = ag.name;
  $('am-meta').textContent = [ag.role, ag.model].filter(Boolean).join(' · ');
  const pill = $('am-status');
  pill.textContent = ag.status;
  pill.className = 'status-pill ' + ag.status;
  $('am-now').textContent = ag.activity || '';
  $('am-task').textContent = ag.task ? `Task: ${ag.task}` : '';
  $('am-tin').textContent = fmtNum(ag.tokens.input || 0);
  $('am-tout').textContent = fmtNum(ag.tokens.output || 0);
  const steps = $('am-steps');
  steps.innerHTML = '';
  const stepDefs = ag.steps && ag.steps.length ? ag.steps
    : ['Understand the request', 'Plan the approach', 'Gather context', 'Execute the work', 'Deliver'].map(l => ({ label: l, done: false }));
  const nowIdx = stepDefs.findIndex(s => !s.done);
  stepDefs.forEach((s, i) => {
    const li = document.createElement('li');
    li.className = s.done ? 'done' : (i === nowIdx ? 'now' : '');
    li.innerHTML = `<span class="step-mark">${s.done ? '✓' : '·'}</span>${esc(s.label)}`;
    steps.appendChild(li);
  });
  const tools = $('am-tools');
  tools.innerHTML = '';
  for (const t of (ag.tools || []).slice(0, 12)) {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = t;
    tools.appendChild(chip);
  }
  if (!ag.tools || !ag.tools.length) {
    tools.innerHTML = '<span class="chip">no tools used yet</span>';
  }
  openModal('agent-modal');
}

function openModal(id) { $(id).classList.remove('hidden'); }
function closeModal(id) { $(id).classList.add('hidden'); }

async function markRead(ids) {
  try {
    const res = await fetch('/api/deliveries/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    const data = await res.json();
    store.unread = data.unread;
    for (const d of store.deliveries) if (ids.includes(d.id)) d.read = true;
    renderMailboxBadge();
    renderMailList();
  } catch (e) { /* ignore */ }
}

function setLive(on) {
  const dot = $('live-dot');
  dot.classList.toggle('live', on);
  dot.classList.toggle('dead', !on);
  $('live-label').textContent = on ? 'live' : 'reconnecting…';
}

function toast(title, sub, color) {
  const wrap = $('toasts');
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `
    <span class="t-avatar" style="background:${esc(color || '#d96f4a')}">${esc((title[0] || '?').toUpperCase())}</span>
    <div>
      <div class="t-title">${esc(title)}</div>
      <div class="t-sub">${esc(sub)}</div>
    </div>`;
  wrap.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 350); }, 4200);
}

function esc(s) {
  // All dynamic strings (agent names, tool labels, delivery content) pass
  // through esc() before any innerHTML insertion below; static templates are
  // otherwise constant. textContent is used wherever no markup is needed.
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ============================== delivery choreography ============================== */

let lastDeliveryToast = 0;

function finishPendingDeliveries() {
  for (const a of office.agents.values()) {
    if (!a.pendingDelivery) continue;
    const mail = stationOf('mail');
    if (!mail) continue;
    const dist = Math.hypot(a.x - (mail.x - 0.45 + (a.slot % 2) * 0.9), a.y - (mail.y - 0.5));
    if (dist < 0.15) {
      const ev = a.pendingDelivery;
      a.pendingDelivery = null;
      a.toss = 0.8;
      office.mailGlow = 1;
      const c = office.iso(mail.x, mail.y);
      office.burst(c.x, c.y - office.s(30), ['#f2cf78', '#e8a0b8', '#a8d8b0', '#8fb7e8'], 14);
      setTimeout(() => { a.status = 'idle'; a.activity = 'Waiting at desk for your next prompt'; renderAll(); }, 1400);
      // toast (throttled)
      const now = Date.now();
      if (now - lastDeliveryToast > 1500) {
        lastDeliveryToast = now;
        toast('New mail from ' + ev.agent, short(ev.title || ev.text || 'A delivery landed in your mailbox'), a.color);
      }
      store.unread += 1;
      renderMailboxBadge();
      renderRoster();
    }
  }
}

/* ============================== theme switcher ============================== */

function applyTheme(name) {
  document.body.dataset.theme = name;
  office.setTheme(name);
  // recolor agents (palettes differ per theme)
  for (const a of office.agents.values()) a.color = colorFor(a.name);
  localStorage.setItem('office-theme', name);
  $('brand-mark').textContent = THEMES[name].brand;
  for (const btn of document.querySelectorAll('.theme-btn')) {
    btn.classList.toggle('active', btn.dataset.themeName === name);
  }
  document.body.style.setProperty('--accent', THEMES[name].ui.accent);
}

/* ============================== boot ============================== */

function boot() {
  office = new Office($('stage'));
  const saved = localStorage.getItem('office-theme') || 'office';
  applyTheme(saved);

  // theme switcher
  for (const btn of document.querySelectorAll('.theme-btn')) {
    btn.addEventListener('click', () => applyTheme(btn.dataset.themeName));
  }

  // canvas interactions
  const stage = $('stage');
  stage.addEventListener('click', (e) => {
    const r = stage.getBoundingClientRect();
    const hit = office.hitTest(e.clientX - r.left, e.clientY - r.top);
    if (!hit) return;
    if (hit.kind === 'agent') openAgentModal(hit.id);
    else if (hit.kind === 'mail') openMailbox();
  });
  stage.addEventListener('mousemove', (e) => {
    const r = stage.getBoundingClientRect();
    const hit = office.hitTest(e.clientX - r.left, e.clientY - r.top);
    office.hoverAgent = hit && hit.kind === 'agent' ? hit.id : null;
    stage.style.cursor = hit ? 'pointer' : 'default';
  });

  // mailbox
  $('mailbox-btn').addEventListener('click', openMailbox);

  // modal close
  for (const el of document.querySelectorAll('[data-close]')) {
    el.addEventListener('click', () => closeModal(el.closest('.modal').id));
  }

  // main loop
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    office.frame(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // data
  fetchState();
  connect();
}

function openMailbox() {
  renderMailList();
  openModal('mail-modal');
  const unreadIds = store.deliveries.filter(d => !d.read).map(d => d.id);
  if (unreadIds.length) markRead(unreadIds);
}

window.addEventListener('DOMContentLoaded', boot);
