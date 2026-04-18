import React, { useRef } from 'react';
import PropTypes from 'prop-types';

function InputBar({ onSend, loading }) {
  const textareaRef = useRef(null);

  const handleSend = () => {
    const text = textareaRef.current?.value.trim();
    if (!text || loading) return;
    onSend(text);
    textareaRef.current.value = '';
    textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  return (
    <div className="cl-input-bar">
      <div className="cl-input-wrap">
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Ask about treatments, trials, guidelines…"
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={loading}
        />
      </div>
      <button
        className="cl-send-btn"
        onClick={handleSend}
        disabled={loading}
        aria-label="Send message"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M3 9h12M10 4l5 5-5 5"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

InputBar.propTypes = {
  onSend: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default InputBar;