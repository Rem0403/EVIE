// Appearance, chosen per phone (so it lives in localStorage):
// - mode: follow the phone (system), or always light / always dark; CSS reads <html data-theme>.
// - palette: soothing color schemes for the page, cards and nav; CSS reads <html data-palette>.
//   Seizure purple, emergency red, gold follow-ups and entry-type colors are the same in every palette.
export const THEMES = [
  ['system', 'System'],
  ['light', 'Light'],
  ['dark', 'Dark'],
];
export const PALETTES = [
  ['lavender', 'Lavender'],
  ['blue', 'Soft blue'],
  ['green', 'Sage'],
  ['pink', 'Soft pink'],
  ['earth', 'Earth'],
];
// Page colors per palette [light, dark], for the browser's bar color (the <meta name="theme-color"> tags).
const BAR = {
  lavender: ['#ebe5f6', '#0f0c16'],
  blue: ['#e2ecf6', '#0b1118'],
  green: ['#e4ede5', '#0c130f'],
  pink: ['#f3e5ee', '#150c12'],
  earth: ['#eee7dc', '#12100c'],
};
const THEME_KEY = 'evie.theme';
const PALETTE_KEY = 'evie.palette';

function load(key, options, fallback) {
  try {
    const v = localStorage.getItem(key);
    return options.some(([k]) => k === v) ? v : fallback;
  } catch {
    return fallback;
  }
}
function store(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: applies for this visit only */
  }
}

export const loadTheme = () => load(THEME_KEY, THEMES, 'system');
export const loadPalette = () => load(PALETTE_KEY, PALETTES, 'lavender');

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light' || theme === 'dark') root.dataset.theme = theme;
  else delete root.dataset.theme;
}

export function applyPalette(palette) {
  const root = document.documentElement;
  if (palette && palette !== 'lavender' && BAR[palette]) root.dataset.palette = palette;
  else delete root.dataset.palette;
  const [light, dark] = BAR[palette] || BAR.lavender;
  document.querySelector('meta[name="theme-color"][media*="light"]')?.setAttribute('content', light);
  document.querySelector('meta[name="theme-color"][media*="dark"]')?.setAttribute('content', dark);
}

export function saveTheme(theme) {
  applyTheme(theme);
  store(THEME_KEY, theme);
}

export function savePalette(palette) {
  applyPalette(palette);
  store(PALETTE_KEY, palette);
}
