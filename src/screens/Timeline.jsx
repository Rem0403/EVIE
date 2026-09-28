import { useEffect, useState } from 'react';
import ChipGroup from '../components/ChipGroup.jsx';
import EntryCard from '../components/EntryCard.jsx';
import BottomBar from '../components/BottomBar.jsx';
import TodayMeds from '../components/TodayMeds.jsx';
import Handoff from '../components/Handoff.jsx';
import FollowUps from '../components/FollowUps.jsx';
import Icon from '../components/Icon.jsx';
import { groupByDay } from '../lib/format.js';
import { todaysDoses } from '../lib/meds.js';
import { currentHandoff } from '../lib/handoff.js';
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
  ['med', 'Medication'],
  ['sleep', 'Sleep'],
  ['behavior', 'Behavior'],
  ['note', 'Note'],
];

// Home: a short stack of cards (like a health app's summary page), then the shared timeline.
// Less-used screens live one tap away in the More sheet.
export default function Timeline({
  circle, me, entries, resources = [], loading = false, demo,
  onOpen, onLogSeizure, onQuickLog, onSummary, onCarePlan, onSupport, onOpenResource, onEmergency, onSchedule, onLeave,
}) {
  const [filter, setFilter] = useState('all');
  const [chooser, setChooser] = useState(false);
  const [more, setMore] = useState(false);
  const [toast, setToast] = useFlash();
  const [seeding, setSeeding] = useState(false);
  // Re-render each minute so doses turn "Due", and handoffs end, while the app sits open.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  // One calm line under the greeting: how today's doses are going, and who's with them.
  const doses = circle.meds?.length ? todaysDoses(circle.meds, entries, now) : [];
  const handoff = currentHandoff(entries);
  const withNow = handoff && !(handoff.until && handoff.until < now) ? `With ${handoff.createdByName || 'someone'}` : null;
  const status = [
    doses.length ? `${doses.filter((d) => d.state === 'given').length} of ${doses.length} doses given` : null,
    withNow,
  ].filter(Boolean).join(' · ') || 'Shared with your care circle';

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

  const fromMore = (action) => () => {
    setMore(false);
    action();
  };

  return (
    <>
      <header className="home-header">
        <div>
          <h1>{circle.personName}’s day</h1>
          {!loading && <p className="status-line"><span className="status-dot" aria-hidden="true" />{status}</p>}
          {toast && <p className="muted small" role="status">{toast}</p>}
        </div>
        <div className="row">
          <button className="btn small" onClick={onSummary}>Care summary</button>
          <button className="btn small icon-btn" aria-label="More" onClick={() => setMore(true)}><Icon name="more" /></button>
        </div>
      </header>

      <div className="home-grid">
        {!loading && (
          <>
            <Handoff circle={circle} me={me} entries={entries} now={now} />
            <TodayMeds circle={circle} me={me} entries={entries} now={now} onSetUp={onCarePlan} />
          </>
        )}

        <button className="summary-card block-pink tabbed emergency-row" onClick={onEmergency}>
          <span className="tab" aria-hidden="true">Emergency</span>
          <span>
            <span className="block-title">Emergency info</span>
            <span className="card-sub" style={{ display: 'block' }}>Contacts, seizure plan, allergies and medications</span>
          </span>
          <span className="round-go" aria-hidden="true"><Icon name="chevron" size={18} /></span>
        </button>

        {!loading && <FollowUps resources={resources} now={now} onOpen={onOpenResource} />}
      </div>

      <h2 className="section-title">Timeline</h2>
      <div className="chips scroll filters">
        <ChipGroup options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      {loading && (
        <div aria-busy="true" aria-label="Loading">
          {[0, 1, 2].map((i) => <div key={i} className="card skeleton" aria-hidden="true" />)}
        </div>
      )}

      {!loading && groups.length === 0 && (
        <div className="empty">
          {filter === 'all'
            ? 'Nothing logged yet. Tap Start seizure or Log to add the first entry.'
            : 'No entries of this type yet.'}
        </div>
      )}

      {groups.map((group) => (
        <section key={group.key}>
          <h3 className="day-label">{group.label}</h3>
          <div className="day-entries">
            {group.entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} onClick={() => onOpen(entry.id)} />
            ))}
          </div>
        </section>
      ))}

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

      {more && (
        <div className="sheet-backdrop" onClick={() => setMore(false)}>
          <div className="sheet panel grouped" role="dialog" aria-modal="true" aria-label="More" onClick={(e) => e.stopPropagation()}>
            <h2>More</h2>
            <div className="group">
              <button className="list-row" onClick={fromMore(onCarePlan)}>Care plan<Icon name="chevron" size={18} /></button>
              <button className="list-row" onClick={fromMore(onSchedule)}>Caregiver schedule<Icon name="chevron" size={18} /></button>
              <button className="list-row" onClick={fromMore(onSupport)}>Support<Icon name="chevron" size={18} /></button>
            </div>
            <div className="group">
              <button className="list-row" onClick={fromMore(share)}>
                <span>Invite family<span className="list-sub">Code {circle.joinCode}</span></span>
                <Icon name="chevron" size={18} />
              </button>
              {demo && (
                <button className="list-row" onClick={fromMore(loadDemo)} disabled={seeding}>
                  {seeding ? 'Loading…' : 'Load demo week'}
                </button>
              )}
            </div>
            <div className="group">
              <button className="list-row danger" onClick={fromMore(onLeave)}>Leave circle on this device</button>
            </div>
            <button className="btn" onClick={() => setMore(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
