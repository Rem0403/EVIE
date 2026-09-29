import { useState } from 'react';
import BottomBar from './BottomBar.jsx';
import ColorSelector from './ColorSelector.jsx';
import Icon from './Icon.jsx';
import Tabs from './Tabs.jsx';
import { shareJoinCode, shareMessage } from '../lib/share.js';
import { useFlash } from '../lib/useFlash.js';
import { loadPalette, loadTheme, PALETTES, savePalette, saveTheme, THEMES } from '../lib/theme.js';
import { buildDemoWeek, DEMO_CARE_PLAN, demoResources } from '../lib/demoWeek.js';
import { addEntriesBatch } from '../data/entries.js';
import { updateCircle } from '../data/circles.js';
import { addResource } from '../data/resources.js';

// Swatch shown for each palette: a mid tone of its page color, so the circles are easy to tell apart.
const SWATCH = { lavender: '#c9b8ea', blue: '#a9cbea', green: '#b3cfb8', pink: '#e9bcd6', earth: '#d8c7aa' };

const QUICK_TYPES = [
  ['med', 'Medication'],
  ['sleep', 'Sleep'],
  ['behavior', 'Behavior'],
  ['note', 'Note'],
];

// The floating nav on every screen (except the seizure timer), with its Log menu and More sheet.
export default function AppNav({
  circle, me, resources = [], demo, active,
  onHome, onSummary, onSeizure, onQuickLog, onCarePlan, onSchedule, onSupport, onLeave,
}) {
  const [chooser, setChooser] = useState(false);
  const [more, setMore] = useState(false);
  const [theme, setTheme] = useState(loadTheme);
  const [palette, setPalette] = useState(loadPalette);
  const [toast, setToast] = useFlash();
  const [seeding, setSeeding] = useState(false);

  async function share() {
    const result = await shareJoinCode(circle);
    setToast(shareMessage(result, circle));
  }

  async function loadDemo() {
    if (!window.confirm('Add a demo week of entries to this circle?')) return;
    setSeeding(true);
    try {
      await addEntriesBatch(circle.id, buildDemoWeek(Date.now(), me));
      // Only fill in a care plan nobody has written yet.
      if (!circle.meds?.length && !circle.profile) await updateCircle(circle.id, DEMO_CARE_PLAN);
      if (!resources.length) for (const r of demoResources(Date.now(), me)) addResource(circle.id, r);
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
              <button className="list-row" onClick={fromMore(share)}>
                <span>Invite family<span className="list-sub">Code {circle.joinCode}</span></span>
                <Icon name="chevron" size={18} />
              </button>
              {demo && (
                <button className="list-row" onClick={fromMore(loadDemo)} disabled={seeding}>
                  {seeding ? 'Loading…' : 'Load demo week'}
                </button>
              )}
            </div>
            <div className="group">
              <button className="list-row danger" onClick={fromMore(onLeave)}>Leave circle on this device</button>
            </div>
            <button className="btn" onClick={() => setMore(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
