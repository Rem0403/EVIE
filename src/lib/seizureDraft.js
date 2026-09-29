// A seizure being logged survives a reload, and the app being closed (phones often close a
// web app in the background, e.g. while the camera is open to film the seizure).
// localStorage rather than sessionStorage, because sessionStorage is lost when the app closes.
// Drafts older than 12 hours are dropped, so a forgotten draft doesn't reopen days later.
const KEY = 'evie.seizureDraft';
const MAX_AGE_MS = 12 * 3600 * 1000;

export function loadSeizureDraft(now = Date.now()) {
  try {
    const draft = JSON.parse(localStorage.getItem(KEY));
    if (typeof draft?.startMs !== 'number') return null;
    if (now - (draft.savedAt ?? draft.startMs) > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

// Everything answered so far: timing, the step, and the answers (not a clip; files can't be stored here).
export function saveSeizureDraft(draft) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    /* storage unavailable: draft just won't survive a reload */
  }
}

export function clearSeizureDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
