// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import ProfileSheet from './ProfileSheet.jsx';

afterEach(cleanup);

const circle = { id: 'c1', personName: 'Evie' };
const me = { uid: 'u1', name: 'Remy' };
const props = { circle, me, photo: '', onChangePhoto: vi.fn(), onClose: vi.fn() };

it('shows the Google account and signs out from it', () => {
  const onSignOut = vi.fn();
  render(<ProfileSheet {...props} email="remy@example.com" onGoogle={vi.fn()} onSignOut={onSignOut} />);
  expect(screen.getByText('remy@example.com')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Sign out of Google' }));
  expect(onSignOut).toHaveBeenCalled();
});

it('offers Save with Google when not signed in, and shows why it failed', async () => {
  const onGoogle = vi.fn().mockResolvedValue('Allow pop-ups for EVIE, then try again.');
  render(<ProfileSheet {...props} onGoogle={onGoogle} onSignOut={vi.fn()} />);
  expect(screen.queryByRole('button', { name: 'Sign out of Google' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Save with Google' }));
  expect((await screen.findByRole('alert')).textContent).toBe('Allow pop-ups for EVIE, then try again.');
});
