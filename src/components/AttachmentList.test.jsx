// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('../lib/attachments.js', async (orig) => ({ ...(await orig()), loadAttachment: vi.fn() }));
vi.mock('../lib/export.js', () => ({ shareOrDownload: vi.fn(() => Promise.resolve()) }));

import AttachmentList from './AttachmentList.jsx';
import { loadAttachment } from '../lib/attachments.js';

URL.createObjectURL = vi.fn(() => 'blob:x');
URL.revokeObjectURL = vi.fn();
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const items = [{ id: 'd1', name: 'Seizure plan.pdf', type: 'application/pdf', size: 2048, on: 'Mom' }];

it('opens and shares a file saved on this phone', async () => {
  loadAttachment.mockResolvedValue(new Blob(['%PDF'], { type: 'application/pdf' }));
  render(<AttachmentList items={items} />);
  expect((await screen.findByRole('link', { name: 'Open Seizure plan.pdf' })).getAttribute('href')).toBe('blob:x');
  expect(screen.getByRole('button', { name: 'Share Seizure plan.pdf' })).toBeTruthy();
});

it("says whose phone has a file that isn't on this one", async () => {
  loadAttachment.mockResolvedValue(undefined);
  render(<AttachmentList items={items} />);
  expect(await screen.findByText('Saved on Mom’s phone')).toBeTruthy();
  expect(screen.queryByRole('link', { name: /Open/ })).toBeNull();
});
