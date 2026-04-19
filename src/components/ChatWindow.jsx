import React, { useEffect, useRef, useState, useMemo } from 'react';
import PropTypes from 'prop-types';

const QUICK_PROMPTS = [
  { label: '💊 Treatment options',  query: 'Summarize treatment options for this condition' },
  { label: '🧪 Clinical trials',    query: 'Find nearby clinical trials' },
  { label: '⚠️ Drug interactions',  query: 'Check drug interactions' },
  { label: '📋 NCCN guidelines',    query: 'Latest NCCN guidelines' },
];

const EXPLORE_SETS = [
  {
    match: ['treatment', 'therapy', 'standard of care', 'chemo', 'radiation', 'surgery'],
    suggestions: [
      { icon: '💉', text: 'What are the side effects of first-line treatment?' },
      { icon: '🔬', text: 'Are there targeted therapies or immunotherapy options?' },
      { icon: '📊', text: 'How do survival rates compare across treatment types?' },
      { icon: '🧬', text: 'What biomarkers predict treatment response?' },
    ],
  },
  {
    match: ['clinical trial', 'trial', 'recruiting', 'phase', 'nct'],
    suggestions: [
      { icon: '📍', text: 'Find trials closer to my location' },
      { icon: '🧪', text: 'What are the eligibility criteria for these trials?' },
      { icon: '💊', text: 'What experimental drugs are being tested?' },
      { icon: '📈', text: 'What are the primary endpoints of these trials?' },
    ],
  },
  {
    match: ['drug', 'interaction', 'medication', 'pharmacol', 'dosage', 'adverse', 'toxicity'],
    suggestions: [
      { icon: '⚠️', text: 'What are the most serious adverse effects to watch for?' },
      { icon: '🔄', text: 'Are there safer alternative medications?' },
      { icon: '🧬', text: 'How does patient genetics affect drug metabolism?' },
      { icon: '💉', text: 'What is the recommended dosing protocol?' },
    ],
  },
  {
    match: ['survival', 'prognosis', 'outcome', 'mortality', 'remission', 'recurrence'],
    suggestions: [
      { icon: '📉', text: 'What factors most significantly affect prognosis?' },
      { icon: '🔬', text: 'What does recent research say about long-term survival?' },
      { icon: '🧬', text: 'How do genetic mutations influence recurrence risk?' },
      { icon: '🏥', text: 'What palliative care options are available?' },
    ],
  },
  {
    match: ['immunotherapy', 'checkpoint', 'car-t', 'immune', 'antibody', 'pd-1', 'pd-l1'],
    suggestions: [
      { icon: '🧬', text: 'Which patients respond best to immunotherapy?' },
      { icon: '⚠️', text: 'What are immune-related adverse events (irAEs)?' },
      { icon: '🔬', text: 'How does combination immunotherapy compare to monotherapy?' },
      { icon: '🧪', text: 'Are there active CAR-T cell trials for this condition?' },
    ],
  },
  {
    match: ['guideline', 'nccn', 'asco', 'protocol', 'recommendation', 'standard'],
    suggestions: [
      { icon: '📋', text: 'What are the latest staging and grading criteria?' },
      { icon: '🏥', text: 'How do guidelines differ between NCCN and ASCO?' },
      { icon: '🌍', text: 'Are there international guideline variations?' },
      { icon: '🔄', text: 'What changed in the most recent guideline update?' },
    ],
  },
  {
    match: ['biomarker', 'genetic', 'mutation', 'gene', 'genomic', 'sequencing', 'biopsy'],
    suggestions: [
      { icon: '🧬', text: 'Which genetic mutations are actionable for targeted therapy?' },
      { icon: '🔬', text: 'What liquid biopsy options exist for monitoring?' },
      { icon: '📊', text: 'How is tumor mutational burden (TMB) used clinically?' },
      { icon: '💊', text: 'Are there FDA-approved targeted therapies for these mutations?' },
    ],
  },
  {
    match: [],
    suggestions: [
      { icon: '💊', text: 'What are the first-line treatment options?' },
      { icon: '🧪', text: 'Find active clinical trials for this condition' },
      { icon: '⚠️', text: 'What drug interactions should I be aware of?' },
      { icon: '📊', text: 'What does the latest research say about outcomes?' },
    ],
  },
];

function getSuggestions(text) {
  const lower = (text || '').toLowerCase();
  for (const set of EXPLORE_SETS) {
    if (set.match.length === 0) continue;
    if (set.match.some(kw => lower.includes(kw))) {
      return [...set.suggestions].sort(() => Math.random() - 0.5).slice(0, 3);
    }
  }
  return [...EXPLORE_SETS[EXPLORE_SETS.length - 1].suggestions]
    .sort(() => Math.random() - 0.5).slice(0, 3);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function toText(val) {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return val.title || val.url || val.nctId || '';
  return String(val);
}

// ── Pipeline Panel ────────────────────────────────────
const PIPELINE_META = {
  parse:    { icon: '🔍', label: 'Parsing query',            color: 'var(--blue)' },
  pubmed:   { icon: '📚', label: 'Fetching PubMed',          color: '#4ade80' },
  openalex: { icon: '🔬', label: 'Fetching OpenAlex',        color: '#a78bfa' },
  trials:   { icon: '🧪', label: 'Searching clinical trials', color: '#34d399' },
  rank:     { icon: '🧠', label: 'Ranking & summarizing',    color: '#fb923c' },
  generate: { icon: '✨', label: 'Generating response',      color: '#f472b6' },
};

function PipelinePanel({ steps }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="cl-pipeline-panel">
      <div className="cl-pipeline-header">
        <span className="cl-pipeline-title">
          <span className="cl-pipeline-pulse" />
          Research Pipeline
        </span>
      </div>
      <div className="cl-pipeline-steps">
        {steps.map((step, i) => {
          const meta   = PIPELINE_META[step.step] || { icon: '⚙️', label: step.label || step.step, color: 'var(--blue)' };
          const isDone = step.status === 'done';
          const isErr  = step.status === 'error';
          const isRun  = step.status === 'running';

          return (
            <div key={step.step || i} className={`cl-pipeline-step ${step.status}`}>
              {/* connector line */}
              {i < steps.length - 1 && <div className="cl-pipeline-line" />}

              {/* icon */}
              <div className="cl-pipeline-icon-wrap" style={{ '--step-color': meta.color }}>
                {isRun && <div className="cl-pipeline-spinner" style={{ borderTopColor: meta.color }} />}
                <span className="cl-pipeline-icon">
                  {isDone ? '✓' : isErr ? '✕' : meta.icon}
                </span>
              </div>

              {/* label + count */}
              <div className="cl-pipeline-info">
                <span className="cl-pipeline-label" style={isDone ? { color: meta.color } : {}}>
                  {step.label || meta.label}
                </span>
                {step.count != null && isDone && (
                  <span className="cl-pipeline-count" style={{ color: meta.color }}>
                    {step.count} results
                  </span>
                )}
                {isRun && <span className="cl-pipeline-running-dots"><span /><span /><span /></span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
PipelinePanel.propTypes = { steps: PropTypes.array };

// ── Plain text with bold + bullet support ─────────────
function PlainText({ text }) {
  if (!text) return null;
  return (
    <>
      {text.split('\n').map((line, i) => {
        const isBullet = line.trimStart().startsWith('* ') || line.trimStart().startsWith('- ');
        const content  = isBullet ? line.replace(/^\s*[*-]\s/, '') : line;
        const parts    = content.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j} style={{ color: 'var(--blue)', fontWeight: 600 }}>{p.slice(2, -2)}</strong>
            : p
        );
        return isBullet
          ? <span key={i} style={{ display: 'block', paddingLeft: 16, position: 'relative', marginBottom: 4 }}>
              <span style={{ position: 'absolute', left: 0, color: 'var(--blue)' }}>•</span>
              {parts}
            </span>
          : <span key={i}>{parts}<br /></span>;
      })}
    </>
  );
}
PlainText.propTypes = { text: PropTypes.string };

// ── Structured colored section boxes ──────────────────
function RichResponse({ text }) {
  if (!text) return null;
  const lines    = text.split('\n');
  const sections = [];
  let current    = null;

  const MAP = {
    'condition overview': { key: 'overview',  cls: 'cl-section-overview',   icon: '🫀', label: 'Condition Overview' },
    'research insights':  { key: 'insights',  cls: 'cl-section-insights',   icon: '🔬', label: 'Research Insights' },
    'clinical trials':    { key: 'trials',    cls: 'cl-section-trials-hdr', icon: '🧪', label: 'Clinical Trials' },
    'key takeaways':      { key: 'takeaways', cls: 'cl-section-takeaways',  icon: '✨', label: 'Key Takeaways' },
    'important note':     { key: 'note',      cls: 'cl-section-note',       icon: '⚠️', label: 'Important Note' },
  };

  for (const line of lines) {
    const clean = line.replace(/\*\*/g, '').replace(/^#+\s*/, '').toLowerCase().trim();
    const matched = Object.entries(MAP).find(([k]) => clean.startsWith(k));
    if (matched) {
      if (current) sections.push(current);
      current = { ...matched[1], lines: [] };
    } else if (current) {
      current.lines.push(line);
    } else {
      if (!sections.find(s => s.key === 'intro')) sections.push({ key: 'intro', lines: [] });
      sections.find(s => s.key === 'intro').lines.push(line);
    }
  }
  if (current) sections.push(current);
  if (sections.length <= 1) return <PlainText text={text} />;

  return (
    <div className="cl-rich-response">
      {sections.map((s, i) => {
        const body = s.lines.join('\n').trim();
        if (!body) return null;
        if (s.key === 'intro') return <div key={i} style={{ marginBottom: 10 }}><PlainText text={body} /></div>;
        return (
          <div key={i} className={`cl-response-section ${s.cls}`}>
            <div className="cl-response-section-header"><span>{s.icon}</span><span>{s.label}</span></div>
            <div className="cl-response-section-body"><PlainText text={body} /></div>
          </div>
        );
      })}
    </div>
  );
}
RichResponse.propTypes = { text: PropTypes.string };

// ── Explore follow-up chips ────────────────────────────
function ExploreSuggestions({ msg, onSend }) {
  const suggestions = useMemo(() => getSuggestions(toText(msg.content)), [msg.content]);
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="cl-explore-wrap">
      <div className="cl-explore-header">
        <span className="cl-explore-label">✦ Explore further</span>
        <button className="cl-explore-dismiss" onClick={() => setDismissed(true)}>✕</button>
      </div>
      <div className="cl-explore-chips">
        {suggestions.map((s, i) => (
          <button key={i} className="cl-explore-chip"
            onClick={() => { onSend(s.text); setDismissed(true); }}>
            <span className="cl-explore-chip-icon">{s.icon}</span>
            <span className="cl-explore-chip-text">{s.text}</span>
            <span className="cl-explore-chip-arrow">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
ExploreSuggestions.propTypes = { msg: PropTypes.object.isRequired, onSend: PropTypes.func.isRequired };

// ── Analytics panel ───────────────────────────────────
function AnalyticsPanel({ meta, sources, trials }) {
  if (!meta && !sources?.length && !trials?.length) {
    return <p style={{ color: 'var(--text-3)', fontSize: 14, padding: '20px 0' }}>No analytics data available for this query.</p>;
  }
  const pm     = meta?.totalPubmedFetched || 0;
  const oa     = meta?.totalOpenAlexFetched || 0;
  const tr     = meta?.totalTrialsFetched || 0;
  const total  = pm + oa + tr;
  const ranked = (meta?.finalPubs || 0) + (meta?.finalTrials || 0);
  const maxVal = Math.max(pm, oa, tr, 1);
  const yearMap = {};
  (sources || []).forEach(p => { if (p.year) yearMap[p.year] = (yearMap[p.year] || 0) + 1; });
  const years   = Object.entries(yearMap).sort((a, b) => b[0] - a[0]).slice(0, 6);
  const maxYear = Math.max(...years.map(y => y[1]), 1);

  return (
    <div className="cl-analytics-panel">
      <div className="cl-source-grid">
        {[
          { num: pm,     cls: 'sc-blue',   label: 'PubMed results' },
          { num: oa,     cls: 'sc-violet', label: 'OpenAlex results' },
          { num: tr,     cls: 'sc-teal',   label: 'Clinical trials' },
          { num: ranked, cls: 'sc-amber',  label: 'Top ranked shown' },
        ].map(c => (
          <div key={c.label} className="cl-source-card-sm">
            <span className={`sc-num ${c.cls}`}>{c.num}</span>
            <span className="sc-label">{c.label}</span>
          </div>
        ))}
      </div>
      <div>
        <p className="cl-analytics-title">Retrieval Pipeline</p>
        <div className="cl-bar-chart">
          {[
            { label: 'PubMed',   val: pm,     cls: 'cl-bar-pubmed' },
            { label: 'OpenAlex', val: oa,     cls: 'cl-bar-openalex' },
            { label: 'Trials',   val: tr,     cls: 'cl-bar-trials' },
            { label: 'Ranked',   val: ranked, cls: 'cl-bar-ranked' },
          ].map(r => (
            <div key={r.label} className="cl-bar-row">
              <span className="cl-bar-label">{r.label}</span>
              <div className="cl-bar-track">
                <div className={`cl-bar-fill ${r.cls}`}
                  style={{ width: `${Math.round((r.val / Math.max(maxVal, 1)) * 100)}%`, minWidth: r.val > 0 ? 36 : 0 }}>
                  {r.val > 0 ? r.val : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {years.length > 0 && (
        <div>
          <p className="cl-analytics-title">Publication Years</p>
          <div className="cl-bar-chart">
            {years.map(([yr, cnt]) => (
              <div key={yr} className="cl-bar-row">
                <span className="cl-bar-label">{yr}</span>
                <div className="cl-bar-track">
                  <div className="cl-bar-fill cl-bar-pubmed"
                    style={{ width: `${Math.round((cnt / maxYear) * 100)}%`, minWidth: 36 }}>
                    {cnt} paper{cnt > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {total > 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
          Fetched {total} total results · ranked to top {ranked} most relevant
        </p>
      )}
    </div>
  );
}
AnalyticsPanel.propTypes = { meta: PropTypes.object, sources: PropTypes.array, trials: PropTypes.array };

// ── Drug Safety panel ─────────────────────────────────
function DrugSafetyPanel({ sources }) {
  const drugPubs = (sources || []).filter(p =>
    p.title?.toLowerCase().match(/drug|safety|adverse|side effect|toxicity|interaction|pharmacol/)
  );
  if (!drugPubs.length) {
    return (
      <div style={{ padding: '16px 0' }}>
        <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.7 }}>
          No drug safety publications found in current results.<br />
          Try asking: <strong style={{ color: 'var(--blue)' }}>&quot;What are the drug safety concerns and side effects?&quot;</strong>
        </p>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>
        {drugPubs.length} drug safety publication{drugPubs.length > 1 ? 's' : ''} found
      </p>
      {drugPubs.map((p, i) => (
        <div key={i} className="cl-pub-card" style={{ borderLeftColor: 'var(--rose)' }}>
          <div className="cl-pub-card-header">
            <span className="cl-pub-index" style={{ color: 'var(--rose)' }}>SAFETY {i + 1}</span>
            <div className="cl-pub-badges">
              <span className="cl-badge-source" style={{ background: 'var(--rose-dim)', color: 'var(--rose)' }}>{p.source}</span>
              {p.year && <span className="cl-badge-year">{p.year}</span>}
            </div>
          </div>
          <h4 className="cl-pub-title">{p.title}</h4>
          {p.abstract && <p className="cl-abstract-text" style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6 }}>{p.abstract.substring(0, 220)}...</p>}
          {p.url && (
            <div className="cl-pub-card-footer" style={{ marginTop: 10 }}>
              <a href={p.url} target="_blank" rel="noreferrer" className="cl-card-link"
                style={{ borderColor: 'rgba(232,96,122,0.3)', background: 'var(--rose-dim)', color: 'var(--rose)' }}>
                Read Paper ↗
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
DrugSafetyPanel.propTypes = { sources: PropTypes.array };

// ── Publication Card ──────────────────────────────────
function PublicationCard({ pub, index }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="cl-pub-card">
      <div className="cl-pub-card-header">
        <span className="cl-pub-index">[PUB {index + 1}]</span>
        <div className="cl-pub-badges">
          <span className="cl-badge-source">{pub.source || 'Research'}</span>
          {pub.year && <span className="cl-badge-year">{pub.year}</span>}
        </div>
      </div>
      <h4 className="cl-pub-title">{pub.title}</h4>
      {pub.authors?.length > 0 && (
        <p className="cl-pub-authors">
          {pub.authors.slice(0, 3).join(', ')}{pub.authors.length > 3 ? ' et al.' : ''}
          {pub.citationCount ? ` · ${pub.citationCount} citations` : ''}
        </p>
      )}
      {pub.abstract && (
        <div className="cl-pub-abstract">
          <p className="cl-abstract-text">{expanded ? pub.abstract : pub.abstract.substring(0, 160) + '...'}</p>
          <button className="cl-abstract-toggle" onClick={() => setExpanded(p => !p)}>
            {expanded ? 'Show less ↑' : 'Read more ↓'}
          </button>
        </div>
      )}
      <div className="cl-pub-card-footer">
        {pub.url && <a href={pub.url} target="_blank" rel="noreferrer" className="cl-card-link">Read Paper ↗</a>}
      </div>
    </div>
  );
}
PublicationCard.propTypes = { pub: PropTypes.object.isRequired, index: PropTypes.number.isRequired };

// ── Trial Card ────────────────────────────────────────
function TrialCard({ trial, index }) {
  const isRecruiting = trial.status?.toLowerCase() === 'recruiting';
  const isActive = ['recruiting', 'active', 'enrolling'].some(s => trial.status?.toLowerCase().includes(s));
  return (
    <div className={`cl-trial-card ${isActive ? 'cl-trial-active' : ''}`}>
      <div className="cl-trial-card-header">
        <span className="cl-pub-index">[TRIAL {index + 1}]</span>
        <span className={`cl-trial-status ${isRecruiting ? 'recruiting' : 'other'}`}>
          {isActive && <span className="cl-status-dot-animated" />}
          {trial.status || 'Unknown'}
        </span>
      </div>
      <h4 className="cl-trial-title">{trial.title}</h4>
      {trial.summary && <p className="cl-trial-summary">{trial.summary.substring(0, 200)}...</p>}
      <div className="cl-trial-tags">
        {trial.phase && trial.phase !== 'N/A' && <span className="cl-tag cl-tag-phase">{trial.phase}</span>}
        {trial.id && <span className="cl-tag cl-tag-id">{trial.id}</span>}
        {trial.locations?.[0] && trial.locations[0] !== 'Location not specified' && (
          <span className="cl-tag cl-tag-location">📍 {trial.locations[0].split(',')[0]}</span>
        )}
      </div>
      {trial.contact && (
        <p className="cl-trial-contact">Contact: {trial.contact.name || trial.contact.email || 'See trial page'}</p>
      )}
      <div className="cl-pub-card-footer">
        {trial.url && <a href={trial.url} target="_blank" rel="noreferrer" className="cl-card-link cl-trial-link">View Trial ↗</a>}
      </div>
    </div>
  );
}
TrialCard.propTypes = { trial: PropTypes.object.isRequired, index: PropTypes.number.isRequired };

// ── AI Bubble with Tabs ───────────────────────────────
function AIBubble({ msg, onSend, isLast }) {
  const hasSources = msg.sources?.length > 0;
  const hasTrials  = msg.trials?.length > 0;
  const hasMeta    = !!msg.meta;

  const tabs = [{ id: 'response', icon: '💬', label: 'Response' }];
  if (hasMeta || hasSources || hasTrials) tabs.push({ id: 'analytics',    icon: '📊', label: 'Analytics' });
  if (hasSources)                         tabs.push({ id: 'publications', icon: '📄', label: `Publications (${msg.sources.length})` });
  if (hasTrials)                          tabs.push({ id: 'trials',       icon: '🧪', label: `Trials (${msg.trials.length})` });
  if (hasSources)                         tabs.push({ id: 'safety',       icon: '🛡️', label: 'Drug Safety' });

  const [activeTab, setActiveTab] = useState('response');

  return (
    <div className="cl-bubble">
      {tabs.length > 1 && (
        <div className="cl-bubble-tabs">
          {tabs.map(t => (
            <button key={t.id}
              className={`cl-bubble-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}>
              <span className="cl-bubble-tab-icon">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      )}

      <div className="cl-tab-content">
        {activeTab === 'response' && (
          <>
            <RichResponse text={toText(msg.content)} />
            {hasMeta && (
              <div className="cl-stats-bar" style={{ padding: '12px 0 0' }}>
                {msg.meta.totalPubmedFetched > 0 && (
                  <div className="cl-stat-pill cl-stat-pubmed">
                    <span className="cl-stat-num">{msg.meta.totalPubmedFetched}</span> PubMed
                  </div>
                )}
                {msg.meta.totalOpenAlexFetched > 0 && (
                  <div className="cl-stat-pill cl-stat-openalex">
                    <span className="cl-stat-num">{msg.meta.totalOpenAlexFetched}</span> OpenAlex
                  </div>
                )}
                {msg.meta.totalTrialsFetched > 0 && (
                  <div className="cl-stat-pill cl-stat-trials">
                    <span className="cl-stat-num">{msg.meta.totalTrialsFetched}</span> Trials
                  </div>
                )}
              </div>
            )}
          </>
        )}
        {activeTab === 'analytics'    && <AnalyticsPanel meta={msg.meta} sources={msg.sources} trials={msg.trials} />}
        {activeTab === 'publications' && hasSources && (
          <div className="cl-cards-grid">
            {msg.sources.map((p, i) => <PublicationCard key={p.id || i} pub={p} index={i} />)}
          </div>
        )}
        {activeTab === 'trials' && hasTrials && (
          <div className="cl-cards-grid">
            {msg.trials.map((t, i) => <TrialCard key={t.id || i} trial={t} index={i} />)}
          </div>
        )}
        {activeTab === 'safety' && <DrugSafetyPanel sources={msg.sources} />}
      </div>

      {isLast && activeTab === 'response' && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <ExploreSuggestions msg={msg} onSend={onSend} />
        </div>
      )}
    </div>
  );
}
AIBubble.propTypes = {
  msg:    PropTypes.object.isRequired,
  onSend: PropTypes.func.isRequired,
  isLast: PropTypes.bool,
};

// ── Main ChatWindow ───────────────────────────────────
export default function ChatWindow({ messages, loading, onQuickPrompt, patientName, pipeline }) {
  const bottomRef = useRef(null);
  const greeting  = useMemo(() => getGreeting(), []);

  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // also scroll when pipeline updates
  useEffect(() => {
    if (pipeline?.length) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [pipeline]);

  const lastAiIdx = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return i;
    }
    return -1;
  }, [messages]);

  return (
    <div className="cl-chat-area">

      {messages.length === 0 && !loading && (
        <div className="cl-welcome">
          <div className="cl-welcome-ring">
            <svg width="28" height="28" viewBox="0 0 26 26">
              <path d="M13 3C7.5 3 13s4.5 10 10 10 10-4.5 10-10S18.5 3 13 3z"
                stroke="var(--blue)" strokeWidth="1.8" fill="none"/>
              <path d="M13 8v5l3 3" stroke="var(--blue)" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <h2>{greeting}, {patientName || 'Doctor'}</h2>
          <p>Your AI medical research companion. Ask about treatments, clinical trials, or research literature.</p>
          <div className="cl-chips">
            {QUICK_PROMPTS.map(q => (
              <button key={q.query} className="cl-chip" onClick={() => onQuickPrompt(q.query)}>{q.label}</button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg, i) => {
        const isUser   = msg.role === 'user';
        const isLastAi = !isUser && i === lastAiIdx && !loading;
        return (
          <div key={i} className={`cl-msg ${isUser ? 'user' : 'ai'}`}>
            <div className={`cl-avatar ${isUser ? 'user' : 'ai'}`}>
              {isUser ? 'You' : '⚕'}
            </div>
            <div className="cl-bubble-wrap">
              {isUser
                ? <div className="cl-bubble">{toText(msg.content)}</div>
                : <AIBubble msg={msg} onSend={onQuickPrompt} isLast={isLastAi} />
              }
            </div>
          </div>
        );
      })}

      {/* ── Live pipeline (shown while loading) ── */}
      {loading && (
        <div className="cl-msg ai">
          <div className="cl-avatar ai">⚕</div>
          <div className="cl-bubble-wrap">
            <div className="cl-bubble cl-bubble-pipeline">
              {pipeline && pipeline.length > 0
                ? <PipelinePanel steps={pipeline} />
                : (
                  <div className="cl-typing-wrap">
                    <div className="cl-typing"><span /><span /><span /></div>
                  </div>
                )
              }
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

ChatWindow.propTypes = {
  messages:      PropTypes.array.isRequired,
  loading:       PropTypes.bool.isRequired,
  onQuickPrompt: PropTypes.func.isRequired,
  patientName:   PropTypes.string,
  pipeline:      PropTypes.array,
};
ChatWindow.defaultProps = { patientName: 'Doctor', pipeline: [] };