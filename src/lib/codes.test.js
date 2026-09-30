import { describe, it, expect } from 'vitest';
import { generateJoinCode, isCurrentCode, namePrefix, normalizeJoinCode } from './codes.js';

describe('namePrefix', () => {
  it.each([
    ['Maya', 'MAYA'],
    ['Zoë Anne', 'ZOE'],
    ["D'Andre", 'DANDRE'],
    ['  maya  ', 'MAYA'],
    ['Maximiliana', 'MAXIMILIAN'],
    ['美雪', 'EVIE'],
    ['', 'EVIE'],
    [undefined, 'EVIE'],
  ])('%s -> %s', (input, expected) => {
    expect(namePrefix(input)).toBe(expected);
  });
});

describe('generateJoinCode', () => {
  it("starts with the person's name, then two groups of 4 from the unambiguous alphabet", () => {
    const bytes = (arr) => { arr.set([0, 1, 2, 3, 4, 5, 6, 30]); return arr; };
    expect(generateJoinCode('Maya', bytes)).toBe('MAYA-2345-678Z');
  });
  it('skips bytes that would bias the alphabet', () => {
    let call = 0;
    const bytes = (arr) => {
      arr.set(call++ === 0 ? [255, 248, 0, 0, 0, 0, 0, 0] : [9, 9, 9, 9, 9, 9, 9, 9]);
      return arr;
    };
    expect(generateJoinCode('Maya', bytes)).toBe('MAYA-2222-22BB');
  });
  it('uses real randomness by default', () => {
    const a = generateJoinCode('Maya');
    expect(a).toMatch(/^MAYA-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/);
    expect(generateJoinCode('Maya')).not.toBe(a);
  });
});

describe('normalizeJoinCode', () => {
  it.each([
    ['MAYA-7KQ4-M2XP', 'MAYA-7KQ4-M2XP'],
    ['maya-7kq4-m2xp', 'MAYA-7KQ4-M2XP'],
    ['maya 7kq4 m2xp', 'MAYA-7KQ4-M2XP'],
    ['Maya 7KQ4M2XP', 'MAYA-7KQ4-M2XP'],
    ['MAYA7KQ4M2XP', 'MAYA-7KQ4-M2XP'],
    ['MAYA-ABCD-EFGH', 'MAYA-ABCD-EFGH'],
    // Older codes all start with EVIE, which is also what's assumed when only the 8 are typed.
    ['EVIE-7KQ4-M2XP', 'EVIE-7KQ4-M2XP'],
    ['evie 7kq4 m2xp', 'EVIE-7KQ4-M2XP'],
    ['  7KQ4M2XP ', 'EVIE-7KQ4-M2XP'],
    ['7kq4-m2xp', 'EVIE-7KQ4-M2XP'],
    ['ABCD-EFGH', 'EVIE-ABCD-EFGH'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizeJoinCode(input)).toBe(expected);
  });

  it.each([
    '', 'EVIE-4821', 'EVIE-7KQ4-M2X', 'MAYA-7KQ4-M2XPP', 'MAYA-7KQ0-M2XP', 'MAYA2-7KQ4-M2XP',
    'MAXIMILIANA-7KQ4-M2XP', 'hello', null, undefined,
  ])('rejects %s', (input) => {
    expect(normalizeJoinCode(input)).toBeNull();
  });

  it('reads back every code it makes', () => {
    for (const name of ['Maya', 'Zoë Anne', '美雪', 'Maximiliana']) {
      const code = generateJoinCode(name);
      expect(normalizeJoinCode(code)).toBe(code);
      expect(normalizeJoinCode(code.toLowerCase().replaceAll('-', ' '))).toBe(code);
    }
  });
});

describe('isCurrentCode', () => {
  it('accepts name codes and EVIE- codes, but not old 4-digit ones', () => {
    expect(isCurrentCode('MAYA-7KQ4-M2XP')).toBe(true);
    expect(isCurrentCode('EVIE-7KQ4-M2XP')).toBe(true);
    expect(isCurrentCode('EVIE-4821')).toBe(false);
    expect(isCurrentCode(undefined)).toBe(false);
  });
});
