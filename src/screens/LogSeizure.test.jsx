// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../data/entries.js', () => ({ addEntry: vi.fn(() => 'e1') }));
vi.mock('../data/clips.js', () => ({ attachMedia: vi.fn() }));

import LogSeizure from './LogSeizure.jsx';
import { addEntry } from '../data/entries.js';

const T0 = new Date(2026, 8, 26, 7, 0).getTime();
const props = () => ({ circle: { id: 'c1' }, me: { uid: 'u1', name: 'Remy' }, onDone: vi.fn() });

beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
  vi.useFakeTimers({ now: T0 });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it('lets the user pick an existing video instead of forcing the camera', () => {
  render(<LogSeizure {...props()} />);
  fireEvent.click(screen.getByText('Stop'));
  const input = document.querySelector('input[type=file]');
  expect(input.hasAttribute('capture')).toBe(false);
});

it('saves only once when Save is tapped twice quickly', () => {
  render(<LogSeizure {...props()} />);
  fireEvent.click(screen.getByText('Stop'));
  const save = screen.getByText('Save seizure');
  fireEvent.click(save);
  fireEvent.click(save);
  expect(addEntry).toHaveBeenCalledTimes(1);
});

it('keeps timing a seizure in progress across a reload', () => {
  render(<LogSeizure {...props()} />);
  cleanup(); // tab reloaded / evicted
  vi.setSystemTime(T0 + 90_000);
  render(<LogSeizure {...props()} />);
  expect(screen.getByText('01:30')).toBeTruthy();
});

it('keeps a stopped seizure across a reload', () => {
  render(<LogSeizure {...props()} />);
  vi.setSystemTime(T0 + 45_000);
  fireEvent.click(screen.getByText('Stop'));
  cleanup();
  vi.setSystemTime(T0 + 300_000);
  render(<LogSeizure {...props()} />);
  expect(screen.getByText('Seizure · 45s')).toBeTruthy();
});

it('forgets the draft once the seizure is saved', () => {
  render(<LogSeizure {...props()} />);
  vi.setSystemTime(T0 + 45_000);
  fireEvent.click(screen.getByText('Stop'));
  fireEvent.click(screen.getByText('Save seizure'));
  cleanup();
  render(<LogSeizure {...props()} />);
  expect(screen.getByText('00:00')).toBeTruthy();
});
