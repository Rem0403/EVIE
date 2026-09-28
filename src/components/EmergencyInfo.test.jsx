// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import EmergencyInfo from './EmergencyInfo.jsx';

afterEach(cleanup);

const circle = {
  personName: 'Maya',
  profile: {
    diagnoses: ['epilepsy', 'autism'], communication: 'non_speaking', allergies: 'Penicillin',
    rescuePlan: 'Rescue spray after 5 minutes', helps: 'Headphones',
    contacts: [{ name: 'Dr. Patel', role: 'neurologist', phone: '985-555-0110' }],
  },
  meds: [{ name: 'Keppra', dose: '250 mg', times: ['08:00', '20:00'], purpose: 'seizures', notes: 'with food' }],
};

it('shows the seizure plan, callable contacts, allergies and medications', () => {
  render(<EmergencyInfo circle={circle} />);
  expect(screen.getByText('Call 911').getAttribute('href')).toBe('tel:911');
  expect(screen.getByText('Rescue spray after 5 minutes')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Call Dr. Patel' }).getAttribute('href')).toBe('tel:9855550110');
  expect(screen.getByText('Penicillin')).toBeTruthy();
  expect(screen.getByText('Epilepsy, Autism')).toBeTruthy();
  expect(screen.getByText('Non-speaking')).toBeTruthy();
  expect(screen.getByText(/8:00 AM, 8:00 PM/)).toBeTruthy();
  expect(screen.getByText(/for seizures/)).toBeTruthy();
});

it('points to the care plan when nothing is filled in yet', () => {
  const onEditPlan = vi.fn();
  render(<EmergencyInfo circle={{ personName: 'Maya' }} onEditPlan={onEditPlan} />);
  fireEvent.click(screen.getByText('Open care plan'));
  expect(onEditPlan).toHaveBeenCalled();
  expect(screen.getByText('Call 911')).toBeTruthy();
});
