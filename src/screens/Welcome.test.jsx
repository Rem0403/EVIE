// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('../data/circles.js', () => ({ createCircle: vi.fn(), joinCircleByCode: vi.fn() }));
vi.mock('../data/demo.js', () => ({ seedDemo: vi.fn() }));

import Welcome from './Welcome.jsx';
import { createCircle, joinCircleByCode } from '../data/circles.js';
import { seedDemo } from '../data/demo.js';

function goOffline() {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

it('opens on the EVIE name, what it stands for, and the two ways in', () => {
  render(<Welcome uid="u1" onJoined={vi.fn()} />);
  expect(screen.getByRole('heading', { level: 1, name: 'EVIE' })).toBeTruthy();
  expect(document.querySelector('.welcome-sub').textContent).toBe('Event Video & Information Exchange');
  expect(screen.getByRole('button', { name: 'Start a care circle' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Join with a code' })).toBeTruthy();
});

it('starts a circle with guided setup, and shows the invite code once it is made', async () => {
  const circle = { id: 'c1', personName: 'Maya', joinCode: 'MAYA-7KQ4-M2XP' };
  createCircle.mockResolvedValue(circle);
  const onJoined = vi.fn();
  render(<Welcome uid="u1" onJoined={onJoined} />);
  fireEvent.click(screen.getByText('Start a care circle'));
  expect(screen.getByText('Step 1 of 4')).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Choose an icon for the circle' })).toBeTruthy();
  fireEvent.click(screen.getByText('Next'));
  fireEvent.change(screen.getByPlaceholderText('e.g. Remy'), { target: { value: 'Remy' } });
  fireEvent.change(screen.getByPlaceholderText('Their first name'), { target: { value: 'Maya' } });
  fireEvent.click(screen.getByText('Next'));
  fireEvent.click(screen.getByText('Skip for now'));
  fireEvent.click(screen.getByText('Skip and create circle'));
  expect(await screen.findByText('Circle created')).toBeTruthy();
  expect(screen.getByLabelText('Join code').textContent).toBe('MAYA-7KQ4-M2XP');
  fireEvent.click(screen.getByText('Go to timeline'));
  expect(onJoined).toHaveBeenCalledWith(circle, 'Remy');
});

it('says offline rather than "No circle found" when joining without a connection', () => {
  goOffline();
  render(<Welcome uid="u1" onJoined={vi.fn()} />);
  fireEvent.click(screen.getByText('Join with a code'));
  fireEvent.change(screen.getByPlaceholderText('MAYA-7KQ4-M2XP'), { target: { value: 'MAYA-7KQ4-M2XP' } });
  fireEvent.change(screen.getByPlaceholderText('e.g. Mom'), { target: { value: 'Mom' } });
  fireEvent.click(screen.getByText('Join circle'));
  expect(screen.getByText(/You're offline/)).toBeTruthy();
  expect(screen.queryByText('No circle found with that code.')).toBeNull();
  expect(joinCircleByCode).not.toHaveBeenCalled();
});

it('shows a notice from before, and links to privacy and clearing this phone', () => {
  const onPrivacy = vi.fn();
  const onClearPhone = vi.fn();
  render(<Welcome uid="u1" onJoined={vi.fn()} notice="You left Maya's circle." onPrivacy={onPrivacy} onClearPhone={onClearPhone} />);
  expect(screen.getByRole('status').textContent).toBe("You left Maya's circle.");
  fireEvent.click(screen.getByText('Privacy'));
  expect(onPrivacy).toHaveBeenCalled();
  fireEvent.click(screen.getByText('Clear EVIE data from this phone'));
  expect(onClearPhone).toHaveBeenCalled();
});

it('opens an invite link on the join form with the code filled in', () => {
  render(<Welcome uid="u1" onJoined={vi.fn()} inviteCode="MAYA-7KQ4-M2XP" />);
  expect(screen.getByRole('heading', { name: 'Join a care circle' })).toBeTruthy();
  expect(screen.getByPlaceholderText('MAYA-7KQ4-M2XP').value).toBe('MAYA-7KQ4-M2XP');
});

it('starts a demo circle with sample data in one tap', async () => {
  const circle = { id: 'c1', personName: 'Maya', joinCode: 'MAYA-7KQ4-M2XP' };
  createCircle.mockResolvedValue(circle);
  seedDemo.mockResolvedValue();
  const onJoined = vi.fn();
  render(<Welcome uid="u1" onJoined={onJoined} />);
  fireEvent.click(screen.getByText('Try a demo with sample data'));
  await waitFor(() => expect(onJoined).toHaveBeenCalledWith(circle, 'You', true));
  expect(seedDemo).toHaveBeenCalledWith(circle, { uid: 'u1', name: 'You' });
});

it('shows why Google sign-in failed, and who is signed in once it worked', async () => {
  const onGoogle = vi.fn().mockResolvedValue('Allow pop-ups for EVIE, then try again.');
  render(<Welcome uid="u1" onJoined={vi.fn()} onGoogle={onGoogle} />);
  fireEvent.click(screen.getByText('Continue with Google'));
  expect(await screen.findByText('Allow pop-ups for EVIE, then try again.')).toBeTruthy();
  cleanup();
  const onSignOut = vi.fn();
  render(<Welcome uid="u1" onJoined={vi.fn()} email="remy@example.com" onSignOut={onSignOut} />);
  expect(screen.getByText(/Signed in with Google as remy@example.com/)).toBeTruthy();
  expect(screen.queryByText('Continue with Google')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  expect(onSignOut).toHaveBeenCalled();
});
