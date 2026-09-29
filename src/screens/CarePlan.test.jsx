// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('../data/circles.js', () => ({ updateCircle: vi.fn(() => Promise.resolve()) }));
vi.mock('../lib/attachments.js', async (orig) => ({ ...(await orig()), saveAttachments: vi.fn(() => Promise.resolve([])), removeAttachment: vi.fn() }));

import CarePlan from './CarePlan.jsx';
import { updateCircle } from '../data/circles.js';

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

const circle = { id: 'c1', personName: 'Maya' };

it('saves diagnoses, communication, notes and the medication schedule', async () => {
  const onDone = vi.fn();
  render(<CarePlan circle={circle} onDone={onDone} />);
  fireEvent.click(screen.getByText('Epilepsy'));
  fireEvent.click(screen.getByText('Autism'));
  fireEvent.click(screen.getByText('Non-speaking'));
  fireEvent.change(screen.getByLabelText('What helps them'), { target: { value: ' Headphones ' } });
  fireEvent.click(screen.getByText('+ Add medication'));
  fireEvent.change(screen.getByLabelText('Medication'), { target: { value: 'Keppra' } });
  fireEvent.change(screen.getByLabelText('Dose'), { target: { value: '250 mg' } });
  fireEvent.click(screen.getByText('+ Time'));
  fireEvent.change(screen.getByLabelText('Keppra time 2'), { target: { value: '20:00' } });
  fireEvent.click(screen.getByText('Save'));

  await waitFor(() => expect(updateCircle).toHaveBeenCalled());
  expect(updateCircle).toHaveBeenCalledWith('c1', {
    profile: {
      diagnoses: ['epilepsy', 'autism'], diagnosisOther: '', communication: 'non_speaking', helps: 'Headphones', avoid: '',
      allergies: '', rescuePlan: '', routine: '', contacts: [],
    },
    meds: [{ name: 'Keppra', dose: '250 mg', times: ['08:00', '20:00'], purpose: '', notes: '' }],
    documents: [],
  });
  expect(onDone).toHaveBeenCalled();
});

it("doesn't save a medication without a name", () => {
  render(<CarePlan circle={circle} onDone={vi.fn()} />);
  fireEvent.click(screen.getByText('+ Add medication'));
  fireEvent.click(screen.getByText('Save'));
  expect(screen.getByText('Give each medication a name.')).toBeTruthy();
  expect(updateCircle).not.toHaveBeenCalled();
});

it("warns before replacing a plan someone else saved meanwhile", async () => {
  const { rerender } = render(<CarePlan circle={circle} onDone={vi.fn()} />);
  fireEvent.click(screen.getByText('Autism'));
  rerender(<CarePlan circle={{ ...circle, meds: [{ name: 'Keppra', dose: '', times: ['08:00'] }] }} onDone={vi.fn()} />);
  fireEvent.click(screen.getByText('Save'));
  expect(screen.getByRole('alert').textContent).toMatch(/Someone else changed the care plan/);
  expect(updateCircle).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Save mine anyway'));
  await waitFor(() => expect(updateCircle).toHaveBeenCalled());
});

it('does not warn when only the key order of the saved plan changed', async () => {
  const saved = { ...circle, profile: { diagnoses: ['adhd'], helps: 'Music' } };
  const { rerender } = render(<CarePlan circle={saved} onDone={vi.fn()} />);
  rerender(<CarePlan circle={{ ...circle, profile: { helps: 'Music', diagnoses: ['adhd'] } }} onDone={vi.fn()} />);
  fireEvent.click(screen.getByText('Save'));
  await waitFor(() => expect(updateCircle).toHaveBeenCalled());
});

it('starts from the saved plan', () => {
  render(<CarePlan circle={{ ...circle, profile: { diagnoses: ['adhd'] }, meds: [{ name: 'Melatonin', dose: '', times: ['19:30'] }] }} onDone={vi.fn()} />);
  expect(screen.getByText('ADHD').getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByLabelText('Medication').value).toBe('Melatonin');
});

it('saves emergency contacts and details', async () => {
  render(<CarePlan circle={circle} onDone={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Allergies (optional)'), { target: { value: 'Penicillin' } });
  fireEvent.click(screen.getByText('+ Add contact'));
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Dr. Patel' } });
  fireEvent.click(screen.getByText('Neurologist'));
  fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '985-555-0110' } });
  fireEvent.click(screen.getByText('Save'));
  await waitFor(() => expect(updateCircle).toHaveBeenCalled());
  expect(updateCircle.mock.calls[0][1].profile).toMatchObject({
    allergies: 'Penicillin', contacts: [{ name: 'Dr. Patel', role: 'neurologist', phone: '985-555-0110' }],
  });
});

it('refuses to save an ID number, and says why', () => {
  render(<CarePlan circle={circle} onDone={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Daily routine (optional)'), { target: { value: 'Medicaid ID 12345678901' } });
  fireEvent.click(screen.getByText('Save'));
  expect(screen.getByText(/Please don’t save ID numbers like Social Security or Medicaid numbers/)).toBeTruthy();
  expect(updateCircle).not.toHaveBeenCalled();
});

it('adds documents to the care plan, saved on this phone and listed for everyone', async () => {
  const { saveAttachments } = await import('../lib/attachments.js');
  saveAttachments.mockResolvedValueOnce([{ id: 'd1', name: 'Seizure plan.pdf', type: 'application/pdf', size: 2048 }]);
  URL.createObjectURL = vi.fn(() => 'blob:x');
  URL.revokeObjectURL = vi.fn();
  render(<CarePlan circle={circle} me={{ uid: 'u1', name: 'Mom' }} onDone={vi.fn()} />);
  fireEvent.change(document.querySelector('input[type=file]'), { target: { files: [new File(['%PDF'], 'Seizure plan.pdf', { type: 'application/pdf' })] } });
  fireEvent.click(screen.getByText('Save'));
  await waitFor(() => expect(updateCircle).toHaveBeenCalled());
  expect(updateCircle.mock.calls[0][1].documents).toEqual([{ id: 'd1', name: 'Seizure plan.pdf', type: 'application/pdf', size: 2048, on: 'Mom' }]);
});
