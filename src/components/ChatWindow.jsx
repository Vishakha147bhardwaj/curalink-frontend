import React, { useEffect, useRef, useState, useMemo } from 'react';
import PropTypes from 'prop-types';

const QUICK_PROMPTS = [
  'Summarize treatment options for this condition',
  'Find nearby clinical trials',
  'Check drug interactions',
  'Latest NCCN guidelines',
];

const HEALTHCARE_FACTS = [
  {
    title: "Your Heart Never Rests",
    text: "The human heart beats around 100,000 times per day, pumping nearly 7,500 liters of blood.",
    image: "https://images.unsplash.com/photo-1584515933487-779824d29309"
  },
  {
    title: "Power of Vaccination",
    text: "Vaccines prevent between 3 to 5 million deaths globally every year.",
    image: "https://images.unsplash.com/photo-1580281657527-47e5c6f5c91c"
  },
  {
    title: "Sleep is Medicine",
    text: "Sleep helps your body repair tissues, boost immunity, and consolidate memory.",
    image: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78"
  },
  {
    title: "Hydration Matters",
    text: "Even mild dehydration affects mood, focus, and energy levels.",
    image: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc"
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getNextFact(currentTitle) {
  const others = HEALTHCARE_FACTS.filter(f => f.title !== currentTitle);
  return others[Math.floor(Math.random() * others.length)];
}

function toText(val) {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return val.title || val.url || val.nctId || '';
  }
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

// Inline publications list — no images, clean text layout
function PublicationsList({ sources }) {
  if (!sources?.length) return null;
  return (
    <div className="cl-inline-section">
      <p className="cl-inline-section-label">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ marginRight: 5, verticalAlign: 'middle' }}>
          <rect x="1" y="1" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M3.5 4.5h6M3.5 6.5h6M3.5 8.5h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
        Publications
      </p>
      <div className="cl-inline-list">
        {sources.map((pub, j) => (
          <a
            key={pub.id || j}
            href={pub.url}
            target="_blank"
            rel="noreferrer"
            className="cl-inline-item cl-inline-pub"
          >
            <div className="cl-inline-item-top">
              <span className="cl-inline-badge cl-badge-pub">
                {pub.source}{pub.year ? ` · ${pub.year}` : ''}
              </span>
              <span className="cl-arrow">↗</span>
            </div>
            <p className="cl-inline-title">{pub.title}</p>
            {pub.authors?.length > 0 && (
              <p className="cl-inline-meta">
                {pub.authors.slice(0, 2).join(', ')}
                {pub.authors.length > 2 ? ' et al.' : ''}
                {pub.citationCount ? ` · ${pub.citationCount} citations` : ''}
              </p>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

PublicationsList.propTypes = {
  sources: PropTypes.array,
};

// Inline trials list — tag-style metadata, no images
function TrialsList({ trials }) {
  if (!trials?.length) return null;
  return (
    <div className="cl-inline-section">
      <p className="cl-inline-section-label">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ marginRight: 5, verticalAlign: 'middle' }}>
          <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M6.5 3.5v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        Clinical Trials
      </p>
      <div className="cl-inline-list">
        {trials.map((trial, j) => {
          const isRecruiting = trial.status?.toLowerCase() === 'recruiting';
          return (
            <a
              key={trial.id || j}
              href={trial.url}
              target="_blank"
              rel="noreferrer"
              className="cl-inline-item cl-inline-trial"
            >
              <div className="cl-inline-item-top">
                <span className={`cl-inline-badge ${isRecruiting ? 'cl-badge-recruiting' : 'cl-badge-completed'}`}>
                  {trial.status}
                </span>
                <span className="cl-arrow">↗</span>
              </div>
              <p className="cl-inline-title">{trial.title}</p>
              {trial.summary && (
                <p className="cl-inline-meta">{trial.summary}</p>
              )}
              <div className="cl-inline-tags">
                {trial.phase && trial.phase !== 'N/A' && (
                  <span className="cl-tag">{trial.phase}</span>
                )}
                {trial.id && (
                  <span className="cl-tag">{trial.id}</span>
                )}
                {trial.locations?.[0] && trial.locations[0] !== 'Location not specified' && (
                  <span className="cl-tag">{trial.locations[0].split(',')[0]}</span>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

TrialsList.propTypes = {
  trials: PropTypes.array,
};

export default function ChatWindow({ messages, loading, onQuickPrompt, patientName }) {
  const bottomRef = useRef(null);
  const [fact, setFact] = useState(HEALTHCARE_FACTS[0]);

  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setFact(prev => getNextFact(prev.title));
    }, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  const greeting = useMemo(() => getGreeting(), []);
  const displayName = patientName || 'Doctor';

  return (
    <div className="cl-chat-area">
      {messages.length === 0 && !loading && (
        <div className="cl-welcome">
          <div className="cl-welcome-ring">
            <svg width="26" height="26" viewBox="0 0 26 26">
              <path d="M13 3C7.5 3 3 7.5 3 13s4.5 10 10 10 10-4.5 10-10S18.5 3 13 3z"
                stroke="#1a6fa8" strokeWidth="1.8" fill="none" />
              <path d="M13 8v5l3 3"
                stroke="#1a6fa8" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            </svg>
          </div>

          <h2>{greeting}, {displayName}</h2>
          <p>Ask about treatments, clinical trials, drug interactions, or research literature.</p>

          <div className="cl-chips">
            {QUICK_PROMPTS.map(q => (
              <button key={q} className="cl-chip" onClick={() => onQuickPrompt(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg, i) => {
        const isUser = msg.role === 'user';
        const text = toText(msg.content);
        const hasSources = !isUser && msg.sources?.length > 0;
        const hasTrials = !isUser && msg.trials?.length > 0;

        return (
          <div key={i} className={`cl-msg ${isUser ? 'user' : 'ai'}`}>
            <div className={`cl-avatar ${isUser ? 'user' : 'ai'}`}>
              {isUser ? 'DR' : '⚕'}
            </div>

            <div className="cl-bubble-wrap">
              {/* Single unified bubble containing text + publications + trials */}
              <div className={`cl-bubble ${hasSources || hasTrials ? 'cl-bubble-with-refs' : ''}`}>
                <div className="cl-bubble-text">
                  {isUser ? text : renderMarkdown(text)}
                </div>

                {(hasSources || hasTrials) && (
                  <div className="cl-refs-block">
                    <PublicationsList sources={msg.sources} />
                    <TrialsList trials={msg.trials} />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {loading && (
        <div className="cl-msg ai">
          <div className="cl-avatar ai">⚕</div>
          <div className="cl-bubble cl-loading-bubble">
            <div className="cl-typing">
              <span /><span /><span />
            </div>
            {fact && (
              <div className="cl-fact-inline">
                <img src={fact.image} alt="" />
                <div>
                  <h4>💡 {fact.title}</h4>
                  <p>{fact.text}</p>
                </div>
              </div>
            )}
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

ChatWindow.defaultProps = {
  patientName: 'Doctor',
};