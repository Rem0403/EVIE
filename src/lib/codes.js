// No 0/O, 1/I/L, so codes read aloud or copied by hand don't get mixed up.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const LIMIT = 256 - (256 % ALPHABET.length); // bytes at or above this would favour some letters
const MAX_NAME = 10;
const CURRENT = /^[A-Z]{1,10}-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/;

// The person's first name in plain capitals ("Zoë Anne" → "ZOE"), so the code says whose circle
// it is. EVIE when the name has no Latin letters to use.
export function namePrefix(personName) {
  const first = String(personName ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().split(/\s+/)[0];
  return first.toUpperCase().replace(/[^A-Z]/g, '').slice(0, MAX_NAME) || 'EVIE';
}

// "MAYA-7KQ4-M2XP". The name is easy to guess, so all the security is in the 8 random
// characters: 31^8 ≈ 850 billion, from a secure random source.
export function generateJoinCode(personName, randomBytes = (arr) => crypto.getRandomValues(arr)) {
  let chars = '';
  while (chars.length < 8) {
    for (const b of randomBytes(new Uint8Array(8))) {
      if (b < LIMIT && chars.length < 8) chars += ALPHABET[b % ALPHABET.length];
    }
  }
  return `${namePrefix(personName)}-${chars.slice(0, 4)}-${chars.slice(4)}`;
}

// Accepts "MAYA-7KQ4-M2XP", "maya 7kq4 m2xp", "Maya7KQ4M2XP"... returns "MAYA-7KQ4-M2XP" or null.
// Typed with spaces or dashes, the first group is the name; typed as one run, the last 8
// characters are the random part. Just the 8 random characters means an older EVIE- code.
export function normalizeJoinCode(input) {
  if (typeof input !== 'string') return null;
  const groups = input.toUpperCase().split(/[\s-]+/).filter(Boolean);
  const all = groups.join('');
  const build = (name, random) => {
    const code = `${name || 'EVIE'}-${random.slice(0, 4)}-${random.slice(4)}`;
    return random.length === 8 && CURRENT.test(code) ? code : null;
  };
  if (groups.length === 1) return build(all.slice(0, -8), all.slice(-8));
  return build(groups[0], groups.slice(1).join('')) || build('', all);
}

// Circles made before the longer codes still carry a guessable 4-digit one.
export const isCurrentCode = (code) => CURRENT.test(code ?? '');
