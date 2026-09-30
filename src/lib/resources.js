import { toLocalInput } from './format.js';
import { findIdNumber, ID_NUMBER_MESSAGE } from './privacy.js';

// The family's own list of programs, services and groups, with where they are with each one.
export const RESOURCE_CATEGORIES = [
  ['services', 'Services & funding'],
  ['medical', 'Medical & therapy'],
  ['school', 'School'],
  ['community', 'Friends & community'],
  ['jobs', 'Jobs & adult life'],
  ['legal', 'Money & legal'],
  ['parent', 'Parent support'],
  ['other', 'Other'],
];
export const RESOURCE_STATUS = [
  ['want', 'Want to try'],
  ['waitlisted', 'Applied or waitlisted'],
  ['using', 'Using now'],
  ['not_fit', 'Not a fit'],
];
const STATUS_ORDER = ['using', 'waitlisted', 'want', 'not_fit'];

// Only real web links, so a saved link can never run code (javascript:, data: …) when tapped.
export function safeUrl(input) {
  const s = (input || '').trim();
  if (!s) return '';
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`;
  try {
    const url = new URL(withScheme);
    if ((url.protocol === 'https:' || url.protocol === 'http:') && url.hostname.includes('.')) return url.href;
  } catch {
    // not a URL
  }
  return null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A mailto: link only for something shaped like one address, so a stored value can't add
// extra recipients or a prefilled body.
export function mailtoHref(email) {
  const s = (email || '').trim();
  return EMAIL.test(s) && !/[?&#,;<>]/.test(s) ? `mailto:${s}` : null;
}

export function telHref(phone) {
  const digits = (phone || '').replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  return /\d{3,}/.test(digits) ? `tel:${digits}` : null;
}

export const EMPTY_RESOURCE = {
  name: '', category: 'services', status: 'want', phone: '', url: '', email: '', nextStep: '', nextDate: '', note: '',
};

// Form → stored fields, or an error to show.
export function cleanResource(f) {
  const r = {
    name: f.name.trim(),
    category: f.category,
    status: f.status,
    phone: f.phone.trim(),
    url: safeUrl(f.url),
    email: f.email.trim(),
    nextStep: f.nextStep.trim(),
    nextDate: f.nextDate || '',
    note: f.note.trim(),
  };
  if (!r.name) return [null, 'Give it a name.'];
  if (r.url === null) return [null, 'Enter a website like example.org.'];
  if (r.email && !mailtoHref(r.email)) return [null, 'Enter an email like name@example.org.'];
  if (r.nextDate && !r.nextStep) return [null, 'Say what the next step is, or clear the date.'];
  if (findIdNumber([r.name, r.nextStep, r.note].join('\n'))) return [null, ID_NUMBER_MESSAGE];
  return [r, null];
}

// Follow-ups first (soonest date first), then what's in use, waiting, to try, and not a fit.
export function sortResources(list) {
  return [...list].sort((a, b) =>
    (a.nextDate ? 0 : 1) - (b.nextDate ? 0 : 1)
    || (a.nextDate || '').localeCompare(b.nextDate || '')
    || STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
    || a.name.localeCompare(b.name));
}

// Next steps dated today or earlier. Dates are local "YYYY-MM-DD", so they compare as text.
export function dueFollowUps(list, now = Date.now()) {
  const today = toLocalInput(now).slice(0, 10);
  return sortResources(list.filter((r) => r.nextDate && r.nextStep && r.nextDate <= today));
}
