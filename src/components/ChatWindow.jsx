import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ messages, loading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '24px 20px',
      maxWidth: 900,
      width: '100%',
      margin: '0 auto'
    }}>
      {messages.length === 0 && (
        <div style={{ textAlign: 'center', paddingTop: 80, color: '#444' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚕️</div>
          <h2 style={{ color: '#666', fontWeight: 400, marginBottom: 8 }}>Curalink Research Assistant</h2>
          <p style={{ fontSize: 14, color: '#444', maxWidth: 400, margin: '0 auto' }}>
            Ask about diseases, treatments, or clinical trials. I'll search PubMed, OpenAlex, and ClinicalTrials.gov for you.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}>
            {['Latest treatment for lung cancer', 'Clinical trials for diabetes', 'Alzheimer\'s disease research'].map(q => (
              <button key={q} style={{
                background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 20,
                padding: '8px 14px', color: '#888', fontSize: 12, cursor: 'pointer'
              }}
                onClick={() => window.dispatchEvent(new CustomEvent('quickPrompt', { detail: q }))}
              >{q}</button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg, i) => (
        <MessageBubble key={i} message={msg} />
      ))}

      {loading && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '12px 0', color: '#666' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: '#1a1d27',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
          }}>⚕</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%', background: '#4a6cf7',
                animation: `bounce 1.2s ${i * 0.2}s infinite ease-in-out`
              }} />
            ))}
          </div>
          <span style={{ fontSize: 12 }}>Searching research databases...</span>
        </div>
      )}

      <div ref={bottomRef} />

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}