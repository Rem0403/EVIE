import { MEDIA_DB } from './mediaStore.js';

// What stays on the phone after it's cleared: only how the app looks.
const KEEP = ['evie.theme', 'evie.palette'];
const NOTICE = 'evie.notice';

// EVIE's own saved settings (session, seizure draft, checklist state), except appearance.
export function clearEvieStorage(storage = localStorage) {
  try {
    const keys = [];
    for (let i = 0; i < storage.length; i++) keys.push(storage.key(i));
    for (const k of keys) if (k?.startsWith('evie.') && !KEEP.includes(k)) storage.removeItem(k);
  } catch {
    /* storage unavailable: nothing saved to clear */
  }
}

// The clips, photos and files kept only on this phone.
export function deleteMediaDatabase(idb = globalThis.indexedDB) {
  return new Promise((resolve) => {
    if (!idb) return resolve(false);
    const req = idb.deleteDatabase(MEDIA_DB);
    req.onsuccess = () => resolve(true);
    req.onerror = () => resolve(false);
    req.onblocked = () => resolve(false); // finishes once the page reloads and nothing holds it open
  });
}

// A message for the welcome screen after the reload that follows clearing.
export function setNextNotice(text) {
  try { sessionStorage.setItem(NOTICE, text); } catch { /* shown nowhere; the phone is still cleared */ }
}

export function takeNotice() {
  try {
    const text = sessionStorage.getItem(NOTICE) || '';
    sessionStorage.removeItem(NOTICE);
    return text;
  } catch {
    return '';
  }
}
