// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('../data/entries.js', () => ({ addEntriesBatch: vi.fn() }));

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
