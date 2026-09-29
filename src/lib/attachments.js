import { deleteMedia, getMedia, putMedia } from './mediaStore.js';

// Attachments (photos, PDFs, documents) live only on the phone that added them, like clips.
// Firestore keeps just the list: [{ id, name, type, size }], plus whose phone has the files.
export const MAX_ATTACHMENTS = 10;
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
export const ATTACHMENT_ACCEPT = 'image/*,application/pdf,.pdf,.doc,.docx,.txt,.rtf';

export const mediaKey = (id) => `file:${id}`;

export function kindOf(type = '', name = '') {
  if (type.startsWith('image/')) return 'image';
  if (type === 'application/pdf' || /\.pdf$/i.test(name)) return 'pdf';
  return 'file';
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const v = bytes / 1024 ** exp;
  return `${v >= 10 || exp === 0 ? v.toFixed(0) : v.toFixed(1)} ${units[exp]}`;
}

// Which new files fit: under the size limit, and no more than the total allowed.
export function checkFiles(existingCount, files, { maxFiles = MAX_ATTACHMENTS, maxBytes = MAX_ATTACHMENT_BYTES } = {}) {
  const accepted = [];
  const rejected = [];
  for (const file of files) {
    if (file.size > maxBytes) rejected.push({ file, reason: `${file.name} is too large (max ${formatBytes(maxBytes)}).` });
    else if (existingCount + accepted.length >= maxFiles) rejected.push({ file, reason: `${file.name} wasn't added: the limit is ${maxFiles} files.` });
    else accepted.push(file);
  }
  return { accepted, rejected };
}

const newId = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);

// Stores the files on this phone and returns the list to save on the entry or care plan.
export async function saveAttachments(files) {
  const saved = [];
  for (const file of files) {
    const id = newId();
    await putMedia(mediaKey(id), file);
    saved.push({ id, name: file.name, type: file.type || '', size: file.size });
  }
  return saved;
}

export const loadAttachment = (id) => getMedia(mediaKey(id));
export const removeAttachment = (id) => deleteMedia(mediaKey(id)).catch(() => {});
