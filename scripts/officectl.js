#!/usr/bin/env node
/*
 * officectl — the control CLI for Hermes Agent Office.
 *
 * Adopted 2026-09-27 from @poteto's pstack Part 1 ("Build the Lever": give
 * agents a small, composable, agent-friendly CLI instead of throwaway scripts;
 * `--dry-run` on anything with a side effect; errors that name the fix;
 * machine-readable output). Replaces the one-off capture-v5..v8.js scripts.
 *
 * Zero npm dependencies for every server-side command (Node 18+ stdlib).
 * Browser commands (open/status/themes/theme/settle/shot/gif/verify) drive the
 * app through the stable QA hook `window.__eng` and need Playwright; the CLI
 * locates it automatically and says exactly what to do when it cannot.
 *
 * Run `node scripts/officectl.js help` for the command list.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const { spawn, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const RUNDIR = path.join(ROOT, '.officectl');
const PIDFILE = path.join(RUNDIR, 'pid');
const LOGFILE = path.join(RUNDIR, 'server.log');
const FEATURES_DIR = path.join(ROOT, 'skills', 'hermes-agent-office', 'references', 'features');

const THEMES = ['office', 'nous', 'dunder', 'batman', 'starwars'];

// ---------------------------------------------------------------- arg parsing

function parseArgs(argv) {
  const opts = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, inline] = a.slice(2).split('=');
      const key = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      if (inline !== undefined) opts[key] = inline;
      else if (argv[i + 1] && !argv[i + 1].startsWith('--')) opts[key] = argv[++i];
      else opts[key] = true;
    } else opts._.push(a);
  }
  return opts;
}

// --------------------------------------------------------------- error + IO

function ok(msg) { process.stdout.write(msg + '\n'); }

/** Fail loudly WITH the fix. Every error names the next command to run. */
function fail(problem, fix, extra) {
  process.stderr.write(`error: ${problem}\n`);
  if (extra) process.stderr.write(`  (${extra})\n`);
  if (fix) process.stderr.write(`fix:   ${fix}\n`);
  process.exit(2);
}

function emit(opts, humanFn, jsonObj) {
  if (opts.json) process.stdout.write(JSON.stringify(jsonObj, null, 2) + '\n');
  else humanFn();
}

function httpJson(url, { method = 'GET', body, timeoutMs = 15000 } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: u.hostname, port: u.port || 80, path: u.pathname + u.search, method,
        headers: payload
          ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
          : {},
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          if (res.statusCode >= 400) {
            return reject(new Error(`${method} ${u.pathname} -> HTTP ${res.statusCode} ${data.slice(0, 200)}`));
          }
          try { resolve(JSON.parse(data || '{}')); }
          catch (e) { reject(new Error(`${method} ${u.pathname} -> non-JSON reply: ${data.slice(0, 120)}`)); }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`timeout after ${timeoutMs}ms`)));
    if (payload) req.write(payload);
    req.end();
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------ playwright

function findPlaywright() {
  const tried = [];
  const candidates = [
    process.env.OFFICECTL_PLAYWRIGHT,
    path.join(ROOT, 'node_modules', 'playwright'),
    // the Hermes install ships Playwright: honour HERMES_HOME, then the usual
    // homes. (A bare `ssh` session has HOME=/root, so homedir() alone misses
    // the real Hermes home — this is the bug that broke the first verify run.)
    process.env.HERMES_HOME && path.join(process.env.HERMES_HOME, 'hermes-agent', 'node_modules', 'playwright'),
    '/home/hermes/.hermes/hermes-agent/node_modules/playwright',
    path.join(os.homedir(), '.hermes', 'hermes-agent', 'node_modules', 'playwright'),
    '/usr/lib/node_modules/playwright',
  ].filter(Boolean);
  // last resort: any /home/*/.hermes install
  try {
    for (const h of fs.readdirSync('/home')) {
      candidates.push(path.join('/home', h, '.hermes', 'hermes-agent', 'node_modules', 'playwright'));
    }
  } catch (e) { /* no /home listing */ }
  for (const c of candidates) {
    tried.push(c);
    try { return { mod: require(c), from: c }; } catch (e) { /* keep looking */ }
  }
  fail(
    `Playwright is required for browser commands and was not found (tried ${tried.length} paths, incl. ${tried.slice(0, 3).join(', ')})`,
    'export OFFICECTL_PLAYWRIGHT=/path/to/node_modules/playwright  (or `npm i playwright` in the repo root, then re-run)',
    'server-side commands (health/state/up/down/task/burst/features) need no browser'
  );
}

async function withPage(opts, fn) {
  const { mod, from } = findPlaywright();
  const url = (opts.url || 'http://127.0.0.1:8741') + '/?officectl=' + Date.now();
  let browser;
  try {
    browser = await mod.chromium.launch({ headless: !opts.headed });
  } catch (e) {
    fail(
      `Playwright found at ${from} but the browser failed to launch: ${e.message.split('\n')[0]}`,
      'npx playwright install chromium  (then re-run; on this VPS the prebuilt browser lives in ~/.cache/ms-playwright)'
    );
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 820 } });
  // keep the page's own errors: "the hook never appeared" is useless without
  // the JS error that stopped the app from booting
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e && e.message || e).split('\n')[0]));
  page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(`console: ${m.text().slice(0, 200)}`); });
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch((e) => {
      fail(
        `could not load ${url}: ${e.message.split('\n')[0]}`,
        `start the office first: node scripts/officectl.js up   (or pass --url http://host:port)`
      );
    });
    // deterministic start: no first-run overlays, no stale theme/roster
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('office-welcome-seen', '1');
      localStorage.setItem('office-tour-seen', '1');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction('window.__eng && window.__eng.agents', { timeout: 15000 }).catch(() => {
      fail(
        'the office loaded but the QA hook window.__eng never appeared',
        'the app did not boot — fix the page error above; if the hook was renamed, update scripts/officectl.js ENGINE_STATE()',
        pageErrors.length ? `page error: ${pageErrors[0]}` : 'no JS error was reported — check that app.js and the renderer scripts are served'
      );
    });
    await page.evaluate(() => {
      const w = document.getElementById('welcome');
      if (w) w.classList.add('hidden');
      const bx = document.querySelector('.banner-x');
      if (bx) bx.click();
    });
    return await fn(page);
  } finally {
    await browser.close();
  }
}

const ENGINE_STATE = () => {
  const eng = window.__eng;
  const r = eng.renderer;
  // art contract: photo renderers expose a sprite registry; procedural
  // renderers (voxel) expose paletteNames. Neither => art cannot be verified.
  const hasSprites = !!(r && r.sprites);
  const palettes = (r && r.paletteNames) || null;
  const agents = [...eng.agents.values()].map((a) => {
    const key = (a.name || '').toLowerCase();
    let art = 'UNCHECKED';
    if (hasSprites) {
      const spr = r.sprites[key];
      art = spr ? (spr.complete && spr.naturalWidth > 0 ? 'img' : 'BROKEN') : 'MISSING';
    } else if (palettes) {
      art = palettes.includes(key) ? 'palette' : 'MISSING';
    }
    return {
      name: a.name,
      status: a.status,
      activity: a.activity || null,
      moving: !!a.moving,
      leaving: !!a.leaving,
      atDesk: !!(a.home && Math.hypot(a.x - a.home.x, a.y - a.home.y) < 0.4 && !a.moving),
      art,
    };
  });
  const names = agents.map((a) => a.name);
  return {
    theme: (eng.theme && eng.theme.name) || null,
    renderer: r ? r.name : null,
    artContract: hasSprites ? 'sprites' : (palettes ? 'paletteNames' : 'none'),
    scale: eng.scale,
    zoom: eng.zoom,
    agents,
    artProblems: agents.filter((a) => a.art === 'MISSING' || a.art === 'BROKEN').map((a) => `${a.name}:${a.art}`),
    artUnchecked: agents.some((a) => a.art === 'UNCHECKED'),
    duplicates: [...new Set(names.filter((n, i) => names.indexOf(n) !== i))],
    modeLabel: (document.getElementById('live-label') || {}).textContent || null,
    rosterCount: (document.getElementById('roster-count') || {}).textContent || null,
    deployedRooms: [...document.querySelectorAll('.theme-btn')].map((b) => ({
      id: b.dataset.themeName, label: b.textContent.trim(), active: b.classList.contains('active'),
    })),
  };
};

async function settle(page, { timeoutMs, force = false, minAgents = 6 }) {
  const deadline = Date.now() + timeoutMs;
  let st = await page.evaluate(ENGINE_STATE);
  while (Date.now() < deadline) {
    if (st.agents.length >= minAgents && st.agents.every((a) => !a.moving)) return { settled: true, state: st };
    if (force) {
      await page.evaluate(() => {
        for (const a of window.__eng.agents.values()) {
          if (a.moving || a.status === 'entering') {
            a.x = a.home.x; a.y = a.home.y; a.moving = false; a._seekDesk = false;
          }
        }
      });
    }
    await sleep(600);
    st = await page.evaluate(ENGINE_STATE);
  }
  return { settled: false, state: st };
}

/** Expected cast per theme, read from web/app.js so it cannot drift silently. */
function themeCasts() {
  const src = fs.readFileSync(path.join(ROOT, 'web', 'app.js'), 'utf8');
  const casts = {};
  const re = /name:\s*'([a-z]+)',[\s\S]{0,400}?agentNames:\s*\[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(src))) {
    casts[m[1]] = m[2].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean);
  }
  return casts;
}

// --------------------------------------------------------------- server cmds

function serverUrl(opts) { return opts.url || 'http://127.0.0.1:8741'; }

async function cmdUp(opts) {
  const port = Number(opts.port || 8741);
  const live = !!opts.live;
  const args = ['-m', 'office.server', '--port', String(port)];
  if (live) args.push('--db', opts.db || path.join(os.homedir(), '.hermes', 'state.db'));
  else args.push('--demo');
  const action = `python3 ${args.join(' ')}  (cwd ${ROOT})`;
  if (opts.dryRun) return emit(opts, () => ok(`would run: ${action}\nlog: ${LOGFILE}\npidfile: ${PIDFILE}`), { dryRun: true, action });
  fs.mkdirSync(RUNDIR, { recursive: true });
  const out = fs.openSync(LOGFILE, 'a');
  const child = spawn('python3', args, { cwd: ROOT, detached: true, stdio: ['ignore', out, out] });
  child.unref();
  fs.writeFileSync(PIDFILE, String(child.pid));
  const url = serverUrl(opts).replace(/:\d+$/, ':' + port);
  const deadline = Date.now() + Number(opts.timeout || 30) * 1000;
  while (Date.now() < deadline) {
    try {
      const h = await httpJson(url + '/api/health', { timeoutMs: 2000 });
      if (h.ok) return emit(opts, () => ok(`office up on ${url} (pid ${child.pid}, mode ${h.source && h.source.name || 'unknown'}, v${h.version})`), { ok: true, url, pid: child.pid, health: h });
    } catch (e) { /* not ready yet */ }
    await sleep(500);
  }
  fail(
    `server started (pid ${child.pid}) but ${url}/api/health never answered within ${opts.timeout || 30}s`,
    `read ${LOGFILE} for the traceback; then re-run "node scripts/officectl.js up" or pick another --port`
  );
}

async function cmdDown(opts) {
  if (!fs.existsSync(PIDFILE)) {
    fail('no server started by officectl (no pidfile)', 'node scripts/officectl.js up   — or stop a manual server yourself');
  }
  const pid = Number(fs.readFileSync(PIDFILE, 'utf8').trim());
  if (opts.dryRun) return emit(opts, () => ok(`would stop pid ${pid}`), { dryRun: true, pid });
  try { process.kill(pid, 'SIGTERM'); } catch (e) { /* already gone */ }
  fs.unlinkSync(PIDFILE);
  emit(opts, () => ok(`stopped pid ${pid}`), { ok: true, pid });
}

async function cmdHealth(opts) {
  const h = await httpJson(serverUrl(opts) + '/api/health');
  emit(opts, () => ok(JSON.stringify(h, null, 2)), h);
}

async function cmdState(opts) {
  const s = await httpJson(serverUrl(opts) + '/api/state');
  const summary = {
    source: s.source || null,
    agents: (s.agents || []).map((a) => ({ name: a.name, status: a.status, tokens: a.tokens || null })),
    agentCount: (s.agents || []).length,
    deliveries: (s.deliveries || []).length,
    metrics: s.metrics || null,
    lastEventId: s.lastEventId || null,
  };
  emit(opts,
    () => ok(`${summary.agentCount} agents · ${summary.deliveries} deliveries · source ${summary.source}\n` +
      summary.agents.map((a) => `  ${a.name}  ${a.status}`).join('\n')),
    summary);
}

async function cmdTask(opts) {
  const text = opts._.slice(1).join(' ') || opts.text;
  if (!text) fail('no task text given', 'node scripts/officectl.js task "summarize today\'s AI news" [--yes]');
  const url = serverUrl(opts) + '/api/task';
  const preview = `POST ${url}  {"text": ${JSON.stringify(text)}}`;
  if (opts.dryRun) return emit(opts, () => ok(`would send: ${preview}`), { dryRun: true, action: preview });
  if (!opts.yes) {
    fail(
      '`task` sends a real prompt to the office (live mode runs a real hermes session) and needs explicit confirmation',
      `add --yes to send it, or --dry-run to just print the request:  node scripts/officectl.js task ${JSON.stringify(text)} --yes`
    );
  }
  const r = await httpJson(url, { method: 'POST', body: { text } });
  emit(opts, () => ok(`sent: ${JSON.stringify(r)}`), r);
}

async function cmdBurst(opts) {
  const url = serverUrl(opts) + '/api/demo/burst';
  if (opts.dryRun) return emit(opts, () => ok(`would POST ${url}`), { dryRun: true, action: `POST ${url}` });
  const r = await httpJson(url, { method: 'POST', body: {} });
  if (r.ok === false) {
    fail(r.error || 'burst rejected', 'bursts only work in demo mode — restart with: node scripts/officectl.js up  (no --live)');
  }
  emit(opts, () => ok('burst sent'), r);
}

function cmdFeatures(opts) {
  if (!fs.existsSync(FEATURES_DIR)) {
    fail(`no feature map at ${FEATURES_DIR}`, 'the map ships with the repo — check the path or re-clone');
  }
  const files = fs.readdirSync(FEATURES_DIR).filter((f) => f.endsWith('.md') && f !== 'README.md').sort();
  const features = files.map((f) => {
    const body = fs.readFileSync(path.join(FEATURES_DIR, f), 'utf8');
    const id = (body.match(/^id:\s*(.+)$/m) || [, f.replace(/\.md$/, '')])[1].trim();
    const title = (body.match(/^#\s+(.+)$/m) || [, id])[1].trim();
    const reach = (body.match(/\*\*How to reach:\*\*\s*(.+)$/m) || [, ''])[1].trim();
    return { id, file: path.relative(ROOT, path.join(FEATURES_DIR, f)), title, reach };
  });
  emit(opts,
    () => ok(features.map((f) => `${f.id.padEnd(22)} ${f.title}`).join('\n') + `\n\nmap: ${path.relative(ROOT, FEATURES_DIR)}/README.md`),
    { count: features.length, map: path.relative(ROOT, path.join(FEATURES_DIR, 'README.md')), features });
}

// -------------------------------------------------------------- browser cmds

async function cmdOpen(opts) {
  if (opts.dryRun) {
    return emit(opts, () => ok(`would open ${serverUrl(opts)} in a ${opts.headed ? 'headed' : 'headless'} browser and clear first-run state`),
      { dryRun: true, action: `open ${serverUrl(opts)}` });
  }
  await withPage(opts, async (page) => {
    const st = await settle(page, { timeoutMs: Number(opts.timeout || 45) * 1000, force: !!opts.forceSettle });
    emit(opts,
      () => ok(`office open: theme=${st.state.theme} agents=${st.state.agents.length} settled=${st.settled} mode=${st.state.modeLabel}`),
      { ok: true, settled: st.settled, state: st.state });
  });
}

async function cmdStatus(opts) {
  await withPage(opts, async (page) => {
    // settle by default: a snapshot taken 1s after boot shows everyone
    // "walking to their desk", which is noise, not status (--no-settle opts out)
    if (!opts.noSettle) {
      await settle(page, { timeoutMs: Number(opts.timeout || 20) * 1000, force: !!opts.forceSettle });
    }
    const st = await page.evaluate(ENGINE_STATE);
    emit(opts,
      () => ok(`${st.agents.length} agents · theme=${st.theme} · renderer=${st.renderer} · art=${st.artContract} · zoom=${st.zoom} · mode=${st.modeLabel}\n` +
        st.agents.map((a) => `  ${a.name.padEnd(12)} ${String(a.status).padEnd(9)} desk=${a.atDesk ? 'yes' : 'no '} art=${a.art}`).join('\n') +
        (st.artProblems.length ? `\nART PROBLEMS: ${st.artProblems.join(', ')}` : '') +
        (st.duplicates.length ? `\nDUPLICATE NAMES: ${st.duplicates.join(', ')}` : '')),
      st);
  });
}

async function cmdThemes(opts) {
  await withPage(opts, async (page) => {
    const st = await page.evaluate(ENGINE_STATE);
    emit(opts, () => ok(st.deployedRooms.map((r) => `${r.active ? '*' : ' '} ${r.id.padEnd(10)} ${r.label}`).join('\n')), { active: st.theme, themes: st.deployedRooms });
  });
}

async function cmdTheme(opts) {
  const name = opts._[1];
  if (!name) fail('no theme name given', `pick one of: ${THEMES.join(', ')}  →  node scripts/officectl.js theme batman`);
  await withPage(opts, async (page) => {
    const exists = await page.evaluate((n) => !!document.querySelector(`.theme-btn[data-theme-name="${n}"]`), name);
    if (!exists) {
      const available = await page.evaluate(() => [...document.querySelectorAll('.theme-btn')].map((b) => b.dataset.themeName));
      fail(`theme "${name}" is not in the switcher`, `use one of: ${available.join(', ')}  (list them with: node scripts/officectl.js themes)`);
    }
    await page.evaluate((n) => document.querySelector(`.theme-btn[data-theme-name="${n}"]`).click(), name);
    const st = await settle(page, { timeoutMs: Number(opts.timeout || 45) * 1000, force: !!opts.forceSettle });
    emit(opts, () => ok(`theme=${st.state.theme} agents=${st.state.agents.length} settled=${st.settled} missing=${st.state.missingSprites.length || 0}`),
      { ok: st.settled, settled: st.settled, state: st.state });
  });
}

async function cmdSettle(opts) {
  await withPage(opts, async (page) => {
    const st = await settle(page, { timeoutMs: Number(opts.timeout || 45) * 1000, force: !!opts.forceSettle });
    emit(opts, () => ok(`settled=${st.settled} agents=${st.state.agents.length} seated=${st.state.agents.filter((a) => a.atDesk).length}`),
      { settled: st.settled, state: st.state });
  });
}

function outPath(opts, fallback) {
  const p = path.resolve(ROOT, opts.out || fallback);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  return p;
}

async function cmdShot(opts) {
  const dest = outPath(opts, `docs/screenshots/officectl-${new Date().toISOString().slice(0, 10)}.png`);
  if (opts.dryRun) return emit(opts, () => ok(`would write ${dest}`), { dryRun: true, out: dest });
  await withPage(opts, async (page) => {
    await settle(page, { timeoutMs: Number(opts.timeout || 45) * 1000, force: !!opts.forceSettle });
    if (opts.theme) {
      await page.evaluate((n) => {
        const b = document.querySelector(`.theme-btn[data-theme-name="${n}"]`);
        if (b) b.click();
      }, opts.theme);
      await settle(page, { timeoutMs: Number(opts.timeout || 45) * 1000, force: !!opts.forceSettle });
    }
    await page.screenshot({ path: dest });
    emit(opts, () => ok(`wrote ${path.relative(ROOT, dest)}`), { ok: true, out: dest });
  });
}

function findFfmpeg() {
  const candidates = ['/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg'];
  try {
    const base = path.join(os.homedir(), '.cache', 'ms-playwright');
    for (const d of fs.readdirSync(base)) {
      if (d.startsWith('ffmpeg')) candidates.push(path.join(base, d, 'ffmpeg-linux'));
    }
  } catch (e) { /* no playwright cache */ }
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      const r = spawnSync(c, ['-version'], { encoding: 'utf8' });
      if (r.status === 0) return c;
    }
  }
  fail('no ffmpeg binary found (needed to encode a gif)', 'apt-get install -y ffmpeg   — or take stills instead: node scripts/officectl.js shot --out docs/screenshots/x.png');
}

async function cmdGif(opts) {
  const frames = Number(opts.frames || 48);
  const dest = outPath(opts, `docs/demo-officectl.gif`);
  if (opts.dryRun) {
    return emit(opts, () => ok(`would capture ${frames} frames and encode ${path.relative(ROOT, dest)}`), { dryRun: true, out: dest, frames });
  }
  const ffmpeg = findFfmpeg();
  await withPage(opts, async (page) => {
    await settle(page, { timeoutMs: Number(opts.timeout || 45) * 1000, force: !!opts.forceSettle });
    if (opts.theme) {
      await page.evaluate((n) => {
        const b = document.querySelector(`.theme-btn[data-theme-name="${n}"]`);
        if (b) b.click();
      }, opts.theme);
      await settle(page, { timeoutMs: Number(opts.timeout || 45) * 1000, force: !!opts.forceSettle });
    }
    const dir = path.join(RUNDIR, 'gif-frames');
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    for (let i = 0; i < frames; i++) {
      await page.screenshot({ path: path.join(dir, `f${String(i).padStart(3, '0')}.png`) });
      await sleep(125);
    }
  });
  const r = spawnSync(ffmpeg, [
    '-y', '-framerate', '8', '-i', path.join(RUNDIR, 'gif-frames', 'f%03d.png'),
    '-vf', 'scale=960:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse',
    dest,
  ], { encoding: 'utf8' });
  if (r.status !== 0) fail(`ffmpeg failed: ${(r.stderr || '').split('\n').slice(-3).join(' ')}`, 'retry with fewer frames (--frames 24), or use `shot` for a still');
  const size = fs.statSync(dest).size;
  emit(opts, () => ok(`wrote ${path.relative(ROOT, dest)} (${(size / 1024).toFixed(0)} KB, ${frames} frames)`), { ok: true, out: dest, frames, bytes: size });
}

/**
 * verify — the loop-closer. Sweeps every theme and asserts, per room:
 * agents present, cast matches the room's cast, every sprite loaded, everyone
 * seated at a desk, zoom sane. Exit 0 = verified, 1 = regressions found.
 */
async function cmdVerify(opts) {
  const casts = themeCasts();
  const timeoutMs = Number(opts.timeout || 40) * 1000;
  const shots = !!opts.shots;
  const roomIds = opts.rooms ? String(opts.rooms).split(',') : (Object.keys(casts).length ? Object.keys(casts) : THEMES);
  const report = { ok: true, checkedAt: new Date().toISOString(), casts: Object.keys(casts).length, rooms: [] };

  if (opts.dryRun) {
    return emit(opts, () => ok(`would verify ${roomIds.length} rooms: ${roomIds.join(', ')}\nassertions: agents >= 6 · unique names · cast match · agent art present · all seated · zoom in [0.6,2.2]`),
      { dryRun: true, action: 'verify', rooms: roomIds });
  }

  await withPage(opts, async (page) => {
    const builtin = await page.evaluate(() => [...document.querySelectorAll('.theme-btn')].map((b) => b.dataset.themeName));
    for (const room of roomIds) {
      const entry = { room, checks: {}, failures: [] };
      if (!builtin.includes(room)) {
        entry.failures.push(`switcher has no "${room}" button (has: ${builtin.join(', ')})`);
        report.rooms.push(entry);
        continue;
      }
      await page.evaluate((n) => document.querySelector(`.theme-btn[data-theme-name="${n}"]`).click(), room);
      const settledRes = await settle(page, { timeoutMs, force: !!opts.forceSettle });
      let st = settledRes.state;
      st.settled = settledRes.settled;
      if (opts.forceSettle && st.agents.some((a) => !a.atDesk)) {
        st = (await settle(page, { timeoutMs, force: true })).state;
      }
      const expected = casts[room] || null;
      entry.warnings = [];
      entry.checks.agentCount = st.agents.length;
      entry.checks.seated = st.agents.filter((a) => a.atDesk).length;
      entry.checks.busy = st.agents.filter((a) => !a.atDesk && !a.leaving).length;
      entry.checks.art = `${st.agents.filter((a) => a.art === 'img' || a.art === 'palette').length}/${st.agents.length} (${st.artContract})`;
      entry.checks.theme = st.theme;
      entry.checks.renderer = st.renderer;
      entry.checks.zoom = st.zoom;
      // population: an empty office is a hard failure (the feed is dead); a
      // quiet moment in a live office is a warning, never a flake
      if (st.agents.length === 0) entry.failures.push('the office is empty — no agent events are arriving (check /api/health and the feed)');
      else if (st.agents.length < 6) entry.warnings.push(`only ${st.agents.length} agents in the office right now (the demo feed refills; not a failure)`);
      if (st.artProblems.length) entry.failures.push(`agent art missing: ${st.artProblems.join(', ')}`);
      if (st.artUnchecked) {
        entry.failures.push(`renderer "${st.renderer}" exposes neither a sprite registry nor paletteNames — agent art cannot be verified (add one; see references/features/qa-hooks.md)`);
      }
      if (st.duplicates.length) {
        entry.failures.push(`duplicate agent names: ${st.duplicates.join(', ')} (the office is a cast — two agents may never share a name)`);
      }
      // seating: only agents that are neither walking nor leaving must be at a
      // desk. A busy office is normal; an agent frozen away from its desk is not.
      const stuck = st.agents.filter((a) => !a.atDesk && !a.moving && !a.leaving && (a.status === 'entering' || a.status === 'idle'));
      if (stuck.length) {
        entry.failures.push(`stuck away from a desk: ${stuck.map((a) => `${a.name} (${a.status})`).join(', ')}`);
      }
      if (st.settled === false) entry.warnings.push('the office was still busy at the end of the settle budget — verified the resting state it reached');
      if (st.theme !== room) entry.failures.push(`active theme is "${st.theme}", expected "${room}"`);
      if (!(st.zoom >= 0.6 && st.zoom <= 2.2)) entry.failures.push(`zoom ${st.zoom} out of range`);
      if (expected) {
        const strangers = st.agents.map((a) => a.name).filter((n) => !expected.includes(n));
        entry.checks.cast = `${st.agents.length - strangers.length}/${expected.length}`;
        if (strangers.length) entry.failures.push(`cast mismatch — not in ${room}: ${strangers.join(', ')}`);
      } else {
        entry.failures.push(`no cast known for "${room}" (web/app.js agentNames not parsed)`);
      }
      if (shots) {
        const p = outPath(opts, `docs/screenshots/${room}.png`);
        await page.screenshot({ path: p });
        entry.screenshot = path.relative(ROOT, p);
      }
      if (entry.failures.length) report.ok = false;
      if (entry.warnings.length) report.warnings = (report.warnings || 0) + entry.warnings.length;
      report.rooms.push(entry);
      if (!opts.json) {
        ok(`${entry.failures.length ? 'FAIL' : 'ok  '} ${room.padEnd(10)} agents=${entry.checks.agentCount} seated=${entry.checks.seated} busy=${entry.checks.busy} art=${entry.checks.art} renderer=${entry.checks.renderer}` +
          (entry.failures.length ? '\n     FAIL ' + entry.failures.join('\n     FAIL ') : '') +
          (entry.warnings.length ? '\n     note ' + entry.warnings.join('\n     note ') : ''));
      }
    }
  });

  if (opts.json) process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  else ok(report.ok ? `\nverified: ${report.rooms.length}/${report.rooms.length} rooms ok` : `\nFAILED: ${report.rooms.filter((r) => r.failures.length).length} of ${report.rooms.length} rooms regressed`);
  process.exit(report.ok ? 0 : 1);
}

// --------------------------------------------------------------------- help

const HELP = `officectl — control + verify Hermes Agent Office

  node scripts/officectl.js <command> [args] [options]

server (no browser needed)
  up [--port 8741] [--live --db PATH]   start the office, wait for health
  down                                  stop the server started by up
  health                                GET /api/health (version, source, mode)
  state                                 GET /api/state (agents, deliveries, metrics)
  task "<text>" --yes                   POST /api/task (runs a real session in live mode)
  burst                                 POST /api/demo/burst (demo mode only)
  features                              list the feature map (references/features/)

browser (needs Playwright; drives window.__eng)
  open                                  boot the app, clear first-run overlays, settle
  status                                agent/roster/sprite state as JSON
  themes                                rooms in the switcher, with the active one
  theme <name>                          switch room and wait until everyone is seated
  settle                                wait until every agent is at a desk
  shot --out FILE [--theme NAME]        screenshot
  gif  --out FILE [--frames 48]         animated demo gif (needs ffmpeg)
  verify [--rooms a,b] [--shots]        sweep every room and assert; exit 1 on regression
                                        (asserts >=6 agents, unique names, cast match,
                                         agent art present, everyone seated, zoom in range)

options
  --url URL        office base url (default http://127.0.0.1:8741)
  --json           machine-readable output
  --dry-run        print the action instead of doing it (no side effects)
  --timeout SECS   settle/start budget (default 40-45)
  --headed         show the browser
  --force-settle   nudge agents onto their desks (use when a race is suspected)
  --no-settle      status only: snapshot immediately instead of waiting to settle
  --help           this text

exit codes: 0 ok · 1 verify found a regression · 2 usage/precondition error
`;

// --------------------------------------------------------------------- main

(async () => {
  const opts = parseArgs(process.argv.slice(2));
  const cmd = opts._[0];
  if (!cmd || cmd === 'help' || opts.help) return ok(HELP);
  const table = {
    up: cmdUp, down: cmdDown, health: cmdHealth, state: cmdState, task: cmdTask,
    burst: cmdBurst, features: cmdFeatures, open: cmdOpen, status: cmdStatus,
    themes: cmdThemes, theme: cmdTheme, settle: cmdSettle, shot: cmdShot,
    gif: cmdGif, verify: cmdVerify,
  };
  const fn = table[cmd];
  if (!fn) fail(`unknown command "${cmd}"`, `node scripts/officectl.js help   (commands: ${Object.keys(table).join(', ')})`);
  try {
    await fn(opts);
  } catch (e) {
    const msg = (e && e.message) || String(e);
    if (/ECONNREFUSED/.test(msg)) {
      fail(`nothing is answering at ${serverUrl(opts)}`, 'start the office first: node scripts/officectl.js up');
    }
    fail(msg, 're-run with --help to see the command shape; server-side commands need no browser');
  }
})();