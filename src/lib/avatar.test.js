import { expect, test } from 'vitest';
import { initials, isAllowedPhoto, MAX_PHOTO_CHARS } from './avatar.js';

test('initials use the first and last word, like Contacts', () => {
  expect(initials('Remy Jacob')).toBe('RJ');
  expect(initials('  mom ')).toBe('M');
  expect(initials('Mary Ann Lee')).toBe('ML');
  expect(initials('')).toBe('');
});

test('only small JPEGs, Google account pictures, or "removed" are allowed', () => {
  expect(isAllowedPhoto('data:image/jpeg;base64,/9j/4AAQSkZJRg==')).toBe(true);
  expect(isAllowedPhoto('https://lh3.googleusercontent.com/a/ACg8ocK=s96-c')).toBe(true);
  expect(isAllowedPhoto('')).toBe(true);
  expect(isAllowedPhoto('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false);
  expect(isAllowedPhoto('javascript:alert(1)')).toBe(false);
  expect(isAllowedPhoto('https://example.com/me.jpg')).toBe(false);
  expect(isAllowedPhoto('https://lh3.googleusercontent.com.evil.com/a')).toBe(false);
  expect(isAllowedPhoto(`data:image/jpeg;base64,${'A'.repeat(MAX_PHOTO_CHARS)}`)).toBe(false);
  expect(isAllowedPhoto(null)).toBe(false);
});
