// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../data/circles.js', () => ({ updateCircle: vi.fn(() => Promise.resolve()) }));
vi.mock('../data/entries.js', () => ({ addEntry: vi.fn() }));

import Schedule from './Schedule.jsx';
import Handoff from '../components/Handoff.jsx';
import { updateCircle } from '../data/circles.js';

const circle = { id: 'c1', personName: 'Maya', schedule: [{ name: 'Ms. Lee', days: [1, 3], start: '15:00', end: '19:00', note: 'Pickup' }] };

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it('says plainly that it is not a timesheet', () => {
  render(<Schedule circle={circle} onBack={vi.fn()} />);
  expect(screen.getByRole('note').textContent).toMatch(/not a timesheet.*electronic visit verification \(EVV\).*Don’t rely on EVIE for hours or pay/);
});

it('shows the week and saves edits', () => {
  render(<Schedule circle={circle} onBack={vi.fn()} />);
  expect(screen.getAllByText(/Ms. Lee · 3:00 PM–7:00 PM · Pickup/)).toHaveLength(2); // Mon and Wed
  fireEvent.click(screen.getByText('Edit schedule'));
  fireEvent.click(screen.getByText('Fri'));
  fireEvent.click(screen.getByText('Save'));
  expect(updateCircle).toHaveBeenCalledWith('c1', {
    schedule: [{ name: 'Ms. Lee', days: [1, 3, 5], start: '15:00', end: '19:00', note: 'Pickup' }],
  });
});

it('shows who is scheduled now in the handoff banner', () => {
  vi.useFakeTimers({ now: new Date(2026, 8, 28, 16).getTime() }); // Monday 4 PM
  render(<Handoff circle={circle} me={{ uid: 'u1', name: 'Mom' }} entries={[]} now={Date.now()} onSchedule={vi.fn()} />);
  expect(screen.getByText('Scheduled: Ms. Lee until 7:00 PM')).toBeTruthy();
});
