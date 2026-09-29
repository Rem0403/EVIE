import { describe, expect, it, vi } from 'vitest';

vi.mock('./mediaStore.js', () => ({ putMedia: vi.fn(() => Promise.resolve()), getMedia: vi.fn(), deleteMedia: vi.fn(() => Promise.resolve()) }));

import { checkFiles, formatBytes, kindOf, mediaKey, saveAttachments } from './attachments.js';
import { putMedia } from './mediaStore.js';

const file = (name, size, type = '') => ({ name, size, type });

describe('kindOf', () => {
  it('tells images, PDFs and other files apart', () => {
    expect(kindOf('image/png', 'rash.png')).toBe('image');
    expect(kindOf('application/pdf', 'plan.pdf')).toBe('pdf');
    expect(kindOf('', 'Seizure plan.PDF')).toBe('pdf');
    expect(kindOf('application/msword', 'letter.doc')).toBe('file');
  });
});

describe('formatBytes', () => {
  it('reads like a person would write it', () => {
    expect(formatBytes(900)).toBe('900 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(25 * 1024 * 1024)).toBe('25 MB');
    expect(formatBytes(0)).toBe('');
  });
});

describe('checkFiles', () => {
  it('rejects files over the size limit, and anything past the file limit, with reasons', () => {
    const { accepted, rejected } = checkFiles(8, [file('a.pdf', 10), file('big.mov', 30 * 1024 * 1024), file('b.pdf', 10), file('c.pdf', 10)]);
    expect(accepted.map((f) => f.name)).toEqual(['a.pdf', 'b.pdf']);
    expect(rejected.map((r) => r.reason)).toEqual([
      'big.mov is too large (max 25 MB).',
      "c.pdf wasn't added: the limit is 10 files.",
    ]);
  });
});

describe('saveAttachments', () => {
  it('stores each file on this phone and returns only the list for Firestore', async () => {
    const saved = await saveAttachments([file('plan.pdf', 2048, 'application/pdf')]);
    expect(saved).toEqual([{ id: expect.any(String), name: 'plan.pdf', type: 'application/pdf', size: 2048 }]);
    expect(putMedia).toHaveBeenCalledWith(mediaKey(saved[0].id), expect.objectContaining({ name: 'plan.pdf' }));
  });
});
