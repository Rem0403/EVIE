import { useState } from 'react';
import Icon from './Icon.jsx';
import { initials } from '../lib/avatar.js';

// A round profile picture, or the person's initials when there's none (or it won't load, like an
// expired Google picture), or a person silhouette before a name is typed, like Contacts.
// Decorative: the name always appears next to it or in its button's label.
export default function Avatar({ name, photo, size = 40 }) {
  const [broken, setBroken] = useState(''); // the photo that failed, so a new one gets a fresh try
  const style = { width: size, height: size };
  if (photo && photo !== broken) {
    return (
      <img className="avatar" src={photo} alt="" style={style} referrerPolicy="no-referrer" draggable={false}
        onError={() => setBroken(photo)} />
    );
  }
  return (
    <span className="avatar monogram" style={{ ...style, fontSize: Math.round(size * 0.4) }} aria-hidden="true">
      {initials(name) || <Icon name="person" size={Math.round(size * 0.45)} />}
    </span>
  );
}
