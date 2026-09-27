import { useEffect, useState } from 'react';
import { ensureSignedIn } from './firebase.js';
import { getCircle } from './data/circles.js';
import { subscribeEntries } from './data/entries.js';
import { clearSession, loadSession, saveSession } from './lib/session.js';
import { loadSeizureDraft } from './lib/seizureDraft.js';
import OfflineBanner from './components/OfflineBanner.jsx';
import Welcome from './screens/Welcome.jsx';
import Timeline from './screens/Timeline.jsx';
import LogSeizure from './screens/LogSeizure.jsx';
import QuickLog from './screens/QuickLog.jsx';
import EntryDetail from './screens/EntryDetail.jsx';
import Summary from './screens/Summary.jsx';

const DEMO = new URLSearchParams(location.search).has('demo');

export default function App() {
  const [status, setStatus] = useState('loading'); // loading | error | ready
  const [user, setUser] = useState(null);
  const [circle, setCircle] = useState(null);
  const [name, setName] = useState('');
  const [entries, setEntries] = useState([]);
  const [entriesLoaded, setEntriesLoaded] = useState(false);
  // Reopen an unsaved seizure after a reload so its timing isn't lost.
  const [screen, setScreen] = useState(() => (loadSeizureDraft() ? { name: 'seizure' } : { name: 'timeline' }));

  async function boot() {
    setStatus('loading');
    try {
      const u = await ensureSignedIn();
      setUser(u);
      const session = loadSession();
      if (session) {
        const c = await getCircle(session.circleId);
        if (c && c.memberIds.includes(u.uid)) {
          setCircle(c);
          setName(session.name);
        } else {
          clearSession();
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

  useEffect(() => {
    if (!circle) return undefined;
    setEntriesLoaded(false);
    return subscribeEntries(
      circle.id,
      (list) => {
        setEntries(list);
        setEntriesLoaded(true);
      },
      (err) => {
        console.error('entries subscription', err);
        setEntriesLoaded(true);
      },
    );
  }, [circle?.id]);

  function handleJoined(c, n) {
    saveSession({ circleId: c.id, name: n });
    setCircle(c);
    setName(n);
    setScreen({ name: 'timeline' });
  }

  function leaveCircle() {
    if (!window.confirm('Leave this circle on this device? You can rejoin with the code.')) return;
    clearSession();
    setCircle(null);
    setEntries([]);
  }

  if (status === 'loading') return <div className="center muted">Loading…</div>;
  if (status === 'error') {
    return (
      <div className="center">
        <p>Can't connect.</p>
        <button className="btn primary" onClick={boot}>Retry</button>
      </div>
    );
  }

  const me = { uid: user.uid, name };
  const go = (next) => setScreen(next);
  const home = () => setScreen({ name: 'timeline' });

  let body;
  if (!circle) {
    body = <Welcome uid={user.uid} onJoined={handleJoined} />;
  } else {
    switch (screen.name) {
      case 'seizure':
        body = <LogSeizure circle={circle} me={me} onDone={home} />;
        break;
      case 'quick':
        body = <QuickLog circle={circle} me={me} type={screen.type} entries={entries} onDone={home} />;
        break;
      case 'detail': {
        const entry = entries.find((e) => e.id === screen.id);
        const back = () => setScreen(screen.back || { name: 'timeline' });
        body = entry
          ? <EntryDetail circle={circle} entry={entry} me={me} onBack={back} />
          : <div className="center"><p className="muted">This entry was deleted.</p><button className="btn" onClick={back}>Back</button></div>;
        break;
      }
      case 'summary':
        body = (
          <Summary
            circle={circle}
            entries={entries}
            days={screen.days || 7}
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
            loading={!entriesLoaded}
            demo={DEMO}
            onOpen={(id) => go({ name: 'detail', id })}
            onLogSeizure={() => go({ name: 'seizure' })}
            onQuickLog={(type) => go({ name: 'quick', type })}
            onSummary={() => go({ name: 'summary' })}
            onLeave={leaveCircle}
          />
        );
    }
  }

  return (
    <>
      <OfflineBanner />
      <main className="app">{body}</main>
    </>
  );
}
