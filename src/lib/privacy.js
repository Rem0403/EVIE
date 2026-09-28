// EVIE has no passwords: anyone in the circle, or holding a phone that's in it, can read everything.
// So it refuses text that looks like an ID number (Social Security, Medicaid, Medicare, insurance).
// ponytail: pattern-based, so it can't catch every format; widen the patterns if a real ID slips through.

const SSN = /(?<!\d)\d{3}[-\s]\d{2}[-\s]\d{4}(?!\d)|(?<![\d-])\d{9}(?![\d-])/;
// A benefits or insurance word shortly before a code with 5+ digits in a row, or a mix of letters and digits.
const LABELLED_ID = /\b(ssn|social security|medicaid|medicare|insurance|member|policy|subscriber|beneficiary)\b[^\n]{0,20}?\b(?=[A-Z0-9]*\d{5})[A-Z0-9]{6,}\b/i;
const MEDICARE_MBI = /\bmedicare\b[^\n]{0,20}?\b(?=[A-Z0-9]*[A-Z])(?=[A-Z0-9]*\d)[A-Z0-9]{11}\b/i;

export function findIdNumber(text) {
  const s = text || '';
  return SSN.test(s) || LABELLED_ID.test(s) || MEDICARE_MBI.test(s);
}

export const ID_NUMBER_MESSAGE =
  'Please don’t save ID numbers like Social Security or Medicaid numbers in EVIE. Everyone in the circle can see them. '
  + 'Keep them somewhere safe instead. (If it’s a phone number, write it with dashes, like 985-555-0142.)';
