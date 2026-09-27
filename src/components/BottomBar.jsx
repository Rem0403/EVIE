import Icon from './Icon.jsx';

export default function BottomBar({ onSeizure, onLog }) {
  return (
    <nav className="bottom-bar no-print">
      <button className="btn seizure-btn" onClick={onSeizure}><Icon name="seizure" /> Seizure</button>
      <button className="btn" onClick={onLog}><Icon name="plus" /> Log</button>
    </nav>
  );
}
