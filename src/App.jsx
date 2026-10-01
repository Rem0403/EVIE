import { useEffect, useRef, useState } from 'react';
import {
  clearLocalFirestore, connectGoogle, ensureSignedIn, flushWrites, googleEmail, googlePhoto, signOutGoogle,
} from './firebase.js';
import {
  clearEvieStorage, deleteMediaDatabase, setNextNotice, takeNotice,
} from './lib/wipe.js';
import {
  deleteCircle, findMyCircle, getCircle, leaveCircleForGood, ownerOf, setMyPhoto, subscribeCircle, subscribeMember, upgradeJoinCode,
} from './data/circles.js';
import { withTimeout } from './lib/timeout.js';
import { HISTORY_STEPS } from './lib/summary.js';
import { inviteCodeFrom } from './lib/share.js';
import { subscribeEntries } from './data/entries.js';
import { subscribeResources } from './data/resources.js';
import { subscribeGoals } from './data/goals.js';
import { clearSession, loadSession, saveSession } from './lib/session.js';
import { loadSeizureDraft } from './lib/seizureDraft.js';
import OfflineBanner from './components/OfflineBanner.jsx';
import AppNav from './components/AppNav.jsx';
import InviteSheet from './components/InviteCode.jsx';
import ProfileSheet from './components/ProfileSheet.jsx';
import CircleIconSheet from './components/CircleIconSheet.jsx';
import { isAllowedPhoto } from './lib/avatar.js';
import { showToast } from './lib/toast.js';
import Loader from './components/Loader.jsx';
import Toast from './components/Toast.jsx';
import { scrollToTop } from './lib/scroll.js';
import { ownsSideways, swipeDirection } from './lib/swipe.js';
import Welcome from './screens/Welcome.jsx';
import Timeline from './screens/Timeline.jsx';
import LogSeizure from './screens/LogSeizure.jsx';
import QuickLog from './screens/QuickLog.jsx';
import EntryDetail from './screens/EntryDetail.jsx';
import Summary from './screens/Summary.jsx';
import CarePlan from './screens/CarePlan.jsx';
import Emergency from './screens/Emergency.jsx';
import Schedule from './screens/Schedule.jsx';
import Support from './screens/Support.jsx';
import ResourceForm from './screens/ResourceForm.jsx';
import Goals from './screens/Goals.jsx';
import GoalForm from './screens/GoalForm.jsx';
import People from './screens/People.jsx';
import Privacy from './screens/Privacy.jsx';

const DEMO = new URLSearchParams(location.search).has('demo');
const SYNC_TIMEOUT_MS = 8000;

function googleErrorMessage(err) {
  if (err.code === 'auth/popup-blocked') return 'Allow pop-ups for EVIE, then try again.';
  if (err.code === 'auth/network-request-failed') return "You're offline. Connect to the internet and try again.";
  return "Couldn't sign in with Google. Try again.";
}

// Drops the invite code (#join=… or ?join=…) from the address once used, so a reload doesn't
// reopen the join form and the code doesn't linger in history.
function clearInviteFromUrl() {
  const url = new URL(location.href);
  if (!url.searchParams.has('join') && !url.hash.includes('join=')) return;
  url.searchParams.delete('join');
  url.hash = '';
  history.replaceState(null, '', url);
}

export default function App() {
  const [status, setStatus] = useState('loading'); // loading | error | ready
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState(''); // set once the account is linked to Google
  const [googlePic, setGooglePic] = useState(''); // the Google account picture, once linked
  const [member, setMember] = useState(null); // your record in the circle: name and photo
  const [profileOpen, setProfileOpen] = useState(false);
  const [iconOpen, setIconOpen] = useState(false);
  const [circle, setCircle] = useState(null);
  const [name, setName] = useState('');
  const [demo, setDemo] = useState(false); // a "Try a demo" circle full of sample data
  const [inviteCode, setInviteCode] = useState(() => inviteCodeFrom());
  const [inviting, setInviting] = useState(false);
  const [exited, setExited] = useState(null); // null | 'saving' | 'synced' | 'queued'
  const [notice, setNotice] = useState(takeNotice); // shown on the welcome screen, e.g. after leaving
  const [clearing, setClearing] = useState(''); // what's happening while this phone is cleared
  const [entries, setEntries] = useState([]);
  const [entriesLoaded, setEntriesLoaded] = useState(false);
  // Days of entries asked for, and the days the latest snapshot actually covers.
  const [historyDays, setHistoryDays] = useState(HISTORY_STEPS[0]);
  const [loadedDays, setLoadedDays] = useState(0);
  const [resources, setResources] = useState([]);
  const [goals, setGoals] = useState([]);
  // Reopen an unsaved seizure after a reload so its timing isn't lost.
  const [screen, setScreen] = useState(() => (loadSeizureDraft() ? { name: 'seizure' } : { name: 'timeline' }));
  const swipeStart = useRef(null);

  // Sheets belong to the screen they were opened on, e.g. the seizure button leaves them behind.
  useEffect(() => {
    setInviting(false);
    setProfileOpen(false);
    setIconOpen(false);
  }, [screen]);

  async function boot() {
    setStatus('loading');
    try {
      const u = await ensureSignedIn();
      setUser(u);
      setEmail(googleEmail(u));
      setGooglePic(googlePhoto(u));
      const session = loadSession();
      if (session) {
        const c = await getCircle(session.circleId);
        if (c && c.memberIds.includes(u.uid)) {
          setCircle(await upgradeJoinCode(c).catch((err) => {
            console.error('join code upgrade', err); // try again next open; the circle still works
            return c;
          }));
          setName(session.name);
          setDemo(!!session.demo);
        } else {
          clearSession();
          setNotice("You're no longer in that circle. Ask someone in it for the code to join again.");
        }
      }
      setStatus('ready');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }

  useEffect(() => {
    boot();
  }, []);

  // Keep the circle live so care plan and medication schedule edits reach every phone.
  useEffect(() => {
    if (!circle) return undefined;
    const { personName } = circle;
    return subscribeCircle(circle.id, setCircle, (err) => {
      console.error('circle subscription', err);
      // Removed from the circle (or it was deleted) while the app was open.
      if (err.code === 'permission-denied') {
        closeCircle();
        setNotice(`You're no longer in ${personName}'s circle. Ask someone in it for the code to join again.`);
      }
    });
  }, [circle?.id]);

  useEffect(() => {
    if (!circle || !user) return undefined;
    return subscribeMember(circle.id, user.uid, setMember, (err) => console.error('member subscription', err));
  }, [circle?.id, user?.uid]);

  // Once you're signed in with Google, your Google picture becomes your photo, unless you already
  // have one or removed it ('' is kept on purpose so it isn't put back).
  useEffect(() => {
    if (!circle || !member || 'photo' in member || !isAllowedPhoto(googlePic) || !googlePic) return;
    setMyPhoto(circle.id, user.uid, googlePic).catch((err) => console.error('google photo', err));
  }, [circle?.id, member, googlePic]);

  useEffect(() => {
    if (!circle) return undefined;
    return subscribeResources(circle.id, setResources, (err) => console.error('resources subscription', err));
  }, [circle?.id]);

  useEffect(() => {
    if (!circle) return undefined;
    return subscribeGoals(circle.id, setGoals, (err) => console.error('goals subscription', err));
  }, [circle?.id]);

  // Widening the window re-subscribes but keeps what's on screen until the wider list arrives.
  useEffect(() => {
    if (!circle) return undefined;
    return subscribeEntries(
      circle.id,
      historyDays,
      (list, { fromCache }) => {
        setEntries(list);
        setEntriesLoaded(true);
        // Only the server's answer proves the whole window is here. Offline, the cache is all there is.
        if (!fromCache || !navigator.onLine) setLoadedDays(historyDays);
      },
      (err) => {
        console.error('entries subscription', err);
        setEntriesLoaded(true);
      },
    );
  }, [circle?.id, historyDays]);

  const needHistory = (days) => setHistoryDays((d) => Math.max(d, days));

  function handleJoined(c, n, isDemo = false) {
    saveSession({ circleId: c.id, name: n, demo: isDemo });
    clearInviteFromUrl();
    setInviteCode('');
    setCircle(c);
    setName(n);
    setDemo(isDemo);
    setNotice('');
    setEntriesLoaded(false);
    setScreen({ name: 'timeline' });
  }

  function closeCircle() {
    clearSession();
    setCircle(null);
    setMember(null);
    setDemo(false);
    setEntries([]);
    setEntriesLoaded(false);
    setHistoryDays(HISTORY_STEPS[0]);
    setLoadedDays(0);
    setResources([]);
    setGoals([]);
  }

  const PHONE_ONLY = 'Videos, photos and files saved only on this phone will be deleted from it, so share any you want to keep first.';

  // Clears this phone's copy of the circle: Firestore's offline copy, the clips and files kept
  // only here, and EVIE's saved settings (not appearance). Then starts fresh.
  async function clearPhoneAndReload(message) {
    setClearing('Clearing this phone…');
    const cleared = await clearLocalFirestore();
    await deleteMediaDatabase();
    clearEvieStorage();
    setNextNotice(cleared ? message : `${message} Close any other EVIE tabs and reopen EVIE to finish clearing this phone.`);
    location.reload();
  }

  // Leaving takes you out of the circle for real, so it needs the network to tell everyone.
  async function leaveCircle() {
    if (!navigator.onLine) {
      window.alert('Connect to the internet to leave the circle.');
      return;
    }
    if (!window.confirm(
      `Leave ${circle.personName}'s circle? You lose access on every phone until you join again with its code. ${PHONE_ONLY}`,
    )) return;
    const { personName } = circle;
    await flushWrites(SYNC_TIMEOUT_MS); // anything logged offline reaches the circle before you go
    try {
      await withTimeout(leaveCircleForGood(circle, user.uid), SYNC_TIMEOUT_MS * 2);
    } catch (err) {
      console.error('leave', err);
      window.alert("Couldn't leave. Check your connection and try again.");
      return;
    }
    await clearPhoneAndReload(`You left ${personName}'s circle, and this phone's copy of it was cleared.`);
  }

  // Deletes the circle and everything in it for everyone (whoever started it), then clears this phone.
  async function deleteCircleForEveryone() {
    const { personName } = circle;
    setClearing('Deleting the circle…');
    await flushWrites(SYNC_TIMEOUT_MS);
    try {
      await withTimeout(deleteCircle(circle), 120000);
    } catch (err) {
      console.error('delete circle', err);
      setClearing('');
      window.alert("Couldn't finish deleting the circle. Check your connection, then tap Delete again to finish.");
      return;
    }
    await clearPhoneAndReload(`${personName}'s circle was deleted for everyone, and this phone was cleared.`);
  }

  // A demo circle is deleted when it ends, so trial data doesn't pile up. Offline, or if deleting
  // fails, it's only closed on this phone.
  async function endDemo() {
    if (navigator.onLine && ownerOf(circle) === user.uid) {
      setClearing('Ending the demo…');
      try {
        await withTimeout(deleteCircle(circle), 60000);
        await clearPhoneAndReload('The demo ended and its sample data was deleted.');
        return;
      } catch (err) {
        console.error('end demo', err);
        setClearing('');
      }
    }
    closeCircle();
  }

  // From the welcome screen: clears what an earlier circle left on this phone.
  async function clearThisPhone() {
    if (!window.confirm(`Clear EVIE data from this phone? ${PHONE_ONLY} This doesn't change anything in any circle.`)) return;
    await clearPhoneAndReload("EVIE's data was cleared from this phone.");
  }

  // Links Google to this phone's identity. If the Google account already belongs to another
  // phone's identity, switches to it and opens its circle. Resolves to an error message, or ''.
  async function signInWithGoogle() {
    try {
      const u = await connectGoogle(() => !circle || window.confirm(
        `This Google account is already used with EVIE on another phone. Switch to it? `
        + `This phone will leave ${circle.personName}'s circle; you can rejoin with its code.`,
      ));
      if (!u) return '';
      setEmail(googleEmail(u));
      setGooglePic(googlePhoto(u));
      if (u.uid === user.uid) return '';
      closeCircle();
      setUser(u);
      const found = await findMyCircle(u.uid);
      if (found) handleJoined(found.circle, found.name || u.displayName || 'Me');
      return '';
    } catch (err) {
      console.error('google sign-in', err);
      return googleErrorMessage(err);
    }
  }

  async function signOutOfGoogle() {
    // Signing out starts a new anonymous identity, which needs the network.
    if (!navigator.onLine) {
      window.alert('Connect to the internet to sign out.');
      return;
    }
    const back = circle ? ' Sign in again to get back to your circle.' : '';
    if (!window.confirm(`Sign out of Google on this phone?${back} ${PHONE_ONLY}`)) return;
    await flushWrites(SYNC_TIMEOUT_MS);
    try {
      await signOutGoogle();
    } catch (err) {
      console.error('sign out', err);
      window.alert("Couldn't sign out. Try again.");
      return;
    }
    await clearPhoneAndReload(circle ? "You signed out of Google, and this phone's copy of the circle was cleared." : 'You signed out of Google.');
  }

  // Browsers only let a page close itself in some installed apps, so this syncs first and then
  // shows a closing screen. Firestore keeps unsynced changes on the phone either way.
  async function exitApp() {
    setExited('saving');
    setExited((await flushWrites(SYNC_TIMEOUT_MS)) ? 'synced' : 'queued');
    window.close();
  }

  if (clearing) return <div className="center"><Loader label={clearing} /></div>;
  if (status === 'loading') return <div className="center"><Loader /></div>;
  if (status === 'error') {
    return (
      <div className="center">
        <p>Can't connect.</p>
        <button className="btn primary" onClick={boot}>Retry</button>
      </div>
    );
  }

  if (exited) {
    return (
      <main className="app">
        <div className="center" role="status">
          {exited === 'saving' && <Loader label="Saving your changes…" quiet />}
          {exited === 'synced' && <><h1>All changes saved</h1><p className="muted">You can close EVIE now.</p></>}
          {exited === 'queued' && (
            <><h1>Saved on this phone</h1><p className="muted">Changes will sync the next time EVIE is open and online. You can close it now.</p></>
          )}
          {exited !== 'saving' && <button className="btn primary" onClick={() => setExited(null)}>Open EVIE again</button>}
        </div>
      </main>
    );
  }

  const me = { uid: user.uid, name };
  const myPhoto = member?.photo || '';
  // Saves at once; offline it's queued like entries, and the live record shows it straight away.
  const changePhoto = (photo) => setMyPhoto(circle.id, user.uid, photo).catch((err) => {
    console.error('photo', err);
    showToast("Couldn't save your photo. Try again.");
  });
  const go = (next) => setScreen(next);
  // With no goal to log against yet, Goal opens the goals list, which explains them.
  const quickLog = (type) => go(type === 'goal' && !goals.some((g) => g.status === 'active') ? { name: 'goals' } : { name: 'quick', type });
  const home = () => setScreen({ name: 'timeline' });

  let body;
  if (!circle) {
    body = screen.name === 'privacy'
      ? <Privacy onBack={home} />
      : (
        <Welcome
          uid={user.uid} onJoined={handleJoined} inviteCode={inviteCode} email={email} googlePhoto={googlePic}
          onGoogle={signInWithGoogle} onSignOut={signOutOfGoogle}
          notice={notice} onPrivacy={() => go({ name: 'privacy' })} onClearPhone={clearThisPhone}
        />
      );
  } else {
    switch (screen.name) {
      case 'seizure':
        body = <LogSeizure circle={circle} me={me} onDone={home} />;
        break;
      case 'quick':
        body = (
          <QuickLog circle={circle} me={me} type={screen.type} entries={entries} goals={goals} goalId={screen.goalId}
            onDone={() => setScreen(screen.back || { name: 'timeline' })} />
        );
        break;
      case 'detail': {
        const entry = entries.find((e) => e.id === screen.id);
        const back = () => setScreen(screen.back || { name: 'timeline' });
        body = entry
          ? <EntryDetail circle={circle} entry={entry} me={me} onBack={back} />
          : <div className="center"><p className="muted">This entry was deleted.</p><button className="btn" onClick={back}>Back</button></div>;
        break;
      }
      case 'support':
        body = (
          <Support
            circle={circle}
            resources={resources}
            onBack={home}
            onAdd={(prefill) => go({ name: 'resource', prefill })}
            onEdit={(id) => go({ name: 'resource', id })}
          />
        );
        break;
      case 'resource': {
        const resource = screen.id ? resources.find((r) => r.id === screen.id) : null;
        const back = () => go({ name: 'support' });
        body = screen.id && !resource
          ? <div className="center"><p className="muted">This resource was removed.</p><button className="btn" onClick={back}>Back</button></div>
          : <ResourceForm circle={circle} me={me} resource={resource} prefill={screen.prefill} onDone={back} />;
        break;
      }
      case 'goals':
        body = (
          <Goals
            circle={circle}
            goals={goals}
            entries={entries}
            onBack={home}
            onAdd={() => go({ name: 'goal' })}
            onEdit={(id) => go({ name: 'goal', id })}
            onPractice={(goalId) => go({ name: 'quick', type: 'goal', goalId, back: { name: 'goals' } })}
          />
        );
        break;
      case 'goal': {
        const goal = screen.id ? goals.find((g) => g.id === screen.id) : null;
        const back = () => go({ name: 'goals' });
        body = screen.id && !goal
          ? <div className="center"><p className="muted">This goal was removed.</p><button className="btn" onClick={back}>Back</button></div>
          : <GoalForm circle={circle} me={me} goal={goal} onDone={back} />;
        break;
      }
      case 'people':
        body = (
          <People circle={circle} me={me} onBack={home} onInvite={() => setInviting(true)} onDeleteCircle={deleteCircleForEveryone} />
        );
        break;
      case 'privacy':
        body = <Privacy onBack={home} />;
        break;
      case 'schedule':
        body = <Schedule circle={circle} onBack={home} />;
        break;
      case 'emergency':
        body = <Emergency circle={circle} onBack={home} onEditPlan={() => go({ name: 'careplan' })} />;
        break;
      case 'careplan':
        body = <CarePlan circle={circle} me={me} onDone={home} />;
        break;
      case 'summary':
        body = (
          <Summary
            circle={circle}
            entries={entries}
            days={screen.days || 30}
            loadedDays={loadedDays}
            onNeedHistory={needHistory}
            onDaysChange={(days) => go({ name: 'summary', days })}
            onBack={home}
            onOpen={(id) => go({ name: 'detail', id, back: screen })}
          />
        );
        break;
      default:
        body = (
          <Timeline
            circle={circle}
            me={me}
            entries={entries}
            resources={resources}
            loading={!entriesLoaded}
            historyDays={loadedDays}
            onShowOlder={needHistory}
            onOpen={(id) => go({ name: 'detail', id })}
            onCarePlan={() => go({ name: 'careplan' })}
            onEmergency={() => go({ name: 'emergency' })}
            onSchedule={() => go({ name: 'schedule' })}
            onInvite={() => setInviting(true)}
            onOpenResource={(id) => go({ name: 'resource', id })}
            photo={myPhoto}
            onProfile={() => setProfileOpen(true)}
            onCircleIcon={() => setIconOpen(true)}
          />
        );
    }
  }

  // The nav is on every screen once in a circle, except while timing a seizure.
  const showNav = circle && screen.name !== 'seizure';
  // Any screen name the switch above doesn't handle falls through to the timeline (home).
  const atHome = !['seizure', 'quick', 'detail', 'support', 'resource', 'goals', 'goal', 'people', 'privacy', 'schedule', 'emergency', 'careplan', 'summary'].includes(screen.name);
  // Swiping sideways moves between Home and the Care summary, like the two tabs they are in the nav.
  const swipeable = circle && (atHome || screen.name === 'summary');
  function onTouchStart(e) {
    const t = e.touches[0];
    swipeStart.current = swipeable && e.touches.length === 1 && !ownsSideways(e.target) ? { x: t.clientX, y: t.clientY } : null;
  }
  function onTouchEnd(e) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dir = swipeDirection(t.clientX - start.x, t.clientY - start.y);
    if (dir === 'left' && atHome) go({ name: 'summary' });
    if (dir === 'right' && screen.name === 'summary') home();
  }

  return (
    <>
      <OfflineBanner />
      <main className={`app${atHome && circle ? ' app-home' : ''}${showNav ? ' app-nav' : ''}`}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {demo && circle && atHome && (
          <p className="demo-banner no-print">
            Demo circle with made-up data.
            <button className="btn small" onClick={endDemo}>End demo</button>
          </p>
        )}
        {body}
      </main>
      <Toast />
      {inviting && circle && <InviteSheet circle={circle} onClose={() => setInviting(false)} />}
      {iconOpen && circle && <CircleIconSheet circle={circle} onClose={() => setIconOpen(false)} />}
      {profileOpen && circle && (
        <ProfileSheet circle={circle} me={me} photo={myPhoto} googlePhoto={googlePic} email={email}
          onChangePhoto={changePhoto} onGoogle={signInWithGoogle} onSignOut={signOutOfGoogle} onClose={() => setProfileOpen(false)} />
      )}
      {showNav && (
        <AppNav
          circle={circle}
          me={me}
          resources={resources}
          goals={goals}
          demo={DEMO}
          email={email}
          photo={myPhoto}
          onProfile={() => setProfileOpen(true)}
          active={screen.name === 'summary' ? 'summary' : atHome ? 'home' : null}
          onHome={() => { setScreen({ name: 'timeline' }); scrollToTop(); }}
          onSummary={() => go({ name: 'summary' })}
          onSeizure={() => go({ name: 'seizure' })}
          onQuickLog={quickLog}
          onGoals={() => go({ name: 'goals' })}
          onCarePlan={() => go({ name: 'careplan' })}
          onSchedule={() => go({ name: 'schedule' })}
          onSupport={() => go({ name: 'support' })}
          onInvite={() => setInviting(true)}
          onPeople={() => go({ name: 'people' })}
          onPrivacy={() => go({ name: 'privacy' })}
          onGoogle={signInWithGoogle}
          onSignOut={signOutOfGoogle}
          onExit={exitApp}
          onLeave={leaveCircle}
        />
      )}
    </>
  );
}
