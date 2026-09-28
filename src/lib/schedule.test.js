import { describe, expect, it } from 'vitest';
import { cleanSchedule, onNow, nextToday, weekRows } from './schedule.js';

// Sep 28 2026 is a Monday.
const at = (d, h, m = 0) => new Date(2026, 8, d, h, m).getTime();
const lee = { name: 'Ms. Lee', days: [1, 3, 5], start: '08:00', end: '15:00', note: '' };
const night = { name: 'Grandma', days: [0], start: '22:00', end: '07:00', note: '' };

describe('onNow', () => {
  it('finds who is scheduled right now, with when they finish', () => {
    expect(onNow([lee, night], at(28, 10))).toEqual([{ shift: lee, until: at(28, 15) }]);
    expect(onNow([lee], at(28, 15))).toEqual([]); // the end time is exclusive
    expect(onNow([lee], at(29, 10))).toEqual([]); // Tuesday
  });
  it('carries an overnight shift past midnight', () => {
    expect(onNow([night], at(27, 23))).toEqual([{ shift: night, until: at(28, 7) }]); // Sunday night
    expect(onNow([night], at(28, 6))).toEqual([{ shift: night, until: at(28, 7) }]); // Monday early morning
    expect(onNow([night], at(28, 8))).toEqual([]);
  });
});

describe('nextToday', () => {
  it('is the next shift starting later today', () => {
    expect(nextToday([lee], at(28, 7))).toEqual({ shift: lee, from: at(28, 8) });
    expect(nextToday([lee], at(28, 9))).toBeNull();
  });
});

describe('weekRows', () => {
  it('lists each day Monday to Sunday with its shifts in time order', () => {
    const rows = weekRows([lee, night, { ...lee, name: 'Dad', start: '06:00', end: '08:00' }]);
    expect(rows.map((r) => [r.label, r.shifts.map((s) => s.name)])).toEqual([
      ['Mon', ['Dad', 'Ms. Lee']], ['Tue', []], ['Wed', ['Dad', 'Ms. Lee']], ['Thu', []],
      ['Fri', ['Dad', 'Ms. Lee']], ['Sat', []], ['Sun', ['Grandma']],
    ]);
  });
});

describe('cleanSchedule', () => {
  it('trims and sorts days', () => {
    expect(cleanSchedule([{ name: ' Ms. Lee ', days: [5, 1], start: '08:00', end: '15:00', note: ' Mon/Wed/Fri ' }]))
      .toEqual([[{ name: 'Ms. Lee', days: [1, 5], start: '08:00', end: '15:00', note: 'Mon/Wed/Fri' }], null]);
  });
  it('explains what is missing, and refuses ID numbers', () => {
    const row = { name: 'Ms. Lee', days: [1], start: '08:00', end: '15:00', note: '' };
    expect(cleanSchedule([{ ...row, name: '' }])[1]).toBe('Give each shift a name.');
    expect(cleanSchedule([{ ...row, days: [] }])[1]).toBe('Pick at least one day for Ms. Lee.');
    expect(cleanSchedule([{ ...row, end: '' }])[1]).toBe('Add a start and end time for Ms. Lee.');
    expect(cleanSchedule([{ ...row, end: '08:00' }])[1]).toBe('Ms. Lee’s shift starts and ends at the same time.');
    expect(cleanSchedule([{ ...row, note: 'Medicaid ID 12345678901' }])[1]).toMatch(/Social Security or Medicaid/);
  });
});
