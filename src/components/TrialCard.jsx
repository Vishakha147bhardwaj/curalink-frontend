import React from 'react';
import PropTypes from 'prop-types';

const STATUS_COLORS = {
  RECRUITING: '#22c55e',
  ACTIVE_NOT_RECRUITING: '#f59e0b',
  COMPLETED: '#6b7280',
  UNKNOWN: '#6b7280'
};

export default function TrialCard({ trial, index }) {
  const color = STATUS_COLORS[trial.status] || STATUS_COLORS.UNKNOWN;
  return (
    <a href={trial.url} target="_blank" rel="noopener noreferrer"
      style={{
        display: 'block',
        background: '#1a1d27',
        border: '1px solid #2a2d3e',
        borderRadius: 10,
        padding: '12px 14px',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 0.2s'
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2d3e'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>TRIAL {index + 1} · {trial.phase}</span>
        <span style={{
          fontSize: 11, fontWeight: 600, color, background: color + '22',
          padding: '2px 8px', borderRadius: 20
        }}>
          {trial.status?.replace(/_/g, ' ')}
        </span>
      </div>
      <p style={{ fontSize: 13, fontWeight: 500, color: '#ddd', margin: '6px 0 4px', lineHeight: 1.4 }}>
        {trial.title?.substring(0, 100)}{trial.title?.length > 100 ? '...' : ''}
      </p>
      {trial.locations?.[0] && (
        <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
          📍 {trial.locations[0]}
        </p>
      )}
      {trial.contact?.email !== 'Not listed' && (
        <p style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
          ✉ {trial.contact.email}
        </p>
      )}
    </a>
  );
}

TrialCard.propTypes = {
  trial: PropTypes.shape({
    status: PropTypes.string,
    url: PropTypes.string,
    phase: PropTypes.string,
    title: PropTypes.string,
    locations: PropTypes.arrayOf(PropTypes.string),
    contact: PropTypes.shape({
      email: PropTypes.string
    })
  }).isRequired,
  index: PropTypes.number.isRequired
};