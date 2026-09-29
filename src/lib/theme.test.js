// @vitest-environment jsdom
import { beforeEach, expect, it } from 'vitest';
import { applyTheme, loadTheme, saveTheme } from './theme.js';

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.palette;
});

it('follows the phone by default', () => {
  expect(loadTheme()).toBe('system');
  applyTheme('system');
  expect(document.documentElement.dataset.theme).toBeUndefined();
});

it('remembers light or dark and marks the page for the CSS', () => {
  saveTheme('light');
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(loadTheme()).toBe('light');
  saveTheme('system');
  expect(document.documentElement.dataset.theme).toBeUndefined();
  expect(loadTheme()).toBe('system');
});

it('ignores unknown stored values', () => {
  localStorage.setItem('evie.theme', 'purple');
  expect(loadTheme()).toBe('system');
});

it('switches soothing palettes and remembers them; lavender is the default', async () => {
  const { loadPalette, savePalette } = await import('./theme.js');
  document.head.innerHTML = '<meta name="theme-color" content="#ebe5f6" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#0f0c16" media="(prefers-color-scheme: dark)">';
  expect(loadPalette()).toBe('lavender');
  savePalette('green');
  expect(document.documentElement.dataset.palette).toBe('green');
  expect(loadPalette()).toBe('green');
  expect(document.querySelector('meta[media*="light"]').getAttribute('content')).toBe('#e4ede5');
  savePalette('lavender');
  expect(document.documentElement.dataset.palette).toBeUndefined();
  localStorage.setItem('evie.palette', 'neon');
  expect(loadPalette()).toBe('lavender');
});
