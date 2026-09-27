// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../data/entries.js', () => ({ addEntry: vi.fn(() => 'n1') }));
vi.mock('../data/clips.js', () => ({ attachMedia: vi.fn(() => Promise.reject(new Error('network'))) }));

import QuickLog from './QuickLog.jsx';
import { addEntry } from '../data/entries.js';

afterEach(cleanup);

it('does not offer Save again after the note saved but its photo failed', async () => {
  render(<QuickLog circle={{ id: 'c1' }} me={{ uid: 'u1', name: 'Remy' }} type="note" entries={[]} onDone={vi.fn()} />);
  fireEvent.change(document.querySelector('textarea'), { target: { value: 'Rash on arm' } });
  fireEvent.change(document.querySelector('input[type=file]'), {
    target: { files: [new File(['x'], 'rash.png', { type: 'image/png' })] },
  });
  fireEvent.click(screen.getByText('Save'));

  expect(await screen.findByText("Couldn't save the photo on this phone. The note is saved without it.")).toBeTruthy();
  expect(screen.queryByText('Save')).toBeNull();
  expect(addEntry).toHaveBeenCalledTimes(1);
});
