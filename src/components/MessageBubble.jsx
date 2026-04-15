import ReactMarkdown from 'react-markdown';
import SourceCard from './SourceCard';
import TrialCard from './TrialCard';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 20
    }}>
      <div style={{ maxWidth: isUser ? '65%' : '90%', width: '100%' }}>
        {isUser ? (
          <div style={{
            background: '#4a6cf7',
            borderRadius: '18px 18px 4px 18px',
            padding: '10px 16px',
            fontSize: 14,
            color: '#fff',
            display: 'inline-block',
            float: 'right',
            maxWidth: '100%'
          }}>
            {message.content}
          </div>
        ) : (
          <div>
            {/* AI Response */}
            <div style={{
              background: '#1a1d27',
              border: '1px solid #2a2d3e',
              borderRadius: '4px 18px 18px 18px',
              padding: '16px 20px',
              fontSize: 14,
              lineHeight: 1.7
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{
                  width: 28, height: 28, borderRadius: '50%', background: '#4a6cf7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, flexShrink: 0
                }}>⚕</span>
                <span style={{ fontSize: 12, color: '#4a6cf7', fontWeight: 600 }}>Curalink AI</span>
              </div>
              <div style={{ color: '#ccc' }}>
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => <h2 style={{ fontSize: 15, color: '#fff', margin: '16px 0 8px', fontWeight: 600 }}>{children}</h2>,
                    h3: ({ children }) => <h3 style={{ fontSize: 14, color: '#ddd', margin: '12px 0 6px', fontWeight: 600 }}>{children}</h3>,
                    strong: ({ children }) => <strong style={{ color: '#fff' }}>{children}</strong>,
                    p: ({ children }) => <p style={{ marginBottom: 10, lineHeight: 1.7 }}>{children}</p>,
                    ul: ({ children }) => <ul style={{ paddingLeft: 20, marginBottom: 10 }}>{children}</ul>,
                    li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
                    a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#4a6cf7' }}>{children}</a>
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>

            {/* Sources */}
            {message.sources?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 12, color: '#666', marginBottom: 8, fontWeight: 600, letterSpacing: 0.5 }}>
                  RESEARCH PUBLICATIONS ({message.sources.length})
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
                  {message.sources.map((pub, i) => (
                    <SourceCard key={pub.id || i} pub={pub} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Trials */}
            {message.trials?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 12, color: '#666', marginBottom: 8, fontWeight: 600, letterSpacing: 0.5 }}>
                  CLINICAL TRIALS ({message.trials.length})
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
                  {message.trials.map((trial, i) => (
                    <TrialCard key={trial.id || i} trial={trial} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Meta info */}
            {message.meta && (
              <p style={{ fontSize: 11, color: '#444', marginTop: 10 }}>
                Searched {(message.meta.totalPubmedFetched || 0) + (message.meta.totalOpenAlexFetched || 0)} publications · {message.meta.totalTrialsFetched || 0} trials → ranked to {message.meta.finalPubs} + {message.meta.finalTrials}
              </p>
            )}
          </div>
        )}
        <div style={{ clear: 'both' }} />
      </div>
    </div>
  );
}