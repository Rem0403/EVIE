import { describe, it, expect } from 'vitest';
import {
  formatDuration, formatClock, elapsedSec, startOfDay, dayLabel, groupByDay,
  entryTitle, detailRows, toLocalInput, fromLocalInput, defaultSleepTimes,
} from './format.js';

// Local-time helper: Sep <d>, 2026 at h:m
const at = (d, h = 0, m = 0) => new Date(2026, 8, d, h, m).getTime();

describe('formatDuration', () => {
  it('formats minutes and seconds', () => expect(formatDuration(102)).toBe('1m 42s'));
  it('formats seconds only', () => expect(formatDuration(45)).toBe('45s'));
  it('handles missing and negative values', () => {
    expect(formatDuration(undefined)).toBe('0s');
    expect(formatDuration(-5)).toBe('0s');
  });
});

describe('formatClock', () => {
  it('pads minutes and seconds', () => expect(formatClock(102)).toBe('01:42'));
  it('handles zero', () => expect(formatClock(0)).toBe('00:00'));
});

describe('elapsedSec', () => {
  it('is computed from timestamps, so it survives a locked screen', () => {
    expect(elapsedSec(at(26, 7, 0), at(26, 7, 3) + 500)).toBe(180);
  });
  it('never goes negative', () => expect(elapsedSec(2000, 1000)).toBe(0));
});

describe('dayLabel', () => {
  const now = at(26, 12);
  it('labels today', () => expect(dayLabel(at(26, 1), now)).toBe('Today'));
  it('labels yesterday', () => expect(dayLabel(at(25, 23), now)).toBe('Yesterday'));
  it('labels older days with weekday and date', () => expect(dayLabel(at(22, 9), now)).toBe('Tue, Sep 22'));
});

describe('groupByDay', () => {
  it('groups newest first even if input is unsorted', () => {
    const entries = [
      { id: 'a', occurredAt: at(25, 9) },
      { id: 'b', occurredAt: at(26, 8) },
      { id: 'c', occurredAt: at(26, 10) },
    ];
    const groups = groupByDay(entries, at(26, 12));
    expect(groups.map((g) => g.label)).toEqual(['Today', 'Yesterday']);
    expect(groups[0].entries.map((e) => e.id)).toEqual(['c', 'b']);
    expect(groups[0].key).toBe(startOfDay(at(26, 8)));
  });
});

describe('entryTitle', () => {
  it('summarizes a full seizure', () => {
    expect(entryTitle({
      type: 'seizure', seizureType: 'tonic-clonic', durationSec: 102, rescueMedGiven: true, clipStatus: 'done',
    })).toBe('Tonic-clonic · 1m 42s · rescue med · video');
  });
  it('survives a seizure with no optional fields', () => {
    expect(entryTitle({ type: 'seizure' })).toBe('Unknown · 0s');
  });
  it('summarizes meds and flags missed doses', () => {
    expect(entryTitle({ type: 'med', medName: 'Keppra', dose: '500 mg', status: 'missed' })).toBe('Keppra · 500 mg · MISSED');
    expect(entryTitle({ type: 'med' })).toBe('Medication');
  });
  it('summarizes sleep', () => {
    expect(entryTitle({ type: 'sleep', bedtime: at(25, 23), wakeTime: at(26, 4, 18), quality: 1 })).toBe('Sleep · 5.3h · Poor');
    expect(entryTitle({ type: 'sleep' })).toBe('Sleep');
  });
  it('summarizes behavior and notes', () => {
    expect(entryTitle({ type: 'behavior', kind: 'good_day' })).toBe('Good day');
    expect(entryTitle({ type: 'note', note: 'x'.repeat(80) })).toBe(`${'x'.repeat(59)}…`);
    expect(entryTitle({ type: 'note' })).toBe('Note');
  });
});

describe('detailRows', () => {
  const find = (rows, label) => rows.find(([l]) => l === label)?.[1];
  it('lists seizure fields', () => {
    const rows = detailRows({
      type: 'seizure', occurredAt: at(26, 7), createdByName: 'Mom', seizureType: 'focal',
      durationSec: 45, rescueMedGiven: false, triggers: ['poor_sleep', 'illness'], note: 'Stared, lip smacking',
    });
    expect(find(rows, 'Logged by')).toBe('Mom');
    expect(find(rows, 'Type')).toBe('Focal');
    expect(find(rows, 'Duration')).toBe('45s');
    expect(find(rows, 'Rescue med')).toBe('No');
    expect(find(rows, 'Possible triggers')).toBe('Poor sleep, Illness');
    expect(find(rows, 'Note')).toBe('Stared, lip smacking');
  });
  it('never contains undefined values', () => {
    for (const type of ['seizure', 'med', 'sleep', 'behavior', 'note']) {
      const rows = detailRows({ type, occurredAt: at(26, 7) });
      for (const [, value] of rows) expect(String(value)).not.toContain('undefined');
    }
  });
});

describe('local input helpers', () => {
  it('round-trips a datetime-local value', () => {
    const ms = at(22, 7, 5);
    expect(toLocalInput(ms)).toBe('2026-09-22T07:05');
    expect(fromLocalInput('2026-09-22T07:05')).toBe(ms);
  });
  it('returns null for garbage', () => expect(fromLocalInput('')).toBeNull());
});

describe('defaultSleepTimes', () => {
  it('defaults to last night 9 PM → 7 AM', () => {
    expect(defaultSleepTimes(at(26, 12))).toEqual({ bedtime: at(25, 21), wakeTime: at(26, 7) });
  });
  it('never puts wake time in the future when logging before 7 AM', () => {
    expect(defaultSleepTimes(at(26, 5, 30))).toEqual({ bedtime: at(25, 21), wakeTime: at(26, 5, 30) });
  });
});
