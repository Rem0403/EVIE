// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('../data/entries.js', () => ({ addEntry: vi.fn(() => 'n1') }));
vi.mock('../lib/attachments.js', async (orig) => ({ ...(await orig()), saveAttachments: vi.fn() }));

import QuickLog from './QuickLog.jsx';
import { addEntry } from '../data/entries.js';
import { saveAttachments } from '../lib/attachments.js';

URL.createObjectURL = vi.fn(() => 'blob:x');
URL.revokeObjectURL = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const note = () => render(<QuickLog circle={{ id: 'c1' }} me={{ uid: 'u1', name: 'Remy' }} type="note" entries={[]} onDone={vi.fn()} />);
const pick = (...files) => fireEvent.change(document.querySelector('input[type=file]'), { target: { files } });

it('saves a note with several attached files, recording whose phone has them', async () => {
  saveAttachments.mockResolvedValue([{ id: 'a1', name: 'rash.png', type: 'image/png', size: 3 }, { id: 'a2', name: 'letter.pdf', type: 'application/pdf', size: 5 }]);
  note();
  fireEvent.change(document.querySelector('textarea'), { target: { value: 'Rash on arm' } });
  pick(new File(['abc'], 'rash.png', { type: 'image/png' }), new File(['hello'], 'letter.pdf', { type: 'application/pdf' }));
  expect(screen.getByText('letter.pdf')).toBeTruthy();
  fireEvent.click(screen.getByText('Save'));
  await waitFor(() => expect(addEntry).toHaveBeenCalledTimes(1));
  expect(addEntry.mock.calls[0][1]).toMatchObject({ type: 'note', note: 'Rash on arm', attachmentsOn: 'Remy', attachments: [{ id: 'a1' }, { id: 'a2' }] });
});

it('saves the note without the files, once, if the phone cannot store them', async () => {
  saveAttachments.mockRejectedValue(new Error('quota'));
  note();
  fireEvent.change(document.querySelector('textarea'), { target: { value: 'Rash on arm' } });
  pick(new File(['abc'], 'rash.png', { type: 'image/png' }));
  fireEvent.click(screen.getByText('Save'));
  expect(await screen.findByText(/Couldn.t save the files on this phone/)).toBeTruthy();
  expect(screen.queryByText('Save')).toBeNull();
  expect(addEntry).toHaveBeenCalledTimes(1);
  expect(addEntry.mock.calls[0][1]).not.toHaveProperty('attachments');
});

it('accepts a note that is only an attachment', async () => {
  saveAttachments.mockResolvedValue([{ id: 'a1', name: 'plan.pdf', type: 'application/pdf', size: 5 }]);
  note();
  pick(new File(['hello'], 'plan.pdf', { type: 'application/pdf' }));
  fireEvent.click(screen.getByText('Save'));
  await waitFor(() => expect(addEntry).toHaveBeenCalled());
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

const goals = [
  { id: 'g1', title: 'Ask for more', status: 'active', createdAt: 2 },
  { id: 'g2', title: 'Shoes on', status: 'active', createdAt: 1 },
  { id: 'g3', title: 'Old goal', status: 'met', createdAt: 3 },
];
const goalLog = (extra = {}) => render(
  <QuickLog circle={{ id: 'c1' }} me={{ uid: 'u1', name: 'Remy' }} type="goal" entries={[]} goals={goals} onDone={vi.fn()} {...extra} />,
);

it('logs goal practice against one goal, with how it went, apart from notes', () => {
  goalLog();
  expect(screen.getByRole('heading', { name: 'Log goal' })).toBeTruthy();
  expect(screen.queryByText('Old goal')).toBeNull(); // only goals being worked on
  fireEvent.click(screen.getByText('Save'));
  expect(screen.getByText('Choose which goal.')).toBeTruthy();
  fireEvent.click(screen.getByText('Shoes on'));
  fireEvent.click(screen.getByText('Save'));
  expect(screen.getByText('Choose how it went.')).toBeTruthy();
  fireEvent.click(screen.getByText('With help'));
  fireEvent.click(screen.getByText('Save'));
  expect(addEntry).toHaveBeenCalledWith('c1', expect.objectContaining({
    type: 'goal', goalId: 'g2', goalTitle: 'Shoes on', result: 'help', createdBy: 'u1',
  }));
});

it('starts on the goal it was opened from', () => {
  goalLog({ goalId: 'g1' });
  expect(screen.getByText('Ask for more').getAttribute('aria-pressed')).toBe('true');
});
