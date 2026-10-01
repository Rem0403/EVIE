import { useEffect, useRef, useState } from 'react';
import PhotoCropper from './PhotoCropper.jsx';
import { openPhoto } from '../lib/avatar.js';

// Choosing a photo: the system picker (photo library or camera on a phone), then Move and scale.
// Render `elements` somewhere in the component, put `buttonRef` on the button that calls open(),
// so focus goes back to it afterwards. onChosen gets the finished photo. shape: see PhotoCropper.
export function usePhotoChooser(onChosen, { shape } = {}) {
  const input = useRef(null);
  const buttonRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cropping, setCropping] = useState(null); // { img, close } while framing a new photo

  // Frees the opened photo when framing ends, or if this closes mid-way.
  useEffect(() => () => cropping?.close(), [cropping]);

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // choosing the same photo again still counts
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      setCropping(await openPhoto(file));
    } catch (err) {
      console.error('photo', err);
      setError(err.message || "Couldn't open that photo. Try a different one.");
    } finally {
      setBusy(false);
    }
  }

  function end(photo) {
    setCropping(null);
    if (photo) onChosen(photo);
    buttonRef.current?.focus(); // back where you were
  }

  const elements = (
    <>
      <input ref={input} type="file" accept="image/*" onChange={pick} hidden />
      {cropping && <PhotoCropper img={cropping.img} shape={shape} onChoose={end} onCancel={() => end(null)} />}
    </>
  );
  return { open: () => input.current.click(), buttonRef, busy, error, setError, elements };
}
