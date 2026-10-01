// Runs against the Firestore emulator: npm run test:rules
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import {
  arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, Timestamp, updateDoc, where, writeBatch,
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
  it('lets you find only the circles you belong to (Google sign-in on a new phone)', async () => {
    const mine = (uid) => getDocs(query(collection(as(uid), 'circles'), where('memberIds', 'array-contains', uid)));
    await assertSucceeds(mine('alice'));
    await assertSucceeds(mine('eve')); // no circles, but asking is allowed
    await assertFails(getDocs(query(collection(as('eve'), 'circles'), where('memberIds', 'array-contains', 'alice'))));
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
    await assertFails(updateDoc(doc(as('bob'), 'circles/c1'), { memberIds: arrayRemove('alice') }));
    // Even whoever started it can't remove someone without changing the code.
    await assertFails(updateDoc(doc(as('alice'), 'circles/c1'), { memberIds: arrayRemove('bob') }));
  });
  it('lets a member edit the care plan and medication schedule', async () => {
    await assertSucceeds(updateDoc(doc(as('bob'), 'circles/c1'), {
      profile: { diagnoses: ['epilepsy', 'autism'], communication: 'non_speaking' },
      meds: [{ name: 'Keppra', dose: '250 mg', times: ['08:00', '20:00'] }],
    }));
  });
  it('lets a member edit the caregiver schedule', async () => {
    await assertSucceeds(updateDoc(doc(as('bob'), 'circles/c1'), {
      schedule: [{ name: 'Ms. Lee', days: [1, 3], start: '08:00', end: '15:00', note: '' }],
    }));
  });
  it('lets a member update the documents list', async () => {
    await assertSucceeds(updateDoc(doc(as('bob'), 'circles/c1'), {
      documents: [{ id: 'd1', name: 'Seizure plan.pdf', type: 'application/pdf', size: 1024, on: 'Bob' }],
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
  it('creates a circle with the care team and medications from setup', async () => {
    const db = as('carol');
    const batch = writeBatch(db);
    batch.set(doc(db, 'circles/c2'), {
      name: 'X', personName: 'Maya', joinCode: 'MAYA-CCCC-DDDD', memberIds: ['carol'],
      profile: { contacts: [{ name: 'Mom', role: 'family', phone: '555-0101' }] },
      meds: [{ name: 'Keppra', dose: '500 mg', times: ['08:00'], purpose: '', notes: '' }],
    });
    batch.set(doc(db, 'circles/c2/members/carol'), { displayName: 'Carol' });
    batch.set(doc(db, 'joinCodes/MAYA-CCCC-DDDD'), { circleId: 'c2' });
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

describe('leaving and removing', () => {
  const NEW = 'MAYA-NNNN-PPPP';
  const addCarol = () => env.withSecurityRulesDisabled((ctx) =>
    updateDoc(doc(ctx.firestore(), 'circles/c1'), { memberIds: ['alice', 'bob', 'carol'] }));
  function remove(db, uid, code = NEW) {
    const batch = writeBatch(db);
    batch.update(doc(db, 'circles/c1'), { memberIds: arrayRemove(uid), joinCode: code });
    batch.set(doc(db, `joinCodes/${code}`), { circleId: 'c1' });
    batch.delete(doc(db, `circles/c1/members/${uid}`));
    batch.delete(doc(db, `joinCodes/${CODE}`)); // the old code's record, as the app does
    return batch.commit();
  }

  it('lets a member leave, keeping whoever started the circle first', async () => {
    await addCarol();
    const db = as('bob');
    const batch = writeBatch(db);
    batch.update(doc(db, 'circles/c1'), { memberIds: arrayRemove('bob') });
    batch.delete(doc(db, 'circles/c1/members/bob'));
    await assertSucceeds(batch.commit());
    await assertFails(getDoc(doc(as('bob'), 'circles/c1')));
    let memberIds;
    await env.withSecurityRulesDisabled(async (ctx) => {
      memberIds = (await getDoc(doc(ctx.firestore(), 'circles/c1'))).data().memberIds;
    });
    expect(memberIds).toEqual(['alice', 'carol']);
  });
  it("won't let someone leaving reorder the list to become first", async () => {
    await addCarol();
    await assertFails(updateDoc(doc(as('carol'), 'circles/c1'), { memberIds: ['bob', 'alice'] }));
    await assertFails(updateDoc(doc(as('bob'), 'circles/c1'), { memberIds: ['carol', 'alice'] }));
  });
  it('lets whoever started the circle remove someone, changing the code, and cuts off their access', async () => {
    await assertSucceeds(remove(as('alice'), 'bob'));
    await assertFails(getDoc(doc(as('bob'), 'circles/c1')));
    await assertFails(getDoc(doc(as('bob'), 'circles/c1/entries/e1')));
    await assertFails(join(as('bob'), 'bob', CODE)); // the old code no longer works
  });
  it("stops anyone else removing people, even with a new code", async () => {
    await addCarol();
    await assertFails(remove(as('bob'), 'carol'));
    await assertFails(remove(as('eve'), 'bob'));
  });
  it('removes one person at a time, never whoever started it', async () => {
    await addCarol();
    await assertFails(updateDoc(doc(as('alice'), 'circles/c1'), { memberIds: ['alice'], joinCode: NEW }));
    await assertFails(updateDoc(doc(as('alice'), 'circles/c1'), { memberIds: ['bob', 'carol'], joinCode: NEW }));
    await assertFails(updateDoc(doc(as('alice'), 'circles/c1'), { memberIds: ['alice', 'carol'], joinCode: NEW, name: 'x' }));
  });
  it("only deletes a member's record for themselves or whoever started the circle", async () => {
    await addCarol();
    await env.withSecurityRulesDisabled(async (ctx) => {
      for (const u of ['alice', 'bob', 'carol']) await setDoc(doc(ctx.firestore(), `circles/c1/members/${u}`), { displayName: u });
    });
    await assertFails(deleteDoc(doc(as('bob'), 'circles/c1/members/carol')));
    await assertFails(deleteDoc(doc(as('eve'), 'circles/c1/members/carol')));
    await assertSucceeds(deleteDoc(doc(as('carol'), 'circles/c1/members/carol')));
    await assertSucceeds(deleteDoc(doc(as('alice'), 'circles/c1/members/bob')));
  });
  it('lets any member get a new code', async () => {
    const db = as('bob');
    const batch = writeBatch(db);
    batch.update(doc(db, 'circles/c1'), { joinCode: NEW });
    batch.set(doc(db, `joinCodes/${NEW}`), { circleId: 'c1' });
    batch.delete(doc(db, `joinCodes/${CODE}`));
    await assertSucceeds(batch.commit());
    await assertFails(join(as('eve'), 'eve', CODE));
    await assertSucceeds(join(as('eve'), 'eve', NEW));
  });
});

describe('resources', () => {
  const res = { name: 'Waiver office', category: 'services', status: 'want', createdBy: 'alice' };
  it('can be added, edited and removed by any member', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'circles/c1/resources/r1'), res));
    await assertSucceeds(updateDoc(doc(as('bob'), 'circles/c1/resources/r1'), { status: 'waitlisted' }));
    await assertSucceeds(deleteDoc(doc(as('bob'), 'circles/c1/resources/r1')));
  });
  it('are private to the circle', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'circles/c1/resources/r1'), res));
    await assertFails(getDoc(doc(as('eve'), 'circles/c1/resources/r1')));
    await assertFails(getDocs(collection(as('eve'), 'circles/c1/resources')));
    await assertFails(setDoc(doc(as('eve'), 'circles/c1/resources/r2'), { ...res, createdBy: 'eve' }));
  });
  it("can't be signed as someone else, or re-signed later", async () => {
    await assertFails(setDoc(doc(as('bob'), 'circles/c1/resources/r1'), res));
    await assertSucceeds(setDoc(doc(as('alice'), 'circles/c1/resources/r1'), res));
    await assertFails(updateDoc(doc(as('bob'), 'circles/c1/resources/r1'), { createdBy: 'bob' }));
  });
  it('only store plain web links, so a member can never plant a script link', async () => {
    const r = (url) => setDoc(doc(as('alice'), 'circles/c1/resources/r1'), { ...res, url });
    await assertSucceeds(r('https://www.211.org/'));
    await assertSucceeds(r('http://local.example/'));
    await assertSucceeds(r(''));
    await assertFails(r('javascript:alert(document.domain)'));
    await assertFails(r('JAVASCRIPT:alert(1)'));
    await assertFails(r('data:text/html,<script>alert(1)</script>'));
    await assertFails(r('https://ok.example/ javascript:alert(1)'));
    await assertFails(r(42));
    await assertSucceeds(r('https://www.211.org/'));
    await assertFails(updateDoc(doc(as('bob'), 'circles/c1/resources/r1'), { url: 'javascript:alert(1)' }));
  });
});

describe('goals', () => {
  const goal = (uid) => ({ title: 'Ask for more', area: 'communication', status: 'active', createdBy: uid });
  it('can be added, edited and removed by any member', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'circles/c1/goals/g1'), goal('alice')));
    await assertSucceeds(updateDoc(doc(as('bob'), 'circles/c1/goals/g1'), { status: 'met' }));
    await assertSucceeds(deleteDoc(doc(as('bob'), 'circles/c1/goals/g1')));
  });
  it('are private to the circle', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'circles/c1/goals/g1'), goal('alice')));
    await assertFails(getDoc(doc(as('eve'), 'circles/c1/goals/g1')));
    await assertFails(setDoc(doc(as('eve'), 'circles/c1/goals/g2'), goal('eve')));
    await assertFails(deleteDoc(doc(as('eve'), 'circles/c1/goals/g1')));
  });
  it("can't be signed as someone else, or re-signed later", async () => {
    await assertFails(setDoc(doc(as('alice'), 'circles/c1/goals/g1'), goal('bob')));
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'circles/c1/goals/g1'), goal('alice')));
    await assertFails(updateDoc(doc(as('bob'), 'circles/c1/goals/g1'), { createdBy: 'bob' }));
  });
});

describe('entries', () => {
  const T = Timestamp.fromMillis(Date.UTC(2026, 8, 30, 12));
  const by = (uid, name, extra) => ({ occurredAt: T, createdBy: uid, createdByName: name, ...extra });
  const put = (uid, id, data) => setDoc(doc(as(uid), `circles/c1/entries/${id}`), data);
  beforeEach(() => env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'circles/c1/members/alice'), { displayName: 'Alice' });
    await setDoc(doc(db, 'circles/c1/members/bob'), { displayName: 'Bob' });
  }));

  it('accepts every kind of entry the app writes', async () => {
    const kinds = [
      { type: 'seizure', durationSec: 102, seizureType: 'tonic-clonic', triggers: ['poor_sleep'], rescueMedGiven: false, duringSleep: true, note: 'At breakfast', clipStatus: 'uploading' },
      { type: 'med', medName: 'Keppra', dose: '500 mg', status: 'given', slot: '08:00' },
      { type: 'med', medName: 'Diastat', dose: '10 mg', status: 'rescue' },
      { type: 'sleep', bedtime: T, wakeTime: T, quality: 2 },
      { type: 'behavior', kind: 'meltdown', before: ['sensory'], helped: ['quiet'], length: '5to15', intensity: 'mild' },
      { type: 'goal', goalId: 'g1', goalTitle: 'Ask for more', result: 'help' },
      { type: 'note', note: 'Rash', attachments: [{ id: 'a1', name: 'rash.png', type: 'image/png', size: 3 }], attachmentsOn: 'Bob' },
      { type: 'note', note: 'From an older app version', photoStatus: 'uploading' },
      { type: 'handoff', until: Date.UTC(2026, 8, 30, 15), note: 'Slept OK' },
    ];
    for (const [i, k] of kinds.entries()) await assertSucceeds(put('bob', `k${i}`, by('bob', 'Bob', k)));
  });
  it('must be signed by the person logging them, under the name they joined with', async () => {
    await assertFails(put('bob', 'e3', by('alice', 'Alice', { type: 'note', note: 'x' })));
    await assertFails(put('bob', 'e3', by('bob', 'Mom', { type: 'note', note: 'x' })));
  });
  it('allows any name only in a circle from before member records existed', async () => {
    await env.withSecurityRulesDisabled((ctx) => deleteDoc(doc(ctx.firestore(), 'circles/c1/members/bob')));
    await assertSucceeds(put('bob', 'e3', by('bob', 'Bob (old circle)', { type: 'note', note: 'x' })));
  });
  it('refuses unknown fields, wrong types and oversized text', async () => {
    await assertFails(put('bob', 'e3', by('bob', 'Bob', { type: 'note', note: 'x', admin: true })));
    await assertFails(put('bob', 'e3', by('bob', 'Bob', { type: 'script', note: 'x' })));
    await assertFails(put('bob', 'e3', { ...by('bob', 'Bob', { type: 'note' }), occurredAt: 'yesterday' }));
    await assertFails(put('bob', 'e3', by('bob', 'Bob', { type: 'note', note: 'x'.repeat(5001) })));
    await assertFails(put('bob', 'e3', by('bob', 'Bob', { type: 'seizure', durationSec: -5 })));
    await assertFails(put('bob', 'e3', by('bob', 'Bob', { type: 'note', attachments: Array(11).fill({ id: 'a' }) })));
  });
  it("can't be rewritten after it's logged, by anyone; only a clip or photo can be noted", async () => {
    await put('alice', 's1', by('alice', 'Alice', { type: 'seizure', durationSec: 60, clipStatus: 'none' }));
    await assertSucceeds(updateDoc(doc(as('bob'), 'circles/c1/entries/s1'), { clipStatus: 'done', clipOn: 'Bob' }));
    await assertFails(updateDoc(doc(as('bob'), 'circles/c1/entries/s1'), { durationSec: 5 }));
    await assertFails(updateDoc(doc(as('alice'), 'circles/c1/entries/s1'), { durationSec: 5 }));
    await assertFails(updateDoc(doc(as('bob'), 'circles/c1/entries/s1'), { createdByName: 'Bob' }));
    await assertFails(updateDoc(doc(as('bob'), 'circles/c1/entries/s1'), { createdBy: 'bob' }));
    await assertFails(updateDoc(doc(as('bob'), 'circles/c1/entries/s1'), { clipStatus: '<script>' }));
    await assertFails(updateDoc(doc(as('eve'), 'circles/c1/entries/s1'), { clipStatus: 'done' }));
  });
  it('can only be deleted by the author', async () => {
    await assertFails(deleteDoc(doc(as('bob'), 'circles/c1/entries/e1')));
    await assertSucceeds(deleteDoc(doc(as('alice'), 'circles/c1/entries/e1')));
  });
  it('takes a demo-sized batch in one write', async () => {
    const db = as('bob');
    const batch = writeBatch(db);
    for (let i = 0; i < 60; i++) batch.set(doc(db, `circles/c1/entries/b${i}`), by('bob', 'Bob', { type: 'note', note: `n${i}` }));
    await assertSucceeds(batch.commit());
  });
});

describe('deleting a circle and old codes', () => {
  beforeEach(() => env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'circles/c1/entries/e2'), { type: 'note', createdBy: 'bob' });
    await setDoc(doc(db, 'circles/c1/goals/g1'), { title: 'Talk', status: 'active', createdBy: 'bob' });
    await setDoc(doc(db, 'circles/c1/members/bob'), { displayName: 'Bob' });
  }));

  it('lets whoever started the circle delete everything in it, then the circle and its code', async () => {
    const db = as('alice');
    const batch = writeBatch(db);
    for (const p of ['entries/e1', 'entries/e2', 'goals/g1', 'members/bob']) batch.delete(doc(db, `circles/c1/${p}`));
    await assertSucceeds(batch.commit());
    const last = writeBatch(db);
    last.delete(doc(db, `joinCodes/${CODE}`));
    last.delete(doc(db, 'circles/c1'));
    await assertSucceeds(last.commit());
  });
  it("stops anyone else deleting the circle or other people's entries", async () => {
    await assertFails(deleteDoc(doc(as('bob'), 'circles/c1')));
    await assertFails(deleteDoc(doc(as('bob'), 'circles/c1/entries/e1')));
    await assertFails(deleteDoc(doc(as('eve'), 'circles/c1')));
  });
  it("lets members clear their own circle's old codes, and nobody else", async () => {
    await assertFails(deleteDoc(doc(as('eve'), `joinCodes/${CODE}`)));
    await assertSucceeds(deleteDoc(doc(as('bob'), `joinCodes/${CODE}`)));
    await assertSucceeds(deleteDoc(doc(as('bob'), 'joinCodes/NEVER-EXIS-TED1'))); // a no-op
  });
});

describe('circle icon', () => {
  it('can be set when the circle is made, and changed by any member', async () => {
    const db = as('carol');
    const batch = writeBatch(db);
    batch.set(doc(db, 'circles/c2'), { name: "Sam's Care Circle", personName: 'Sam', joinCode: 'SAM-CCCC-DDDD', memberIds: ['carol'], icon: 'seedling', iconColor: 'gold' });
    batch.set(doc(db, 'circles/c2/members/carol'), { displayName: 'Carol' });
    batch.set(doc(db, 'joinCodes/SAM-CCCC-DDDD'), { circleId: 'c2' });
    await assertSucceeds(batch.commit());
    await assertSucceeds(updateDoc(doc(as('bob'), 'circles/c1'), { icon: 'fish', iconColor: 'blue' }));
  });
  it('only takes the listed symbols and colors, and only from members', async () => {
    await assertFails(updateDoc(doc(as('bob'), 'circles/c1'), { icon: '<script>' }));
    await assertFails(updateDoc(doc(as('bob'), 'circles/c1'), { icon: 'heart', iconColor: '#ff0000' }));
    await assertFails(updateDoc(doc(as('eve'), 'circles/c1'), { icon: 'heart' }));
  });
  it('can be a small JPEG photo, or none, but never another kind of image or link', async () => {
    await assertSucceeds(updateDoc(doc(as('bob'), 'circles/c1'), { iconPhoto: `data:image/jpeg;base64,/9j/${'A'.repeat(59900)}==` }));
    await assertSucceeds(updateDoc(doc(as('bob'), 'circles/c1'), { iconPhoto: '' }));
    await assertFails(updateDoc(doc(as('bob'), 'circles/c1'), { iconPhoto: 'data:image/svg+xml;base64,PHN2Zz4=' }));
    await assertFails(updateDoc(doc(as('bob'), 'circles/c1'), { iconPhoto: 'https://lh3.googleusercontent.com/a/x' }));
    await assertFails(updateDoc(doc(as('bob'), 'circles/c1'), { iconPhoto: `data:image/jpeg;base64,${'A'.repeat(60000)}` }));
    await assertFails(updateDoc(doc(as('eve'), 'circles/c1'), { iconPhoto: '' }));
  });
});

describe('profile pictures', () => {
  const JPEG = `data:image/jpeg;base64,/9j/${'A'.repeat(59900)}==`; // near the 60,000 limit
  const GOOGLE = 'https://lh3.googleusercontent.com/a/ACg8ocKxyz=s96-c';
  beforeEach(() => env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'circles/c1/members/bob'), { displayName: 'Bob' })));
  const setPhoto = (uid, who, photo) => updateDoc(doc(as(uid), `circles/c1/members/${who}`), { photo });

  it('lets you set, change and remove your own picture', async () => {
    await assertSucceeds(setPhoto('bob', 'bob', JPEG));
    await assertSucceeds(setPhoto('bob', 'bob', GOOGLE));
    await assertSucceeds(setPhoto('bob', 'bob', ''));
  });
  it("stops you changing someone else's picture", async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'circles/c1/members/alice'), { displayName: 'Alice' }));
    await assertFails(setPhoto('bob', 'alice', JPEG));
    await assertFails(setPhoto('eve', 'bob', JPEG));
  });
  it('only takes a small JPEG or a Google picture, never a script or another site', async () => {
    await assertFails(setPhoto('bob', 'bob', 'data:image/svg+xml;base64,PHN2Zz4='));
    await assertFails(setPhoto('bob', 'bob', 'javascript:alert(1)'));
    await assertFails(setPhoto('bob', 'bob', 'https://tracker.example/pixel.jpg'));
    await assertFails(setPhoto('bob', 'bob', 'https://lh3.googleusercontent.com.evil.example/a'));
    await assertFails(setPhoto('bob', 'bob', `data:image/jpeg;base64,${'A'.repeat(60000)}`));
    await assertFails(setPhoto('bob', 'bob', 42));
  });
  it('can come with a new circle or a join', async () => {
    const db = as('carol');
    const batch = writeBatch(db);
    batch.set(doc(db, 'circles/c2'), { name: "Sam's Care Circle", personName: 'Sam', joinCode: 'SAM-AAAA-BBBB', memberIds: ['carol'] });
    batch.set(doc(db, 'circles/c2/members/carol'), { displayName: 'Carol', photo: JPEG });
    batch.set(doc(db, 'joinCodes/SAM-AAAA-BBBB'), { circleId: 'c2' });
    await assertSucceeds(batch.commit());
    const eve = as('eve');
    const join2 = writeBatch(eve);
    join2.update(doc(eve, 'circles/c1'), { memberIds: arrayUnion('eve') });
    join2.set(doc(eve, 'circles/c1/members/eve'), { displayName: 'Eve', joinCode: CODE, photo: GOOGLE });
    await assertSucceeds(join2.commit());
  });
});

describe('what circles, members, resources and goals may hold', () => {
  it('refuses unknown fields and oversized values', async () => {
    await assertFails(setDoc(doc(as('carol'), 'circles/c9'), { name: 'X', personName: 'X', joinCode: 'X-AAAA-BBBB', memberIds: ['carol'], admin: true }));
    await assertFails(updateDoc(doc(as('bob'), 'circles/c1'), { personName: 'x'.repeat(61) }));
    await assertFails(updateDoc(doc(as('bob'), 'circles/c1'), { meds: Array(101).fill({ name: 'x' }) }));
    await assertFails(join(as('eve'), 'eve', CODE).then(() => setDoc(doc(as('eve'), 'circles/c1/members/eve'), { displayName: '' })));
    await assertFails(setDoc(doc(as('alice'), 'circles/c1/resources/r1'), { name: 'Waiver', createdBy: 'alice', secret: 1 }));
    await assertFails(setDoc(doc(as('alice'), 'circles/c1/resources/r1'), { name: '', createdBy: 'alice' }));
    await assertFails(setDoc(doc(as('alice'), 'circles/c1/goals/g1'), { title: 'Talk', status: 'done!', createdBy: 'alice' }));
    await assertFails(setDoc(doc(as('alice'), 'circles/c1/goals/g1'), { title: 'Talk', status: 'active', createdBy: 'alice', extra: 1 }));
  });
});
