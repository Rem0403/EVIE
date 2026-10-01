import { useLayoutEffect, useRef, useState } from 'react';
import { GUIDE, GUIDE_NOTE } from '../lib/supportGuide.js';
import Tabs, { tabPanelProps } from '../components/Tabs.jsx';
import {
  mailtoHref, RESOURCE_CATEGORIES, RESOURCE_STATUS, safeUrl, sortResources, telHref,
} from '../lib/resources.js';
import { labelOf, toLocalInput } from '../lib/format.js';
import Icon from '../components/Icon.jsx';
import { holdInPlace } from '../lib/scroll.js';

const shortDate = (ymd) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// The family's shared list of programs and groups, and a "Start here" guide for each stage.
export default function Support({ circle, resources, onBack, onAdd, onEdit }) {
  const today = toLocalInput(Date.now()).slice(0, 10);
  const saved = new Set(resources.map((r) => r.name.trim().toLowerCase()));
  // A family with nothing saved yet starts on the guide; after that, on their own list.
  const [tab, setTab] = useState(resources.length ? 'resources' : 'guide');
  const [openStage, setOpenStage] = useState(GUIDE[0].id); // one section open at a time

  return (
    <section className="stack">
      <button className="btn ghost small" onClick={onBack} style={{ alignSelf: 'flex-start' }}><Icon name="back" size={16} />Back</button>
      <div>
        <h1>Support</h1>
        <p className="muted">Programs, services and groups for {circle.personName}. Everyone in the circle can add and update them.</p>
      </div>

      <Tabs id="support" label="Support" options={[['resources', 'Our resources'], ['guide', 'Start here']]} value={tab} onChange={setTab} />

      {tab === 'resources' && (
        <div {...tabPanelProps('support', 'resources')} className="stack tab-panel">
          <div className="spread">
            <h2>Our resources</h2>
            <button className="btn small" onClick={() => onAdd(null)}>+ Add</button>
          </div>
          {resources.length === 0 && (
            <p className="empty-inline muted">Nothing saved yet. Look through Start here, or add a program or group you already use.</p>
          )}
          {sortResources(resources).map((r) => {
            // Every link is rebuilt from the stored text: the database may hold anything a member
            // wrote directly, and React 18 doesn't block javascript: links.
            const tel = telHref(r.phone);
            const web = safeUrl(r.url);
            const mail = mailtoHref(r.email);
            return (
              <article key={r.id} className={`card resource status-${r.status}`}>
                <div className="spread">
                  <strong className="resource-name">{r.name}</strong>
                  <button className="btn ghost small" onClick={() => onEdit(r.id)} aria-label={`Edit ${r.name}`}>Edit</button>
                </div>
                <p className="muted small">
                  {labelOf(RESOURCE_STATUS, r.status)} · {labelOf(RESOURCE_CATEGORIES, r.category)}
                </p>
                {r.nextStep && (
                  <p className={`resource-next${r.nextDate && r.nextDate <= today ? ' due' : ''}`}>
                    Next: {r.nextStep}{r.nextDate ? ` · ${r.nextDate < today ? 'overdue since ' : r.nextDate === today ? 'today, ' : ''}${shortDate(r.nextDate)}` : ''}
                  </p>
                )}
                {(tel || web || mail) && (
                  <div className="resource-links">
                    {tel && <a className="btn small" href={tel}>Call {r.phone}</a>}
                    {web && <a className="btn small" href={web} target="_blank" rel="noopener noreferrer">Website<Icon name="external" size={13} /></a>}
                    {mail && <a className="btn small" href={mail}>Email</a>}
                  </div>
                )}
                {r.note && <p className="small resource-note">{r.note}</p>}
              </article>
            );
          })}
        </div>
      )}

      {tab === 'guide' && (
        <div {...tabPanelProps('support', 'guide')} className="stack tab-panel">
          <h2>Start here</h2>
          <p className="muted small">{GUIDE_NOTE}</p>
          {GUIDE.map((stage) => (
            <GuideStage key={stage.id} stage={stage} open={openStage === stage.id}
              onToggle={() => setOpenStage(openStage === stage.id ? null : stage.id)}>
              {stage.items.map((item) => (
                <div key={item.id} className="guide-item">
                  <strong>{item.name}</strong>
                  <p>{item.text}</p>
                  <div className="resource-links">
                    {item.url && <a className="btn small" href={item.url} target="_blank" rel="noopener noreferrer">Official site<Icon name="external" size={13} /></a>}
                    {saved.has(item.name.toLowerCase())
                      ? <span className="saved with-icon"><Icon name="check" size={14} />In our resources</span>
                      : (
                        <button className="btn small" aria-label={`Save ${item.name} to our resources`}
                          onClick={() => onAdd({ name: item.name, category: item.category, url: item.url || '' })}>
                          Save to our resources
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </GuideStage>
          ))}
        </div>
      )}
    </section>
  );
}

// One section of Start here, opening like beui.dev's bouncy accordion: the height springs open
// (a slight overshoot that settles), the text fades in, the chevron turns. The springs are CSS
// (styles.css --spring-*), so reduced motion turns them off like every other animation. The
// content's height is measured, and re-measured if it changes, so the spring has a target.
function GuideStage({ stage, open, onToggle, children }) {
  const inner = useRef(null);
  const [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    const el = inner.current;
    setHeight(el.offsetHeight);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const bodyId = `guide-${stage.id}`;
  return (
    <section className={`card guide-stage${open ? ' open' : ''}`}>
      <h3>
        <button type="button" className="guide-toggle" aria-expanded={open} aria-controls={bodyId}
          onClick={(e) => { holdInPlace(e.currentTarget, 650); onToggle(); }}>
          {stage.title}
          <Icon name="chevron" size={16} className="disclose" />
        </button>
      </h3>
      {/* Closed content is inert: out of reach for Tab and screen readers, though it's still on the page. */}
      <div id={bodyId} className="guide-body" style={{ height: open ? height : 0 }} {...(open ? {} : { inert: '' })}>
        <div ref={inner}>{children}</div>
      </div>
    </section>
  );
}
