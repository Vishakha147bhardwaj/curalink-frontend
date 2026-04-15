import { useState, useEffect } from 'react';
import axios from 'axios';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';

const API = 'http://localhost:5000/api';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showContext, setShowContext] = useState(true);
  const [context, setContext] = useState({ name: '', disease: '', location: '' });

  // Handle quick prompt chips
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
        patientName: context.name || undefined,
        disease: context.disease || undefined,
        location: context.location || undefined
      });

      if (!sessionId) setSessionId(res.data.sessionId);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.response,
        sources: res.data.sources,
        trials: res.data.trials,
        meta: res.data.meta
      }]);
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please check that the backend server and Ollama are running.',
        sources: [],
        trials: []
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', background: '#0f1117' }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid #1e2030',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#0d0f18'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>⚕️</span>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Curalink</h1>
            <p style={{ fontSize: 11, color: '#555', margin: 0 }}>AI Medical Research Assistant</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {context.disease && (
            <span style={{
              background: '#1a1d27', border: '1px solid #2a2d3e',
              borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#888'
            }}>
              🔬 {context.disease}
            </span>
          )}
          <button
            onClick={() => setShowContext(p => !p)}
            style={{
              background: '#1a1d27', border: '1px solid #2a2d3e',
              borderRadius: 8, padding: '6px 12px', color: '#888',
              cursor: 'pointer', fontSize: 12
            }}
          >
            {showContext ? 'Hide' : 'Patient Context'}
          </button>
          {sessionId && (
            <button
              onClick={() => { setMessages([]); setSessionId(null); setContext({ name: '', disease: '', location: '' }); setShowContext(true); }}
              style={{
                background: 'transparent', border: '1px solid #2a2d3e',
                borderRadius: 8, padding: '6px 12px', color: '#666',
                cursor: 'pointer', fontSize: 12
              }}
            >
              New Chat
            </button>
          )}
        </div>
      </div>

      {/* Context Panel */}
      {showContext && (
        <div style={{
          padding: '16px 20px',
          background: '#12141f',
          borderBottom: '1px solid #1e2030',
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: 12, color: '#666', flexShrink: 0 }}>Patient Context (optional):</span>
          {[
            { key: 'name', placeholder: 'Patient name', icon: '👤' },
            { key: 'disease', placeholder: 'Disease / condition', icon: '🔬' },
            { key: 'location', placeholder: 'Location (for trials)', icon: '📍' }
          ].map(({ key, placeholder, icon }) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#1a1d27', border: '1px solid #2a2d3e',
              borderRadius: 8, padding: '6px 12px'
            }}>
              <span style={{ fontSize: 13 }}>{icon}</span>
              <input
                value={context[key]}
                onChange={e => setContext(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  color: '#ddd', fontSize: 13, width: 160
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Chat area */}
      <ChatWindow messages={messages} loading={loading} />

      {/* Input */}
      <InputBar onSend={sendMessage} loading={loading} hasSession={!!sessionId} />
    </div>
  );
}