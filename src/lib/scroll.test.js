// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { holdInPlace, scrollToId, scrollToTop } from './scroll.js';

const setReducedMotion = (reduce) => {
  window.matchMedia = vi.fn(() => ({ matches: reduce }));
};

afterEach(() => {
  delete window.matchMedia;
  document.body.innerHTML = '';
});

it('glides smoothly to an in-app target', () => {
  setReducedMotion(false);
  document.body.innerHTML = '<h2 id="timeline">Timeline</h2>';
  const el = document.getElementById('timeline');
  el.scrollIntoView = vi.fn();
  scrollToId('timeline');
  expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
});

it('jumps instantly when reduce motion is on', () => {
  setReducedMotion(true);
  window.scrollTo = vi.fn();
  scrollToTop();
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
});

it('does nothing for a missing target', () => {
  setReducedMotion(false);
  expect(() => scrollToId('nope')).not.toThrow();
});

it('holds an element in place while content above it shrinks', () => {
  let top = 400; // where the tapped header is on screen
  const el = { getBoundingClientRect: () => ({ top }) };
  window.scrollBy = vi.fn((x, y) => { top -= y; });
  const frames = [];
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((fn) => frames.push(fn));
  holdInPlace(el, 1000);
  top = -100; // the long section above closed, so the header jumped up 500px
  frames.shift()();
  expect(window.scrollBy).toHaveBeenLastCalledWith(0, -500);
  expect(top).toBe(400); // back where it was
  delete window.scrollBy;
  vi.restoreAllMocks();
});
