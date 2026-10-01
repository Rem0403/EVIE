import { useEffect, useMemo, useState } from 'react';
import ChipGroup from '../components/ChipGroup.jsx';
import EntryCard from '../components/EntryCard.jsx';
import TodayMeds from '../components/TodayMeds.jsx';
import Handoff from '../components/Handoff.jsx';
import FollowUps from '../components/FollowUps.jsx';
import GettingStarted from '../components/GettingStarted.jsx';
import Icon from '../components/Icon.jsx';
import Avatar from '../components/Avatar.jsx';
import { CircleIcon } from '../components/CircleIconPicker.jsx';
import { circleIconOf } from '../lib/circleIcon.js';
import { dayLabel, formatTime, groupByDay, labelOf, SLEEP_QUALITY } from '../lib/format.js';
import {
  gettingStarted, hideGettingStarted, isGettingStartedHidden, lastSleep, recentSeizures,
} from '../lib/home.js';
import { scrollToId } from '../lib/scroll.js';
import { nextHistoryStep } from '../lib/summary.js';

// No "All" chip: nothing selected shows everything, and tapping the selected chip again clears it.
const FILTERS = [
  ['seizure', 'Seizures'],
  ['med', 'Meds'],
  ['sleep', 'Sleep'],
  ['behavior', 'Behavior'],
  ['goal', 'Goals'],
  ['note', 'Notes'],
];

const hoursAndMinutes = (min) => `${Math.floor(min / 60)}h ${min % 60}m`;
const whenShort = (ms, now) => `${dayLabel(ms, now)}, ${formatTime(ms)}`;

// Home: two stat tiles, then cards sized by what needs doing now, then the shared timeline.
// Navigation (Seizure, Log, More…) is the floating AppNav, shown on every screen.
export default function Timeline({
  circle, me, entries, resources = [], loading = false, historyDays, onShowOlder,
  onOpen, onCarePlan, onOpenResource, onEmergency, onSchedule, onInvite, photo = '', onProfile, onCircleIcon,
}) {
  const [filter, setFilter] = useState(null);
  // Re-render each minute so doses turn "Due", and handoffs end, while the app sits open.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const [setupHidden, setSetupHidden] = useState(() => isGettingStartedHidden(circle.id));
  const steps = gettingStarted(circle, entries);
  const showSetup = !loading && !setupHidden && steps.some((s) => !s.done);
  // A new circle shows the checklist instead of cards that would only say "nothing yet".
  const empty = !loading && entries.length === 0;

  const seizures = recentSeizures(entries, now);
  const sleep = lastSleep(entries, now);
  const groups = useMemo(() => groupByDay(filter ? entries.filter((e) => e.type === filter) : entries), [entries, filter]);
  // Only the last `historyDays` days are loaded. Offer older ones when the circle is older than that.
  const createdAt = circle.createdAt?.toMillis ? circle.createdAt.toMillis() : circle.createdAt;
  const next = historyDays ? nextHistoryStep(historyDays) : null;
  const olderExists = !!historyDays && (!createdAt || createdAt < now - historyDays * 24 * 3600 * 1000);

  // Tapping a stat tile shows those entries in the timeline below.
  function showType(type) {
    setFilter(type);
    scrollToId('timeline');
  }

  return (
    <>
      <header className="brand-row">
        {/* The circle's icon; tapping it changes it. Circles from before icons show the EVIE mark until one is chosen. */}
        {onCircleIcon ? (
          <button className="circle-icon-btn" onClick={onCircleIcon}
            aria-label={circleIconOf(circle) ? 'Change circle icon' : 'Choose a circle icon'}>
            {circleIconOf(circle)
              ? <CircleIcon icon={circleIconOf(circle)} size={40} />
              : <span className="logo-mark"><Icon name="seizure" size={22} /></span>}
          </button>
        ) : (
          <span className="logo-mark" aria-hidden="true"><Icon name="seizure" size={22} /></span>
        )}
        <button className="btn small schedule-btn" onClick={onSchedule} aria-label="Schedule"><Icon name="calendar" size={18} /><span className="hide-narrow">Schedule</span></button>
        <button className="btn small" onClick={onInvite} aria-label="Invite family"><Icon name="users" size={18} /><span className="hide-narrow">Invite</span></button>
        {onProfile && (
          <button className="avatar-btn" onClick={onProfile} aria-label="Your profile"><Avatar name={me.name} photo={photo} size={40} /></button>
        )}
      </header>
      <h1 className="page-title">{circle.personName}’s day</h1>

      <div className="bento">
        {showSetup && (
          <GettingStarted
            steps={steps}
            onCarePlan={onCarePlan}
            onInvite={onInvite}
            onHide={() => { hideGettingStarted(circle.id); setSetupHidden(true); }}
          />
        )}
        {!loading && (
          <>
            <button className="tile tint-seizure" onClick={() => showType('seizure')}>
              <span className="tile-label">Seizures this week</span>
              <span className="tile-value">{seizures.count}</span>
              <span className="tile-sub">{seizures.last ? `Last: ${whenShort(seizures.last.occurredAt, now)}` : 'None logged'}</span>
            </button>
            <button className="tile tint-sleep" onClick={() => showType('sleep')}>
              <span className="tile-label">Sleep last night</span>
              <span className="tile-value">{sleep ? hoursAndMinutes(sleep.minutes) : '—'}</span>
              <span className="tile-sub">{sleep?.entry.quality ? labelOf(SLEEP_QUALITY, sleep.entry.quality) : 'Not logged'}</span>
            </button>
          </>
        )}
        {!loading && (circle.meds?.length > 0 || !showSetup) && (
          <TodayMeds circle={circle} me={me} entries={entries} now={now} onSetUp={onCarePlan} />
        )}
        {!loading && (!empty || circle.schedule?.length > 0) && (
          <Handoff circle={circle} me={me} entries={entries} now={now} />
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
            {olderExists
              ? `Nothing ${filter ? 'of this type ' : ''}logged in the last ${historyDays} days.`
              : filter
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

        {!loading && olderExists && (
          <div className="older no-print">
            <p className="muted small">Showing the last {historyDays} days.</p>
            {next && <button className="btn" onClick={() => onShowOlder(next)}>Show older entries</button>}
          </div>
        )}
      </section>
    </>
  );
}
