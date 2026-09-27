// A seizure being timed survives a reload or an evicted tab (e.g. while the camera app is open).
const KEY = 'evie.seizureDraft';

export function loadSeizureDraft() {
  try {
    const draft = JSON.parse(sessionStorage.getItem(KEY));
    return typeof draft?.startMs === 'number' ? draft : null;
  } catch {
    return null;
  }
}

export function saveSeizureDraft({ startMs, stopMs }) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ startMs, stopMs }));
  } catch {
    /* storage unavailable: draft just won't survive a reload */
  }
}

export function clearSeizureDraft() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
