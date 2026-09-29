import { describe, expect, it } from 'vitest';
import { jsPDF } from 'jspdf';
import { buildSummaryPdf, entriesCsv } from './export.js';
import { summaryReport } from './summary.js';

const at = (d, h = 0, m = 0) => new Date(2026, 8, d, h, m).getTime();

describe('entriesCsv', () => {
  it('writes one row per entry, oldest first, with details from detailRows', () => {
    const csv = entriesCsv([
      { type: 'med', occurredAt: at(21, 8, 5), medName: 'Keppra', dose: '250mg', status: 'missed', createdByName: 'Remy' },
      { type: 'seizure', occurredAt: at(20, 7), durationSec: 65, seizureType: 'focal', createdByName: 'Mom' },
    ]);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('Date,Time,Type,Details,Logged by');
    expect(lines[1]).toBe('2026-09-20,07:00,Seizure,"Type: Focal; Duration: 1m 5s; Rescue med: No",Mom');
    expect(lines[2]).toBe('2026-09-21,08:05,Medication,"Medication: Keppra; Dose: 250mg; Status: Missed",Remy');
  });

  it('escapes quotes and neutralises spreadsheet formulas in typed text', () => {
    const csv = entriesCsv([{ type: 'note', occurredAt: at(20), note: 'said "hi"', createdByName: '=HYPERLINK("x")' }]);
    expect(csv.split('\r\n')[1]).toBe('2026-09-20,00:00,Note,"Note: said ""hi""","\'=HYPERLINK(""x"")"');
  });
});

describe('buildSummaryPdf', () => {
  it('puts the summary text into a PDF', () => {
    const entries = [
      { type: 'seizure', occurredAt: at(26, 7), durationSec: 320, seizureType: 'focal', triggers: ['illness'], note: 'Tired after — slept 2h' },
      { type: 'seizure', occurredAt: at(25, 7), durationSec: 40 },
    ];
    const circle = { personName: 'Maya', profile: { diagnoses: ['epilepsy', 'autism'], diagnosisOther: 'CDKL5' } };
    const doc = buildSummaryPdf(jsPDF, circle, summaryReport(entries, 7, at(27, 12)));
    const out = doc.output();
    expect(out.startsWith('%PDF')).toBe(true);
    expect(out).toContain('Care summary: Maya');
    expect(out).toContain('Diagnoses: Epilepsy, Autism, CDKL5');
    expect(out).toContain('No behavior logged in this range.');
    expect(out).toContain('Illness x1');
    expect(out).toContain('5 min or longer');
    expect(out).toContain('(5 min or longer)'); // the 320s seizure is flagged on its card
    expect(out).toMatch(/Page 1 of [0-9]/);
    expect(out).toContain('Tired after - slept 2h'); // dashes the built-in font can't draw are swapped
    expect(out).not.toMatch(/\(\? /); // no line starts with a "?" from an undrawable character
  });
});
