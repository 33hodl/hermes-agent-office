# Integrating with Hermes Agent

Hermes Agent Office is a **standalone, local-first companion** — it never
writes to Hermes, needs no credentials, and installs next to any Hermes
setup. This document describes how it plugs in today, and the cleanest way
for it to become a first-class add-on.

## Today: read the session store

Hermes persists every session and message in a SQLite store
(`~/.hermes/state.db`). The office opens it **read-only** (`mode=ro`,
`PRAGMA query_only`) and polls for new rows — safe against a running Hermes
(WAL and rollback journal both allow concurrent readers), zero writes, zero
locks taken.

Mapping used (`office/hermes_db.py`):

| Hermes table | Office concept |
|---|---|
| `sessions` (source, display_name, model, title, end_reason) | agents, roles, names |
| `messages` (role, content, tool_calls, tool_name, timestamp) | status, tool calls, deliveries |

That same adapter is tested against the real schema in
`tests/test_hermes_db.py`.

## Tomorrow: a first-class event hook

The office consumes **one normalized event shape**
(`office/events.py` — `agent_enter`, `thinking`, `tool_call`, `status`,
`delivery`, `idle`). The adapter is a single class with a tiny interface:
`events_after(since_id)` + `health()`. Anything can feed it.

The cleanest upstream integration is a **gateway event hook** (or a
`hermes` plugin) that emits these events as they happen instead of polling
the DB — the office then renders with zero latency and no filesystem
coupling. The event schema is deliberately small so this is a ~50-line
adapter.

## Desktop app

`desktop/plugin.js` registers the office as a Hermes Desktop pane (iframe to
the local server). Install: copy the `desktop/` folder to
`<hermes home>/desktop-plugins/hermes-office/`, run the office server, then
**Reload desktop plugins** from the command palette.

## Contribution notes (for the hermes-agent repo)

Per the hermes-agent contribution rubric, third-party add-ons ship as
**standalone repos** and are promoted via the Nous Research Discord
(`#plugins-skills-and-skins`) rather than landing inside the core tree.
This repo is exactly that shape: no changes to hermes-agent core, no new
env vars, no telemetry, no prompt-cache impact. If the maintainers want it
more visible, a docs link or a `hermes skills`/plugins catalog entry would
be the natural next step — the adapter and event schema are the seams it
would hang off.
