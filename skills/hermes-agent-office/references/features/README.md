# Feature Map — Hermes Agent Office

*Materialized memory for agents driving the office. Adopted 2026-09-27 from
@poteto's pstack Part 1 ("verification is all you need": a searchable map of
every feature — what it does, how to reach it, key elements, related features —
so an agent spends context on the task, not on re-deriving the page).*

The code is the source of truth; this map is its compact, token-cheap
projection. It is **not** a substitute for reading `web/app.js` when you change
behaviour — it is what you read first so you know *where* to look and *how* to
drive.

## What the app is
A live virtual office for Hermes agents. The Python server (`office/server.py`)
reads a Hermes `state.db` **read-only** (live mode) or synthesises a feed (demo
mode) and serves a canvas office at `http://127.0.0.1:8741`. Agents enter, walk
to a desk, work, deliver, and idle.

## How to reach it (as a user)
1. `python3 -m office.server --demo` (or `--db ~/.hermes/state.db` for real
   agents, `--visit URL` to watch a remote office, `--port` to move it).
2. Open `http://127.0.0.1:8741`.
3. First run shows a welcome card and a guided tour — both dismissable and
   remembered in `localStorage`.

## How to reach it (as an agent) — the lever
Drive the app with the control CLI instead of writing a new throwaway script:

```bash
node scripts/officectl.js up                 # start + wait for health
node scripts/officectl.js verify --shots     # sweep every room, assert, exit 1 on regression
node scripts/officectl.js status --json      # agents, desks, sprites, theme
node scripts/officectl.js theme batman       # switch room and settle
node scripts/officectl.js shot --out docs/screenshots/x.png
```

Every command takes `--json`, `--dry-run` (on anything with a side effect), and
prints a `fix:` line on error. See `qa-hooks.md` for the contract the CLI
depends on.

## Features
| id | feature | file |
| --- | --- | --- |
| welcome-and-tour | first-run welcome card + guided tour | `welcome-and-tour.md` |
| theme-switcher | rooms: office, nous, dunder, batman, starwars, custom | `theme-switcher.md` |
| agent-lifecycle | enter → think → tool calls → delivery → idle → leave | `agent-lifecycle.md` |
| roster | the live agent list + agent detail modal | `roster-and-agent-modal.md` |
| task-bar | type a task, the office runs it | `task-bar.md` |
| mailbox | deliveries, read/copy finished work | `mailbox-deliveries.md` |
| metrics-and-signals | counter row, LIVE dot, source badge, mode note | `metrics-and-mode-signals.md` |
| zoom | camera zoom controls (0.6x–2.2x) | `zoom-controls.md` |
| custom-office-creator | "✨ Create an office" — AI-painted themed offices | `custom-office-creator.md` |
| remote-visit-and-desktop-plugin | watch another office; dock as a desktop pane | `remote-visit-and-desktop-plugin.md` |
| qa-hooks | `window.__eng` / `window.__activeTheme`, sprite keys, CLI contract | `qa-hooks.md` |

## Invariants worth asserting (see `verify`)
- every room shows ≥ 6 agents, all seated (`moving === false`, at `home`),
  every sprite loaded (`sprite === 'img'`), active theme matches the switch,
  zoom within 0.6–2.2 (the office theme reserves the first desk; Batman has 8
  desks under a 8-name cast; Star Wars renders through the voxel renderer).
- `web/app.js` `agentNames` is the cast per room — `verify` parses it, so a
  changed cast changes the assertions automatically.
