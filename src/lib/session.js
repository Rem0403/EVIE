const KEY = 'evie.session';

export function loadSession() {
  try {
    const raw = localStorage.getItem(KEY);
    const s = raw ? JSON.parse(raw) : null;
    return s?.circleId && s?.name ? s : null;
  } catch {
    return null;
  }
}

// demo: the circle was made by "Try a demo" and holds sample data.
export function saveSession({ circleId, name, demo = false }) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ circleId, name, demo }));
  } catch {
    /* private mode: session just won't persist */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
