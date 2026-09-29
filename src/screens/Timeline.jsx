import { useEffect, useState } from 'react';
import ChipGroup from '../components/ChipGroup.jsx';
import EntryCard from '../components/EntryCard.jsx';
import TodayMeds from '../components/TodayMeds.jsx';
import Handoff from '../components/Handoff.jsx';
import FollowUps from '../components/FollowUps.jsx';
import Icon from '../components/Icon.jsx';
import { dayLabel, formatTime, groupByDay, labelOf, SLEEP_QUALITY } from '../lib/format.js';
import { lastSleep, recentSeizures } from '../lib/home.js';
import { scrollToId } from '../lib/scroll.js';

// No "All" chip: nothing selected shows everything, and tapping the selected chip again clears it.
const FILTERS = [
  ['seizure', 'Seizures'],
  ['med', 'Meds'],
  ['sleep', 'Sleep'],
  ['behavior', 'Behavior'],
  ['note', 'Notes'],
];

const hoursAndMinutes = (min) => `${Math.floor(min / 60)}h ${min % 60}m`;
const whenShort = (ms, now) => `${dayLabel(ms, now)}, ${formatTime(ms)}`;

// Home: two stat tiles, then cards sized by what needs doing now, then the shared timeline.
// Navigation (Seizure, Log, More…) is the floating AppNav, shown on every screen.
export default function Timeline({
  circle, me, entries, resources = [], loading = false,
  onOpen, onCarePlan, onOpenResource, onEmergency, onSchedule,
}) {
  const [filter, setFilter] = useState(null);
  // Re-render each minute so doses turn "Due", and handoffs end, while the app sits open.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const seizures = recentSeizures(entries, now);
  const sleep = lastSleep(entries, now);
  const visible = filter ? entries.filter((e) => e.type === filter) : entries;
  const groups = groupByDay(visible);

  // Tapping a stat tile shows those entries in the timeline below.
  function showType(type) {
    setFilter(type);
    scrollToId('timeline');
  }

  return (
    <>
      <header className="brand-row">
        <span className="logo-mark" aria-hidden="true"><Icon name="seizure" size={22} /></span>
        <span className="wordmark">EVIE</span>
        <button className="btn small schedule-btn" onClick={onSchedule}><Icon name="calendar" size={18} />Schedule</button>
      </header>
      <h1 className="page-title">{circle.personName}’s day</h1>

      <div className="bento">
        {!loading && (
          <>
            <button className="tile tint-seizure" onClick={() => showType('seizure')}>
              <span className="icon-circle ic-seizure" aria-hidden="true"><Icon name="seizure" size={22} /></span>
              <span className="tile-label">Seizures <span className="tile-sub">· 7 days</span></span>
              <span className="tile-value">{seizures.count}</span>
              <span className="tile-sub">{seizures.last ? `Last: ${whenShort(seizures.last.occurredAt, now)}` : 'None logged'}</span>
            </button>
            <button className="tile tint-sleep" onClick={() => showType('sleep')}>
              <span className="icon-circle ic-sleep" aria-hidden="true"><Icon name="sleep" size={22} /></span>
              <span className="tile-label">Sleep <span className="tile-sub">· last night</span></span>
              <span className="tile-value">{sleep ? hoursAndMinutes(sleep.minutes) : '—'}</span>
              <span className="tile-sub">{sleep?.entry.quality ? labelOf(SLEEP_QUALITY, sleep.entry.quality) : 'Not logged'}</span>
            </button>
            <TodayMeds circle={circle} me={me} entries={entries} now={now} onSetUp={onCarePlan} />
            <Handoff circle={circle} me={me} entries={entries} now={now} />
          </>
        )}

        <button className="summary-card feature block-danger emergency-row" onClick={onEmergency}>
          <Icon name="phone" size={22} />
          <span className="emergency-text">
            <span className="feature-title">Emergency info</span>
            <span className="card-sub">Contacts, seizure plan, allergies</span>
          </span>
          <Icon name="chevron" size={20} />
        </button>

        {!loading && <FollowUps resources={resources} now={now} onOpen={onOpenResource} />}
      </div>

      <section className="timeline-section" aria-labelledby="timeline">
        <h2 className="section-title" id="timeline">Timeline</h2>
        <div className="filters">
          <ChipGroup options={FILTERS} value={filter} onChange={(type) => setFilter(type === filter ? null : type)} />
        </div>

        {loading && (
          <div aria-busy="true" aria-label="Loading">
            {[0, 1, 2].map((i) => <div key={i} className="card skeleton" aria-hidden="true" />)}
          </div>
        )}

        {!loading && groups.length === 0 && (
          <div className="empty">
            {filter
              ? 'No entries of this type yet.'
              : 'Nothing logged yet. Tap Seizure or + in the bar below to add the first entry.'}
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
      </section>
    </>
  );
}
