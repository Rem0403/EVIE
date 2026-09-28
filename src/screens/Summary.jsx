import { useState } from 'react';
import ChipGroup from '../components/ChipGroup.jsx';
import Media from '../components/Media.jsx';
import Icon from '../components/Icon.jsx';
import { countByType, LONG_SEIZURE_SEC, summaryReport } from '../lib/summary.js';
import { downloadBlob, downloadSummaryPdf, entriesCsv, fileDate } from '../lib/export.js';
import { diagnosisText, formatDuration, formatTime, labelOf, SEIZURE_TYPES, TYPE_META } from '../lib/format.js';

const RANGES = [[7, '7 days'], [30, '30 days'], [90, '90 days']];
const shortDate = (ms) => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default function Summary({ circle, entries, days, onDaysChange, onBack, onOpen }) {
  const [exportError, setExportError] = useState('');
  const report = summaryReport(entries, days);
  const { start, end, inRange, stats, strip, seizures } = report;
  const found = report.patterns;

  function downloadCsv() {
    // The byte-order mark makes Excel read the file as UTF-8.
    downloadBlob(new Blob(['﻿', entriesCsv(inRange)], { type: 'text/csv' }), `EVIE-log-${fileDate(end)}.csv`);
  }

  async function downloadPdf() {
    setExportError('');
    try {
      await downloadSummaryPdf(circle, report);
    } catch (err) {
      console.error(err);
      setExportError("Couldn't make the PDF. Check your connection and try again, or use Print.");
    }
  }

  return (
    <section className="stack">
      <div className="spread no-print" style={{ flexWrap: 'wrap' }}>
        <button className="btn ghost small" onClick={onBack}>← Back</button>
        <div className="row">
          <button className="btn small" onClick={downloadCsv}>CSV</button>
          <button className="btn small" onClick={downloadPdf}>Download PDF</button>
          <button className="btn small" onClick={() => window.print()}>Print</button>
        </div>
      </div>
      {exportError && <p className="error no-print">{exportError}</p>}

      <div>
        <h1>Care summary: {circle.personName}</h1>
        {diagnosisText(circle.profile) && <p>Diagnoses: {diagnosisText(circle.profile)}</p>}
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
        <div className="stat"><div className="stat-value">{report.longCount}</div><div className="stat-label">5 min or longer</div></div>
        <div className="stat"><div className="stat-value">{report.clusters}</div><div className="stat-label">Clusters (2+ in 24h)</div></div>
        <div className="stat"><div className="stat-value">{report.sleepCount}</div><div className="stat-label">During sleep</div></div>
        <div className="stat"><div className="stat-value">{report.doseText}</div><div className="stat-label">Scheduled doses given</div></div>
      </div>
      <p className="muted">{report.compareText} · {report.seizureFreeText}</p>
      {report.typeText && <p className="muted">Types: {report.typeText}</p>}
      {report.triggerText && <p className="muted">Triggers noted: {report.triggerText}</p>}
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

      <h2>Behavior</h2>
      {report.behaviorText ? (
        <>
          <p>{report.behaviorText}</p>
          {report.beforeText && <p className="muted">Often before a hard time: {report.beforeText}</p>}
          {report.helpedText && <p className="muted">What helped: {report.helpedText}</p>}
        </>
      ) : <p className="muted">No behavior logged in this range.</p>}

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
            <strong>
              {labelOf(SEIZURE_TYPES, s.seizureType || 'unknown')} · {formatDuration(s.durationSec)}
              {(s.durationSec || 0) >= LONG_SEIZURE_SEC && <span className="entry-warn"> · 5 min or longer</span>}
            </strong>
            <span className="muted small">{shortDate(s.occurredAt)} {formatTime(s.occurredAt)}</span>
          </div>
          {s.rescueMedGiven && <p className="small">Rescue medication given</p>}
          {s.note && <p className="small">{s.note}</p>}
          {s.clipStatus === 'done' && (
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
