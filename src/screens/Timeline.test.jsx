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
