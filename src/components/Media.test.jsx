// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('../lib/mediaStore.js', () => ({ getMedia: vi.fn() }));

import Media from './Media.jsx';
import { getMedia } from '../lib/mediaStore.js';

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
