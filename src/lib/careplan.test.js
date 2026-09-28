import { describe, expect, it } from 'vitest';
import { cleanContacts, planIdError } from './careplan.js';

describe('cleanContacts', () => {
  it('trims, drops empty rows and keeps the role', () => {
    expect(cleanContacts([
      { name: ' Dr. Patel ', role: 'neurologist', phone: ' 985-555-0110 ' },
      { name: '', role: 'family', phone: '' },
    ])).toEqual([[{ name: 'Dr. Patel', role: 'neurologist', phone: '985-555-0110' }], null]);
  });
  it('needs a name and a callable phone number', () => {
    expect(cleanContacts([{ name: '', role: 'family', phone: '555-0100' }])[1]).toBe('Give each contact a name.');
    expect(cleanContacts([{ name: 'Grandma', role: 'family', phone: 'ask Mom' }])[1]).toBe('Add a phone number for Grandma.');
  });
});

describe('planIdError', () => {
  const profile = { helps: 'Headphones', allergies: 'Penicillin' };
  it('is fine for ordinary care details', () => {
    expect(planIdError(profile, [{ name: 'Keppra', dose: '250 mg', purpose: 'Seizures', notes: 'With food' }], [{ name: 'Ms. Lee' }])).toBeNull();
  });
  it('refuses an ID number anywhere in the plan', () => {
    expect(planIdError({ ...profile, routine: 'Medicaid ID 12345678901' }, [], [])).toMatch(/Social Security or Medicaid/);
    expect(planIdError(profile, [{ name: 'Keppra', notes: 'SSN 123-45-6789' }], [])).toMatch(/ID numbers/);
  });
});
