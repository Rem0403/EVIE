import { useState } from 'react';
import BottomBar from './BottomBar.jsx';
import ColorSelector from './ColorSelector.jsx';
import Icon from './Icon.jsx';
import Tabs from './Tabs.jsx';
import { useFlash } from '../lib/useFlash.js';
import { loadPalette, loadTheme, PALETTES, savePalette, saveTheme, THEMES } from '../lib/theme.js';
import { seedDemo } from '../data/demo.js';

// Swatch shown for each palette: a mid tone of its page color, so the circles are easy to tell apart.
const SWATCH = { lavender: '#c9b8ea', blue: '#a9cbea', green: '#b3cfb8', pink: '#e9bcd6', earth: '#d8c7aa' };

const QUICK_TYPES = [
  ['med', 'Medication'],
  ['sleep', 'Sleep'],
  ['behavior', 'Behavior'],
  ['goal', 'Goal practice'],
  ['note', 'Note'],
];

// The floating nav on every screen (except the seizure timer), with its Log menu and More sheet.
// onGoogle resolves to an error message, or '' when done.
export default function AppNav({
  circle, me, resources = [], goals = [], demo, active, email = '',
  onHome, onSummary, onSeizure, onQuickLog, onCarePlan, onSchedule, onSupport, onGoals, onInvite, onPeople, onPrivacy,
  onGoogle, onSignOut, onExit, onLeave,
}) {
  const [chooser, setChooser] = useState(false);
  const [more, setMore] = useState(false);
  const [theme, setTheme] = useState(loadTheme);
  const [palette, setPalette] = useState(loadPalette);
  const [toast, setToast] = useFlash();
  const [seeding, setSeeding] = useState(false);

  async function google() {
    const message = await onGoogle();
    if (message) setToast(message);
  }

  async function loadDemo() {
    if (!window.confirm('Add a demo week of entries to this circle?')) return;
    setSeeding(true);
    try {
      await seedDemo(circle, me, { hasResources: resources.length > 0, hasGoals: goals.length > 0 });
    } catch (err) {
      console.error(err);
      setToast("Couldn't load demo data.");
    } finally {
      setSeeding(false);
    }
  }

  const fromMore = (action) => () => {
    setMore(false);
    action();
  };

  function chooseTheme(t) {
    setTheme(t);
    saveTheme(t);
  }

  function choosePalette(p) {
    setPalette(p);
    savePalette(p);
  }

  return (
    <>
      {toast && <p className="nav-toast no-print" role="status">{toast}</p>}
      <BottomBar active={active} onHome={onHome} onSeizure={onSeizure} onLog={() => setChooser(true)} onSummary={onSummary} onMore={() => setMore(true)} />

      {chooser && (
        <div className="sheet-backdrop" onClick={() => setChooser(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Log" onClick={(e) => e.stopPropagation()}>
            {QUICK_TYPES.map(([type, label]) => (
              <button key={type} className={`btn type-${type}`} onClick={() => { setChooser(false); onQuickLog(type); }}>
                <Icon name={type} size={22} /> {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {more && (
        <div className="sheet-backdrop" onClick={() => setMore(false)}>
          <div className="sheet panel grouped" role="dialog" aria-modal="true" aria-label="More" onClick={(e) => e.stopPropagation()}>
            <h2>More</h2>
            <div className="group">
              <button className="list-row" onClick={fromMore(onCarePlan)}>Care plan<Icon name="chevron" size={18} /></button>
              <button className="list-row" onClick={fromMore(onGoals)}>Goals<Icon name="chevron" size={18} /></button>
              <button className="list-row" onClick={fromMore(onSchedule)}>Caregiver schedule<Icon name="chevron" size={18} /></button>
              <button className="list-row" onClick={fromMore(onSupport)}>Support<Icon name="chevron" size={18} /></button>
            </div>
            <div className="group appearance">
              <span className="field-label">Appearance</span>
              <span className="small muted">Mode</span>
              <Tabs id="mode" label="Mode" options={THEMES} value={theme} onChange={chooseTheme} radio />
              <ColorSelector
                legend="Colors"
                value={palette}
                onChange={choosePalette}
                options={PALETTES.map(([key, label]) => ({ value: key, label, color: SWATCH[key] }))}
              />
            </div>
            <div className="group">
              <button className="list-row" onClick={fromMore(onInvite)}>
                <span>Invite family<span className="list-sub">Code {circle.joinCode}</span></span>
                <Icon name="chevron" size={18} />
              </button>
              <button className="list-row" onClick={fromMore(onPeople)}>People in this circle<Icon name="chevron" size={18} /></button>
              {email ? (
                <button className="list-row" onClick={fromMore(onSignOut)}>
                  <span>Sign out of Google<span className="list-sub">Signed in as {email}</span></span>
                </button>
              ) : (
                <button className="list-row" onClick={fromMore(google)}>
                  <span>Save with Google<span className="list-sub">Get back to this circle on a new phone</span></span>
                  <Icon name="chevron" size={18} />
                </button>
              )}
              {demo && (
                <button className="list-row" onClick={fromMore(loadDemo)} disabled={seeding}>
                  {seeding ? 'Loading…' : 'Load demo week'}
                </button>
              )}
            </div>
            <div className="group">
              <button className="list-row" onClick={fromMore(onPrivacy)}>Privacy<Icon name="chevron" size={18} /></button>
              <button className="list-row" onClick={fromMore(onExit)}>
                <span>Exit EVIE<span className="list-sub">Syncs your changes first</span></span>
              </button>
              <button className="list-row danger" onClick={fromMore(onLeave)}>Leave this circle</button>
            </div>
            <button className="btn" onClick={() => setMore(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
