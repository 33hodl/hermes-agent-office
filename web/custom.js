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
  batman: { _id: 'batman',
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
  starwars: { _id: 'starwars',
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
  ghibli: { _id: 'ghibli',
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
  spiderman: { _id: 'spiderman',
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
  avatar: { _id: 'avatar',
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
  office: { _id: 'office',
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
  cyberpunk: { _id: 'cyberpunk',
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
  const franchiseId = opts.franchiseId || f._id || 'generic';
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
    franchiseId,
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


/* ------------------------------------------------------------------ *
 * Character archetype system — every agent is visually DISTINCT.
 * Identity = body hue + head topper silhouette + one accessory + body
 * proportions, per the art-direction spec (readable at 40px, from
 * behind, in motion). The identity hue binds across canvas, roster dot,
 * avatar tile and mail accent.
 * ------------------------------------------------------------------ */
const CAST = {
  batman: {
    Batman:   { hue:'#3a3f55', body:'tall',   topper:'batears', tc:'#3a3f55', acc:'cape',  face:'stern' },
    Robin:    { hue:'#d64541', body:'slim',   topper:'maskhair', tc:'#2e2a28', acc:'staff', face:'calm' },
    Catwoman: { hue:'#4a4559', body:'slim',   topper:'catears', tc:'#4a4559', acc:'whip',  face:'calm' },
    Joker:    { hue:'#8a5f9e', body:'lanky',  topper:'hair', tc:'#7cb342', acc:'card',   face:'grin' },
    Bane:     { hue:'#7a6a4d', body:'wide',   topper:'mask',  tc:'#4a3d2a', acc:'none',   face:'stern' },
    Nightwing:{ hue:'#4a7bb0', body:'slim',   topper:'hair',  tc:'#2e2a28', acc:'staff',  face:'calm' },
    Batgirl:  { hue:'#d64541', body:'slim',   topper:'catears', tc:'#2e2a28', acc:'cape', face:'calm' },
    Alfred:   { hue:'#b8b2a6', body:'default',topper:'none',  tc:'#6b6aua'.replace('ua','4a'), acc:'collar', face:'calm' },
    Riddler:  { hue:'#5d8a4a', body:'default',topper:'hat',   tc:'#3a4a2e', acc:'card',   face:'calm' },
    'Harley Quinn': { hue:'#d6459a', body:'slim', topper:'bob', tc:'#2e2a28', acc:'staff', face:'grin' },
  },
  starwars: { _id: 'starwars',
    Luke:      { hue:'#c9b99a', body:'default', topper:'hair', tc:'#6b4a2a', acc:'lightsaber', face:'calm' },
    Leia:      { hue:'#c9b99a', body:'slim',    topper:'buns', tc:'#6b4a2a', acc:'none', face:'calm' },
    Han:       { hue:'#c9b99a', body:'default', topper:'hair', tc:'#3a2e24', acc:'collar', face:'calm' },
    Chewbacca: { hue:'#8a6a3a', body:'wide',    topper:'fur',  tc:'#8a6a3a', acc:'none', face:'calm' },
    'R2-D2':   { hue:'#9db8d8', body:'droid',   topper:'dome', tc:'#d8e4f0', acc:'none', face:'none' },
    'C-3PO':   { hue:'#d8a84a', body:'gold',    topper:'dome', tc:'#d8a84a', acc:'none', face:'none' },
    'Obi-Wan': { hue:'#c9b99a', body:'tall',    topper:'hair', tc:'#8a8a8a', acc:'lightsaber', face:'calm' },
    'Darth Vader': { hue:'#3a3a42', body:'tall', topper:'helmet', tc:'#2e2e36', acc:'lightsaber', face:'stern' },
    Yoda:      { hue:'#7a9a5a', body:'small',   topper:'ears', tc:'#7a9a5a', acc:'staff', face:'calm' },
    Lando:     { hue:'#c9b99a', body:'default', topper:'hair', tc:'#2e241e', acc:'collar', face:'calm' },
  },
  ghibli: { _id: 'ghibli',
    Totoro:  { hue:'#8a8a9a', body:'wide',  topper:'ears', tc:'#8a8a9a', acc:'leaf',  face:'calm' },
    Chihiro: { hue:'#d68a9a', body:'slim',  topper:'hair', tc:'#5a3a2a', acc:'none',  face:'calm' },
    Haku:    { hue:'#6a9ac0', body:'slim',  topper:'hair', tc:'#2e4a5a', acc:'none',  face:'calm' },
    Kiki:    { hue:'#5a5a8a', body:'slim',  topper:'bob',  tc:'#2e2a3a', acc:'bow',   face:'calm' },
    Ponyo:   { hue:'#e8909a', body:'small', topper:'hair', tc:'#c84a4a', acc:'none',  face:'grin' },
    Howl:    { hue:'#c8b090', body:'tall',  topper:'hair', tc:'#3a2e1e', acc:'collar',face:'calm' },
    Calcifer:{ hue:'#e8a84a', body:'small', topper:'flame',tc:'#e85a2a', acc:'none',  face:'grin' },
    Mononoke:{ hue:'#b06050', body:'tall',  topper:'ears', tc:'#e8d8c8', acc:'mask',  face:'stern' },
    'No-Face':{ hue:'#3a3a42', body:'tall', topper:'mask', tc:'#3a3a42', acc:'none',  face:'none' },
    Jiji:    { hue:'#3a3a42', body:'small', topper:'catears', tc:'#3a3a42', acc:'bow', face:'calm' },
  },
  spiderman: { _id: 'spiderman',
    Peter:   { hue:'#d64541', body:'slim',  topper:'hair', tc:'#3a2e24', acc:'mask',  face:'calm' },
    Miles:   { hue:'#3a3a42', body:'slim',  topper:'hair', tc:'#2e241e', acc:'mask',  face:'calm' },
    Gwen:    { hue:'#d8d8e8', body:'slim',  topper:'hair', tc:'#e8b8c8', acc:'mask',  face:'calm' },
    'Aunt May':{ hue:'#b8a88a', body:'default', topper:'bun', tc:'#8a8a8a', acc:'none', face:'calm' },
    MJ:      { hue:'#c88a6a', body:'slim',  topper:'hair', tc:'#8a3a2a', acc:'none',  face:'calm' },
    Ned:     { hue:'#c8a868', body:'round', topper:'hair', tc:'#3a2e1e', acc:'none',  face:'calm' },
    Venom:   { hue:'#2e2e3a', body:'wide',  topper:'none', tc:'#2e2e3a', acc:'none',  face:'grin' },
    'Doc Ock':{ hue:'#7a8a9a', body:'default', topper:'bald', tc:'#7a8a9a', acc:'arms', face:'stern' },
    'Green Goblin': { hue:'#7a9a4a', body:'default', topper:'hat', tc:'#4a5a2e', acc:'glider', face:'grin' },
    Kingpin: { hue:'#e8e0d0', body:'wide', topper:'bald', tc:'#e8e0d0', acc:'cane',  face:'stern' },
  },
  avatar: { _id: 'avatar',
    Jake:    { hue:'#7a9ac0', body:'tall',  topper:'hair', tc:'#3a2e24', acc:'none',  face:'calm' },
    Neytiri:{ hue:'#5a8ad0', body:'tall',  topper:'ears', tc:'#2e4a7a', acc:'none',  face:'calm' },
    Kiri:    { hue:'#5a8ad0', body:'slim',  topper:'ears', tc:'#2e4a7a', acc:'none',  face:'calm' },
    Loak:    { hue:'#5a8ad0', body:'wide',  topper:'ears', tc:'#2e4a7a', acc:'none',  face:'calm' },
    Tuk:     { hue:'#5a8ad0', body:'small', topper:'ears', tc:'#2e4a7a', acc:'none',  face:'grin' },
    Neteyam: { hue:'#5a8ad0', body:'tall',  topper:'ears', tc:'#2e4a7a', acc:'none',  face:'calm' },
    "Mo'at": { hue:'#4a7ab8', body:'default', topper:'ears', tc:'#8a8a8a', acc:'collar', face:'calm' },
    "Tsu'tey":{ hue:'#4a6aa8', body:'wide', topper:'ears', tc:'#2e4a7a', acc:'none',  face:'stern' },
    Quaritch:{ hue:'#8a6a5a', body:'wide',  topper:'hair', tc:'#2e241e', acc:'none',  face:'stern' },
    Norm:    { hue:'#9aa8b8', body:'default', topper:'hair', tc:'#3a2e24', acc:'glasses', face:'calm' },
  },
  office: { _id: 'office',
    Michael:{ hue:'#c8a84a', body:'default', topper:'hair', tc:'#3a2e1e', acc:'mug',  face:'calm' },
    Dwight: { hue:'#b8a86a', body:'default', topper:'hair', tc:'#4a3a1e', acc:'beet', face:'stern' },
    Jim:    { hue:'#7a9ac0', body:'tall',    topper:'hair', tc:'#3a2e24', acc:'coffee', face:'calm' },
    Pam:    { hue:'#c8a8b8', body:'slim',    topper:'hair', tc:'#7a4a3a', acc:'none',  face:'calm' },
    Angela: { hue:'#b8c8a0', body:'small',   topper:'bun',  tc:'#5a4a2e', acc:'cat',   face:'stern' },
    Oscar:  { hue:'#c8b090', body:'slim',    topper:'bald', tc:'#c8b090', acc:'none',  face:'calm' },
    Kevin:  { hue:'#d0c0a8', body:'round',   topper:'hair', tc:'#4a3a2a', acc:'chili', face:'calm' },
    Stanley:{ hue:'#8a6a4a', body:'round',   topper:'bald', tc:'#8a6a4a', acc:'crossword', face:'stern' },
    Phyllis:{ hue:'#c0a0b0', body:'round',   topper:'hair', tc:'#8a6a6a', acc:'none',  face:'calm' },
    Creed:  { hue:'#9aa8a0', body:'lanky',   topper:'hair', tc:'#8a8a8a', acc:'none',  face:'grin' },
  },
  cyberpunk: { _id: 'cyberpunk',
    V:       { hue:'#d8a84a', body:'slim',  topper:'hair', tc:'#3a2e1e', acc:'chrome', face:'calm' },
    Johnny:  { hue:'#8a9ab8', body:'default', topper:'hair', tc:'#c8c8d0', acc:'chrome', face:'stern' },
    Judy:    { hue:'#e8a0a0', body:'slim',  topper:'hair', tc:'#2e2a3a', acc:'none',  face:'calm' },
    Panam:   { hue:'#c8704a', body:'slim',  topper:'hair', tc:'#5a2e1e', acc:'none',  face:'calm' },
    River:   { hue:'#a0886a', body:'wide',  topper:'hair', tc:'#2e241e', acc:'none',  face:'calm' },
    Takemura:{ hue:'#8a8a9a', body:'default', topper:'bald', tc:'#8a8a9a', acc:'collar', face:'stern' },
    Rogue:   { hue:'#b8685a', body:'slim',  topper:'hair', tc:'#5a2e24', acc:'chrome', face:'stern' },
    Jackie:  { hue:'#9a8a6a', body:'wide',  topper:'hair', tc:'#2e241e', acc:'none',  face:'grin' },
    Misty:   { hue:'#d8b8a0', body:'slim',  topper:'hair', tc:'#4a2e2a', acc:'none',  face:'calm' },
    Kerry:   { hue:'#a89ab8', body:'default', topper:'hair', tc:'#2e2a3a', acc:'chrome', face:'calm' },
  },
};

const GENERIC_LOOKS = [
  { hue:'#f2a38f', topper:'catears', acc:'none' },
  { hue:'#7ec8c0', topper:'ears',    acc:'coffee' },
  { hue:'#a8c89a', topper:'bun',     acc:'none' },
  { hue:'#f2cf78', topper:'cap',     acc:'book' },
  { hue:'#c39ad8', topper:'horns',   acc:'none' },
  { hue:'#8fb7e8', topper:'headphones', acc:'none' },
  { hue:'#e8a0b8', topper:'bob',     acc:'bow' },
  { hue:'#e8d5a0', topper:'hair',    acc:'mug' },
];

/* Generic office cast — distinct looks for the built-in themes (no franchise) */
const OFFICE_CAST = {
  Uma:   { hue:'#7ec8c0', body:'slim',   topper:'headphones', tc:'#3a5a5a', acc:'coffee', face:'calm' },
  Xyla:  { hue:'#e8a0b8', body:'slim',   topper:'bob',        tc:'#7a3a4a', acc:'bow',    face:'calm' },
  Hazel: { hue:'#f2a38f', body:'default', topper:'catears',   tc:'#8a4a3a', acc:'mug',    face:'calm' },
  Dash:  { hue:'#a8c89a', body:'wide',   topper:'cap',        tc:'#3a5a2e', acc:'book',   face:'calm' },
  Pixel: { hue:'#c39ad8', body:'small',  topper:'horns',      tc:'#5a3a7a', acc:'none',   face:'calm' },
  Coco:  { hue:'#8fb7e8', body:'round',  topper:'bun',        tc:'#2e4a6a', acc:'none',   face:'calm' },
  Gizmo: { hue:'#e8d5a0', body:'lanky',  topper:'hair',       tc:'#5a4a1e', acc:'card',   face:'grin' },
  Yara:  { hue:'#e8a0a0', body:'tall',   topper:'ears',       tc:'#5a2e3a', acc:'collar', face:'calm' },
  Nova:  { hue:'#9ab8c8', body:'default',topper:'hair',       tc:'#2e4a5a', acc:'glasses',face:'calm' },
  Sage:  { hue:'#a8c8a0', body:'tall',   topper:'headphones', tc:'#3a5a3a', acc:'none',  face:'calm' },
};


function castLook(name, franchiseId) {
  const cast = CAST[franchiseId];
  if (cast && cast[name]) return Object.assign({ body:'default', face:'calm' }, cast[name]);
  // fall back to the named generic-office cast, then to procedural looks
  const named = OFFICE_CAST[name];
  if (named) return Object.assign({ body:'default', face:'calm' }, named);
  const g = GENERIC_LOOKS[hashCode(name || '') % GENERIC_LOOKS.length];
  return Object.assign({ body:'default', face:'calm' }, g);
}


function officeCastLook(name) {
  const hit = OFFICE_CAST[name];
  if (hit) return Object.assign({ body:'default', face:'calm' }, hit);
  const g = GENERIC_LOOKS[hashCode(name || '') % GENERIC_LOOKS.length];
  return Object.assign({ body:'default', face:'calm' }, g);
}
