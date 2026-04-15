import { useState } from 'react';

export default function InputBar({ onSend, loading, hasSession }) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim() || loading) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <div style={{
      padding: '16px 20px',
      borderTop: '1px solid #1e2030',
      background: '#0f1117'
    }}>
      <div style={{
        display: 'flex',
        gap: 10,
        background: '#1a1d27',
        border: '1px solid #2a2d3e',
        borderRadius: 14,
        padding: '8px 8px 8px 16px',
        alignItems: 'flex-end'
      }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
          }}
          placeholder={hasSession ? "Follow-up question..." : "Ask about a disease, treatment, or research topic..."}
          rows={1}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#e8e8e8',
            fontSize: 14,
            resize: 'none',
            maxHeight: 120,
            lineHeight: 1.5,
            paddingTop: 4
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || loading}
          style={{
            width: 38, height: 38,
            borderRadius: 10,
            background: text.trim() && !loading ? '#4a6cf7' : '#1e2030',
            border: 'none',
            cursor: text.trim() && !loading ? 'pointer' : 'not-allowed',
            color: '#fff',
            fontSize: 16,
            flexShrink: 0,
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {loading ? '⏳' : '↑'}
        </button>
      </div>
      <p style={{ fontSize: 11, color: '#333', textAlign: 'center', marginTop: 8 }}>
        For research purposes only — consult a healthcare professional for medical advice.
      </p>
    </div>
  );
}