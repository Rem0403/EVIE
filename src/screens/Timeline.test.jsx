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

it('keeps Start seizure on home and moves care plan, schedule and support into More', () => {
  const onCarePlan = vi.fn();
  render(<Timeline {...props} loading={false} onCarePlan={onCarePlan} onSchedule={vi.fn()} onSupport={vi.fn()} />);
  expect(screen.getByRole('button', { name: /Start seizure/ })).toBeTruthy();
  expect(screen.getByRole('button', { name: /Emergency info/ })).toBeTruthy();
  expect(screen.queryByText('Care plan')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'More' }));
  fireEvent.click(screen.getByText('Care plan'));
  expect(onCarePlan).toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('shows a still loading placeholder, marked busy', () => {
  const { container } = render(<Timeline {...props} loading />);
  expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
});
