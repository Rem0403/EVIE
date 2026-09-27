import {
  collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, setDoc, Timestamp, updateDoc, writeBatch,
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

export function subscribeEntries(circleId, onChange, onError) {
  const q = query(entriesRef(circleId), orderBy('occurredAt', 'desc'), limit(500));
  return onSnapshot(q, (snap) => onChange(snap.docs.map(fromFirestore)), onError);
}
