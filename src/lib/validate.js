export const MAX_CLIP_BYTES = 100 * 1024 * 1024;

const VIDEO_TYPES = {
  mp4: 'video/mp4',
  m4v: 'video/x-m4v',
  mov: 'video/quicktime',
  webm: 'video/webm',
  '3gp': 'video/3gpp',
  mkv: 'video/x-matroska',
};

// Some Android pickers hand over videos with an empty type, so fall back to the extension.
export function videoTypeOf(file) {
  if (file.type?.startsWith('video/')) return file.type;
  const ext = file.name?.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
  return VIDEO_TYPES[ext] || null;
}

export function validateClip(file) {
  if (!file) return 'No file selected.';
  if (!videoTypeOf(file)) return "That file isn't a video.";
  if (file.size > MAX_CLIP_BYTES) return 'That clip is too large (max 100 MB). Trim it to just the seizure and try again.';
  return null;
}
