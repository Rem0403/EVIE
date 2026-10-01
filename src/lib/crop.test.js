import { expect, test } from 'vitest';
import { clamp, cropSquare, fitted, MAX_ZOOM, minScale, zoomAt } from './crop.js';

// A 4000x3000 landscape photo in a 300px circle.
const W = 4000;
const H = 3000;
const BOX = 300;
const MIN = minScale(W, H, BOX); // 0.1: the photo's height just fills the circle

test('starts fitted: the centered square of the photo', () => {
  expect(MIN).toBe(0.1);
  expect(cropSquare(fitted(W, H, BOX), W, H, BOX)).toEqual({ sx: 500, sy: 0, size: 3000 });
});

test('never zooms out past filling the circle, or in past the limit', () => {
  expect(clamp({ scale: 0.01, x: 0, y: 0 }, W, H, BOX).scale).toBe(MIN);
  expect(clamp({ scale: 99, x: 0, y: 0 }, W, H, BOX).scale).toBe(MIN * MAX_ZOOM);
});

test('never drags an edge of the photo into the circle', () => {
  // Fitted, the photo is 400x300 on screen: 50px spare each side, none up or down.
  expect(clamp({ scale: MIN, x: 500, y: 80 }, W, H, BOX)).toEqual({ scale: MIN, x: 50, y: 0 });
  // Dragged fully right, the circle shows the photo's left edge.
  expect(cropSquare({ scale: MIN, x: 50, y: 0 }, W, H, BOX).sx).toBe(0);
  expect(cropSquare({ scale: MIN, x: -50, y: 0 }, W, H, BOX).sx).toBe(1000);
});

test('zooms around the fingers: the photo point under them stays put', () => {
  const view = fitted(W, H, BOX);
  const [px, py] = [60, -40]; // fingers right of and above the center
  const photoPoint = (v) => [(px - v.x) / v.scale, (py - v.y) / v.scale]; // photo px from its center
  const zoomed = zoomAt(view, 2, px, py, W, H, BOX);
  expect(zoomed.scale).toBeCloseTo(0.2);
  expect(photoPoint(zoomed)[0]).toBeCloseTo(photoPoint(view)[0]);
  expect(photoPoint(zoomed)[1]).toBeCloseTo(photoPoint(view)[1]);
});

test('zooming in then cropping picks the smaller square under the circle', () => {
  const zoomed = zoomAt(fitted(W, H, BOX), 2, 0, 0, W, H, BOX);
  expect(cropSquare(zoomed, W, H, BOX)).toEqual({ sx: 1250, sy: 750, size: 1500 });
});
