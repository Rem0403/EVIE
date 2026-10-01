// Profile pictures. A photo is shrunk to a small square JPEG and kept, as a data URL, on the
// member record, so everyone in the circle sees it (see firestore.rules for the same limits).

const PHOTO_PX = 240; // sharp at the biggest size shown (96px) on a 2.5x screen
export const MAX_PHOTO_CHARS = 60000; // ~44 KB of JPEG; a 240px photo is usually 10–30 KB
const MAX_FILE_BYTES = 50 * 1024 * 1024; // above a 200 MP phone photo; stops decoding something huge

const JPEG_DATA_URL = /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/;
const GOOGLE_PHOTO_URL = /^https:\/\/lh[0-9]+\.googleusercontent\.com\/[^\s"<>]+$/;

// What a member record may hold as a photo: our own JPEG, or the Google account picture.
// '' means the person removed theirs (so the Google picture isn't put back automatically).
export function isAllowedPhoto(photo) {
  return photo === '' || (typeof photo === 'string' && photo.length <= MAX_PHOTO_CHARS
    && (JPEG_DATA_URL.test(photo) || GOOGLE_PHOTO_URL.test(photo)));
}

// Up to two letters for the circle shown when there's no photo, like Contacts: "Remy Jacob" -> "RJ".
export function initials(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return letters.map((w) => [...w][0]).join('').toUpperCase();
}

// Opens a chosen picture for the cropper. Rejects with a message that can be shown as is.
// The image element applies the photo's rotation (EXIF) when drawn, and on iPhone the photo
// picker already hands over HEIC photos as JPEG. Call close() when done with the image.
export async function openPhoto(file) {
  if (!file?.type?.startsWith('image/')) throw new Error('Choose a photo (an image file).');
  if (file.size > MAX_FILE_BYTES) throw new Error('That photo is too big. Choose a smaller one.');
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("Couldn't open that photo. Try a different one.");
  }
  return { img, close: () => URL.revokeObjectURL(url) };
}

// Draws the chosen square of the photo (see lib/crop.js) as a small JPEG data URL. Throws with
// a message that can be shown as is if it can't be made small enough.
export function squareToDataUrl(img, { sx, sy, size }) {
  const canvas = document.createElement('canvas');
  canvas.width = PHOTO_PX;
  canvas.height = PHOTO_PX;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // a transparent PNG gets a white background, not black
  ctx.fillRect(0, 0, PHOTO_PX, PHOTO_PX);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, size, size, 0, 0, PHOTO_PX, PHOTO_PX);
  for (const quality of [0.85, 0.7, 0.5]) {
    const data = canvas.toDataURL('image/jpeg', quality);
    if (isAllowedPhoto(data)) return data;
  }
  throw new Error("Couldn't use that photo. Try a different one.");
}
