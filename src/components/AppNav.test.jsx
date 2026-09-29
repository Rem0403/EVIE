// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../data/entries.js', () => ({ addEntriesBatch: vi.fn() }));
vi.mock('../data/circles.js', () => ({ updateCircle: vi.fn() }));
vi.mock('../data/resources.js', () => ({ addResource: vi.fn() }));

import AppNav from './AppNav.jsx';

const handlers = () => ({
  onHome: vi.fn(), onSummary: vi.fn(), onSeizure: vi.fn(), onQuickLog: vi.fn(),
  onCarePlan: vi.fn(), onSchedule: vi.fn(), onSupport: vi.fn(), onLeave: vi.fn(),
});
const base = { circle: { id: 'c1', personName: 'Maya', joinCode: 'EVIE-7KQ4-M2XP' }, me: { uid: 'u1', name: 'Remy' } };

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.palette;
});
afterEach(cleanup);

it('puts Seizure, Log, Care summary and More one tap away, and marks the current screen', () => {
  const h = handlers();
  render(<AppNav {...base} {...h} active="summary" />);
  fireEvent.click(screen.getByRole('button', { name: 'Start seizure timer' }));
  expect(h.onSeizure).toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Care summary' }).getAttribute('aria-current')).toBe('page');
  fireEvent.click(screen.getByRole('button', { name: 'Log something' }));
  fireEvent.click(screen.getByText('Behavior'));
  expect(h.onQuickLog).toHaveBeenCalledWith('behavior');
});

it('opens care plan, schedule and support from More', () => {
  const h = handlers();
  render(<AppNav {...base} {...h} active="home" />);
  fireEvent.click(screen.getByRole('button', { name: 'More' }));
  fireEvent.click(screen.getByText('Caregiver schedule'));
  expect(h.onSchedule).toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('lets the viewer choose Light or Dark regardless of the phone setting', () => {
  render(<AppNav {...base} {...handlers()} active="home" />);
  fireEvent.click(screen.getByRole('button', { name: 'More' }));
  fireEvent.click(screen.getByText('Light'));
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(screen.getByRole('radiogroup', { name: 'Mode' })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Light' }).getAttribute('aria-checked')).toBe('true');
  fireEvent.click(screen.getByText('System'));
  expect(document.documentElement.dataset.theme).toBeUndefined();
});

it('offers soothing color palettes alongside light and dark', () => {
  render(<AppNav {...base} {...handlers()} active="home" />);
  fireEvent.click(screen.getByRole('button', { name: 'More' }));
  fireEvent.click(screen.getByText('Soft blue'));
  expect(document.documentElement.dataset.palette).toBe('blue');
  fireEvent.click(screen.getByText('Dark'));
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(document.documentElement.dataset.palette).toBe('blue');
});
