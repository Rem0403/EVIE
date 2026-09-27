export default function ChipGroup({ options, value, onChange, multi = false }) {
  const isOn = (key) => (multi ? value.includes(key) : value === key);
  const toggle = (key) => {
    if (!multi) return onChange(key);
    onChange(value.includes(key) ? value.filter((v) => v !== key) : [...value, key]);
  };
  return (
    <div className="chips">
      {options.map(([key, label]) => (
        <button
          type="button"
          key={key}
          className={`chip${isOn(key) ? ' on' : ''}`}
          aria-pressed={isOn(key)}
          onClick={() => toggle(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
