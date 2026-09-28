import { collection, deleteDoc, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.js';

const resourcesRef = (circleId) => collection(db, 'circles', circleId, 'resources');

// Writes are queued locally (work offline) and sync in the background, like entries.
export function subscribeResources(circleId, onChange, onError) {
  return onSnapshot(resourcesRef(circleId), (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), onError);
}

export function addResource(circleId, resource) {
  const ref = doc(resourcesRef(circleId));
  setDoc(ref, resource).catch((err) => console.error('addResource failed', err));
  return ref.id;
}

export function updateResource(circleId, id, patch) {
  return updateDoc(doc(resourcesRef(circleId), id), patch).catch((err) => console.error('updateResource failed', err));
}

export function deleteResource(circleId, id) {
  return deleteDoc(doc(resourcesRef(circleId), id)).catch((err) => console.error('deleteResource failed', err));
}
