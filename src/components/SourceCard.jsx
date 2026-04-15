export default function SourceCard({ pub, index }) {
  return (
    <a href={pub.url} target="_blank" rel="noopener noreferrer"
      style={{
        display: 'block',
        background: '#1a1d27',
        border: '1px solid #2a2d3e',
        borderRadius: 10,
        padding: '12px 14px',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 0.2s',
        cursor: 'pointer'
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#4a6cf7'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2d3e'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontSize: 11, color: '#4a6cf7', fontWeight: 600, letterSpacing: 0.5 }}>
          [{index + 1}] {pub.source}
        </span>
        <span style={{ fontSize: 11, color: '#666' }}>{pub.year}</span>
      </div>
      <p style={{ fontSize: 13, fontWeight: 500, color: '#ddd', margin: '6px 0 4px', lineHeight: 1.4 }}>
        {pub.title?.substring(0, 100)}{pub.title?.length > 100 ? '...' : ''}
      </p>
      <p style={{ fontSize: 11, color: '#888', lineHeight: 1.4 }}>
        {pub.abstract?.substring(0, 120)}...
      </p>
      {pub.authors?.length > 0 && (
        <p style={{ fontSize: 11, color: '#555', marginTop: 6 }}>
          {pub.authors.slice(0, 3).join(', ')}{pub.authors.length > 3 ? ' et al.' : ''}
        </p>
      )}
    </a>
  );
}