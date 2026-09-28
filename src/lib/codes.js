// No 0/O, 1/I/L, so codes read aloud or copied by hand don't get mixed up.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const LIMIT = 256 - (256 % ALPHABET.length); // bytes at or above this would favour some letters
const CURRENT = /^EVIE-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/;

// 31^8 ≈ 850 billion codes, from a secure random source, so they can't be guessed.
export function generateJoinCode(randomBytes = (arr) => crypto.getRandomValues(arr)) {
  let chars = '';
  while (chars.length < 8) {
    for (const b of randomBytes(new Uint8Array(8))) {
      if (b < LIMIT && chars.length < 8) chars += ALPHABET[b % ALPHABET.length];
    }
  }
  return `EVIE-${chars.slice(0, 4)}-${chars.slice(4)}`;
}

// Accepts "EVIE-7KQ4-M2XP", "evie 7kq4 m2xp", "7KQ4M2XP"... returns "EVIE-7KQ4-M2XP" or null.
export function normalizeJoinCode(input) {
  if (typeof input !== 'string') return null;
  const chars = input.toUpperCase().replace(/^\s*EVIE/, '').replace(/[\s-]/g, '');
  const code = `EVIE-${chars.slice(0, 4)}-${chars.slice(4)}`;
  return chars.length === 8 && CURRENT.test(code) ? code : null;
}

// Circles made before the longer codes still carry a guessable 4-digit one.
export const isCurrentCode = (code) => CURRENT.test(code ?? '');
