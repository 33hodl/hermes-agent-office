---
id: mailbox
feature: mailbox — finished work
---
# Feature: Mailbox (deliveries)

**Description:** Every `delivery` event lands in the mailbox: the finished work
an agent produced, readable in-app and copyable to the clipboard.

**How to reach:** `#mailbox-btn` in the top bar (badge = unread count) →
`#mail-modal`; items can be marked read via `POST /api/deliveries/read`.

**Key UI elements:** `#mailbox-btn`, `#mailbox-count`, `#mail-modal`,
`#mail-list`, `#mail-empty`.

**Behaviour:** deliveries are stored server-side (`store.deliveries`) and
rendered newest-first with agent name, title and body; `⧉ Copy` copies the text.
Unread count drives the button badge; opening the mailbox marks items read.

**How to verify:** `officectl state --json` → `deliveries` count and the newest
titles; the toast + badge are visual only.

**Related features:** agent-lifecycle (`delivery`), roster-and-agent-modal.
