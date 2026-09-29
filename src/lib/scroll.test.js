// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { scrollToId, scrollToTop } from './scroll.js';

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
