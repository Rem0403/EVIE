import {
  detailRows, diagnosisText, formatDuration, formatTime, labelOf, SEIZURE_TYPES, SLEEP_QUALITY, toLocalInput, TYPE_META,
} from './format.js';
import { LONG_SEIZURE_SEC } from './summary.js';
import { practiceText } from './goals.js';

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

// Brand colors for print (purple = epilepsy, gold = accents), as RGB for jsPDF.
const INK = [21, 18, 28];
const GRAY = [98, 92, 112];
const PURPLE = [59, 42, 107];
const VIOLET = [122, 63, 192];
const GOLD = [232, 193, 90];
const LAVENDER = [244, 240, 251];
const RULE = [227, 223, 234];
const ZEBRA = [250, 249, 252];
const DOT = '  ·  ';

export function buildSummaryPdf(JsPDF, circle, r) {
  const doc = new JsPDF({ unit: 'pt', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const width = pageW - margin * 2;
  const bottom = pageH - 64; // room for the footer
  let y = 0;

  const font = (size, bold = false, color = INK) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(size).setTextColor(...color);
  };
  const lines = (str, size, bold, w) => {
    font(size, bold);
    return doc.splitTextToSize(pdfSafe(str), w);
  };
  const newPage = () => {
    doc.addPage();
    y = margin;
  };
  const ensure = (h) => {
    if (y + h > bottom) newPage();
  };
  function text(str, { size = 10, bold = false, color = INK, gap = 4 } = {}) {
    for (const line of lines(str, size, bold, width)) {
      ensure(size * 1.4);
      font(size, bold, color);
      doc.text(line, margin, y + size);
      y += size * 1.4;
    }
    y += gap;
  }
  function heading(str) {
    ensure(40);
    y += 10;
    font(13, true, INK);
    doc.text(pdfSafe(str), margin, y + 13);
    doc.setFillColor(...GOLD).rect(margin, y + 19, 28, 3, 'F');
    y += 32;
  }

  // Header band.
  const diagnoses = diagnosisText(circle.profile);
  const bandH = diagnoses ? 112 : 96;
  doc.setFillColor(...PURPLE).rect(0, 0, pageW, bandH, 'F');
  font(9, true, [255, 255, 255]);
  doc.text('EVIE  ·  Shared care record', margin, 34);
  font(22, true, [255, 255, 255]);
  doc.text(pdfSafe(`Care summary: ${circle.personName}`), margin, 62);
  font(10, false, [236, 230, 248]);
  doc.text(pdfSafe(`${shortDate(r.start)} - ${shortDate(r.end)}${DOT}generated ${shortDate(r.end)} ${formatTime(r.end)}${DOT}from the family's shared log`), margin, 80);
  if (diagnoses) doc.text(pdfSafe(`Diagnoses: ${diagnoses}`), margin, 98);
  y = bandH + 24;

  // Stat boxes: 4 across, 2 rows.
  const { stats } = r;
  const boxes = [
    [String(stats.count), 'Seizures'],
    [formatDuration(stats.avgDurationSec), 'Average length'],
    [formatDuration(stats.maxDurationSec), 'Longest'],
    [String(stats.rescueCount), 'Rescue medication uses'],
    [String(r.longCount), '5 min or longer'],
    [String(r.clusters), 'Clusters (2+ in 24h)'],
    [String(r.sleepCount), 'During sleep'],
    [r.doseText, 'Scheduled doses given'],
  ];
  const gap = 10;
  const boxW = (width - gap * 3) / 4;
  const boxH = 58;
  boxes.forEach(([value, label], i) => {
    const bx = margin + (i % 4) * (boxW + gap);
    const by = y + Math.floor(i / 4) * (boxH + gap);
    doc.setFillColor(...LAVENDER).roundedRect(bx, by, boxW, boxH, 8, 8, 'F');
    font(18, true, PURPLE);
    doc.text(pdfSafe(value), bx + 12, by + 28);
    font(8.5, false, GRAY);
    doc.text(pdfSafe(label), bx + 12, by + 45);
  });
  y += boxH * 2 + gap + 16;
  text(`${r.compareText}${DOT}${r.seizureFreeText}`, { color: GRAY });
  if (r.typeText) text(`Types: ${r.typeText}`, { color: GRAY });
  if (r.triggerText) text(`Triggers noted: ${r.triggerText}`, { color: GRAY });

  // Patterns as callouts.
  heading('Patterns');
  if (!r.patterns.length) text('No clear patterns in this range yet.', { color: GRAY });
  for (const pat of r.patterns) {
    const ls = lines(pat.text, 10.5, true, width - 36);
    const h = ls.length * 14.7 + 18;
    ensure(h + 8);
    doc.setFillColor(...LAVENDER).roundedRect(margin, y, width, h, 6, 6, 'F');
    doc.setFillColor(...VIOLET).rect(margin, y, 4, h, 'F');
    font(10.5, true, INK);
    ls.forEach((l, k) => doc.text(l, margin + 18, y + 20 + k * 14.7));
    y += h + 8;
  }
  text('Patterns are observations from logged data, not medical advice.', { size: 8, color: GRAY });

  heading('Behavior');
  if (!r.behaviorText) text('No behavior logged in this range.', { color: GRAY });
  else {
    text(r.behaviorText);
    if (r.beforeText) text(`Often before a hard time: ${r.beforeText}`, { color: GRAY });
    if (r.helpedText) text(`What helped: ${r.helpedText}`, { color: GRAY });
  }

  heading('Goals');
  if (!r.goals.length) text('No goal practice logged in this range.', { color: GRAY });
  for (const g of r.goals) {
    text(g.title, { bold: true, gap: 0 });
    text(practiceText(g), { color: GRAY });
  }

  // Day by day as a table (the header repeats on a new page).
  heading('Day by day');
  const cols = [['Date', 0], ['Seizures', 110], ['Missed doses', 220], ['Sleep', 350]];
  const rowH = 18;
  const tableHeader = () => {
    doc.setFillColor(...RULE).rect(margin, y, width, rowH, 'F');
    font(8.5, true, GRAY);
    for (const [name, cx] of cols) doc.text(name.toUpperCase(), margin + 8 + cx, y + 12.5);
    y += rowH;
  };
  tableHeader();
  r.strip.forEach((d, i) => {
    if (y + rowH > bottom) {
      newPage();
      tableHeader();
    }
    if (i % 2) doc.setFillColor(...ZEBRA).rect(margin, y, width, rowH, 'F');
    const cells = [
      shortDate(d.date),
      d.seizures ? String(d.seizures) : '-',
      d.missedMeds ? String(d.missedMeds) : '-',
      d.sleepQuality ? labelOf(SLEEP_QUALITY, d.sleepQuality) : '-',
    ];
    cells.forEach((c, k) => {
      const hot = k === 1 && d.seizures > 0;
      font(9.5, hot, hot ? VIOLET : INK);
      doc.text(pdfSafe(c), margin + 8 + cols[k][1], y + 12.5);
    });
    y += rowH;
  });

  // Seizures as cards.
  heading('Seizures');
  if (!r.seizures.length) text('None logged in this range.', { color: GRAY });
  for (const sz of r.seizures) {
    const long = (sz.durationSec || 0) >= LONG_SEIZURE_SEC ? '  (5 min or longer)' : '';
    const title = `${shortDate(sz.occurredAt)} ${formatTime(sz.occurredAt)}${DOT}${labelOf(SEIZURE_TYPES, sz.seizureType || 'unknown')}${DOT}${formatDuration(sz.durationSec)}${long}`;
    const row = detailRows(sz).find(([k]) => k === 'Possible triggers');
    const details = [
      sz.rescueMedGiven && 'Rescue medication given',
      row && `Possible triggers: ${row[1]}`,
      sz.duringSleep && 'Happened during sleep',
      sz.note,
      sz.clipStatus === 'done' && 'Video clip available in the EVIE app',
    ].filter(Boolean);
    const titleLines = lines(title, 10.5, true, width - 28);
    const detailLines = details.flatMap((d) => lines(d, 9.5, false, width - 28));
    const h = 16 + titleLines.length * 14.7 + detailLines.length * 13.3 + 8;
    ensure(h + 8);
    doc.setDrawColor(...RULE).setLineWidth(1).roundedRect(margin, y, width, h, 6, 6, 'S');
    let ty = y + 22;
    font(10.5, true, INK);
    titleLines.forEach((l) => { doc.text(l, margin + 14, ty); ty += 14.7; });
    font(9.5, false, GRAY);
    detailLines.forEach((l) => { doc.text(l, margin + 14, ty); ty += 13.3; });
    y += h + 8;
  }

  // Footer on every page.
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...RULE).setLineWidth(0.75).line(margin, pageH - 44, pageW - margin, pageH - 44);
    font(8, false, GRAY);
    doc.text(pdfSafe(`EVIE care summary for ${circle.personName}${DOT}Observations from the family's log, not medical advice.`), margin, pageH - 30);
    doc.text(`Page ${i} of ${pages}`, pageW - margin, pageH - 30, { align: 'right' });
  }
  return doc;
}

export async function downloadSummaryPdf(circle, report) {
  const { jsPDF } = await import('jspdf'); // loaded on first tap, not with the app
  buildSummaryPdf(jsPDF, circle, report).save(`EVIE-summary-${fileDate(report.end)}.pdf`);
}
