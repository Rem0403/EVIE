import { useId, useState } from 'react';
import ColorSelector from './ColorSelector.jsx';
import Icon from './Icon.jsx';
import Tabs, { tabPanelProps } from './Tabs.jsx';
import { usePhotoChooser } from './usePhotoChooser.jsx';
import { CIRCLE_COLORS, CIRCLE_ICONS, circleIconOf } from '../lib/circleIcon.js';

const KINDS = [['symbol', 'Symbol'], ['photo', 'Photo']];

// A big preview, then Symbol or Photo. Symbol: a grid of symbols and a row of colors (native
// radio groups, so Tab and the arrow keys work). Photo: choose one and frame it in Move and scale.
// value: { icon, iconColor, iconPhoto }; iconPhoto is '' unless Photo is picked and a photo chosen.
// A photo picked earlier is remembered while switching back and forth.
export default function CircleIconPicker({ value, onChange }) {
  const name = useId();
  const [kind, setKind] = useState(value.iconPhoto ? 'photo' : 'symbol');
  const [photo, setPhoto] = useState(value.iconPhoto || '');
  const chooser = usePhotoChooser((p) => {
    setPhoto(p);
    onChange({ ...value, iconPhoto: p });
  }, { shape: 'rounded' });

  function switchTo(next) {
    setKind(next);
    onChange({ ...value, iconPhoto: next === 'photo' ? photo : '' });
  }

  function removePhoto() {
    setPhoto('');
    chooser.setError('');
    onChange({ ...value, iconPhoto: '' });
  }

  return (
    <div className="circle-icon-picker">
      <CircleIcon icon={circleIconOf(value)} size={96} />
      <Tabs id={`${name}-kind`} label="Icon type" options={KINDS} value={kind} onChange={switchTo} />
      <div {...tabPanelProps(`${name}-kind`, kind)} className="circle-icon-panel">
        {kind === 'symbol' ? (
          <>
            <fieldset className="color-selector">
              <legend>Symbol</legend>
              <div className="swatches icon-grid">
                {CIRCLE_ICONS.map(([key, symbol, label]) => (
                  <label key={key} className="swatch">
                    <input type="radio" name={name} value={key} checked={value.icon === key}
                      onChange={() => onChange({ ...value, icon: key })} />
                    <span className="swatch-ring" aria-hidden="true"><Icon icon={symbol} size={20} /></span>
                    <span className="sr-only">{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <ColorSelector
              legend="Color"
              value={value.iconColor}
              onChange={(iconColor) => onChange({ ...value, iconColor })}
              options={CIRCLE_COLORS.map(([key, label, color]) => ({ value: key, label, color }))}
            />
          </>
        ) : (
          <div className="photo-picker">
            <div className="photo-actions">
              <button ref={chooser.buttonRef} type="button" className="btn small" disabled={chooser.busy} onClick={chooser.open}>
                {chooser.busy ? 'Opening…' : photo ? 'Change photo' : 'Choose photo'}
              </button>
              {photo && <button type="button" className="btn small danger" disabled={chooser.busy} onClick={removePhoto}>Remove photo</button>}
            </div>
            {!photo && <p className="muted small">Until you choose one, the symbol is used.</p>}
            {chooser.error && <p className="error" role="alert">{chooser.error}</p>}
          </div>
        )}
      </div>
      {chooser.elements}
    </div>
  );
}

// The icon itself: a photo, or the symbol on its color. Decorative; the circle's name is always nearby.
export function CircleIcon({ icon, size = 40 }) {
  if (!icon) return null;
  const style = { width: size, height: size };
  if (icon.photo) return <img className="circle-icon" src={icon.photo} alt="" style={style} draggable={false} />;
  return (
    <span className="circle-icon" aria-hidden="true" style={{ ...style, background: icon.color }}>
      <Icon icon={icon.symbol} size={Math.round(size * 0.5)} />
    </span>
  );
}
