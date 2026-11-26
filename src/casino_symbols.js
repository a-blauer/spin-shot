// The casino's pictures: the slot machine's seven symbols, drawn as SVG (used in the windows and, rasterised, on the
// machines' reels in the world).
// slot symbols, drawn: berry, acorn, bell, clover, star, toadstool, the gnome's hat (the jackpot)
export const SYM = {
  berry: '<svg viewBox="0 0 64 64"><path d="M32 14c4-8 12-9 16-6-6 1-10 4-12 9" fill="#3a8a3a"/><circle cx="24" cy="38" r="13" fill="#c8281e"/><circle cx="40" cy="40" r="13" fill="#e0342c"/><circle cx="20" cy="33" r="3" fill="#fff" opacity=".7"/><circle cx="36" cy="35" r="3" fill="#fff" opacity=".7"/><path d="M24 25 32 14 40 27" stroke="#3a6a2a" stroke-width="3" fill="none"/></svg>',
  acorn: '<svg viewBox="0 0 64 64"><path d="M14 28c0-10 8-15 18-15s18 5 18 15z" fill="#6a4a2a"/><path d="M14 28h36" stroke="#4a3018" stroke-width="3"/><path d="M18 29c0 14 6 24 14 27 8-3 14-13 14-27z" fill="#c8862a"/><path d="M32 13V6" stroke="#4a3018" stroke-width="4" stroke-linecap="round"/><ellipse cx="25" cy="38" rx="3" ry="7" fill="#fff" opacity=".3"/></svg>',
  bell: '<svg viewBox="0 0 64 64"><path d="M32 8c-11 0-16 9-16 20 0 10-4 14-7 18h46c-3-4-7-8-7-18 0-11-5-20-16-20z" fill="#e8b830"/><rect x="8" y="45" width="48" height="6" rx="3" fill="#c8962a"/><circle cx="32" cy="55" r="5" fill="#a8781e"/><path d="M24 18c-3 4-3 10-3 14" stroke="#fff6c8" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
  clover: '<svg viewBox="0 0 64 64"><g fill="#3a9a4a"><circle cx="23" cy="24" r="11"/><circle cx="41" cy="24" r="11"/><circle cx="23" cy="40" r="11"/><circle cx="41" cy="40" r="11"/></g><path d="M32 32c4 10 10 18 18 22" stroke="#2a6a2a" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="32" cy="32" r="5" fill="#2a7a3a"/></svg>',
  star: '<svg viewBox="0 0 64 64"><path d="M32 5l8 18 19 2-14 13 4 19-17-10-17 10 4-19L5 25l19-2z" fill="#ffcd5a" stroke="#c8962a" stroke-width="3" stroke-linejoin="round"/><circle cx="26" cy="26" r="3" fill="#fff" opacity=".8"/></svg>',
  shroom: '<svg viewBox="0 0 64 64"><path d="M6 34C6 18 18 8 32 8s26 10 26 26z" fill="#c8281e"/><circle cx="20" cy="24" r="5" fill="#fbf4e6"/><circle cx="38" cy="16" r="4" fill="#fbf4e6"/><circle cx="46" cy="28" r="4" fill="#fbf4e6"/><circle cx="30" cy="27" r="3" fill="#fbf4e6"/><path d="M24 34h16l2 22H22z" fill="#fbf4e6"/><path d="M6 34h52" stroke="#8a1a14" stroke-width="3"/></svg>',
  hat: '<svg viewBox="0 0 64 64"><path d="M32 4 50 46H14z" fill="#b8281e"/><path d="M32 4 41 25" stroke="#e0503c" stroke-width="4" stroke-linecap="round"/><rect x="8" y="44" width="48" height="9" rx="4.5" fill="#8a1a14"/><circle cx="32" cy="5" r="5" fill="#ffcd5a"/><rect x="26" y="44" width="12" height="9" fill="#ffcd5a"/></svg>',
};
// the wild: a fairy ring of light round a gold W - it stands in for any symbol to make three of a kind
SYM.wild = '<svg viewBox="0 0 64 64"><defs><radialGradient id="wg" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="#fff6c8"/><stop offset=".45" stop-color="#c890ff"/><stop offset="1" stop-color="#5a2aa8"/></radialGradient></defs><circle cx="32" cy="32" r="27" fill="url(#wg)" stroke="#ffcd5a" stroke-width="4"/><g fill="#ffcd5a"><circle cx="32" cy="3.5" r="3"/><circle cx="60.5" cy="32" r="3"/><circle cx="32" cy="60.5" r="3"/><circle cx="3.5" cy="32" r="3"/></g><path d="M13 21h8l4 18 7-18 7 18 4-18h8l-9 25h-7l-6-15-6 15h-7z" fill="#ffcd5a" stroke="#8a5a14" stroke-width="2" stroke-linejoin="round"/><text x="32" y="58" font-family="Georgia,serif" font-weight="900" font-size="9" text-anchor="middle" fill="#fff6c8">WILD</text></svg>';
export const SYM_ORDER = ['berry', 'acorn', 'bell', 'clover', 'star', 'shroom', 'hat', 'wild'];
// the seven symbols stacked on one canvas, one cell each (for the reels in the world)
let atlas = null;
export function symbolAtlas(cell = 128) {
  if (atlas) return atlas;
  const c = document.createElement('canvas'); c.width = cell; c.height = cell * SYM_ORDER.length;
  const g = c.getContext('2d'); g.fillStyle = '#fbf4e6'; g.fillRect(0, 0, c.width, c.height);
  atlas = { canvas: c, ready: Promise.all(SYM_ORDER.map((k, i) => new Promise((res) => { const im = new Image(); im.onload = () => { g.drawImage(im, cell * 0.14, i * cell + cell * 0.14, cell * 0.72, cell * 0.72); res(); }; im.onerror = res; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(SYM[k].replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')); }))) };
  return atlas;
}
