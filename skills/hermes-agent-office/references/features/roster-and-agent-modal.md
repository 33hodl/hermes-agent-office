---
id: roster
feature: roster panel + agent detail modal
---
# Feature: Roster & agent detail modal

**Description:** `#roster` lists live agents with status; clicking one opens
`#agent-modal` with that agent's task, activity, recent tool calls, token
counts and delivery log.

**How to reach:** the roster is always in the right panel; click any row (or an
agent on the stage) → `#agent-modal`; close with `.modal-close` or the
backdrop.

**Key UI elements:** `#roster`, `#roster-count`, `#roster-list`,
`#roster-empty`; modal: `#agent-modal`, `#am-name`, `#am-status`, `#am-now`,
`#am-task`, `#am-steps`, `#am-tools`, `#am-log`, `#am-tin`, `#am-tout`,
`#am-meta`, `#am-avatar`.

**Behaviour:** rows show short status text and update on every event; the modal
is populated from `store` (recent deliveries filtered per agent, last ≤ 12 tool
calls). Agent avatars in the modal come from the same sprite key as the stage.

**How to verify:** `officectl status --json` covers roster contents
programmatically (`agents[]`); use `--headed` + `shot` when the *rendering* of
the panel is what changed.

**Related features:** agent-lifecycle, mailbox, qa-hooks.
