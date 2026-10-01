import { useState } from 'react';
import BottomBar from './BottomBar.jsx';
import ColorSelector from './ColorSelector.jsx';
import Icon from './Icon.jsx';
import Avatar from './Avatar.jsx';
import Tabs from './Tabs.jsx';
import { showToast } from '../lib/toast.js';
import { useSwipeDismiss } from '../lib/useSwipeDismiss.js';
import { loadPalette, loadTheme, PALETTES, savePalette, saveTheme, THEMES } from '../lib/theme.js';
import { seedDemo } from '../data/demo.js';

// Swatch shown for each palette: a mid tone of its page color, so the circles are easy to tell apart.
const SWATCH = { lavender: '#c9b8ea', blue: '#a9cbea', green: '#b3cfb8', pink: '#e9bcd6', earth: '#d8c7aa' };

// Each with one short line saying what it's for.
const QUICK_TYPES = [
  ['med', 'Medication', 'A dose given, missed or rescue'],
  ['sleep', 'Sleep', 'Bedtime, waking and how it went'],
  ['behavior', 'Behavior', 'Meltdowns, shutdowns or a good day'],
  ['goal', 'Goal', 'Practice on something they’re learning'],
  ['note', 'Note', 'Anything else, with photos or files'],
];

// The floating nav on every screen (except the seizure timer), with its Log menu and More sheet.
// onGoogle resolves to an error message, or '' when done.
export default function AppNav({
  circle, me, resources = [], goals = [], demo, active, email = '', photo = '', onProfile,
  onHome, onSummary, onSeizure, onQuickLog, onCarePlan, onSchedule, onSupport, onGoals, onInvite, onPeople, onPrivacy,
  onGoogle, onSignOut, onExit, onLeave,
}) {
  const [chooser, setChooser] = useState(false);
  const [more, setMore] = useState(false);
  const [theme, setTheme] = useState(loadTheme);
  const [palette, setPalette] = useState(loadPalette);
  const [seeding, setSeeding] = useState(false);
  const chooserSheet = useSwipeDismiss(() => setChooser(false));
  const moreSheet = useSwipeDismiss(() => setMore(false));

  async function google() {
    const message = await onGoogle();
    if (message) showToast(message);
  }

  async function loadDemo() {
    if (!window.confirm('Add a demo week of entries to this circle?')) return;
    setSeeding(true);
    try {
      await seedDemo(circle, me, { hasResources: resources.length > 0, hasGoals: goals.length > 0 });
    } catch (err) {
      console.error(err);
      showToast("Couldn't load demo data.");
    } finally {
      setSeeding(false);
    }
  }

  // The nav stays tappable over open sheets (so the seizure button is always there), and any
  // tap on it closes them first.
  const fromNav = (action) => () => {
    setChooser(false);
    setMore(false);
    action();
  };

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
      <BottomBar
        active={active}
        onHome={fromNav(onHome)}
        onSeizure={fromNav(onSeizure)}
        onLog={fromNav(() => setChooser(true))}
        onSummary={fromNav(onSummary)}
        onMore={fromNav(() => setMore(true))}
      />

      {chooser && (
        <div className="sheet-backdrop" onClick={chooserSheet.dismiss}>
          <div ref={chooserSheet.ref} {...chooserSheet.handlers} className="sheet" role="dialog" aria-modal="true" aria-label="Log" onClick={(e) => e.stopPropagation()}>
            {QUICK_TYPES.map(([type, label, about]) => (
              <button key={type} className={`btn log-type type-${type}`} onClick={() => { setChooser(false); onQuickLog(type); }}>
                <Icon name={type} size={22} />
                <span className="log-type-name">{label}</span>
                <span className="log-type-about">{about}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {more && (
        <div className="sheet-backdrop" onClick={moreSheet.dismiss}>
          <div ref={moreSheet.ref} {...moreSheet.handlers} className="sheet panel grouped" role="dialog" aria-modal="true" aria-label="More" onClick={(e) => e.stopPropagation()}>
            <h2>More</h2>
            {onProfile && (
              <div className="group">
                <button className="list-row profile-row" onClick={fromMore(onProfile)}>
                  <span className="with-icon">
                    <Avatar name={me.name} photo={photo} size={44} />
                    <span>{me.name}<span className="list-sub">{photo ? 'Change your photo' : 'Add a photo'}</span></span>
                  </span>
                  <Icon name="chevron" size={18} />
                </button>
              </div>
            )}
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
            <button className="btn" onClick={moreSheet.dismiss}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
