// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../data/circles.js', () => ({ updateCircle: vi.fn(() => Promise.resolve()) }));

import CarePlan from './CarePlan.jsx';
import { updateCircle } from '../data/circles.js';

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

const circle = { id: 'c1', personName: 'Maya' };

it('saves diagnoses, communication, notes and the medication schedule', () => {
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

  expect(updateCircle).toHaveBeenCalledWith('c1', {
    profile: { diagnoses: ['epilepsy', 'autism'], diagnosisOther: '', communication: 'non_speaking', helps: 'Headphones', avoid: '' },
    meds: [{ name: 'Keppra', dose: '250 mg', times: ['08:00', '20:00'] }],
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

it("warns before replacing a plan someone else saved meanwhile", () => {
  const { rerender } = render(<CarePlan circle={circle} onDone={vi.fn()} />);
  fireEvent.click(screen.getByText('Autism'));
  rerender(<CarePlan circle={{ ...circle, meds: [{ name: 'Keppra', dose: '', times: ['08:00'] }] }} onDone={vi.fn()} />);
  fireEvent.click(screen.getByText('Save'));
  expect(screen.getByRole('alert').textContent).toMatch(/Someone else changed the care plan/);
  expect(updateCircle).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Save mine anyway'));
  expect(updateCircle).toHaveBeenCalled();
});

it('does not warn when only the key order of the saved plan changed', () => {
  const saved = { ...circle, profile: { diagnoses: ['adhd'], helps: 'Music' } };
  const { rerender } = render(<CarePlan circle={saved} onDone={vi.fn()} />);
  rerender(<CarePlan circle={{ ...circle, profile: { helps: 'Music', diagnoses: ['adhd'] } }} onDone={vi.fn()} />);
  fireEvent.click(screen.getByText('Save'));
  expect(updateCircle).toHaveBeenCalled();
});

it('starts from the saved plan', () => {
  render(<CarePlan circle={{ ...circle, profile: { diagnoses: ['adhd'] }, meds: [{ name: 'Melatonin', dose: '', times: ['19:30'] }] }} onDone={vi.fn()} />);
  expect(screen.getByText('ADHD').getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByLabelText('Medication').value).toBe('Melatonin');
});
