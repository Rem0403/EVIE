import { useLayoutEffect, useRef, useState } from 'react';

// Segmented tabs with a highlight that slides to the selected tab (adapted from beui.dev's tabs, in plain
// CSS: --dur-slide, off under reduce motion). Follows the ARIA tabs pattern: arrow keys, Home and End
// move between tabs and select them. Render the panel with tabPanelProps(id, value).
// radio: the same look for a setting (like Light / Dark) with no panel, announced as radio buttons.
export default function Tabs({ id, label, options, value, onChange, radio = false }) {
  const list = useRef(null);
  const bar = useIndicator(list, '.tab.on', [value, options]);

  function onKeyDown(e) {
    const i = options.findIndex(([v]) => v === value);
    const last = options.length - 1;
    const next = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    onChange(options[next][0]);
    list.current?.querySelectorAll('.tab')[next]?.focus();
  }

  return (
    <div ref={list} role={radio ? 'radiogroup' : 'tablist'} aria-label={label} className={`tablist${bar ? ' measured' : ''}`} onKeyDown={onKeyDown}>
      {bar && <span className="tab-indicator" aria-hidden="true" style={{ transform: `translateX(${bar.left}px)`, width: bar.width }} />}
      {options.map(([v, text]) => {
        const selected = v === value;
        const a11y = radio
          ? { role: 'radio', 'aria-checked': selected }
          : { role: 'tab', id: `${id}-tab-${v}`, 'aria-selected': selected, 'aria-controls': `${id}-panel` };
        return (
          <button key={v} type="button" {...a11y} tabIndex={selected ? 0 : -1} className={`tab${selected ? ' on' : ''}`} onClick={() => onChange(v)}>
            {text}
          </button>
        );
      })}
    </div>
  );
}

// Measures the element matching `selector` inside `ref` (and again on resize), so a highlight can slide to it.
// Keeps the last position when nothing matches, so the highlight can fade out where it was.
export function useIndicator(ref, selector, deps) {
  const [box, setBox] = useState(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => {
      const target = el.querySelector(selector);
      if (target && target.offsetWidth) {
        setBox({ left: target.offsetLeft, top: target.offsetTop, width: target.offsetWidth, height: target.offsetHeight });
      }
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return box;
}

export const tabPanelProps = (id, value) => ({ role: 'tabpanel', id: `${id}-panel`, 'aria-labelledby': `${id}-tab-${value}`, tabIndex: 0 });
