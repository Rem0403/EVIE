import { afterEach, expect, it, vi } from 'vitest';

vi.mock('../lib/mediaStore.js', () => ({ putMedia: vi.fn(() => Promise.resolve()) }));
vi.mock('./entries.js', () => ({ updateEntry: vi.fn(() => Promise.resolve()) }));
vi.mock('../lib/session.js', () => ({ loadSession: () => ({ circleId: 'c1', name: 'Remy' }) }));

import { attachMedia } from './clips.js';
import { putMedia } from '../lib/mediaStore.js';
import { updateEntry } from './entries.js';

afterEach(() => vi.clearAllMocks());

it('keeps the clip on this phone and records whose phone has it', async () => {
  const file = new File(['x'], 'clip.mov', { type: '' });
  await attachMedia('c1', 'e1', file, 'clip');
  const [key, blob] = putMedia.mock.calls[0];
  expect(key).toBe('clip:e1');
  expect(blob.type).toBe('video/quicktime'); // blank type inferred so the phone can play it back
  expect(updateEntry).toHaveBeenLastCalledWith('c1', 'e1', { clipStatus: 'done', clipOn: 'Remy' });
});

it('marks the clip failed when the phone cannot store it', async () => {
  putMedia.mockRejectedValueOnce(new Error('QuotaExceededError'));
  await expect(attachMedia('c1', 'e1', new File(['x'], 'p.jpg', { type: 'image/jpeg' }), 'photo')).rejects.toThrow();
  expect(updateEntry).toHaveBeenLastCalledWith('c1', 'e1', { photoStatus: 'failed' });
});
