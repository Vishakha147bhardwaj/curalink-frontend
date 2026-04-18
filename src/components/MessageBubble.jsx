import React from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';

function PublicationsList({ sources }) {
  if (!sources?.length) return null;
  return (
    <div style={{ borderTop: '1px solid #2a2d3e', marginTop: 16, paddingTop: 14 }}>
      <p style={{ fontSize: 11, color: '#555', marginBottom: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>
        Research Publications ({sources.length})
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sources.map((pub, i) => (
          <a
            key={pub.id || i}
            href={pub.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'block',
              padding: '10px 14px',
              borderRadius: 8,
              background: '#12141f',
              border: '1px solid #2a2d3e',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#4a6cf7'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2d3e'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
                color: '#4a6cf7', background: 'rgba(74,108,247,0.1)',
                padding: '2px 7px', borderRadius: 4
              }}>
                {pub.source}{pub.year ? ` · ${pub.year}` : ''}
              </span>
              <span style={{ color: '#555', fontSize: 12 }}>↗</span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#ddd', margin: '4px 0 3px', lineHeight: 1.4 }}>
              {pub.title}
            </p>
            {pub.authors?.length > 0 && (
              <p style={{ fontSize: 11, color: '#555', margin: 0 }}>
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
  sources: PropTypes.arrayOf(PropTypes.object)
};

function TrialsList({ trials }) {
  if (!trials?.length) return null;
  return (
    <div style={{ borderTop: '1px solid #2a2d3e', marginTop: 16, paddingTop: 14 }}>
      <p style={{ fontSize: 11, color: '#555', marginBottom: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>
        Clinical Trials ({trials.length})
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {trials.map((trial, i) => {
          const isRecruiting = trial.status?.toLowerCase() === 'recruiting';
          return (
            <a
              key={trial.id || i}
              href={trial.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'block',
                padding: '10px 14px',
                borderRadius: 8,
                background: '#12141f',
                border: '1px solid #2a2d3e',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = isRecruiting ? '#22c55e' : '#888'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2d3e'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
                  color: isRecruiting ? '#22c55e' : '#888',
                  background: isRecruiting ? 'rgba(34,197,94,0.1)' : 'rgba(136,136,136,0.1)',
                  padding: '2px 7px', borderRadius: 4
                }}>
                  {trial.status}
                </span>
                <span style={{ color: '#555', fontSize: 12 }}>↗</span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#ddd', margin: '4px 0 3px', lineHeight: 1.4 }}>
                {trial.title}
              </p>
              {trial.summary && (
                <p style={{ fontSize: 11, color: '#666', margin: '0 0 6px', lineHeight: 1.4 }}>
                  {trial.summary}
                </p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {trial.phase && trial.phase !== 'N/A' && (
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#1e2130', color: '#888', border: '1px solid #2a2d3e' }}>
                    {trial.phase}
                  </span>
                )}
                {trial.id && (
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#1e2130', color: '#888', border: '1px solid #2a2d3e' }}>
                    {trial.id}
                  </span>
                )}
                {trial.locations?.[0] && trial.locations[0] !== 'Location not specified' && (
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#1e2130', color: '#888', border: '1px solid #2a2d3e' }}>
                    {trial.locations[0].split(',')[0]}
                  </span>
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
  trials: PropTypes.arrayOf(PropTypes.object)
};

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const hasSources = message.sources?.length > 0;
  const hasTrials = message.trials?.length > 0;

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
          /* Single unified bubble for AI response + sources + trials */
          <div style={{
            background: '#1a1d27',
            border: '1px solid #2a2d3e',
            borderRadius: '4px 18px 18px 18px',
            padding: '16px 20px',
            fontSize: 14,
            lineHeight: 1.7
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{
                width: 28, height: 28, borderRadius: '50%', background: '#4a6cf7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, flexShrink: 0
              }}>⚕</span>
              <span style={{ fontSize: 12, color: '#4a6cf7', fontWeight: 600 }}>Curalink AI</span>
            </div>

            {/* Message text */}
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

            {/* Inline publications + trials — inside the same bubble */}
            {(hasSources || hasTrials) && (
              <>
                <PublicationsList sources={message.sources} />
                <TrialsList trials={message.trials} />
              </>
            )}

            {/* Meta info */}
            {message.meta && (
              <p style={{ fontSize: 11, color: '#444', marginTop: 12, borderTop: '1px solid #2a2d3e', paddingTop: 10 }}>
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

MessageBubble.propTypes = {
  message: PropTypes.shape({
    role: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    sources: PropTypes.arrayOf(PropTypes.object),
    trials: PropTypes.arrayOf(PropTypes.object),
    meta: PropTypes.object
  }).isRequired
};

export default MessageBubble;