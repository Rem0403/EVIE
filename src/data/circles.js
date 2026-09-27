import {
  arrayUnion, collection, doc, getDoc, getDocs, limit, query, setDoc, Timestamp, updateDoc, where,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { generateJoinCode, normalizeJoinCode } from '../lib/codes.js';

const circlesRef = collection(db, 'circles');

async function findByCode(code) {
  const snap = await getDocs(query(circlesRef, where('joinCode', '==', code), limit(1)));
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function createCircle({ uid, displayName, personName }) {
  let joinCode = null;
  for (let i = 0; i < 5 && !joinCode; i++) {
    const candidate = generateJoinCode();
    if (!(await findByCode(candidate))) joinCode = candidate;
  }
  if (!joinCode) throw new Error('Could not create a join code. Please try again.');

  const ref = doc(circlesRef);
  const circle = {
    name: `${personName}'s Care Circle`,
    personName,
    joinCode,
    memberIds: [uid],
    createdAt: Timestamp.now(),
  };
  await setDoc(ref, circle);
  await setDoc(doc(db, 'circles', ref.id, 'members', uid), { displayName, joinedAt: Timestamp.now() });
  return { id: ref.id, ...circle };
}

export async function joinCircleByCode({ uid, displayName, code }) {
  const normalized = normalizeJoinCode(code);
  if (!normalized) return null;
  const circle = await findByCode(normalized);
  if (!circle) return null;
  await updateDoc(doc(db, 'circles', circle.id), { memberIds: arrayUnion(uid) });
  await setDoc(doc(db, 'circles', circle.id, 'members', uid), { displayName, joinedAt: Timestamp.now() });
  return { ...circle, memberIds: [...new Set([...circle.memberIds, uid])] };
}

export async function getCircle(circleId) {
  const snap = await getDoc(doc(db, 'circles', circleId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
