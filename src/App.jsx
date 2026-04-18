import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';
import './App.css';

const API = 'https://curalink-backend-t8ek.onrender.com/api';
const STORAGE_KEY = 'curalink_sessions';
const CONTEXT_KEY = 'curalink_context';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showContext, setShowContext] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [context, setContext] = useState({ name: '', disease: '', location: '' });
  const [sessions, setSessions] = useState([]);
  const [contextSaved, setContextSaved] = useState(false);

  // Load saved context + sessions on mount
  useEffect(() => {
    try {
      const savedCtx = localStorage.getItem(CONTEXT_KEY);
      if (savedCtx) setContext(JSON.parse(savedCtx));
      const savedSess = localStorage.getItem(STORAGE_KEY);
      if (savedSess) setSessions(JSON.parse(savedSess));
    } catch (error) {
      console.warn('Failed to load saved data from localStorage:', error);
    }
  }, []);

  useEffect(() => {
    const handler = e => sendMessage(e.detail);
    window.addEventListener('quickPrompt', handler);
    return () => window.removeEventListener('quickPrompt', handler);
  }, [sessionId, context]);

  const saveSessionToStorage = useCallback((sid, msgs, ctx) => {
    const firstUser = msgs.find(m => m.role === 'user');
    if (!firstUser) return;
    const entry = {
      id: sid,
      title: firstUser.content.substring(0, 65),
      disease: ctx.disease || null,
      timestamp: new Date().toISOString(),
      messages: msgs.map(m => ({
        role: m.role,
        content: m.content,
        sources: m.sources || [],
        trials: m.trials || [],
      })),
    };
    setSessions(prev => {
      const updated = [entry, ...prev.filter(s => s.id !== sid)].slice(0, 15);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    setShowContext(false);

    try {
      const res = await axios.post(`${API}/chat`, {
        sessionId,
        message: text,
        patientName: context.name || null,
        disease: context.disease || null,
        location: context.location || null,
      });
      const sid = sessionId || res.data.sessionId;
      if (!sessionId) setSessionId(sid);
      const assistant = {
        role: 'assistant',
        content: res.data.response,
        sources: res.data.sources,
        trials: res.data.trials,
        meta: res.data.meta,
      };
      setMessages(prev => {
        const updated = [...prev, assistant];
        saveSessionToStorage(sid, updated, context);
        return updated;
      });
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        sources: [], trials: [],
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]); setSessionId(null); setShowContext(true);
  };

  const handleLoadSession = (s) => {
    setMessages(s.messages);
    setSessionId(s.id);
    setShowContext(false);
    setShowSidebar(false);
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

  const handleClearContext = () => {
    localStorage.removeItem(CONTEXT_KEY);
    setContext({ name: '', disease: '', location: '' });
  };

  const formatTime = (iso) => {
    const d = new Date(iso), now = new Date(), diff = now - d;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="cl-app">
      {/* Ambient background */}
      <div className="cl-glass-bg">
        <div className="cl-blob cl-blob-1" />
        <div className="cl-blob cl-blob-2" />
        <div className="cl-blob cl-blob-3" />
      </div>

      {/* Sidebar overlay */}
      {showSidebar && <div className="cl-sidebar-overlay" onClick={() => setShowSidebar(false)} />}

      {/* ── Recent Sessions Sidebar ─────────────────── */}
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
                <button className="cl-session-delete" onClick={(e) => handleDeleteSession(e, s.id)}>✕</button>
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

      {/* ── Header ─────────────────────────────────── */}
      <header className="cl-header">
        <div className="cl-header-left">
          <button className="cl-sidebar-toggle" onClick={() => setShowSidebar(p => !p)} title="Recent chats">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
          <button className="cl-btn-ghost" onClick={() => setShowContext(p => !p)}>
            {showContext ? 'Hide context' : 'Patient context'}
          </button>
          {sessionId && <button className="cl-btn-ghost" onClick={handleNewChat}>New chat</button>}
        </div>
      </header>

      {/* ── Patient Context Panel ───────────────────── */}
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
            <button
              className={`cl-context-save ${contextSaved ? 'saved' : ''}`}
              onClick={handleSaveContext}
            >
              {contextSaved ? '✓ Saved!' : '💾 Save'}
            </button>
            {localStorage.getItem(CONTEXT_KEY) && (
              <button className="cl-context-clear" onClick={handleClearContext}>Clear</button>
            )}
          </div>
        </div>
      )}

      {/* ── Chat Window ─────────────────────────────── */}
      <ChatWindow
        messages={messages}
        loading={loading}
        onQuickPrompt={sendMessage}
        patientName={context.name || null}
      />

      {/* ── Status bar ──────────────────────────────── */}
      <div className="cl-status-bar">
        <span className="cl-status-dot" />
        <span>Connected · Llama3 via Groq · {sessions.length} saved chats</span>
      </div>

      {/* ── Input Bar ───────────────────────────────── */}
      <InputBar onSend={sendMessage} loading={loading} hasSession={!!sessionId} />
    </div>
  );
}

function ContextField({ icon, placeholder, value, onChange }) {
  return (
    <div className="cl-context-field">
      <span className="cl-field-icon">{icon}</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
ContextField.propTypes = {
  icon: PropTypes.node.isRequired, placeholder: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired, onChange: PropTypes.func.isRequired,
};

function RodOfAsclepiusIcon() {
  return (
    <svg viewBox="0 0 100 100" width="20" height="20">
      <rect x="47" y="10" width="6" height="80" rx="3" fill="white" />
      <path d="M50 20 C70 25, 70 40, 50 45 C30 50, 30 65, 50 70"
        fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="20" r="3" fill="white" />
    </svg>
  );
}
function PersonIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2 13c0-3 2-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>;
}
function MicroscopeIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>;
}
function PinIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 3.5 4.5 8.5 4.5 8.5S12.5 9.5 12.5 6C12.5 3.5 10.5 1.5 8 1.5z" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3" />
  </svg>;
}