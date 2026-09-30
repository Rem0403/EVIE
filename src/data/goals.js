import { collection, deleteDoc, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.js';

const goalsRef = (circleId) => collection(db, 'circles', circleId, 'goals');

// One doc per goal, so two caregivers editing different goals never overwrite each other.
// Writes are queued locally (work offline) and sync in the background, like resources.
export function subscribeGoals(circleId, onChange, onError) {
  return onSnapshot(goalsRef(circleId), (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), onError);
}

export function addGoal(circleId, goal) {
  const ref = doc(goalsRef(circleId));
  setDoc(ref, goal).catch((err) => console.error('addGoal failed', err));
  return ref.id;
}

export function updateGoal(circleId, id, patch) {
  return updateDoc(doc(goalsRef(circleId), id), patch).catch((err) => console.error('updateGoal failed', err));
}

export function deleteGoal(circleId, id) {
  return deleteDoc(doc(goalsRef(circleId), id)).catch((err) => console.error('deleteGoal failed', err));
}
