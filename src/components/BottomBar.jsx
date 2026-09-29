import { useRef } from 'react';
import Icon from './Icon.jsx';
import { useIndicator } from './Tabs.jsx';

// Floating dark nav (5 items at most). The seizure button is the raised circle in the middle:
// the biggest control on screen, always one thumb-tap away. The highlight circle slides between
// Home and Care summary like the tabs, and fades out on screens that aren't in the nav.
export default function BottomBar({ active, onHome, onSeizure, onLog, onSummary, onMore }) {
  const nav = useRef(null);
  const spot = useIndicator(nav, '.nav-btn.active', [active]);
  const current = (name) => (active === name ? { 'aria-current': 'page' } : {});
  return (
    <nav ref={nav} className={`bottom-nav no-print${spot ? ' measured' : ''}`} aria-label="Main">
      {spot && (
        <span className={`nav-indicator${active === 'home' || active === 'summary' ? '' : ' hidden'}`} aria-hidden="true"
          style={{ transform: `translate(${spot.left}px, ${spot.top}px)`, width: spot.width, height: spot.height }} />
      )}
      <button className={`nav-btn${active === 'home' ? ' active' : ''}`} aria-label="Home" {...current('home')} onClick={onHome}>
        <Icon name="home" size={22} />
      </button>
      <button className={`nav-btn${active === 'summary' ? ' active' : ''}`} aria-label="Care summary" {...current('summary')} onClick={onSummary}>
        <Icon name="summary" size={22} />
      </button>
      <button className="nav-seizure" aria-label="Start seizure timer" onClick={onSeizure}>
        <Icon name="seizure" size={26} />
        <span>Seizure</span>
      </button>
      <button className="nav-btn" aria-label="Log something" onClick={onLog}><Icon name="plus" size={24} /></button>
      <button className="nav-btn" aria-label="More" onClick={onMore}><Icon name="more" size={24} /></button>
    </nav>
  );
}
