// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../data/entries.js', () => ({ addEntry: vi.fn(() => 'h2') }));

import Handoff from './Handoff.jsx';
import { addEntry } from '../data/entries.js';

const at = (h, m = 0) => new Date(2026, 8, 28, h, m).getTime();
const circle = { id: 'c1', personName: 'Maya' };
const me = { uid: 'u2', name: 'Dad' };
const momHandoff = { type: 'handoff', occurredAt: at(7, 10), until: at(15), note: 'Slept badly', createdBy: 'u1', createdByName: 'Mom' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ now: at(14) });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it('shows who is with them, until when, and their note', () => {
  render(<Handoff circle={circle} me={me} entries={[momHandoff]} />);
  expect(screen.getByText('With Mom')).toBeTruthy();
  expect(screen.getByText(/until 3:00 PM/)).toBeTruthy();
  expect(screen.getByText('“Slept badly”')).toBeTruthy();
});

it('takes over with a summary of what happened since the last handoff', () => {
  const entries = [momHandoff, { type: 'seizure', occurredAt: at(9) }, { type: 'med', occurredAt: at(8, 5), status: 'given' }];
  render(<Handoff circle={circle} me={me} entries={entries} />);
  fireEvent.click(screen.getByText('Take over'));
  expect(screen.getByRole('dialog', { name: 'Take over from Mom' }).textContent).toMatch('1 seizure · 1 dose given');
  fireEvent.change(screen.getByLabelText('Until (optional)'), { target: { value: '07:00' } });
  fireEvent.change(screen.getByLabelText('Note for everyone (optional)'), { target: { value: ' Dinner at 6 ' } });
  fireEvent.click(screen.getAllByText('Take over').at(-1));
  expect(addEntry).toHaveBeenCalledWith('c1', {
    type: 'handoff', occurredAt: at(14), until: new Date(2026, 8, 29, 7).getTime(), note: 'Dinner at 6', createdBy: 'u2', createdByName: 'Dad',
  });
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('names the day for a handoff from before today', () => {
  vi.setSystemTime(new Date(2026, 8, 29, 9).getTime());
  render(<Handoff circle={circle} me={me} entries={[{ ...momHandoff, until: undefined }]} />);
  expect(screen.getByText(/since Yesterday 7:10 AM/)).toBeTruthy();
});

it('marks a handoff whose time has run out', () => {
  vi.setSystemTime(at(16));
  render(<Handoff circle={circle} me={me} entries={[momHandoff]} />);
  expect(screen.getByText(/Was with Mom until 3:00 PM/)).toBeTruthy();
});
