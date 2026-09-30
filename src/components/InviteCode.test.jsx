// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../data/circles.js', () => ({ newJoinCode: vi.fn() }));

import InviteSheet from './InviteCode.jsx';

const circle = { personName: 'Maya', joinCode: 'MAYA-7KQ4-M2XP' };

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('shows the code big and copies just the code', async () => {
  const writeText = vi.fn().mockResolvedValue();
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  render(<InviteSheet circle={circle} onClose={vi.fn()} />);
  expect(screen.getByLabelText('Join code').textContent).toBe('MAYA-7KQ4-M2XP');
  fireEvent.click(screen.getByText('Copy code'));
  expect(await screen.findByText('Code copied.')).toBeTruthy();
  expect(writeText).toHaveBeenCalledWith('MAYA-7KQ4-M2XP');
});
