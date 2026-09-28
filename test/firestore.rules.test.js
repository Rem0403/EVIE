// Runs against the Firestore emulator: npm run test:rules
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import {
  arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch,
} from 'firebase/firestore';

const CODE = 'EVIE-AAAA-BBBB';
let env;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-evie',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});
afterAll(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'circles/c1'), { name: "Maya's Care Circle", personName: 'Maya', joinCode: CODE, memberIds: ['alice', 'bob'] });
    await setDoc(doc(db, `joinCodes/${CODE}`), { circleId: 'c1' });
    await setDoc(doc(db, 'circles/c1/entries/e1'), { type: 'note', createdBy: 'alice' });
  });
});

const as = (uid) => env.authenticatedContext(uid).firestore();

function join(db, uid, code) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'circles/c1'), { memberIds: arrayUnion(uid) });
  batch.set(doc(db, `circles/c1/members/${uid}`), { displayName: 'Eve', joinCode: code });
  return batch.commit();
}

describe('circles are private', () => {
  it('stops a stranger listing or searching circles', async () => {
    await assertFails(getDocs(collection(as('eve'), 'circles')));
    await assertFails(getDocs(query(collection(as('eve'), 'circles'), where('joinCode', '==', CODE))));
  });
  it("stops a stranger reading a circle or its entries", async () => {
    await assertFails(getDoc(doc(as('eve'), 'circles/c1')));
    await assertFails(getDoc(doc(as('eve'), 'circles/c1/entries/e1')));
  });
  it('lets a stranger look up an exact code, but not list codes', async () => {
    await assertSucceeds(getDoc(doc(as('eve'), `joinCodes/${CODE}`)));
    await assertFails(getDocs(collection(as('eve'), 'joinCodes')));
  });
  it('lets members read their circle', async () => {
    await assertSucceeds(getDoc(doc(as('alice'), 'circles/c1')));
  });
});

describe('joining', () => {
  it('works with the right code', async () => {
    await assertSucceeds(join(as('eve'), 'eve', CODE));
  });
  it('fails with a wrong code', async () => {
    await assertFails(join(as('eve'), 'eve', 'EVIE-ZZZZ-ZZZZ'));
  });
  it('fails without proving the code', async () => {
    await assertFails(updateDoc(doc(as('eve'), 'circles/c1'), { memberIds: arrayUnion('eve') }));
  });
  it('lets a member rejoin (same batch as a new join)', async () => {
    await assertSucceeds(join(as('bob'), 'bob', CODE));
  });
});

describe('circle changes', () => {
  it('stops a member removing someone else', async () => {
    await assertFails(updateDoc(doc(as('alice'), 'circles/c1'), { memberIds: arrayRemove('bob') }));
  });
  it('lets a member edit the care plan and medication schedule', async () => {
    await assertSucceeds(updateDoc(doc(as('bob'), 'circles/c1'), {
      profile: { diagnoses: ['epilepsy', 'autism'], communication: 'non_speaking' },
      meds: [{ name: 'Keppra', dose: '250 mg', times: ['08:00', '20:00'] }],
    }));
  });
  it("stops a stranger editing the care plan", async () => {
    await assertFails(updateDoc(doc(as('eve'), 'circles/c1'), { meds: [] }));
  });
  it('lets a member replace the code', async () => {
    await assertSucceeds(updateDoc(doc(as('alice'), 'circles/c1'), { joinCode: 'EVIE-CCCC-DDDD' }));
  });
  it('creates a circle with its code and member doc in one batch', async () => {
    const db = as('carol');
    const batch = writeBatch(db);
    batch.set(doc(db, 'circles/c2'), { name: 'X', personName: 'X', joinCode: 'EVIE-CCCC-DDDD', memberIds: ['carol'] });
    batch.set(doc(db, 'circles/c2/members/carol'), { displayName: 'Carol' });
    batch.set(doc(db, 'joinCodes/EVIE-CCCC-DDDD'), { circleId: 'c2' });
    await assertSucceeds(batch.commit());
  });
  it('lets a member move an old circle to a new code (the upgrade batch)', async () => {
    const db = as('alice');
    const batch = writeBatch(db);
    batch.update(doc(db, 'circles/c1'), { joinCode: 'EVIE-CCCC-DDDD' });
    batch.set(doc(db, 'joinCodes/EVIE-CCCC-DDDD'), { circleId: 'c1' });
    await assertSucceeds(batch.commit());
  });
  it("stops anyone claiming a code that's taken", async () => {
    const db = as('carol');
    const batch = writeBatch(db);
    batch.set(doc(db, 'circles/c2'), { name: 'X', personName: 'X', joinCode: CODE, memberIds: ['carol'] });
    batch.set(doc(db, `joinCodes/${CODE}`), { circleId: 'c2' });
    await assertFails(batch.commit());
  });
  it("stops a code pointing at a circle you aren't in", async () => {
    await assertFails(setDoc(doc(as('eve'), 'joinCodes/EVIE-EEEE-EEEE'), { circleId: 'c1' }));
  });
});

describe('entries', () => {
  it('must be signed by the person logging them', async () => {
    await assertSucceeds(setDoc(doc(as('bob'), 'circles/c1/entries/e2'), { type: 'note', createdBy: 'bob' }));
    await assertFails(setDoc(doc(as('bob'), 'circles/c1/entries/e3'), { type: 'note', createdBy: 'alice' }));
  });
  it("can be updated by any member, but the author can't be changed", async () => {
    await assertSucceeds(updateDoc(doc(as('bob'), 'circles/c1/entries/e1'), { clipStatus: 'done' }));
    await assertFails(updateDoc(doc(as('bob'), 'circles/c1/entries/e1'), { createdBy: 'bob' }));
  });
  it('can only be deleted by the author', async () => {
    await assertFails(deleteDoc(doc(as('bob'), 'circles/c1/entries/e1')));
    await assertSucceeds(deleteDoc(doc(as('alice'), 'circles/c1/entries/e1')));
  });
});
