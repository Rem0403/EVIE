import { telHref } from './resources.js';
import { findIdNumber, ID_NUMBER_MESSAGE } from './privacy.js';

export const CONTACT_ROLES = [
  ['family', 'Family'],
  ['doctor', 'Doctor'],
  ['neurologist', 'Neurologist'],
  ['caseworker', 'Case worker'],
  ['school', 'School'],
  ['other', 'Other'],
];

// Emergency contacts: each needs a name and a phone number someone can actually call.
export function cleanContacts(rows) {
  const contacts = rows
    .map((c) => ({ name: c.name.trim(), role: c.role || 'family', phone: c.phone.trim() }))
    .filter((c) => c.name || c.phone);
  const unnamed = contacts.find((c) => !c.name);
  if (unnamed) return [null, 'Give each contact a name.'];
  const noPhone = contacts.find((c) => !telHref(c.phone));
  if (noPhone) return [null, `Add a phone number for ${noPhone.name}.`];
  return [contacts, null];
}

// Refuse a care plan that contains something that looks like an ID number (see privacy.js).
export function planIdError(profile, meds, contacts) {
  const text = [
    profile.diagnosisOther, profile.helps, profile.avoid, profile.allergies, profile.rescuePlan, profile.routine,
    ...meds.flatMap((m) => [m.name, m.dose, m.purpose, m.notes]),
    ...contacts.map((c) => c.name),
  ].join('\n');
  return findIdNumber(text) ? ID_NUMBER_MESSAGE : null;
}
