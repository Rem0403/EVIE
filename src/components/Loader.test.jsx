// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import Loader from './Loader.jsx';

afterEach(cleanup);

it('announces what is happening, with the dots hidden from screen readers', () => {
  render(<Loader label="Clearing this phone…" />);
  expect(screen.getByRole('status').textContent).toBe('Clearing this phone…');
  expect(document.querySelector('.loader-dots').getAttribute('aria-hidden')).toBe('true');
});

it("stays quiet inside something that already announces itself", () => {
  render(<Loader label="Saving…" quiet />);
  expect(screen.queryByRole('status')).toBeNull();
  expect(screen.getByText('Saving…')).toBeTruthy();
});

it('only moves, never changes brightness, and stops under reduce motion', () => {
  const css = readFileSync('src/styles.css', 'utf8');
  const keyframes = css.match(/@keyframes loader-rise \{[^\n]*\}/)[0];
  expect(keyframes).not.toMatch(/opacity|filter|background|color/);
  expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{\s*\.loader-dots span \{ animation: none !important; \}/);
});
