import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import {
  getAuth, GoogleAuthProvider, linkWithPopup, signInAnonymously, signInWithCredential, signOut,
} from 'firebase/auth';
import {
  clearIndexedDbPersistence, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, terminate,
  waitForPendingWrites,
} from 'firebase/firestore';
import { withTimeout } from './lib/timeout.js';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(config);

// App Check: Firebase then only serves requests from this app on this site, not from scripts.
// It starts once VITE_APPCHECK_SITE_KEY (a reCAPTCHA Enterprise key from the Firebase console)
// is set. Enforcement is switched on separately in the console, after its metrics look right.
const appCheckKey = import.meta.env.VITE_APPCHECK_SITE_KEY;
if (appCheckKey) {
  // Local development gets a debug token (printed in the console, registered in Firebase).
  if (import.meta.env.DEV) self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(appCheckKey), isTokenAutoRefreshEnabled: true });
}

const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

// Reuses the persisted anonymous user when there is one.
export async function ensureSignedIn() {
  await auth.authStateReady();
  if (auth.currentUser) return auth.currentUser;
  const cred = await signInAnonymously(auth);
  return cred.user;
}

const google = new GoogleAuthProvider();

export const googleEmail = (user) => user?.providerData.find((p) => p.providerId === 'google.com')?.email || '';
export const googlePhoto = (user) => user?.providerData.find((p) => p.providerId === 'google.com')?.photoURL || '';

// Adds Google to this phone's anonymous account. The uid stays the same, so circles, entries
// and the rules see the same person. If that Google account already has an EVIE identity
// (another phone), switches to it when confirmSwitch() agrees. Null if the person cancelled.
export async function connectGoogle(confirmSwitch) {
  try {
    return (await linkWithPopup(auth.currentUser, google)).user;
  } catch (err) {
    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return null;
    if (err.code !== 'auth/credential-already-in-use') throw err;
    if (!confirmSwitch()) return null;
    await flushWrites(8000); // queued writes belong to the current user; send them before switching
    return (await signInWithCredential(auth, GoogleAuthProvider.credentialFromError(err))).user;
  }
}

// The Google account keeps its circles; the app reloads afterwards with a new anonymous identity.
export async function signOutGoogle() {
  await signOut(auth);
}

// Clears this phone's offline copy of every circle it has opened. Firestore can't be used again
// afterwards, so the caller reloads the page. Anything not yet synced is lost: flush first.
// Returns false if another open EVIE tab kept the copy from being cleared.
export async function clearLocalFirestore() {
  try {
    await terminate(db);
    await clearIndexedDbPersistence(db);
    return true;
  } catch (err) {
    console.error('clear offline copy', err);
    return false;
  }
}

// True once every queued write has reached the server. Offline, or past `ms`, they stay
// saved on the phone and sync the next time EVIE is open and online.
export async function flushWrites(ms) {
  if (!navigator.onLine) return false;
  try {
    await withTimeout(waitForPendingWrites(db), ms);
    return true;
  } catch {
    return false;
  }
}
