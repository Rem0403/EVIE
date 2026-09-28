// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../data/entries.js', () => ({ addEntry: vi.fn(() => 'n1') }));
vi.mock('../data/clips.js', () => ({ attachMedia: vi.fn(() => Promise.reject(new Error('network'))) }));

import QuickLog from './QuickLog.jsx';
import { addEntry } from '../data/entries.js';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

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

it('logs a behavior with what came before, what helped, length and intensity', () => {
  render(<QuickLog circle={{ id: 'c1' }} me={{ uid: 'u1', name: 'Remy' }} type="behavior" entries={[]} onDone={vi.fn()} />);
  fireEvent.click(screen.getByText('Shutdown'));
  fireEvent.click(screen.getByText('Sensory (noise, light, crowds)'));
  fireEvent.click(screen.getByText('Pain or unwell'));
  fireEvent.click(screen.getByText('Quiet or dim space'));
  fireEvent.click(screen.getByText('5–15 min'));
  fireEvent.click(screen.getByText('Severe'));
  fireEvent.click(screen.getByText('Severe')); // tapping again clears it
  fireEvent.click(screen.getByText('Save'));
  expect(addEntry).toHaveBeenLastCalledWith('c1', expect.objectContaining({
    type: 'behavior', kind: 'shutdown', before: ['sensory', 'pain'], helped: ['quiet'], length: '5to15', intensity: undefined,
  }));
});

it('asks nothing more for a good day', () => {
  render(<QuickLog circle={{ id: 'c1' }} me={{ uid: 'u1', name: 'Remy' }} type="behavior" entries={[]} onDone={vi.fn()} />);
  fireEvent.click(screen.getByText('Good day'));
  expect(screen.queryByText('What happened before? (optional)')).toBeNull();
  fireEvent.click(screen.getByText('Save'));
  expect(addEntry.mock.lastCall[1]).not.toHaveProperty('before');
});

it('refuses a note containing an ID number', () => {
  render(<QuickLog circle={{ id: 'c1' }} me={{ uid: 'u1', name: 'Remy' }} type="note" entries={[]} onDone={vi.fn()} />);
  fireEvent.change(document.querySelector('textarea'), { target: { value: 'SSN 123-45-6789 for the form' } });
  fireEvent.click(screen.getByText('Save'));
  expect(screen.getByText(/Social Security or Medicaid/)).toBeTruthy();
  expect(addEntry).not.toHaveBeenCalled();
});
