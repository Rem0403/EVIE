import { putMedia } from '../lib/mediaStore.js';
import { loadSession } from '../lib/session.js';
import { updateEntry } from './entries.js';
import { videoTypeOf } from '../lib/validate.js';

const FIELDS = { clip: ['clipStatus', 'clipOn'], photo: ['photoStatus', 'photoOn'] };

// Saves a clip or photo on this phone and records on the entry whose phone has it.
export async function attachMedia(circleId, entryId, file, kind, onProgress) {
  const [statusField, onField] = FIELDS[kind];
  // Playback needs a type, so fill in the inferred one when the browser left it blank.
  const blob = kind === 'clip' ? new Blob([file], { type: videoTypeOf(file) }) : file;
  updateEntry(circleId, entryId, { [statusField]: 'uploading' }).catch(() => {});
  try {
    await putMedia(`${kind}:${entryId}`, blob);
    onProgress?.(1);
    await updateEntry(circleId, entryId, { [statusField]: 'done', [onField]: loadSession()?.name || 'another' });
  } catch (err) {
    updateEntry(circleId, entryId, { [statusField]: 'failed' }).catch(() => {});
    throw err;
  }
}
