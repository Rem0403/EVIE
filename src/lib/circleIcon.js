import {
  faCat, faCloud, faDog, faDove, faFish, faFrog, faFutbol, faHeart, faHorse, faHouse, faLeaf, faMoon, faMountainSun,
  faMusic, faPalette, faPaw, faRainbow, faRocket, faSeedling, faStar, faSun, faTree, faUmbrella, faWater,
} from '@fortawesome/free-solid-svg-icons';

// The circle's icon: a Font Awesome symbol on a soft color, like a list icon in Reminders, or a
// photo (iconPhoto: a small JPEG data URL, made like a profile picture; see lib/avatar.js).
// Calm, friendly symbols only: no puzzle piece (many autistic people dislike it) and nothing
// that looks like an alert, such as a bolt. firestore.rules allows exactly these symbol and color keys.

export const CIRCLE_ICONS = [
  ['heart', faHeart, 'Heart'],
  ['sun', faSun, 'Sun'],
  ['moon', faMoon, 'Moon'],
  ['star', faStar, 'Star'],
  ['rainbow', faRainbow, 'Rainbow'],
  ['cloud', faCloud, 'Cloud'],
  ['umbrella', faUmbrella, 'Umbrella'],
  ['leaf', faLeaf, 'Leaf'],
  ['seedling', faSeedling, 'Seedling'],
  ['tree', faTree, 'Tree'],
  ['mountain', faMountainSun, 'Mountain'],
  ['wave', faWater, 'Waves'],
  ['dove', faDove, 'Dove'],
  ['fish', faFish, 'Fish'],
  ['cat', faCat, 'Cat'],
  ['dog', faDog, 'Dog'],
  ['horse', faHorse, 'Horse'],
  ['frog', faFrog, 'Frog'],
  ['paw', faPaw, 'Paw print'],
  ['music', faMusic, 'Music'],
  ['art', faPalette, 'Paint palette'],
  ['ball', faFutbol, 'Ball'],
  ['rocket', faRocket, 'Rocket'],
  ['home', faHouse, 'House'],
];

// The same soft colors as the app's palettes (More → Appearance), plus gold.
export const CIRCLE_COLORS = [
  ['lavender', 'Lavender', '#c9b8ea'],
  ['blue', 'Soft blue', '#a9cbea'],
  ['green', 'Sage', '#b3cfb8'],
  ['pink', 'Soft pink', '#e9bcd6'],
  ['earth', 'Earth', '#d8c7aa'],
  ['gold', 'Gold', '#f0d58a'],
];

export const DEFAULT_ICON = { icon: 'heart', iconColor: 'lavender', iconPhoto: '' };

const SYMBOL = Object.fromEntries(CIRCLE_ICONS.map(([key, fa]) => [key, fa]));
const HEX = Object.fromEntries(CIRCLE_COLORS.map(([key, , hex]) => [key, hex]));

// What to draw for a circle: its photo, else its symbol, else null (circles from before icons).
export function circleIconOf(circle) {
  if (circle?.iconPhoto) return { photo: circle.iconPhoto };
  const symbol = SYMBOL[circle?.icon];
  return symbol ? { symbol, color: HEX[circle.iconColor] || HEX.lavender } : null;
}
