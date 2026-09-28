// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../lib/mediaStore.js', () => ({ getMedia: vi.fn() }));
vi.mock('../lib/export.js', () => ({ shareOrDownload: vi.fn(() => Promise.resolve()) }));

import Media from './Media.jsx';
import { getMedia } from '../lib/mediaStore.js';
import { shareOrDownload } from '../lib/export.js';

URL.createObjectURL = vi.fn(() => 'blob:local');
URL.revokeObjectURL = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const seizure = { id: 'e1', type: 'seizure', clipStatus: 'done', clipOn: 'Remy' };

it('plays a clip saved on this phone', async () => {
  getMedia.mockResolvedValue(new Blob(['x'], { type: 'video/mp4' }));
  const { container } = render(<Media entry={seizure} kind="clip" />);
  await screen.findByTestId('media-clip');
  expect(getMedia).toHaveBeenCalledWith('clip:e1');
  expect(container.querySelector('video').getAttribute('src')).toBe('blob:local');
});

it("says whose phone has the clip when it isn't on this one", async () => {
  getMedia.mockResolvedValue(undefined);
  render(<Media entry={seizure} kind="clip" />);
  expect(await screen.findByText("Clip saved on Remy's phone")).toBeTruthy();
});

it('renders nothing when there is no clip', () => {
  const { container } = render(<Media entry={{ id: 'e2', type: 'seizure', clipStatus: 'none' }} kind="clip" />);
  expect(container.innerHTML).toBe('');
  expect(getMedia).not.toHaveBeenCalled();
});

it('shares a clip saved on this phone, named by date', async () => {
  const blob = new Blob(['x'], { type: 'video/quicktime' });
  getMedia.mockResolvedValue(blob);
  render(<Media entry={{ ...seizure, occurredAt: new Date(2026, 8, 20, 7, 5).getTime() }} kind="clip" shareable />);
  fireEvent.click(await screen.findByText('Share clip'));
  expect(shareOrDownload).toHaveBeenCalledWith(blob, 'EVIE-seizure-2026-09-20-0705.mov');
});

it('offers no share button for a clip on another phone', async () => {
  getMedia.mockResolvedValue(undefined);
  render(<Media entry={seizure} kind="clip" shareable />);
  await screen.findByText("Clip saved on Remy's phone");
  expect(screen.queryByText('Share clip')).toBeNull();
});
