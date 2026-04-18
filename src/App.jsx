import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';
import './App.css';

const API = 'http://localhost:5000/api';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showContext, setShowContext] = useState(true);
  const [context, setContext] = useState({ name: '', disease: '', location: '' });

  useEffect(() => {
    const handler = e => sendMessage(e.detail);
    window.addEventListener('quickPrompt', handler);
    return () => window.removeEventListener('quickPrompt', handler);
  }, [sessionId, context]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
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

      if (!sessionId) setSessionId(res.data.sessionId);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.response,
        sources: res.data.sources,
        trials: res.data.trials,
        meta: res.data.meta,
      }]);
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please check that the backend server and Ollama are running.',
        sources: [],
        trials: [],
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setContext({ name: '', disease: '', location: '' });
    setShowContext(true);
  };

  return (
    <div className="cl-app">
<div className="cl-center-bg">
  <div className="cl-glow-symbol">
    <svg viewBox="0 0 100 100">
      {/* Staff */}
      <rect x="47" y="10" width="6" height="80" rx="3" />

      {/* Snake curve */}
      <path
        d="M50 20 
           C65 25, 65 35, 50 40 
           C35 45, 35 55, 50 60 
           C65 65, 65 75, 50 80"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Snake head */}
      <circle cx="50" cy="20" r="3" />
    </svg>
  </div>
</div>
<div className="cl-glass-bg">
  <div className="cl-blob cl-blob-1"></div>
  <div className="cl-blob cl-blob-2"></div>
  <div className="cl-blob cl-blob-3"></div>
</div>
      {/* ── Header ─────────────────────────────────────── */}
      <header className="cl-header">
        <div className="cl-logo">
          <div className="cl-logo-icon">
            <RodOfAsclepiusIcon/>
          </div>
          <div className="cl-logo-text">
            <span className="cl-logo-name">Curalink</span>
            <span className="cl-logo-sub">AI Medical Research</span>
          </div>
        </div>

        <div className="cl-header-right">
          {context.disease && (
            <div className="cl-pill">
              <span className="cl-pill-dot" />
              {context.disease}
            </div>
          )}
          <button
            className="cl-btn-ghost"
            onClick={() => setShowContext(p => !p)}
          >
            {showContext ? 'Hide context' : 'Patient context'}
          </button>
          {sessionId && (
            <button className="cl-btn-ghost" onClick={handleNewChat}>
              New chat
            </button>
          )}
        </div>
      </header>

      {/* ── Patient Context Panel ───────────────────────── */}
      {showContext && (
        <div className="cl-context-panel">
          <span className="cl-context-label">Patient</span>

          <ContextField
            icon={<PersonIcon />}
            placeholder="Patient name"
            value={context.name}
            onChange={v => setContext(p => ({ ...p, name: v }))}
          />
          <ContextField
            icon={<MicroscopeIcon />}
            placeholder="Disease / condition"
            value={context.disease}
            onChange={v => setContext(p => ({ ...p, disease: v }))}
          />
          <ContextField
            icon={<PinIcon />}
            placeholder="Location (for trials)"
            value={context.location}
            onChange={v => setContext(p => ({ ...p, location: v }))}
          />
        </div>
      )}

      {/* ── Chat ───────────────────────────────────────── */}
   <ChatWindow
  messages={messages}
  loading={loading}
  onQuickPrompt={sendMessage}
  patientName={context.name || null}
/>

      {/* ── Status bar ─────────────────────────────────── */}
      <div className="cl-status-bar">
        <span className="cl-status-dot" />
        <span>Connected · Model up to date</span>
      </div>

      {/* ── Input ──────────────────────────────────────── */}
      <InputBar onSend={sendMessage} loading={loading} hasSession={!!sessionId} />
    </div>
  );
}

/* ── Small helper components ──────────────────────────── */

function ContextField({ icon, placeholder, value, onChange }) {
  return (
    <div className="cl-context-field">
      <span className="cl-field-icon">{icon}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
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
      {/* Staff */}
      <rect
        x="47"
        y="10"
        width="6"
        height="80"
        rx="3"
        fill="white"
      />

      {/* Snake */}
      <path
        d="M50 20 
           C70 25, 70 40, 50 45 
           C30 50, 30 65, 50 70"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Head */}
      <circle cx="50" cy="20" r="3" fill="white" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 13c0-3 2-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MicroscopeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 3.5 4.5 8.5 4.5 8.5S12.5 9.5 12.5 6C12.5 3.5 10.5 1.5 8 1.5z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}