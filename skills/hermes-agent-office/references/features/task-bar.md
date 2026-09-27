---
id: task-bar
feature: assign a task from the top bar
---
# Feature: Task bar

**Description:** Type a task in the top bar and send it to the office. In demo
mode it runs a simulated agent; in live mode the server spawns a real
`hermes chat -q` session whose events flow back into the office.

**How to reach:** `#task-input` + `#task-send` (or Enter), or
`POST /api/task {"text": "..."}`.

**Key UI elements:** `#task-input`, `#task-send`.

**Behaviour:** `runTask()` posts to `/api/task`, clears the input, and toasts.
The agent that picks the task appears in the roster with status `working`, then
goes `idle` after the delivery.

**Agent-side rule:** this is the one command with real-world side effects in
live mode — `officectl task "<text>"` refuses without `--yes` and supports
`--dry-run` to print the exact request.

**How to verify:** `officectl task "say hi in the log" --yes`, then
`officectl state` → a new agent appears; `officectl status` → it reaches a desk.

**Related features:** agent-lifecycle, metrics-and-signals, live mode.
