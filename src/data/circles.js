import {
  arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, onSnapshot, query, Timestamp, updateDoc, where, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { generateJoinCode, isCurrentCode, normalizeJoinCode } from '../lib/codes.js';

const circlesRef = collection(db, 'circles');
const codeRef = (code) => doc(db, 'joinCodes', code);

// The circle, your member doc and its join code are written together; the rules check them as one.
// profile and meds are the care team and medications from setup, when it filled them in.
export async function createCircle({ uid, displayName, personName, profile, meds }) {
  const ref = doc(circlesRef);
  const joinCode = generateJoinCode(personName);
  const circle = {
    name: `${personName}'s Care Circle`,
    personName,
    joinCode,
    memberIds: [uid],
    createdAt: Timestamp.now(),
    ...(profile ? { profile } : {}),
    ...(meds ? { meds } : {}),
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
  const joinCode = generateJoinCode(circle.personName);
  const batch = writeBatch(db);
  batch.update(doc(circlesRef, circle.id), { joinCode });
  batch.set(codeRef(joinCode), { circleId: circle.id });
  dropOldCode(batch, circle.joinCode);
  await batch.commit();
  return { ...circle, joinCode };
}

// The replaced code's record goes in the same write: it would only point at this circle, and it
// holds the person's first name.
function dropOldCode(batch, oldCode) {
  if (typeof oldCode === 'string' && oldCode && !oldCode.includes('/')) batch.delete(codeRef(oldCode));
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

// The newest circle you belong to and your name in it, or null. Used after Google sign-in on a
// new phone. The rules allow this query only because it asks for circles that include you.
export async function findMyCircle(uid) {
  const snap = await getDocs(query(circlesRef, where('memberIds', 'array-contains', uid)));
  const newest = snap.docs.sort((a, b) => (b.data().createdAt?.toMillis() || 0) - (a.data().createdAt?.toMillis() || 0))[0];
  if (!newest) return null;
  const member = await getDoc(doc(newest.ref, 'members', uid));
  return { circle: { id: newest.id, ...newest.data() }, name: member.data()?.displayName || '' };
}

// Whoever started the circle: the first member. Only they can remove people (see firestore.rules).
export const ownerOf = (circle) => circle.memberIds?.[0] || null;

// Everyone in the circle, in the order they joined, with the name each chose.
export async function listMembers(circle) {
  const snap = await getDocs(collection(circlesRef, circle.id, 'members'));
  const names = new Map(snap.docs.map((d) => [d.id, d.data().displayName]));
  return (circle.memberIds || []).map((uid) => ({ uid, name: names.get(uid) || 'Someone' }));
}

// A fresh code; the old one stops working for new joins. Anyone in the circle can do this.
export async function newJoinCode(circle) {
  const joinCode = generateJoinCode(circle.personName);
  const batch = writeBatch(db);
  batch.update(doc(circlesRef, circle.id), { joinCode });
  batch.set(codeRef(joinCode), { circleId: circle.id });
  dropOldCode(batch, circle.joinCode);
  await batch.commit();
  return joinCode;
}

// Takes you out of the circle for real: you lose access until you join again with its code.
export async function leaveCircleForGood(circle, uid) {
  const batch = writeBatch(db);
  batch.update(doc(circlesRef, circle.id), { memberIds: arrayRemove(uid) });
  batch.delete(doc(circlesRef, circle.id, 'members', uid));
  await batch.commit();
}

// Whoever started the circle removes someone. The code changes in the same write, so the
// removed person can't come straight back with the one they had.
export async function removeMember(circle, uid) {
  const joinCode = generateJoinCode(circle.personName);
  const batch = writeBatch(db);
  batch.update(doc(circlesRef, circle.id), { memberIds: arrayRemove(uid), joinCode });
  batch.set(codeRef(joinCode), { circleId: circle.id });
  batch.delete(doc(circlesRef, circle.id, 'members', uid));
  dropOldCode(batch, circle.joinCode);
  await batch.commit();
  return joinCode;
}

const BATCH_LIMIT = 400; // Firestore allows 500 writes in one batch

// Deletes the circle and everything in it, for everyone: entries (all of them, not just the ones
// loaded), goals, resources, member records and its code, then the circle itself last, because
// the rules check membership against it. Only whoever started the circle may (firestore.rules).
export async function deleteCircle(circle) {
  const ref = doc(circlesRef, circle.id);
  const refs = [];
  for (const sub of ['entries', 'goals', 'resources', 'members']) {
    const snap = await getDocs(collection(ref, sub));
    refs.push(...snap.docs.map((d) => d.ref));
  }
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const r of refs.slice(i, i + BATCH_LIMIT)) batch.delete(r);
    await batch.commit();
  }
  const last = writeBatch(db);
  dropOldCode(last, circle.joinCode);
  last.delete(ref);
  await last.commit();
}
