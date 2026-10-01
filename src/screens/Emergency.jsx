import EmergencyInfo from '../components/EmergencyInfo.jsx';
import Icon from '../components/Icon.jsx';

export default function Emergency({ circle, onBack, onEditPlan }) {
  return (
    <section className="stack">
      <div className="spread no-print">
        <button className="btn ghost small" onClick={onBack}><Icon name="back" size={16} />Back</button>
        <div className="row">
          <button className="btn small" onClick={onEditPlan}>Edit</button>
          <button className="btn small" onClick={() => window.print()}>Print</button>
        </div>
      </div>
      <h1>Emergency info: {circle.personName}</h1>
      <EmergencyInfo circle={circle} onEditPlan={onEditPlan} />
    </section>
  );
}
