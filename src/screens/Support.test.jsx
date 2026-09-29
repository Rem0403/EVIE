// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

vi.mock('../data/resources.js', () => ({ addResource: vi.fn(() => 'r9'), updateResource: vi.fn(), deleteResource: vi.fn() }));

import Support from './Support.jsx';
import ResourceForm from './ResourceForm.jsx';
import FollowUps from '../components/FollowUps.jsx';
import { addResource, deleteResource, updateResource } from '../data/resources.js';
import { GUIDE } from '../lib/supportGuide.js';

const NOW = new Date(2026, 8, 28, 10).getTime();
const circle = { id: 'c1', personName: 'Maya' };
const me = { uid: 'u1', name: 'Mom' };
const waiver = {
  id: 'r1', name: 'Medicaid waiver programs', category: 'services', status: 'waitlisted', phone: '555-0142', url: '',
  email: '', nextStep: 'Call about the waiting list', nextDate: '2026-09-27', note: '', createdBy: 'u2',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ now: NOW });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it('lists resources with an overdue next step and tappable contact links', () => {
  render(<Support circle={circle} resources={[waiver]} onBack={vi.fn()} onAdd={vi.fn()} onEdit={vi.fn()} />);
  const card = document.querySelector('article.resource');
  expect(within(card).getByText('Medicaid waiver programs')).toBeTruthy();
  expect(within(card).getByText(/Next: Call about the waiting list · overdue since Sep 27/)).toBeTruthy();
  expect(within(card).getByText('Call 555-0142').getAttribute('href')).toBe('tel:5550142');
});

it('marks guide items already saved, and saves others prefilled', () => {
  const onAdd = vi.fn();
  render(<Support circle={circle} resources={[waiver]} onBack={vi.fn()} onAdd={onAdd} onEdit={vi.fn()} />);
  fireEvent.click(screen.getByRole('tab', { name: 'Start here' }));
  expect(screen.getByText('✓ In our resources')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Save Call or text 211 to our resources' }));
  expect(onAdd).toHaveBeenCalledWith({ name: 'Call or text 211', category: 'services', url: 'https://www.211.org/' });
});

it('only links the guide to https sites', () => {
  for (const item of GUIDE.flatMap((s) => s.items)) if (item.url) expect(item.url).toMatch(/^https:\/\//);
});

it('adds a resource signed by the person adding it', () => {
  const onDone = vi.fn();
  render(<ResourceForm circle={circle} me={me} prefill={{ name: 'Call or text 211', category: 'services', url: 'https://www.211.org/' }} onDone={onDone} />);
  fireEvent.click(screen.getByText('Using now'));
  fireEvent.change(screen.getByLabelText('Notes (optional)'), { target: { value: 'Found respite list' } });
  fireEvent.click(screen.getByText('Save'));
  expect(addResource).toHaveBeenCalledWith('c1', {
    name: 'Call or text 211', category: 'services', status: 'using', phone: '', url: 'https://www.211.org/', email: '',
    nextStep: '', nextDate: '', note: 'Found respite list', updatedAt: NOW, updatedByName: 'Mom', createdBy: 'u1', createdByName: 'Mom',
  });
  expect(onDone).toHaveBeenCalled();
});

it("edits without re-signing, refuses unsafe links, and can remove", () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  render(<ResourceForm circle={circle} me={me} resource={waiver} onDone={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Website (optional)'), { target: { value: 'javascript:alert(1)' } });
  fireEvent.click(screen.getByText('Save'));
  expect(screen.getByText('Enter a website like example.org.')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Website (optional)'), { target: { value: 'waiver.example.gov' } });
  fireEvent.click(screen.getByText('Save'));
  const patch = updateResource.mock.calls[0][2];
  expect(patch).toMatchObject({ url: 'https://waiver.example.gov/', updatedByName: 'Mom' });
  expect(patch).not.toHaveProperty('createdBy');
  fireEvent.click(screen.getByText('Remove'));
  expect(deleteResource).toHaveBeenCalledWith('c1', 'r1');
});

it('shows follow-ups due today or earlier on the timeline', () => {
  const onOpen = vi.fn();
  const later = { ...waiver, id: 'r2', name: 'Later', nextDate: '2026-10-09' };
  render(<FollowUps resources={[waiver, later]} now={NOW} onOpen={onOpen} />);
  expect(screen.queryByText('Later')).toBeNull();
  fireEvent.click(screen.getByText('Call about the waiting list'));
  expect(onOpen).toHaveBeenCalledWith('r1');
});

it('opens on the guide for a family with nothing saved yet', () => {
  render(<Support circle={circle} resources={[]} onBack={vi.fn()} onAdd={vi.fn()} onEdit={vi.fn()} />);
  expect(screen.getByRole('tab', { name: 'Start here' }).getAttribute('aria-selected')).toBe('true');
  expect(screen.getByRole('tabpanel', { name: 'Start here' })).toBeTruthy();
});
