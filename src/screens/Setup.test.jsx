// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('../data/circles.js', () => ({ createCircle: vi.fn() }));

import Setup from './Setup.jsx';
import { createCircle } from '../data/circles.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

function throughNames() {
  fireEvent.change(screen.getByPlaceholderText('e.g. Remy'), { target: { value: ' Remy ' } });
  fireEvent.change(screen.getByPlaceholderText('Their first name'), { target: { value: 'Maya' } });
  fireEvent.click(screen.getByText('Next'));
}

it('saves the care team and medications with the new circle, in one go', async () => {
  const circle = { id: 'c1', personName: 'Maya', joinCode: 'MAYA-7KQ4-M2XP' };
  createCircle.mockResolvedValue(circle);
  const onCreated = vi.fn();
  render(<Setup uid="u1" onCreated={onCreated} onCancel={vi.fn()} />);
  throughNames();

  expect(screen.getByRole('heading', { name: 'Who helps care for Maya?' })).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ms. Lee' } });
  fireEvent.click(screen.getByText('Caregiver'));
  fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '985-555-0142' } });
  fireEvent.click(screen.getByText('Next'));

  expect(screen.getByRole('heading', { name: 'Maya’s daily medications' })).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Medication'), { target: { value: 'Keppra' } });
  fireEvent.change(screen.getByLabelText('Dose'), { target: { value: '500 mg' } });
  fireEvent.click(screen.getByText('Create circle'));

  await waitFor(() => expect(onCreated).toHaveBeenCalledWith(circle, 'Remy'));
  expect(createCircle).toHaveBeenCalledWith({
    uid: 'u1',
    displayName: 'Remy',
    personName: 'Maya',
    profile: { contacts: [{ name: 'Ms. Lee', role: 'caregiver', phone: '985-555-0142' }] },
    meds: [{ name: 'Keppra', dose: '500 mg', times: ['08:00'], purpose: '', notes: '' }],
  });
});

it('ignores the empty rows it starts with, so skipping adds nothing', async () => {
  createCircle.mockResolvedValue({ id: 'c1' });
  render(<Setup uid="u1" onCreated={vi.fn()} onCancel={vi.fn()} />);
  throughNames();
  fireEvent.click(screen.getByText('Next')); // the blank contact row
  fireEvent.click(screen.getByText('Create circle')); // the blank medication row, with its default 8 AM
  await waitFor(() => expect(createCircle).toHaveBeenCalled());
  expect(createCircle.mock.calls[0][0]).toMatchObject({ profile: undefined, meds: undefined });
});

it('asks for a phone number, since the care team makes up the emergency info', () => {
  render(<Setup uid="u1" onCreated={vi.fn()} onCancel={vi.fn()} />);
  throughNames();
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Grandma' } });
  fireEvent.click(screen.getByText('Next'));
  expect(screen.getByText('Add a phone number for Grandma.')).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Who helps care for Maya?' })).toBeTruthy();
});

it('refuses ID numbers, like the care plan', () => {
  render(<Setup uid="u1" onCreated={vi.fn()} onCancel={vi.fn()} />);
  throughNames();
  fireEvent.click(screen.getByText('Skip for now'));
  fireEvent.change(screen.getByLabelText('Medication'), { target: { value: 'Medicaid ID 12345678901' } });
  fireEvent.click(screen.getByText('Create circle'));
  expect(screen.getByText(/Please don’t save ID numbers/)).toBeTruthy();
  expect(createCircle).not.toHaveBeenCalled();
});

it('tells the user they are offline instead of hanging on "Creating…"', () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  render(<Setup uid="u1" onCreated={vi.fn()} onCancel={vi.fn()} />);
  throughNames();
  fireEvent.click(screen.getByText('Skip for now'));
  fireEvent.click(screen.getByText('Skip and create circle'));
  expect(screen.getByText(/You're offline/)).toBeTruthy();
  expect(createCircle).not.toHaveBeenCalled();
});

it('keeps what was typed when going back a step', () => {
  render(<Setup uid="u1" onCreated={vi.fn()} onCancel={vi.fn()} />);
  throughNames();
  fireEvent.click(screen.getByText('Back'));
  expect(screen.getByPlaceholderText('Their first name').value).toBe('Maya');
});
