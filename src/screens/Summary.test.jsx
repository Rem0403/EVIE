// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('../lib/export.js', () => ({
  downloadBlob: vi.fn(), downloadSummaryPdf: vi.fn(), entriesCsv: vi.fn(() => ''), fileDate: () => '2026-09-30',
}));

import Summary from './Summary.jsx';

afterEach(cleanup);

const base = { circle: { id: 'c1', personName: 'Maya' }, entries: [], onDaysChange: vi.fn(), onBack: vi.fn(), onOpen: vi.fn() };

it('asks for its range plus the one before, and holds exports until that history is here', () => {
  const onNeedHistory = vi.fn();
  render(<Summary {...base} days={90} loadedDays={30} onNeedHistory={onNeedHistory} />);
  expect(onNeedHistory).toHaveBeenCalledWith(210);
  expect(screen.getByText('Loading 210 days of history…')).toBeTruthy();
  expect(screen.getByText('Download PDF').disabled).toBe(true);
  expect(screen.getByText('CSV').disabled).toBe(true);
  expect(screen.queryByText('Patterns')).toBeNull();
});

it('shows the summary once enough history has loaded', () => {
  render(<Summary {...base} days={30} loadedDays={90} onNeedHistory={vi.fn()} />);
  expect(screen.getByText('Patterns')).toBeTruthy();
  expect(screen.getByText('Download PDF').disabled).toBe(false);
});
