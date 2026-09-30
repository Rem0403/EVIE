import {
  collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc, Timestamp, updateDoc, where, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase.js';

const TIME_FIELDS = ['occurredAt', 'bedtime', 'wakeTime'];

const entriesRef = (circleId) => collection(db, 'circles', circleId, 'entries');

// JS (ms numbers, maybe undefined fields) → Firestore (Timestamps, no undefined)
function toFirestore(entry) {
  const out = {};
  for (const [key, value] of Object.entries(entry)) {
    if (value === undefined || key === 'id') continue;
    out[key] = TIME_FIELDS.includes(key) && typeof value === 'number' ? Timestamp.fromMillis(value) : value;
  }
  return out;
}

function fromFirestore(snap) {
  const data = snap.data();
  const out = { id: snap.id, ...data };
  for (const key of TIME_FIELDS) if (data[key]?.toMillis) out[key] = data[key].toMillis();
  return out;
}

// Returns the new id immediately. The write is queued locally (works offline) and syncs in the background.
export function addEntry(circleId, entry) {
  const ref = doc(entriesRef(circleId));
  setDoc(ref, toFirestore(entry)).catch((err) => console.error('addEntry failed', err));
  return ref.id;
}

export async function addEntriesBatch(circleId, entries) {
  const batch = writeBatch(db);
  for (const entry of entries) batch.set(doc(entriesRef(circleId)), toFirestore(entry));
  await batch.commit();
}

export function updateEntry(circleId, id, patch) {
  return updateDoc(doc(db, 'circles', circleId, 'entries', id), toFirestore(patch));
}

export function deleteEntry(circleId, id) {
  return deleteDoc(doc(db, 'circles', circleId, 'entries', id));
}

// Entries from the last `days` days, live. The app opens with a short window (each entry read is
// billed, and the free plan allows 50,000 a day for everyone), and widens it for older entries
// or a longer care summary.
export function subscribeEntries(circleId, days, onChange, onError) {
  const since = Timestamp.fromMillis(Date.now() - days * 24 * 3600 * 1000);
  const q = query(entriesRef(circleId), where('occurredAt', '>=', since), orderBy('occurredAt', 'desc'));
  // fromCache: the first answer to a wider window comes from this phone's cache, which may only
  // hold the narrower one. Metadata changes are included so the server's answer always arrives,
  // even when it matches the cache.
  return onSnapshot(q, { includeMetadataChanges: true },
    (snap) => onChange(snap.docs.map(fromFirestore), { fromCache: snap.metadata.fromCache }), onError);
}
