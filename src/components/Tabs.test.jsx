// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import Tabs, { tabPanelProps } from './Tabs.jsx';

afterEach(cleanup);

const OPTIONS = [[7, '7 days'], [30, '30 days'], [90, '90 days']];
function Harness() {
  const [days, setDays] = useState(30);
  return (
    <>
      <Tabs id="range" label="Date range" options={OPTIONS} value={days} onChange={setDays} />
      <div {...tabPanelProps('range', days)}>Showing {days} days</div>
    </>
  );
}

it('is a labelled tab list linked to its panel', () => {
  render(<Harness />);
  expect(screen.getByRole('tablist', { name: 'Date range' })).toBeTruthy();
  const selected = screen.getByRole('tab', { name: '30 days' });
  expect(selected.getAttribute('aria-selected')).toBe('true');
  expect(selected.tabIndex).toBe(0);
  expect(screen.getByRole('tab', { name: '7 days' }).tabIndex).toBe(-1);
  expect(screen.getByRole('tabpanel', { name: '30 days' }).textContent).toBe('Showing 30 days');
});

it('selects with a tap', () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole('tab', { name: '90 days' }));
  expect(screen.getByRole('tabpanel').textContent).toBe('Showing 90 days');
});

it('moves with arrow keys, wrapping around, plus Home and End', () => {
  render(<Harness />);
  const list = screen.getByRole('tablist');
  fireEvent.keyDown(list, { key: 'ArrowRight' });
  expect(screen.getByRole('tab', { name: '90 days' }).getAttribute('aria-selected')).toBe('true');
  expect(document.activeElement).toBe(screen.getByRole('tab', { name: '90 days' }));
  fireEvent.keyDown(list, { key: 'ArrowRight' });
  expect(screen.getByRole('tab', { name: '7 days' }).getAttribute('aria-selected')).toBe('true');
  fireEvent.keyDown(list, { key: 'End' });
  expect(screen.getByRole('tabpanel').textContent).toBe('Showing 90 days');
  fireEvent.keyDown(list, { key: 'Home' });
  expect(screen.getByRole('tabpanel').textContent).toBe('Showing 7 days');
});
