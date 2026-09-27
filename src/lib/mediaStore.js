// Clips and photos live only on the phone that took them (IndexedDB), so the app runs on the free Spark plan.
const DB = 'evie-media';
const STORE = 'media';

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export const putMedia = (key, blob) => run('readwrite', (s) => s.put(blob, key));
export const getMedia = (key) => run('readonly', (s) => s.get(key));
