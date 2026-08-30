# Design Brief — GROKSTREET: the 12-agent research floor

> Reference: @adiix_official, "I Run a Twelve-Agent Research Desk on Grok Bot. It Works a Full Session Without Me." (X Article, 2026-08-29). Top performer of the Coin Bureau "8 builds to try this weekend" thread (104 likes / 30 reposts at retrieval). Full text archived at `/tmp/grokbot_thread/art_8_adiix_official.md` during the 2026-08-30 teardown.

## Why this brief exists

North star is GrokBot Office v2 (@jon). GROKSTREET is the strongest public example of the office-as-interface idea: an animated agent floor that IS the dashboard. Every number on screen traces to a real event. "The office is the interface. The feed is the event bus. The money only moves when someone is sitting at their desk."

## The interface laws (from the build, keep these verbatim in spirit)

1. **The office is the interface, the feed is the event bus.** The right-hand column is a renderer over the bus (MARKET_TRADE, AGENT_TASK_COMPLETED, POSITION_OPENED, RESEARCH_SEALED), not a log written by hand.
2. **No widget invents its own data.** One engine produces the core stream; every panel derives from it. Click a subject anywhere (tape, watchlist, blotter, news row) and all panels switch together. One active subject. One truth.
3. **Money appears where it was made.** +$0.87 pops over the robot who earned it, at the desk where the work happened.
4. **An agent earns only while seated at its monitors.** Walking to the copier pays nothing. This is a hard branch in the code, not decoration: the money column and the picture never disagree.
5. **Nobody walks through furniture.** Every desk, cabinet, sofa and glass wall is a rectangle in an obstacle grid. Paths come from breadth-first search on a 24-pixel lattice, smoothed by line-of-sight so agents cut corners like people, not like Pac-Man.
6. **Each agent works its own floor.** No lifts, no commuting. Shifts start at the door: an agent walks in at clock-in time and walks out at the end.
7. **The header is the honest scoreboard.** Tasks completed, findings verified, filings diffed, value earned, hit rate. "Nobody asked me anything to produce that. I opened the tab."
8. **The LIVE dot is computed, not painted.** Computed from the age of the last engine event; if data went stale it would say DELAYED 14s. It never decorates.
9. **One deliberate loud moment per win.** Every $100 cleared, the screen stops for four seconds with the number and the top earner. The only loud moment in an otherwise deliberately quiet interface, and the moment everyone screenshots.

## The floor layout

- **The Pit (research)**: 12 desks, four occupied by intake seats (Kimmie, Pinocchio, Donnie, Ming). Room to grow.
- **The Mic (judgment)**: executive desk for the single-page compile, glass boardroom for the bear case, archive wall.
- **Back Office (ops)**: vault, server rack, green filing cabinets. Night-shift seat is empty in daylight.

## The seat pattern (each agent = a capability + a documented discipline + a charter)

- Name it a job. The charter says where it stops, and the stop line is respected by the model ("where you stop" behavior).
- **Belfort — Chief of Staff**: reads every other seat's checkpoint before writing anything; allocates and triages, never has an opinion; when two seats disagree he presents both sides in two lines each and refuses to pick. Stops at: never trades, never sizes, never speaks for the owner.
- **Pinocchio — Verification**: every numeric claim passes through him; three outcomes only: VERIFIED with a page number, WRONG with the true number, or KILLED. "Unverifiable" is a kill, not a pass. Highest earner, because killing a bad number is worth more than producing a good one.
- **Denham — Auditor**: independent browser session, re-derives everything from primary sources without seeing anyone else's work; default verdict on every thesis is CONTRADICTED, evidence has to drag it to SUPPORTED; audits the other seats weekly for charter violations.
- **Kimmie — Filings**: a taught routine (walked through one EDGAR sweep; runs at 06:30, 13:00, 16:15 since); diffs filings, reports numbers never adjectives ("gross margin 61.2% vs 64.8% QoQ").
- **Donnie — Chatter**: read-only browser on platforms with no clean API; counts mentions, flags 3-sigma outliers vs 30-day baseline; reports that people are saying it, never that it is true.
- **Saurel — Night shift**: exists only because agents are always-on; hands the mic one page at 06:00 and goes quiet; never wakes the owner for anything reversible.
- **Brad — Operations**: 05:45 health line: "12/12 seats up, 47/47 routines fired." When something breaks he names it and the minute it broke. Never re-authenticates anything himself; a session dies, the owner signs in.

## Shared configuration truths (from the same teardown, useful for the office product's "live mode")

- **Read-only sessions are the single most important configuration choice**: the risk/money seat gets a read-only broker session; the order button belongs to the human because the shared machine is "a real blast radius" (vendor's own words).
- **The bot gets a session, never a secret.** Credentials never enter the chat; the owner takes the keyboard for the one blocked step (password, 2FA, CAPTCHA, payment, human-required site) and hands it back.
- **Approvals stop an action; they do not reverse work already completed.** No full audit log yet; isolation is the boundary.
- **Persist everything under /workspace** (bin, config, skills, state): the computer rebuilds itself on update and home becomes a cache. The roster is only as permanent as the folder it lives in.

## Mapping to hermes-agent-office

Already present (office.md brief): roster panel with status lines, agent modal with activity plan, delivery toasts, 3 themes.
Next candidates from GROKSTREET:
1. Event-feed right column rendered from a real bus (agent task completed, delivery, theme change), with a computed LIVE/age dot instead of a painted status.
2. Points/value popover above the agent who earned it (map to deliveries/actions already counted in live mode against state.db).
3. Obstacle-aware desk-grid movement (BFS + line-of-sight smoothing) in the iso theme.
4. Quiet default + one loud moment per win (the delivery toast is the candidate; keep it the only one).
5. Seat roster as charters: name, job, stop line visible in the agent modal ("what it owns / good output / where it stops").
