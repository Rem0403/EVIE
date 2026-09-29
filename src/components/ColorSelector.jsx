import { useId } from 'react';

// A group of round color swatches that behave as radio buttons (adapted from beui.dev's color selector,
// in plain CSS and without an animation library). Native radios give keyboard support for free:
// Tab into the group, arrow keys move the choice. Each swatch shows its name too, so the choice
// never relies on color alone.
export default function ColorSelector({ legend, value, options, onChange, name }) {
  const autoName = useId();
  return (
    <fieldset className="color-selector">
      <legend>{legend}</legend>
      <div className="swatches">
        {options.map((o) => (
          <label key={o.value} className="swatch" style={{ '--swatch': o.color }}>
            <input
              type="radio"
              name={name || autoName}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            <span className="swatch-ring" aria-hidden="true"><span className="swatch-dot" /></span>
            <span className="swatch-name">{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
