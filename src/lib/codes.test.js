import { describe, it, expect } from 'vitest';
import { generateJoinCode, normalizeJoinCode } from './codes.js';

describe('generateJoinCode', () => {
  it('formats as EVIE- plus 4 digits', () => {
    expect(generateJoinCode(() => 0.4821)).toBe('EVIE-4821');
  });
  it('zero-pads small numbers', () => {
    expect(generateJoinCode(() => 0.0007)).toBe('EVIE-0007');
  });
  it('never exceeds 4 digits', () => {
    expect(generateJoinCode(() => 0.99999)).toBe('EVIE-9999');
  });
  it('matches the format with the real RNG', () => {
    expect(generateJoinCode()).toMatch(/^EVIE-\d{4}$/);
  });
});

describe('normalizeJoinCode', () => {
  it.each([
    ['EVIE-4821', 'EVIE-4821'],
    ['evie-4821', 'EVIE-4821'],
    ['evie 4821', 'EVIE-4821'],
    ['EVIE4821', 'EVIE-4821'],
    ['  4821 ', 'EVIE-4821'],
    ['48 21', 'EVIE-4821'],
  ])('normalizes %j to %s', (input, expected) => {
    expect(normalizeJoinCode(input)).toBe(expected);
  });

  it.each(['', 'EVIE-48', 'EVIE-48210', 'EVIE-48a1', 'hello', null, undefined])(
    'rejects %j',
    (input) => {
      expect(normalizeJoinCode(input)).toBeNull();
    },
  );
});
