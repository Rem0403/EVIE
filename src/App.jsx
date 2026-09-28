import { useEffect, useState } from 'react';
import { ensureSignedIn } from './firebase.js';
import { getCircle, subscribeCircle, upgradeJoinCode } from './data/circles.js';
import { subscribeEntries } from './data/entries.js';
import { subscribeResources } from './data/resources.js';
import { clearSession, loadSession, saveSession } from './lib/session.js';
import { loadSeizureDraft } from './lib/seizureDraft.js';
import OfflineBanner from './components/OfflineBanner.jsx';
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

const DEMO = new URLSearchParams(location.search).has('demo');

export default function App() {
  const [status, setStatus] = useState('loading'); // loading | error | ready
  const [user, setUser] = useState(null);
  const [circle, setCircle] = useState(null);
  const [name, setName] = useState('');
  const [entries, setEntries] = useState([]);
  const [entriesLoaded, setEntriesLoaded] = useState(false);
  const [resources, setResources] = useState([]);
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
          setCircle(await upgradeJoinCode(c).catch((err) => {
            console.error('join code upgrade', err); // try again next open; the circle still works
            return c;
          }));
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

  // Keep the circle live so care plan and medication schedule edits reach every phone.
  useEffect(() => {
    if (!circle) return undefined;
    return subscribeCircle(circle.id, setCircle, (err) => console.error('circle subscription', err));
  }, [circle?.id]);

  useEffect(() => {
    if (!circle) return undefined;
    return subscribeResources(circle.id, setResources, (err) => console.error('resources subscription', err));
  }, [circle?.id]);

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
    setResources([]);
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
      case 'schedule':
        body = <Schedule circle={circle} onBack={home} />;
        break;
      case 'emergency':
        body = <Emergency circle={circle} onBack={home} onEditPlan={() => go({ name: 'careplan' })} />;
        break;
      case 'careplan':
        body = <CarePlan circle={circle} onDone={home} />;
        break;
      case 'summary':
        body = (
          <Summary
            circle={circle}
            entries={entries}
            days={screen.days || 30}
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
            demo={DEMO}
            onOpen={(id) => go({ name: 'detail', id })}
            onLogSeizure={() => go({ name: 'seizure' })}
            onQuickLog={(type) => go({ name: 'quick', type })}
            onSummary={() => go({ name: 'summary' })}
            onCarePlan={() => go({ name: 'careplan' })}
            onSupport={() => go({ name: 'support' })}
            onEmergency={() => go({ name: 'emergency' })}
            onSchedule={() => go({ name: 'schedule' })}
            onOpenResource={(id) => go({ name: 'resource', id })}
            onLeave={leaveCircle}
          />
        );
    }
  }

  return (
    <>
      <OfflineBanner />
      <main className={`app${screen.name === 'timeline' && circle ? ' app-home' : ''}`}>{body}</main>
    </>
  );
}
