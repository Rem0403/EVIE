import Avatar from './Avatar.jsx';
import { usePhotoChooser } from './usePhotoChooser.jsx';

// Your picture with buttons to choose one, use your Google picture, or remove it. On a phone,
// Choose photo opens the system picker (photo library or camera), then Move and scale to frame
// it. Used in setup, joining and your profile. onChange gets the new photo, or '' when removed.
export default function PhotoPicker({ name, photo, googlePhoto = '', onChange, size = 96 }) {
  const chooser = usePhotoChooser(onChange);

  function choose(next) {
    chooser.setError('');
    onChange(next);
  }

  return (
    <div className="photo-picker">
      <Avatar name={name} photo={photo} size={size} />
      <div className="photo-actions">
        <button ref={chooser.buttonRef} type="button" className="btn small" disabled={chooser.busy} onClick={chooser.open}>
          {chooser.busy ? 'Opening…' : photo ? 'Change photo' : 'Choose photo'}
        </button>
        {googlePhoto && photo !== googlePhoto && (
          <button type="button" className="btn small" disabled={chooser.busy} onClick={() => choose(googlePhoto)}>Use Google photo</button>
        )}
        {photo && (
          <button type="button" className="btn small danger" disabled={chooser.busy} onClick={() => choose('')}>Remove photo</button>
        )}
      </div>
      {chooser.error && <p className="error" role="alert">{chooser.error}</p>}
      {chooser.elements}
    </div>
  );
}
