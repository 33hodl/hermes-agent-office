# Design Brief — Theme 1: "Office" (the viral reference)

> Reference: @davidfromkansas — 17s video, 2.3K likes. A visual wrapper around ChatGPT Desktop showing Codex agents working in a virtual office.

## Look & feel
- **Isometric 3D low-poly / minimalist diorama** — toy-like, cozy, diorama aesthetic (Animal Crossing / indie sim vibes). NOT pixel art, NOT flat vector — soft rounded geometry, gentle diffused shadows.
- **Perspective**: fixed isometric (2:1 diamond grid), camera never moves.

## Palette (from video frames)
- Floor: warm sand/beige `#e8dcc3`-ish
- Walls/baseboards: sage green `#9db29a`, pale olive
- Furniture: natural wood browns `#b98a5e` / `#8a6642`, black rolling chairs
- Monitors: light-blue screens `#a8c8e8`
- Accents: terracotta plant pots `#c96f4a`, pastel pink rug `#eec9d8`, green rug `#b8d8b0`
- Characters: pastels — peach, pink, teal, green, yellow, purple; some cat ears, some hoods; dark legs
- UI chrome: cream/white cards, rounded corners, soft shadows, pink accent for mail

## Layout (reference arrangement)
1. Elevator/entrance (right side, green mat)
2. Desk clusters (3 rows of desks w/ monitors + black chairs)
3. Meeting table on circular pink rug (center)
4. Lounge: green rug + sofa + coffee table + plant (top-left)
5. Library/bookshelf wall + reading nook (top-right)
6. Scattered potted plants, framed art, whiteboard

## UI elements (must replicate the *concept*)
- Left panel: agent roster — "HERMES AGENTS", N ACTIVE, each agent with status line ("Waiting at desk for your next prompt")
- Right panel: metrics — AGENTS WORKING n/m, INPUT/OUTPUT tokens
- Bottom-right: mail widget — "Office Mail", unread badge, toast on new message
- Agent modal: avatar, name, status pill ("Thinking through the next step", "At workstation 13"), token counters, activity plan (Understand → Plan → Gather context → Execute → Deliver) with step checkmarks, loadout (skills/tools), personality
- Delivery notifications: agent avatar chip + name + DELIVERED badge + timestamp + content excerpt

## Characters
- Bean/pill-shaped, rounded, standing upright; walk with bob; sit at desks; huddle for collaboration; idle animations (stretch, look around)
- Palette-assigned per agent; name tags above heads on hover

## Animations
- Walk along iso grid between stations; status bubble above head; thought bubble while thinking; delivery = agent walks to mailbox, throws in envelope, mailbox glows, toast fires.
