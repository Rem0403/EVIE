import { expect, test } from 'vitest';
import { swipeDirection } from './swipe.js';

test('a clear sideways swipe has a direction', () => {
  expect(swipeDirection(-120, 10)).toBe('left');
  expect(swipeDirection(90, -20)).toBe('right');
});

test('short or mostly up-down moves are not swipes', () => {
  expect(swipeDirection(-40, 0)).toBe(null);
  expect(swipeDirection(100, 80)).toBe(null); // scrolling diagonally
});
