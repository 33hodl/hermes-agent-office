/* Hermes Agent Office — customization framework.
 *
 * Users can create their own offices: pick a franchise (Batman, Star Wars,
 * Studio Ghibli, ...), let us generate a painted backdrop, get themed agent
 * names and stations, tune colors/effects, save + export + import.
 *
 * A custom theme reuses the isometric renderer (same world) but with its own
 * backdrop image, palette, names, stations and FX flags.
 */
'use strict';

/* ------------------------------------------------------------------ *
 * Franchise presets — names, stations, palette hints, backdrop prompt *
 * ------------------------------------------------------------------ */
const FRANCHISES = {
  batman: {
    label: 'Batman',
    emoji: '🦇',
    prompt: 'Gothic noir Gotham City skyscraper rooftop at night, dramatic moonlight, bat-signal glow in the clouds, art-deco gargoyles, rain-slicked rooftops, moody purple and teal rim lighting, cinematic comic-book background art, no people, no text',
    names: ['Batman', 'Robin', 'Catwoman', 'Joker', 'Bane', 'Nightwing', 'Batgirl', 'Alfred', 'Riddler', 'Harley Quinn'],
    stations: [
      { id: 'entrance', label: 'Batcave Lift', type: 'entrance', x: 9, y: 1 },
      { id: 'desk-a', label: 'Wayne Tech Lab', type: 'desks', x: 2.5, y: 2.5 },
      { id: 'desk-b', label: 'Forensics Bench', type: 'desks', x: 6.5, y: 2.5 },
      { id: 'meeting', label: 'Justice League Table', type: 'meeting', x: 4.5, y: 5.5 },
      { id: 'lounge', label: 'Rooftop Perch', type: 'lounge', x: 1.5, y: 7.5 },
      { id: 'tools', label: 'The Armory', type: 'tools', x: 8.5, y: 5.5 },
      { id: 'mail', label: 'Batmail Drop', type: 'mail', x: 9, y: 8.5 },
      { id: 'library', label: 'Arkham Archive', type: 'library', x: 0.8, y: 2.5 },
    ],
    palette: { floor: ['#181822', '#1c1c28'], accent: '#8b5cf6', grid: 'rgba(139,92,246,0.30)',
               wall: ['#101018', '#14141f', '#1e1e2c'], wood: '#23232f', woodDark: '#181822', woodTop: '#2a2a38',
               monitor: '#05050a', screen: '#8b5cf6', chair: '#15151f', pot: '#1a1a28', plant: '#7c6bd6',
               mail: '#8b5cf6', mailDark: '#6d3fd0', rug: 'rgba(139,92,246,0.16)' },
    fx: { dark: true, trails: false, scanlines: false, glow: true },
  },
  starwars: {
    label: 'Star Wars',
    emoji: '🚀',
    prompt: 'Star Wars style interior of a starship hangar bay on a space station, tall metal walls with glowing panels, droids and cargo crates, holographic tables, warm accent lights against cool metal, cinematic concept art, no people, no text',
    names: ['Luke', 'Leia', 'Han', 'Chewbacca', 'R2-D2', 'C-3PO', 'Obi-Wan', 'Darth Vader', 'Yoda', 'Lando'],
    stations: [
      { id: 'entrance', label: 'Air Lock', type: 'entrance', x: 9, y: 1 },
      { id: 'desk-a', label: 'Cockpit Row', type: 'desks', x: 2.5, y: 2.5 },
      { id: 'desk-b', label: 'Nav Station', type: 'desks', x: 6.5, y: 2.5 },
      { id: 'meeting', label: 'Holotable', type: 'meeting', x: 4.5, y: 5.5 },
      { id: 'lounge', label: 'Cantina Corner', type: 'lounge', x: 1.5, y: 7.5 },
      { id: 'tools', label: 'Droid Bay', type: 'tools', x: 8.5, y: 5.5 },
      { id: 'mail', label: 'Transmission', type: 'mail', x: 9, y: 8.5 },
      { id: 'library', label: 'Jedi Archive', type: 'library', x: 0.8, y: 2.5 },
    ],
    palette: { floor: ['#23252b', '#26282f'], accent: '#e8b84b', grid: 'rgba(232,184,75,0.25)',
               wall: ['#1b1d24', '#20222a', '#2a2d38'], wood: '#2e2f36', woodDark: '#222329', woodTop: '#383a44',
               monitor: '#0a0a10', screen: '#7fd7e8', chair: '#191b21', pot: '#3a3f4a', plant: '#7fd7e8',
               mail: '#e8b84b', mailDark: '#b88f2e', rug: 'rgba(127,215,232,0.14)' },
    fx: { dark: true, trails: false, scanlines: false, glow: true },
  },
  ghibli: {
    label: 'Studio Ghibli',
    emoji: '🌿',
    prompt: 'Studio Ghibli style cozy countryside workshop interior, warm sunlight through large windows, wooden furniture, plants and hanging dried herbs, whimsical hand-painted background art, soft pastel colors, peaceful atmosphere, no people, no text',
    names: ['Totoro', 'Chihiro', 'Haku', 'Kiki', 'Ponyo', 'Howl', 'Calcifer', 'Mononoke', 'No-Face', 'Jiji'],
    stations: [
      { id: 'entrance', label: 'Garden Door', type: 'entrance', x: 9, y: 1 },
      { id: 'desk-a', label: 'Herb Tables', type: 'desks', x: 2.5, y: 2.5 },
      { id: 'desk-b', label: 'Spell Books', type: 'desks', x: 6.5, y: 2.5 },
      { id: 'meeting', label: 'Tea Circle', type: 'meeting', x: 4.5, y: 5.5 },
      { id: 'lounge', label: 'Window Nook', type: 'lounge', x: 1.5, y: 7.5 },
      { id: 'tools', label: 'Kitchen Hearth', type: 'tools', x: 8.5, y: 5.5 },
      { id: 'mail', label: 'Postbox', type: 'mail', x: 9, y: 8.5 },
      { id: 'library', label: 'Library Tower', type: 'library', x: 0.8, y: 2.5 },
    ],
    palette: { floor: ['#e3d5b0', '#ddcca4'], accent: '#6f9d5e', grid: 'rgba(111,157,94,0.20)',
               wall: ['#cbb98f', '#c4b088', '#a8946e'], wood: '#a3764a', woodDark: '#7c5a36', woodTop: '#b98a55',
               monitor: '#3d4a5c', screen: '#a8cce8', chair: '#5a4632', pot: '#c96f4a', plant: '#6f9d5e',
               mail: '#6f9d5e', mailDark: '#4f7a44', rug: 'rgba(111,157,94,0.20)' },
    fx: { dark: false, trails: false, scanlines: false, glow: false },
  },
  spiderman: {
    label: 'Spider-Man',
    emoji: '🕸️',
    prompt: 'Bright comic-book style New York City rooftop at sunset, distant skyline, red and blue web patterns, dynamic comic art with halftone dots, vibrant colors, no people, no text',
    names: ['Peter', 'Miles', 'Gwen', 'Aunt May', 'MJ', 'Ned', 'Venom', 'Doc Ock', 'Green Goblin', 'Kingpin'],
    stations: [
      { id: 'entrance', label: 'Fire Escape', type: 'entrance', x: 9, y: 1 },
      { id: 'desk-a', label: 'Lab Bench', type: 'desks', x: 2.5, y: 2.5 },
      { id: 'desk-b', label: 'Darkroom', type: 'desks', x: 6.5, y: 2.5 },
      { id: 'meeting', label: 'Daily Bugle Table', type: 'meeting', x: 4.5, y: 5.5 },
      { id: 'lounge', label: 'Rooftop Edge', type: 'lounge', x: 1.5, y: 7.5 },
      { id: 'tools', label: 'Web Lab', type: 'tools', x: 8.5, y: 5.5 },
      { id: 'mail', label: 'Peter Mailbox', type: 'mail', x: 9, y: 8.5 },
      { id: 'library', label: 'Comic Stacks', type: 'library', x: 0.8, y: 2.5 },
    ],
    palette: { floor: ['#e8dcc3', '#e1d3b6'], accent: '#c0392b', grid: 'rgba(192,57,43,0.16)',
               wall: ['#a9b8a0', '#9db29a', '#8fa08a'], wood: '#b98a5e', woodDark: '#8a6642', woodTop: '#c99a6d',
               monitor: '#3d4a5c', screen: '#a8cce8', chair: '#3a3a3a', pot: '#c96f4a', plant: '#6f9d5e',
               mail: '#c0392b', mailDark: '#8e2a1e', rug: 'rgba(192,57,43,0.12)' },
    fx: { dark: false, trails: false, scanlines: false, glow: false },
  },
  avatar: {
    label: 'Avatar',
    emoji: '🌊',
    prompt: 'Pandora style floating mountains at dusk, bioluminescent alien plants glowing blue and teal, waterfalls, lush alien rainforest, ethereal cinematic background art, no people, no text',
    names: ['Jake', 'Neytiri', 'Kiri', 'Loak', 'Tuk', 'Neteyam', 'Mo\'at', 'Tsu\'tey', 'Quaritch', 'Norm'],
    stations: [
      { id: 'entrance', label: 'Tree Gate', type: 'entrance', x: 9, y: 1 },
      { id: 'desk-a', label: 'Research Pod', type: 'desks', x: 2.5, y: 2.5 },
      { id: 'desk-b', label: 'Link Room', type: 'desks', x: 6.5, y: 2.5 },
      { id: 'meeting', label: 'Spirit Circle', type: 'meeting', x: 4.5, y: 5.5 },
      { id: 'lounge', label: 'Hometree Nook', type: 'lounge', x: 1.5, y: 7.5 },
      { id: 'tools', label: 'Avatar Lab', type: 'tools', x: 8.5, y: 5.5 },
      { id: 'mail', label: 'Seed Drop', type: 'mail', x: 9, y: 8.5 },
      { id: 'library', label: 'Memory Grove', type: 'library', x: 0.8, y: 2.5 },
    ],
    palette: { floor: ['#1a2e28', '#1d332c'], accent: '#4fc3b2', grid: 'rgba(79,195,178,0.25)',
               wall: ['#14241f', '#182a24', '#22362e'], wood: '#243a30', woodDark: '#182920', woodTop: '#2c4538',
               monitor: '#0a1410', screen: '#7fe0d0', chair: '#16261f', pot: '#2c4538', plant: '#4fc3b2',
               mail: '#4fc3b2', mailDark: '#2f9488', rug: 'rgba(79,195,178,0.16)' },
    fx: { dark: true, trails: true, scanlines: false, glow: true },
  },
  office: {
    label: 'The Office (US)',
    emoji: '📎',
    prompt: 'Flat 2D cartoon illustration of a cozy early-2000s American paper company office, warm beige walls, gray-blue carpet, cubicles, reception desk, conference room, break room with vending machine, hand-drawn sitcom style, no people, no text',
    names: ['Michael', 'Dwight', 'Jim', 'Pam', 'Angela', 'Oscar', 'Kevin', 'Stanley', 'Phyllis', 'Creed'],
    stations: [
      { id: 'entrance', label: 'Front Door', type: 'entrance', x: 0.5, y: 7.2 },
      { id: 'reception', label: 'Reception', type: 'reception', x: 1.6, y: 8.4 },
      { id: 'bullpen', label: 'Bullpen', type: 'desks', x: 4.4, y: 4.2 },
      { id: 'michael', label: "Michael's Office", type: 'office', x: 8.9, y: 1.2 },
      { id: 'conference', label: 'Conference Room', type: 'conference', x: 7.3, y: 5.6 },
      { id: 'breakroom', label: 'Break Room', type: 'breakroom', x: 2.2, y: 1.6 },
      { id: 'annex', label: 'The Annex', type: 'desks', x: 6.4, y: 8.2 },
      { id: 'mail', label: 'Inbox', type: 'mail', x: 0.9, y: 8.8 },
      { id: 'warehouse', label: 'Warehouse', type: 'warehouse', x: 9.2, y: 9.0 },
    ],
    palette: { floor: ['#e8dcc3', '#e1d3b6'], accent: '#c07c2b', grid: 'rgba(120,100,60,0.10)',
               wall: ['#a9b8a0', '#9db29a', '#8fa08a'], wood: '#b98a5e', woodDark: '#8a6642', woodTop: '#c99a6d',
               monitor: '#3d4a5c', screen: '#a8cce8', chair: '#3a3a3a', pot: '#c96f4a', plant: '#6f9d5e',
               mail: '#c07c2b', mailDark: '#8e5a1a', rug: 'rgba(192,124,43,0.12)' },
    fx: { dark: false, trails: false, scanlines: false, glow: false },
  },
  cyberpunk: {
    label: 'Cyberpunk',
    emoji: '🌆',
    prompt: 'Cyberpunk 2077 style neon-drenched city street at night, holographic billboards, rain reflections, magenta and cyan neon, dense futuristic buildings, cinematic game key art, no people, no text',
    names: ['V', 'Johnny', 'Judy', 'Panam', 'River', 'Takemura', 'Rogue', 'Jackie', 'Misty', 'Kerry'],
    stations: [
      { id: 'entrance', label: 'Nightclub Door', type: 'entrance', x: 9, y: 1 },
      { id: 'desk-a', label: 'Netrunner Deck', type: 'desks', x: 2.5, y: 2.5 },
      { id: 'desk-b', label: 'Fixer Hub', type: 'desks', x: 6.5, y: 2.5 },
      { id: 'meeting', label: 'Afterlife Booth', type: 'meeting', x: 4.5, y: 5.5 },
      { id: 'lounge', label: 'Rooftop Bar', type: 'lounge', x: 1.5, y: 7.5 },
      { id: 'tools', label: 'Ripperdoc Clinic', type: 'tools', x: 8.5, y: 5.5 },
      { id: 'mail', label: 'Data Terminal', type: 'mail', x: 9, y: 8.5 },
      { id: 'library', label: 'Data Archive', type: 'library', x: 0.8, y: 2.5 },
    ],
    palette: { floor: ['#16121e', '#1a1522'], accent: '#ff5cd0', grid: 'rgba(255,92,208,0.25)',
               wall: ['#100d18', '#15111f', '#201a2c'], wood: '#1e1826', woodDark: '#140f1c', woodTop: '#262032',
               monitor: '#05050a', screen: '#ff5cd0', chair: '#120e18', pot: '#241c30', plant: '#ff5cd0',
               mail: '#ff5cd0', mailDark: '#d43aa8', rug: 'rgba(255,92,208,0.15)' },
    fx: { dark: true, trails: true, scanlines: true, glow: true },
  },
};

const DEFAULT_STATION_DEFS = [
  { id: 'entrance', label: 'Entrance', type: 'entrance', x: 9, y: 1 },
  { id: 'desk-a', label: 'Desk Row A', type: 'desks', x: 2.5, y: 2.5 },
  { id: 'desk-b', label: 'Desk Row B', type: 'desks', x: 6.5, y: 2.5 },
  { id: 'meeting', label: 'Meeting Room', type: 'meeting', x: 4.5, y: 5.5 },
  { id: 'lounge', label: 'Lounge', type: 'lounge', x: 1.5, y: 7.5 },
  { id: 'tools', label: 'Tool Room', type: 'tools', x: 8.5, y: 5.5 },
  { id: 'mail', label: 'Mailbox', type: 'mail', x: 9, y: 8.5 },
  { id: 'library', label: 'Library', type: 'library', x: 0.8, y: 2.5 },
];

/* ------------------------------------------------------------------ *
 * Custom theme builder — turns a franchise pick + tweaks into a theme *
 * ------------------------------------------------------------------ */
function buildCustomTheme(opts) {
  const f = opts.franchise || FRANCHISES.office;
  const pal = Object.assign({}, f.palette, opts.palette || {});
  const name = (opts.name || f.label).trim() || f.label;
  const slug = 'custom-' + hashCode(name + Date.now()).toString(36);

  return {
    name: 'custom',
    id: slug,
    label: name,
    brand: opts.emoji || f.emoji || '🏢',
    renderer: opts.renderer || 'office',
    ui: { accent: pal.accent || '#d96f4a' },
    floor: {
      base: pal.floor[0], alt: pal.floor[1] || pal.floor[0],
      grid: pal.grid || 'rgba(120,100,60,0.10)',
    },
    wall: {
      back: (pal.wall && pal.wall[0]) || '#a9b8a0',
      side: (pal.wall && pal.wall[1]) || '#9db29a',
      base: (pal.wall && pal.wall[2]) || '#8fa08a',
      frame: (pal.wall && pal.wall[3]) || '#7c8a76',
    },
    props: {
      wood: pal.wood || '#b98a5e', woodDark: pal.woodDark || '#8a6642', woodTop: pal.woodTop || '#c99a6d',
      monitor: pal.monitor || '#3d4a5c', screen: pal.screen || '#a8cce8', chair: pal.chair || '#3a3a3a',
      pot: pal.pot || '#c96f4a', plant: pal.plant || '#6f9d5e',
      rugPink: pal.rug || '#eec9d8', rugGreen: pal.rugGreen || pal.rug || '#b8d8b0',
      mail: pal.mail || '#d96f4a', mailDark: pal.mailDark || '#b3553a',
      book: pal.book || ['#c0504d', '#4c7a9c', '#7a9c4c', '#d9a441', '#9c6bb0'],
      whiteboard: '#f5f5f0',
    },
    entrance: (opts.entrance) || { x: 9, y: 1 },
    stations: opts.stations || DEFAULT_STATION_DEFS,
    desks: opts.desks || [[2,2],[3,2],[4,2],[2,3],[3,3],[4,3],[6,2],[7,2],[6,3],[7,3]],
    plants: opts.plants || [[0.8,5.5],[5.5,0.8],[7.8,8.5],[0.8,8.5]],
    fx: Object.assign({ dark: !!pal.floor[0] && isDarkColor(pal.floor[0]), trails: false, scanlines: false, glow: false }, opts.fx || {}),
    backdrop: opts.backdrop || null,          // image URL (server-generated)
    agentNames: opts.agentNames || f.names || [],
    isCustom: true,
  };
}

function isDarkColor(hex) {
  const n = parseInt((hex || '#888888').slice(1), 16);
  const lum = (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000;
  return lum < 130;
}

function themeToThemeConfig(t) {
  // a custom theme object is already in THEMES shape (plus extras)
  return t;
}
