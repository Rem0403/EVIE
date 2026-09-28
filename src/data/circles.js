import {
  arrayUnion, collection, doc, getDoc, onSnapshot, Timestamp, updateDoc, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { generateJoinCode, isCurrentCode, normalizeJoinCode } from '../lib/codes.js';

const circlesRef = collection(db, 'circles');
const codeRef = (code) => doc(db, 'joinCodes', code);

// The circle, your member doc and its join code are written together; the rules check them as one.
export async function createCircle({ uid, displayName, personName }) {
  const ref = doc(circlesRef);
  const joinCode = generateJoinCode();
  const circle = {
    name: `${personName}'s Care Circle`,
    personName,
    joinCode,
    memberIds: [uid],
    createdAt: Timestamp.now(),
  };
  const batch = writeBatch(db);
  batch.set(ref, circle);
  batch.set(doc(ref, 'members', uid), { displayName, joinedAt: Timestamp.now() });
  batch.set(codeRef(joinCode), { circleId: ref.id });
  await batch.commit();
  return { id: ref.id, ...circle };
}

// Returns the circle, or null if the code doesn't match one.
export async function joinCircleByCode({ uid, displayName, code }) {
  const normalized = normalizeJoinCode(code);
  if (!normalized) return null;
  const found = await getDoc(codeRef(normalized));
  if (!found.exists()) return null;
  const ref = doc(circlesRef, found.data().circleId);
  // The member doc carries the code so the rules can check it before adding you.
  const batch = writeBatch(db);
  batch.update(ref, { memberIds: arrayUnion(uid) });
  batch.set(doc(ref, 'members', uid), { displayName, joinCode: normalized, joinedAt: Timestamp.now() });
  try {
    await batch.commit();
  } catch (err) {
    if (err.code === 'permission-denied') return null; // the circle has since moved to a new code
    throw err;
  }
  return getCircle(ref.id);
}

// Circles made before the longer codes get a new one the first time a member opens them.
// Old 4-digit codes stop working for new joins; existing members aren't affected.
export async function upgradeJoinCode(circle) {
  if (isCurrentCode(circle.joinCode)) return circle;
  const joinCode = generateJoinCode();
  const batch = writeBatch(db);
  batch.update(doc(circlesRef, circle.id), { joinCode });
  batch.set(codeRef(joinCode), { circleId: circle.id });
  await batch.commit();
  return { ...circle, joinCode };
}

// Live copy of the circle, so care plan and schedule edits show on every phone at once.
export function subscribeCircle(circleId, onChange, onError) {
  return onSnapshot(doc(circlesRef, circleId), (snap) => snap.exists() && onChange({ id: snap.id, ...snap.data() }), onError);
}

// Queued locally like entries, so it works offline and syncs later.
export function updateCircle(circleId, patch) {
  return updateDoc(doc(circlesRef, circleId), patch);
}

// Null if it doesn't exist or you're no longer a member (the rules hide it then).
export async function getCircle(circleId) {
  try {
    const snap = await getDoc(doc(circlesRef, circleId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (err) {
    if (err.code === 'permission-denied') return null;
    throw err;
  }
}
