import { describe, it, expect } from 'vitest';
import { generateJoinCode, isCurrentCode, normalizeJoinCode } from './codes.js';

describe('generateJoinCode', () => {
  it('formats as EVIE- plus two groups of 4 from the unambiguous alphabet', () => {
    const bytes = (arr) => { arr.set([0, 1, 2, 3, 4, 5, 6, 30]); return arr; };
    expect(generateJoinCode(bytes)).toBe('EVIE-2345-678Z');
  });
  it('skips bytes that would bias the alphabet', () => {
    let call = 0;
    const bytes = (arr) => {
      arr.set(call++ === 0 ? [255, 248, 0, 0, 0, 0, 0, 0] : [9, 9, 9, 9, 9, 9, 9, 9]);
      return arr;
    };
    expect(generateJoinCode(bytes)).toBe('EVIE-2222-22BB');
  });
  it('uses real randomness by default', () => {
    const a = generateJoinCode();
    expect(a).toMatch(/^EVIE-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/);
    expect(generateJoinCode()).not.toBe(a);
  });
});

describe('normalizeJoinCode', () => {
  it.each([
    ['EVIE-7KQ4-M2XP', 'EVIE-7KQ4-M2XP'],
    ['evie-7kq4-m2xp', 'EVIE-7KQ4-M2XP'],
    ['evie 7kq4 m2xp', 'EVIE-7KQ4-M2XP'],
    ['EVIE7KQ4M2XP', 'EVIE-7KQ4-M2XP'],
    ['  7KQ4M2XP ', 'EVIE-7KQ4-M2XP'],
    ['7kq4-m2xp', 'EVIE-7KQ4-M2XP'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizeJoinCode(input)).toBe(expected);
  });

  it.each(['', 'EVIE-4821', 'EVIE-7KQ4-M2X', 'EVIE-7KQ4-M2XPP', 'EVIE-7KQ0-M2XP', 'hello', null, undefined])(
    'rejects %s',
    (input) => {
      expect(normalizeJoinCode(input)).toBeNull();
    },
  );
});

describe('isCurrentCode', () => {
  it('tells new codes from old 4-digit ones', () => {
    expect(isCurrentCode('EVIE-7KQ4-M2XP')).toBe(true);
    expect(isCurrentCode('EVIE-4821')).toBe(false);
    expect(isCurrentCode(undefined)).toBe(false);
  });
});
