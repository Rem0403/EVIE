// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('../data/circles.js', () => ({
  ownerOf: (c) => c.memberIds?.[0] || null,
  listMembers: vi.fn(),
  removeMember: vi.fn(),
  newJoinCode: vi.fn(),
}));

import People from './People.jsx';
import InviteSheet from '../components/InviteCode.jsx';
import { listMembers, newJoinCode, removeMember } from '../data/circles.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

const circle = { id: 'c1', personName: 'Maya', joinCode: 'MAYA-7KQ4-M2XP', memberIds: ['u1', 'u2', 'u3'] };
const members = [{ uid: 'u1', name: 'Remy' }, { uid: 'u2', name: 'Dad' }, { uid: 'u3', name: 'Ms. Lee' }];

it('lets whoever started the circle remove someone, and shows the new code', async () => {
  listMembers.mockResolvedValue(members);
  removeMember.mockResolvedValue('MAYA-NEWC-ODE2');
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  render(<People circle={circle} me={{ uid: 'u1', name: 'Remy' }} onBack={vi.fn()} onInvite={vi.fn()} />);
  expect(await screen.findByText('Started the circle')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Remove Remy' })).toBeNull(); // never yourself
  fireEvent.click(screen.getByRole('button', { name: 'Remove Ms. Lee' }));
  await waitFor(() => expect(removeMember).toHaveBeenCalledWith(circle, 'u3'));
  expect(await screen.findByText('Ms. Lee was removed. The new join code is MAYA-NEWC-ODE2.')).toBeTruthy();
});

it("doesn't offer Remove to anyone else, and says who can", async () => {
  listMembers.mockResolvedValue(members);
  render(<People circle={circle} me={{ uid: 'u2', name: 'Dad' }} onBack={vi.fn()} onInvite={vi.fn()} />);
  expect(await screen.findByText(/Only Remy, who started the circle, can remove people/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: /^Remove/ })).toBeNull();
});

it('does nothing if the removal is cancelled, and refuses offline', async () => {
  listMembers.mockResolvedValue(members);
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  render(<People circle={circle} me={{ uid: 'u1', name: 'Remy' }} onBack={vi.fn()} onInvite={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Remove Dad' }));
  expect(removeMember).not.toHaveBeenCalled();
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  fireEvent.click(screen.getByRole('button', { name: 'Remove Dad' }));
  expect(screen.getByText(/You're offline/)).toBeTruthy();
  expect(confirm).toHaveBeenCalledTimes(1);
});

it('deletes the circle only for whoever started it, and only after typing the name', async () => {
  listMembers.mockResolvedValue(members);
  const onDeleteCircle = vi.fn();
  const prompt = vi.spyOn(window, 'prompt');
  render(<People circle={circle} me={{ uid: 'u1', name: 'Remy' }} onBack={vi.fn()} onInvite={vi.fn()} onDeleteCircle={onDeleteCircle} />);
  const del = await screen.findByText('Delete this circle for everyone');
  prompt.mockReturnValueOnce(null);
  fireEvent.click(del);
  prompt.mockReturnValueOnce('Mia');
  fireEvent.click(del);
  expect(screen.getByText(/didn’t match “Maya”, so nothing was deleted/)).toBeTruthy();
  expect(onDeleteCircle).not.toHaveBeenCalled();
  prompt.mockReturnValueOnce(' maya ');
  fireEvent.click(del);
  expect(onDeleteCircle).toHaveBeenCalledTimes(1);
  cleanup();
  render(<People circle={circle} me={{ uid: 'u2', name: 'Dad' }} onBack={vi.fn()} onInvite={vi.fn()} onDeleteCircle={onDeleteCircle} />);
  await screen.findByText(/Only Remy/);
  expect(screen.queryByText('Delete this circle for everyone')).toBeNull();
});

it('makes a new code from the invite sheet after confirming', async () => {
  newJoinCode.mockResolvedValue('MAYA-NEWC-ODE2');
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  render(<InviteSheet circle={circle} onClose={vi.fn()} />);
  fireEvent.click(screen.getByText(/Get a new code/));
  await waitFor(() => expect(newJoinCode).toHaveBeenCalledWith(circle));
});
