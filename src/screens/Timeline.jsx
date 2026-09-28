import { useEffect, useState } from 'react';
import ChipGroup from '../components/ChipGroup.jsx';
import EntryCard from '../components/EntryCard.jsx';
import BottomBar from '../components/BottomBar.jsx';
import TodayMeds from '../components/TodayMeds.jsx';
import Handoff from '../components/Handoff.jsx';
import FollowUps from '../components/FollowUps.jsx';
import Icon from '../components/Icon.jsx';
import { groupByDay } from '../lib/format.js';
import { shareJoinCode, shareMessage } from '../lib/share.js';
import { useFlash } from '../lib/useFlash.js';
import { buildDemoWeek, DEMO_CARE_PLAN, demoResources } from '../lib/demoWeek.js';
import { addEntriesBatch } from '../data/entries.js';
import { updateCircle } from '../data/circles.js';
import { addResource } from '../data/resources.js';

const FILTERS = [
  ['all', 'All'],
  ['seizure', 'Seizures'],
  ['med', 'Meds'],
  ['sleep', 'Sleep'],
  ['behavior', 'Behavior'],
  ['note', 'Notes'],
];

const QUICK_TYPES = [
  ['med', 'Med'],
  ['sleep', 'Sleep'],
  ['behavior', 'Behavior'],
  ['note', 'Note'],
];

export default function Timeline({
  circle, me, entries, resources = [], loading = false, demo,
  onOpen, onLogSeizure, onQuickLog, onSummary, onCarePlan, onSupport, onOpenResource, onLeave,
}) {
  const [filter, setFilter] = useState('all');
  const [chooser, setChooser] = useState(false);
  const [toast, setToast] = useFlash();
  const [seeding, setSeeding] = useState(false);
  // Re-render each minute so doses turn "Due", and handoffs end, while the app sits open.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const visible = filter === 'all' ? entries : entries.filter((e) => e.type === filter);
  const groups = groupByDay(visible);

  async function share() {
    const result = await shareJoinCode(circle);
    setToast(shareMessage(result, circle));
  }

  async function loadDemo() {
    if (!window.confirm('Add a demo week of entries to this circle?')) return;
    setSeeding(true);
    try {
      await addEntriesBatch(circle.id, buildDemoWeek(Date.now(), me));
      // Only fill in a care plan nobody has written yet.
      if (!circle.meds?.length && !circle.profile) await updateCircle(circle.id, DEMO_CARE_PLAN);
      if (!resources.length) for (const r of demoResources(Date.now(), me)) addResource(circle.id, r);
    } catch (err) {
      console.error(err);
      setToast("Couldn't load demo data.");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <>
      <header className="header">
        <div>
          <h1>{circle.personName}</h1>
          <button className="code-chip" onClick={share}>Code {circle.joinCode} · invite</button>
          {toast && <p className="muted small">{toast}</p>}
        </div>
        <div className="header-actions">
          <button className="btn small" onClick={onCarePlan}>Care plan</button>
          <button className="btn small" onClick={onSupport}>Support</button>
          <button className="btn small" onClick={onSummary}>Summary</button>
        </div>
      </header>

      {!loading && (
        <>
          <Handoff circle={circle} me={me} entries={entries} now={now} />
          <TodayMeds circle={circle} me={me} entries={entries} now={now} onSetUp={onCarePlan} />
          <FollowUps resources={resources} now={now} onOpen={onOpenResource} />
        </>
      )}

      <div className="chips scroll">
        <ChipGroup options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      {loading && [0, 1, 2].map((i) => <div key={i} className="card skeleton" aria-hidden="true" />)}

      {!loading && groups.length === 0 && (
        <div className="empty">
          {filter === 'all'
            ? 'Nothing logged yet. Tap Seizure or + Log to add the first entry.'
            : 'No entries of this type yet.'}
        </div>
      )}

      {groups.map((group) => (
        <section key={group.key}>
          <h2 className="day-label">{group.label}</h2>
          {group.entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} onClick={() => onOpen(entry.id)} />
          ))}
        </section>
      ))}

      <div className="stack" style={{ marginTop: 24 }}>
        {demo && (
          <button className="btn" onClick={loadDemo} disabled={seeding}>
            {seeding ? 'Loading…' : 'Load demo week'}
          </button>
        )}
        <button className="btn ghost small" onClick={onLeave}>Leave circle on this device</button>
      </div>

      <BottomBar onSeizure={onLogSeizure} onLog={() => setChooser(true)} />

      {chooser && (
        <div className="sheet-backdrop" onClick={() => setChooser(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            {QUICK_TYPES.map(([type, label]) => (
              <button key={type} className={`btn type-${type}`} onClick={() => { setChooser(false); onQuickLog(type); }}>
                <Icon name={type} size={22} /> {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
