import { describe, it, expect } from 'vitest';
import { validateClip, videoTypeOf, MAX_CLIP_BYTES } from './validate.js';

describe('validateClip', () => {
  it('accepts a normal video', () => {
    expect(validateClip({ type: 'video/mp4', size: 5_000_000 })).toBeNull();
    expect(validateClip({ type: 'video/quicktime', size: MAX_CLIP_BYTES })).toBeNull();
  });
  it('rejects a missing file', () => expect(validateClip(null)).toBe('No file selected.'));
  it('rejects a non-video', () => expect(validateClip({ type: 'image/jpeg', size: 100 })).toBe("That file isn't a video."));
  it('rejects an oversized clip', () => {
    expect(validateClip({ type: 'video/mp4', size: MAX_CLIP_BYTES + 1 })).toBe('That clip is too large (max 100 MB). Trim it to just the seizure and try again.');
  });
  it('accepts a video whose type the browser left blank, going by its extension', () => {
    expect(validateClip({ type: '', name: 'IMG_0042.MOV', size: 5_000_000 })).toBeNull();
  });
  it('rejects a blank-type file without a video extension', () => {
    expect(validateClip({ type: '', name: 'notes.txt', size: 100 })).toBe("That file isn't a video.");
  });
  it('allows typical 1-2 minute phone clips', () => {
    expect(MAX_CLIP_BYTES).toBeGreaterThanOrEqual(100 * 1024 * 1024);
  });
});

describe('videoTypeOf', () => {
  it('keeps a real video type', () => expect(videoTypeOf({ type: 'video/webm', name: 'a.mp4' })).toBe('video/webm'));
  it('infers from the extension when type is blank', () => {
    expect(videoTypeOf({ type: '', name: 'clip.mov' })).toBe('video/quicktime');
    expect(videoTypeOf({ type: '', name: 'clip.mp4' })).toBe('video/mp4');
  });
  it('returns null for non-videos', () => expect(videoTypeOf({ type: '', name: 'clip' })).toBeNull());
});

