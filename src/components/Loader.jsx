// Three dots rising and falling in turn, with the label under them. Adapted from beui.dev's "dots"
// loader in plain CSS: no brightness change at all (nothing flashes or pulses in an epilepsy app),
// a calm 1.4s cycle, and still dots under reduce motion. See .loader in styles.css.
// quiet: inside something that already announces itself (role="status"), so it isn't read twice.
export default function Loader({ label = 'Loading…', quiet = false }) {
  return (
    <span className="loader" role={quiet ? undefined : 'status'}>
      <span className="loader-dots" aria-hidden="true"><span /><span /><span /></span>
      <span className="loader-label">{label}</span>
    </span>
  );
}
