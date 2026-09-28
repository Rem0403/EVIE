import {
  detailRows, diagnosisText, formatDuration, formatTime, labelOf, SEIZURE_TYPES, SLEEP_QUALITY, toLocalInput, TYPE_META,
} from './format.js';
import { LONG_SEIZURE_SEC } from './summary.js';

const shortDate = (ms) => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
export const fileDate = (ms = Date.now()) => toLocalInput(ms).slice(0, 10);

function csvCell(value) {
  let s = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // stop spreadsheets running typed text as a formula
  return /[",;\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function entriesCsv(entries) {
  const rows = [['Date', 'Time', 'Type', 'Details', 'Logged by']];
  for (const e of [...entries].sort((a, b) => a.occurredAt - b.occurredAt)) {
    const [date, time] = toLocalInput(e.occurredAt).split('T');
    const details = detailRows(e).slice(2).map(([k, v]) => `${k}: ${v}`).join('; '); // skip When / Logged by
    rows.push([date, time, TYPE_META[e.type]?.label || e.type, details, e.createdByName || 'Someone']);
  }
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// Phone share sheet (Messages, email, Drive) when it takes files, otherwise a plain download.
export async function shareOrDownload(blob, filename) {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
    } catch (err) {
      if (err.name !== 'AbortError') throw err;
    }
    return;
  }
  downloadBlob(file, filename);
}

// ponytail: the built-in PDF font is Latin-1 only, so other characters become "?".
// Embed a TTF font with doc.addFont if names or notes in other scripts need to print.
const pdfSafe = (s) => String(s)
  .replace(/[–—]/g, '-').replace(/→/g, '->').replace(/×/g, 'x')
  .replace(/•/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...')
  .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '?');

export function buildSummaryPdf(JsPDF, circle, r) {
  const doc = new JsPDF({ unit: 'pt', format: 'letter' });
  const margin = 54;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  const bottom = doc.internal.pageSize.getHeight() - margin;
  let y = margin;

  function text(str, { size = 10, bold = false, gap = 0 } = {}) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(size);
    for (const line of doc.splitTextToSize(pdfSafe(str), width)) {
      if (y + size > bottom) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y + size);
      y += size * 1.4;
    }
    y += gap;
  }
  const heading = (str) => text(str, { size: 13, bold: true, gap: 8 });

  const { stats } = r;
  text(`Care summary: ${circle.personName}`, { size: 18, bold: true });
  if (diagnosisText(circle.profile)) text(`Diagnoses: ${diagnosisText(circle.profile)}`);
  text(`${shortDate(r.start)} – ${shortDate(r.end)} · generated ${shortDate(r.end)} ${formatTime(r.end)} · from EVIE shared log`, { gap: 10 });

  text(`Seizures: ${stats.count}    Average length: ${formatDuration(stats.avgDurationSec)}    Longest: ${formatDuration(stats.maxDurationSec)}`);
  text(`Rescue medication uses: ${stats.rescueCount}    5 min or longer: ${r.longCount}    Clusters (2+ in 24h): ${r.clusters}`);
  text(`During sleep: ${r.sleepCount}    Scheduled doses given: ${r.doseText}`);
  text(`${r.compareText} · ${r.seizureFreeText}`);
  if (r.typeText) text(`Types: ${r.typeText}`);
  if (r.triggerText) text(`Triggers noted: ${r.triggerText}`);
  y += 10;

  heading('Patterns');
  if (!r.patterns.length) text('No clear patterns in this range yet.');
  for (const p of r.patterns) text(`• ${p.text}`);
  text('Patterns are observations from logged data, not medical advice.', { size: 8, gap: 10 });

  heading('Behavior');
  if (!r.behaviorText) text('No behavior logged in this range.');
  else {
    text(r.behaviorText);
    if (r.beforeText) text(`Often before a hard time: ${r.beforeText}`);
    if (r.helpedText) text(`What helped: ${r.helpedText}`);
  }
  y += 10;

  heading('Day by day');
  for (const d of r.strip) {
    const marks = [
      d.seizures && `${d.seizures} seizure${d.seizures > 1 ? 's' : ''}`,
      d.missedMeds && `${d.missedMeds} missed dose${d.missedMeds > 1 ? 's' : ''}`,
      d.sleepQuality && `sleep ${labelOf(SLEEP_QUALITY, d.sleepQuality)}`,
    ].filter(Boolean);
    text(`${shortDate(d.date)}   ${marks.join(' · ') || '-'}`, { size: 9 });
  }
  y += 10;

  heading('Seizures');
  if (!r.seizures.length) text('None logged in this range.');
  for (const s of r.seizures) {
    const long = (s.durationSec || 0) >= LONG_SEIZURE_SEC ? '  (5 min or longer)' : '';
    text(`${shortDate(s.occurredAt)} ${formatTime(s.occurredAt)} · ${labelOf(SEIZURE_TYPES, s.seizureType || 'unknown')} · ${formatDuration(s.durationSec)}${long}`, { bold: true });
    const row = detailRows(s).find(([k]) => k === 'Possible triggers');
    if (s.rescueMedGiven) text('Rescue medication given');
    if (row) text(`Possible triggers: ${row[1]}`);
    if (s.duringSleep) text('Happened during sleep');
    if (s.note) text(s.note);
    if (s.clipStatus === 'done') text('Video clip available in the EVIE app');
    y += 6;
  }
  return doc;
}

export async function downloadSummaryPdf(circle, report) {
  const { jsPDF } = await import('jspdf'); // loaded on first tap, not with the app
  buildSummaryPdf(jsPDF, circle, report).save(`EVIE-summary-${fileDate(report.end)}.pdf`);
}
