import { describe, expect, it } from 'vitest';
import { cleanMeds, doseAdherence, formatSlot, todaysDoses } from './meds.js';

const at = (d, h = 0, m = 0) => new Date(2026, 8, d, h, m).getTime();
const keppra = { name: 'Keppra', dose: '250 mg', times: ['08:00', '20:00'] };
const med = (occurredAt, extra) => ({ type: 'med', occurredAt, medName: 'Keppra', ...extra });

describe('todaysDoses', () => {
  it('lists each scheduled dose today, matched to the dose logged for that slot', () => {
    const given = med(at(28, 8, 5), { status: 'given', slot: '08:00', createdByName: 'Mom' });
    const rows = todaysDoses([keppra], [given, med(at(27, 20, 1), { status: 'given', slot: '20:00' })], at(28, 12));
    expect(rows.map((r) => [r.slot, r.state, r.entry?.createdByName])).toEqual([
      ['08:00', 'given', 'Mom'],
      ['20:00', 'upcoming', undefined], // yesterday's 8 PM dose doesn't count for today
    ]);
    expect(rows[1].at).toBe(at(28, 20));
  });

  it('marks an unlogged dose whose time has passed as due, and shows missed doses', () => {
    const rows = todaysDoses([keppra], [med(at(28, 8), { status: 'missed', slot: '08:00' })], at(28, 21));
    expect(rows.map((r) => r.state)).toEqual(['missed', 'due']);
  });

  it('ignores other medications', () => {
    const rows = todaysDoses([keppra], [{ ...med(at(28, 8), { status: 'given', slot: '08:00' }), medName: 'Depakote' }], at(28, 9));
    expect(rows[0].state).toBe('due');
  });

  it('sorts by time across medications', () => {
    const rows = todaysDoses([keppra, { name: 'Melatonin', dose: '', times: ['19:30'] }], [], at(28, 6));
    expect(rows.map((r) => `${r.slot} ${r.med.name}`)).toEqual(['08:00 Keppra', '19:30 Melatonin', '20:00 Keppra']);
  });

  it('handles no schedule', () => {
    expect(todaysDoses(undefined, [], at(28))).toEqual([]);
  });
});

describe('doseAdherence', () => {
  it('counts given out of scheduled doses logged as given or missed', () => {
    expect(doseAdherence([
      med(at(27, 8), { status: 'given', slot: '08:00' }),
      med(at(27, 20), { status: 'missed', slot: '20:00' }),
      med(at(28, 8), { status: 'given', slot: '08:00' }),
      med(at(28, 9), { status: 'given' }), // quick log, not scheduled
      med(at(28, 10), { status: 'rescue', slot: '08:00' }),
    ])).toEqual({ given: 2, total: 3 });
  });
});

describe('cleanMeds', () => {
  it('trims, drops empty rows, and sorts and de-duplicates times', () => {
    expect(cleanMeds([
      { name: ' Keppra ', dose: ' 250 mg ', times: ['20:00', '08:00', '20:00', ''] },
      { name: '', dose: '', times: [''] },
    ])).toEqual([[{ name: 'Keppra', dose: '250 mg', times: ['08:00', '20:00'] }], null]);
  });
  it('asks for a name and at least one time', () => {
    expect(cleanMeds([{ name: '', dose: '5 mg', times: ['08:00'] }])[1]).toBe('Give each medication a name.');
    expect(cleanMeds([{ name: 'Keppra', dose: '', times: [''] }])[1]).toBe('Add at least one time for Keppra.');
  });
});

describe('formatSlot', () => {
  it('shows a 24h slot as a 12h time', () => {
    expect(formatSlot('08:00')).toBe('8:00 AM');
    expect(formatSlot('20:30')).toBe('8:30 PM');
  });
});

describe('todaysDoses, doses logged another way', () => {
  it('counts a quick-logged dose of the same medication near the slot', () => {
    const quick = med(at(28, 7, 55), { status: 'given', createdByName: 'Mom' }); // no slot
    const rows = todaysDoses([keppra], [quick], at(28, 12));
    expect(rows[0].state).toBe('given');
    expect(rows[0].entry).toBe(quick);
    expect(rows[1].state).toBe('upcoming'); // one dose can't count for two slots
  });
  it('still counts a dose after its time was moved in the schedule', () => {
    const rows = todaysDoses([{ ...keppra, times: ['08:30'] }], [med(at(28, 8, 2), { status: 'given', slot: '08:00' })], at(28, 12));
    expect(rows[0].state).toBe('given');
  });
  it("doesn't count a dose hours away from the slot", () => {
    const rows = todaysDoses([keppra], [med(at(28, 13), { status: 'given' })], at(28, 14));
    expect(rows.map((r) => r.state)).toEqual(['due', 'upcoming']);
  });
});

describe('cleanMeds, duplicates', () => {
  it('refuses the same medication twice at the same time', () => {
    expect(cleanMeds([
      { name: 'Keppra', dose: '500 mg', times: ['08:00'] },
      { name: 'keppra', dose: '250 mg', times: ['08:00'] },
    ])[1]).toBe('keppra is listed twice at the same time. Combine them into one dose.');
  });
});
