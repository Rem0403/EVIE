import Icon from './Icon.jsx';

// Start seizure is the biggest, most visible control on the home screen, always one tap away.
export default function BottomBar({ onSeizure, onLog }) {
  return (
    <nav className="bottom-bar no-print" aria-label="Log">
      <button className="btn seizure-btn" onClick={onSeizure}><Icon name="seizure" size={24} /> Start seizure</button>
      <button className="btn log-btn" onClick={onLog}><Icon name="plus" /> Log</button>
    </nav>
  );
}
