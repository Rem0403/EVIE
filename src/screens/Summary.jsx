import ChipGroup from '../components/ChipGroup.jsx';
import Media from '../components/Media.jsx';
import Icon from '../components/Icon.jsx';
import { countByType, dayStrip, patterns, seizureStats } from '../lib/summary.js';
import { formatDuration, formatTime, labelOf, SEIZURE_TYPES, startOfDay, TYPE_META } from '../lib/format.js';

const RANGES = [[7, '7 days'], [30, '30 days'], [90, '90 days']];
const shortDate = (ms) => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default function Summary({ circle, entries, days, onDaysChange, onBack, onOpen }) {
  const end = Date.now();
  const startDate = new Date(startOfDay(end));
  startDate.setDate(startDate.getDate() - (days - 1));
  const start = startDate.getTime();

  const inRange = entries.filter((e) => e.occurredAt >= start && e.occurredAt <= end);
  const stats = seizureStats(inRange);
  const strip = dayStrip(entries, start, end).reverse(); // newest day first on screen
  const found = patterns(entries, start, end);
  const seizures = inRange.filter((e) => e.type === 'seizure');
  const typeBreakdown = Object.entries(stats.byType)
    .map(([t, n]) => `${labelOf(SEIZURE_TYPES, t)} ×${n}`)
    .join(', ');

  return (
    <section className="stack">
      <div className="spread no-print">
        <button className="btn ghost small" onClick={onBack}>← Back</button>
        <button className="btn small" onClick={() => window.print()}>Print / Save PDF</button>
      </div>

      <div>
        <h1>Care summary: {circle.personName}</h1>
        <p className="muted">
          {shortDate(start)} – {shortDate(end)} · generated {shortDate(end)} {formatTime(end)} · from EVIE shared log
        </p>
      </div>

      <div className="no-print">
        <ChipGroup options={RANGES} value={days} onChange={onDaysChange} />
      </div>

      <div className="stats">
        <div className="stat"><div className="stat-value">{stats.count}</div><div className="stat-label">Seizures</div></div>
        <div className="stat"><div className="stat-value">{formatDuration(stats.avgDurationSec)}</div><div className="stat-label">Average length</div></div>
        <div className="stat"><div className="stat-value">{formatDuration(stats.maxDurationSec)}</div><div className="stat-label">Longest</div></div>
        <div className="stat"><div className="stat-value">{stats.rescueCount}</div><div className="stat-label">Rescue med uses</div></div>
      </div>
      {typeBreakdown && <p className="muted">Types: {typeBreakdown}</p>}
      <p className="muted small">
        All logs:{' '}
        {countByType(inRange).map(([t, n]) => (
          <span key={t} className={`count type-${t}`}><Icon name={t} size={15} /> {n} {TYPE_META[t].label.toLowerCase()}</span>
        ))}
      </p>

      <h2>Patterns</h2>
      {found.length === 0 && <p className="muted">No clear patterns in this range yet.</p>}
      {found.map((p) => <div key={p.id} className="callout">{p.text}</div>)}
      <p className="muted small">Patterns are observations from logged data, not medical advice.</p>

      <h2>Day by day</h2>
      <p className="muted small"><span className="type-seizure"><Icon name="seizure" size={15} /></span> seizures · <span className="type-med"><Icon name="med" size={15} /></span> missed doses · dot = sleep quality (red poor, yellow OK, green good, grey not logged)</p>
      <div className="strip">
        {strip.map((d) => (
          <div key={d.date} className="strip-row">
            <span>{shortDate(d.date)}</span>
            <span className="strip-marks">
              {d.seizures > 0 && <span className="with-icon type-seizure"><Icon name="seizure" size={15} />×{d.seizures}</span>}
              {d.missedMeds > 0 && <span className="with-icon type-med"><Icon name="med" size={15} />missed ×{d.missedMeds}</span>}
            </span>
            <span className={`dot${d.sleepQuality ? ` q${d.sleepQuality}` : ''}`} />
          </div>
        ))}
      </div>

      <h2>Seizures</h2>
      {seizures.length === 0 && <p className="muted">None logged in this range.</p>}
      {seizures.map((s) => (
        <div key={s.id} className="card">
          <div className="spread">
            <strong>{labelOf(SEIZURE_TYPES, s.seizureType || 'unknown')} · {formatDuration(s.durationSec)}</strong>
            <span className="muted small">{shortDate(s.occurredAt)} {formatTime(s.occurredAt)}</span>
          </div>
          {s.rescueMedGiven && <p className="small">Rescue medication given</p>}
          {s.note && <p className="small">{s.note}</p>}
          {(s.clipUrl || s.clipStatus === 'done') && (
            <>
              <div className="no-print"><Media entry={s} kind="clip" className="entry-clip" /></div>
              <p className="small print-only">Video clip available in the EVIE app</p>
            </>
          )}
          <button className="btn ghost small no-print" onClick={() => onOpen(s.id)}>Open entry</button>
        </div>
      ))}
    </section>
  );
}
