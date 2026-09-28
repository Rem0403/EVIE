// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

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
  fireEvent.click(screen.getByText('Skip →'));
  fireEvent.click(screen.getByText('Skip →'));
  fireEvent.click(screen.getByText('Next'));
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

it('alerts at 5 minutes, not before', () => {
  render(<LogSeizure {...props()} />);
  act(() => vi.advanceTimersByTime(299_000));
  expect(screen.queryByRole('alert')).toBeNull();
  act(() => vi.advanceTimersByTime(1_000));
  expect(screen.getByRole('alert').textContent).toMatch(/5 minutes/);
  expect(document.querySelector('.timer.over')).toBeTruthy();
});

it('walks through the steps and saves each answer', () => {
  render(<LogSeizure {...props()} />);
  vi.setSystemTime(T0 + 80_000);
  fireEvent.click(screen.getByText('Stop'));
  expect(screen.getByText('Step 1 of 4')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /^Focal/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
  fireEvent.click(screen.getByText('Illness'));
  fireEvent.click(screen.getByText('Next'));
  fireEvent.change(screen.getByLabelText(/Notes/), { target: { value: ' Sleepy after ' } });
  fireEvent.click(screen.getByText('Save seizure'));
  expect(addEntry).toHaveBeenCalledWith('c1', expect.objectContaining({
    durationSec: 80, seizureType: 'focal', rescueMedGiven: true, triggers: ['illness'], note: 'Sleepy after',
  }));
});

it('saves straight after Stop with unanswered steps defaulted', () => {
  render(<LogSeizure {...props()} />);
  fireEvent.click(screen.getByText('Stop'));
  fireEvent.click(screen.getByText('Save seizure'));
  expect(addEntry).toHaveBeenCalledWith('c1', expect.objectContaining({
    seizureType: 'unknown', rescueMedGiven: false, triggers: [],
  }));
});

it('keeps the earlier answer when going back', () => {
  render(<LogSeizure {...props()} />);
  fireEvent.click(screen.getByText('Stop'));
  fireEvent.click(screen.getByRole('button', { name: /^Absence/ }));
  fireEvent.click(screen.getByText('← Back'));
  expect(screen.getByRole('button', { name: /^Absence/ }).getAttribute('aria-pressed')).toBe('true');
});

it('shows each type with a short summary and a full guide behind the info button', () => {
  render(<LogSeizure {...props()} />);
  fireEvent.click(screen.getByText('Stop'));
  expect(screen.getByRole('button', { name: /^Atonic/ }).textContent).toMatch(/goes limp/);
  fireEvent.click(screen.getByRole('button', { name: 'About seizure types' }));
  const guide = screen.getByRole('dialog', { name: 'About seizure types' });
  expect(guide.textContent).toMatch(/postictal/);
  expect(guide.textContent).toMatch(/longer than 5 minutes/);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('records a seizure that happened during sleep', () => {
  render(<LogSeizure {...props()} />);
  fireEvent.click(screen.getByText('Stop'));
  fireEvent.click(screen.getByText('Skip →'));
  fireEvent.click(screen.getByText('Skip →'));
  fireEvent.click(screen.getByText('Next'));
  fireEvent.click(screen.getByRole('button', { name: /asleep/ }));
  fireEvent.click(screen.getByText('Save seizure'));
  expect(addEntry.mock.lastCall[1].duringSleep).toBe(true);
});

it('opens emergency info over the timer without stopping it', () => {
  render(<LogSeizure {...{ ...props(), circle: { id: 'c1', profile: { allergies: 'Penicillin' } } }} />);
  fireEvent.click(screen.getByText('Emergency info'));
  expect(screen.getByRole('dialog', { name: 'Emergency info' }).textContent).toMatch(/Penicillin/);
  act(() => vi.advanceTimersByTime(3_000));
  expect(screen.getByText('00:03')).toBeTruthy();
});
