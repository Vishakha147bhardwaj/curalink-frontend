import React, { useEffect, useRef, useState, useMemo } from 'react';
import PropTypes from 'prop-types';

const QUICK_PROMPTS = [
  { label: '💊 Treatment options', query: 'Summarize treatment options for this condition' },
  { label: '🧪 Clinical trials', query: 'Find nearby clinical trials' },
  { label: '⚠️ Drug interactions', query: 'Check drug interactions' },
  { label: '📋 NCCN guidelines', query: 'Latest NCCN guidelines' },
];

// Quick action tabs shown after AI response
const QUICK_ACTIONS = [
  { label: '🔬 Drug Safety', query: 'What are the drug safety concerns and side effects?' },
  { label: '📊 Analytics', query: 'Give me analytics and statistics on this condition' },
  { label: '🧬 More Trials', query: 'Find more clinical trials for this condition' },
  { label: '🥗 Lifestyle', query: 'What lifestyle changes help with this condition?' },
  { label: '👨‍⚕️ Specialists', query: 'What type of specialists should I consult?' },
];

const HEALTHCARE_FACTS = [
  { title: "Your Heart Never Rests", text: "The human heart beats ~100,000 times per day, pumping 7,500 liters of blood." },
  { title: "Power of Vaccination", text: "Vaccines prevent 3–5 million deaths globally every year." },
  { title: "Sleep is Medicine", text: "Sleep repairs tissues, boosts immunity, and consolidates memory." },
  { title: "Hydration Matters", text: "Even mild dehydration affects mood, focus, and energy levels." },
  { title: "Exercise is Therapy", text: "30 minutes of moderate exercise daily reduces risk of heart disease by 35%." },
];

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

function renderMarkdown(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    return <span key={i}>{parts}<br /></span>;
  });
}

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
          {pub.authors.slice(0, 3).join(', ')}
          {pub.authors.length > 3 ? ' et al.' : ''}
          {pub.citationCount ? ` · ${pub.citationCount} citations` : ''}
        </p>
      )}
      {pub.abstract && (
        <div className="cl-pub-abstract">
          <p className={`cl-abstract-text ${expanded ? 'expanded' : ''}`}>
            {expanded ? pub.abstract : pub.abstract.substring(0, 160) + '...'}
          </p>
          <button className="cl-abstract-toggle" onClick={() => setExpanded(p => !p)}>
            {expanded ? 'Show less ↑' : 'Read more ↓'}
          </button>
        </div>
      )}
      <div className="cl-pub-card-footer">
        {pub.url && (
          <a href={pub.url} target="_blank" rel="noreferrer" className="cl-card-link">
            Read Paper ↗
          </a>
        )}
      </div>
    </div>
  );
}
PublicationCard.propTypes = { pub: PropTypes.object.isRequired, index: PropTypes.number.isRequired };

// ── Trial Card ────────────────────────────────────────
function TrialCard({ trial, index }) {
  const isRecruiting = trial.status?.toLowerCase() === 'recruiting';
  const isActive = ['recruiting', 'active', 'enrolling'].some(s =>
    trial.status?.toLowerCase().includes(s)
  );
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
      {trial.summary && (
        <p className="cl-trial-summary">{trial.summary.substring(0, 180)}...</p>
      )}
      <div className="cl-trial-tags">
        {trial.phase && trial.phase !== 'N/A' && (
          <span className="cl-tag cl-tag-phase">{trial.phase}</span>
        )}
        {trial.id && <span className="cl-tag cl-tag-id">{trial.id}</span>}
        {trial.locations?.[0] && trial.locations[0] !== 'Location not specified' && (
          <span className="cl-tag cl-tag-location">
            📍 {trial.locations[0].split(',')[0]}
          </span>
        )}
      </div>
      {trial.contact && (
        <p className="cl-trial-contact">
          Contact: {trial.contact.name || trial.contact.email || 'See trial page'}
        </p>
      )}
      <div className="cl-pub-card-footer">
        {trial.url && (
          <a href={trial.url} target="_blank" rel="noreferrer" className="cl-card-link cl-trial-link">
            View Trial ↗
          </a>
        )}
      </div>
    </div>
  );
}
TrialCard.propTypes = { trial: PropTypes.object.isRequired, index: PropTypes.number.isRequired };

// ── Publications Section ──────────────────────────────
function PublicationsSection({ sources }) {
  const [open, setOpen] = useState(true);
  if (!sources?.length) return null;
  return (
    <div className="cl-refs-section">
      <button className="cl-refs-toggle" onClick={() => setOpen(p => !p)}>
        <span>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ marginRight: 6, verticalAlign: 'middle' }}>
            <rect x="1" y="1" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" />
            <path d="M3.5 4.5h6M3.5 6.5h6M3.5 8.5h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          Publications <span className="cl-refs-count">{sources.length}</span>
        </span>
        <span className="cl-refs-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="cl-cards-grid">
          {sources.map((pub, i) => <PublicationCard key={pub.id || i} pub={pub} index={i} />)}
        </div>
      )}
    </div>
  );
}
PublicationsSection.propTypes = { sources: PropTypes.array };

// ── Trials Section ────────────────────────────────────
function TrialsSection({ trials }) {
  const [open, setOpen] = useState(true);
  if (!trials?.length) return null;
  return (
    <div className="cl-refs-section">
      <button className="cl-refs-toggle" onClick={() => setOpen(p => !p)}>
        <span>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ marginRight: 6, verticalAlign: 'middle' }}>
            <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6.5 3.5v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Clinical Trials <span className="cl-refs-count">{trials.length}</span>
        </span>
        <span className="cl-refs-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="cl-cards-grid">
          {trials.map((t, i) => <TrialCard key={t.id || i} trial={t} index={i} />)}
        </div>
      )}
    </div>
  );
}
TrialsSection.propTypes = { trials: PropTypes.array };

// ── Quick Action Tabs (shown after AI response) ───────
function QuickActionTabs({ onAction }) {
  return (
    <div className="cl-quick-actions">
      <p className="cl-quick-actions-label">Explore further:</p>
      <div className="cl-quick-actions-row">
        {QUICK_ACTIONS.map(a => (
          <button key={a.label} className="cl-action-tab" onClick={() => onAction(a.query)}>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
QuickActionTabs.propTypes = { onAction: PropTypes.func.isRequired };

// ── Main ChatWindow ───────────────────────────────────
export default function ChatWindow({ messages, loading, onQuickPrompt, patientName }) {
  const bottomRef = useRef(null);
  const [factIndex, setFactIndex] = useState(0);
  const greeting = useMemo(() => getGreeting(), []);

  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setFactIndex(p => (p + 1) % HEALTHCARE_FACTS.length), 3000);
    return () => clearInterval(t);
  }, [loading]);

  const displayName = patientName || 'Doctor';
  const fact = HEALTHCARE_FACTS[factIndex];

  return (
    <div className="cl-chat-area">

      {/* Welcome state */}
      {messages.length === 0 && !loading && (
        <div className="cl-welcome">
          <div className="cl-welcome-ring">
            <svg width="26" height="26" viewBox="0 0 26 26">
              <path d="M13 3C7.5 3 3 7.5 3 13s4.5 10 10 10 10-4.5 10-10S18.5 3 13 3z"
                stroke="#1a6fa8" strokeWidth="1.8" fill="none" />
              <path d="M13 8v5l3 3" stroke="#1a6fa8" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <h2>{greeting}, {displayName}</h2>
          <p>Ask about treatments, clinical trials, drug interactions, or research literature.</p>
          <div className="cl-chips">
            {QUICK_PROMPTS.map(q => (
              <button key={q.query} className="cl-chip" onClick={() => onQuickPrompt(q.query)}>
                {q.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.map((msg, i) => {
        const isUser = msg.role === 'user';
        const isLastAI = !isUser && i === messages.length - 1;
        const hasSources = !isUser && msg.sources?.length > 0;
        const hasTrials = !isUser && msg.trials?.length > 0;

        return (
          <div key={i} className={`cl-msg ${isUser ? 'user' : 'ai'}`}>
            <div className={`cl-avatar ${isUser ? 'user' : 'ai'}`}>
              {isUser ? 'DR' : '⚕'}
            </div>
            <div className="cl-bubble-wrap">
              <div className={`cl-bubble ${hasSources || hasTrials ? 'cl-bubble-with-refs' : ''}`}>
                <div className="cl-bubble-text">
                  {isUser ? toText(msg.content) : renderMarkdown(toText(msg.content))}
                </div>

                {/* Publications + Trials as graceful cards */}
                {(hasSources || hasTrials) && (
                  <div className="cl-refs-block">
                    <PublicationsSection sources={msg.sources} />
                    <TrialsSection trials={msg.trials} />
                  </div>
                )}
              </div>

              {/* Quick action tabs after last AI message */}
              {isLastAI && !loading && (
                <QuickActionTabs onAction={onQuickPrompt} />
              )}
            </div>
          </div>
        );
      })}

      {/* Loading state with fun facts */}
      {loading && (
        <div className="cl-msg ai">
          <div className="cl-avatar ai">⚕</div>
          <div className="cl-bubble cl-loading-bubble">
            <div className="cl-typing"><span /><span /><span /></div>
            <div className="cl-fact-inline">
              <div className="cl-fact-icon">💡</div>
              <div>
                <h4>{fact.title}</h4>
                <p>{fact.text}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

ChatWindow.propTypes = {
  messages: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  onQuickPrompt: PropTypes.func.isRequired,
  patientName: PropTypes.string,
};
ChatWindow.defaultProps = { patientName: 'Doctor' };