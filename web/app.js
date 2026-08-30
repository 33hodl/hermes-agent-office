/* Hermes Agent Office — app orchestrator.
 * Theme configs, SSE ingestion, UI (roster/metrics/mail/modals), boot.
 * Three renderers in three distinct art styles:
 *   office  — isometric pastel diorama (the viral reference look)
 *   nous    — holographic data plane (cyberpunk)
 *   dunder  — flat 2D cartoon sitcom set (The Office)
 */
'use strict';

const THEMES = {
  office: {
    name: 'office', brand: '🏢', renderer: 'office', franchiseId: 'office',
    agentNames: ['Uma', 'Xyla', 'Hazel', 'Dash', 'Pixel', 'Coco', 'Gizmo', 'Yara'],
    ui: { accent: '#d96f4a' },
    floor: { base: '#e8dcc3', alt: '#e1d3b6', grid: 'rgba(120,100,60,0.10)' },
    wall: { back: '#a9b8a0', side: '#9db29a', base: '#8fa08a', frame: '#7c8a76' },
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
    desks: [[2,2],[4,2],[6,2],[8,2],[2,4],[4,4],[6,4],[8,4],[2,6],[4,6]],
    plants: [[0.8,5.5],[5.5,0.8],[7.8,8.5],[0.8,8.5]],
  },

  nous: {
    name: 'nous', brand: '◈', renderer: 'office', franchiseId: 'office',
    agentNames: ['Uma', 'Xyla', 'Hazel', 'Dash', 'Pixel', 'Coco', 'Gizmo', 'Yara'],
    ui: { accent: '#4d7cf6' },
    floor: { base: '#0d0d15', alt: '#10101a', grid: 'rgba(77,124,246,0.28)' },
    wall: { back: '#13131e', side: '#101019', base: '#1a1a28', frame: '#2a2a42' },
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
    desks: [[2.5,2.5],[4.5,2.5],[6.5,2.5],[8.5,2.5],[2.5,4.5],[4.5,4.5],[6.5,4.5],[8.5,4.5],[2.5,6.5],[4.5,6.5]],
    plants: [[0.8,5.5],[5.5,0.8],[7.8,8.5],[0.8,8.5]],
  },

  dunder: {
    name: 'dunder', brand: '📎', renderer: 'dunder', franchiseId: 'office',
    agentNames: ['Michael', 'Dwight', 'Jim', 'Pam', 'Angela', 'Kevin', 'Stanley', 'Phyllis'],
    ui: { accent: '#c07c2b' },

    floor: { base: '#8b93a8', alt: '#878fa4', grid: 'rgba(60,60,80,0.14)' },
    wall: { back: '#d9c9a8', side: '#d3c2a0', base: '#b8a683', frame: '#a59370' },
    props: {
      wood: '#a3764a', woodDark: '#7c5a36', woodTop: '#b98a55',
      monitor: '#4a5568', screen: '#9db8d8', chair: '#2f2f33',
      pot: '#c96f4a', plant: '#6f9d5e', rugPink: '#d8c4a8', rugGreen: '#b8c4a0',
      mail: '#3b5d8c', mailDark: '#2b4a73', book: ['#c0504d', '#4c7a9c', '#7a9c4c', '#d9a441', '#9c6bb0'],
      whiteboard: '#f5f5f0',
    },
    entrance: { x: 0.5, y: 7.2 },
    stations: [
      { id: 'entrance', label: 'Front Door', type: 'entrance', x: 0.5, y: 9.2 },
      { id: 'reception', label: 'Reception', type: 'reception', x: 1.8, y: 9.6 },
      { id: 'bullpen', label: 'Bullpen', type: 'desks', x: 4.6, y: 4.4 },
      { id: 'michael', label: "Michael's Office", type: 'office', x: 1.2, y: 1.4 },
      { id: 'conference', label: 'Conference Room', type: 'conference', x: 6.8, y: 2.4 },
      { id: 'breakroom', label: 'Break Room', type: 'breakroom', x: 8.2, y: 1.6 },
      { id: 'annex', label: 'The Annex', type: 'desks', x: 9.0, y: 5.2 },
      { id: 'mail', label: 'Inbox', type: 'mail', x: 3.6, y: 9.6 },
      { id: 'warehouse', label: 'Warehouse', type: 'warehouse', x: 9.6, y: 9.4 },
    ],
    desks: [[1.8,3.2],[5.2,3.2],[8.6,3.2],[1.8,5.0],[5.2,5.0],[8.6,5.0],[3.5,6.6],[7.0,6.6]],
    plants: [[2.4,6.6],[6.2,0.8],[0.8,2.6],[7.6,8.8]],
  },

  batman: {
    name: 'batman', brand: '🦇', renderer: 'office', franchiseId: 'batman', windowArt: 'assets/batman-window.png', 
    agentNames: ['Batman', 'Robin', 'Catwoman', 'Joker', 'Bane', 'Nightwing', 'Batgirl', 'Alfred'],
    ui: { accent: '#8a6fd8' },
    backdrop: 'assets/batman-backdrop.png',
    floor: { base: '#3a3a46', alt: '#32323e', grid: 'rgba(160,140,255,0.12)' },
    wall: { back: '#2e2a38', side: '#3a3446', base: '#221e2c', frame: '#4a3a5a' },
    props: {
      wood: '#5a4a6a', woodDark: '#3a3046', woodTop: '#6a5a7a',
      monitor: '#1e2230', monitorScreen: '#7a9ae8', monitorGlow: 'rgba(122,154,232,0.35)',
      chair: '#3a3446', plant: '#4a6a5a', shelf: '#4a3a5a',
      pot: '#5a4a6a', plantPot: '#4a3a5a',
      book: ['#8a6fd8', '#5a8ae8', '#e8c04a', '#e8737c'],
    },
    fx: { dark: true },
    desks: [[2.5,2.5],[4.5,2.5],[6.5,2.5],[8.5,2.5],[2.5,4.5],[4.5,4.5],[6.5,4.5],[8.5,4.5],[2.5,6.5],[4.5,6.5]],
    plants: [[0.8,5.5],[5.5,0.8],[7.8,8.5],[0.8,8.5]],
    stations: [
      { id: 'entrance', label: 'Batcave Entrance', type: 'entrance', x: 0.5, y: 7.2 },
      { id: 'mail', label: 'Mail', type: 'mail', x: 1.2, y: 8.0 },
      { id: 'desk1', label: 'Wayne Desk', type: 'desk', x: 2.5, y: 2.5 },
      { id: 'desk2', label: 'Robin Desk', type: 'desk', x: 4, y: 2.5 },
      { id: 'desk3', label: 'Oracle Desk', type: 'desk', x: 5.5, y: 2.5 },
      { id: 'desk4', label: 'Alfred Desk', type: 'desk', x: 7, y: 3.5 },
      { id: 'desk5', label: 'Cave Desk', type: 'desk', x: 3, y: 4.5 },
      { id: 'desk6', label: 'Lab Desk', type: 'desk', x: 5, y: 5.5 },
      { id: 'desk7', label: 'Ops Desk', type: 'desk', x: 7.5, y: 6.5 },
    ],
  },
  starwars: {
    name: 'starwars', brand: '🚀', renderer: 'voxel', franchiseId: 'starwars', windowArt: 'assets/starwars-window.png', 
    agentNames: ['Luke', 'Leia', 'Han', 'Chewbacca', 'R2-D2', 'C-3PO', 'Obi-Wan', 'Yoda'],
    ui: { accent: '#e8c04a' },
    backdrop: 'assets/starwars-backdrop.png',
    floor: { base: '#4a4a52', alt: '#42424a', grid: 'rgba(255,220,120,0.12)' },
    wall: { back: '#3a3a42', side: '#44444e', base: '#2e2e36', frame: '#5a4a2e' },
    props: {
      wood: '#6a5a3a', woodDark: '#4a3e28', woodTop: '#7a6a4a',
      monitor: '#1e2230', monitorScreen: '#e8c04a', monitorGlow: 'rgba(232,192,74,0.30)',
      chair: '#3a3a44', plant: '#5a6a4a', shelf: '#4a3a2e',
      pot: '#5a4a2e', plantPot: '#4a3a2e',
      book: ['#e8c04a', '#e8737c', '#5a8ae8', '#7a9a5a'],
    },
    fx: { dark: true },
    desks: [[2.5,2.5],[4.5,2.5],[6.5,2.5],[8.5,2.5],[2.5,4.5],[4.5,4.5],[6.5,4.5],[8.5,4.5],[2.5,6.5],[4.5,6.5]],
    plants: [[0.8,5.5],[5.5,0.8],[7.8,8.5],[0.8,8.5]],
    stations: [
      { id: 'entrance', label: 'Hangar Door', type: 'entrance', x: 0.5, y: 7.2 },
      { id: 'mail', label: 'Mail', type: 'mail', x: 1.2, y: 8.0 },
      { id: 'desk1', label: 'Pilot Station', type: 'desk', x: 2.5, y: 2.5 },
      { id: 'desk2', label: 'Tech Station', type: 'desk', x: 4, y: 2.5 },
      { id: 'desk3', label: 'Comm Station', type: 'desk', x: 5.5, y: 2.5 },
      { id: 'desk4', label: 'Cargo Desk', type: 'desk', x: 7, y: 3.5 },
      { id: 'desk5', label: 'Nav Desk', type: 'desk', x: 3, y: 4.5 },
      { id: 'desk6', label: 'Droid Bay', type: 'desk', x: 5, y: 5.5 },
      { id: 'desk7', label: 'Bridge Desk', type: 'desk', x: 7.5, y: 6.5 },
    ],
  },
};

const RENDERERS = { office: OfficeRenderer, nous: NousRenderer, dunder: DunderRenderer, voxel: VoxelRenderer };
const CUSTOM_THEMES = {};   // id -> custom theme config
let activeCustomTheme = null;

const TOOL_ICONS = {
  web_search: '🌐', web_extract: '🌐', browser: '🧭', terminal: '⌨️',
  read_file: '📄', write_file: '✍️', patch: '🔧', search_files: '🔍',
  execute_code: '⚙️', delegate_task: '👥', vision_analyze: '👁️',
  text_to_speech: '🗣️', memory: '🧠', skill_view: '📚', cronjob: '⏰',
  session_search: '🕘', x_search: '🐦', xurl: '🐦',
};
const TOOL_DEFAULT = '🛠️';
const toolIcon = (t) => TOOL_ICONS[t] || TOOL_DEFAULT;

const $ = (id) => document.getElementById(id);

function timeAgo(ts) {
  const s = Math.max(0, (Date.now() / 1000) - ts);
  if (s < 10) return 'just now';
  if (s < 60) return Math.floor(s) + 's';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  return Math.floor(s / 86400) + 'd';
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function short(t) { if (!t) return ''; return t.length > 60 ? t.slice(0, 58) + '…' : t; }

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

function colorFor(name, theme) {
  const palettes = {
    office: ['#f2a38f', '#7ec8c0', '#a8c89a', '#f2cf78', '#c39ad8', '#8fb7e8', '#e8a0b8', '#e8d5a0'],
    nous: ['#4d7cf6', '#6ee7f7', '#8b5cf6', '#22c55e', '#f59e0b', '#ec4899', '#38bdf8', '#a3e635'],
    dunder: ['#c9b8a8', '#b8c4d8', '#a8c89a', '#d9a441', '#c98a9c', '#9cb8d8', '#c4b8a0', '#8fa8b8'],
  };
  const pal = palettes[theme] || palettes.office;
  return pal[hashCode(name) % pal.length];
}

/* ============================== app state ============================== */

/* ---- synthesized sound effects (botvillage playbook: tiny WebAudio blips,
        no audio files). Sound starts on the first click/tap, M or the
        speaker button toggles it. ---- */
const sfx = {
  ctx: null, master: null, enabled: false,
  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.14;
      this.master.connect(this.ctx.destination);
    } catch (e) { /* no audio available — silent */ }
  },
  _tone(freq, dur, type, vol, delay, glide) {
    if (!this.ctx || !this.enabled) return;
    const t0 = this.ctx.currentTime + (delay || 0);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.5, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0 + dur + 0.03);
  },
  enter()   { this._tone(523, .11, 'sine', .45); this._tone(784, .13, 'sine', .35, .07); },
  think()   { this._tone(440, .08, 'triangle', .3); },
  tool()    { this._tone(660, .05, 'square', .14); this._tone(990, .06, 'square', .09, .045); },
  deliver() { this._tone(880, .15, 'sine', .45); this._tone(1174, .2, 'sine', .35, .09); },
  toggle() {
    this.enabled = !this.enabled;
    this._sync();
    return this.enabled;
  },
  _sync() {
    const b = document.getElementById('mute-btn');
    if (b) {
      b.textContent = this.enabled ? '🔊' : '🔇';
      b.setAttribute('aria-pressed', String(this.enabled));
      b.title = this.enabled ? 'Mute sound (M)' : 'Enable sound (M)';
    }
  },
};
// sound starts on the first user gesture (browser autoplay policy)
function primeAudio() {
  sfx.init();
  if (!sfx.enabled) { sfx.enabled = true; sfx._sync(); }
  document.removeEventListener('pointerdown', primeAudio);
  document.removeEventListener('keydown', primeAudio);
}
document.addEventListener('pointerdown', primeAudio);
document.addEventListener('keydown', primeAudio);

const store = {
  agents: new Map(),
  deliveries: [],
  stats: { input_tokens: 0, output_tokens: 0, deliveries: 0 },
  lastEventId: 0,
  unread: 0,
  source: 'demo',
};
let eng = null;
let es = null;
let lastDeliveryToast = 0;

/* ============================== events -> engine ============================== */

// in-character flavor (themes with recognizable casts say their lines)
  const FLAVOR_LINES = {
    michael: ["That's what she said.", "I'm not superstitious, but I am a little stitious.", "Would I rather be feared or loved? Easy. Both."],
    dwight: ["Bears. Beets. Battlestar Galactica.", "False.", "Schrute bucks awarded.", "I am ready for the zombie apocalypse."],
    jim: ["*looks at camera*", "Dwight, that's not a real thing.", "Pam, you up for a prank?"],
    pam: ["Jim, stop it.", "I'm fine. It's fine.", "Another Dundie for Michael..."],
    kevin: ["Kevin's famous chili is ready.", "Are we having pretzel day?"],
    angela: ["The cats need feeding.", "That is unprofessional.", "Mose, no."],
    batman: ["I'm the night.", "Justice.", "The bat-signal... they need me."],
    joker: ["Why so serious?", "It's not about the money...", "Madness is the emergency exit."],
    luke: ["The Force is with me.", "I have a bad feeling about this."],
    han: ["I've got a bad feeling about this.", "Never tell me the odds.", "Kid, I've flown from one side of this galaxy..."],
    chewbacca: ["RRRAAARGH!", "RRrrrgh.", "Grrrrawr."],
  };
  function flavorFor(name) {
    const lines = FLAVOR_LINES[(name || '').toLowerCase()];
    return lines ? lines[Math.floor(Math.random() * lines.length)] : null;
  }

function handleEvent(ev) {
  store.lastEventId = Math.max(store.lastEventId, ev.id);
  let a = eng.agents.get(ev.agent_id);
  if (!a) {
    if (ev.type === 'agent_enter') {
      // roster cap: never exceed the theme's cast so desks don't double-book.
      // Evict oldest agents down to cap-1 (handles SSE history replays that can
      // deliver many enters at once), then add the newcomer.
      const capN = (window.__activeTheme && window.__activeTheme.agentNames)
        ? window.__activeTheme.agentNames.length : 8;
      const ids = [...eng.agents.keys()];
      while (eng.agents.size >= capN && ids.length) {
        const old = ids.shift();
        if (eng.agents.has(old)) eng.agents.delete(old);
      }
      a = eng.addAgent(agentFromStore(ev));
    }
    else return;
  }
  switch (ev.type) {
    case 'agent_enter':
      eng.bubble(a, flavorFor(a.name) || 'Arrived', null, 3.5);
      sfx.enter();
      break;
    case 'agent_leave':
      if (a) {
        eng.bubble(a, 'Heading out', null, 3);
        setTimeout(() => eng.removeAgent(a.id), 1200);
      }
      break;
    case 'thinking': {
      a.status = 'thinking';
      a.activity = ev.text || 'Thinking…';
      a.currentTool = null;
      eng.goTo(a, a.home.x, a.home.y);
      eng.bubble(a, short(ev.text || 'Thinking…'), null, 4);
      sfx.think();
      break;
    }
    case 'tool_call': {
      a.status = 'tool';
      a.activity = ev.text || `using ${ev.tool}`;
      a.currentTool = ev.tool;
      // work AT the desk (typing pose + dots); occasional trips to the tool
      // room only for a few tools, so the room never becomes a cluster
      const deskTools = new Set(['web_search', 'web_extract', 'read_file', 'write_file', 'patch', 'search_files', 'execute_code', 'skill_view', 'memory', 'session_search']);
      const tools = eng.stationOf('tools');
      if (tools && !deskTools.has(ev.tool)) {
        eng.goTo(a, tools.x - 0.5 + (a.slot % 3) * 0.45, tools.y + 0.25 + (a.slot % 3) * 0.35);
      } else {
        eng.goTo(a, a.home.x, a.home.y);
      }
      eng.bubble(a, toolLabel(a.currentTool), toolIcon(a.currentTool), 4);
      sfx.tool();
      break;
    }
    case 'status': {
      a.status = 'working';
      a.activity = ev.text || 'Working…';
      a.currentTool = null;
      eng.goTo(a, a.home.x, a.home.y);
      eng.bubble(a, short(ev.text || 'Working…'), null, 4);
      break;
    }
    case 'delivery': {
      a.status = 'delivering';
      a.activity = 'Delivering work to the mailbox';
      a.currentTool = null;
      const mail = eng.stationOf('mail');
      if (mail) {
        eng.goTo(a, mail.x - 0.45 + (a.slot % 2) * 0.9, mail.y - 0.5);
        a.pendingDelivery = ev;
      }
      sfx.deliver();
      break;
    }
    case 'idle': {
      a.status = 'idle';
      a.activity = ev.text || 'Waiting at desk';
      a.currentTool = null;
      eng.goTo(a, a.home.x, a.home.y);
      eng.bubble(a, short(ev.text || 'Waiting at desk'), null, 5);
      break;
    }
  }
  const toks = ev.tokens || {};
  if (toks.input) store.stats.input_tokens += toks.input;
  if (toks.output) store.stats.output_tokens += toks.output;
  renderAll();
}

function agentFromStore(ev) {
  let name = ev.agent || 'Agent';
  // THEME-CAST GUARD: an entering agent must match the active theme's cast.
  // The demo feed / server can still carry a previous theme's name (race after
  // a theme switch) — force the next cast name so a Batman office can never
  // show a stray "Uma".
  const cast = (window.__activeTheme && window.__activeTheme.agentNames) || null;
  if (cast && cast.length) {
    if (!cast.includes(name)) {
      const idx = (window.__castCounter = (window.__castCounter || 0) + 1) - 1;
      name = cast[idx % cast.length];
    }
  }
  const look = (eng.theme && eng.theme.franchiseId)
    ? castLook(name, eng.theme.franchiseId)
    : officeCastLook(name);
  return {
    id: ev.agent_id || ev.session || ('a' + Math.random().toString(36).slice(2)),
    name,
    color: look.hue || colorFor(name, eng.theme.name),
    visitor: !!ev.visitor,
    look,
    role: ev.role || 'agent',
    model: ev.model || '',
    status: 'entering',
    activity: 'Arriving at the office',
    task: '', tokens: { input: 0, output: 0 }, tools: [], steps: [],
  };
}

/* reassign archetype looks to every live agent when the theme changes */
function relookAgents() {
  const fid = (eng.theme && eng.theme.franchiseId) || null;
  const darkTheme = !!(eng.theme && eng.theme.fx && eng.theme.fx.dark);
  for (const a of eng.agents.values()) {
    a.look = fid ? castLook(a.name, fid) : officeCastLook(a.name);
    a.look.hue = darkTheme ? liftDark(a.look.hue || a.color) : (a.look.hue || a.color);
    a.color = a.look.hue;
  }
}
/* on dark themes, keep very dark character hues readable (no camouflage) */
function liftDark(hex) {
  // aggressively brighten very dark hues on dark themes so characters pop
  const n = parseInt((hex || '#888888').slice(1), 16);
  const lum = (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000;
  if (lum >= 105) return hex;
  const f = 1 + (135 - lum) / Math.max(lum, 30);
  const c = (v) => clamp(Math.round(v * f), 0, 255);
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

/* ============================== SSE / API ============================== */

function connect() {
  es = new EventSource(`/api/events?since=${store.lastEventId}`);
  es.onmessage = (msg) => {
    try { handleEvent(JSON.parse(msg.data)); } catch (e) { /* skip */ }
    finishPendingDeliveries();
  };
  es.onopen = () => setLive(true);
  es.onerror = () => setLive(false);
}

function startOfflineDemo() {
  setLive(false);
  $('live-label').textContent = 'demo · in-browser';
  const banner = document.createElement('div');
  banner.className = 'offline-banner';
  banner.innerHTML = '<b>Browser demo</b> — no server detected. Agents are simulated in your browser. ' +
    'Run <code>python3 -m office.server --db ~/.hermes/state.db</code> to watch your real agents. ' +
    '<button class="banner-x" aria-label="Dismiss">✕</button>';
  banner.querySelector('.banner-x').addEventListener('click', () => banner.remove());
  document.body.appendChild(banner);
  // keep the roster within the theme's cast: when a new wave spawns beyond the
  // cap, retire the oldest agent so desks never double-book (any status —
  // idle-only eviction let duplicates in during theme switches)
  const capped = (ev) => {
    if (ev.type === 'agent_enter') {
      const capN = (window.__activeTheme && window.__activeTheme.agentNames)
        ? window.__activeTheme.agentNames.length : 6;
      const ids = [...eng.agents.keys()];
      while (ids.length >= capN) {
        const old = ids.shift();
        const a = eng.agents.get(old);
        if (a && !a.leaving) { eng.removeAgent(old); break; }
      }
    }
    handleEvent(ev);
  };
  startClientDemo(capped, (label) => { $('live-label').textContent = label; });
  // seed a few deliveries so the mailbox isn't empty
  for (const name of CLIENT_DEMO_NAMES.slice(0, 3)) {
    handleEvent({
      id: 9000 + Math.floor(Math.random() * 500), ts: Date.now() / 1000 - 600,
      type: 'delivery', agent: name, agent_id: 'demo-' + name.toLowerCase(),
      session: 'demo-' + name.toLowerCase(), role: 'telegram',
      title: 'Seeded delivery from ' + name,
      content: 'This is a delivery that arrived before you opened the office.',
    });
  }
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
      if (!eng.agents.has(ag.id)) {
        // same roster cap as handleEvent — /api/state replays can exceed the cast
        const capN = (window.__activeTheme && window.__activeTheme.agentNames)
          ? window.__activeTheme.agentNames.length : 8;
        const ids = [...eng.agents.keys()];
        while (eng.agents.size >= capN && ids.length) {
          const old = ids.shift();
          if (eng.agents.has(old)) eng.agents.delete(old);
        }
        const ca = eng.addAgent(agentFromStore({ agent_id: ag.id, agent: ag.name, role: ag.role, model: ag.model }));
        ca.status = ag.status; ca.activity = ag.activity; ca.task = ag.task;
        ca.tokens = ag.tokens; ca.tools = ag.tools; ca.steps = ag.steps;
      }
    }
    for (const ag of st.agents) {
      const ca = eng.agents.get(ag.id);
      if (ca) { ca.status = ag.status; ca.activity = ag.activity; }
    }
    renderAll();
    const health = await (await fetch('/api/health')).json();
    store.source = health.source && health.source.name ? health.source.name : 'demo';
    $('source-badge').textContent = store.source;
    $('mode-note').textContent = store.source === 'demo'
      ? 'Demo feed — run with --db for live agents.'
      : `Live feed from ${health.source.db}`;
  } catch (e) { /* warming up */ }
}

/* ============================== UI ============================== */

function renderAll() { renderRoster(); renderMetrics(); renderMailboxBadge(); }

function renderRoster() {
  const list = $('roster-list');
  // dedupe by agent name (multiple sessions can share a name); keep the first
  const seen = new Set();
  const agents = [...eng.agents.values()].filter((a) => {
    if (seen.has(a.name)) return false;
    seen.add(a.name);
    return true;
  });
  $('roster-count').textContent = agents.length;
  $('roster-empty').classList.toggle('hidden', agents.length > 0);
  list.innerHTML = '';
  for (const a of agents) {
    const li = document.createElement('li');
    li.className = 'roster-item';
    li.innerHTML = `
      <span class="dot" style="background:${esc(a.color)}"></span>
      <span class="r-info">
        <span class="r-name">${esc(a.name)}${a.visitor ? ' <span class="visitor-chip">visiting</span>' : ''}</span>
        <span class="r-status">${esc(a.activity || '')}</span>
      </span>
      <span class="r-state ${esc(a.status)}">${esc(a.status)}</span>`;
    li.addEventListener('click', () => openAgentModal(a.id));
    list.appendChild(li);
  }
}

function renderMetrics() {
  const working = [...eng.agents.values()].filter(a => a.status !== 'idle' && a.status !== 'entering').length;
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
        <span class="m-avatar" style="background:${esc(d.color)}">${esc((d.agent || '?')[0])}</span>
        <span class="m-agent">${esc(d.agent)}</span>
        <span class="m-when">${timeAgo(d.ts)}</span>
      </div>
      <div class="m-title">${esc(d.title)}</div>
      <div class="m-content">${esc(d.content)}</div>
      <div class="m-actions">
        <button class="m-copy" data-id="${esc(d.id)}" title="Copy delivery text">⧉ Copy</button>
      </div>`;
    li.addEventListener('click', (e) => {
      if (e.target.closest('.m-copy')) return;
      li.classList.toggle('open');
      if (!d.read) markRead([d.id]);
    });
    list.appendChild(li);
  }
  for (const btn of list.querySelectorAll('.m-copy')) {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = Number(btn.dataset.id);
      const d = store.deliveries.find((x) => x.id === id);
      if (!d) return;
      try {
        await navigator.clipboard.writeText(d.title + '\n\n' + (d.content || ''));
        toast('Copied', 'Delivery text is on your clipboard', '#7ec8c0');
      } catch (err) {
        toast('Copy failed', 'Clipboard unavailable', '#c0504d');
      }
    });
  }
}

function openAgentModal(id) {
  const a = eng.agents.get(id);
  if (!a) return;
  $('am-avatar').style.background = a.color;
  $('am-avatar').textContent = (a.name || '?')[0];
  $('am-name').textContent = a.name;
  $('am-meta').textContent = [a.role, a.model].filter(Boolean).join(' · ');
  const pill = $('am-status');
  pill.textContent = a.status;
  pill.className = 'status-pill ' + a.status;
  $('am-now').textContent = a.activity || '';
  $('am-task').textContent = a.task ? `Task: ${a.task}` : '';
  $('am-tin').textContent = fmtNum((a.tokens && a.tokens.input) || 0);
  $('am-tout').textContent = fmtNum((a.tokens && a.tokens.output) || 0);
  const steps = $('am-steps');
  steps.innerHTML = '';
  const stepDefs = a.steps && a.steps.length ? a.steps
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
  for (const t of (a.tools || []).slice(0, 12)) {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = t;
    tools.appendChild(chip);
  }
  if (!a.tools || !a.tools.length) tools.innerHTML = '<span class="chip">no tools used yet</span>';
  // live log: recent deliveries by this agent
  const log = $('am-log');
  if (log) {
    const recent = store.deliveries.filter(d => d.agent === a.name).slice(0, 4);
    log.innerHTML = recent.length
      ? recent.map(d => `<div class="log-row"><span class="log-when">${timeAgo(d.ts)}</span>${esc(short(d.title))}</div>`).join('')
      : '<div class="log-row dim">No deliveries yet — they land in the mailbox.</div>';
  }
  openModal('agent-modal');
}

/* ============================== Task bar ============================== */
async function submitTask(text) {
  if (!text) return;
  try {
    const res = await fetch('/api/task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      toast('Task not accepted', (data && data.error) || 'try again', '#c0504d');
      return;
    }
    toast('Task assigned', 'The team is on it — watch the office', '#d96f4a');
  } catch (e) {
    toast('Task not accepted', 'Office server unreachable', '#c0504d');
  }
}

/* ============================== First-run tour ============================== */
const TOUR_STEPS = [
  { el: '#stage', title: 'This is your office', text: 'Your Hermes agents live here. Watch them walk between desks, use tools, and work in real time.' },
  { el: '#roster-panel', title: 'Your agents', text: 'Every agent has its own look — headgear, props, colors. Click one to see its role, model, loadout and recent deliveries.' },
  { el: '.topbar-task', title: 'Give them work', text: 'Type a task and press Enter. In live mode it runs a real Hermes session; in demo, watch the whole flow.' },
  { el: '#mailbox-btn', title: 'The mailbox', text: 'Finished work lands here. Click an item to read it, or hit ⧉ Copy to grab the text.' },
];
let tourStep = 0;
function showTour() {
  if ($('tour').classList.contains('hidden') === false) return;
  tourStep = 0;
  $('tour').classList.remove('hidden');
  renderTourStep();
}
function hideTour() {
  $('tour').classList.add('hidden');
  localStorage.setItem('office-tour-seen', '1');
}
function renderTourStep() {
  const s = TOUR_STEPS[tourStep];
  $('tour-title').textContent = s.title;
  $('tour-text').textContent = s.text;
  $('tour-prev').classList.toggle('hidden', tourStep === 0);
  $('tour-next').textContent = tourStep === TOUR_STEPS.length - 1 ? 'Done' : 'Next →';
  // highlight target
  document.querySelectorAll('.tour-spot').forEach((x) => x.remove());
  const el = document.querySelector(s.el);
  if (el) {
    const r = el.getBoundingClientRect();
    const spot = document.createElement('div');
    spot.className = 'tour-spot';
    spot.style.cssText = `left:${r.left - 6}px;top:${r.top - 6}px;width:${r.width + 12}px;height:${r.height + 12}px;`;
    document.body.appendChild(spot);
    $('tour-card').style.left = '50%';
  }
  // dots
  $('tour-dots').innerHTML = TOUR_STEPS.map((_, i) =>
    `<span class="tour-dot${i === tourStep ? ' on' : ''}"></span>`).join('');
}
function wireTour() {
  $('tour-next').addEventListener('click', () => {
    if (tourStep < TOUR_STEPS.length - 1) { tourStep++; renderTourStep(); }
    else hideTour();
  });
  $('tour-prev').addEventListener('click', () => { if (tourStep > 0) { tourStep--; renderTourStep(); } });
  $('tour-skip').addEventListener('click', hideTour);
}

/* ============================== Keyboard shortcuts ============================== */
function wireShortcuts() {
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    switch (e.key) {
      case '1': applyTheme('office'); break;
      case '2': applyTheme('nous'); break;
      case '3': applyTheme('dunder'); break;
      case 'm': case 'M':
        e.preventDefault();
        sfx.init();
        sfx.toggle();
        break;
      case 'g': case 'G': openMailbox(); break;
      case 't': case 'T':
        e.preventDefault();
        const ti = $('task-input');
        if (ti) ti.focus();
        break;
      case '?': showTour(); break;
    }
  });
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

/* ============================== sound (WebAudio, zero assets) ============================== */



/* ============================== delivery choreography ============================== */

function finishPendingDeliveries() {
  for (const a of eng.agents.values()) {
    if (!a.pendingDelivery) continue;
    const mail = eng.stationOf('mail');
    if (!mail) continue;
    const tx = mail.x - 0.45 + (a.slot % 2) * 0.9, ty = mail.y - 0.5;
    if (Math.hypot(a.x - tx, a.y - ty) < 0.18) {
      const ev = a.pendingDelivery;
      a.pendingDelivery = null;
      a.toss = 0.8;
      eng.mailGlow = 1;
      const c = eng.renderer.map(eng, mail.x, mail.y);
      eng.particles.spawn({ x: c.x, y: c.y - eng.s(30), vx: 0, vy: 0, life: 0.8, maxLife: 0.8, r: 4, color: '#f2cf78', glow: true });
      for (let i = 0; i < 14; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 40 + Math.random() * 90;
        eng.particles.spawn({
          x: c.x, y: c.y - eng.s(26), vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 40,
          life: 0.6 + Math.random() * 0.5, maxLife: 1.1, r: 2 + Math.random() * 2.5,
          color: ['#f2cf78', '#e8a0b8', '#a8d8b0', '#8fb7e8'][i % 4], grav: 60, glow: true,
        });
      }
      setTimeout(() => { a.status = 'idle'; a.activity = 'Waiting at desk for your next prompt'; renderAll(); }, 1400);
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
  const theme = THEMES[name] || CUSTOM_THEMES[name];
  if (!theme) return;
  activeCustomTheme = CUSTOM_THEMES[name] || null;
  window.__activeTheme = theme;
  window.__activeCustomTheme = activeCustomTheme;
  eng.setTheme(theme);
  eng.setRenderer(RENDERERS[theme.renderer || 'office']);
  if (eng.renderer && eng.renderer.name === 'office') {
    // themed WINDOW ART: the office interior stays procedural; the image is the view
    // through the back-wall window (cohesive, characters keep human scale)
    eng.renderer.customBackdrop = null;
    const art = theme.windowArt || 'assets/office-window.png';
    const img = new Image();
    img.src = art;
    const apply = () => {
      if (eng.renderer) {
        eng.renderer.backdrop = img;
        eng.renderer._blurTop = null; eng.renderer._blurBottom = null; eng.renderer._blurTimer = 0;
        eng.resize();
        requestAnimationFrame(() => { if (eng.renderer) eng.resize(); });
      }
    };
    if (img.decode) { img.decode().then(apply).catch(() => { img.onload = apply; }); }
    else { img.onload = apply; }
    img.onload = apply;
  } else if (eng.renderer) {
    eng.renderer.customBackdrop = null;
  }
  // restaff: RENAME ALL existing agents to the theme's cast (cycled, so no
  // generic leftover names ever survive a theme switch)
  if (theme.agentNames && theme.agentNames.length) {
    const pool = theme.agentNames;
    let i = 0;
    for (const a of eng.agents.values()) {
      const nn = pool[i++ % pool.length];
      if (a.name !== nn) a.name = nn;
    }
    renderRoster();
  }
  relookAgents(); // applies cast looks + dark-theme hue lift AFTER the rename
  window.__castCounter = 0; // fresh cycle for agents entering under this theme
  eng.rehome();   // reassign desks from the new theme so agents never cluster
  localStorage.setItem('office-theme', name);
  $('brand-mark').textContent = theme.brand || '🏢';
  for (const btn of document.querySelectorAll('.theme-btn')) {
    btn.classList.toggle('active', btn.dataset.themeName === name);
  }
  document.body.style.setProperty('--accent', theme.ui.accent);
  // demo mode: use the custom agent names
  if (theme.agentNames && theme.agentNames.length && store.source === 'demo') {
    fetch('/api/demo/names', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names: theme.agentNames }),
    }).catch(() => {});
  }
}

/* register + apply a custom theme (creator panel) */
function applyCustomTheme(theme) {
  const id = theme.id || ('custom-' + Date.now().toString(36));
  CUSTOM_THEMES[id] = theme;
  // add a switcher button if not present
  let btn = document.querySelector(`.theme-btn[data-theme-name="${id}"]`);
  if (!btn) {
    btn = document.createElement('button');
    btn.className = 'theme-btn';
    btn.dataset.themeName = id;
    btn.textContent = (theme.brand || '✨') + ' ' + (theme.label || 'Custom');
    btn.addEventListener('click', () => applyTheme(id));
    document.getElementById('theme-switcher').appendChild(btn);
  }
  // persist custom themes
  const saved = JSON.parse(localStorage.getItem('office-custom-themes') || '{}');
  saved[id] = stripCustomForSave(theme);
  localStorage.setItem('office-custom-themes', JSON.stringify(saved));
  applyTheme(id);
  toast('Office ready', `${theme.label} is live — your agents have moved in`, theme.ui.accent);
}

function stripCustomForSave(t) {
  return JSON.parse(JSON.stringify(t));
}

/* restore saved custom themes on boot */
function restoreCustomThemes() {
  try {
    const saved = JSON.parse(localStorage.getItem('office-custom-themes') || '{}');
    for (const [id, t] of Object.entries(saved)) {
      t.id = id;
      CUSTOM_THEMES[id] = t;
      let btn = document.querySelector(`.theme-btn[data-theme-name="${id}"]`);
      if (!btn) {
        btn = document.createElement('button');
        btn.className = 'theme-btn';
        btn.dataset.themeName = id;
        btn.textContent = (t.brand || '✨') + ' ' + (t.label || 'Custom');
        btn.addEventListener('click', () => applyTheme(id));
        document.getElementById('theme-switcher').appendChild(btn);
      }
    }
  } catch (e) { /* ignore corrupted storage */ }
}

/* ============================== boot ============================== */

function boot() {
  eng = new OfficeEngine($('stage'));
  window.__eng = eng;
  // visible version badge so users can confirm they're on the latest build
  const demoTag = document.getElementById('source-badge');
  if (demoTag && !document.querySelector('.ver-badge')) {
    const vb = document.createElement('span');
    vb.className = 'ver-badge';
    vb.textContent = 'v1.3';
    demoTag.after(vb);
  }
  restoreCustomThemes();
  const saved = localStorage.getItem('office-theme') || 'office';
  applyTheme(saved);

  for (const btn of document.querySelectorAll('.theme-btn')) {
    btn.addEventListener('click', () => applyTheme(btn.dataset.themeName));
  }

  const stage = $('stage');
  stage.addEventListener('click', (e) => {
    const r = stage.getBoundingClientRect();
    const hit = eng.hitTest(e.clientX - r.left, e.clientY - r.top);
    if (!hit) return;
    if (hit.kind === 'agent') openAgentModal(hit.id);
    else if (hit.kind === 'mail') openMailbox();
  });
  stage.addEventListener('mousemove', (e) => {
    const r = stage.getBoundingClientRect();
    const hit = eng.hitTest(e.clientX - r.left, e.clientY - r.top);
    eng.hoverAgent = hit && hit.kind === 'agent' ? hit.id : null;
    stage.style.cursor = hit ? 'pointer' : 'default';
  });

  $('mailbox-btn').addEventListener('click', openMailbox);
  const mb = $('mute-btn');
  if (mb) mb.addEventListener('click', () => { sfx.init(); sfx.toggle(); });
  // first-run welcome + sample task
  const welcome = document.getElementById('welcome');
  if (welcome && !localStorage.getItem('office-welcome-seen')) {
    welcome.classList.remove('hidden');
    localStorage.setItem('office-welcome-seen', '1');
    // on mobile the modal eats the screen — auto-dismiss after 5s
    setTimeout(() => welcome.classList.add('hidden'), 5000);
    document.getElementById('welcome-close').addEventListener('click', () => welcome.classList.add('hidden'));
    document.getElementById('welcome-demo').addEventListener('click', async () => {
      welcome.classList.add('hidden');
      try {
        await fetch('/api/demo/burst', { method: 'POST' });
        toast('Sample task started', 'Watch your agent run it end to end', '#d96f4a');
      } catch (e) {
        toast('Sample task needs demo mode', 'Run the server with --demo first', '#c0504d');
      }
    });
  }

  // zoom controls (buttons + wheel + pinch)
  const zi = document.getElementById('zoom-in'), zo = document.getElementById('zoom-out'), zr = document.getElementById('zoom-reset');
  if (zi) zi.addEventListener('click', () => { eng.zoomIn(); });
  if (zo) zo.addEventListener('click', () => { eng.zoomOut(); });
  if (zr) zr.addEventListener('click', () => { eng.resetZoom(); });
  const stageEl = document.getElementById('stage');
  stageEl.addEventListener('wheel', (e) => {
    e.preventDefault();
    eng.setZoom(e.deltaY < 0 ? 0.1 : -0.1);
  }, { passive: false });
  let pinchDist = 0;
  stageEl.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) pinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
  }, { passive: true });
  stageEl.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (pinchDist > 0) eng.setZoom((d - pinchDist) * 0.01);
      pinchDist = d;
    }
  }, { passive: true });
  stageEl.addEventListener('touchend', () => { pinchDist = 0; });

  // task bar
  const taskInput = $('task-input');
  const taskSend = $('task-send');
  const runTask = () => {
    const t = taskInput.value.trim();
    if (t) { submitTask(t); taskInput.value = ''; taskInput.blur(); }
  };
  taskSend.addEventListener('click', runTask);
  taskInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') runTask(); });

  // tour: after welcome (if not seen)
  wireTour();
  const tourSeen = localStorage.getItem('office-tour-seen');
  if (!tourSeen) {
    const w = $('welcome');
    const startTour = () => showTour();
    if (w && !w.classList.contains('hidden')) {
      $('welcome-close').addEventListener('click', startTour);
      $('welcome-demo').addEventListener('click', startTour);
    } else {
      setTimeout(startTour, 800);
    }
  }
  wireShortcuts();

  // probe server: if unreachable (static hosting), run the in-browser demo
  fetch('/api/health', { method: 'GET' }).then((r) => {
    if (!r.ok) throw new Error('no server');
  }).catch(() => {
    setTimeout(startOfflineDemo, 400); // let the SSE error state settle first
  });

  const cb = document.getElementById('creator-btn');
  if (cb) {
    cb.addEventListener('click', () => {
      if (window.__creatorReady) window.__creatorReady();
      openModal('creator-modal');
    });
  }
  for (const el of document.querySelectorAll('[data-close]')) {
    el.addEventListener('click', () => closeModal(el.closest('.modal').id));
  }

  // FPS meter (dev: ?fps=1)
  if (new URLSearchParams(location.search).has('fps')) {
    const chip = document.createElement('span');
    chip.id = 'fps-chip';
    chip.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:80;font:700 11px monospace;background:rgba(0,0,0,.55);color:#7CFC9A;padding:3px 8px;border-radius:6px';
    document.body.appendChild(chip);
    setInterval(() => { chip.textContent = eng.fps + ' fps'; }, 500);
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    eng.frame(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  fetchState();
  connect();
  // periodic state heal: re-sync metrics/deliveries in case SSE ever drops
  setInterval(() => fetchState(), 30000);
}

function openMailbox() {
  renderMailList();
  openModal('mail-modal');
  const unreadIds = store.deliveries.filter(d => !d.read).map(d => d.id);
  if (unreadIds.length) markRead(unreadIds);
}

window.__applyCustomTheme = applyCustomTheme;
window.__eng = null; // set at boot (debug/QA hook)
window.addEventListener('DOMContentLoaded', boot);
