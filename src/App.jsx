import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';
import './App.css';

const API = 'https://curalink-backend-t8ek.onrender.com/api';
const STORAGE_KEY = 'curalink_sessions';
const CONTEXT_KEY = 'curalink_context';
const THEME_KEY   = 'curalink_theme';

export default function App() {
  const [messages, setMessages]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [sessionId, setSessionId]       = useState(null);
  const [showContext, setShowContext]    = useState(true);
  const [showSidebar, setShowSidebar]   = useState(false);
  const [context, setContext]           = useState({ name: '', disease: '', location: '' });
  const [sessions, setSessions]         = useState([]);
  const [contextSaved, setContextSaved] = useState(false);
  const [theme, setTheme]               = useState('dark');
  const [pipeline, setPipeline]         = useState([]);   // ← live pipeline steps

  /* ── Restore persisted data ── */
  useEffect(() => {
    try {
      const c = localStorage.getItem(CONTEXT_KEY);
      if (c) setContext(JSON.parse(c));
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) setSessions(JSON.parse(s));
      const t = localStorage.getItem(THEME_KEY);
      if (t) setTheme(t);
    } catch { /* ignore */ }
  }, []);

  /* ── Apply theme to <html> ── */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  /* ── Quick prompt listener ── */
  useEffect(() => {
    const handler = e => sendMessage(e.detail);
    window.addEventListener('quickPrompt', handler);
    return () => window.removeEventListener('quickPrompt', handler);
  }, [sessionId, context]);

  /* ── Save session ── */
  const saveSession = useCallback((sid, msgs, ctx) => {
    const first = msgs.find(m => m.role === 'user');
    if (!first) return;
    const entry = {
      id: sid,
      title: first.content.substring(0, 65),
      disease: ctx.disease || null,
      timestamp: new Date().toISOString(),
      messages: msgs.map(m => ({
        role: m.role, content: m.content,
        sources: m.sources || [], trials: m.trials || [], meta: m.meta || null,
      })),
    };
    setSessions(prev => {
      const updated = [entry, ...prev.filter(s => s.id !== sid)].slice(0, 15);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  /* ── Send message with SSE streaming ── */
  const sendMessage = async (text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    setShowContext(false);
    setPipeline([]);   // reset pipeline

    try {
      // ── Try SSE streaming endpoint first ──
      // If your backend supports SSE at /api/chat/stream, use that.
      // Otherwise it falls back to the regular POST below.
      const supportsStream = true; // set false if backend doesn't support SSE yet

      if (supportsStream) {
        await streamMessage(text);
      } else {
        await regularMessage(text);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        sources: [], trials: [],
      }]);
    } finally {
      setLoading(false);
      // keep pipeline visible briefly then clear
      setTimeout(() => setPipeline([]), 2500);
    }
  };

  /* ── SSE streaming path ── */
  const streamMessage = async (text) => {
    const res = await fetch(`${API}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        message: text,
        patientName: context.name || null,
        disease: context.disease || null,
        location: context.location || null,
      }),
    });

    if (!res.ok) {
      // backend doesn't have SSE endpoint yet → fall back
      await regularMessage(text);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalData = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE lines: "data: {...}\n\n"
      const lines = buffer.split('\n\n');
      buffer = lines.pop(); // keep incomplete chunk

      for (const chunk of lines) {
        const line = chunk.replace(/^data:\s*/, '').trim();
        if (!line || line === '[DONE]') continue;
        try {
          const evt = JSON.parse(line);

          if (evt.type === 'pipeline') {
            // e.g. { type: 'pipeline', step: 'pubmed', label: 'Fetching PubMed...', status: 'running' | 'done' | 'error', count: 12 }
            setPipeline(prev => {
              const exists = prev.findIndex(p => p.step === evt.step);
              if (exists >= 0) {
                const updated = [...prev];
                updated[exists] = evt;
                return updated;
              }
              return [...prev, evt];
            });
          } else if (evt.type === 'done') {
            finalData = evt;
          }
        } catch { /* skip malformed */ }
      }
    }

    if (finalData) {
      const sid = sessionId || finalData.sessionId;
      if (!sessionId && sid) setSessionId(sid);
      const assistant = {
        role: 'assistant',
        content: finalData.response,
        sources: finalData.sources,
        trials: finalData.trials,
        meta: finalData.meta,
      };
      setMessages(prev => {
        const updated = [...prev, assistant];
        if (sid) saveSession(sid, updated, context);
        return updated;
      });
    }
  };

  /* ── Regular (non-SSE) fallback ── */
  const regularMessage = async (text) => {
    // Simulate pipeline steps visually while waiting
    const FAKE_STEPS = [
      { step: 'parse',    label: 'Parsing query',           icon: '🔍' },
      { step: 'pubmed',   label: 'Fetching PubMed',         icon: '📚' },
      { step: 'openalex', label: 'Fetching OpenAlex',       icon: '🔬' },
      { step: 'trials',   label: 'Searching clinical trials',icon: '🧪' },
      { step: 'rank',     label: 'Ranking & summarizing',   icon: '🧠' },
      { step: 'generate', label: 'Generating response',     icon: '✨' },
    ];

    // animate steps with staggered delays
    FAKE_STEPS.forEach((s, i) => {
      setTimeout(() => {
        setPipeline(prev => [...prev, { ...s, status: 'running' }]);
      }, i * 600);
    });

    const res = await fetch(`${API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        message: text,
        patientName: context.name || null,
        disease: context.disease || null,
        location: context.location || null,
      }),
    });
    const data = await res.json();

    // mark all as done
    setPipeline(FAKE_STEPS.map(s => ({ ...s, status: 'done' })));

    const sid = sessionId || data.sessionId;
    if (!sessionId && sid) setSessionId(sid);
    const assistant = {
      role: 'assistant',
      content: data.response,
      sources: data.sources,
      trials: data.trials,
      meta: data.meta,
    };
    setMessages(prev => {
      const updated = [...prev, assistant];
      if (sid) saveSession(sid, updated, context);
      return updated;
    });
  };

  const handleNewChat       = () => { setMessages([]); setSessionId(null); setShowContext(true); setPipeline([]); };
  const handleLoadSession   = (s) => {
    setMessages(s.messages); setSessionId(s.id);
    setShowContext(false); setShowSidebar(false);
    if (s.disease) setContext(p => ({ ...p, disease: s.disease }));
  };
  const handleDeleteSession = (e, sid) => {
    e.stopPropagation();
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== sid);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };
  const handleSaveContext = () => {
    localStorage.setItem(CONTEXT_KEY, JSON.stringify(context));
    setContextSaved(true);
    setTimeout(() => setContextSaved(false), 2000);
  };

  const formatTime = (iso) => {
    const d = new Date(iso), diff = Date.now() - d;
    if (diff < 60000)    return 'just now';
    if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="cl-app" data-theme={theme}>
      <div className="cl-glass-bg" />

      {showSidebar && <div className="cl-sidebar-overlay" onClick={() => setShowSidebar(false)} />}

      {/* ── Sidebar ── */}
      <aside className={`cl-sidebar ${showSidebar ? 'cl-sidebar-open' : ''}`}>
        <div className="cl-sidebar-header">
          <h3>Recent Chats</h3>
          <button className="cl-sidebar-close" onClick={() => setShowSidebar(false)}>✕</button>
        </div>
        <div className="cl-sidebar-list">
          {sessions.length === 0 && (
            <p className="cl-sidebar-empty">No recent chats yet.<br />Start a conversation!</p>
          )}
          {sessions.map(s => (
            <div
              key={s.id}
              className={`cl-session-card ${s.id === sessionId ? 'active' : ''}`}
              onClick={() => handleLoadSession(s)}
            >
              <div className="cl-session-card-top">
                <span className="cl-session-time">{formatTime(s.timestamp)}</span>
                <button className="cl-session-delete" onClick={e => handleDeleteSession(e, s.id)}>✕</button>
              </div>
              <p className="cl-session-title">{s.title}</p>
              {s.disease && <span className="cl-session-tag">{s.disease}</span>}
            </div>
          ))}
        </div>
        <div className="cl-sidebar-footer">
          <button className="cl-sidebar-new" onClick={() => { handleNewChat(); setShowSidebar(false); }}>
            + New Chat
          </button>
        </div>
      </aside>

      {/* ── Header ── */}
      <header className="cl-header">
        <div className="cl-header-left">
          <button className="cl-sidebar-toggle" onClick={() => setShowSidebar(p => !p)}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            {sessions.length > 0 && <span className="cl-sidebar-badge">{sessions.length}</span>}
          </button>
          <div className="cl-logo">
            <div className="cl-logo-icon"><RodOfAsclepiusIcon /></div>
            <div className="cl-logo-text">
              <span className="cl-logo-name">Curalink</span>
              <span className="cl-logo-sub">AI Medical Research</span>
            </div>
          </div>
        </div>

        <div className="cl-header-right">
          {context.disease && (
            <div className="cl-pill"><span className="cl-pill-dot" />{context.disease}</div>
          )}
          <button className="cl-theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="cl-btn-ghost" onClick={() => setShowContext(p => !p)}>
            {showContext ? 'Hide context' : 'Patient context'}
          </button>
          {sessionId && <button className="cl-btn-ghost" onClick={handleNewChat}>New chat</button>}
        </div>
      </header>

      {/* ── Context panel ── */}
      {showContext && (
        <div className="cl-context-panel">
          <span className="cl-context-label">Patient</span>
          <ContextField icon={<PersonIcon />} placeholder="Patient name"
            value={context.name} onChange={v => setContext(p => ({ ...p, name: v }))} />
          <ContextField icon={<MicroscopeIcon />} placeholder="Disease / condition"
            value={context.disease} onChange={v => setContext(p => ({ ...p, disease: v }))} />
          <ContextField icon={<PinIcon />} placeholder="Location (for trials)"
            value={context.location} onChange={v => setContext(p => ({ ...p, location: v }))} />
          <div className="cl-context-actions">
            <button className={`cl-context-save ${contextSaved ? 'saved' : ''}`} onClick={handleSaveContext}>
              {contextSaved ? '✓ Saved!' : '💾 Save'}
            </button>
            {localStorage.getItem(CONTEXT_KEY) && (
              <button className="cl-context-clear" onClick={() => {
                localStorage.removeItem(CONTEXT_KEY);
                setContext({ name: '', disease: '', location: '' });
              }}>Clear</button>
            )}
          </div>
        </div>
      )}

      {/* ── Chat ── */}
      <ChatWindow
        messages={messages}
        loading={loading}
        onQuickPrompt={sendMessage}
        patientName={context.name || null}
        pipeline={pipeline}
      />

      {/* ── Status ── */}
      <div className="cl-status-bar">
        <span className="cl-status-dot" />
        <span>Connected · Llama3 via Groq · {sessions.length} saved chats</span>
      </div>

      {/* ── Input ── */}
      <InputBar onSend={sendMessage} loading={loading} hasSession={!!sessionId} />
    </div>
  );
}

/* ── Helper components ── */
function ContextField({ icon, placeholder, value, onChange }) {
  return (
    <div className="cl-context-field">
      <span className="cl-field-icon">{icon}</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
ContextField.propTypes = {
  icon: PropTypes.node.isRequired,
  placeholder: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

function RodOfAsclepiusIcon() {
  return (
    <svg viewBox="0 0 100 100" width="20" height="20">
      <rect x="47" y="10" width="6" height="80" rx="3" fill="white"/>
      <path d="M50 20 C70 25, 70 40, 50 45 C30 50, 30 65, 50 70"
        fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="50" cy="20" r="3" fill="white"/>
    </svg>
  );
}
function PersonIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2 13c0-3 2-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>;
}
function MicroscopeIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>;
}
function PinIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 3.5 4.5 8.5 4.5 8.5S12.5 9.5 12.5 6C12.5 3.5 10.5 1.5 8 1.5z" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
  </svg>;
}