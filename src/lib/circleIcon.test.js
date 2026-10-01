import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { faFish, faHeart } from '@fortawesome/free-solid-svg-icons';
import { CIRCLE_COLORS, CIRCLE_ICONS, circleIconOf, DEFAULT_ICON } from './circleIcon.js';

test('firestore.rules allows exactly the icons and colors the app offers', () => {
  const rules = readFileSync('firestore.rules', 'utf8');
  const listed = (field) => {
    const start = rules.indexOf(`d.${field} in [`);
    return rules.slice(start, rules.indexOf(']', start)).match(/'[a-z]+'/g).map((q) => q.slice(1, -1));
  };
  expect(listed('icon')).toEqual(CIRCLE_ICONS.map(([key]) => key));
  expect(listed('iconColor')).toEqual(CIRCLE_COLORS.map(([key]) => key));
});

test('draws a chosen icon, falls back on an unknown color, and shows nothing for older circles', () => {
  expect(circleIconOf(DEFAULT_ICON)).toEqual({ symbol: faHeart, color: '#c9b8ea' });
  expect(circleIconOf({ icon: 'fish', iconColor: 'nope' })).toEqual({ symbol: faFish, color: '#c9b8ea' });
  expect(circleIconOf({})).toBeNull();
  expect(circleIconOf({ icon: 'fish', iconPhoto: 'data:image/jpeg;base64,/9j/' })).toEqual({ photo: 'data:image/jpeg;base64,/9j/' }); // a photo wins
  expect(new Set(CIRCLE_ICONS.map(([, symbol]) => symbol)).size).toBe(CIRCLE_ICONS.length); // no duplicates
  expect(CIRCLE_ICONS.every(([, symbol]) => symbol?.icon)).toBe(true); // each is a real Font Awesome icon
});
