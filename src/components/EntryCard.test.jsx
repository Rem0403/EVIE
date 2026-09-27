// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
vi.mock('../lib/mediaStore.js', () => ({ getMedia: vi.fn(() => Promise.resolve(new Blob(['x']))) }));
URL.createObjectURL = vi.fn(() => 'blob:local');
URL.revokeObjectURL = vi.fn();

import EntryCard from './EntryCard.jsx';

afterEach(cleanup);

const base = { id: 'e1', type: 'seizure', occurredAt: Date.now(), durationSec: 60, createdByName: 'Remy' };

it('plays an attached clip inline, outside the card button', async () => {
  const { container, findByTestId } = render(<EntryCard entry={{ ...base, clipStatus: 'done', clipOn: 'Remy' }} onClick={vi.fn()} />);
  await findByTestId('media-clip');
  const video = container.querySelector('video');
  expect(video.getAttribute('src')).toBe('blob:local');
  expect(video.getAttribute('preload')).toBe('none');
  expect(video.closest('button')).toBeNull(); // tapping the player must not open the entry
});

it('has no player when there is no clip, and the card still opens the entry', () => {
  const onClick = vi.fn();
  const { container } = render(<EntryCard entry={base} onClick={onClick} />);
  expect(container.querySelector('video')).toBeNull();
  fireEvent.click(container.querySelector('button'));
  expect(onClick).toHaveBeenCalled();
});
