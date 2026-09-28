import { describe, expect, it } from 'vitest';
import { findIdNumber, ID_NUMBER_MESSAGE } from './privacy.js';

describe('findIdNumber', () => {
  it.each([
    'SSN 123-45-6789',
    'her social is 123 45 6789',
    '123456789',
    'Medicaid ID 12345678901',
    'medicaid #: LA00012345',
    'Insurance member id W123456789',
    'Medicare number 1EG4TE5MK73',
  ])('flags "%s"', (text) => {
    expect(findIdNumber(text)).toBe(true);
  });

  it.each([
    '',
    'Call Ms. Lee at 985-555-0142',
    '(985) 555-0142',
    '+1 985 555 0142',
    'Medicaid waiver: applied March 2024, call 985-555-0142',
    'Keppra 250 mg at 8:00 and 20:00',
    'Room 12345 at the clinic',
    'ZIP 70401-1234',
  ])('allows "%s"', (text) => {
    expect(findIdNumber(text)).toBe(false);
  });

  it('explains why', () => {
    expect(ID_NUMBER_MESSAGE).toMatch(/Social Security or Medicaid/);
  });
});
