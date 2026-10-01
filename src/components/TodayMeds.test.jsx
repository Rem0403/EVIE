// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../data/entries.js', () => ({ addEntry: vi.fn(() => 'm1') }));

import TodayMeds from './TodayMeds.jsx';
import { addEntry } from '../data/entries.js';

const NOW = new Date(2026, 8, 28, 9, 30).getTime();
const circle = { id: 'c1', meds: [{ name: 'Keppra', dose: '250 mg', times: ['08:00', '20:00'] }] };
const me = { uid: 'u2', name: 'Dad' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ now: NOW });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it('shows who gave a dose, and offers Given / Missed for the rest', () => {
  const given = { type: 'med', occurredAt: new Date(2026, 8, 28, 8, 5).getTime(), medName: 'Keppra', status: 'given', slot: '08:00', createdByName: 'Mom' };
  render(<TodayMeds circle={circle} me={me} entries={[given]} onSetUp={vi.fn()} />);
  expect(document.body.textContent).toContain('1 of 2 given');
  // Collapsed: only the next dose, with its one-tap buttons.
  expect(screen.queryByText('Given · Mom · 8:05 AM')).toBeNull();
  expect(screen.getByRole('button', { name: 'Keppra 8:00 PM given' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /All of today’s doses \(2\)/ }));
  expect(screen.getByText('Given · Mom · 8:05 AM')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Keppra 8:00 AM given' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Keppra 8:00 PM given' })).toBeTruthy();
});

it('logs a due dose as given now, tied to its slot', () => {
  render(<TodayMeds circle={circle} me={me} entries={[]} onSetUp={vi.fn()} />);
  expect(screen.getByText('Due')).toBeTruthy(); // 8 AM has passed
  fireEvent.click(screen.getByRole('button', { name: 'Keppra 8:00 AM given' }));
  expect(addEntry).toHaveBeenCalledWith('c1', {
    type: 'med', occurredAt: NOW, medName: 'Keppra', dose: '250 mg', status: 'given', slot: '08:00', createdBy: 'u2', createdByName: 'Dad',
  });
});

it('logs a missed dose at its scheduled time', () => {
  render(<TodayMeds circle={circle} me={me} entries={[]} onSetUp={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Keppra 8:00 AM missed' }));
  expect(addEntry.mock.calls[0][1]).toMatchObject({ status: 'missed', occurredAt: new Date(2026, 8, 28, 8, 0).getTime() });
});

it('invites setting up a schedule when there is none', () => {
  const onSetUp = vi.fn();
  render(<TodayMeds circle={{ id: 'c1' }} me={me} entries={[]} onSetUp={onSetUp} />);
  fireEvent.click(screen.getByText('Add the daily medication schedule'));
  expect(onSetUp).toHaveBeenCalled();
});
