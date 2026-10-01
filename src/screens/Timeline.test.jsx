// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../data/entries.js', () => ({ addEntriesBatch: vi.fn(), addEntry: vi.fn() }));
vi.mock('../data/circles.js', () => ({ updateCircle: vi.fn() }));
vi.mock('../data/resources.js', () => ({ addResource: vi.fn() }));

import Timeline from './Timeline.jsx';

afterEach(cleanup);

const props = { circle: { id: 'c1', personName: 'Evie', joinCode: 'ABC123' }, me: { uid: 'u1', name: 'Remy' }, entries: [] };

it('shows placeholder cards, not "Nothing logged yet", while entries are still loading', () => {
  const { container } = render(<Timeline {...props} loading />);
  expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
  expect(screen.queryByText(/Nothing logged yet/)).toBeNull();
});

it('shows the empty message once loaded with no entries', () => {
  const { container } = render(<Timeline {...props} loading={false} />);
  expect(container.querySelector('.skeleton')).toBeNull();
  expect(screen.getByText(/Nothing logged yet/)).toBeTruthy();
});

it('shows everything until a type chip is chosen, and clears it on a second tap', () => {
  const entries = [
    { id: 'a', type: 'seizure', occurredAt: Date.now() - 1000, durationSec: 30, createdByName: 'Mom' },
    { id: 'b', type: 'note', occurredAt: Date.now() - 2000, note: 'Calm afternoon', createdByName: 'Dad' },
  ];
  render(<Timeline {...props} entries={entries} loading={false} />);
  expect(screen.queryByRole('button', { name: 'All' })).toBeNull();
  expect(screen.getByText('Calm afternoon')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Seizures' }));
  expect(screen.queryByText('Calm afternoon')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Seizures' }));
  expect(screen.getByText('Calm afternoon')).toBeTruthy();
});

it('keeps Emergency info on home', () => {
  render(<Timeline {...props} loading={false} />);
  expect(screen.getByRole('button', { name: /Emergency info/ })).toBeTruthy();
});

it('shows a still loading placeholder, marked busy', () => {
  const { container } = render(<Timeline {...props} loading />);
  expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
});

it('guides a new circle with a checklist instead of empty cards', () => {
  localStorage.clear();
  const onCarePlan = vi.fn();
  const onInvite = vi.fn();
  render(<Timeline {...props} loading={false} onCarePlan={onCarePlan} onInvite={onInvite} />);
  expect(screen.getByText('Getting started')).toBeTruthy();
  for (const step of ['Add daily medications', 'Add emergency contacts and the seizure plan', 'Invite family and caregivers', 'Log something']) {
    expect(screen.getByText(step)).toBeTruthy();
  }
  // The Seizures and Sleep tiles stay; the medication prompt and handoff card wait while the checklist covers them.
  expect(screen.getByText('None logged')).toBeTruthy(); // the Seizures tile
  expect(screen.getByText('Not logged')).toBeTruthy(); // the Sleep tile
  expect(screen.queryByText('Add the daily medication schedule')).toBeNull();
  expect(screen.queryByText(/Who’s with/)).toBeNull();
  fireEvent.click(screen.getByText('Add daily medications'));
  expect(onCarePlan).toHaveBeenCalled();
  fireEvent.click(screen.getByText('Invite family and caregivers'));
  expect(onInvite).toHaveBeenCalled();
});

it('leaves out what is already set up, and remembers Hide for this circle', () => {
  localStorage.clear();
  const circle = { ...props.circle, meds: [{ name: 'Keppra', dose: '', times: ['08:00'] }], memberIds: ['u1', 'u2'] };
  const { unmount } = render(<Timeline {...props} circle={circle} loading={false} />);
  expect(screen.queryByText('Add daily medications')).toBeNull(); // done: there's a schedule
  expect(screen.queryByText('Invite family and caregivers')).toBeNull(); // done: two members
  expect(screen.getByText('Log something')).toBeTruthy();
  expect(screen.getByText('Medications')).toBeTruthy(); // today's doses, since there's a schedule
  fireEvent.click(screen.getByText('Hide this list'));
  expect(screen.queryByText('Getting started')).toBeNull();
  unmount();
  render(<Timeline {...props} circle={circle} loading={false} />);
  expect(screen.queryByText('Getting started')).toBeNull();
});

it('offers older entries only when the circle is older than what is loaded', () => {
  const onShowOlder = vi.fn();
  const old = { ...props.circle, createdAt: Date.now() - 400 * 24 * 3600 * 1000 };
  render(<Timeline {...props} circle={old} loading={false} historyDays={30} onShowOlder={onShowOlder} />);
  expect(screen.getByText('Nothing logged in the last 30 days.')).toBeTruthy();
  expect(screen.getByText('Showing the last 30 days.')).toBeTruthy();
  fireEvent.click(screen.getByText('Show older entries'));
  expect(onShowOlder).toHaveBeenCalledWith(90);
  cleanup();
  render(<Timeline {...props} circle={{ ...props.circle, createdAt: Date.now() - 1000 }} loading={false} historyDays={30} onShowOlder={onShowOlder} />);
  expect(screen.queryByText('Show older entries')).toBeNull();
  expect(screen.getByText(/Nothing logged yet/)).toBeTruthy();
});

it('drops the checklist once everything is done', () => {
  localStorage.clear();
  const circle = {
    ...props.circle, memberIds: ['u1', 'u2'], meds: [{ name: 'Keppra', dose: '', times: ['08:00'] }],
    profile: { rescuePlan: 'Call 911 at 5 minutes', contacts: [{ name: 'Mom', role: 'family', phone: '555-0101' }] },
  };
  const entries = [{ id: 'a', type: 'note', occurredAt: Date.now() - 1000, note: 'First', createdByName: 'Mom' }];
  render(<Timeline {...props} circle={circle} entries={entries} loading={false} />);
  expect(screen.queryByText('Getting started')).toBeNull();
  expect(screen.getByText(/Who’s with/)).toBeTruthy();
});
