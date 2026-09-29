// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../data/circles.js', () => ({ createCircle: vi.fn(), joinCircleByCode: vi.fn() }));

import Welcome from './Welcome.jsx';
import { createCircle, joinCircleByCode } from '../data/circles.js';

function goOffline() {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

it('opens on the E.V.I.E. name, what it stands for, and the two ways in', () => {
  render(<Welcome uid="u1" onJoined={vi.fn()} />);
  expect(screen.getByRole('heading', { level: 1, name: 'E.V.I.E.' })).toBeTruthy();
  expect(document.querySelector('.welcome-sub').textContent).toBe('Event Video & Information Exchange');
  expect(screen.getByRole('button', { name: 'Start a care circle' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Join with a code' })).toBeTruthy();
});

it('tells the user they are offline instead of hanging on "Creating…"', () => {
  goOffline();
  render(<Welcome uid="u1" onJoined={vi.fn()} />);
  fireEvent.click(screen.getByText('Start a care circle'));
  fireEvent.change(screen.getByPlaceholderText('e.g. Remy'), { target: { value: 'Remy' } });
  fireEvent.change(screen.getByPlaceholderText('Their first name'), { target: { value: 'Evie' } });
  fireEvent.click(screen.getByText('Create circle'));
  expect(screen.getByText(/You're offline/)).toBeTruthy();
  expect(createCircle).not.toHaveBeenCalled();
});

it('says offline rather than "No circle found" when joining without a connection', () => {
  goOffline();
  render(<Welcome uid="u1" onJoined={vi.fn()} />);
  fireEvent.click(screen.getByText('Join with a code'));
  fireEvent.change(screen.getByPlaceholderText('EVIE-7KQ4-M2XP'), { target: { value: 'EVIE-7KQ4-M2XP' } });
  fireEvent.change(screen.getByPlaceholderText('e.g. Mom'), { target: { value: 'Mom' } });
  fireEvent.click(screen.getByText('Join circle'));
  expect(screen.getByText(/You're offline/)).toBeTruthy();
  expect(screen.queryByText('No circle found with that code.')).toBeNull();
  expect(joinCircleByCode).not.toHaveBeenCalled();
});
